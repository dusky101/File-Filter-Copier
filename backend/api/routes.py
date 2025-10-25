"""
API Routes for File Filter Copier
FastAPI endpoints for file scanning, filtering, and copying operations
"""
import os
import json
import sys
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException  # added HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
import fnmatch

# Import core functionality
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from core.filters import filter_files, SIZE_FILTERS  # noqa: F401
from core.file_ops import copy_files_and_log  # noqa: F401
from core.duplicate_checker import detect_duplicates  # noqa: F401
from core.utils import format_size, format_timestamp  # noqa: F401
from features.extension_filter import filter_by_extension  # noqa: F401
from features.hidden_filter import filter_hidden_files  # noqa: F401
from features.preset_manager import (
    list_presets, save_preset, load_preset, delete_preset,
    get_default_preset, set_default_preset, clear_default_preset
)
from .models import PresetResponse, PresetRequest

from api.progress import manager
from api.models import (
    ScanRequest,
    ScanResponse,
    FileResult,
    CopyRequest,
    CopyResponse,
    PresetRequest,
    PresetResponse,
)

router = APIRouter()

# Health (single definition)
@router.get("/health")
def health():
    return JSONResponse({"status": "ok"})

# --- Default preset endpoints (MUST be above /presets/{name}) ---
@router.get("/presets/default", response_model=PresetResponse)
def presets_get_default():
    try:
        return PresetResponse(success=True, default=get_default_preset())
    except Exception as e:
        return PresetResponse(success=False, error=str(e))

@router.post("/presets/default", response_model=PresetResponse)
async def presets_set_default(req: Request):
    try:
        body = await req.json()
        name = (body or {}).get("name")
        if not name:
            raise HTTPException(status_code=400, detail="Missing name")
        set_default_preset(name)
        names = sorted(list(list_presets().keys()))
        return PresetResponse(success=True, default=name, presets=names)
    except HTTPException:
        raise
    except Exception as e:
        return PresetResponse(success=False, error=str(e))

@router.delete("/presets/default", response_model=PresetResponse)
def presets_clear_default():
    try:
        clear_default_preset()
        names = sorted(list(list_presets().keys()))
        return PresetResponse(success=True, default=None, presets=names)
    except Exception as e:
        return PresetResponse(success=False, error=str(e))


# Load default excluded folders from backend/excluded_folders.json (if present)
def _load_default_exclusions() -> set[str]:
    try:
        cfg_path = Path(__file__).resolve().parent.parent / "excluded_folders.json"
        if cfg_path.exists():
            data = json.loads(cfg_path.read_text())
            return {str(x).strip() for x in data if str(x).strip()}
    except Exception:
        pass
    # Fallback hard-coded set
    return {
        "node_modules", ".git", ".hg", ".svn",
        "__pycache__", ".pytest_cache",
        ".venv", "venv", "env",
        "dist", "build", ".next", ".cache", ".turbo",
    }


DEFAULT_EXCLUDED_FOLDERS = _load_default_exclusions()


@router.get("/excluded-folders/defaults")
async def get_default_excluded_folders():
    return {"defaults": sorted(DEFAULT_EXCLUDED_FOLDERS)}


@router.post("/progress/start")
async def start_progress_channel():
    pid = manager.create()
    return {"progress_id": pid}


@router.get("/progress/{pid}/stream")
async def stream_progress(pid: str):
    return StreamingResponse(
        manager.stream(pid),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# Helper to confine results to the selected root and skip links
def _confine_to_root(paths: list[str], root: str, skip_symlinks: bool = True) -> list[str]:
    root_real = os.path.realpath(root)
    prefix = root_real + os.sep
    safe: list[str] = []
    for p in paths:
        try:
            if skip_symlinks and os.path.islink(p):
                continue
            rp = os.path.realpath(p)
            if rp.startswith(prefix):
                safe.append(p)
        except Exception:
            continue
    return safe


def _load_gitignore_patterns(root: str) -> list[str]:
    gi = os.path.join(root, ".gitignore")
    patterns: list[str] = []
    try:
        if os.path.exists(gi):
            with open(gi, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    s = line.strip()
                    if not s or s.startswith("#"):
                        continue
                    patterns.append(s)
    except Exception:
        pass
    return patterns


def _apply_gitignore(root: str, paths: list[str]) -> list[str]:
    pats = _load_gitignore_patterns(root)
    if not pats:
        return paths
    kept: list[str] = []
    for p in paths:
        try:
            rel = os.path.relpath(p, root)
            if any(fnmatch.fnmatch(rel, pat) for pat in pats):
                continue
            kept.append(p)
        except Exception:
            kept.append(p)
    return kept


@router.post("/scan", response_model=ScanResponse)
async def scan_files(request: ScanRequest, http_req: Request):
    """
    Scan a folder and return matching files based on filters.
    If header 'x-progress-id' is provided and deep_scan enabled, SSE updates are published.
    """
    try:
        # Validate folder exists
        if not os.path.exists(request.folder):
            raise HTTPException(status_code=400, detail="Source folder not found")
        if not os.path.isdir(request.folder):
            raise HTTPException(status_code=400, detail="Source path is not a directory")

        # Optional progress channel
        # Use SSE only when client requested and deep scan really runs
        progress_id = http_req.headers.get("x-progress-id")
        use_progress = bool(progress_id and request.deep_scan and request.deep_scan_terms)

        # When estimating totals for progress, also apply default exclusions and skip symlinks
        if use_progress:
            # Candidate pass 1: size/time only
            prelim = filter_files(
                request.folder,
                request.size_filter,
                request.time_filter,
                request.selected_types,  # extension/semantic gating if provided
                deep_scan=False,
                deep_scan_term=None,
                follow_symlinks=request.follow_symlinks,
                include_hidden=request.include_hidden,
                max_depth=request.max_depth,
                name_glob_include=request.name_glob_include,
                name_glob_exclude=request.name_glob_exclude,
                name_regex_include=request.name_regex_include,
                name_regex_exclude=request.name_regex_exclude,
                time_attribute=request.time_attribute,
                deep_scan_max_size_bytes=request.deep_scan_max_size_bytes,
            )
            prelim_paths = [p for p, _ in prelim]

            # Extension filters
            prelim_paths = filter_by_extension(
                prelim_paths,
                include_exts=request.include_exts,
                exclude_exts=request.exclude_exts
            )

            # Hidden/system/excluded folders (+ backend defaults)
            prelim_paths = filter_hidden_files(
                prelim_paths,
                exclude_dotfiles=not request.include_hidden,
                exclude_system=True,
                exclude_hidden_dirs=not request.include_hidden,
                exclude_folders=True,
                excluded_folder_names=set(request.excluded_folders or []) | DEFAULT_EXCLUDED_FOLDERS,
            )
            if request.respect_gitignore:
                prelim_paths = _apply_gitignore(request.folder, prelim_paths)
            prelim_paths = [p for p in prelim_paths if (request.follow_symlinks or not os.path.islink(p)) and os.path.isfile(p)]
            prelim_paths = _confine_to_root(prelim_paths, request.folder, skip_symlinks=not request.follow_symlinks)
            total_files = len(prelim_paths)
            total_bytes = 0
            for p in prelim_paths:
                try:
                    total_bytes += os.path.getsize(p)
                except Exception:
                    pass

            ch = manager.get(progress_id)
            if ch:
                ch.total_files = total_files
                ch.total_bytes = total_bytes
                await ch.emit()

        # Step 1: Apply core filters (with optional progress callback)
        def progress_cb(event: str, path: str, bytes_inc: int):
            # bridge to async manager methods
            if not use_progress:
                return
            # schedule on event loop
            loop = None
            try:
                import asyncio
                loop = asyncio.get_event_loop()
            except Exception:
                pass
            if not loop or loop.is_closed():
                return
            if event == "current":
                loop.create_task(manager.set_current(progress_id, path))
            elif event == "advance":
                loop.create_task(manager.advance(progress_id, bytes_inc))

        raw_files = filter_files(
             request.folder,
             request.size_filter,
             request.time_filter,
             request.selected_types,
             deep_scan=request.deep_scan,
             deep_scan_term=request.deep_scan_terms,
             deep_scan_mode=request.deep_scan_mode,
             progress_callback=progress_cb,
             follow_symlinks=request.follow_symlinks,
             include_hidden=request.include_hidden,
             max_depth=request.max_depth,
             name_glob_include=request.name_glob_include,
             name_glob_exclude=request.name_glob_exclude,
             name_regex_include=request.name_regex_include,
             name_regex_exclude=request.name_regex_exclude,
             time_attribute=request.time_attribute,
             deep_scan_max_size_bytes=request.deep_scan_max_size_bytes,
         )

        # Step 2: Apply extension filters
        filtered_paths = filter_by_extension(
            [f[0] for f in raw_files],
            include_exts=request.include_exts,
            exclude_exts=request.exclude_exts
        )

        # Step 3: Remove hidden/system files and excluded folders (+ backend defaults)
        filtered_paths = filter_hidden_files(
            filtered_paths,
            exclude_dotfiles=not request.include_hidden,
            exclude_system=True,
            exclude_hidden_dirs=not request.include_hidden,
            exclude_folders=True,
            excluded_folder_names=set(request.excluded_folders or []) | DEFAULT_EXCLUDED_FOLDERS,
        )
        if request.respect_gitignore:
            filtered_paths = _apply_gitignore(request.folder, filtered_paths)

        # Skip symlinks/non-regular files and confine to root
        filtered_paths = [p for p in filtered_paths if (request.follow_symlinks or not os.path.islink(p)) and os.path.isfile(p)]
        filtered_paths = _confine_to_root(filtered_paths, request.folder, skip_symlinks=not request.follow_symlinks)

        # Step 4: Map semantic types back to filtered paths
        # Maps from filter (path -> (semantic_type, tags))
        semantic_map = {p: s for (p, s, _tags) in raw_files}
        tags_map = {p: list(_tags or []) for (p, _s, _tags) in raw_files}

        # Add 'Extension' reason when include_exts was provided
        include_exts_norm = {(e or "").lower() for e in (request.include_exts or [])}
        if include_exts_norm:
            for p in filtered_paths:
                try:
                    ext = os.path.splitext(p)[1].lower()
                    if ext in include_exts_norm:
                        tags_map.setdefault(p, []).append("Extension")
                except Exception:
                    pass

        # Step 5: Build file results with metadata
        file_results = []
        for path in filtered_paths:
            try:
                name = os.path.basename(path)
                size = os.path.getsize(path)
                size_fmt = format_size(size)
                modified = format_timestamp(os.path.getmtime(path))
                created = format_timestamp(os.path.getctime(path))
                sem = semantic_map.get(path)
                tags = tags_map.get(path, [])
                file_results.append(FileResult(
                    path=path, name=name, size=size, size_formatted=size_fmt,
                    modified=modified, created=created, semantic_type=sem or "Unclassified",
                    search_tags=tags
                ))
            except Exception:
                continue

        # Step 6: Detect duplicates
        duplicates, _ = detect_duplicates(filtered_paths)

        # Finish progress channel if used
        if use_progress:
            await manager.finish(progress_id)

        return ScanResponse(
            success=True,
            total_files=len(file_results),
            files=file_results,
            duplicates=duplicates
        )

    except HTTPException:
        # Finish channel on error
        if 'progress_id' in locals() and http_req.headers.get("x-progress-id"):
            await manager.finish(http_req.headers.get("x-progress-id"))
        raise
    except Exception as e:
        if 'progress_id' in locals() and http_req.headers.get("x-progress-id"):
            await manager.finish(http_req.headers.get("x-progress-id"))
        return ScanResponse(
            success=False,
            total_files=0,
            files=[],
            duplicates={},
            error=str(e)
        )

@router.get("/folders")
async def list_folders(path: str):
    """
    List all subdirectories in the given path (non-recursive, one level only).
    
    Args:
        path: Source folder path to scan for subdirectories
        
    Returns:
        List of folder names (not full paths, just names)
        
    Example:
        GET /api/folders?path=/Users/marc/Documents
        Returns: {
            "success": true,
            "path": "/Users/marc/Documents",
            "folders": ["Projects", "Images", "Archive", ...],
            "count": 15
        }
    """
    try:
        # Validate path exists
        source_path = Path(path)
        if not source_path.exists():
            raise HTTPException(status_code=404, detail=f"Path not found: {path}")
        
        if not source_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {path}")
        
        # Get all subdirectories (one level only)
        folders = []
        try:
            for item in source_path.iterdir():
                if item.is_dir():
                    # Only add the folder name, not the full path
                    folder_name = item.name
                    # Skip hidden folders (starting with .)
                    if not folder_name.startswith('.'):
                        folders.append(folder_name)
        except PermissionError:
            raise HTTPException(status_code=403, detail=f"Permission denied: {path}")
        
        # Sort alphabetically for better UX
        folders.sort()
        
        return {
            "success": True,
            "path": str(source_path),
            "folders": folders,
            "count": len(folders)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list folders: {str(e)}")



@router.post("/copy", response_model=CopyResponse)
async def copy_files(request: CopyRequest):
    """
    Copy filtered files to a destination folder.
    
    This endpoint performs the actual file copy operation, creating the output
    folder and generating a log file with the operation details.
    """
    try:
        # Validate destination directory exists
        if not os.path.exists(request.destination):
            raise HTTPException(status_code=404, detail=f"Destination not found: {request.destination}")

        # FIXED: Create output folder with CUSTOM NAME from request
        # This was the bug - it wasn't using request.output_folder
        output_path = os.path.join(request.destination, request.output_folder)
        os.makedirs(output_path, exist_ok=True)

        # Prepare file tuples (path, semantic_type)
        # For now, we don't have semantic types in the copy request, so we'll use None
        file_tuples = [(path, None) for path in request.files]

        # Perform copy operation
        log_file_path = copy_files_and_log(file_tuples, output_path)

        return CopyResponse(
            success=True,
            copied_count=len(request.files),
            output_path=output_path,
            log_file=log_file_path
        )

    except HTTPException:
        raise
    except Exception as e:
        return CopyResponse(
            success=False,
            copied_count=0,
            output_path="",
            log_file=None,
            error=str(e)
        )


@router.post("/presets/save", response_model=PresetResponse)
async def save_filter_preset(request: PresetRequest):
    try:
        save_preset(request.name, request.config)
        names = sorted(list(list_presets().keys()))
        return PresetResponse(success=True, presets=names)
    except Exception as e:
        return PresetResponse(success=False, error=str(e))

@router.get("/presets/list", response_model=PresetResponse)
async def list_filter_presets():
    try:
        names = sorted(list(list_presets().keys()))
        return PresetResponse(success=True, presets=names)
    except Exception as e:
        return PresetResponse(success=False, error=str(e))


# keep these BELOW the block above
@router.get("/presets/{name}", response_model=PresetResponse)
async def load_filter_preset(name: str):
    """
    Load a specific filter preset by name.
    """
    try:
        config = load_preset(name)
        
        if config is None:
            raise HTTPException(status_code=404, detail=f"Preset not found: {name}")
        
        return PresetResponse(
            success=True,
            config=config
        )

    except HTTPException:
        raise
    except Exception as e:
        return PresetResponse(
            success=False,
            error=str(e)
        )


@router.delete("/presets/{name}", response_model=PresetResponse)
async def delete_filter_preset(name: str):
    try:
        delete_preset(name)
        names = sorted(list(list_presets().keys()))
        return PresetResponse(success=True, presets=names)
    except Exception as e:
        return PresetResponse(success=False, error=str(e))


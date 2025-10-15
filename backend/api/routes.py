"""
API Routes for File Filter Copier
FastAPI endpoints for file scanning, filtering, and copying operations
"""

import os
import sys
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

# Import core functionality
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from core.filters import filter_files, SIZE_FILTERS  # expose SIZE_FILTERS for estimation
from core.file_ops import copy_files_and_log
from core.duplicate_checker import detect_duplicates
from core.utils import format_size, format_timestamp
from features.extension_filter import filter_by_extension
from features.hidden_filter import filter_hidden_files
from api.progress import manager  # new
from features.preset_manager import save_preset, load_preset, list_presets, delete_preset


from api.models import (
    ScanRequest, 
    ScanResponse, 
    FileResult,
    CopyRequest, 
    CopyResponse,
    PresetRequest,
    PresetResponse
)

router = APIRouter()

@router.post("/progress/start")
async def start_progress_channel():
    """
    Create a progress channel before starting a deep scan.
    Frontend will receive a progress_id to subscribe via SSE.
    """
    # initialize empty; will be set by /scan when it estimates
    pid = manager.create(total_files=0, total_bytes=0)
    return {"progress_id": pid}

@router.get("/progress/{pid}/stream")
async def stream_progress(pid: str):
    """
    Server-Sent Events stream of deep-scan progress updates.
    """
    return StreamingResponse(manager.stream(pid), media_type="text/event-stream")

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
        progress_id = http_req.headers.get("x-progress-id")
        use_progress = bool(progress_id and request.deep_scan and request.deep_scan_terms)

        # If progress requested, estimate candidate files for deep scan and set totals
        # We reuse filter_files without deep scan to get candidate list, then apply ext+hidden filters.
        if use_progress:
            # Candidate pass 1: size/time only
            prelim = filter_files(
                request.folder,
                request.size_filter,
                request.time_filter,
                request.selected_types,  # extension/semantic gating if provided
                deep_scan=False,
                deep_scan_term=None
            )
            prelim_paths = [p for p, _ in prelim]

            # Extension filters
            prelim_paths = filter_by_extension(
                prelim_paths,
                include_exts=request.include_exts,
                exclude_exts=request.exclude_exts
            )

            # Hidden/system/excluded folders
            prelim_paths = filter_hidden_files(
                prelim_paths,
                exclude_dotfiles=True,
                exclude_system=True,
                exclude_hidden_dirs=True,
                exclude_folders=True,
                excluded_folder_names=set(request.excluded_folders or [])
            )

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
            progress_callback=progress_cb
        )

        # Step 2: Apply extension filters
        filtered_paths = filter_by_extension(
            [f[0] for f in raw_files],
            include_exts=request.include_exts,
            exclude_exts=request.exclude_exts
        )

        # Step 3: Remove hidden/system files and excluded folders
        filtered_paths = filter_hidden_files(
            filtered_paths,
            exclude_dotfiles=True,
            exclude_system=True,
            exclude_hidden_dirs=True,
            exclude_folders=True,
            excluded_folder_names=set(request.excluded_folders or [])
        )

        # Step 4: Map semantic types back to filtered paths
        semantic_map = {path: sem for path, sem in raw_files}

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
                file_results.append(FileResult(
                    path=path, name=name, size=size, size_formatted=size_fmt,
                    modified=modified, created=created, semantic_type=sem
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
    """
    Save a filter configuration as a preset for later reuse.
    """
    try:
        save_preset(request.name, request.config)
        
        return PresetResponse(
            success=True,
            presets=list_presets()
        )

    except Exception as e:
        return PresetResponse(
            success=False,
            error=str(e)
        )


@router.get("/presets/list", response_model=PresetResponse)
async def list_filter_presets():
    """
    Get a list of all saved filter presets.
    """
    try:
        presets = list_presets()
        
        return PresetResponse(
            success=True,
            presets=presets
        )

    except Exception as e:
        return PresetResponse(
            success=False,
            error=str(e)
        )


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
    """
    Delete a saved filter preset.
    """
    try:
        delete_preset(name)
        
        return PresetResponse(
            success=True,
            presets=list_presets()
        )

    except Exception as e:
        return PresetResponse(
            success=False,
            error=str(e)
        )


@router.get("/health")
async def health_check():
    """
    Simple health check endpoint to verify the API is running.
    """
    return {"status": "healthy", "message": "File Filter Copier API is running"}
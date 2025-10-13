"""
API Routes for File Filter Copier
FastAPI endpoints for file scanning, filtering, and copying operations
"""

import os
from typing import List
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

# Import core functionality
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from core.filters import filter_files
from core.file_ops import copy_files_and_log
from core.duplicate_checker import detect_duplicates
from core.utils import format_size, format_timestamp
from features.extension_filter import filter_by_extension
from features.hidden_filter import filter_hidden_files
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


@router.post("/scan", response_model=ScanResponse)
async def scan_files(request: ScanRequest):
    """
    Scan a folder and return matching files based on filters.
    
    This endpoint performs the same filtering logic as the original Python app's
    preview functionality, including size, time, semantic type, and deep scan filters.
    """
    try:
        # Validate folder exists
        if not os.path.exists(request.folder):
            raise HTTPException(status_code=404, detail=f"Folder not found: {request.folder}")
        
        if not os.path.isdir(request.folder):
            raise HTTPException(status_code=400, detail=f"Path is not a directory: {request.folder}")

        # Step 1: Apply core filters
        raw_files = filter_files(
            request.folder,
            request.size_filter,
            request.time_filter,
            request.selected_types,
            deep_scan=request.deep_scan,
            deep_scan_term=request.deep_scan_terms,
            deep_scan_mode=request.deep_scan_mode
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
            excluded_folder_names=set(request.excluded_folders)
        )

        # Step 4: Map semantic types back to filtered paths
        semantic_map = {path: sem for path, sem in raw_files}
        
        # Step 5: Build file results with metadata
        file_results = []
        for path in filtered_paths:
            try:
                stats = os.stat(path)
                file_results.append(FileResult(
                    path=path,
                    name=os.path.basename(path),
                    size=stats.st_size,
                    size_formatted=format_size(stats.st_size),
                    modified=format_timestamp(stats.st_mtime),
                    created=format_timestamp(stats.st_ctime),
                    semantic_type=semantic_map.get(path)
                ))
            except Exception as e:
                print(f"Warning: Could not get stats for {path}: {e}")
                continue

        # Step 6: Detect duplicates
        duplicates, _ = detect_duplicates(filtered_paths)

        return ScanResponse(
            success=True,
            total_files=len(file_results),
            files=file_results,
            duplicates=duplicates
        )

    except HTTPException:
        raise
    except Exception as e:
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

        # Create output folder
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
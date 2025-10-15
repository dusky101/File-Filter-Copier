"""
API Models for File Filter Copier
Pydantic models for request and response validation
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ScanRequest(BaseModel):
    """Request model for scanning files with filters"""
    folder: str = Field(..., description="Source folder path to scan")
    size_filter: str = Field(default=">1KB", description="Size filter (>1KB, <1KB, >500MB, all)")
    time_filter: str = Field(default="all", description="Time filter (<1h, <24h, <7d, <30d, >30d, all)")
    selected_types: List[str] = Field(default=[], description="List of semantic file types to include")
    deep_scan: bool = Field(default=False, description="Enable deep content scanning")
    deep_scan_terms: List[str] = Field(default=[], description="Keywords to search for in deep scan")
    deep_scan_mode: str = Field(default="OR", description="Match mode: OR or AND")
    include_exts: Optional[List[str]] = Field(default=None, description="Extensions to include (e.g., ['.py', '.js'])")
    exclude_exts: Optional[List[str]] = Field(default=None, description="Extensions to exclude")
    excluded_folders: List[str] = Field(default=[], description="Folder names to exclude")

    class Config:
        json_schema_extra = {
            "example": {
                "folder": "/Users/marc/Documents",
                "size_filter": ">1KB",
                "time_filter": "<7d",
                "selected_types": ["Python", "JavaScript"],
                "deep_scan": False,
                "deep_scan_terms": [],
                "deep_scan_mode": "OR",
                "include_exts": [".py", ".js"],
                "exclude_exts": [".log"],
                "excluded_folders": ["node_modules", "__pycache__"]
            }
        }


class FileResult(BaseModel):
    """Model for a single file result"""
    path: str = Field(..., description="Full file path")
    name: str = Field(..., description="File name")
    size: int = Field(..., description="File size in bytes")
    size_formatted: str = Field(..., description="Human-readable file size")
    modified: str = Field(..., description="Last modified timestamp")
    created: str = Field(..., description="Creation timestamp")
    semantic_type: Optional[str] = Field(None, description="Semantic file type classification")


class ScanResponse(BaseModel):
    """Response model for scan operation"""
    success: bool = Field(..., description="Whether the scan was successful")
    total_files: int = Field(..., description="Total number of files found")
    files: List[FileResult] = Field(..., description="List of matching files")
    duplicates: Dict[str, List[str]] = Field(default={}, description="Duplicate filenames detected")
    error: Optional[str] = Field(None, description="Error message if scan failed")


class CopyRequest(BaseModel):
    """Request model for copying files"""
    files: List[str] = Field(..., description="List of file paths to copy")
    output_folder: str = Field(..., description="Output folder name")
    destination: str = Field(..., description="Destination parent directory")

    class Config:
        json_schema_extra = {
            "example": {
                "files": ["/Users/marc/Documents/file1.py", "/Users/marc/Documents/file2.js"],
                "output_folder": "FilteredFiles",
                "destination": "/Users/marc/Downloads"
            }
        }


class CopyResponse(BaseModel):
    """Response model for copy operation"""
    success: bool = Field(..., description="Whether the copy was successful")
    copied_count: int = Field(..., description="Number of files successfully copied")
    output_path: str = Field(..., description="Full path to output folder")
    log_file: Optional[str] = Field(None, description="Path to log file")
    error: Optional[str] = Field(None, description="Error message if copy failed")


class PresetRequest(BaseModel):
    """Request model for saving a preset"""
    name: str = Field(..., description="Preset name")
    config: Dict[str, Any] = Field(..., description="Filter configuration to save")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "PythonFilesLast7Days",
                "config": {
                    "size_filter": ">1KB",
                    "time_filter": "<7d",
                    "selected_types": ["Python"],
                    "deep_scan": False
                }
            }
        }


class PresetResponse(BaseModel):
    """Response model for preset operations"""
    success: bool = Field(..., description="Whether the operation was successful")
    presets: Optional[List[str]] = Field(None, description="List of available preset names")
    config: Optional[Dict[str, Any]] = Field(None, description="Preset configuration")
    error: Optional[str] = Field(None, description="Error message if operation failed")
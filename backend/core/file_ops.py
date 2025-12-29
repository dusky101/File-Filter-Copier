import os
import shutil
import logging
from datetime import datetime
from .utils import format_size, format_timestamp, safe_filename, ensure_unique_path
from .file_types import get_file_category

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def copy_files(file_paths, destination, output_folder, structure="flat", source_folder=None):
    """
    Copies files to the destination folder with optional structural organization.
    Generates a log file of the operation.
    
    Args:
        file_paths (list): List of absolute source file paths.
        destination (str): The root destination directory.
        output_folder (str): The name of the specific output folder.
        structure (str): 'flat', 'date', 'type', or 'preserve'.
        source_folder (str): The original source root (required for 'preserve').
    """
    copied_count = 0
    log_lines = []
    errors = []
    
    # Create the base output directory
    base_target_dir = os.path.join(destination, output_folder)
    
    # Ensure base target exists
    try:
        os.makedirs(base_target_dir, exist_ok=True)
    except OSError as e:
        return {"success": False, "error": f"Failed to create output directory: {str(e)}"}

    for src_path in file_paths:
        try:
            if not os.path.isfile(src_path):
                continue
                
            filename = os.path.basename(src_path)
            
            # --- Determine Subfolder Logic ---
            subfolder = ""
            
            if structure == "date":
                # Organize by Year/Month based on Modified Time
                try:
                    mtime = os.path.getmtime(src_path)
                    dt = datetime.fromtimestamp(mtime)
                    subfolder = os.path.join(str(dt.year), f"{dt.month:02d}")
                except Exception:
                    subfolder = "Unknown_Date"
                    
            elif structure == "type":
                # Organize by Semantic Type (Images, Code, etc.)
                cat = get_file_category(filename)
                subfolder = cat if cat else "Other"
                
            elif structure == "preserve" and source_folder:
                # Recreate the relative path structure
                try:
                    # relpath calculates path relative to source_folder
                    rel_path = os.path.relpath(os.path.dirname(src_path), source_folder)
                    # Prevent '..' escaping or absolute path issues
                    if not rel_path.startswith("..") and not os.path.isabs(rel_path):
                        subfolder = rel_path
                except ValueError:
                    pass # source_folder might not be a parent, fallback to flat
            
            # --- Final Path Construction ---
            target_dir = os.path.join(base_target_dir, subfolder)
            os.makedirs(target_dir, exist_ok=True)
            
            # Safe filename and unique path handling
            safe_name = safe_filename(filename)
            dest_path = os.path.join(target_dir, safe_name)
            dest_path = ensure_unique_path(dest_path)
            
            # Copy
            shutil.copy2(src_path, dest_path)
            
            # Metadata for log
            size_fmt = format_size(os.path.getsize(src_path))
            time_fmt = format_timestamp(os.path.getmtime(src_path))
            
            log_lines.append(f"{safe_name}  <-  {src_path}  [{size_fmt}, {time_fmt}]")
            copied_count += 1
            
        except Exception as e:
            err_msg = f"Error copying {src_path}: {str(e)}"
            logger.error(err_msg)
            errors.append(err_msg)
            log_lines.append(f"⚠️ {err_msg}")

    # --- Write Log File ---
    log_file_path = os.path.join(base_target_dir, "copy_summary.txt")
    try:
        with open(log_file_path, "w", encoding="utf-8") as f:
            f.write(f"✅ COPY REPORT\n")
            f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total Copied: {copied_count}\n")
            f.write(f"Structure Mode: {structure}\n")
            f.write("-" * 40 + "\n")
            for line in log_lines:
                f.write(line + "\n")
    except Exception as e:
        logger.error(f"Failed to write log file: {e}")

    return {
        "success": True, 
        "data": {
            "copied_count": copied_count, 
            "output_path": base_target_dir,
            "log_file": log_file_path,
            "errors": errors
        }
    }
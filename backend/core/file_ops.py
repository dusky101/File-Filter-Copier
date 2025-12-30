import os
import shutil
import logging
from datetime import datetime
from .utils import format_size, format_timestamp, safe_filename, ensure_unique_path
from .file_types import get_file_category
# --- NEW IMPORT: Essential for Date-Based Sorting ---
from .exif_utils import get_metadata
# ----------------------------------------------------

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
            
            # --- Determine Subfolder Based on Structure ---
            subfolder = ""
            
            if structure == "date":
                # Try to get metadata first (for Photo Mode accuracy)
                try:
                    meta = get_metadata(src_path)
                    date_str = meta.get("date_taken")
                    
                    if date_str:
                        # Parse various EXIF date formats
                        # Standard EXIF: "YYYY:MM:DD HH:MM:SS" or "YYYY-MM-DD ..."
                        clean_date = date_str.replace(":", "-").replace("/", "-")[:10]
                        # Expecting YYYY-MM-DD now
                        dt = datetime.strptime(clean_date, "%Y-%m-%d")
                    else:
                        # Fallback to file modification time
                        ts = os.path.getmtime(src_path)
                        dt = datetime.fromtimestamp(ts)
                    
                    year = dt.strftime("%Y")
                    month = dt.strftime("%m")
                    subfolder = os.path.join(year, month)
                except Exception:
                    # Ultimate fallback
                    subfolder = "Unknown_Date"

            elif structure == "type":
                category = get_file_category(filename)
                subfolder = category if category else "Other"
                
            elif structure == "preserve" and source_folder:
                # Calculate relative path
                try:
                    rel_path = os.path.relpath(os.path.dirname(src_path), source_folder)
                    if rel_path == ".":
                        subfolder = ""
                    else:
                        subfolder = rel_path
                except ValueError:
                    # Path is not inside source_folder (e.g. symlink or external)
                    subfolder = "External"
            
            # Construct final destination path
            target_dir = os.path.join(base_target_dir, subfolder)
            os.makedirs(target_dir, exist_ok=True)
            
            dest_path = os.path.join(target_dir, safe_name(filename))
            dest_path = ensure_unique_path(dest_path)
            
            # Copy
            shutil.copy2(src_path, dest_path)
            
            # Metadata for log
            size_fmt = format_size(os.path.getsize(src_path))
            time_fmt = format_timestamp(os.path.getmtime(src_path))
            
            log_lines.append(f"{safe_name(filename)}  <-  {src_path}  [{size_fmt}, {time_fmt}]")
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
    except Exception:
        pass

    return {
        "success": True, 
        "data": {
            "copied_count": copied_count,
            "output_path": base_target_dir,
            "log_file": log_file_path
        }
    }

# Helper wrapper for utils.safe_filename to avoid circular import issues if any
def safe_name(name):
    return safe_filename(name)
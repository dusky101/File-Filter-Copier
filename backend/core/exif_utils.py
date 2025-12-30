import os
import logging
from PIL import Image, ExifTags
from tinytag import TinyTag
from datetime import datetime

# --- NEW: Import and register HEIC opener ---
try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass
# --------------------------------------------

logger = logging.getLogger(__name__)

# Common EXIF Tag IDs
TAG_MAKE = 271
TAG_MODEL = 272
TAG_DATETIME_ORIGINAL = 36867
TAG_DATETIME_DIGITIZED = 36868
TAG_OFFSET_TIME = 36880
TAG_EXPOSURE_TIME = 33434
TAG_F_NUMBER = 33437
TAG_ISO = 34855
TAG_LENS_MODEL = 42036

# Supported Image Extensions
# Pillow + pillow-heif now handles HEIC/AVIF robustly
IMAGE_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp',
    '.heic', '.heif', '.avif',
    '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.raf'
}

VIDEO_EXTENSIONS = {
    '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.m4a', '.mpg', '.mpeg', '.3gp'
}

def get_metadata(file_path: str) -> dict:
    """
    Extracts metadata using Pillow (with HEIF support) and TinyTag.
    """
    data = {
        "width": None,
        "height": None,
        "make": None,
        "model": None,
        "date_taken": None,
        "iso": None,
        "aperture": None,
        "shutter_speed": None,
        "lens": None,
        "duration": None,
        "type": "file"
    }

    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        # --- IMAGE PROCESSING ---
        if ext in IMAGE_EXTENSIONS:
            data["type"] = "image"
            try:
                # Pillow will now auto-detect HEIC thanks to register_heif_opener()
                with Image.open(file_path) as img:
                    data["width"], data["height"] = img.size
                    
                    # Get EXIF data
                    exif = img.getexif()
                    
                    if exif:
                        # 1. Camera Make/Model
                        if TAG_MAKE in exif: data["make"] = str(exif[TAG_MAKE])
                        if TAG_MODEL in exif: data["model"] = str(exif[TAG_MODEL])
                        
                        # 2. Date Taken (Try Original -> Digitized -> File Modification)
                        # This is the specific fix for your HEIC files
                        date_str = exif.get(TAG_DATETIME_ORIGINAL) or \
                                   exif.get(TAG_DATETIME_DIGITIZED) or \
                                   exif.get(306) # DateTime
                        
                        if date_str:
                            data["date_taken"] = str(date_str)

                        # 3. Technical Stats (ISO, Aperture, Shutter)
                        if TAG_ISO in exif: 
                            data["iso"] = str(exif[TAG_ISO])
                        
                        if TAG_F_NUMBER in exif:
                            val = exif[TAG_F_NUMBER]
                            if isinstance(val, float):
                                data["aperture"] = f"f/{val:.1f}"
                            elif hasattr(val, 'numerator') and val.denominator != 0:
                                data["aperture"] = f"f/{val.numerator/val.denominator:.1f}"
                        
                        if TAG_EXPOSURE_TIME in exif:
                            val = exif[TAG_EXPOSURE_TIME]
                            if isinstance(val, float) and val > 0:
                                data["shutter_speed"] = f"1/{int(1/val)}s"
                            elif hasattr(val, 'numerator') and val.numerator != 0:
                                data["shutter_speed"] = f"{val.numerator}/{val.denominator}s"

                        if TAG_LENS_MODEL in exif:
                            data["lens"] = str(exif[TAG_LENS_MODEL])

            except Exception as e:
                logger.debug(f"Pillow metadata error for {file_path}: {e}")

        # --- VIDEO PROCESSING ---
        elif ext in VIDEO_EXTENSIONS:
             data["type"] = "video" if ext not in ['.mp3', '.wav', '.m4a'] else "audio"
             try:
                 tag = TinyTag.get(file_path)
                 data["duration"] = round(tag.duration, 1) if tag.duration else None
                 data["width"] = tag.width
                 data["height"] = tag.height
                 if tag.year:
                     data["date_taken"] = str(tag.year)
             except Exception as e:
                 logger.debug(f"TinyTag error for {file_path}: {e}")

        # --- FALLBACK: FILE SYSTEM DATE ---
        # If EXIF failed completely, use the file modification time.
        # This prevents files from landing in "Other" when they have a valid system date.
        if not data["date_taken"]:
            try:
                ts = os.path.getmtime(file_path)
                dt = datetime.fromtimestamp(ts)
                # Format: YYYY:MM:DD HH:MM:SS (Standard EXIF format)
                data["date_taken"] = dt.strftime("%Y:%m:%d %H:%M:%S")
            except Exception:
                pass

    except Exception as outer_e:
        logger.warning(f"Metadata extraction failed for {file_path}: {outer_e}")

    return data
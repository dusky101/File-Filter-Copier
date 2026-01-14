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

# --- NEW: Import Reverse Geocoder ---
try:
    import reverse_geocoder as rg
except ImportError:
    rg = None
# ------------------------------------

logger = logging.getLogger(__name__)

# --- Tag IDs ---
# Main IFD Tags
TAG_MAKE = 271
TAG_MODEL = 272
TAG_DATETIME_ORIGINAL = 36867
TAG_DATETIME_DIGITIZED = 36868
TAG_EXIF_OFFSET = 34665 
TAG_GPS_INFO = 34853  # <--- GPS Tag

# Sub-IFD Tags (Inside 34665)
SUB_EXPOSURE_TIME = 33434
SUB_F_NUMBER = 33437
SUB_ISO = 34855
SUB_LENS_MODEL = 42036
SUB_DATETIME_ORIGINAL = 36867 

# Supported Image Extensions
IMAGE_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.bmp',
    '.heic', '.heif', '.avif',
    '.cr2', '.cr3', '.nef', '.arw', '.dng', '.orf', '.rw2', '.pef', '.raf'
}

VIDEO_EXTENSIONS = {
    '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.m4a', '.mpg', '.mpeg', '.3gp'
}

def _convert_to_degrees(value):
    """
    Helper to convert GPS coordinates to degrees
    """
    d = value[0]
    m = value[1]
    s = value[2]
    return d + (m / 60.0) + (s / 3600.0)

def get_location_name(lat, lon):
    """
    Uses reverse_geocoder to get 'City, Country' from coords.
    """
    if not rg:
        return f"{lat:.2f}, {lon:.2f}"
    try:
        # rg.search returns a list of dicts
        # mode=1 means single threaded search (safer for some contexts)
        results = rg.search((lat, lon), mode=1)
        if results:
            city = results[0].get('name', '')
            cc = results[0].get('cc', '') # Country Code
            if city and cc:
                return f"{city}, {cc}"
            return city or cc or f"{lat:.2f}, {lon:.2f}"
    except Exception as e:
        logger.debug(f"Reverse geocode failed: {e}")
    return f"{lat:.2f}, {lon:.2f}"

def get_metadata(file_path: str) -> dict:
    """
    Extracts metadata using Pillow (digging into Sub-IFDs & GPS) and TinyTag.
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
        "dimensions": None,
        "location": None,
        "duration": None,
        "type": "file"
    }

    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        # --- IMAGE PROCESSING ---
        if ext in IMAGE_EXTENSIONS:
            data["type"] = "image"
            try:
                with Image.open(file_path) as img:
                    # Dimensions
                    w, h = img.size
                    data["width"] = w
                    data["height"] = h
                    data["dimensions"] = f"{w} x {h}"
                    
                    # 1. Get Main EXIF (IFD0)
                    exif = img.getexif()
                    
                    if exif:
                        # Basic Info from Main Block
                        if TAG_MAKE in exif: data["make"] = str(exif[TAG_MAKE])
                        if TAG_MODEL in exif: data["model"] = str(exif[TAG_MODEL])
                        
                        # Date extraction logic
                        date_str = exif.get(TAG_DATETIME_ORIGINAL) or \
                                   exif.get(TAG_DATETIME_DIGITIZED) or \
                                   exif.get(306) # DateTime

                        # 2. DIG DEEPER: Access the Exif Sub-IFD
                        sub_exif = {}
                        if TAG_EXIF_OFFSET in exif:
                            try:
                                sub_exif = exif.get_ifd(TAG_EXIF_OFFSET)
                            except Exception:
                                pass 

                        if sub_exif:
                            # Lens
                            if SUB_LENS_MODEL in sub_exif:
                                data["lens"] = str(sub_exif[SUB_LENS_MODEL])
                            
                            # ISO
                            if SUB_ISO in sub_exif:
                                data["iso"] = str(sub_exif[SUB_ISO])
                            
                            # Aperture
                            if SUB_F_NUMBER in sub_exif:
                                val = sub_exif[SUB_F_NUMBER]
                                if isinstance(val, float):
                                    data["aperture"] = f"f/{val:.1f}"
                                elif hasattr(val, 'numerator') and val.denominator != 0:
                                    data["aperture"] = f"f/{val.numerator/val.denominator:.1f}"
                            
                            # Shutter
                            if SUB_EXPOSURE_TIME in sub_exif:
                                val = sub_exif[SUB_EXPOSURE_TIME]
                                if isinstance(val, float) and val > 0:
                                    data["shutter_speed"] = f"1/{int(1/val)}s"
                                elif hasattr(val, 'numerator') and val.numerator != 0:
                                    data["shutter_speed"] = f"{val.numerator}/{val.denominator}s"
                            
                            # Date might be here if missing from Main
                            if not date_str:
                                date_str = sub_exif.get(SUB_DATETIME_ORIGINAL)

                        # --- GPS Extraction ---
                        gps_info = None
                        if TAG_GPS_INFO in exif:
                            try:
                                gps_info = exif.get_ifd(TAG_GPS_INFO)
                            except Exception:
                                pass
                        
                        if gps_info:
                            try:
                                gps_lat = gps_info.get(2)
                                gps_lat_ref = gps_info.get(1)
                                gps_lon = gps_info.get(4)
                                gps_lon_ref = gps_info.get(3)
                                
                                if gps_lat and gps_lat_ref and gps_lon and gps_lon_ref:
                                    lat = _convert_to_degrees(gps_lat)
                                    if gps_lat_ref != "N": lat = -lat
                                    
                                    lon = _convert_to_degrees(gps_lon)
                                    if gps_lon_ref != "E": lon = -lon
                                    
                                    # Convert coords to City, Country
                                    data["location"] = get_location_name(lat, lon)
                            except Exception as e:
                                logger.debug(f"GPS processing failed: {e}")

                        if date_str:
                            data["date_taken"] = str(date_str)

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
                 if tag.width and tag.height:
                     data["dimensions"] = f"{tag.width} x {tag.height}"
                 if tag.year:
                     data["date_taken"] = str(tag.year)
             except Exception as e:
                 logger.debug(f"TinyTag error for {file_path}: {e}")

        # --- FALLBACK ---
        if not data["date_taken"]:
            try:
                ts = os.path.getmtime(file_path)
                dt = datetime.fromtimestamp(ts)
                data["date_taken"] = dt.strftime("%Y:%m:%d %H:%M:%S")
            except Exception:
                pass

    except Exception as outer_e:
        logger.warning(f"Metadata extraction failed for {file_path}: {outer_e}")

    return data
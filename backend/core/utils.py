# utils.py

import os
import re
from datetime import datetime

def format_size(bytes_size):
    """Convert bytes to human-readable format, supporting up to petabytes."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB', 'PB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} EB"

def format_timestamp(timestamp):
    """Convert epoch time to readable string. Returns fallback if invalid."""
    try:
        dt = datetime.fromtimestamp(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except Exception:
        return "Invalid timestamp"

def safe_filename(name):
    """Sanitise filename to avoid illegal characters. Preserves Unicode and + symbol."""
    return re.sub(r'[^\w\s.\-+]', '_', name, flags=re.UNICODE)

def ensure_unique_path(path, suffix="_{n}"):
    """
    Append a counter to filename if it already exists.
    Example: 'file.txt' â†’ 'file_1.txt', 'file_2.txt', etc.
    """
    base, ext = os.path.splitext(path)
    counter = 1
    while os.path.exists(path):
        path = f"{base}{suffix.format(n=counter)}{ext}"
        counter += 1
    return path
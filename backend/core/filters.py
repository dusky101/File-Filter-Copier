# filters.py

import os
import time
from core.file_types import FILE_TYPE_PATTERNS, CONTENT_MARKERS
from typing import Callable, Optional

# Size constants for cleaner code
KB = 1024
MB = 1024 * KB
GB = 1024 * MB

# Size filter mappings
SIZE_FILTERS = {
    'all': (0, float('inf')),           # No size limit
    'small': (0, 1 * MB),               # < 1 MB
    'medium': (1 * MB, 10 * MB),        # 1 MB - 10 MB
    'large': (10 * MB, 100 * MB),       # 10 MB - 100 MB
    'huge': (100 * MB, float('inf')),   # > 100 MB
    # Legacy filters for backward compatibility
    '>1KB': (1 * KB, float('inf')),
    '<1KB': (0, 1 * KB),
    '>500MB': (500 * MB, float('inf'))
}


def filter_files(source_folder, size_filter, time_filter, semantic_types,
                 deep_scan=False, deep_scan_term=None, deep_scan_mode="OR",
                 progress_callback: Optional[Callable[[str, str, int], None]] = None):
    """
    Traverse a folder and return files matching filters.
    progress_callback(event, path, bytes_inc): events 'current' | 'advance'
    """
    matching_files = []
    now = time.time()

    # Parse size filter
    min_size, max_size = SIZE_FILTERS.get(size_filter, SIZE_FILTERS['all'])

    # Time filter setup
    apply_time_filter = time_filter != "none"
    time_threshold = None
    if apply_time_filter:
        time_threshold = _parse_time_filter(time_filter, now)

    # Traverse directory
    for root, _, files in os.walk(source_folder):
        for file in files:
            full_path = os.path.join(root, file)

            try:
                size_bytes = os.path.getsize(full_path)
                mod_time = os.path.getmtime(full_path)

                # Size filter - using constants
                if not (min_size <= size_bytes < max_size):
                    continue

                # Time filter
                if apply_time_filter and time_threshold:
                    if time_filter.startswith("<") and mod_time < time_threshold:
                        continue
                    if time_filter.startswith(">") and mod_time >= time_threshold:
                        continue

                # Semantic / Deep Scan filter
                matched_type = None
                if semantic_types or (deep_scan and deep_scan_term):
                    matched_type = get_semantic_match(
                        file,
                        root,
                        semantic_types,
                        deep_scan=deep_scan,
                        deep_scan_term=deep_scan_term,
                        deep_scan_mode=deep_scan_mode,
                        # pass progress info so we can update per deep-scanned file
                        file_size=size_bytes,
                        progress_callback=progress_callback
                    )
                    if not matched_type:
                        continue

                matching_files.append((full_path, matched_type))

            except Exception as e:
                print(f"Skipping file due to error: {full_path}\n{e}")

    return matching_files


def _parse_time_filter(time_filter, now):
    """
    Parse time filter string and return threshold timestamp.
    
    Examples:
    - '<1h' -> files modified in last hour
    - '<24h' -> files modified in last day
    - '<7d' -> files modified in last week
    - '>30d' -> files modified more than 30 days ago
    """
    try:
        unit = time_filter[-1]
        value = int(time_filter[1:-1])
        
        if unit == "h":
            return now - (value * 3600)
        elif unit == "d":
            return now - (value * 86400)
        else:
            raise ValueError(f"Invalid time filter unit: {unit}")
    except Exception as e:
        print(f"Warning: Invalid time filter '{time_filter}': {e}")
        return None


def get_semantic_match(filename, folder_path, selected_types,
                       deep_scan=False, deep_scan_term=None, deep_scan_mode="OR",
                       file_size: int = 0,
                       progress_callback: Optional[Callable[[str, str, int], None]] = None):
    """
    Match a file against semantic filters and/or deep scan terms.
    """
    full_path = os.path.join(folder_path, filename)
    ext = os.path.splitext(filename)[1].lower()
    name_lower = filename.lower()

    # Normalize selected types (case/whitespace)
    selected_norm = set(t.strip().lower() for t in (selected_types or []))

    # Check semantic type filters (extension- or keyword-based)
    matched_type = None
    if selected_norm:
        for file_type, patterns in FILE_TYPE_PATTERNS.items():
            if file_type.strip().lower() not in selected_norm:
                continue

            for pat in patterns:
                if isinstance(pat, str) and pat.startswith("."):
                    if ext == pat.lower():
                        matched_type = file_type
                        break
                elif isinstance(pat, str) and pat:
                    if pat.lower() in name_lower:
                        matched_type = file_type
                        break
            if matched_type:
                break

    # Deep scan: search file content for term(s)
    if deep_scan and deep_scan_term:
        # Normalize search terms to list
        if isinstance(deep_scan_term, str):
            terms = [deep_scan_term] if deep_scan_term.strip() else []
        else:
            terms = [t for t in deep_scan_term if isinstance(t, str) and t.strip()]

        if terms:
            content_match = _search_file_content(
                full_path, terms, deep_scan_mode,
                on_progress=progress_callback, file_size=file_size
            )
            if content_match:
                return matched_type or "Deep Scan Match"
            else:
                return None

    return matched_type


def _search_file_content(file_path, search_terms, mode="OR",
                         on_progress: Optional[Callable[[str, str, int], None]] = None,
                         file_size: int = 0):
    """
    Search file content for terms. Accepts 'OR'/'AND' and UI-friendly 'any'/'all'.
    Reports progress per file (once) when a deep scan actually occurs.
    """
    try:
        # announce current file being scanned
        if on_progress:
            try:
                on_progress("current", file_path, 0)
            except Exception:
                pass

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().lower()

            mode_norm = (mode or "OR").strip().lower()
            is_and = mode_norm in ("and", "all")
            matched = all(term.lower() in content for term in search_terms) if is_and \
                      else any(term.lower() in content for term in search_terms)

        # advance after scan completes
        if on_progress:
            try:
                on_progress("advance", file_path, file_size or 0)
            except Exception:
                pass

        return matched
    except Exception:
        # Skip files that can't be read as text
        return False
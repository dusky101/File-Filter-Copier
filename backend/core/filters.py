# filters.py

import os
import time
from core.file_types import FILE_TYPE_PATTERNS, CONTENT_MARKERS
from features.extension_filter import filter_by_extension
from features.hidden_filter import filter_hidden_files


def filter_files(source_folder, size_filter, time_filter, semantic_types,
                 deep_scan=False, deep_scan_term=None, deep_scan_mode="OR"):
    """
    Traverse a folder and return files matching filters.
    Supports size, time, semantic type, and deep scan with custom term(s).
    deep_scan_term can be a string or a list of strings.
    deep_scan_mode can be "OR" (any term matches) or "AND" (all terms must match).
    """
    matching_files = []
    now = time.time()

    # Time filter setup
    apply_time_filter = time_filter != "none"
    time_threshold = None
    if apply_time_filter:
        unit = time_filter[-1]
        value = int(time_filter[1:-1])
        if unit == "h":
            time_threshold = now - value * 3600
        elif unit == "d":
            time_threshold = now - value * 86400
        else:
            raise ValueError("Invalid time filter format")

    # Traverse directory
    for root, _, files in os.walk(source_folder):
        for file in files:
            full_path = os.path.join(root, file)

            try:
                size_bytes = os.path.getsize(full_path)
                mod_time = os.path.getmtime(full_path)

                # Size filter
                if size_filter == ">1KB" and size_bytes <= 1024:
                    continue
                if size_filter == "<1KB" and size_bytes > 1024:
                    continue

                # Time filter
                if apply_time_filter:
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
                        deep_scan_mode=deep_scan_mode
                    )
                    if not matched_type:
                        continue

                matching_files.append((full_path, matched_type))

            except Exception as e:
                print(f"Skipping file due to error: {full_path}\n{e}")

    return matching_files


def get_semantic_match(filename, folder_path, selected_types,
                       deep_scan=False, deep_scan_term=None, deep_scan_mode="OR"):
    """
    Match a file against semantic filters and/or deep scan terms.
    deep_scan_term can be a string or list of strings.
    deep_scan_mode can be "OR" (any term matches) or "AND" (all terms must match).
    """
    filename_lower = filename.lower()
    folder_lower = folder_path.lower()
    full_path = os.path.join(folder_path, filename)

    # First check semantic types
    for type_name in selected_types:
        patterns = FILE_TYPE_PATTERNS.get(type_name, [])
        for pattern in patterns:
            if pattern.lower() in filename_lower or pattern.lower() in folder_lower:
                return type_name

        if deep_scan:
            markers = CONTENT_MARKERS.get(type_name, [])
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read().lower()
                    for marker in markers:
                        if marker.lower() in content:
                            return type_name
            except Exception as e:
                print(f"Could not read file for deep scan: {filename}\n{e}")

    # Handle custom deep scan terms
    if deep_scan and deep_scan_term:
        terms = deep_scan_term if isinstance(deep_scan_term, list) else [deep_scan_term]
        try:
            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().lower()

                if deep_scan_mode == "OR":
                    for term in terms:
                        if term.lower() in content:
                            return f"DeepScan:{term}"
                elif deep_scan_mode == "AND":
                    if all(term.lower() in content for term in terms):
                        return "DeepScan:" + ",".join(terms)

        except Exception as e:
            print(f"Could not read file for deep scan term: {filename}\n{e}")

    return None

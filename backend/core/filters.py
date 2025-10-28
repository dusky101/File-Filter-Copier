# filters.py

import os
import time
import re
import fnmatch
from typing import Callable, Optional

from core.file_types import FILE_TYPE_PATTERNS, CONTENT_MARKERS

# Size constants for cleaner code
KB = 1024
MB = 1024 * KB
GB = 1024 * MB

# Size filter mappings
SIZE_FILTERS = {
    "all": (0, float("inf")),           # No size limit
    "small": (0, 1 * MB),               # < 1 MB
    "medium": (1 * MB, 10 * MB),        # 1 MB - 10 MB
    "large": (10 * MB, 100 * MB),       # 10 MB - 100 MB
    "huge": (100 * MB, float("inf")),   # > 100 MB
    # Legacy filters for backward compatibility
    ">1KB": (1 * KB, float("inf")),
    "<1KB": (0, 1 * KB),
    ">500MB": (500 * MB, float("inf")),
}


def filter_files(
    source_folder,
    size_filter,
    time_filter,
    semantic_types,            # file types (e.g., Images, Code, Swift, …)
    deep_scan=False,
    deep_scan_term=None,
    deep_scan_mode="OR",
    progress_callback: Optional[Callable[[str, str, int], None]] = None,
    # Advanced
    follow_symlinks: bool = False,
    include_hidden: bool = False,
    max_depth: int = 0,
    name_glob_include: Optional[list[str]] = None,
    name_glob_exclude: Optional[list[str]] = None,
    name_regex_include: Optional[str] = None,
    name_regex_exclude: Optional[str] = None,
    time_attribute: str = "mtime",
    deep_scan_max_size_bytes: int = 0,
    project_types: Optional[list[str]] = None,  # <- NEW: project role filters (Models, Controllers, Assets, …)
):
    """
    Traverse a folder and return files matching filters.
    Returns list of (full_path, semantic_type, search_tags).
    progress_callback(event, path, bytes_inc): events 'current' | 'advance'
    """
    matching_files = []
    now = time.time()
    inc_re = re.compile(name_regex_include, re.IGNORECASE) if name_regex_include else None
    exc_re = re.compile(name_regex_exclude, re.IGNORECASE) if name_regex_exclude else None
    inc_globs = [g.strip() for g in (name_glob_include or []) if str(g).strip()]
    exc_globs = [g.strip() for g in (name_glob_exclude or []) if str(g).strip()]

    def is_hidden_path(p: str) -> bool:
        parts = [pp for pp in p.split(os.sep) if pp]
        return any(part.startswith(".") for part in parts)

    def get_time(path: str) -> float:
        if time_attribute == "ctime":
            return os.path.getctime(path)
        if time_attribute == "atime":
            return os.path.getatime(path)
        return os.path.getmtime(path)

    # Parse size filter (supports predefined keys and custom ranges)
    min_size, max_size = SIZE_FILTERS.get(size_filter, SIZE_FILTERS["all"])
    # Custom size filter format: "custom:<min>-<max><unit>" where unit in KB|MB|GB
    # Examples: custom:0-5MB, custom:10MB-100MB, custom:100MB-inf
    if isinstance(size_filter, str) and size_filter.startswith("custom:"):
        try:
            spec = size_filter.split(":", 1)[1]
            rng = spec.split("-", 1)
            if len(rng) != 2:
                raise ValueError("Invalid custom size spec")

            def parse_part(part: str) -> float:
                p = part.strip().lower()
                if p in ("inf", "+inf", "infinity"):
                    return float("inf")
                if p.endswith("kb"):
                    return float(p[:-2]) * KB
                if p.endswith("mb"):
                    return float(p[:-2]) * MB
                if p.endswith("gb"):
                    return float(p[:-2]) * GB
                return float(p)

            min_size = parse_part(rng[0])
            max_size = parse_part(rng[1])
            if min_size > max_size:
                min_size, max_size = max_size, min_size
        except Exception as e:
            print(f"Warning: Invalid custom size filter '{size_filter}': {e}")
            min_size, max_size = SIZE_FILTERS["all"]

    # Time filter setup
    apply_time_filter = time_filter != "none"
    time_threshold = None
    if apply_time_filter:
        time_threshold = _parse_time_filter(time_filter, now)

    # Traverse directory
    for root, _, files in os.walk(source_folder, followlinks=follow_symlinks):
        # Depth check
        rel = os.path.relpath(root, source_folder)
        depth = 0 if rel == "." else rel.count(os.sep) + 1
        if max_depth and depth > max_depth:
            continue
        # Hidden dir check
        if not include_hidden and rel != "." and is_hidden_path(rel):
            continue

        for file in files:
            full_path = os.path.join(root, file)
            tags: list[str] = []

            # Hidden file check
            if not include_hidden and file.startswith("."):
                continue

            # Glob filters (full path and filename)
            if inc_globs:
                full_norm = full_path
                if not any(
                    fnmatch.fnmatch(full_norm, g) or fnmatch.fnmatch(file, g) for g in inc_globs
                ):
                    continue
                tags.append("Glob")
            if exc_globs:
                full_norm = full_path
                if any(
                    fnmatch.fnmatch(full_norm, g) or fnmatch.fnmatch(file, g) for g in exc_globs
                ):
                    continue

            # Regex filters
            if inc_re:
                if not (inc_re.search(file) or inc_re.search(full_path)):
                    continue
                tags.append("Regex")
            if exc_re and (exc_re.search(file) or exc_re.search(full_path)):
                continue

            try:
                size_bytes = os.path.getsize(full_path)
                tval = get_time(full_path)

                # Size filter
                if not (min_size <= size_bytes < max_size):
                    continue
                if isinstance(size_filter, str):
                    if size_filter != "all":
                        tags.append("Size")
                else:
                    tags.append("Size")

                # Time filter
                if apply_time_filter and time_threshold:
                    if time_filter.startswith("<") and tval < time_threshold:
                        continue
                    if time_filter.startswith(">") and tval >= time_threshold:
                        continue
                    tags.append("Time")

                # Semantic / Deep Scan filter
                matched_type = None
                if semantic_types or project_types or (deep_scan and deep_scan_term):
                    # Optional deep-scan size cap
                    allow_deep = True
                    if deep_scan and deep_scan_max_size_bytes and size_bytes > deep_scan_max_size_bytes:
                        allow_deep = False

                    # If we require semantic gating and deep scan, but file is too big to scan, skip
                    if (semantic_types or project_types) and (deep_scan and deep_scan_term) and not allow_deep:
                        continue

                    matched_type = get_semantic_match(
                        file,
                        root,
                        semantic_types,              # file types
                        project_types,               # project types
                        deep_scan=deep_scan and allow_deep,
                        deep_scan_term=deep_scan_term,
                        deep_scan_mode=deep_scan_mode,
                        file_size=size_bytes,
                        progress_callback=progress_callback,
                    )
                    if not matched_type:
                        continue
                    if deep_scan and deep_scan_term:
                        tags.append("Deep Scan")
                    if semantic_types or project_types:
                        tags.append("Semantic")

                matching_files.append((full_path, matched_type, tags))
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
        s = str(time_filter).strip().lower()
        unit = s[-1]
        value = int(s[1:-1])
        if unit == "h":
            return now - (value * 3600)
        elif unit == "d":
            return now - (value * 86400)
        elif unit == "w":
            return now - (value * 7 * 86400)
        elif unit == "m":
            return now - (value * 30 * 86400)
        else:
            raise ValueError(f"Invalid time filter unit: {unit}")
    except Exception as e:
        print(f"Warning: Invalid time filter '{time_filter}': {e}")
        return None


def get_semantic_match(
    filename,
    folder_path,
    file_types,
    project_types,
    deep_scan=False,
    deep_scan_term=None,
    deep_scan_mode="OR",
    file_size: int = 0,
    progress_callback: Optional[Callable[[str, str, int], None]] = None,
 ):
     """
    Match a file against:
      - file_types (extensions/keywords like Images, Swift, …)
      - project_types (path/name keywords like Controllers, Assets, …)
      - deep_scan terms
    Rules:
      - If both file_types and project_types are provided, require BOTH to match (intersection).
      - If only one group is provided, require that group.
      - If deep_scan terms are provided, content must match too.
     """
     full_path = os.path.join(folder_path, filename)
     ext = os.path.splitext(filename)[1].lower()
     name_lower = filename.lower()
     path_lower = full_path.lower()


     file_norm = {t.strip().lower() for t in (file_types or []) if str(t).strip()}
     proj_norm = {t.strip().lower() for t in (project_types or []) if str(t).strip()}

     def match_any(selected: set[str]) -> Optional[str]:
        if not selected:
            return None
        for t, patterns in FILE_TYPE_PATTERNS.items():
            if t.strip().lower() not in selected:
                continue
            for pat in patterns:
                if not isinstance(pat, str):
                    continue
                p = pat.lower()
                if p.startswith("."):
                    if ext == p:
                        return t
                else:
                    if p in name_lower or p in path_lower:
                        return t
        return None

    # 1) Semantic match(es)
     file_hit = match_any(file_norm) if file_norm else None
     proj_hit = match_any(proj_norm) if proj_norm else None

     if file_norm and proj_norm:
        if not (file_hit and proj_hit):
            return None
        semantic_type = proj_hit or file_hit
     elif file_norm:
        if not file_hit:
            return None
        semantic_type = file_hit
     elif proj_norm:
        if not proj_hit:
            return None
        semantic_type = proj_hit
     else:
        semantic_type = None

    # 2) Deep scan (content) if requested
     if deep_scan and deep_scan_term:
         # Normalize terms
         if isinstance(deep_scan_term, str):
             terms = [deep_scan_term] if deep_scan_term.strip() else []
         else:
             terms = [t for t in deep_scan_term if isinstance(t, str) and t.strip()]
         if terms:
             content_match = _search_file_content(
                 full_path, terms, deep_scan_mode, on_progress=progress_callback, file_size=file_size
             )
             if not content_match:
                 return None
             # Keep semantic label if present; otherwise tag as a deep scan match
             return semantic_type or "Deep Scan Match"

     # 3) Only semantic filter active
     return semantic_type


def _search_file_content(
    file_path,
    search_terms,
    mode="OR",
    on_progress: Optional[Callable[[str, str, int], None]] = None,
    file_size: int = 0,
):
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
            matched = (
                all(term.lower() in content for term in search_terms)
                if is_and
                else any(term.lower() in content for term in search_terms)
            )

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
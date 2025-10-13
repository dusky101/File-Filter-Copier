# extension_filter.py

import os

def filter_by_extension(file_list, include_exts=None, exclude_exts=None, verbose=False):
    """
    Filters a list of file paths by extension.
    
    Parameters:
    - file_list: list of full file paths
    - include_exts: list of extensions to keep (e.g. ['.py', '.swift'])
    - exclude_exts: list of extensions to skip (e.g. ['.log', '.tmp'])
    - verbose: if True, prints summary of filtering
    
    Returns:
    - filtered list of file paths
    """
    def normalize(exts):
        return set(e.lower().strip() if e.startswith('.') else f".{e.lower().strip()}" for e in exts)

    include_exts = normalize(include_exts) if include_exts else None
    exclude_exts = normalize(exclude_exts) if exclude_exts else None

    filtered = []
    for path in file_list:
        ext = os.path.splitext(path)[1].lower()

        if include_exts and ext not in include_exts:
            continue
        if exclude_exts and ext in exclude_exts:
            continue

        filtered.append(path)

    if verbose:
        print(f"[Extension Filter] {len(filtered)} of {len(file_list)} files matched.")
        if include_exts:
            print(f"Included: {sorted(include_exts)}")
        if exclude_exts:
            print(f"Excluded: {sorted(exclude_exts)}")

    return filtered

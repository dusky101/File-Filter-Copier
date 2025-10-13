# duplicate_checker.py

import os
from collections import defaultdict

def detect_duplicates(file_list):
    """
    Detects duplicate filenames in a list of full file paths.
    
    Returns:
    - duplicates: dict of {filename: [full_path1, full_path2, ...]}
    - unique_files: list of files with no name collisions
    """
    name_map = defaultdict(list)
    for path in file_list:
        filename = os.path.basename(path)
        name_map[filename].append(path)

    duplicates = {name: paths for name, paths in name_map.items() if len(paths) > 1}
    unique_files = [paths[0] for name, paths in name_map.items() if len(paths) == 1]

    return duplicates, unique_files

def warn_duplicates(duplicates):
    """
    Prints a summary of detected duplicates.
    """
    if not duplicates:
        print("[Duplicate Check] No filename collisions detected.")
        return

    print(f"[Duplicate Check] {len(duplicates)} duplicate filenames found:")
    for name, paths in duplicates.items():
        print(f"  - {name} ({len(paths)} copies)")
        for p in paths:
            print(f"      • {p}")

# hidden_filter.py

import os

from features.exclude_folders import load_excluded_folders, save_excluded_folders, browse_exclude_folder

EXCLUDED_FOLDERS = load_excluded_folders()

EXCLUDED_NAMES = {
    ".DS_Store", "Thumbs.db", ".AppleDouble", ".Spotlight-V100", ".Trashes", "__init__.py"
}

def is_hidden(path):
    """Returns True if the file or any parent folder is hidden."""
    parts = os.path.normpath(path).split(os.sep)
    return any(part.startswith('.') for part in parts)

def filter_hidden_files(file_list, exclude_dotfiles=True, exclude_system=True, exclude_hidden_dirs=True, exclude_folders=True, excluded_folder_names=None):
    """
    Filters out hidden/system files and files inside excluded folders.
    
    Parameters:
    - exclude_dotfiles: skip files starting with '.'
    - exclude_system: skip known system metadata files
    - exclude_hidden_dirs: skip files inside hidden folders
    - exclude_folders: skip files inside user-defined folders
    - excluded_folder_names: set of folder names to exclude
    
    Returns:
    - filtered list of file paths
    """
    if excluded_folder_names is None:
        excluded_folder_names = set()

    filtered = []
    for path in file_list:
        name = os.path.basename(path)
        if exclude_dotfiles and name.startswith('.'):
            continue
        if exclude_system and name in EXCLUDED_NAMES:
            continue
        if exclude_hidden_dirs and is_hidden(os.path.dirname(path)):
            continue
        if exclude_folders and is_in_excluded_folder(path, excluded_folder_names):
            continue
        filtered.append(path)
    return filtered

def is_in_excluded_folder(path, excluded_names):
    """Returns True if the file is inside a folder that should be excluded."""
    parts = os.path.normpath(path).split(os.sep)
    return any(part in excluded_names for part in parts)


import os
import json
from tkinter import filedialog

DEFAULT_EXCLUDED = {"venv", "__pycache__", ".git", ".idea", "node_modules"}
EXCLUDE_CONFIG_FILE = "excluded_folders.json"

def load_excluded_folders():
    if os.path.exists(EXCLUDE_CONFIG_FILE):
        try:
            with open(EXCLUDE_CONFIG_FILE, "r", encoding="utf-8") as f:
                return set(json.load(f))
        except Exception:
            pass
    return set(DEFAULT_EXCLUDED)

def save_excluded_folders(folders):
    try:
        with open(EXCLUDE_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(list(folders), f, indent=2)
    except Exception as e:
        print(f"[Exclude Folders] Failed to save: {e}")

def browse_exclude_folder(app):
    folder = filedialog.askdirectory(initialdir=app.source_folder.get())
    if folder:
        folder_name = os.path.basename(folder)
        app.excluded_folders.add(folder_name)
        save_excluded_folders(app.excluded_folders)
        app.update_excluded_display()

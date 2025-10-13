# preset_manager.py

import os
import json

PRESET_FILE = "filter_presets.json"

def save_preset(name, config):
    """
    Saves a filter preset under the given name.
    - name: string identifier
    - config: dictionary of filter settings
    """
    presets = _load_all_presets()
    presets[name] = config
    _write_presets(presets)

def load_preset(name):
    """
    Loads a preset by name.
    Returns the config dictionary or None if not found.
    """
    presets = _load_all_presets()
    return presets.get(name)

def list_presets():
    """
    Returns a list of saved preset names.
    """
    return list(_load_all_presets().keys())

def delete_preset(name):
    """
    Deletes a preset by name.
    """
    presets = _load_all_presets()
    if name in presets:
        del presets[name]
        _write_presets(presets)

def _load_all_presets():
    if not os.path.exists(PRESET_FILE):
        return {}
    try:
        with open(PRESET_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _write_presets(presets):
    try:
        with open(PRESET_FILE, "w", encoding="utf-8") as f:
            json.dump(presets, f, indent=2)
    except Exception as e:
        print(f"[Preset Manager] Failed to save presets: {e}")

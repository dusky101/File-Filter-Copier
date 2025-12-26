from __future__ import annotations
from pathlib import Path
import json
import os
import sys
from typing import Dict, Any, Optional, Tuple

# DETERMINE STORAGE PATH
# 1. Priority: Use the path passed from Electron (AppData)
env_config_dir = os.getenv("FFC_CONFIG_DIR")

if env_config_dir:
    _STORE_PATH = Path(env_config_dir) / "filter_presets.json"

# 2. Fallback: If running as a standalone .exe (Portable mode)
elif getattr(sys, 'frozen', False):
    _STORE_PATH = Path(sys.executable).parent / "filter_presets.json"

# 3. Fallback: Dev mode (Local source folder)
else:
    _STORE_PATH = Path(__file__).resolve().parents[1] / "filter_presets.json"

_DEFAULT_KEY = "__default__"  # reserved top-level key to store default preset name

def _ensure_store(path: Path = _STORE_PATH) -> None:
    if not path.exists():
        try:
            path.write_text("{}", encoding="utf-8")
        except Exception:
            pass

def _read_raw(path: Path = _STORE_PATH) -> Dict[str, Any]:
    _ensure_store(path)
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f) or {}
            if not isinstance(data, dict):
                return {}
            return data
    except Exception:
        return {}

def _write_raw(data: Dict[str, Any], path: Path = _STORE_PATH) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"[Preset Manager] Failed to write presets: {e}")

def _read() -> Tuple[Dict[str, Dict[str, Any]], Optional[str]]:
    """
    Returns (presets_map, default_name).
    Supports flat format (your current file) and a legacy {'presets':{..}, 'default':..}.
    Always writes back as flat with '__default__'.
    """
    raw = _read_raw()
    if "presets" in raw:
        presets = raw.get("presets") or {}
        default = raw.get("default")
        return presets, default
    # flat format (your current): top-level keys are preset names
    presets = {k: v for k, v in raw.items() if k != _DEFAULT_KEY}
    default = raw.get(_DEFAULT_KEY)
    return presets, default

def _write(presets: Dict[str, Dict[str, Any]], default: Optional[str]) -> None:
    out = dict(presets)
    if default:
        out[_DEFAULT_KEY] = default
    _write_raw(out)

def list_presets() -> Dict[str, Dict[str, Any]]:
    presets, _ = _read()
    return presets

def save_preset(name: str, data: Dict[str, Any]) -> None:
    if not name:
        raise ValueError("Preset name is required")
    presets, default = _read()
    presets[name] = data or {}
    _write(presets, default)

def delete_preset(name: str) -> None:
    presets, default = _read()
    if name in presets:
        del presets[name]
    if default == name:
        default = None
    _write(presets, default)

def load_preset(name: str) -> Dict[str, Any]:
    presets, _ = _read()
    if name not in presets:
        raise KeyError(f"Preset '{name}' not found")
    return presets[name]

def get_default_preset() -> Optional[str]:
    _, default = _read()
    return default

def set_default_preset(name: str) -> None:
    presets, _default = _read()
    if name not in presets:
        raise KeyError(f"Preset '{name}' not found")
    _write(presets, name)

def clear_default_preset() -> None:
    presets, _ = _read()
    _write(presets, None)
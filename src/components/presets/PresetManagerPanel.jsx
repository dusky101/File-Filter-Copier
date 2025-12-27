import React, { useEffect, useState } from "react";
import { Download, Trash2, CheckCircle2 } from "lucide-react";
import {
  listPresets,
  loadPreset as apiLoadPreset,
  deletePreset as apiDeletePreset,
  setDefaultPreset,
  getDefaultPreset,
  clearDefaultPreset,
} from "../../services/api";
import useFilterStore from "../../stores/useFilterStore";
import useSettingsStore from "../../stores/useSettingsStore";

// UI Components
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../ui/dialog";
import { Button } from "../../ui/button";

const PresetManagerPanel = ({ isOpen, onClose, onPresetLoaded }) => {
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loadPresetConfig } = useFilterStore();
  const {
    setDefaultPresetName,
    setActivePresetName,
    defaultPresetName,
    getNextOutputNameForPreset,
  } = useSettingsStore();

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listPresets();
      if (res.success) {
        const srv = res.data || {};
        // Prefer array of names
        let names = Array.isArray(srv.presets) ? srv.presets : [];
        // Back-compat: if presets was sent as an object map, use its keys
        if (!names.length && srv.presets && typeof srv.presets === "object") {
          names = Object.keys(srv.presets);
        }
        names.sort((a, b) => a.localeCompare(b));
        setPresets(names);
        if (!selected && names.length) setSelected(names[0]);
      } else {
        setError(res.error || "Failed to load presets");
      }
    } catch (e) {
      setError(e.message || "Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen]);

  const loadPreset = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiLoadPreset(selected);
      if (res.success) {
        const config = { ...(res.data?.config || res.data) }; // support both shapes
        // Normalize source/destination/output
        const src =
          config.folder || config.sourceFolder || config.source_folder;
        const dest =
          config.destination ||
          config.destinationFolder ||
          config.destination_folder;
        const outName =
          config.output_folder_name || config.outputFolderName || "Output";
        // Compute next output folder name for this preset
        const nextOut = getNextOutputNameForPreset(selected, outName);
        config.folder = src || "";
        config.destination = dest || "";
        config.output_folder_name = nextOut;
        loadPresetConfig(config);
        setActivePresetName(selected || null);

        onClose?.();

        // REPLACED: alert() with the enhanced dialog callback
        if (onPresetLoaded) {
          onPresetLoaded(selected, nextOut);
        }
      } else setError(res.error || "Failed to load preset");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `Delete preset "${selected}"? This cannot be undone.`
    );
    if (!ok) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiDeletePreset(selected);
      if (res.success) {
        await refresh();
        if (defaultPresetName === selected) setDefaultPresetName(null);
      } else {
        setError(res.error || "Failed to delete preset");
      }
    } catch (e) {
      setError(e.message || "Failed to delete preset");
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDefault = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await setDefaultPreset(selected);
      if (res?.success) {
        const cur = await getDefaultPreset();
        setDefaultPresetName(cur?.default ?? selected);
      } else {
        setError(res?.error || "Failed to set default");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearDefault = async () => {
    setLoading(true);
    try {
      await clearDefaultPreset();
      setDefaultPresetName(null);
    } finally {
      setLoading(false);
    }
  };

  // On open, fetch default to sync
  useEffect(() => {
    let alive = true;
    if (isOpen) {
      (async () => {
        try {
          const res = await getDefaultPreset();
          if (alive) setDefaultPresetName(res?.default ?? null);
        } catch {}
      })();
    }
    return () => {
      alive = false;
    };
  }, [isOpen, setDefaultPresetName]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Load Preset</DialogTitle>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Select a Preset
          </label>
          <div className="flex gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              {presets.length === 0 && (
                <option value="" disabled>
                  (No presets saved)
                </option>
              )}
              {presets.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="default" // Using default size but overriding padding for square look
              onClick={refresh}
              title="Refresh list"
              className="px-3"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>

          {/* Default preset status indicator */}
          <div className="mt-2 text-sm text-slate-500 flex items-center gap-2">
            <span>Default on startup:</span>
            {defaultPresetName ? (
              <span className="font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {defaultPresetName}
              </span>
            ) : (
              <span className="italic text-slate-400">None</span>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-800">
            {error}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <DialogFooter className="sm:justify-between gap-y-2">
        {/* Left Side: Delete */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={deletePreset}
            disabled={!selected || loading}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:border-red-900/50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        {/* Right Side: Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            variant="outline"
            onClick={handleClearDefault}
            disabled={!defaultPresetName || loading}
            title="Clear default preset"
          >
            Clear Default
          </Button>

          <Button
            variant="secondary"
            onClick={handleMakeDefault}
            disabled={!selected || loading}
          >
            Make Default
          </Button>

          <Button
            variant="default"
            onClick={loadPreset}
            disabled={!selected || loading || presets.length === 0}
            className="px-6 shadow-md hover:shadow-lg"
          >
            Load Preset
          </Button>
        </div>
      </DialogFooter>
    </Dialog>
  );
};

export default PresetManagerPanel;

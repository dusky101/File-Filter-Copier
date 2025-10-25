import React, { useEffect, useState } from "react";
import { X, Save, Trash2, Download } from "lucide-react";
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

const PresetManagerPanel = ({ isOpen, onClose }) => {
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { loadPresetConfig } = useFilterStore();
  const {
    setDefaultPresetName,
    setActivePresetName,
    defaultPresetName,
    getNextOutputNameForPreset, // <-- add this
  } = useSettingsStore();

  const resetToBlank = useFilterStore((s) => s.resetToBlank);

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

  // Esc closes panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

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
        onClose?.();
        alert(
          `✅ Loaded preset \"${selected}\"\nOutput folder set to: ${nextOut}`
        );
      } else setError(res.error || "Failed to load preset");
    } catch (e) {
      setError(e.message || "Failed to load preset");
    } finally {
      setLoading(false);
    }
  };

  const deletePreset = async () => {
    if (!selected) return;
    const ok = window.confirm(
      `Delete preset \"${selected}\"? This cannot be undone.`
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

  const makeDefault = async () => {
    if (!selected) return;
    setDefaultPresetName(selected);
    alert(
      `✅ Default preset set to \"${selected}\". It will auto-load on startup.`
    );
  };

  // After successful load
  const handleLoad = async () => {
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
        alert(
          `✅ Loaded preset \"${selected}\"\nOutput folder set to: ${nextOut}`
        );
      } else setError(res.error || "Failed to load preset");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  // Make Default
  const handleMakeDefault = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await setDefaultPreset(selected);
      if (res?.success) {
        const cur = await getDefaultPreset();
        setDefaultPresetName(cur?.default ?? selected);
        // keep panel open; optionally toast instead of alert
      } else {
        setError(res?.error || "Failed to set default");
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear Default
  const handleClearDefault = async () => {
    setLoading(true);
    try {
      await clearDefaultPreset();
      setDefaultPresetName(null);
      // optional: also clear the active name if you reset the filters to blank
      // setActivePresetName(null);
    } finally {
      setLoading(false);
    }
  };

  // On open, fetch default to sync
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await getDefaultPreset();
        if (alive) setDefaultPresetName(res?.default ?? null);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [setDefaultPresetName]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 pointer-events-auto">
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Load Preset
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Saved presets
              </label>
              <div className="flex gap-2">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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
                <button
                  onClick={refresh}
                  className="px-3 py-3 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                  title="Refresh list"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              {/* Default preset label */}
              <div className="text-sm text-slate-400">
                Default preset:{" "}
                {defaultPresetName ? (
                  <strong>{defaultPresetName}</strong>
                ) : (
                  <em>None</em>
                )}
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
          <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <button
              onClick={deletePreset}
              disabled={!selected || loading}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 inline-block mr-2" /> Delete
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMakeDefault}
                disabled={!selected || loading}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Make Default
              </button>
              <button
                onClick={handleLoad}
                disabled={!selected || loading || presets.length === 0}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Load
              </button>
              <button
                onClick={handleClearDefault}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800"
                title="Clear default preset and revert to blank filters"
              >
                Clear Default
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PresetManagerPanel;

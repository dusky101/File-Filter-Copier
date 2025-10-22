import React, { useMemo, useState } from "react";
import {
  X,
  SlidersHorizontal,
  Sparkles,
  Filter,
  FolderX,
  Clock,
  Ruler,
  Binary,
  BadgeCheck,
  Layers,
  Tag,
  ScanSearch,
  ListFilter,
} from "lucide-react";
import useFilterStore from "../../stores/useFilterStore";
import usePreviewStore from "../../stores/usePreviewStore";
import { fileTypeGroups } from "../../utils/fileTypes";
import { listFolders } from "../../services/api";

/**
 * FilterHub
 * A sleek, sectioned drawer that centralizes all filtering options.
 * Sections are navigation-driven; changes apply immediately. The footer provides Close/Reset.
 */
const FilterHub = ({ open, onClose }) => {
  const {
    // ext
    includeExtensions,
    excludeExtensions,
    setIncludeExtensions,
    setExcludeExtensions,
    // size/time
    sizeFilter,
    setSizeFilter,
    timeFilter,
    setTimeFilter,
    // file types
    selectedFileTypes,
    toggleFileType,
    clearFileTypes,
    setFileTypes,
    // project types
    selectedProjectTypes,
    toggleProjectType,
    clearProjectTypes,
    // exclusions
    excludedFolders,
    toggleExcludedFolder,
    customExcludedFolders,
    addCustomExcludedFolder,
    removeCustomExcludedFolder,
    clearCustomExcludedFolders,
    // deep scan
    deepScan,
    setDeepScan,
    deepScanMode,
    setDeepScanMode,
    deepScanTerms,
    addDeepScanTerm,
    removeDeepScanTerm,
    updateDeepScanTerm,
    // utils
    resetFilters,
    sourceFolder,
  } = useFilterStore();

  const { excludeDuplicates, setExcludeDuplicates } = usePreviewStore();

  const [section, setSection] = useState("quick");
  const [quickActiveKey, setQuickActiveKey] = useState(null);
  const [quickSnapshot, setQuickSnapshot] = useState(null);

  // Apply a quick preset while snapshotting previous state
  const applyQuickPreset = (key) => {
    // snapshot only fields that quick presets modify
    const snap = {
      size: sizeFilter,
      time: timeFilter,
      types: Array.from(
        selectedFileTypes?.has
          ? selectedFileTypes
          : new Set(selectedFileTypes || [])
      ),
    };
    setQuickSnapshot(snap);

    switch (key) {
      case "recent7":
        setTimeFilter("<7d");
        break;
      case "mediaHuge":
        setSizeFilter("huge");
        setFileTypes(["Video", "Audio"]);
        break;
      case "codeOnly":
        setFileTypes(["Code", "Web", "Scripts"]);
        break;
      case "docsOnly":
        setFileTypes(["Text Documents", "Spreadsheets", "Presentations"]);
        break;
      default:
        break;
    }
    setQuickActiveKey(key);
  };

  // Revert to snapshot when clearing a quick preset
  const clearQuickPreset = () => {
    if (!quickSnapshot) return;
    setSizeFilter(quickSnapshot.size);
    setTimeFilter(quickSnapshot.time);
    setFileTypes(quickSnapshot.types || []);
    setQuickSnapshot(null);
    setQuickActiveKey(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[980px] max-w-[95vw] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex">
        {/* Left Nav */}
        <nav className="w-60 border-r border-slate-200 dark:border-slate-700 p-4 space-y-1 bg-slate-50/60 dark:bg-slate-900/40">
          <HubNavItem
            icon={Sparkles}
            label="Quick Filters"
            active={section === "quick"}
            onClick={() => setSection("quick")}
          />
          <HubNavItem
            icon={Tag}
            label="File Types"
            active={section === "types"}
            onClick={() => setSection("types")}
          />
          <HubNavItem
            icon={ListFilter}
            label="Extensions"
            active={section === "exts"}
            onClick={() => setSection("exts")}
          />
          <HubNavItem
            icon={Layers}
            label="Project Type"
            active={section === "proj"}
            onClick={() => setSection("proj")}
          />
          <HubNavItem
            icon={Ruler}
            label="Size"
            active={section === "size"}
            onClick={() => setSection("size")}
          />
          <HubNavItem
            icon={Clock}
            label="Time"
            active={section === "time"}
            onClick={() => setSection("time")}
          />
          <HubNavItem
            icon={FolderX}
            label="Folder Exclusions"
            active={section === "folders"}
            onClick={() => setSection("folders")}
          />
          <HubNavItem
            icon={ScanSearch}
            label="Deep Scan"
            active={section === "deep"}
            onClick={() => setSection("deep")}
          />
          <HubNavItem
            icon={Binary}
            label="Duplicates"
            active={section === "dups"}
            onClick={() => setSection("dups")}
          />
          <HubNavItem
            icon={SlidersHorizontal}
            label="Advanced"
            active={section === "adv"}
            onClick={() => setSection("adv")}
          />
        </nav>

        {/* Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Filters
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {section === "quick" && (
              <QuickFilters
                activeKey={quickActiveKey}
                onApply={(key) => {
                  if (quickActiveKey === key) clearQuickPreset();
                  else applyQuickPreset(key);
                }}
                onClear={() => clearQuickPreset()}
              />
            )}
            {section === "types" && (
              <FileTypesSection
                selected={selectedFileTypes}
                onToggle={toggleFileType}
                onClear={clearFileTypes}
              />
            )}
            {section === "exts" && (
              <ExtensionsSection
                include={includeExtensions}
                exclude={excludeExtensions}
                setInclude={setIncludeExtensions}
                setExclude={setExcludeExtensions}
              />
            )}
            {section === "proj" && (
              <ProjectTypeSection
                selected={selectedProjectTypes}
                onToggle={toggleProjectType}
                onClear={clearProjectTypes}
              />
            )}
            {section === "size" && (
              <SizeSection value={sizeFilter} onChange={setSizeFilter} />
            )}
            {section === "time" && (
              <TimeSection value={timeFilter} onChange={setTimeFilter} />
            )}
            {section === "folders" && (
              <FoldersSection
                sourceFolder={sourceFolder}
                excluded={excludedFolders}
                onToggle={toggleExcludedFolder}
                custom={customExcludedFolders}
                addCustom={addCustomExcludedFolder}
                removeCustom={removeCustomExcludedFolder}
                clearCustom={clearCustomExcludedFolders}
              />
            )}
            {section === "deep" && (
              <DeepScanSection
                enabled={deepScan}
                setEnabled={setDeepScan}
                mode={deepScanMode}
                setMode={setDeepScanMode}
                terms={deepScanTerms}
                addTerm={addDeepScanTerm}
                removeTerm={removeDeepScanTerm}
                updateTerm={updateDeepScanTerm}
              />
            )}
            {section === "dups" && (
              <DuplicatesSection
                value={excludeDuplicates}
                onChange={setExcludeDuplicates}
              />
            )}
            {section === "adv" && <AdvancedSection />}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Changes apply immediately.
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Clear all filters across sections
                  resetFilters();
                  setExcludeDuplicates(false);
                  // Revert and clear any active quick preset
                  setQuickActiveKey(null);
                  setQuickSnapshot(null);
                }}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Reset
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HubNavItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"}`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// Sections
const QuickFilters = ({ activeKey, onApply, onClear }) => {
  // No direct store writes here; parent handles apply/clear to support snapshot

  const presets = [
    {
      key: "recent7",
      name: "Recent changes (<7d)",
      describe: () => ["Time: Modified within last 7 days"],
    },
    {
      key: "mediaHuge",
      name: "Large media",
      describe: () => ["Size: > 100 MB", "Types: Video, Audio"],
    },
    {
      key: "codeOnly",
      name: "Source code only",
      describe: () => ["File Types: Code, Web, Scripts"],
    },
    {
      key: "docsOnly",
      name: "Documents only",
      describe: () => [
        "File Types: Text Documents, Spreadsheets, Presentations",
      ],
    },
  ];
  const onPresetClick = (p) => {
    if (activeKey === p.key) onClear?.(p.key);
    else onApply?.(p.key);
  };

  const PresetButton = ({ label, active, onClick }) => {
    const [pulse, setPulse] = useState(false);
    const handleClick = (e) => {
      onClick?.(e);
      // one-shot selected pulse
      setPulse(false);
      requestAnimationFrame(() => setPulse(true));
      setTimeout(() => setPulse(false), 700);
    };
    return (
      <button
        onClick={handleClick}
        className={
          (active
            ? "p-4 rounded-xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg hover:shadow-xl ring-1 ring-white/20"
            : "p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:shadow") +
          " relative overflow-hidden transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 btn-shine"
        }
      >
        <span className="text-sm font-medium relative z-10">{label}</span>
        {/* selected pulse aura (one-shot) */}
        {active && (
          <span
            className={`pointer-events-none absolute inset-0 rounded-xl ${pulse ? "animate-selected-pulse" : ""}`}
          />
        )}
      </button>
    );
  };

  return (
    <div>
      <SectionTitle
        title="Quick Filters"
        subtitle="Jump-start with common scenarios"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {presets.map((p) => (
          <PresetButton
            key={p.key}
            label={p.name}
            active={activeKey === p.key}
            onClick={() => onPresetClick(p)}
          />
        ))}
      </div>

      {/* Applied preset details */}
      {activeKey && (
        <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 p-4">
          <div className="text-sm font-medium mb-1">Applied filters</div>
          <ul className="list-disc text-sm ml-5 space-y-1">
            {presets
              .find((pp) => pp.key === activeKey)
              ?.describe()
              .map((d, i) => (
                <li key={i}>{d}</li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        Presets change underlying filters; you can still tweak details in other
        sections.
      </div>

      {/* Keyframes moved to index.css */}
    </div>
  );
};

const FileTypesSection = ({ selected, onToggle, onClear }) => {
  return (
    <div>
      <SectionTitle title="File Types" subtitle="Pick categories to include" />
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(fileTypeGroups).map(([group, items]) => (
          <div
            key={group}
            className="rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="font-semibold text-slate-800 dark:text-slate-100 mb-2">
              {group}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((item) => {
                const isSelected = selected?.has
                  ? selected.has(item.name)
                  : (selected || []).includes?.(item.name);
                return (
                  <button
                    key={item.name}
                    onClick={() => onToggle(item.name)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm ${isSelected ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-200" : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-70">
                      {item.types.join(", ")}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button
          onClick={onClear}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Clear selection
        </button>
      </div>
    </div>
  );
};

const ExtensionsSection = ({ include, exclude, setInclude, setExclude }) => {
  const [inc, setInc] = useState(include);
  const [exc, setExc] = useState(exclude);
  useMemo(() => setInc(include), [include]);
  useMemo(() => setExc(exclude), [exclude]);
  return (
    <div>
      <SectionTitle
        title="Extensions"
        subtitle="Include or exclude specific extensions (comma separated)"
      />
      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
          <label className="text-sm font-medium">Include</label>
          <input
            value={inc}
            onChange={(e) => setInc(e.target.value)}
            onBlur={() => setInclude(inc)}
            placeholder="e.g., .swift, .js, .ts"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Exclude</label>
          <input
            value={exc}
            onChange={(e) => setExc(e.target.value)}
            onBlur={() => setExclude(exc)}
            placeholder="e.g., .map, .tmp"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-2">
        Extensions should start with a dot. Separate multiple with commas.
      </div>
    </div>
  );
};

const PROJECT_TYPES = [
  "Models",
  "Views",
  "ViewModels",
  "Controllers",
  "Services",
  "Utilities",
  "Tests",
  "Scripts",
  "Config",
  "Assets",
];

const ProjectTypeSection = ({ selected, onToggle, onClear }) => {
  return (
    <div>
      <SectionTitle
        title="Project Type"
        subtitle="Semantic roles determined by path/filename; optional deep scan can refine later"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {PROJECT_TYPES.map((name) => {
          const isSelected = selected?.has
            ? selected.has(name)
            : (selected || []).includes?.(name);
          return (
            <button
              key={name}
              onClick={() => onToggle(name)}
              className={`px-3 py-2 rounded-full text-sm border ${isSelected ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-200" : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              {name}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <button
          onClick={onClear}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Clear
        </button>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Note: Classification UI is ready; back-end logic can adopt rules later
        without UI changes.
      </div>
    </div>
  );
};

const SizeSection = ({ value, onChange }) => {
  const [isCustom, setIsCustom] = useState(() =>
    value?.startsWith?.("custom:")
  );
  const [minVal, setMinVal] = useState(0);
  const [maxVal, setMaxVal] = useState(10);
  const [unit, setUnit] = useState("MB");
  const opts = [
    { value: "all", label: "All Sizes", description: "No size restriction" },
    { value: "small", label: "Small", description: "< 1 MB" },
    { value: "medium", label: "Medium", description: "1 MB - 10 MB" },
    { value: "large", label: "Large", description: "10 MB - 100 MB" },
    { value: "huge", label: "Huge", description: "> 100 MB" },
  ];
  const applyCustom = () => {
    // Build custom string understood by backend: custom:min-maxUNIT
    const min = Math.max(0, Number(minVal) || 0);
    const max = Number(maxVal);
    const maxPart = isFinite(max) && max > 0 ? `${max}${unit}` : `inf`;
    const str = `custom:${min}${unit}-${maxPart}`;
    onChange(str);
  };
  return (
    <div>
      <SectionTitle title="Size" subtitle="Filter by file size" />
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => {
              setIsCustom(false);
              onChange(o.value);
            }}
            className={`p-4 rounded-xl border text-left ${value === o.value ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700" : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            <div className="font-medium">{o.label}</div>
            <div className="text-xs opacity-70">{o.description}</div>
          </button>
        ))}
      </div>
      {/* Custom builder below the options for better layout at default widths */}
      <div className="mt-4 p-3 rounded-xl border border-slate-300 dark:border-slate-600">
        <div className="text-sm font-medium mb-2">Custom</div>
        <div className="flex items-center gap-2 text-sm">
          <span>Min</span>
          <input
            type="number"
            min={0}
            value={minVal}
            onChange={(e) => setMinVal(e.target.value)}
            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <span>Max</span>
          <input
            type="number"
            min={0}
            value={maxVal}
            onChange={(e) => setMaxVal(e.target.value)}
            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
          >
            <option>KB</option>
            <option>MB</option>
            <option>GB</option>
          </select>
          <button
            onClick={() => {
              setIsCustom(true);
              applyCustom();
            }}
            className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Leave Max empty or 0 for no upper limit.
        </div>
      </div>
    </div>
  );
};

const TimeSection = ({ value, onChange }) => {
  const opts = [
    { value: "none", label: "None" },
    { value: "<1h", label: "Last 1 hour" },
    { value: "<3h", label: "Last 3 hours" },
    { value: "<6h", label: "Last 6 hours" },
    { value: "<24h", label: "Last 1 day" },
    { value: "<3d", label: "Last 3 days" },
    { value: "<5d", label: "Last 5 days" },
    { value: "<7d", label: "Last 1 week" },
    { value: "<14d", label: "Last 2 weeks" },
    { value: "<30d", label: "Last 1 month" },
    { value: ">30d", label: "Older than 30 days" },
  ];
  const [dir, setDir] = useState("<");
  const [num, setNum] = useState(7);
  const [unit, setUnit] = useState("d");
  const applyCustom = () => {
    const n = Math.max(1, Number(num) || 1);
    const str = `${dir}${n}${unit}`;
    onChange(str);
  };
  return (
    <div>
      <SectionTitle title="Time" subtitle="Modified time window" />
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {opts.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`px-3 py-2 rounded-lg text-sm border ${value === o.value ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" : "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-xl border border-slate-300 dark:border-slate-600">
        <div className="text-sm font-medium mb-2">Custom</div>
        <div className="flex items-center gap-2 text-sm">
          <select
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
          >
            <option value="<">Modified within last</option>
            <option value=">">Modified earlier than</option>
          </select>
          <input
            type="number"
            min={1}
            value={num}
            onChange={(e) => setNum(e.target.value)}
            className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
          >
            <option value="h">hours</option>
            <option value="d">days</option>
          </select>
          <button
            onClick={applyCustom}
            className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Apply
          </button>
        </div>
      </div>
      <div className="text-xs text-slate-500 mt-3">
        Created dates can be later than Modified on macOS when files are copied.
      </div>
    </div>
  );
};

const DEFAULT_EXCLUDED = [
  "node_modules",
  "venv",
  ".git",
  "__pycache__",
  ".idea",
  "dist",
  "build",
  ".vscode",
  "target",
  "bin",
  "obj",
];

const FoldersSection = ({
  sourceFolder,
  excluded,
  onToggle,
  custom,
  addCustom,
  removeCustom,
  clearCustom,
}) => {
  const [newFolder, setNewFolder] = useState("");
  const [showBrowser, setShowBrowser] = useState(false);
  const [tree, setTree] = useState({}); // { path: { loaded, children:[{name,path,hasChildren}] } }
  const [selectedNodes, setSelectedNodes] = useState(new Set()); // set of full paths

  const toggleNode = async (path) => {
    setTree((t) => {
      const node = t[path] || { loaded: false, expanded: false, children: [] };
      return { ...t, [path]: { ...node, expanded: !node.expanded } };
    });
    // fetch children if not loaded
    if (!tree[path]?.loaded) {
      const res = await listFolders(path);
      if (res.success) {
        const children = (res.data.folders || []).map((name) => {
          const childPath = path.endsWith("/")
            ? `${path}${name}`
            : `${path}/${name}`;
          return { name, path: childPath, hasChildren: true };
        });
        setTree((t) => ({
          ...t,
          [path]: { loaded: true, expanded: true, children },
        }));
      }
    }
  };

  const startAtSource = async () => {
    if (!sourceFolder) return;
    setShowBrowser(true);
    // prime root
    const res = await listFolders(sourceFolder);
    if (res.success) {
      const children = (res.data.folders || []).map((name) => {
        const childPath = sourceFolder.endsWith("/")
          ? `${sourceFolder}${name}`
          : `${sourceFolder}/${name}`;
        return { name, path: childPath, hasChildren: true };
      });
      setTree({ [sourceFolder]: { loaded: true, expanded: true, children } });
    } else {
      setTree({});
    }
  };

  const toggleSelect = (path) => {
    setSelectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const addSelectedToCustom = () => {
    const arr = Array.from(selectedNodes);
    arr.forEach((p) => {
      const name = p.split("/").filter(Boolean).pop();
      if (name) addCustom(name);
    });
    setShowBrowser(false);
    setSelectedNodes(new Set());
  };
  return (
    <div>
      <SectionTitle
        title="Folder Exclusions"
        subtitle="Skip known heavy or irrelevant folders"
      />
      <div className="mt-4">
        <div className="text-sm font-medium mb-2">Defaults</div>
        <div className="flex flex-wrap gap-2 items-center">
          {DEFAULT_EXCLUDED.map((f) => (
            <button
              key={f}
              onClick={() => onToggle(f)}
              className={`px-3 py-1.5 rounded-full text-xs border ${excluded?.has?.(f) ? "bg-red-600 text-white border-red-700" : "bg-green-100 text-green-800 border-green-300"}`}
            >
              {f}
            </button>
          ))}
          <span className="ml-3 text-xs text-slate-600 dark:text-slate-400">
            Legend:{" "}
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white">
              selected
            </span>{" "}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              not selected
            </span>
          </span>
        </div>
      </div>
      <div className="mt-6">
        <div className="text-sm font-medium mb-2">Custom</div>
        <div className="flex gap-2">
          <input
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            placeholder="e.g., .cache"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <button
            onClick={() => {
              if (newFolder.trim()) {
                addCustom(newFolder.trim());
                setNewFolder("");
              }
            }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Add
          </button>
          <button
            onClick={clearCustom}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Clear
          </button>
          <button
            disabled={!sourceFolder}
            onClick={startAtSource}
            className={`px-3 py-2 rounded-lg border ${sourceFolder ? "border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" : "border-slate-200 text-slate-400"}`}
          >
            Browse source folders
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {Array.from(custom || []).map((f) => (
            <span
              key={f}
              className="px-2 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
      {!sourceFolder && (
        <div className="mt-6 text-xs text-slate-500">
          Select a source folder to enable smart suggestions.
        </div>
      )}

      {showBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[680px] max-w-[95vw] max-h-[80vh] overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="font-semibold">Select folders to exclude</div>
              <button
                onClick={() => setShowBrowser(false)}
                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto" style={{ maxHeight: "60vh" }}>
              {sourceFolder && (
                <TreeNode
                  nodePath={sourceFolder}
                  name={
                    sourceFolder.split("/").filter(Boolean).pop() ||
                    sourceFolder
                  }
                  tree={tree}
                  onToggle={toggleNode}
                  selected={selectedNodes}
                  onSelect={toggleSelect}
                />
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowBrowser(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={addSelectedToCustom}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white"
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TreeNode = ({
  nodePath,
  name,
  tree,
  onToggle,
  selected,
  onSelect,
  level = 0,
}) => {
  const node = tree[nodePath] || {
    loaded: false,
    expanded: false,
    children: [],
  };
  return (
    <div className="ml-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(nodePath)}
          className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600"
        >
          {node.expanded ? "-" : "+"}
        </button>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.has(nodePath)}
            onChange={() => onSelect(nodePath)}
          />
          <span>{name}</span>
        </label>
      </div>
      {node.expanded && (
        <div className="ml-6 mt-2 space-y-1">
          {node.children.map((c) => (
            <TreeNode
              key={c.path}
              nodePath={c.path}
              name={c.name}
              tree={tree}
              onToggle={onToggle}
              selected={selected}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
          {!node.children.length && (
            <div className="text-xs text-slate-500">No subfolders</div>
          )}
        </div>
      )}
    </div>
  );
};

const DeepScanSection = ({
  enabled,
  setEnabled,
  mode,
  setMode,
  terms,
  addTerm,
  removeTerm,
  updateTerm,
}) => {
  return (
    <div>
      <SectionTitle
        title="Deep Scan"
        subtitle="Content-based hints (slower but smarter)"
      />
      <div className="mt-4 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!enabled}
            onChange={(e) => {
              const next = e.target.checked;
              if (next && !enabled) {
                const ok = window.confirm(
                  "Deep Scan reads file contents which can be slow on large folders. Continue?"
                );
                if (!ok) return;
              }
              setEnabled(next);
            }}
          />{" "}
          Enable deep scan
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
        >
          <option value="any">Any term</option>
          <option value="all">All terms</option>
        </select>
      </div>
      <div className="mt-4 space-y-2">
        {terms?.map?.((t, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={t}
              onChange={(e) => updateTerm(i, e.target.value)}
              placeholder="Add a hint term"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
            <button
              onClick={() => removeTerm(i)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          onClick={addTerm}
          className="mt-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Add term
        </button>
      </div>
      <div className="mt-3 text-xs text-slate-500">
        Use sparingly; combine with File Types or Project Type for best signal.
      </div>
    </div>
  );
};

const DuplicatesSection = ({ value, onChange }) => (
  <div>
    <SectionTitle
      title="Duplicates"
      subtitle="Choose whether to exclude duplicate filenames in results/export"
    />
    <div className="mt-4">
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />{" "}
        Exclude duplicates by filename
      </label>
    </div>
    <div className="mt-3 text-xs text-slate-500">
      Note: Detection is by filename only (paths may differ).
    </div>
  </div>
);

const AdvancedSection = () => (
  <div>
    <SectionTitle
      title="Advanced"
      subtitle="Low-frequency options and upcoming enhancements"
    />
    <ul className="list-disc ml-6 mt-3 text-sm text-slate-700 dark:text-slate-300">
      <li>Custom classification rules (coming soon)</li>
      <li>Performance tuning</li>
      <li>Export mapping templates</li>
    </ul>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
      {title}
    </h3>
    {subtitle && (
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {subtitle}
      </p>
    )}
  </div>
);

export default FilterHub;

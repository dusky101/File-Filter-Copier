import React from "react";
import {
  X,
  Info,
  Filter,
  FileText,
  FolderSearch,
  SlidersHorizontal,
  Sparkles,
  ListFilter,
  Layers,
  Ruler,
  Clock,
  FolderX,
  ScanSearch,
  Binary,
  Save,
  Play,
} from "lucide-react";

/**
 * InstructionsHub
 * A read-only drawer, styled like FilterHub, with a left nav of sections and rich guidance on using the app.
 */
const sections = [
  { id: "start", icon: FolderSearch, label: "Getting started" },
  { id: "quick", icon: Sparkles, label: "Quick Filters" },
  { id: "types", icon: SlidersHorizontal, label: "Filters overview" },
  { id: "filetypes", icon: Layers, label: "File Types" },
  { id: "exts", icon: ListFilter, label: "Extensions" },
  { id: "size", icon: Ruler, label: "Size" },
  { id: "time", icon: Clock, label: "Time" },
  { id: "folders", icon: FolderX, label: "Folder exclusions" },
  { id: "deep", icon: ScanSearch, label: "Deep scan" },
  { id: "dups", icon: Binary, label: "Duplicates" },
  { id: "preview", icon: Play, label: "Preview & Copy" },
  { id: "export", icon: FileText, label: "Export" },
  { id: "presets", icon: Save, label: "Presets" },
  { id: "tips", icon: Info, label: "Tips & Troubleshooting" },
];

const InstructionsHub = ({ open, onClose }) => {
  const [active, setActive] = React.useState("start");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[980px] max-w-[95vw] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex">
        <nav className="w-60 border-r border-slate-200 dark:border-slate-700 p-4 space-y-1 bg-slate-50/60 dark:bg-slate-900/40">
          {sections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${active === id ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Instructions
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {active === "start" && <GettingStarted />}
            {active === "quick" && <QuickFiltersHelp />}
            {active === "types" && <FiltersOverview />}
            {active === "filetypes" && <FileTypesHelp />}
            {active === "exts" && <ExtensionsHelp />}
            {active === "size" && <SizeHelp />}
            {active === "time" && <TimeHelp />}
            {active === "folders" && <FoldersHelp />}
            {active === "deep" && <DeepScanHelp />}
            {active === "dups" && <DuplicatesHelp />}
            {active === "preview" && <PreviewCopyHelp />}
            {active === "export" && <ExportHelp />}
            {active === "presets" && <PresetsHelp />}
            {active === "tips" && <TipsHelp />}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
      {title}
    </h3>
    {subtitle && (
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        {subtitle}
      </p>
    )}
  </div>
);

const List = ({ items }) => (
  <ul className="list-disc ml-6 space-y-1 text-sm text-slate-700 dark:text-slate-300">
    {items.map((t, i) => (
      <li key={i}>{t}</li>
    ))}
  </ul>
);

const GettingStarted = () => (
  <div>
    <SectionTitle
      title="Getting started"
      subtitle="Pick folders, choose filters, preview, then copy"
    />
    <List
      items={[
        "Select Source folder (files will be scanned here)",
        "Optional: Select Destination and name the Output folder (needed for copy)",
        "Toggle Dry Run if you only want a preview (no files will be copied)",
        "Open Filter Hub to refine by types, size, time, and more",
        "Click Run Preview to see results or Copy Files to copy them",
      ]}
    />
  </div>
);

const FiltersOverview = () => (
  <div>
    <SectionTitle
      title="Filters overview"
      subtitle="Every change applies immediately and is reflected in preview/export"
    />
    <List
      items={[
        "Quick Filters: one-tap presets you can toggle on/off. While selected they override related filters; unselect to restore your previous state.",
        "File Types: semantic categories (Code, Web, Documents, Media, Scripts…). Pick any combination.",
        "Extensions: comma-separated include/exclude lists (e.g., .js, .ts).",
        "Project Type: optional high-level roles (Models, Controllers, Services, …).",
        "Size & Time: choose from presets or build your own custom range.",
        "Folder Exclusions: skip heavy/noisy folders (defaults highlighted) or add custom names.",
        "Deep Scan: content-based hints; slower—use with care; combine with other filters for best signal.",
        "Duplicates: optionally remove duplicate filenames from results/export.",
      ]}
    />
  </div>
);

const QuickFiltersHelp = () => (
  <div>
    <SectionTitle
      title="Quick Filters"
      subtitle="Fast, reversible presets with shine hover and selection state"
    />
    <List
      items={[
        "Tap a preset to apply it. The button stays selected while active.",
        "Tap the same preset again to undo—it restores your pre-preset state.",
        "Press Reset in Filter Hub to clear all filters and any active preset.",
        "Examples: Recent changes (<7d), Large media (>100 MB + Video/Audio), Documents only, Source code only.",
      ]}
    />
  </div>
);

const FileTypesHelp = () => (
  <div>
    <SectionTitle
      title="File Types"
      subtitle="Choose categories to include in results"
    />
    <List
      items={[
        "Each chip toggles a semantic category (e.g., Text Documents, Spreadsheets, Presentations).",
        "Selections are combined—picking multiple categories broadens results.",
        "Use Clear to remove all selections.",
      ]}
    />
  </div>
);

const ExtensionsHelp = () => (
  <div>
    <SectionTitle
      title="Extensions"
      subtitle="Fine-grained include/exclude by file extension"
    />
    <List
      items={[
        "Enter extensions with a leading dot and separate by commas: .js, .ts, .map",
        "Include takes precedence over Exclude when both are set.",
        "Blur the input (or leave the field) to apply changes.",
      ]}
    />
  </div>
);

const SizeHelp = () => (
  <div>
    <SectionTitle title="Size" subtitle="Preset ranges or custom min–max" />
    <List
      items={[
        "Presets: Small (<1 MB), Medium (1–10 MB), Large (10–100 MB), Huge (>100 MB).",
        "Custom format sent to the backend: custom:<min>-<max><UNIT> with KB/MB/GB; leave max empty/0 for no upper limit.",
      ]}
    />
  </div>
);

const TimeHelp = () => (
  <div>
    <SectionTitle title="Time" subtitle="Modified time windows" />
    <List
      items={[
        "Choose presets like <24h, <7d, >30d or build your own (within/earlier than N hours/days).",
        "Note: On macOS, Created can be later than Modified after copying; filters key off Modified.",
      ]}
    />
  </div>
);

const FoldersHelp = () => (
  <div>
    <SectionTitle
      title="Folder exclusions"
      subtitle="Skip heavy or irrelevant folders by name"
    />
    <List
      items={[
        "Defaults include node_modules, .git, dist, build, etc. Selected defaults are highlighted.",
        "Custom exclusions match any path segment with that name (case-sensitive).",
        "Use Browse source folders to pick nested directory names to exclude.",
      ]}
    />
  </div>
);

const DeepScanHelp = () => (
  <div>
    <SectionTitle title="Deep scan" subtitle="Content-based hints (slower)" />
    <List
      items={[
        "Enable deep scan to search file contents using hint terms.",
        "Modes: Any term (OR) or All terms (AND).",
        "Performance: Consider combining with File Types or Size/Time to limit scope.",
      ]}
    />
  </div>
);

const DuplicatesHelp = () => (
  <div>
    <SectionTitle
      title="Duplicates"
      subtitle="Filter out duplicate filenames in results/export"
    />
    <List
      items={[
        "When enabled, only one instance per filename is kept; paths may differ.",
      ]}
    />
  </div>
);

const PreviewCopyHelp = () => (
  <div>
    <SectionTitle
      title="Preview & Copy"
      subtitle="Run a scan, review, then copy if desired"
    />
    <List
      items={[
        "Use Dry Run to preview without copying.",
        "Run Preview builds results with the current filter configuration.",
        "Copy Files takes the current filtered files and copies them to Destination/OutputFolder.",
        "Progress appears if a deep search is triggered by terms without deep scan enabled.",
      ]}
    />
  </div>
);

const ExportHelp = () => (
  <div>
    <SectionTitle
      title="Export"
      subtitle="Export preview data to CSV/TXT/JSON/HTML/Markdown"
    />
    <List
      items={[
        "Exports use a centralized formatter—dates are preformatted; no re-parsing.",
        "CSV columns: Name, Path, Size, Size (Formatted), Modified, Created, Type.",
      ]}
    />
  </div>
);

const PresetsHelp = () => (
  <div>
    <SectionTitle title="Presets" subtitle="Save and reuse configurations" />
    <List
      items={[
        "Use Save Preset to store the current filter configuration.",
        "Loading a preset will populate filters across sections; you can then tweak further.",
      ]}
    />
  </div>
);

const TipsHelp = () => (
  <div>
    <SectionTitle
      title="Tips & Troubleshooting"
      subtitle="Handy pointers and fixes"
    />
    <List
      items={[
        "If preview is slow, narrow results via File Types or a Time window.",
        "On macOS, Created date quirks are normal after copying—prefer Modified for recency.",
        "If the backend isn’t responding, ensure the Python FastAPI server is running (health check runs on app start).",
        "Use Exclude duplicates to simplify exports when filenames repeat across folders.",
      ]}
    />
  </div>
);

export default InstructionsHub;

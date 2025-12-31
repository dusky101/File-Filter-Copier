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
  Settings,
  Tag,
  Camera, // --- Added Camera Icon ---
} from "lucide-react";

/**
 * InstructionsHub
 * A read-only drawer, styled like FilterHub, with a left nav of sections and rich guidance on using the app.
 */
const sections = [
  { id: "start", icon: FolderSearch, label: "Getting started" },
  { id: "photo", icon: Camera, label: "Photo Mode" }, // --- Added Photo Mode Section ---
  { id: "quick", icon: Sparkles, label: "Quick Filters" },
  { id: "types", icon: SlidersHorizontal, label: "Filters overview" },
  { id: "cheatsheet", icon: Filter, label: "Filters cheat sheet" },
  { id: "filetypes", icon: Layers, label: "File Types" },
  { id: "exts", icon: ListFilter, label: "Extensions" },
  { id: "size", icon: Ruler, label: "Size" },
  { id: "time", icon: Clock, label: "Time" },
  { id: "folders", icon: FolderX, label: "Folder exclusions" },
  { id: "deep", icon: ScanSearch, label: "Deep scan" },
  { id: "dups", icon: Binary, label: "Duplicates" },
  { id: "advanced", icon: Settings, label: "Advanced" },
  { id: "matchers", icon: Tag, label: "Matchers (Globs/Regex)" },
  { id: "preview", icon: Play, label: "Preview & Copy" },
  { id: "export", icon: FileText, label: "Export" },
  { id: "presets", icon: Save, label: "Presets" },
  { id: "tips", icon: Info, label: "Tips & Troubleshooting" },
];

const InstructionsHub = ({ open, onClose, onOpenAdvanced }) => {
  const [active, setActive] = React.useState("start");

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                active === id
                  ? "bg-white dark:bg-slate-800 shadow text-slate-900 dark:text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60"
              }`}
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
            {active === "photo" && <PhotoHelp />}{" "}
            {/* --- Added Photo Help --- */}
            {active === "quick" && <QuickFiltersHelp />}
            {active === "types" && <FiltersOverview />}
            {active === "cheatsheet" && <CheatSheet />}
            {active === "filetypes" && <FileTypesHelp />}
            {active === "exts" && <ExtensionsHelp />}
            {active === "size" && <SizeHelp />}
            {active === "time" && <TimeHelp />}
            {active === "folders" && <FoldersHelp />}
            {active === "deep" && <DeepScanHelp />}
            {active === "dups" && <DuplicatesHelp />}
            {active === "advanced" && (
              <AdvancedHelp openAdvanced={onOpenAdvanced} />
            )}
            {active === "matchers" && <MatchersHelp />}
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

// --- NEW: Photo Help Component ---
const PhotoHelp = () => (
  <div className="space-y-6">
    <div>
      <SectionTitle
        title="Photo Mode"
        subtitle="Deep metadata analysis for photographers and archivists"
      />
    </div>

    <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
        Key Features
      </h3>
      <ul className="space-y-4">
        <li className="flex gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg h-fit text-blue-600 dark:text-blue-400">
            <ScanSearch className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">
              Deep Metadata Extraction
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Extracts detailed EXIF data including Camera Model, Lens, ISO,
              Aperture, Shutter Speed, and Image Dimensions.
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg h-fit text-emerald-600 dark:text-emerald-400">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">
              Smart Location Data
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Automatically converts GPS coordinates into readable "City,
              Country" names. This works entirely offline—no internet required.
            </div>
          </div>
        </li>
        <li className="flex gap-3">
          <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg h-fit text-purple-600 dark:text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">
              Date-Based Sorting
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              When copying with the "Date" structure, files are sorted by their
              actual <strong>Date Taken</strong> (from EXIF), not the file
              modification date. Ideal for organizing messy archives.
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <div className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
        Supported Formats
      </div>
      <p className="text-sm text-amber-700 dark:text-amber-300">
        Works with standard images (JPG, PNG), modern formats (HEIC, WEBP), and
        professional RAW files (CR2, NEF, ARW, DNG, ORF).
      </p>
    </div>
  </div>
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

const CheatSheet = () => (
  <div>
    <SectionTitle
      title="Filters cheat sheet"
      subtitle="A quick reference for common filters and examples"
    />
    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Filter</th>
            <th className="text-left px-4 py-2 font-medium">Values</th>
            <th className="text-left px-4 py-2 font-medium">Examples</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
          <tr>
            <td className="px-4 py-2 align-top">File Types</td>
            <td className="px-4 py-2 align-top">
              Code, Web, Documents, Media, Scripts…
            </td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">Code + Web</span>,{" "}
              <span className="font-mono">Documents only</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Extensions</td>
            <td className="px-4 py-2 align-top">
              Include/Exclude comma-separated
            </td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">.js, .ts</span>; exclude{" "}
              <span className="font-mono">.map, .tmp</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Size</td>
            <td className="px-4 py-2 align-top">Presets or custom</td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">custom:0-5MB</span>,{" "}
              <span className="font-mono">custom:100MB-inf</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Time</td>
            <td className="px-4 py-2 align-top">Presets or custom</td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">&lt;24h</span>,{" "}
              <span className="font-mono">&lt;7d</span>,{" "}
              <span className="font-mono">&gt;30d</span>,{" "}
              <span className="font-mono">&lt;2w</span>,{" "}
              <span className="font-mono">&gt;3m</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Folder exclusions</td>
            <td className="px-4 py-2 align-top">Defaults + custom names</td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">node_modules, dist, build</span>;
              respect <span className="font-mono">.gitignore</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Deep scan</td>
            <td className="px-4 py-2 align-top">Any/All terms; max size</td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">api</span>,{" "}
              <span className="font-mono">token</span>; skip &gt;{" "}
              <span className="font-mono">50 MB</span>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-2 align-top">Advanced</td>
            <td className="px-4 py-2 align-top">
              Hidden, symlinks, depth, time attr, globs/regex
            </td>
            <td className="px-4 py-2 align-top">
              <span className="font-mono">**/src/**</span>,{" "}
              <span className="font-mono">*.md</span>,{" "}
              <span className="font-mono">.*\.(map|tmp)$</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div className="mt-3 text-xs text-slate-500">
      Globs are simple wildcards (<span className="font-mono">*</span>,{" "}
      <span className="font-mono">?</span>,{" "}
      <span className="font-mono">**</span>). Use regex for precise rules;
      escape dots like <span className="font-mono">\.</span>.
    </div>
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
        "Examples: custom:0-5MB (0 to 5 MB), custom:100MB-inf (>= 100 MB)",
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
        "Also supported: weeks (w) and months (m), e.g., <2w, >3m.",
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
        "If ‘Respect .gitignore’ is enabled under Advanced, files matched by .gitignore at the project root will be hidden as well.",
      ]}
    />
  </div>
);

const DeepScanHelp = () => (
  <div>
    <SectionTitle title="Deep scan" subtitle="Content-based hints (slower)" />
    <List
      items={[
        "Enable deep scan to search file contents using hint terms (one per line).",
        "Modes: Any term (OR) or All terms (AND).",
        "Deep scan max size: optionally skip scanning files larger than a threshold.",
        "Live progress: when deep scan runs with a progress channel, you’ll see current file and bytes processed.",
        "Performance: Combine with File Types/Project Type or Size/Time to keep scans fast.",
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
        "Progress appears for deep scans when a progress channel is active.",
      ]}
    />
  </div>
);

const ExportHelp = () => (
  <div>
    <SectionTitle
      title="Export"
      subtitle="Save scan results in various formats for reporting or external use"
    />
    <List
      items={[
        "Interactive HTML: Generates a self-contained report with built-in search, sorting, and category filtering. Great for sharing with teams.",
        "CSV: Spreadsheet-ready export. Columns include Name, Path, Classification, Extension, Size (bytes & formatted), Modified, and Created dates.",
        "Markdown: Clean, formatted lists suitable for pasting into documentation or GitHub issues. Supports grouping by file type.",
        "JSON: Full data dump including all metadata fields, ideal for programmatic processing or piping into other tools.",
        "Text: A simple, human-readable list of filenames and paths.",
        "Note: If you select specific files in the Preview tab (using checkboxes), only those files will be exported.",
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
        "Default preset: you can mark a preset as default and load it on startup from the presets menu.",
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
        "If the backend isn’t responding, ensure the Python FastAPI server is running (the app performs a health check on start).",
        "Use Exclude duplicates to simplify exports when filenames repeat across folders.",
        "Globs vs Regex: prefer globs for simple wildcards (e.g., **/dist/**, *.md); use regex for precise rules (e.g., (^|/)src($|/), .*\\.(map|tmp)$).",
        "Respect .gitignore can hide files you expect—toggle it off under Advanced if you’re missing results.",
      ]}
    />
    <div className="mt-4">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
        Why no results?
      </div>
      <ul className="list-disc ml-6 space-y-1 text-sm text-slate-700 dark:text-slate-300">
        <li>
          Time window is too strict (e.g.,{" "}
          <span className="font-mono">&lt;24h</span>); widen or clear Time.
        </li>
        <li>
          Include extensions set but don’t match your files; remove Include or
          add the right ones.
        </li>
        <li>
          Exclude extensions remove everything (e.g.,{" "}
          <span className="font-mono">.*</span>); clear Exclude.
        </li>
        <li>
          Max depth &gt; 0 stops traversal into subfolders; set to 0 (unlimited)
          under Advanced.
        </li>
        <li>
          <span className="font-mono">Respect .gitignore</span> hides matched
          files; toggle it off under Advanced.
        </li>
        <li>
          Hidden files are off; enable “Include hidden” if you need dotfiles.
        </li>
        <li>
          Name globs/regex exclude too broadly; temporarily clear matchers to
          verify.
        </li>
        <li>
          Folder exclusions match a key directory name you’re targeting; review
          the exclusions list.
        </li>
      </ul>
    </div>
  </div>
);

const AdvancedHelp = ({ openAdvanced }) => (
  <div>
    <SectionTitle
      title="Advanced"
      subtitle="Traversal, visibility, VCS rules, and name matchers"
    />
    <List
      items={[
        "Include hidden: include dotfiles and hidden folders in results.",
        "Follow symlinks: traverse symbolic links during scanning.",
        "Max depth: limit recursion depth (0 = unlimited).",
        "Time attribute: choose Modified (mtime), Created (ctime), or Accessed (atime) for time filters.",
        "Respect .gitignore: apply patterns from the project root .gitignore to hide matches.",
        "Name Globs (include/exclude): simple wildcards that match filename or full path (supports *, ?, **).",
        "Regex (include/exclude): advanced patterns applied to filename and full path; anchors ^ and $ match string start/end; use (^|/) for folder boundaries.",
        "Deep scan max size: skip content scanning for files larger than the specified size.",
      ]}
    />
    {openAdvanced && (
      <div className="mt-3">
        <button
          onClick={openAdvanced}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Open Advanced panel
        </button>
      </div>
    )}
  </div>
);

const MatchersHelp = () => (
  <div>
    <SectionTitle
      title="Matchers (Globs & Regex)"
      subtitle="Quick examples for common patterns"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="font-medium mb-2">Globs</div>
        <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-300">
          <li>
            Include under <span className="font-mono">src</span>:{" "}
            <span className="font-mono">**/src/**</span>
          </li>
          <li>
            Markdown files: <span className="font-mono">*.md</span>
          </li>
          <li>
            Jest tests: <span className="font-mono">**/*.test.js</span>
          </li>
          <li>
            Exclude build output: <span className="font-mono">**/dist/**</span>
          </li>
          <li>
            Exclude logs: <span className="font-mono">*.log</span>
          </li>
        </ul>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="font-medium mb-2">Regex</div>
        <ul className="list-disc ml-5 space-y-1 text-slate-700 dark:text-slate-300">
          <li>
            Files starting with <span className="font-mono">test-</span>:{" "}
            <span className="font-mono">(^|/)test-.*\.js$</span>
          </li>
          <li>
            Only under <span className="font-mono">src</span> folder:{" "}
            <span className="font-mono">(^|/)src($|/)</span>
          </li>
          <li>
            Exclude <span className="font-mono">__snapshots__</span> folders:{" "}
            <span className="font-mono">(^|/)__snapshots__($|/)</span>
          </li>
          <li>
            Extensions <span className="font-mono">.map</span> or{" "}
            <span className="font-mono">.tmp</span>:{" "}
            <span className="font-mono">.*\.(map|tmp)$</span>
          </li>
        </ul>
      </div>
    </div>
    <div className="mt-3 text-xs text-slate-500">
      Regex and glob checks are case-insensitive and apply to both filename and
      full path. Escape dots in regex with <span className="font-mono">\.</span>
      .
    </div>
  </div>
);

export default InstructionsHub;

import React from "react";
import useFilterStore from "../../stores/useFilterStore";

const AdvancedFilterHub = () => {
  const {
    includeHidden,
    setIncludeHidden,
    followSymlinks,
    setFollowSymlinks,
    maxDepth,
    setMaxDepth,
    timeAttribute,
    setTimeAttribute,
    respectGitignore,
    setRespectGitignore,
    nameGlobInclude,
    setNameGlobInclude,
    nameGlobExclude,
    setNameGlobExclude,
    nameRegexInclude,
    setNameRegexInclude,
    nameRegexExclude,
    setNameRegexExclude,
    deepScanMaxSizeMB,
    setDeepScanMaxSizeMB,
  } = useFilterStore();

  return (
    <div>
      <SectionTitle
        title="Advanced"
        subtitle="Traversal, matching rules, and performance controls"
      />

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-medium mb-2">Traversal & Performance</div>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={!!followSymlinks}
              onChange={(e) => setFollowSymlinks(e.target.checked)}
            />
            Follow symlinks
          </label>
          <label className="flex items-center gap-2 text-sm mb-2">
            <input
              type="checkbox"
              checked={!!includeHidden}
              onChange={(e) => setIncludeHidden(e.target.checked)}
            />
            Include hidden files and folders
          </label>
          <div className="flex items-center gap-2 text-sm mb-2">
            <span>Max depth</span>
            <input
              type="number"
              min={0}
              placeholder="0 = unlimited"
              value={Number(maxDepth) || 0}
              onChange={(e) =>
                setMaxDepth(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Deep scan max size</span>
            <input
              type="number"
              min={0}
              value={Number(deepScanMaxSizeMB) || 0}
              onChange={(e) =>
                setDeepScanMaxSizeMB(Math.max(0, Number(e.target.value) || 0))
              }
              className="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            />
            <span>MB (0 = no limit)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-medium mb-2">Time & VCS</div>
          <label className="text-sm">Time attribute</label>
          <select
            value={timeAttribute || "mtime"}
            onChange={(e) => setTimeAttribute(e.target.value)}
            className="mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
          >
            <option value="mtime">Modified</option>
            <option value="ctime">Created</option>
            <option value="atime">Accessed</option>
          </select>
          <label className="flex items-center gap-2 text-sm mt-3">
            <input
              type="checkbox"
              checked={!!respectGitignore}
              onChange={(e) => setRespectGitignore(e.target.checked)}
            />
            Respect .gitignore
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-medium mb-2">Name/Path Globs</div>
          <div className="text-xs mb-1 text-slate-500">
            Comma or newline separated; matches filename or full path (*, ?, **)
          </div>
          <label className="text-sm">Include</label>
          <textarea
            rows={3}
            value={nameGlobInclude || ""}
            onChange={(e) => setNameGlobInclude(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="e.g., **/src/**, *.md"
          />
          <label className="text-sm mt-3 block">Exclude</label>
          <textarea
            rows={3}
            value={nameGlobExclude || ""}
            onChange={(e) => setNameGlobExclude(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
            placeholder="e.g., **/dist/**, *.log"
          />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="font-medium mb-2">Regex Matchers</div>
          <div className="text-xs mb-1 text-slate-500">
            Applied to filename and full path
          </div>
          <label className="text-sm">Include (regex)</label>
          <input
            value={nameRegexInclude || ""}
            onChange={(e) => setNameRegexInclude(e.target.value)}
            placeholder="e.g., (^|/)test-.*\\.js$"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
          <label className="text-sm mt-3 block">Exclude (regex)</label>
          <input
            value={nameRegexExclude || ""}
            onChange={(e) => setNameRegexExclude(e.target.value)}
            placeholder="e.g., (^|/)__snapshots__/"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
          />
        </div>
      </div>
    </div>
  );
};

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

export default AdvancedFilterHub;

# File Filter Copier

A desktop app that scans folders, filters files using powerful criteria (size, time, types, deep content), previews results, and optionally copies them into a structured output folder with a log. Built with Electron + React (renderer) and a FastAPI backend.

- Frontend: React 19 + Zustand state, Tailwind UI, packaged with Electron Forge + Vite
- Backend: FastAPI + Uvicorn running locally on <http://localhost:8000>
- Platform: macOS, Windows, Linux (Electron); file scanning logic runs in Python

## Quick Start

Prerequisites

- Node.js 18+ and pnpm/npm/yarn
- Python 3.10+ (virtualenv recommended)

1) Backend: start FastAPI

    - In a terminal:
    - cd backend
    - python -m venv venv
    - source venv/bin/activate  # Windows: venv\Scripts\activate
    - pip install -r requirements.txt
    - python main.py
2) Frontend/Electron: run the app

    - npm install
    - npm run start
    - Electron window will open (Vite dev server powers the renderer)

    Build app binaries

    - npm run make

## What the App Does (User Guide)

- Choose a source folder to scan
- Optionally set a destination folder and output folder name
  - Dry Run enabled: preview only (no copy)
  - Dry Run disabled: app will copy matching files to Destination/outputFolderName and write a log file
  
  - Configure filters (Filters drawer):
    - Quick Filters: one-click presets (e.g., Recent <7d, Large Media, Code Only, Docs Only)
    - Extensions: include and/or exclude lists
    - Time: preset buttons plus custom rules like <10d (within last 10 days) or >2h (older than 2 hours)
    - Size: all, small (<1 MB), medium (1–10 MB), large (10–100 MB), huge (>100 MB), or a custom range
    - File Types: semantic categories (Documents, Media, Development, Archives)
    - Project Type: semantic roles (Models, Views, Controllers, Services, Utilities, Tests, etc.)
    - Folder Exclusions: toggle common folders (node_modules, venv, .git, __pycache__, dist, build, etc.) and add your own; includes a browser to pick subfolders from the source path
    - Deep Scan: provide keywords to search inside files; supports Any/All matching and live progress (SSE)
    - Advanced: include hidden files, follow symlinks, limit max depth, respect .gitignore, name glob include/exclude (supports *, ?, **), regex include/exclude, and a deep scan max size (skip very large files)
- Click Run Preview to scan and, if Dry Run is on, see a sortable, searchable table of matching files
  - Duplicate filenames are automatically disambiguated (file_1.ext, file_2.ext, ...)
- Presets: save your current configuration and load/delete presets later

## Architecture Overview

High level

- React renderer implements the UI, manages state with Zustand, and calls the backend via HTTP (axios)
- FastAPI backend performs scanning, deep content matching, and copy operations; supports SSE for progress

Process boundaries

- Electron Main (Node): window lifecycle, IPC, file dialogs
- Preload (Node): contextBridge exposing selectFolder/getAppVersion to the renderer
- Renderer (React): UI components, zustand stores, calls backend on <http://localhost:8000/api>
- Backend (Python): /api/scan, /api/copy, /api/presets/*, /api/health, /api/progress/*

Data flow (Preview)

1. User sets filters in UI; Zustand store packs them into a ScanRequest
2. Renderer optionally opens a progress channel (/progress/start) when deep scan terms are present
3. Renderer calls POST /scan with filters (and x-progress-id header for SSE)
4. Backend filters files by size/time/types/extensions/hidden rules; optionally deep scans file contents; emits SSE updates
5. Backend returns ScanResponse: file list with sizes/timestamps and duplicates map
6. Renderer stores results, renders table with sort/search/pagination

Data flow (Copy)

1. Renderer reuses a fresh scan to get file paths
2. Renderer calls POST /copy with { files, destination, output_folder }
3. Backend copies files, ensures unique names, writes files-with-structure.txt in output folder

## Frontend (Renderer) Breakdown

Entrypoints and wiring

- package.json: uses Electron Forge + Vite; main entry is .vite/build/main.js in dev/build
- main.js (Electron main): creates BrowserWindow, sets preload.js, handles IPC handlers:
  - dialog:openFolder -> native folder chooser
  - app:getVersion -> app version
- preload.js: Exposes window.electron.selectFolder() and getAppVersion() safely

Service layer

- src/services/api.js
  - axios client baseURL <http://localhost:8000/api>
  - scanFiles(filters, { progressId })
  - startProgress() -> POST /progress/start
  - copyFiles({ files, outputFolder, destination }) -> POST /copy
  - savePreset(name, config), loadPreset(name), listPresets(), deletePreset(name)
  - healthCheck()
  - parseExtensions(), formatFileSize(), formatTimestamp() helpers
  - listFolders(path) -> GET /folders?path=... (used by Folder Exclusions browser)

State stores (Zustand)

- src/stores/useFilterStore.js
  - Source/destination/output names; dryRun toggle
  - Include/exclude extensions strings
  - Size/time filters; size supports presets and custom ranges (e.g., custom:0-5MB)
  - Selected File Types and Project Types (Sets of names)
  - Excluded folders (persistent defaults + custom session-only); folder browser to add names
  - Deep scan flags, terms array, mode any/all, deep scan max size
  - Advanced options: includeHidden, followSymlinks, maxDepth, timeAttribute (mtime/ctime/atime), respectGitignore, nameGlobInclude/Exclude, nameRegexInclude/Exclude
  - getFilterConfig() builds the backend ScanRequest payload accordingly
  - Persisted subset includes size/time/excluded folders/deep-scan mode/selected types and advanced toggles
- src/stores/usePreviewStore.js
  - Holds results: files[], duplicates{}, pagination, sort, search
  - Selection for export or copy; exportAsText/CSV utilities
- src/stores/useSettingsStore.js
  - Theme, display columns, animation, default pagination/sort, export preferences
  - Persists and applies theme (system/light/dark)

UI components (selected)

- src/App.jsx
  - Orchestrates health check, preview/copy actions, preset save, and deep-scan progress modal
  - Uses startProgress + scanFiles; closes modal when SSE reports done
- components/main-config/MainConfigSection.jsx
  - Source/Destination pickers via window.electron.selectFolder()
  - Output folder name and Dry Run toggle
- components/filters/FilterHub.jsx
  - Central “Filters” drawer with sections: Quick Filters, File Types, Extensions, Project Type, Size, Time, Folder Exclusions, Deep Scan, Duplicates, Advanced
- components/filters/AdvancedFilterHub.jsx
  - Advanced controls: include hidden, follow symlinks, max depth, time attribute (mtime/ctime/atime), respect .gitignore, name glob include/exclude, regex include/exclude, deep scan max size
- components/preview/PreviewSection.jsx
  - Search/sort/pagination; shows duplicates warning; export button
- components/progress/DeepScanProgressModal.jsx
  - Opens EventSource to /api/progress/{id}/stream; shows files/bytes progress and current file

Utilities

- src/utils/fileTypes.js: groups and labels used by the selector and table
- src/utils/exportUtils.js: export preview to txt/csv/json/md/html

Electron specifics

- Folder selection relies on preload bridge; in a plain browser (vite preview), a warning is shown

## Backend (FastAPI) Breakdown

Entrypoint and middleware

- backend/main.py
  - FastAPI app with CORS allowing <http://localhost:5173/5174> (Vite)
  - Includes router under /api
  - Uvicorn runner (python main.py) and startup/shutdown logs

Routes and models

- backend/api/routes.py
  - POST /progress/start -> returns progress_id for SSE
  - GET /progress/{pid}/stream -> text/event-stream for deep scan progress
  - POST /scan -> ScanResponse
    - Validates folder
    - Optionally estimates totals for SSE (pre-scan pass) and emits progress updates during deep scan
    - Pipeline: core.filter_files -> features.filter_by_extension -> features.filter_hidden_files -> duplicate detection
  - POST /copy -> CopyResponse; validates destination, creates destination/output folder, copies, writes log
  - GET /folders -> lists immediate subfolders under a given path (used by Folder Exclusions browser)
  - Presets: POST /presets/save, GET /presets/list, GET /presets/{name}, DELETE /presets/{name}
  - GET /health -> backend status
- backend/api/models.py
  - Pydantic models: ScanRequest/Response, FileResult; CopyRequest/Response; PresetRequest/Response

Core logic

- backend/core/filters.py
  - SIZE_FILTERS buckets; time filter parsing (<1h, <7d, >30d, etc.)
  - filter_files(): walks tree, filters by size/time; semantic match by FILE_TYPE_PATTERNS and optionally deep scan
  - get_semantic_match(): extension/name pattern match; deep scan terms (OR/AND) with per-file progress callback
- backend/core/file_types.py
  - FILE_TYPE_PATTERNS: semantic groups aligned to UI
  - CONTENT_MARKERS: content hints (not strictly required for deep scan terms)
  - TYPE_GROUPS/TYPE_COLORS: useful for UI mapping if needed
- backend/core/file_ops.py
  - copy_files_and_log(): copies with safe filenames and ensure_unique_path(); writes files-with-structure.txt
- backend/core/duplicate_checker.py
  - detect_duplicates(): groups by basename to identify collisions
- backend/core/utils.py
  - format_size(), format_timestamp(), safe_filename(), ensure_unique_path()

Features

- backend/features/extension_filter.py: post-filter by include/exclude extension sets
- backend/features/hidden_filter.py: drop dotfiles/system metadata/hidden dirs and user-excluded folder names
- backend/features/preset_manager.py: JSON-based storage for filter presets
- backend/features/exclude_folders.py: default list + JSON persistence for excluded folder names (UI sets names)

Progress (SSE)

- backend/api/progress.py: ProgressManager creates channels; stream() yields text/event-stream updates
  - Fields: total_files/bytes, processed_files/bytes, current, done
  - routes.py estimates totals before deep scan and updates via progress_callback during deep scan

## Configuration and Build

Electron + Vite + Forge

- forge.config.js and vite.*.config.mjs handle bundling main, preload, renderer
- package.json scripts: start/package/make/publish
- main.js uses dev server url when present; otherwise loads built assets

Backend dependencies

- backend/requirements.txt pins FastAPI, Uvicorn, Pydantic v2, CORS middleware; optional orjson

Ports and URLs

- Frontend dev: Vite default 5173
- Backend: <http://localhost:8000> (CORS configured)
- SSE stream: <http://localhost:8000/api/progress/{progress_id}/stream>

Environment notes

- App expects backend already running; UI shows a hint card with command
- You can change API base in src/services/api.js if you bind FastAPI elsewhere

## Extending the App (Developer Guide)

This section lists common extension points and the exact files to touch.

Add a new semantic file type (e.g., "3D Models")

1. backend/core/file_types.py
   - Add to FILE_TYPE_PATTERNS: "3D Models": [".obj", ".fbx", ".glb"]
   - Optionally add to CONTENT_MARKERS and TYPE_COLORS
   - Optionally group it in TYPE_GROUPS
2. frontend: src/utils/fileTypes.js
   - Add new entry in the appropriate group for the selector
3. UI: FilterHub File Types shows the new option automatically via fileTypeGroups

Add a new filter control (e.g., minimum filename length)

1. Frontend state: src/stores/useFilterStore.js
   - Add state variable and setter; include in getFilterConfig()
2. UI: src/components/filters/FilterHub.jsx
   - Add the new control bound to the store
3. Backend models: backend/api/models.py
   - Add field to ScanRequest
4. Backend route: backend/api/routes.py
   - Read the field and pass to core.filters.filter_files or a new function
5. Core logic: backend/core/filters.py (or a new module)
   - Implement the actual filtering logic

Modify size/time presets or semantics

- Update SIZE_FILTERS in backend/core/filters.py and the Size and Time sections in FilterHub.jsx

Add a copy option (e.g., preserve subfolders)

1. Models: backend/api/models.py -> extend CopyRequest
2. Route: backend/api/routes.py -> implement folder replication logic
3. Frontend: add control in MainConfigSection and supply to copyFiles() payload

Add additional progress metrics

1. backend/api/progress.py -> extend ProgressChannel fields
2. routes.py -> populate the fields in estimation and progress_callback
3. frontend/components/progress/DeepScanProgressModal.jsx -> render new metrics

Add a new preset capability

1. Store: useFilterStore.loadPresetConfig() maps backend config to store state
2. Backend: features/preset_manager.py already persists JSON

## API Reference (Backend)

Base URL: <http://localhost:8000/api>

- POST /scan
  - Body: ScanRequest
    - folder: string
  - size_filter: 'all' | 'small' | 'medium' | 'large' | 'huge' | legacy strings ('>1KB', etc.) | custom: `custom:&lt;min&gt;-&lt;max&gt;&lt;UNIT&gt;` (UNIT in KB|MB|GB; e.g., custom:0-5MB, custom:100MB-inf)
    - time_filter: 'none' | '<1h' | '<24h' | '<7d' | '>30d' | other '<Nh'/'<Nd' values; backend also supports 'w' (weeks) and 'm' (months)
    - time_attribute: 'mtime' | 'ctime' | 'atime'
    - selected_types: string[]
    - project_types?: string[]
    - deep_scan: boolean
    - deep_scan_terms: string[]
    - deep_scan_mode: 'OR' | 'AND' (UI uses 'any'|'all' which maps to OR/AND)
    - include_exts?: string[]
    - exclude_exts?: string[]
    - excluded_folders?: string[]
    - follow_symlinks?: boolean
    - include_hidden?: boolean
    - max_depth?: number (0 = unlimited)
    - respect_gitignore?: boolean
    - name_glob_include?: string[]
    - name_glob_exclude?: string[]
    - name_regex_include?: string
    - name_regex_exclude?: string
    - deep_scan_max_size_bytes?: number (skip deep scan for files larger than this)
  - Headers: x-progress-id optional when deep_scan (enables SSE progress)
  - Returns: ScanResponse { success, total_files, files[], duplicates{}, error? }

- POST /copy
  - Body: CopyRequest { files: string[], output_folder: string, destination: string }
  - Returns: CopyResponse { success, copied_count, output_path, log_file, error? }

- POST /presets/save { name, config }
- GET /presets/list -> { success, presets: string[] }
- GET /presets/{name} -> { success, config }
- DELETE /presets/{name}

- POST /progress/start -> { progress_id }
- GET /progress/{id}/stream -> text/event-stream (SSE)

- GET /folders?path=/absolute/source/path -> { success, path, folders: string[], count }

- GET /health -> { status: 'ok' }

## Troubleshooting

- Backend not responding
  - Ensure Python env is active and main.py is running on port 8000
  - Use curl <http://localhost:8000/api/health> or open <http://localhost:8000/docs>
- CORS errors in console
  - Backend CORS allows localhost:5173/5174; if you run the renderer on a different port/host, update CORS in backend/main.py
- "Folder selection requires Electron" message
  - You launched the renderer in a regular browser; run via Electron: npm run start
- Deep scan is slow
  - Only text files are read; binary files are skipped by errors='ignore'
  - Reduce terms, use OR instead of AND, or limit by size/time/types first
- Copy failed: destination not found
  - The destination folder path must exist; the app creates only the final output folder under it

## Project Structure

Top-level

- main.js, preload.js: Electron main and preload scripts
- forge.config.js, vite.*.config.mjs: build configs
- src/: React renderer source
- backend/: FastAPI backend

Backend

- api/
  - routes.py: all endpoints
  - models.py: Pydantic models
  - progress.py: SSE progress manager
- core/
  - filters.py, file_types.py, file_ops.py, duplicate_checker.py, utils.py
- features/
  - extension_filter.py, hidden_filter.py, preset_manager.py, exclude_folders.py
- requirements.txt, main.py, filter_presets.json, excluded_folders.json

Frontend

- src/App.jsx: app orchestration
- src/services/api.js: backend API client
- src/stores/: zustand stores for filters, preview, settings
- src/components/: MainConfigSection, FilterHub, AdvancedFilterHub, PreviewSection, DeepScanProgressModal, layout
- src/utils/: fileTypes.js (selector groups), exportUtils.js (export)

## Contributing

- Fork and branch from main
- Keep UI and backend names aligned (e.g., new file type names)
- Prefer small PRs; add notes in README when introducing new settings or filters

License: MIT

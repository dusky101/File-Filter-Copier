## File Filter Copier – Copilot guide (essentials)

This repo is an Electron Forge + Vite desktop app (React 19 renderer) with a FastAPI backend used for file scanning, deep content search, and copying. These notes capture how the pieces talk to each other and how to extend them safely.

### Big picture

- Main process: `main.js` creates the window, seeds user config, and starts/awaits the backend (venv bootstrap in dev; packaged PyInstaller binary in prod).
- Preload bridge: `preload.js` exposes `window.electron.selectFolder()` and `getAppVersion()` (contextIsolation on; no Node in renderer).
- Renderer: React UI in `src/**`, state via Zustand; backend calls centralized in `src/services/api.js` (axios base `http://localhost:8000/api`).
- Backend: FastAPI app in `backend/` with routes in `api/routes.py`, models in `api/models.py`, progress SSE in `api/progress.py`, and core filtering/copy logic under `core/**`.

### Run and build

- Dev (option A): run backend then Electron
  - Backend: from `backend/` create venv, `pip install -r requirements.txt`, run `python main.py`.
  - Electron/renderer: `npm install` then `npm start`.
- Dev (option B): just `npm start` — `main.js` will create a userData venv and spawn the backend if 127.0.0.1:8000 isn’t up.
- Package app: `npm run make` (Forge). The packaged app expects a PyInstaller binary at `backend/dist/file-filter-backend` (see `backend/file-filter-backend.spec` and `forge.config.js` extraResource).

### Contracts and patterns that matter

- API base: `http://localhost:8000/api`.
- Scan (`POST /scan`) accepts fields from `useFilterStore.getFilterConfig()` including:
  - `folder`, `size_filter` ('all'|'small'|'medium'|'large'|'huge' or legacy like `>1KB`), `time_filter` ('none', `<Nh|Nd|Nw|Nm`, `>Nd`).
  - `selected_types` (semantic groups in `backend/core/file_types.py`) and optional `project_types`.
  - Deep scan: `deep_scan`, `deep_scan_terms`, `deep_scan_mode` ('OR'|'AND'); UI stores 'any'|'all' and maps to these.
  - Name filters: `name_glob_include/exclude`, `name_regex_include/exclude`; `respect_gitignore` applies root `.gitignore` patterns.
  - Size custom form: `custom:<min>-<max><UNIT>` e.g., `custom:0-5MB`, `custom:100MB-inf`.
- Responses:
  - Scan returns `{ success, total_files, files: FileResult[], duplicates }`; Copy returns `{ success, copied_count, output_path, log_file }`.
- Progress SSE: `POST /progress/start` → `{progress_id}`; call `/scan` with header `x-progress-id`; subscribe to `GET /progress/{id}/stream` for `{ total_files/bytes, processed_files/bytes, current, done }`.

### Frontend conventions

- State: `src/stores/useFilterStore.js` holds filters; `getFilterConfig()` builds the exact request body the backend expects. Sets are persisted as arrays and rehydrated to Sets.
- API wrapper: `src/services/api.js` owns axios, headers, timeouts, and maps `copyRequest.outputFolder` → backend `output_folder`.
- IPC channels: `dialog:openFolder`, `app:getVersion`, and `app:getIconDataUrl` (returns app icon as data URL).

### Backend conventions

- Filters: see `backend/core/filters.py` (`SIZE_FILTERS`, time parsing, deep scan OR/AND). Hidden/system and excluded folders handled in features (`hidden_filter.py`, `exclude_folders.py`).
- Defaults: excluded folder names = JSON file (`backend/excluded_folders.json`) ∪ built-ins; `.gitignore` respected only if `respect_gitignore` is true.
- Copy: `core/file_ops.py` ensures unique names and writes `files-with-structure.txt` under the output folder.

### Common change recipes

- New semantic file type: add patterns in `backend/core/file_types.py` and mirror in the UI groups in `src/utils/fileTypes.js`.
- New filter input: add state + `getFilterConfig()` mapping in `useFilterStore`; extend models (`backend/api/models.py`), use in `api/routes.py`, and implement in `core/filters.py` or a new feature module.
- New API endpoint: define Pydantic models, add a route, wire core logic, and add a thin wrapper in `src/services/api.js`.

### Key files to open first

- `package.json`, `forge.config.js`, `main.js`, `preload.js`
- `src/services/api.js`, `src/stores/useFilterStore.js`, `src/App.jsx`
- `backend/main.py`, `backend/api/routes.py`, `backend/api/models.py`, `backend/core/filters.py`

If anything here seems off (ports, headers, or script names), check `README.md` and the files above, then update this doc. Ping for unclear areas like preset storage, SSE handling, or packaging the backend binary.

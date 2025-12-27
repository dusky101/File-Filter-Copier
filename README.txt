FILE FILTER COPIER
Version 1.0.0
---------------------------------------------------------------------------

File Filter Copier is a powerful desktop utility that scans folders, filters 
files using advanced criteria (size, time, types, deep content), previews 
results, and optionally copies them into a structured output folder with a log.

---------------------------------------------------------------------------
USER GUIDE
---------------------------------------------------------------------------

1. CHOOSE FOLDERS
   - Select a Source Folder to scan.
   - Optionally set a Destination Folder and Output Name.
   - Toggle "Dry Run" to preview results without copying files.

2. CONFIGURE FILTERS
   - Quick Filters: One-click presets (e.g., Recent <7d, Large Media).
   - Extensions: specific include/exclude lists.
   - Time: Rules like <10d (last 10 days) or >2h (older than 2 hours).
   - Size: Small (<1MB), Medium, Large, or Custom ranges.
   - File Types: Semantic categories (Documents, Media, Code, Archives).
   - Folder Exclusions: Skip 'node_modules', '.git', etc.
   - Deep Scan: Search inside files for specific keywords.
   - Advanced: Regex matching, hidden files, symlinks, and more.

3. PREVIEW & RUN
   - Click "Run Preview" to see a sortable table of matching files.
   - If satisfied, run the Copy operation to organise your files.
   - Duplicate filenames are automatically handled (file_1.ext).

---------------------------------------------------------------------------
FILTERS CHEAT SHEET
---------------------------------------------------------------------------

SIZE EXAMPLES:
  - small   (< 1 MB)
  - large   (10–100 MB)
  - huge    (> 100 MB)
  - custom  (e.g., custom:0-5MB or custom:100MB-inf)

TIME EXAMPLES:
  - <7d     (Within the last 7 days)
  - >30d    (Older than 30 days)
  - <24h    (Within the last 24 hours)

ADVANCED MATCHING:
  - Glob:   **/src/** or  *.md
  - Regex:  (^|/)test-.*\.js$

---------------------------------------------------------------------------
TROUBLESHOOTING
---------------------------------------------------------------------------

- Deep Scan is slow:
  Only text files are read; binary files are skipped. To speed it up,
  reduce search terms or limit the scan by file size/type first.

- Copy failed / Destination not found:
  Ensure the destination folder path exists. The app creates the 
  final output folder, but the parent destination must exist.

---------------------------------------------------------------------------
Copyright (c) 2025 FCM Tech / Marc Oliff
All rights reserved.
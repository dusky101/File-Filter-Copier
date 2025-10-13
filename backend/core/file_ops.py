# file_ops.py

import os
import shutil
from core.utils import format_size, format_timestamp, safe_filename, ensure_unique_path

def copy_files_and_log(file_tuples, output_folder):
    log_lines = []
    count = 0

    for file_path, semantic_type in file_tuples:
        try:
            filename = safe_filename(os.path.basename(file_path))
            destination_path = os.path.join(output_folder, filename)
            destination_path = ensure_unique_path(destination_path)

            shutil.copy2(file_path, destination_path)

            size = format_size(os.path.getsize(file_path))
            timestamp = format_timestamp(os.path.getmtime(file_path))
            type_label = semantic_type if semantic_type else "Unclassified"

            log_lines.append(f"{filename}  ←  {file_path}  [{type_label}, {size}, modified: {timestamp}]")
            count += 1

        except Exception as e:
            log_lines.append(f"⚠️ ERROR copying {file_path}: {str(e)}")

    # Write log file
    log_file_path = os.path.join(output_folder, "files-with-structure.txt")
    with open(log_file_path, "w", encoding="utf-8") as log_file:
        log_file.write(f"✅ FOUND FILES ({count}):\n")
        log_file.write("-" * 30 + "\n")
        for line in log_lines:
            log_file.write(line + "\n")

    return log_file_path

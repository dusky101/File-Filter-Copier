import { FileText, Image, Music, Video, Code, Archive, File } from "lucide-react";

// Existing groups (used by AdvancedFiltersPanel)
export const fileTypeGroups = {
  Documents: [
    { name: "Text Documents", icon: FileText, types: [".txt", ".doc", ".docx", ".pdf", ".rtf", ".odt", ".md"] },
    { name: "Spreadsheets", icon: FileText, types: [".xls", ".xlsx", ".csv", ".ods"] },
    { name: "Presentations", icon: FileText, types: [".ppt", ".pptx", ".odp", ".key"] },
  ],
  Media: [
    { name: "Images", icon: Image, types: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".bmp", ".webp", ".ico"] },
    { name: "Audio", icon: Music, types: [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"] },
    { name: "Video", icon: Video, types: [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"] },
  ],
  Development: [
    { name: "Code", icon: Code, types: [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".cpp", ".c", ".rb", ".go", ".rs", ".swift"] },
    { name: "Web", icon: Code, types: [".html", ".css", ".scss", ".sass", ".less"] },
    { name: "Config", icon: FileText, types: [".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".conf"] },
    { name: "Scripts", icon: File, types: [".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd"] },
  ],
  Archives: [
    { name: "Compressed", icon: Archive, types: [".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".xz"] },
  ],
};

// Extension → human-friendly label
const extensionToLabel = {
  // Documents
  ".doc": "Word",
  ".docx": "Word",
  ".odt": "OpenDocument Text",
  ".rtf": "Rich Text",
  ".pdf": "PDF",
  ".txt": "Plain Text",
  ".md": "Markdown",
  ".csv": "CSV",
  ".xls": "Excel",
  ".xlsx": "Excel",
  ".ods": "OpenDocument Spreadsheet",
  ".ppt": "PowerPoint",
  ".pptx": "PowerPoint",
  ".odp": "OpenDocument Presentation",
  ".key": "Keynote",
  // Images
  ".jpg": "JPEG",
  ".jpeg": "JPEG",
  ".png": "PNG",
  ".gif": "GIF",
  ".svg": "SVG",
  ".bmp": "BMP",
  ".webp": "WebP",
  ".ico": "ICO",
  // Audio
  ".mp3": "MP3",
  ".wav": "WAV",
  ".flac": "FLAC",
  ".aac": "AAC",
  ".ogg": "OGG",
  ".m4a": "M4A",
  ".wma": "WMA",
  // Video
  ".mp4": "MP4",
  ".mov": "MOV",
  ".avi": "AVI",
  ".mkv": "MKV",
  ".wmv": "WMV",
  ".flv": "FLV",
  ".webm": "WebM",
  // Code / Web
  ".js": "JavaScript",
  ".jsx": "React JSX",
  ".ts": "TypeScript",
  ".tsx": "React TSX",
  ".py": "Python",
  ".java": "Java",
  ".cpp": "C++",
  ".c": "C",
  ".rb": "Ruby",
  ".go": "Go",
  ".rs": "Rust",
  ".swift": "Swift",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "Sass (SCSS)",
  ".sass": "Sass",
  ".less": "Less",
  // Config
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".toml": "TOML",
  ".ini": "INI",
  ".conf": "Config",
  // Scripts
  ".sh": "Shell Script",
  ".bash": "Bash Script",
  ".zsh": "Zsh Script",
  ".ps1": "PowerShell Script",
  ".bat": "Batch File",
  ".cmd": "Command Script",
  // Archives
  ".zip": "ZIP Archive",
  ".rar": "RAR Archive",
  ".tar": "TAR Archive",
  ".gz": "GZIP Archive",
  ".7z": "7-Zip Archive",
  ".bz2": "BZip2 Archive",
  ".xz": "XZ Archive",
};

export const getExtension = (nameOrPath = "") => {
  const base = String(nameOrPath).split("/").pop() || "";
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot).toLowerCase();
};

export const getFileLabelFromName = (nameOrPath = "") => {
  const ext = getExtension(nameOrPath);
  if (!ext) return "Unknown";
  return extensionToLabel[ext] || ext.replace(".", "").toUpperCase();
};
import {
  FileText,
  Image,
  Music,
  Video,
  Code,
  Archive,
  File,
} from "lucide-react";

/**
 * File Type Definitions for Frontend
 * Aligned with backend/core/file_types.py
 */
export const fileTypeGroups = {
  Documents: [
    {
      name: "Text Documents",
      icon: FileText,
      types: [
        ".txt",
        ".doc",
        ".docx",
        ".pdf",
        ".rtf",
        ".odt",
        ".md",
        ".tex",
        ".wpd",
      ],
    },
    {
      name: "Spreadsheets",
      icon: FileText,
      types: [".xls", ".xlsx", ".csv", ".ods", ".tsv"],
    },
    {
      name: "Presentations",
      icon: FileText,
      types: [".ppt", ".pptx", ".odp", ".key"],
    },
  ],
  Media: [
    {
      name: "Images",
      icon: Image,
      types: [
        // Standard
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".bmp",
        ".webp",
        ".ico",
        ".tiff",
        ".tif",
        // High Efficiency
        ".heic",
        ".heif",
        ".avif",
        // RAW Formats (Professional)
        ".cr2",
        ".cr3",
        ".crw", // Canon
        ".nef",
        ".nrw", // Nikon
        ".arw",
        ".srf",
        ".sr2", // Sony
        ".orf", // Olympus
        ".rw2", // Panasonic
        ".raf", // Fujifilm
        ".dng", // Adobe / Generic
        ".pef", // Pentax
        ".x3f", // Sigma
        ".3fr",
        ".fff", // Hasselblad
        ".iiq", // Phase One
      ],
    },
    {
      name: "Audio",
      icon: Music,
      types: [
        ".mp3",
        ".wav",
        ".flac",
        ".aac",
        ".ogg",
        ".m4a",
        ".wma",
        ".aiff",
        ".alac",
      ],
    },
    {
      name: "Video",
      icon: Video,
      types: [
        ".mp4",
        ".mov",
        ".avi",
        ".mkv",
        ".wmv",
        ".flv",
        ".webm",
        ".m4v",
        ".mpg",
        ".mpeg",
        ".3gp",
        ".mts",
        ".m2ts",
      ],
    },
  ],
  Development: [
    {
      name: "Code",
      icon: Code,
      types: [
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".py",
        ".java",
        ".cpp",
        ".c",
        ".rb",
        ".go",
        ".rs",
        ".swift",
        ".php",
        ".sql",
      ],
    },
    {
      name: "Web",
      icon: Code,
      types: [".html", ".css", ".scss", ".sass", ".less", ".vue"],
    },
    {
      name: "Config",
      icon: FileText,
      types: [
        ".json",
        ".yaml",
        ".yml",
        ".xml",
        ".toml",
        ".ini",
        ".conf",
        ".env",
      ],
    },
    {
      name: "Scripts",
      icon: File,
      types: [
        ".sh",
        ".bash",
        ".zsh",
        ".ps1",
        ".bat",
        ".cmd",
        ".command",
        ".lua",
        ".pl",
      ],
    },
  ],
  Archives: [
    {
      name: "Compressed",
      icon: Archive,
      types: [
        ".zip",
        ".rar",
        ".tar",
        ".gz",
        ".7z",
        ".bz2",
        ".xz",
        ".iso",
        ".dmg",
      ],
    },
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
  ".tex": "LaTeX",
  ".wpd": "WordPerfect",
  ".csv": "CSV",
  ".xls": "Excel",
  ".xlsx": "Excel",
  ".ods": "OpenDocument Spreadsheet",
  ".tsv": "Tab Separated",
  ".ppt": "PowerPoint",
  ".pptx": "PowerPoint",
  ".odp": "OpenDocument Presentation",
  ".key": "Keynote",

  // Images (Standard)
  ".jpg": "JPEG",
  ".jpeg": "JPEG",
  ".png": "PNG",
  ".gif": "GIF",
  ".svg": "SVG",
  ".bmp": "BMP",
  ".webp": "WebP",
  ".ico": "ICO",
  ".tiff": "TIFF",
  ".tif": "TIFF",

  // Images (High Efficiency)
  ".heic": "HEIC Image",
  ".heif": "HEIF Image",
  ".avif": "AVIF Image",

  // Images (RAW)
  ".cr2": "Canon RAW",
  ".cr3": "Canon RAW",
  ".crw": "Canon RAW",
  ".nef": "Nikon RAW",
  ".nrw": "Nikon RAW",
  ".arw": "Sony RAW",
  ".srf": "Sony RAW",
  ".sr2": "Sony RAW",
  ".orf": "Olympus RAW",
  ".rw2": "Panasonic RAW",
  ".raf": "Fujifilm RAW",
  ".dng": "Digital Negative",
  ".pef": "Pentax RAW",
  ".x3f": "Sigma RAW",
  ".3fr": "Hasselblad RAW",
  ".fff": "Hasselblad RAW",
  ".iiq": "Phase One RAW",

  // Audio
  ".mp3": "MP3 Audio",
  ".wav": "WAV Audio",
  ".flac": "FLAC Audio",
  ".aac": "AAC Audio",
  ".ogg": "Ogg Audio",
  ".m4a": "M4A Audio",
  ".wma": "WMA Audio",
  ".aiff": "AIFF Audio",
  ".alac": "Apple Lossless",

  // Video
  ".mp4": "MP4 Video",
  ".mov": "QuickTime Video",
  ".avi": "AVI Video",
  ".mkv": "Matroska Video",
  ".wmv": "Windows Media",
  ".flv": "Flash Video",
  ".webm": "WebM Video",
  ".m4v": "M4V Video",
  ".mpg": "MPEG Video",
  ".mpeg": "MPEG Video",
  ".3gp": "3GP Video",
  ".mts": "AVCHD Video",
  ".m2ts": "Blu-ray Video",

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
  ".php": "PHP",
  ".sql": "SQL",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "Sass (SCSS)",
  ".sass": "Sass",
  ".less": "Less",
  ".vue": "Vue Component",

  // Config
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".xml": "XML",
  ".toml": "TOML",
  ".ini": "INI",
  ".conf": "Config",
  ".env": "Environment",

  // Scripts
  ".sh": "Shell Script",
  ".bash": "Bash Script",
  ".zsh": "Zsh Script",
  ".ps1": "PowerShell Script",
  ".bat": "Batch File",
  ".cmd": "Command Script",
  ".lua": "Lua Script",
  ".pl": "Perl Script",

  // Archives
  ".zip": "ZIP Archive",
  ".rar": "RAR Archive",
  ".tar": "TAR Archive",
  ".gz": "GZIP Archive",
  ".7z": "7-Zip Archive",
  ".bz2": "BZip2 Archive",
  ".xz": "XZ Archive",
  ".iso": "Disc Image",
  ".dmg": "Disk Image",
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

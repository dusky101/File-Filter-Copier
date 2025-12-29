# --- Filename or extension-based patterns ---
# Aligned with UI AdvancedFiltersPanel.jsx fileTypeGroups while keeping existing types for compatibility
FILE_TYPE_PATTERNS = {
    # UI: Documents
    "Text Documents": [".txt", ".doc", ".docx", ".pdf", ".rtf", ".odt"],
    "Spreadsheets": [".xls", ".xlsx", ".csv", ".ods"],
    "Presentations": [".ppt", ".pptx", ".odp", ".key"],

    # UI: Media
    "Images": [".jpg", ".jpeg", ".png", ".gif", ".svg", ".bmp", ".webp", ".ico"],
    "Audio": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".m4a", ".wma"],
    "Video": [".mp4", ".mov", ".avi", ".mkv", ".wmv", ".flv", ".webm"],

    # UI: Development
    "Code": [".js", ".ts", ".jsx", ".tsx",".py", ".java", ".cpp", ".c", ".rb", ".go", ".rs", ".swift"],
    "Web": [".html", ".css", ".jsx", ".tsx", ".vue", ".scss", ".sass", ".less"],
    "Config": [".json", ".yaml", ".yml", ".xml", ".toml", ".ini", ".conf"],
    "Scripts": [".sh", ".bash", ".zsh", ".ps1", ".bat", ".cmd", ".command"],

    # UI: Archives
    "Compressed": [".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".xz"],

    # Existing semantic buckets (kept for compatibility)
    "Models": ["Model", "Entity"],
    "Views": ["View", ".xib", ".storyboard", "UI", "Layout"],
    "ViewModels": ["ViewModel", "Binder"],
    "Services": ["Service", "Manager", "Helper", "Fetcher", "Syncer"],
    "Controllers": ["Controller", "Coordinator", "Router"],
    "Utilities": ["Utils", "Utility", "Common", "Shared"],
    "Tests": ["Test", "Spec", "Mock"],
    "MainApp": ["AppDelegate", "SceneDelegate", "Main", "Entry", "main.swift", "main.py"],

    # Existing languages (kept for compatibility)
    "Swift": [".swift"],
    "Python": [".py"],
    "JavaScript": [".js"],
    "TypeScript": [".ts"],
    "HTML": [".html", ".htm"],
    "CSS": [".css"],
    "C/C++": [".c", ".cpp", ".h", ".hpp"],
    "Java": [".java"],
    "Kotlin": [".kt"],
    "Dart": [".dart"],
    "Rust": [".rs"],
    "Go": [".go"],

    # Other/general (kept)
    "Documents": [".docx", ".pdf", ".txt", ".rtf", ".md"],
    "Media": [".mp4", ".mov", ".avi", ".mp3", ".wav", ".flac", ".mkv"],
    "Executables": [".exe", ".dmg", ".app", ".apk", ".msi"],
    "Archives": [".zip", ".tar", ".gz", ".rar", ".7z", ".iso"],
    "Design": [".psd", ".ai", ".fig", ".sketch"],
    "Security": [".pem", ".crt", ".key", ".pfx"],
    "Assets": ["asset", "icon", "logo", "background"]
}

# --- Content-based markers for deep scan ---
CONTENT_MARKERS = {
    # UI: Documents
    "Text Documents": ["Title:", "Author:", "Table of Contents", "Lorem ipsum"],
    "Spreadsheets": ["Sheet1", "SUM(", "VLOOKUP", "PivotTable"],
    "Presentations": ["Slide", "PowerPoint", "Keynote", "Agenda"],

    # UI: Media
    "Images": ["Exif", "RGB", "Alpha Channel", "Layer"],
    "Audio": ["codec", "bitrate", "duration", "sample rate"],
    "Video": ["codec", "frame rate", "bitrate", "duration"],

    # UI: Development
    "Code": ["function", "class", "def ", "import ", "package ", "public class"],
    "Web": ["<!DOCTYPE html>", "<html", "className", "export default", "Vue", "style {", "scss", "less"],
    "Config": ["{", ":", "version", "config", "root", "schema"],
    "Scripts": ["#!/usr/bin", "bash", "powershell", "echo", "set ", "Get-"],

    # UI: Archives
    "Compressed": ["PK", "7z", "XZ", "BZh", "ustar"],

    # Existing architecture
    "Models": ["class Model", "struct Model", "typealias Model", "extension Model", "Codable", "Entity"],
    "Views": ["body: some View", "UIView", "render()", "drawRect", "SwiftUI", "class View"],
    "ViewModels": ["class ViewModel", "ObservableObject", "@Published", "bind()", "updateView"],
    "Services": ["class Service", "func fetch", "func sync", "handleRequest", "performTask"],
    "Controllers": ["class Controller", "class Coordinator", "func navigate", "func handle", "present", "dismiss"],
    "Utilities": ["extension String", "extension Array", "sharedInstance", "singleton"],
    "Tests": ["XCTest", "unittest", "describe(", "it(", "assert", "mock", "stub"],
    "MainApp": ["@main", "UIApplication", "AppDelegate", "SceneDelegate", "main()"],

    # Existing language-specific
    "Swift": ["import SwiftUI", "class", "struct", "extension", "func"],
    "Python": ["def ", "import ", "class ", "if __name__ == '__main__'"],
    "JavaScript": ["function(", "const ", "let ", "import ", "export "],
    "TypeScript": ["interface ", "type ", "class ", "import ", "export "],
    "HTML": ["<!DOCTYPE html>", "<html>", "<head>", "<body>"],
    "CSS": ["color:", "font-family:", "margin:", "padding:"],
    "C/C++": ["#include", "int main(", "void ", "class ", "struct "],
    "Java": ["public class", "System.out.println", "import java."],
    "Kotlin": ["fun ", "val ", "var ", "class ", "object "],
    "Dart": ["void main()", "import ", "class ", "Widget"],
    "Rust": ["fn main()", "use ", "struct ", "impl "],
    "Go": ["package main", "func main()", "import "],

    # Other/general
    "Documents": ["Title:", "Author:", "Table of Contents", "Lorem ipsum"],
    "Media": ["codec", "frame rate", "bitrate", "duration"],
    "Executables": ["MZ", "PK", "Mach-O", "ELF"],
    "Archives": ["PK", "compressed", "archive", "tarball"],
    "Design": ["Adobe", "Sketch", "Figma", "Artboard"],
    "Security": ["BEGIN CERTIFICATE", "BEGIN PRIVATE KEY", "SSL", "TLS"],
    "Assets": ["imageNamed", "loadImage", "UIImage", "NSImage"]
}

# --- UI color mapping for semantic types ---
TYPE_COLORS = {
    # UI-aligned
    "Text Documents": "#e3f2fd",
    "Spreadsheets": "#fff3e0",
    "Presentations": "#ede7f6",
    "Images": "#fce4ec",
    "Audio": "#e1f5fe",
    "Video": "#f3e5f5",
    "Code": "#d1c4e9",
    "Web": "#ffccbc",
    "Config": "#f9fbe7",
    "Scripts": "#f3e5f5",
    "Compressed": "#f0f4c3",

    # Existing architecture
    "Models": "#e0f7fa",
    "Views": "#fce4ec",
    "ViewModels": "#f3e5f5",
    "Services": "#e8f5e9",
    "Controllers": "#fff3e0",
    "Utilities": "#f5f5f5",
    "Tests": "#ede7f6",
    "MainApp": "#c8e6c9",

    # Existing languages
    "Swift": "#d1c4e9",
    "Python": "#ffe0b2",
    "JavaScript": "#fff176",
    "TypeScript": "#b3e5fc",
    "HTML": "#ffccbc",
    "CSS": "#cfd8dc",
    "C/C++": "#b0bec5",
    "Java": "#ffab91",
    "Kotlin": "#ce93d8",
    "Dart": "#80deea",
    "Rust": "#bcaaa4",
    "Go": "#aed581",

    # Other/general
    "Documents": "#e8f5e9",
    "Media": "#e1f5fe",
    "Executables": "#fbe9e7",
    "Archives": "#f0f4c3",
    "Design": "#f8bbd0",
    "Security": "#d7ccc8",
    "Assets": "#fffde7",

    # Fallbacks
    "Unclassified": "#ffffff",
    "Error": "#ffebee"
}

# --- UI grouping for semantic filters ---
TYPE_GROUPS = {
    # Keep original programming groups
    "Programming Architecture": [
        "Models", "Views", "ViewModels", "Services", "Controllers",
        "Utilities", "Tests", "MainApp"
    ],
    "Programming Languages": [
        "Swift", "Python", "JavaScript", "TypeScript", "HTML", "CSS",
        "C/C++", "Java", "Kotlin", "Dart", "Rust", "Go"
    ],

    # UI-aligned groups
    "Documents": ["Text Documents", "Spreadsheets", "Presentations"],
    "Media": ["Images", "Audio", "Video"],
    "Development": ["Code", "Web", "Config", "Scripts"],
    "System": ["Compressed", "Executables", "Fonts", "Database"]
}

def get_file_label_from_name(filename: str) -> str:
    """
    Returns a short label (extension) from a filename.
    """
    if "." not in filename or filename.startswith("."):
        return "FILE"
    return filename.split(".")[-1].upper()

def get_file_category(filename: str) -> str:
    """
    Determines the semantic category of a file based on its extension.
    Used for the 'Organize by Type' copy feature.
    """
    lower_name = filename.lower()
    
    # Check strict extension match first
    for category, extensions in FILE_TYPE_PATTERNS.items():
        for ext in extensions:
            if lower_name.endswith(ext):
                return category
    
    return None
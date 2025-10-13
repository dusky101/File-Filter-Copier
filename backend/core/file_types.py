# --- Filename or extension-based patterns ---
FILE_TYPE_PATTERNS = {
    # Programming architecture
    "Models": ["Model", "Entity"],
    "Views": ["View", ".xib", ".storyboard", "UI", "Layout"],
    "ViewModels": ["ViewModel", "Binder"],
    "Services": ["Service", "Manager", "Helper", "Fetcher", "Syncer"],
    "Controllers": ["Controller", "Coordinator", "Router"],
    "Utilities": ["Utils", "Utility", "Common", "Shared"],
    "Tests": ["Test", "Spec", "Mock"],
    "Config": ["Config", "Settings", "Constants", ".env", ".yaml", ".json", ".ini"],
    "MainApp": ["AppDelegate", "SceneDelegate", "Main", "Entry", "main.swift", "main.py"],

    # Programming languages
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

    # General-purpose
    "Documents": [".docx", ".pdf", ".txt", ".rtf", ".md"],
    "Spreadsheets": [".xlsx", ".csv", ".ods"],
    "Presentations": [".pptx", ".key", ".odp"],
    "Images": [".png", ".jpg", ".jpeg", ".gif", ".svg", ".bmp", ".tiff", ".webp", ".psd"],
    "Media": [".mp4", ".mov", ".avi", ".mp3", ".wav", ".flac", ".mkv"],
    "Scripts": [".sh", ".bat", ".command"],
    "Executables": [".exe", ".dmg", ".app", ".apk", ".msi"],
    "Archives": [".zip", ".tar", ".gz", ".rar", ".7z", ".iso"],
    "Design": [".psd", ".ai", ".fig", ".sketch"],
    "Security": [".pem", ".crt", ".key", ".pfx"],
    "Assets": ["asset", "icon", "logo", "background"]
}

# --- Content-based markers for deep scan ---
CONTENT_MARKERS = {
    "Models": ["class Model", "struct Model", "typealias Model", "extension Model", "Codable", "Entity"],
    "Views": ["body: some View", "UIView", "render()", "drawRect", "SwiftUI", "class View"],
    "ViewModels": ["class ViewModel", "ObservableObject", "@Published", "bind()", "updateView"],
    "Services": ["class Service", "func fetch", "func sync", "handleRequest", "performTask"],
    "Controllers": ["class Controller", "class Coordinator", "func navigate", "func handle", "present", "dismiss"],
    "Utilities": ["extension String", "extension Array", "sharedInstance", "singleton"],
    "Tests": ["XCTest", "unittest", "describe(", "it(", "assert", "mock", "stub"],
    "Config": ["ENV", "settings =", "config =", "load_config", "UserDefaults"],
    "MainApp": ["@main", "UIApplication", "AppDelegate", "SceneDelegate", "main()"],

    # Language-specific
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

    # General-purpose
    "Documents": ["Title:", "Author:", "Table of Contents", "Lorem ipsum"],
    "Spreadsheets": ["Sheet1", "SUM(", "VLOOKUP", "PivotTable"],
    "Presentations": ["Slide", "PowerPoint", "Keynote", "Agenda"],
    "Images": ["Exif", "RGB", "Alpha Channel", "Layer"],
    "Media": ["codec", "frame rate", "bitrate", "duration"],
    "Scripts": ["#!/usr/bin", "echo", "import os", "sys.argv"],
    "Executables": ["MZ", "PK", "Mach-O", "ELF"],
    "Archives": ["PK", "compressed", "archive", "tarball"],
    "Design": ["Adobe", "Sketch", "Figma", "Artboard"],
    "Security": ["BEGIN CERTIFICATE", "BEGIN PRIVATE KEY", "SSL", "TLS"],
    "Assets": ["imageNamed", "loadImage", "UIImage", "NSImage"]
}

# --- UI color mapping for semantic types ---
TYPE_COLORS = {
    # Programming architecture
    "Models": "#e0f7fa",
    "Views": "#fce4ec",
    "ViewModels": "#f3e5f5",
    "Services": "#e8f5e9",
    "Controllers": "#fff3e0",
    "Utilities": "#f5f5f5",
    "Tests": "#ede7f6",
    "Config": "#f9fbe7",
    "MainApp": "#c8e6c9",

    # Languages
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

    # General-purpose
    "Documents": "#e8f5e9",
    "Spreadsheets": "#fff3e0",
    "Presentations": "#ede7f6",
    "Images": "#fce4ec",
    "Media": "#e1f5fe",
    "Scripts": "#f3e5f5",
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
    "Programming Architecture": [
        "Models", "Views", "ViewModels", "Services", "Controllers",
        "Utilities", "Tests", "Config", "MainApp"
    ],
    "Programming Languages": [
        "Swift", "Python", "JavaScript", "TypeScript", "HTML", "CSS",
        "C/C++", "Java", "Kotlin", "Dart", "Rust", "Go"
    ],
    "Documents & Office": [
        "Documents", "Spreadsheets", "Presentations"
    ],
    "Media & Design": [
        "Images", "Media", "Design", "Assets"
    ],
    "System & Scripts": [
        "Scripts", "Executables", "Archives", "Security"
    ]
}

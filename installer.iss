; Script generated for File Filter Copier
; PROFESSIONAL EDITION - FCM Tech
; ---------------------------------------

#define MyAppName "File Filter Copier"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "FCM Tech"
; Updated to your main repository
#define MyAppURL "https://github.com/dusky101/File-Filter-Copier"
#define MyAppExeName "File Filter Copier.exe"
#define MyAppId "{{A590059D-3343-410F-97D8-769866F5338B}"

; ---------------------------------------
; PATH CONFIGURATION
; ---------------------------------------
; Matches the folder you just verified
#define SourcePath "out\File Filter Copier-win32-x64"

[Setup]
; --- Identity & Versioning ---
AppId={#MyAppId}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; --- Installation Directory (PRO FEATURE: x64) ---
; "autopf" automatically selects "Program Files" on 64-bit systems
DefaultDirName={autopf}\{#MyAppName}
; Default group name in Start Menu
DefaultGroupName={#MyAppName}
; Allow user to customize location
DisableDirPage=no
DisableProgramGroupPage=no

; --- Architecture (PRO FEATURE) ---
; Marks this as a true 64-bit installer.
; Prevents installing into "Program Files (x86)"
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

; --- Administrative Privileges ---
; Request admin rights to install for all users (standard for tools)
PrivilegesRequired=admin

; --- Visuals & Experience ---
; Modern style wizard
WizardStyle=modern
; Icon for the Setup executable itself
SetupIconFile=src\assets\icons\win\icon.ico
; Icon used in the Windows "Apps & Features" list
UninstallDisplayIcon={app}\{#MyAppExeName}
; High quality compression
Compression=lzma2/ultra64
SolidCompression=yes
; Output file naming
OutputBaseFilename=FileFilterCopier_Setup_v{#MyAppVersion}
OutputDir=out\installer

; --- Documents (PRO FEATURE) ---
; Display the License Agreement before install (DISABLED as requested)
; LicenseFile=LICENSE.txt
; Display the README info before installation starts
InfoBeforeFile=README.txt

; --- Safety (PRO FEATURE) ---
; Automatically check if the app is running and ask user to close it
CloseApplications=yes
; Restart the app after install if it was running? (Optional, usually no for tools)
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; 1. The Main Executable
Source: "{#SourcePath}\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; 2. All Application Files (PRO FEATURE: Excludes junk)
; We recursively copy everything, but ignore standard junk files like .git or .DS_Store if they exist
Source: "{#SourcePath}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
; Start Menu Shortcut
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
; Desktop Shortcut (User optional)
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
; Uninstaller Shortcut in Start Menu
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"

[Run]
; Launch checkbox at the end of installation
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#MyAppName}}"; Flags: nowait postinstall skipifsilent

[UninstallDelete]
; --- CLEANUP (PRO FEATURE) ---
; This section runs ONLY during uninstall.
; It ensures a "Clean Uninstall" by removing data created at runtime.

; 1. Remove the application folder files (cleanup leftovers)
Type: files; Name: "{app}\*.*"
Type: dirifempty; Name: "{app}"

; 2. OPTIONAL: Remove User Data (Presets, Logs, Python Venv)
; Your main.js stores data in %APPDATA%\File Filter Copier
; This removes the entire configuration folder when the user uninstalls.
Type: filesandordirs; Name: "{userappdata}\File Filter Copier"
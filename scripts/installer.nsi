!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif

!define APP_NAME "KorProxy"
!define COMPANY_NAME "KorProxy"
!define INSTALL_DIR "$PROGRAMFILES64\\KorProxy"

Name "${APP_NAME}"
OutFile "..\\dist\\KorProxy-${VERSION}-setup.exe"
InstallDir "${INSTALL_DIR}"
RequestExecutionLevel admin

Icon "..\\assets\\KorProxy.ico"
UninstallIcon "..\\assets\\KorProxy.ico"

!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Install"
  SetOutPath "$INSTDIR"

  ; App files (produced by dotnet publish)
  File /r "..\\publish\\win-x64\\*.*"

  ; Shortcuts (use the app's embedded icon)
  CreateDirectory "$SMPROGRAMS\\KorProxy"
  CreateShortcut "$DESKTOP\\KorProxy.lnk" "$INSTDIR\\KorProxy.exe" "" "$INSTDIR\\KorProxy.exe" 0
  CreateShortcut "$SMPROGRAMS\\KorProxy\\KorProxy.lnk" "$INSTDIR\\KorProxy.exe" "" "$INSTDIR\\KorProxy.exe" 0

  ; Uninstaller
  WriteUninstaller "$INSTDIR\\Uninstall.exe"
  CreateShortcut "$SMPROGRAMS\\KorProxy\\Uninstall KorProxy.lnk" "$INSTDIR\\Uninstall.exe" "" "$INSTDIR\\Uninstall.exe" 0

  ; Add/Remove Programs
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy" "DisplayName" "KorProxy"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy" "Publisher" "${COMPANY_NAME}"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy" "DisplayIcon" "$INSTDIR\\KorProxy.exe"
  WriteRegStr HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy" "UninstallString" "$INSTDIR\\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\\KorProxy.lnk"
  Delete "$SMPROGRAMS\\KorProxy\\KorProxy.lnk"
  Delete "$SMPROGRAMS\\KorProxy\\Uninstall KorProxy.lnk"
  RMDir "$SMPROGRAMS\\KorProxy"

  RMDir /r "$INSTDIR"

  DeleteRegKey HKLM "Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\KorProxy"
SectionEnd

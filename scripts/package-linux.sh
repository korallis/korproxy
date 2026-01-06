#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLISH_DIR="$ROOT_DIR/publish/linux-x64"
DIST_DIR="$ROOT_DIR/dist"

APP_NAME="KorProxy"
APP_ID="com.korproxy.app"
VERSION="1.0.0"

if [[ ! -d "$PUBLISH_DIR" ]]; then
    echo "Error: Linux publish output not found at $PUBLISH_DIR"
    echo "Run './scripts/publish.sh linux-x64' first"
    exit 1
fi

if [[ ! -f "$PUBLISH_DIR/runtimes/linux-x64/CLIProxyAPI" ]]; then
    echo "Warning: CLIProxyAPI not found in runtimes/linux-x64/"
    echo "The package will be created but won't function without the proxy binary."
    echo "Build CLIProxyAPI for Linux and place it in runtimes/linux-x64/CLIProxyAPI"
    echo ""
fi

mkdir -p "$DIST_DIR"

# ============================================================================
# Create tarball (always works, no dependencies)
# ============================================================================
create_tarball() {
    echo "Creating Linux tarball..."
    
    local PACKAGE_NAME="$APP_NAME-$VERSION-linux-x64"
    local PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME"
    
    rm -rf "$PACKAGE_DIR"
    mkdir -p "$PACKAGE_DIR"
    
    # Copy main executable
    cp "$PUBLISH_DIR/$APP_NAME" "$PACKAGE_DIR/"
    chmod +x "$PACKAGE_DIR/$APP_NAME"
    
    # Copy config
    cp "$PUBLISH_DIR/appsettings.json" "$PACKAGE_DIR/"
    
    # Copy runtime binaries
    if [[ -d "$PUBLISH_DIR/runtimes" ]]; then
        cp -R "$PUBLISH_DIR/runtimes" "$PACKAGE_DIR/"
        chmod +x "$PACKAGE_DIR/runtimes"/*/* 2>/dev/null || true
    fi
    
    # Create launcher script
    cat > "$PACKAGE_DIR/korproxy.sh" << 'EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
exec ./KorProxy "$@"
EOF
    chmod +x "$PACKAGE_DIR/korproxy.sh"
    
    # Create desktop file for manual installation
    cat > "$PACKAGE_DIR/$APP_NAME.desktop" << EOF
[Desktop Entry]
Type=Application
Name=KorProxy
Comment=AI CLI Proxy Dashboard
Exec=korproxy.sh
Icon=korproxy
Categories=Development;Utility;
Terminal=false
StartupNotify=true
EOF
    
    # Create README
    cat > "$PACKAGE_DIR/README.txt" << 'EOF'
KorProxy - AI CLI Proxy Dashboard
==================================

QUICK START:
1. Extract this archive to your preferred location
2. Run: ./korproxy.sh (or ./KorProxy directly)
3. The app will start with a system tray icon

INSTALLATION (optional):
To install system-wide:
  sudo cp KorProxy /usr/local/bin/
  sudo cp -r runtimes /usr/local/lib/korproxy/
  cp KorProxy.desktop ~/.local/share/applications/

CONFIGURATION:
- Edit appsettings.json to change port or settings
- Default proxy port: 8317
- Config stored in ~/.config/korproxy/

API ENDPOINTS (after proxy starts):
- OpenAI-compatible: http://localhost:8317/v1/chat/completions
- Management API: http://localhost:8317/v0/management/

REQUIREMENTS:
- Linux x64 (Ubuntu 18.04+, Debian 10+, Fedora 32+, etc.)
- libX11, libICE, libSM for GUI
- Optional: libappindicator3 for system tray

TROUBLESHOOTING:
- If tray icon doesn't appear, install libappindicator3
- Ubuntu/Debian: sudo apt install libappindicator3-1
- Fedora: sudo dnf install libappindicator-gtk3
- For Wayland, you may need gnome-shell-extension-appindicator

For more information, visit: https://github.com/your-repo/korproxy
EOF
    
    # Create tarball
    cd "$DIST_DIR"
    tar -czvf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
    
    echo "Created: $DIST_DIR/$PACKAGE_NAME.tar.gz"
}

# ============================================================================
# Create AppImage (if appimagetool available)
# ============================================================================
create_appimage() {
    echo "Creating AppImage..."
    
    local APPDIR="$DIST_DIR/$APP_NAME.AppDir"
    
    rm -rf "$APPDIR"
    mkdir -p "$APPDIR/usr/bin"
    mkdir -p "$APPDIR/usr/lib"
    mkdir -p "$APPDIR/usr/share/applications"
    mkdir -p "$APPDIR/usr/share/icons/hicolor/256x256/apps"
    
    # Copy executable
    cp "$PUBLISH_DIR/$APP_NAME" "$APPDIR/usr/bin/"
    chmod +x "$APPDIR/usr/bin/$APP_NAME"
    
    # Copy config
    cp "$PUBLISH_DIR/appsettings.json" "$APPDIR/usr/bin/"
    
    # Copy runtime binaries
    if [[ -d "$PUBLISH_DIR/runtimes" ]]; then
        cp -R "$PUBLISH_DIR/runtimes" "$APPDIR/usr/bin/"
        chmod +x "$APPDIR/usr/bin/runtimes"/*/* 2>/dev/null || true
    fi
    
    # Create desktop file
    cat > "$APPDIR/$APP_NAME.desktop" << EOF
[Desktop Entry]
Type=Application
Name=KorProxy
Comment=AI CLI Proxy Dashboard
Exec=KorProxy
Icon=korproxy
Categories=Development;Utility;
Terminal=false
StartupNotify=true
EOF
    cp "$APPDIR/$APP_NAME.desktop" "$APPDIR/usr/share/applications/"
    
    # Create placeholder icon (256x256 PNG would be ideal)
    # For now, create a simple SVG placeholder
    cat > "$APPDIR/korproxy.svg" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="40" fill="#6366f1"/>
  <text x="128" y="160" font-family="Arial" font-size="120" font-weight="bold" fill="white" text-anchor="middle">K</text>
</svg>
EOF
    cp "$APPDIR/korproxy.svg" "$APPDIR/usr/share/icons/hicolor/256x256/apps/"
    
    # Create AppRun script
    cat > "$APPDIR/AppRun" << 'EOF'
#!/bin/bash
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
export PATH="${HERE}/usr/bin:${PATH}"
cd "${HERE}/usr/bin"
exec "${HERE}/usr/bin/KorProxy" "$@"
EOF
    chmod +x "$APPDIR/AppRun"
    
    # Build AppImage
    cd "$DIST_DIR"
    
    # Download appimagetool if not present
    if ! command -v appimagetool &> /dev/null; then
        if [[ ! -f "./appimagetool" ]]; then
            echo "Downloading appimagetool..."
            wget -q "https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage" -O appimagetool
            chmod +x appimagetool
        fi
        APPIMAGETOOL="./appimagetool"
    else
        APPIMAGETOOL="appimagetool"
    fi
    
    ARCH=x86_64 $APPIMAGETOOL "$APPDIR" "$APP_NAME-$VERSION-x86_64.AppImage"
    
    echo "Created: $DIST_DIR/$APP_NAME-$VERSION-x86_64.AppImage"
}

# ============================================================================
# Main
# ============================================================================
usage() {
    echo "Usage: $0 [tarball|appimage|all]"
    echo "  tarball:  Create .tar.gz archive (default)"
    echo "  appimage: Create AppImage (requires appimagetool or wget)"
    echo "  all:      Create both formats"
    exit 1
}

case "${1:-tarball}" in
    tarball)
        create_tarball
        ;;
    appimage)
        create_appimage
        ;;
    all)
        create_tarball
        create_appimage
        ;;
    *)
        usage
        ;;
esac

echo ""
echo "Done!"

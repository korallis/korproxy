#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLISH_DIR="$ROOT_DIR/publish/win-x64"
DIST_DIR="$ROOT_DIR/dist"

APP_NAME="KorProxy"
VERSION="1.0.0"

if [[ ! -d "$PUBLISH_DIR" ]]; then
    echo "Error: Windows publish output not found at $PUBLISH_DIR"
    echo "Run './scripts/publish.sh win-x64' first"
    exit 1
fi

if [[ ! -f "$PUBLISH_DIR/runtimes/win-x64/CLIProxyAPI.exe" ]]; then
    echo "Warning: CLIProxyAPI.exe not found in runtimes/win-x64/"
    echo "The package will be created but won't function without the proxy binary."
    echo "Build CLIProxyAPI for Windows and place it in runtimes/win-x64/CLIProxyAPI.exe"
    echo ""
fi

echo "Creating Windows portable package..."

PACKAGE_NAME="$APP_NAME-$VERSION-win-x64"
PACKAGE_DIR="$DIST_DIR/$PACKAGE_NAME"

rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Copy main executable
cp "$PUBLISH_DIR/$APP_NAME.exe" "$PACKAGE_DIR/"

# Copy config
cp "$PUBLISH_DIR/appsettings.json" "$PACKAGE_DIR/"

# Copy PDB for debugging (optional, can be removed for smaller package)
if [[ -f "$PUBLISH_DIR/$APP_NAME.pdb" ]]; then
    cp "$PUBLISH_DIR/$APP_NAME.pdb" "$PACKAGE_DIR/"
fi

# Copy runtime binaries
if [[ -d "$PUBLISH_DIR/runtimes" ]]; then
    cp -R "$PUBLISH_DIR/runtimes" "$PACKAGE_DIR/"
fi

# Create README for Windows users
cat > "$PACKAGE_DIR/README.txt" << 'EOF'
KorProxy - AI CLI Proxy Dashboard
==================================

QUICK START:
1. Double-click KorProxy.exe to launch
2. The app will start minimized to system tray
3. Click the tray icon to open the dashboard

CONFIGURATION:
- Edit appsettings.json to change port or settings
- Default proxy port: 8317
- Management API uses Bearer token authentication

FIRST RUN:
1. Go to Accounts tab to authenticate with AI providers
2. Use the OAuth buttons to log in to Claude, Gemini, etc.
3. Once authenticated, you can use the proxy endpoints

API ENDPOINTS (after proxy starts):
- OpenAI-compatible: http://localhost:8317/v1/chat/completions
- Management API: http://localhost:8317/v0/management/

REQUIREMENTS:
- Windows 10 version 1809 or later
- Windows 11

TROUBLESHOOTING:
- If the app doesn't start, ensure .NET 8 runtime is available
  (should be included in this self-contained package)
- Check Windows Defender/Firewall if proxy connections fail
- Logs are available in the Logs tab

For more information, visit: https://github.com/your-repo/korproxy
EOF

# Create zip archive
cd "$DIST_DIR"
ZIP_NAME="$PACKAGE_NAME.zip"
rm -f "$ZIP_NAME"

if command -v zip &> /dev/null; then
    zip -r "$ZIP_NAME" "$PACKAGE_NAME"
elif command -v 7z &> /dev/null; then
    7z a "$ZIP_NAME" "$PACKAGE_NAME"
else
    echo "Warning: Neither 'zip' nor '7z' found. Creating tarball instead."
    tar -czvf "$PACKAGE_NAME.tar.gz" "$PACKAGE_NAME"
    ZIP_NAME="$PACKAGE_NAME.tar.gz"
fi

echo ""
echo "Created: $DIST_DIR/$ZIP_NAME"
echo ""
echo "Package contents:"
ls -la "$PACKAGE_DIR"
echo ""
echo "Done!"

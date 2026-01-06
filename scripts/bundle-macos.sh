#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PUBLISH_DIR="$ROOT_DIR/publish"
BUNDLE_DIR="$ROOT_DIR/dist"

APP_NAME="KorProxy"
BUNDLE_ID="com.korproxy.app"
CSProj="$ROOT_DIR/src/KorProxy/KorProxy.csproj"
VERSION=$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' "$CSProj" | head -n 1)
VERSION=${VERSION:-1.0.0}

usage() {
    echo "Usage: $0 [arm64|x64|universal]"
    echo "  arm64: Build for Apple Silicon"
    echo "  x64: Build for Intel Macs"
    echo "  universal: Build universal binary (requires both architectures)"
    exit 1
}

create_bundle() {
    local arch=$1
    local rid=$2
    local app_path="$BUNDLE_DIR/$APP_NAME.app"
    local contents="$app_path/Contents"
    local publish_path="$PUBLISH_DIR/$rid"
    
    if [[ ! -d "$publish_path" ]]; then
        echo "Error: Publish output not found at $publish_path"
        echo "Run './scripts/publish.sh $rid' first"
        return 1
    fi
    
    echo "Creating $APP_NAME.app for $arch..."
    
    rm -rf "$app_path"
    mkdir -p "$contents/MacOS"
    mkdir -p "$contents/Resources"

    # Copy the full publish output (apphost + managed dlls + *.json + native libs)
    # so the app runs whether publish is single-file or multi-file.
    cp -R "$publish_path/"* "$contents/MacOS/" 2>/dev/null || true
    
    if [[ -d "$publish_path/runtimes" ]]; then
        cp -R "$publish_path/runtimes" "$contents/MacOS/" 2>/dev/null || true
    fi

    # Some native assets (e.g., SkiaSharp) live under runtimes/<rid>/native and are loaded
    # via name-based probing. Copy dylibs next to the executable as well.
    if [[ -d "$publish_path/runtimes" ]]; then
        find "$publish_path/runtimes" -type f -name "*.dylib" -print0 2>/dev/null | while IFS= read -r -d '' f; do
            cp "$f" "$contents/MacOS/" 2>/dev/null || true
        done
    fi
    
    create_info_plist "$contents/Info.plist" "$arch"
    
    if [[ -f "$ROOT_DIR/assets/KorProxy.icns" ]]; then
        cp "$ROOT_DIR/assets/KorProxy.icns" "$contents/Resources/"
    else
        create_placeholder_icon "$contents/Resources/KorProxy.icns"
    fi
    
    chmod +x "$contents/MacOS/$APP_NAME"
    chmod +x "$contents/MacOS/runtimes"/*/* 2>/dev/null || true

    # Best-effort ad-hoc signing improves launch behavior when copied to /Applications.
    # It does not require a developer certificate.
    if command -v codesign >/dev/null 2>&1; then
        codesign --force --deep --sign - "$app_path" >/dev/null 2>&1 || true
    fi
    
    echo "Created: $app_path"
}

create_universal() {
    local arm_publish="$PUBLISH_DIR/osx-arm64"
    local x64_publish="$PUBLISH_DIR/osx-x64"
    local app_path="$BUNDLE_DIR/$APP_NAME.app"
    local contents="$app_path/Contents"
    
    if [[ ! -d "$arm_publish" ]] || [[ ! -d "$x64_publish" ]]; then
        echo "Error: Both osx-arm64 and osx-x64 builds required for universal"
        echo "Run './scripts/publish.sh osx-arm64' and './scripts/publish.sh osx-x64' first"
        return 1
    fi
    
    echo "Creating universal $APP_NAME.app..."
    
    rm -rf "$app_path"
    mkdir -p "$contents/MacOS"
    mkdir -p "$contents/Resources"
    
    lipo -create \
        "$arm_publish/$APP_NAME" \
        "$x64_publish/$APP_NAME" \
        -output "$contents/MacOS/$APP_NAME"

    # Copy all other publish outputs from arm build (dlls/json/config/etc)
    # but keep the universal apphost we just created.
    shopt -s dotglob nullglob
    for item in "$arm_publish"/*; do
        base=$(basename "$item")
        if [[ "$base" == "$APP_NAME" ]]; then
            continue
        fi
        cp -R "$item" "$contents/MacOS/" 2>/dev/null || true
    done
    shopt -u dotglob nullglob
    
    for dylib in "$arm_publish"/*.dylib; do
        if [[ -f "$dylib" ]]; then
            name=$(basename "$dylib")
            if [[ -f "$x64_publish/$name" ]]; then
                lipo -create "$dylib" "$x64_publish/$name" -output "$contents/MacOS/$name"
            else
                cp "$dylib" "$contents/MacOS/"
            fi
        fi
    done
    
    mkdir -p "$contents/MacOS/runtimes/osx-arm64"
    mkdir -p "$contents/MacOS/runtimes/osx-x64"
    cp -R "$arm_publish/runtimes/osx-arm64/"* "$contents/MacOS/runtimes/osx-arm64/" 2>/dev/null || true
    cp -R "$x64_publish/runtimes/osx-x64/"* "$contents/MacOS/runtimes/osx-x64/" 2>/dev/null || true
    
    create_info_plist "$contents/Info.plist" "universal"
    
    if [[ -f "$ROOT_DIR/assets/KorProxy.icns" ]]; then
        cp "$ROOT_DIR/assets/KorProxy.icns" "$contents/Resources/"
    else
        create_placeholder_icon "$contents/Resources/KorProxy.icns"
    fi
    
    chmod +x "$contents/MacOS/$APP_NAME"
    chmod +x "$contents/MacOS/runtimes"/*/* 2>/dev/null || true

    if command -v codesign >/dev/null 2>&1; then
        codesign --force --deep --sign - "$app_path" >/dev/null 2>&1 || true
    fi
    
    echo "Created: $app_path"
}

create_info_plist() {
    local plist_path=$1
    local arch=$2
    
    cat > "$plist_path" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>$APP_NAME</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIconFile</key>
    <string>KorProxy</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSSupportsAutomaticGraphicsSwitching</key>
    <true/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright 2025</string>
</dict>
</plist>
EOF
}

create_placeholder_icon() {
    local icon_path=$1
    mkdir -p "$(dirname "$icon_path")"
    touch "$icon_path"
}

mkdir -p "$BUNDLE_DIR"

case "${1:-arm64}" in
    arm64)
        create_bundle "arm64" "osx-arm64"
        ;;
    x64)
        create_bundle "x64" "osx-x64"
        ;;
    universal)
        create_universal
        ;;
    *)
        usage
        ;;
esac

echo "Done!"

#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$ROOT_DIR/dist"

APP_NAME="KorProxy"
CSProj="$ROOT_DIR/src/KorProxy/KorProxy.csproj"
VERSION=$(sed -n 's:.*<Version>\(.*\)</Version>.*:\1:p' "$CSProj" | head -n 1)
VERSION=${VERSION:-1.0.0}
VOLUME_NAME="$APP_NAME $VERSION"

usage() {
    echo "Usage: $0 [arm64|x64|universal]"
    echo "  Creates a DMG installer from an existing .app bundle"
    echo ""
    echo "Prerequisites:"
    echo "  1. Run './scripts/publish.sh <runtime>' to build"
    echo "  2. Run './scripts/bundle-macos.sh <arch>' to create .app"
    echo "  3. Then run this script to create DMG"
    exit 1
}

create_dmg() {
    local arch=$1
    local app_path="$DIST_DIR/$APP_NAME.app"
    local dmg_name="$APP_NAME-$VERSION-$arch.dmg"
    local dmg_path="$DIST_DIR/$dmg_name"
    local temp_dmg="$DIST_DIR/temp_$dmg_name"
    local mount_point="/Volumes/$VOLUME_NAME"
    
    if [[ ! -d "$app_path" ]]; then
        echo "Error: App bundle not found at $app_path"
        echo "Run './scripts/bundle-macos.sh $arch' first (creates $DIST_DIR/$APP_NAME.app)"
        exit 1
    fi
    
    echo "Creating DMG for $arch..."
    
    # Clean up any existing DMG or mount
    rm -f "$dmg_path" "$temp_dmg"
    if [[ -d "$mount_point" ]]; then
        hdiutil detach "$mount_point" -quiet 2>/dev/null || true
    fi
    
    # Calculate size needed (app size + 20MB buffer)
    local app_size=$(du -sm "$app_path" | cut -f1)
    local dmg_size=$((app_size + 20))
    
    echo "Creating $dmg_size MB disk image..."
    
    # Create temporary DMG
    hdiutil create \
        -volname "$VOLUME_NAME" \
        -srcfolder "$app_path" \
        -fs HFS+ \
        -fsargs "-c c=64,a=16,e=16" \
        -format UDRW \
        -size "${dmg_size}m" \
        "$temp_dmg"
    
    # Mount it
    echo "Mounting disk image..."
    hdiutil attach "$temp_dmg" -mountpoint "$mount_point"
    
    # Create Applications symlink
    ln -s /Applications "$mount_point/Applications"
    
    # Set background and icon positions using AppleScript
    # This creates a nice drag-to-install layout
    echo "Configuring DMG window..."
    osascript << EOF
tell application "Finder"
    tell disk "$VOLUME_NAME"
        open
        set current view of container window to icon view
        set toolbar visible of container window to false
        set statusbar visible of container window to false
        set bounds of container window to {400, 100, 900, 400}
        set viewOptions to the icon view options of container window
        set arrangement of viewOptions to not arranged
        set icon size of viewOptions to 80
        set position of item "$APP_NAME.app" of container window to {125, 150}
        set position of item "Applications" of container window to {375, 150}
        close
        open
        update without registering applications
        delay 2
    end tell
end tell
EOF
    
    # Sync and unmount
    sync
    hdiutil detach "$mount_point"
    
    # Convert to compressed final DMG
    echo "Compressing disk image..."
    hdiutil convert "$temp_dmg" \
        -format UDZO \
        -imagekey zlib-level=9 \
        -o "$dmg_path"
    
    # Some hdiutil versions append ".dmg" even if the output already has it.
    # Normalize to the expected name so CI notarization scripts can find it.
    if [[ ! -f "$dmg_path" && -f "$dmg_path.dmg" ]]; then
        mv -f "$dmg_path.dmg" "$dmg_path"
    fi

    # Clean up temp
    rm -f "$temp_dmg"

    if [[ ! -f "$dmg_path" ]]; then
        echo "Error: DMG was not created at $dmg_path"
        return 1
    fi
    
    # Show result
    local final_size=$(du -h "$dmg_path" | cut -f1)
    echo ""
    echo "Created: $dmg_path ($final_size)"
}

# Simple DMG creation (no fancy layout, more compatible)
create_simple_dmg() {
    local arch=$1
    local app_path="$DIST_DIR/$APP_NAME.app"
    local dmg_name="$APP_NAME-$VERSION-$arch.dmg"
    local dmg_path="$DIST_DIR/$dmg_name"
    
    if [[ ! -d "$app_path" ]]; then
        echo "Error: App bundle not found at $app_path"
        echo "Run './scripts/bundle-macos.sh $arch' first (creates $DIST_DIR/$APP_NAME.app)"
        exit 1
    fi
    
    echo "Creating simple DMG for $arch..."
    
    rm -f "$dmg_path"
    
    # Create temp directory with app and Applications symlink
    local staging="$DIST_DIR/dmg-staging-$arch"
    rm -rf "$staging"
    mkdir -p "$staging"
    cp -R "$app_path" "$staging/"
    ln -s /Applications "$staging/Applications"
    
    # Create DMG directly
    hdiutil create \
        -volname "$VOLUME_NAME" \
        -srcfolder "$staging" \
        -fs HFS+ \
        -format UDZO \
        -imagekey zlib-level=9 \
        "$dmg_path"
    
    # Clean up
    rm -rf "$staging"
    
    local final_size=$(du -h "$dmg_path" | cut -f1)
    echo ""
    echo "Created: $dmg_path ($final_size)"
}

# Main
ARCH="${1:-arm64}"

case "$ARCH" in
    arm64|x64|universal)
        # Try fancy DMG first, fall back to simple
        if ! create_dmg "$ARCH" 2>/dev/null; then
            echo "Fancy DMG creation failed, trying simple method..."
            create_simple_dmg "$ARCH"
        fi
        ;;
    simple)
        # Force simple DMG for second argument
        create_simple_dmg "${2:-arm64}"
        ;;
    *)
        usage
        ;;
esac

echo ""
echo "Done!"
echo ""
echo "To install: Open the DMG and drag $APP_NAME to Applications"

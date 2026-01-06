#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$ROOT_DIR/dist"
APP_NAME="KorProxy"

usage() {
  cat <<'EOF'
Usage:
  ./scripts/build-dist.sh [arm64|x64|universal] [--dmg]

What it does:
  1) dotnet publish into ./publish/<rid>
  2) bundle into ./dist/KorProxy.app
  3) optionally creates ./dist/KorProxy-<version>.dmg

Tip:
  To install into /Applications, run:
    ./scripts/install-macos.sh
EOF
  exit 1
}

ARCH="${1:-arm64}"
DMG=false

if [[ "${2:-}" == "--dmg" ]]; then
  DMG=true
elif [[ -n "${2:-}" ]]; then
  usage
fi

case "$ARCH" in
  arm64)
    # Clean legacy dist names (keep dist/ simple)
    rm -rf "$DIST_DIR/$APP_NAME-arm64.app" "$DIST_DIR/$APP_NAME-x64.app" "$DIST_DIR/$APP_NAME-universal.app" 2>/dev/null || true
    rm -f "$DIST_DIR/$APP_NAME-"*"-arm64.dmg" "$DIST_DIR/$APP_NAME-"*"-x64.dmg" "$DIST_DIR/$APP_NAME-"*"-universal.dmg" 2>/dev/null || true
    rm -f "$DIST_DIR/temp_$APP_NAME-"*".dmg" 2>/dev/null || true
    "$SCRIPT_DIR/publish.sh" osx-arm64
    "$SCRIPT_DIR/bundle-macos.sh" arm64
    ;;
  x64)
    rm -rf "$DIST_DIR/$APP_NAME-arm64.app" "$DIST_DIR/$APP_NAME-x64.app" "$DIST_DIR/$APP_NAME-universal.app" 2>/dev/null || true
    rm -f "$DIST_DIR/$APP_NAME-"*"-arm64.dmg" "$DIST_DIR/$APP_NAME-"*"-x64.dmg" "$DIST_DIR/$APP_NAME-"*"-universal.dmg" 2>/dev/null || true
    rm -f "$DIST_DIR/temp_$APP_NAME-"*".dmg" 2>/dev/null || true
    "$SCRIPT_DIR/publish.sh" osx-x64
    "$SCRIPT_DIR/bundle-macos.sh" x64
    ;;
  universal)
    rm -rf "$DIST_DIR/$APP_NAME-arm64.app" "$DIST_DIR/$APP_NAME-x64.app" "$DIST_DIR/$APP_NAME-universal.app" 2>/dev/null || true
    rm -f "$DIST_DIR/$APP_NAME-"*"-arm64.dmg" "$DIST_DIR/$APP_NAME-"*"-x64.dmg" "$DIST_DIR/$APP_NAME-"*"-universal.dmg" 2>/dev/null || true
    rm -f "$DIST_DIR/temp_$APP_NAME-"*".dmg" 2>/dev/null || true
    "$SCRIPT_DIR/publish.sh" osx-arm64
    "$SCRIPT_DIR/publish.sh" osx-x64
    "$SCRIPT_DIR/bundle-macos.sh" universal
    ;;
  *)
    usage
    ;;
esac

if [[ "$DMG" == "true" ]]; then
  "$SCRIPT_DIR/create-dmg.sh" "$ARCH"
fi

echo ""
echo "dist updated."
ls -1 "$ROOT_DIR/dist" | sed -n '1,30p'

#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
APP_NAME="KorProxy"
SRC_APP_DEFAULT="$ROOT_DIR/dist/$APP_NAME.app"

DEST_DIR="/Applications"
CLEAR_QUARANTINE=false
CODESIGN=true

usage() {
  cat <<EOF
Usage:
  ./scripts/install-macos.sh [--dest <dir>] [--clear-quarantine] [--no-codesign]

Installs:
  $SRC_APP_DEFAULT
into:
  /Applications (default)

Options:
  --dest <dir>          Install destination directory (default: /Applications)
  --clear-quarantine    Remove com.apple.quarantine xattr from the installed app
  --no-codesign         Skip ad-hoc codesign step
EOF
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest)
      DEST_DIR="${2:-}"
      [[ -n "$DEST_DIR" ]] || usage
      shift 2
      ;;
    --clear-quarantine)
      CLEAR_QUARANTINE=true
      shift
      ;;
    --no-codesign)
      CODESIGN=false
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [[ ! -d "$SRC_APP_DEFAULT" ]]; then
  echo "Error: $SRC_APP_DEFAULT not found." >&2
  echo "Build it first with: ./scripts/build-dist.sh arm64 --dmg" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"
DEST_APP="$DEST_DIR/$APP_NAME.app"

install_with() {
  local sudo_cmd=""
  if [[ "${1:-}" == "sudo" ]]; then
    sudo_cmd="sudo"
  fi

  # Remove any existing app first (common cause of EPERM when overwriting).
  if [[ -e "$DEST_APP" ]]; then
    if [[ -n "$sudo_cmd" ]]; then
      sudo rm -rf "$DEST_APP"
    else
      rm -rf "$DEST_APP"
    fi
  fi

  # Prefer ditto: preserves permissions, symlinks, etc.
  if [[ -n "$sudo_cmd" ]]; then
    sudo ditto "$SRC_APP_DEFAULT" "$DEST_APP"
  else
    ditto "$SRC_APP_DEFAULT" "$DEST_APP"
  fi
}

echo "Installing to: $DEST_APP"
if install_with; then
  :
else
  echo "Normal install failed; retrying with sudo..."
  install_with sudo
fi

if [[ "$CLEAR_QUARANTINE" == "true" ]]; then
  if command -v xattr >/dev/null 2>&1; then
    # Quarantine can prevent launching without right-click open.
    xattr -dr com.apple.quarantine "$DEST_APP" 2>/dev/null || true
  fi
fi

if [[ "$CODESIGN" == "true" ]]; then
  if command -v codesign >/dev/null 2>&1; then
    # Ad-hoc signing helps macOS accept the bundle after copying.
    codesign --force --deep --sign - "$DEST_APP" >/dev/null 2>&1 || true
  fi
fi

echo "Installed: $DEST_APP"
echo "You can now launch it from Finder or Spotlight."

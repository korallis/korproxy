#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLI_PROXY_DIR="$PROJECT_ROOT/../CLIProxyAPI"
BINARIES_DIR="$PROJECT_ROOT/resources/binaries"

echo "🔨 Building CLIProxyAPI binaries..."
echo "   Source: $CLI_PROXY_DIR"
echo "   Output: $BINARIES_DIR"
echo ""

cd "$CLI_PROXY_DIR"

# macOS Apple Silicon (arm64)
echo "📦 Building macOS ARM64 (Apple Silicon)..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o "$BINARIES_DIR/darwin-arm64/cliproxy" ./cmd/server
echo "   ✓ darwin-arm64/cliproxy"

# Windows x64
echo "📦 Building Windows x64..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$BINARIES_DIR/win32-x64/cliproxy.exe" ./cmd/server
echo "   ✓ win32-x64/cliproxy.exe"

echo ""
echo "✅ All binaries built successfully!"
echo ""
ls -lh "$BINARIES_DIR"/*/

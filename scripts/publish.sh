#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT="$ROOT_DIR/src/KorProxy/KorProxy.csproj"
OUTPUT_DIR="$ROOT_DIR/publish"
DOTNET="${DOTNET:-dotnet}"

# Try common dotnet locations if not in PATH
if ! command -v $DOTNET &> /dev/null; then
    if [[ -x "$HOME/.dotnet/dotnet" ]]; then
        DOTNET="$HOME/.dotnet/dotnet"
    elif [[ -x "/usr/local/share/dotnet/dotnet" ]]; then
        DOTNET="/usr/local/share/dotnet/dotnet"
    fi
fi

# Available runtimes
RUNTIMES=("osx-arm64" "osx-x64" "win-x64" "linux-x64")

usage() {
    echo "Usage: $0 [runtime]"
    echo "  runtime: osx-arm64, osx-x64, win-x64, linux-x64, or 'all'"
    echo "  If no runtime specified, builds for current platform"
    exit 1
}

build_runtime() {
    local rid=$1
    echo "Building for $rid..."

    # Default publish mode
    # - macOS: NOT single-file by default because Avalonia/SkiaSharp native libs (libSkiaSharp.dylib)
    #   are often loaded via dlopen name probing and must exist on disk alongside the app.
    # - other platforms: keep single-file unless overridden.
    local publish_single_file="${PUBLISH_SINGLE_FILE:-}"
    if [[ -z "$publish_single_file" ]]; then
        case "$rid" in
            osx-*) publish_single_file="false" ;;
            *)     publish_single_file="true" ;;
        esac
    fi
    
    local binary_dir="$ROOT_DIR/runtimes/$rid"
    if [[ ! -d "$binary_dir" ]] || [[ -z "$(ls -A "$binary_dir" 2>/dev/null)" ]]; then
        echo "Warning: No CLIProxyAPI binary found for $rid in $binary_dir"
        echo "You need to build or download CLIProxyAPI for this platform."
        return 1
    fi
    
    publish_args=(
        publish "$PROJECT"
        -c Release
        -r "$rid"
        --self-contained true
        -o "$OUTPUT_DIR/$rid"
    )

    if [[ "$publish_single_file" == "true" ]]; then
        publish_args+=( -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true )
    else
        publish_args+=( -p:PublishSingleFile=false )
    fi

    $DOTNET "${publish_args[@]}"
    
    mkdir -p "$OUTPUT_DIR/$rid/runtimes/$rid"
    cp "$binary_dir"/* "$OUTPUT_DIR/$rid/runtimes/$rid/" 2>/dev/null || true
    
    cp "$ROOT_DIR/src/KorProxy/appsettings.json" "$OUTPUT_DIR/$rid/" 2>/dev/null || true
    
    echo "Published to $OUTPUT_DIR/$rid"
}

# Main
if [[ $# -eq 0 ]]; then
    # Detect current platform
    case "$(uname -s)-$(uname -m)" in
        Darwin-arm64) RID="osx-arm64" ;;
        Darwin-x86_64) RID="osx-x64" ;;
        Linux-x86_64) RID="linux-x64" ;;
        *) echo "Unknown platform"; exit 1 ;;
    esac
    build_runtime "$RID"
elif [[ "$1" == "all" ]]; then
    for rid in "${RUNTIMES[@]}"; do
        build_runtime "$rid" || true
    done
elif [[ " ${RUNTIMES[*]} " =~ " $1 " ]]; then
    build_runtime "$1"
else
    usage
fi

echo "Done!"

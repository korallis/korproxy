#!/bin/bash
# KorProxy CI Configuration Validation Script
#
# Usage: ./ci-config-validation.sh [config-file]
#
# This script validates KorProxy configuration in CI pipelines.
# Exit code 0 = valid, 1 = invalid
#
# Example GitHub Actions usage:
#   - name: Validate KorProxy Config
#     run: ./examples/automation/ci-config-validation.sh ./config/korproxy.json

set -e

CONFIG_FILE="${1:-~/.korproxy/config.json}"
KORPROXY_CLI="${KORPROXY_CLI:-korproxy}"

echo "🔍 KorProxy Configuration Validation"
echo "====================================="
echo "Config file: $CONFIG_FILE"
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file not found: $CONFIG_FILE"
    exit 1
fi

# Check if korproxy CLI is available
if ! command -v "$KORPROXY_CLI" &> /dev/null; then
    echo "⚠️  Warning: korproxy CLI not found, using basic JSON validation"
    
    # Basic JSON validation
    if ! python3 -c "import json; json.load(open('$CONFIG_FILE'))" 2>/dev/null; then
        echo "❌ Error: Invalid JSON in config file"
        exit 1
    fi
    
    echo "✅ JSON syntax is valid"
    echo "ℹ️  Install korproxy CLI for full schema validation"
    exit 0
fi

# Run korproxy validation
echo "Running korproxy config validate..."
echo ""

if $KORPROXY_CLI config validate "$CONFIG_FILE"; then
    echo ""
    echo "✅ Configuration is valid"
    exit 0
else
    echo ""
    echo "❌ Configuration validation failed"
    exit 1
fi

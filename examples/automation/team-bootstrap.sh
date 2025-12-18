#!/bin/bash
# KorProxy Team Bootstrap Script
#
# This script sets up KorProxy for a new team member with
# standard profiles and provider groups.
#
# Usage: ./team-bootstrap.sh [team-name]
#
# Prerequisites:
#   - korproxy CLI installed
#   - KORPROXY_MANAGEMENT_KEY environment variable set

set -e

TEAM_NAME="${1:-default}"
KORPROXY_CLI="${KORPROXY_CLI:-korproxy}"
KORPROXY_URL="${KORPROXY_URL:-http://localhost:1337}"

echo "🚀 KorProxy Team Bootstrap"
echo "=========================="
echo "Team: $TEAM_NAME"
echo "Proxy URL: $KORPROXY_URL"
echo ""

# Check prerequisites
if [ -z "$KORPROXY_MANAGEMENT_KEY" ]; then
    echo "❌ Error: KORPROXY_MANAGEMENT_KEY not set"
    echo "   Set this environment variable with your management key"
    exit 1
fi

if ! command -v "$KORPROXY_CLI" &> /dev/null; then
    echo "❌ Error: korproxy CLI not found"
    echo "   Install from: https://github.com/korallis/korproxy/releases"
    exit 1
fi

# Create standard profiles
echo "📝 Creating standard profiles..."

# Development profile
$KORPROXY_CLI profile create "Development" --color "#10B981" || true
echo "   ✅ Development profile"

# Production profile
$KORPROXY_CLI profile create "Production" --color "#EF4444" || true
echo "   ✅ Production profile"

# Testing profile
$KORPROXY_CLI profile create "Testing" --color "#F59E0B" || true
echo "   ✅ Testing profile"

# Set development as default
$KORPROXY_CLI profile switch "Development"
echo "   ✅ Set Development as active profile"

echo ""
echo "🔧 Running self-test..."
$KORPROXY_CLI self-test --verbose || echo "⚠️  Some providers not configured"

echo ""
echo "✅ Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  1. Configure provider credentials in the desktop app"
echo "  2. Run 'korproxy provider test --all' to verify"
echo "  3. Switch profiles with 'korproxy profile switch <name>'"

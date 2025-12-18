# KorProxy Automation Examples

This directory contains example scripts for automating KorProxy setup and management.

## Scripts

### ci-config-validation.sh

Validates KorProxy configuration in CI/CD pipelines.

**Usage:**
```bash
./ci-config-validation.sh [config-file]
```

**GitHub Actions Example:**
```yaml
- name: Validate KorProxy Config
  run: |
    chmod +x ./examples/automation/ci-config-validation.sh
    ./examples/automation/ci-config-validation.sh ./config/korproxy.json
```

**GitLab CI Example:**
```yaml
validate-config:
  script:
    - chmod +x ./examples/automation/ci-config-validation.sh
    - ./examples/automation/ci-config-validation.sh ./config/korproxy.json
```

### team-bootstrap.sh

Sets up KorProxy for new team members with standard profiles.

**Usage:**
```bash
export KORPROXY_MANAGEMENT_KEY="your-key"
./team-bootstrap.sh [team-name]
```

**What it does:**
1. Creates Development, Production, and Testing profiles
2. Sets Development as the active profile
3. Runs self-test to verify provider connectivity

## CLI Reference

### Config Commands
```bash
korproxy config export --output backup.json    # Export config
korproxy config import backup.json             # Import config
korproxy config import backup.json --merge     # Merge with existing
korproxy config validate config.json           # Validate config
```

### Profile Commands
```bash
korproxy profile list                          # List all profiles
korproxy profile create "Work" --color "#3B82F6"
korproxy profile switch "Work"                 # Switch active profile
korproxy profile delete "Work"                 # Delete profile
```

### Provider Commands
```bash
korproxy provider list                         # List providers
korproxy provider test claude                  # Test single provider
korproxy provider test --all                   # Test all providers
```

### Diagnostics Commands
```bash
korproxy self-test                             # Run full self-test
korproxy self-test --verbose                   # Detailed output
korproxy debug-bundle --output debug.json      # Generate debug bundle
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KORPROXY_MANAGEMENT_KEY` | Management API authentication key | (none) |
| `KORPROXY_URL` | Proxy server URL | `http://localhost:1337` |
| `KORPROXY_CLI` | Path to korproxy CLI | `korproxy` |

## API Integration

### Health Check
```bash
curl http://localhost:1337/v1/diagnostics/health
```

### List Profiles
```bash
curl http://localhost:1337/v1/profiles
```

### Create Profile (requires auth)
```bash
curl -X POST http://localhost:1337/v1/profiles \
  -H "X-Management-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyProfile", "color": "#3B82F6"}'
```

## Troubleshooting

### "korproxy: command not found"
The CLI is bundled with the desktop app. Add to PATH:
```bash
# macOS
export PATH="$PATH:/Applications/KorProxy.app/Contents/MacOS"

# Linux
export PATH="$PATH:/opt/korproxy/bin"

# Windows (PowerShell)
$env:PATH += ";C:\Program Files\KorProxy"
```

### "Connection refused"
Ensure the proxy is running:
```bash
# Check if proxy is listening
curl -s http://localhost:1337/v1/diagnostics/health || echo "Proxy not running"
```

### "Unauthorized"
Verify your management key:
```bash
# Test authentication
curl -H "X-Management-Key: $KORPROXY_MANAGEMENT_KEY" \
  http://localhost:1337/v1/profiles
```

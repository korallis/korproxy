# Specification: Phase A - Reliable Local Gateway

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.0

## 1. Overview

### 1.1 Summary
Phase A transforms KorProxy into a production-ready local AI gateway that reliably bridges coding tools (Cline, Continue.dev) with AI providers (Claude, Gemini, Codex, Qwen, iFlow). The focus is on stability, observability, and easy setup—ensuring users can trust KorProxy to "just work."

### 1.2 Goals
- **Reliability**: Proxy stays running with automatic recovery from transient failures
- **Visibility**: Users can see proxy health status and test provider connections
- **Easy Integration**: One-click config snippets for popular coding tools
- **Observability**: Local logging with 24-hour retention for diagnosing issues

### 1.3 Non-Goals
- Advanced routing rules (Phase C)
- Multi-account load balancing (Phase C)
- Team/billing features (Phase D)
- First-run onboarding wizard (Phase B)
- Dark/light theme polish (Phase B)

---

## 2. User Stories

### Primary
1. **As a** developer, **I want** the proxy to automatically recover from crashes, **so that** my coding workflow isn't interrupted.
2. **As a** developer, **I want** to test my provider connection with one click, **so that** I can verify setup before using it.
3. **As a** developer, **I want** copy-paste config for Cline, **so that** I can set up KorProxy in under 2 minutes.

### Secondary
1. **As a** developer, **I want** to see when the proxy is unhealthy, **so that** I can restart it before issues occur.
2. **As a** developer, **I want** local logs with context, **so that** I can diagnose issues myself.
3. **As a** developer, **I want** clear error messages when setup fails, **so that** I can fix issues myself.

---

## 3. Requirements

### 3.1 Functional Requirements

#### Sidecar Reliability (`spec: sidecar-reliability`)

| ID | Requirement | Priority |
|----|-------------|----------|
| SR1 | Health monitoring loop polls `/v0/management/usage` every 10 seconds | P0 |
| SR2 | UI displays health state: Healthy (green), Degraded (yellow), Unreachable (red) | P0 |
| SR3 | Auto-restart stops after 3 consecutive failures, shows "Proxy Failed" state | P0 |
| SR4 | 5-second grace period after start before health checks begin | P0 |
| SR5 | Port conflict detection with clear error message | P0 |
| SR6 | Config file validation before starting sidecar | P0 |
| SR7 | Clean shutdown on app quit (no orphan processes) | P0 |
| SR8 | Single-instance guard prevents concurrent start() calls | P0 |

#### Provider Testing (`spec: provider-testing`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PT1 | "Run Test" button per connected provider in Providers page | P0 |
| PT2 | Test sends minimal prompt via localhost proxy | P0 |
| PT3 | Display result: success/failure, latency (ms), error message | P0 |
| PT4 | Test results logged to in-app logs | P0 |
| PT5 | Clear error guidance: "Token expired", "Quota exceeded", "Proxy not running" | P0 |

#### Provider Parity (`spec: provider-parity`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PP1 | Automated smoketest for all 5 providers (internal tooling) | P0 |
| PP2 | Default model configured per provider for test requests | P0 |
| PP3 | OAuth tokens correctly written to CLIProxy config on connect | P0 |
| PP4 | Provider capability documentation (internal) | P1 |

#### Local Logging (`spec: local-logging`)

| ID | Requirement | Priority |
|----|-------------|----------|
| LL1 | Structured JSON log files in app data directory | P0 |
| LL2 | Auto-delete logs older than 24 hours | P0 |
| LL3 | Log levels: debug, info, warn, error | P0 |
| LL4 | Log sidecar lifecycle events (start/stop/restart/crash) | P0 |
| LL5 | Log health check results and state transitions | P0 |
| LL6 | Log provider test requests and results | P0 |
| LL7 | In-app log viewer with filtering by level and time | P1 |
| LL8 | Export logs button for manual troubleshooting | P1 |

#### Tool Integrations (`spec: tool-integrations`)

| ID | Requirement | Priority |
|----|-------------|----------|
| TI1 | Cline config preset with copy button | P1 |
| TI2 | Continue.dev config preset with copy button | P1 |
| TI3 | Integration status: Detected / Not Detected | P1 |
| TI4 | Inline setup instructions per tool | P1 |

**Existing Integrations** (already implemented, no changes needed):
- **Amp CLI** - `~/.config/amp/settings.json` via `INTEGRATIONS_AMP_*` IPC handlers
- **Factory Droid CLI** - `~/.factory/config.json` via `INTEGRATIONS_FACTORY_*` IPC handlers

**Note**: Cursor no longer supports local proxied models as of late 2024. Windsurf uses its own Cascade AI backend and doesn't support custom OpenAI-compatible proxies.

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Health check latency | < 500ms |
| NFR2 | Proxy startup time | < 3 seconds to healthy |
| NFR3 | Proxy uptime (while app running) | > 99% |
| NFR4 | Auto-recovery success rate | > 90% of transient failures |
| NFR5 | Test request timeout | 30 seconds |
| NFR6 | No orphan processes | 100% clean shutdown |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     KorProxy Desktop App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Electron Main Process                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ProxySidecar │  │HealthMonitor│  │   LogManager        │ │ │
│  │  │  (existing) │  │    (NEW)    │  │      (NEW)          │ │ │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │ │
│  │         │                │                                  │ │
│  │  ┌──────┴────────────────┴──────────────────────────────┐  │ │
│  │  │                  IPC Handlers                         │  │ │
│  │  │  PROXY_START/STOP/STATUS (existing)                   │  │ │
│  │  │  PROXY_HEALTH (new)                                   │  │ │
│  │  │  PROVIDER_TEST_RUN (new)                              │  │ │
│  │  │  TOOL_INTEGRATION_* (new)                             │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                  │
│                              │ IPC                              │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Electron Renderer (React)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │HealthStatus │  │ProviderTest │  │ToolIntegrations     │ │ │
│  │  │   (NEW)     │  │    (NEW)    │  │      (NEW)          │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │                 LogViewer (NEW)                       │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (localhost:1337)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              CLIProxyAPI (Go Sidecar)                           │
│  /v0/management/usage  ←── Health checks                        │
│  /v1/chat/completions  ←── Provider requests                    │
│  /v1/messages          ←── Claude requests                      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

**HealthState** (new enum):
- `stopped` - Proxy intentionally stopped by user
- `starting` - Proxy is starting, in grace period (5s)
- `healthy` - Proxy responding within 500ms, no errors
- `degraded` - Proxy responding but latency > 500ms or intermittent errors (1-2 consecutive failures)
- `unreachable` - Proxy not responding (3+ consecutive failures), auto-restart triggered
- `failed` - Auto-restart exhausted (3 attempts), needs manual intervention

**State Transition Rules**:
- `stopped` → `starting`: User clicks Start
- `starting` → `healthy`: First successful health check after grace period
- `starting` → `unreachable`: 3 consecutive failures during/after grace period
- `healthy` → `degraded`: Response latency > 500ms OR 1-2 consecutive failures
- `degraded` → `healthy`: Response latency < 500ms AND no failures
- `degraded` → `unreachable`: 3 consecutive failures
- `unreachable` → `starting`: Auto-restart triggered (if attempts < 3)
- `unreachable` → `failed`: Auto-restart attempts exhausted
- `failed` → `starting`: User clicks Restart
- Any state → `stopped`: User clicks Stop

**ProviderTestResult** (new interface):
- `providerId`: string (gemini, claude, codex, qwen, iflow)
- `success`: boolean
- `latencyMs`: number (optional)
- `errorCode`: string (optional)
- `errorMessage`: string (optional)
- `timestamp`: ISO string

**ToolIntegration** (new interface):
- `toolId`: string (cline, continue)
- `displayName`: string
- `detected`: boolean
- `configPath`: string (optional)
- `configSnippet`: string
- `instructions`: string

**Tool Configuration Details**:

**Cline** (VS Code Extension):
- Config: VS Code `settings.json`
- Paths:
  - macOS: `~/Library/Application Support/Code/User/settings.json`
  - Linux: `~/.config/Code/User/settings.json`
  - Windows: `%APPDATA%\Code\User\settings.json`
- Snippet:
```json
{
  "cline.apiProvider": "openai",
  "cline.openai": {
    "apiKey": "korproxy",
    "baseURL": "http://localhost:1337/v1"
  },
  "cline.defaultModel": "claude-sonnet-4-5-20250929"
}
```

**Continue.dev** (VS Code Extension):
- Config: `~/.continue/config.yaml` or `~/.continue/config.json`
- Snippet:
```json
{
  "models": [
    {
      "title": "KorProxy Claude Sonnet 4.5",
      "provider": "openai",
      "model": "claude-sonnet-4-5-20250929",
      "apiKey": "korproxy",
      "apiBase": "http://localhost:1337/v1"
    },
    {
      "title": "KorProxy GPT-5.1 Codex",
      "provider": "openai",
      "model": "gpt-5.1-codex",
      "apiKey": "korproxy",
      "apiBase": "http://localhost:1337/v1"
    },
    {
      "title": "KorProxy Gemini 3 Pro",
      "provider": "openai",
      "model": "gemini-3-pro-preview",
      "apiKey": "korproxy",
      "apiBase": "http://localhost:1337/v1"
    }
  ]
}
```

**Available Models** (from CLIProxyAPI registry):
- Claude: `claude-opus-4-5-20251101`, `claude-sonnet-4-5-20250929`, `claude-haiku-4-5-20251001`
- OpenAI: `gpt-5.1-codex-max`, `gpt-5.1-codex`, `gpt-5.1-codex-mini`, `gpt-5`
- Gemini: `gemini-3-pro-preview`, `gemini-2.5-pro`, `gemini-2.5-flash`

### 4.3 API Design

**New IPC Channels**:

`PROXY_HEALTH` (main → renderer push):
- Emits on health state changes
- Payload: `{ state: HealthState, lastCheck: timestamp, consecutiveFailures: number }`

`PROVIDER_TEST_RUN` (renderer → main):
- Input: `{ providerId: string, modelId?: string }`
- Output: `ProviderTestResult`
- Sends POST to `/v1/chat/completions` with minimal test prompt

`TOOL_INTEGRATION_LIST` (renderer → main):
- Returns: `ToolIntegration[]`
- Checks filesystem for tool config files

`TOOL_INTEGRATION_COPY` (renderer → main):
- Input: `{ toolId: string }`
- Copies config snippet to clipboard

### 4.4 Key Algorithms

**Health Monitoring Loop** (HealthMonitor is the single authority for restarts):
1. On sidecar start: emit `starting` state, begin 5s grace period
2. After grace period: start polling every 10 seconds
3. HTTP GET `/v0/management/usage` with 2s timeout
4. On success with latency < 500ms: reset failure counter, emit `healthy`
5. On success with latency >= 500ms: emit `degraded` (but don't increment failure counter)
6. On failure: increment failure counter
   - 1-2 failures: emit `degraded`
   - 3+ failures: emit `unreachable`
7. When `unreachable` and restartAttempts < 3:
   - Increment restartAttempts
   - Call `sidecar.restart()` (which handles process lifecycle)
   - Reset to `starting` state
8. When `unreachable` and restartAttempts >= 3:
   - Emit `failed` state
   - Stop polling until user manually restarts

**Note**: Existing `sidecar.ts` auto-restart logic will be disabled/removed. HealthMonitor becomes the single owner of restart decisions to avoid conflicting behaviors.

**Provider Test Flow**:
1. Validate sidecar is running
2. Build minimal request: `{ model: defaultModel, messages: [{ role: "user", content: "Say 'OK'" }], max_tokens: 10 }`
3. POST to `http://localhost:{port}/v1/chat/completions` (or provider-specific endpoint)
4. Measure latency from request start to first byte
5. Parse response, extract success/error
6. Return `ProviderTestResult`, log to console

---

## 5. Reusable Code

### Existing Components to Leverage
- `electron/main/sidecar.ts` - Extend with health monitor integration
- `electron/main/ipc.ts` - Add new IPC handlers following existing patterns
- `electron/common/ipc-types.ts` - Add new type definitions
- `src/hooks/useProxyStatus.ts` - Extend for health state
- `src/components/dashboard/StatusCard.tsx` - Pattern for status display

### Patterns to Follow
- IPC handler pattern with Zod validation as seen in `electron/main/ipc.ts`
- React hook for IPC subscriptions as seen in `src/hooks/useProxy.ts`
- Integration status pattern as seen in Factory/Amp handlers in `ipc.ts`

---

## 6. Testing Strategy

### Unit Tests
- Health monitor state transitions:
  - `stopped` → `starting` → `healthy` (happy path)
  - `healthy` → `degraded` (high latency > 500ms)
  - `healthy` → `degraded` → `unreachable` (consecutive failures)
  - `unreachable` → `starting` (auto-restart)
  - `unreachable` → `failed` (3 restart attempts exhausted)
- Provider test request building for each provider type
- Tool config snippet generation for Cline, Continue.dev
- Log rotation: verify logs older than 24h are deleted
- Single-instance guard: concurrent start() calls are serialized

### Integration Tests
- Health monitor + sidecar lifecycle integration
- IPC round-trip for PROVIDER_TEST_RUN
- Log file creation and rotation
- Port conflict: start proxy while port 1337 occupied → clear error
- Config validation: corrupt/missing config file → clear error

### E2E Tests
- Full flow: Start proxy → Health shows green → Test provider → Success displayed
- Failure flow: Kill sidecar → Health shows red → Auto-restart → Health green
- Flapping: Sidecar crashes repeatedly → `failed` state → "Proxy Failed" UI
- Tool integration: Open panel → Copy Cline config → Verify clipboard
- Manual restart from failed state: Click Restart → Proxy recovers

### Provider Smoketests (CI)
- Script that starts proxy, runs test request for each provider
- Runs against real providers (requires secrets in CI)
- Soft-fail mode: alert but don't block builds on external provider outages
- Hard-fail on: proxy startup failure, config errors, internal errors

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `LOG_LEVEL` - Environment variable to set log verbosity (debug, info, warn, error)
- `LOG_RETENTION_HOURS` - Hours to retain logs (default: 24)

### 7.2 Migration
- No data migration required
- Existing sidecar config files remain compatible
- New health state stored in memory only (not persisted)

### 7.3 Rollback
- Logs can be cleared manually from app data directory
- Health monitor can be disabled by removing the polling interval
- Tool presets are read-only, no rollback needed

---

## 8. Open Questions
- [ ] Should health checks use `/v0/health` (new) or `/v0/management/usage` (existing)?
- [ ] What test prompt is safe and fast for all providers?
- [ ] How to handle offline/DNS failure in provider tests? Distinct error code?
- [ ] Log file format: single file per day or rolling file with size limit?

## 8.1 Decisions Made
- **Restart ownership**: HealthMonitor is the single authority. Existing `sidecar.ts` auto-restart will be removed.
- **Degraded threshold**: Latency > 500ms OR 1-2 consecutive failures
- **Unreachable threshold**: 3+ consecutive failures
- **PII policy**: Never attach request/response bodies or headers. Only log: error messages, HTTP status codes, provider IDs, OS, app version.

## 9. References
- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Existing Sidecar Implementation](../../../korproxy-app/electron/main/sidecar.ts)
- [Existing IPC Handlers](../../../korproxy-app/electron/main/ipc.ts)

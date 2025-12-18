# Requirements: Phase A - Reliable Local Gateway

## Overview
Phase A transforms KorProxy into a rock-solid, no-surprises bridge between AI coding tools and providers. The goal is to ship KorProxy 1.0 with reliable proxy operation, verified provider support, basic telemetry, and easy integration with popular coding tools.

## User Stories

### Primary User Stories
1. **As a** developer, **I want** the proxy to reliably start and stay running, **so that** my AI coding tools work without interruption.
2. **As a** developer, **I want** to test that my provider connection works, **so that** I can troubleshoot issues before they affect my workflow.
3. **As a** developer, **I want** clear integration instructions for my coding tool, **so that** I can set up KorProxy quickly.

### Secondary User Stories
1. **As a** developer, **I want** to see when the proxy is unhealthy, **so that** I can take action before it affects my work.
2. **As a** developer, **I want** automatic crash recovery, **so that** temporary issues don't require manual intervention.
3. **As a** support engineer, **I want** crash reports and telemetry, **so that** I can diagnose user issues effectively.

---

## Functional Requirements

### Must Have (P0)

#### Sidecar Reliability (`spec: sidecar-reliability`)
- [ ] **Health monitoring loop** - Periodic health checks (every 10s) to `/v0/management/usage` or `/v0/health`
- [ ] **Health state visualization** - UI shows Healthy/Degraded/Unreachable states clearly
- [ ] **Flapping protection** - Stop auto-restart after 3 consecutive failures, show "Proxy failed" state
- [ ] **Startup grace period** - 5s warm-up before health checks begin after start
- [ ] **Port conflict detection** - Clear error message when port 1337 is in use
- [ ] **Config validation** - Validate config file exists and is parseable before starting sidecar
- [ ] **Clean shutdown** - Ensure no orphan processes on app quit (verify `before-quit` handler)
- [ ] **Single instance guard** - Prevent concurrent `start()` calls with pending-start flag

#### Provider Parity (`spec: provider-parity`)
- [ ] **Smoketest suite** - Automated tests for all 5 providers (Gemini, Claude, Codex, Qwen, iFlow)
- [ ] **Default model per provider** - Configure one reliable model for each provider
- [ ] **Token→Config wiring** - Ensure OAuth tokens are correctly written to CLIProxy config
- [ ] **Provider capability matrix** - Internal documentation of supported operations per provider

#### Provider Testing (`spec: provider-testing`)
- [ ] **Test request IPC** - New `PROVIDER_TEST_RUN` channel to send test prompts
- [ ] **Test request UI** - "Run test" button per connected provider showing success/failure/latency
- [ ] **Clear error messages** - Surface token issues, quota limits, network errors with actionable guidance
- [ ] **Test logging** - Log all test results to in-app logs

#### Telemetry (`spec: telemetry`)
- [ ] **Sentry integration** - Initialize in main + renderer processes with DSN
- [ ] **Crash capture** - Capture unhandled exceptions, rejections, and Electron crashes
- [ ] **PII scrubbing** - Never capture prompts, code, or provider responses
- [ ] **Safe breadcrumbs** - Only log: OS, app version, provider IDs, error types, proxy state
- [ ] **Sidecar event tracking** - Track start/stop/restart events and failure reasons

### Should Have (P1)

#### Tool Integrations (`spec: tool-integrations`)
- [ ] **Cursor preset** - Copy-paste config snippet with endpoint URL and model names
- [ ] **Cline preset** - Copy-paste config snippet for Cline setup
- [ ] **Windsurf preset** - Copy-paste config snippet for Windsurf setup
- [ ] **Integration status UI** - Show "Detected/Configured/Not detected" for each tool
- [ ] **Inline instructions** - Short setup guide per tool in the app

#### Enhanced Diagnostics
- [ ] **Log viewer filters** - Filter by error level, sidecar restarts, provider
- [ ] **Session correlation** - Tag logs with session ID and sidecar PID
- [ ] **Diagnostics export** - Export logs + system info for support tickets

### Nice to Have (P2)
- [ ] **Auto-config for tools** - Write to Cursor/Cline/Windsurf config files (with user consent)
- [ ] **Performance benchmarks** - Latency metrics per provider in test results
- [ ] **Local metrics dashboard** - In-app view of request success rates, latencies

---

## Non-Functional Requirements

### Performance
- Health check response time: < 500ms
- Proxy startup time: < 3s from start() call to healthy state
- Test request timeout: 30s (provider-dependent)

### Reliability
- Proxy uptime (while app running): > 99%
- Auto-recovery success rate: > 90% of transient failures
- No orphan processes on app quit: 100%

### Security
- No PII in telemetry (prompts, code, tokens)
- OAuth tokens stored securely (system keychain where available)
- Localhost-only management endpoints

### Accessibility
- Health status clearly indicated with text + color (not color alone)
- Error messages actionable with clear next steps

---

## Technical Constraints
- Must work with existing `ProxySidecar` architecture in `electron/main/sidecar.ts`
- Must not require changes to CLIProxyAPI (use existing endpoints)
- Sentry SDK must be compatible with Electron 33
- Tool integration must be non-destructive (copy-paste primary, auto-config opt-in)

## Dependencies
- **CLIProxyAPI** - `/v0/management/usage` endpoint for health checks
- **Sentry SDK** - `@sentry/electron` for crash reporting
- **System keychain** - For secure token storage (existing)
- **Tool config file locations** - Research needed for Cursor, Cline, Windsurf

---

## Acceptance Criteria

### Criterion 1: Health Monitoring
- **Given**: The proxy is started and running
- **When**: The health check fails 3 consecutive times
- **Then**: UI shows "Proxy Unhealthy" state with option to restart

### Criterion 2: Provider Test
- **Given**: A provider (e.g., Claude) is connected with valid tokens
- **When**: User clicks "Run test request"
- **Then**: A test prompt is sent, and success/failure + latency is displayed within 30s

### Criterion 3: Crash Recovery
- **Given**: The proxy sidecar crashes unexpectedly
- **When**: Auto-recovery is enabled
- **Then**: The proxy restarts automatically within 10s (up to 3 attempts)

### Criterion 4: Tool Integration
- **Given**: User wants to configure Cursor
- **When**: User opens integration panel
- **Then**: Copy-paste config snippet is available with correct endpoint and model names

### Criterion 5: Telemetry
- **Given**: An unhandled exception occurs in the renderer
- **When**: Sentry is enabled
- **Then**: Error is reported with app version, OS, and error type (no PII)

---

## Open Questions
- [ ] Does CLIProxyAPI have a dedicated `/v0/health` endpoint, or should we use `/v0/management/usage`?
- [ ] What are the exact config file paths for Cursor, Cline, and Windsurf on each OS?
- [ ] Should we support opt-out of telemetry, or is it required for all users?
- [ ] What's the minimum latency threshold to consider a provider "healthy"?

## Research Notes

### Current Implementation Status

**Sidecar Lifecycle** ✅ Mostly implemented:
- Process spawning with platform-specific binaries
- Auto-recovery with exponential backoff (3 retries, 1s→2s→4s, max 10s)
- Graceful shutdown (SIGTERM → SIGKILL after 5s)
- Status polling via HTTP to /v0/management/usage
- ⚠️ Gap: No continuous health monitoring loop (reactive, not proactive)

**Provider OAuth** ✅ Fully implemented for all 5 providers:
- Gemini (Google), Claude (Anthropic), Codex (OpenAI), Qwen, iFlow
- OAuth2 with PKCE, local callback servers
- Token refresh mechanisms
- Account management UI

**Observability** ⚠️ Basic only:
- In-app log viewing with filtering
- Proxy stdout/stderr capture
- Error boundaries in React
- ❌ No Sentry/crash reporting
- ❌ No external telemetry

**Tool Integrations** ✅ Partial:
- Factory CLI integration exists
- Amp CLI integration exists
- ❌ No Cursor/Cline/Windsurf presets

### Key Files
- `electron/main/sidecar.ts` - Sidecar lifecycle management
- `electron/main/ipc.ts` - IPC handlers including stats polling
- `src/hooks/useProxy.ts` - Frontend proxy state management
- `src/components/dashboard/UsageChart.tsx` - Stats visualization

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Health loop causing false positives | Medium | Grace period after start, multiple failures before restart |
| Flapping from persistent config errors | High | Config validation, stop restarts on repeated same error |
| Provider parity drift vs CLIProxyAPI | Medium | Version checking, capability manifest |
| Tool config format changes | Low | Manual copy-paste as primary, auto-config opt-in |
| Telemetry capturing PII | High | Aggressive scrubbing, no prompt/code capture |

## Visuals
- [To be added: Health state indicator mockup]
- [To be added: Provider test UI mockup]
- [To be added: Tool integration panel mockup]

# Requirements: Phase F - GA Readiness & Production Hardening

> **Status**: Shaping Complete
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.0 GA

## Overview

Phase F prepares KorProxy for 1.0 General Availability by hardening reliability, improving observability, optimizing performance, building admin tools, and stabilizing the API/CLI for automation. This phase ensures the product is "boringly reliable" - predictable, well-tested, and easy to troubleshoot.

## User Stories

### Primary User Stories
1. **As a** developer, **I want** KorProxy to work reliably across all providers, **so that** I can trust it for daily coding work without surprises.
2. **As a** user debugging an issue, **I want** easy-to-understand diagnostics, **so that** I can quickly identify whether the problem is KorProxy, my config, or the provider.
3. **As a** power user, **I want** a stable CLI/API for automation, **so that** I can script KorProxy setup and integrate it into my workflows.
4. **As a** team admin, **I want** admin tools to help users, **so that** I can resolve issues without accessing their machines.
5. **As a** user on slower hardware, **I want** KorProxy to be lightweight and fast, **so that** it doesn't slow down my development environment.

### Secondary User Stories
1. **As a** support engineer, **I want** standardized error codes and debug bundles, **so that** I can quickly diagnose issues from user reports.
2. **As a** CI pipeline owner, **I want** to validate KorProxy configuration in CI, **so that** broken configs don't reach production.
3. **As a** user experiencing provider issues, **I want** clear feedback on rate limits and errors, **so that** I know when to retry or switch providers.

---

## Functional Requirements

### Must Have (P0)

#### E2E Test Coverage (`spec: e2e-coverage`)
- [ ] E2E tests for all 5 providers (Claude, Codex, Gemini, Qwen, iFlow):
  - Auth/OAuth flow per provider
  - Basic chat completion request
  - Basic text completion request (where supported)
  - Streaming response handling
  - Error handling (invalid auth, rate limits)
- [ ] E2E tests for critical user flows:
  - Onboarding wizard completion
  - Profile creation and switching
  - Routing rule application
  - Team member invite and acceptance
- [ ] E2E test matrix covering:
  - Desktop app (Electron + Playwright)
  - Web dashboard (Next.js + Playwright)
  - CLI proxy (Go tests)
- [ ] CI integration with test gates on PRs
- [ ] Smoke tests for config migrations

#### Local-First Diagnostics (`spec: local-diagnostics`)
- [ ] Structured JSON logging with correlation IDs across all surfaces
- [ ] Request tracing: correlation ID from client → proxy → provider → response
- [ ] User-facing diagnostics view in desktop app:
  - Recent requests with provider, model, latency, status
  - Filter by success/failure
  - Search by time range
- [ ] "Copy diagnostic bundle" button:
  - Sanitized logs (secrets redacted)
  - Config snapshot (sensitive fields masked)
  - System info (OS, app version, provider states)
- [ ] Local metrics dashboard:
  - Requests per provider (last 7 days)
  - Error rates by provider
  - P50/P90/P99 latency
- [ ] Configurable log verbosity (debug/info/warn/error)

#### Performance & Resilience (`spec: performance`)
- [ ] Connection pooling for provider APIs in Go proxy
- [ ] Keep-alive connections to reduce handshake overhead
- [ ] Graceful rate limit handling:
  - Detect provider rate limit responses (429, specific error codes)
  - Exponential backoff with jitter
  - Clear user-facing message: "Provider rate limited, retrying in Xs"
- [ ] Startup optimization: < 3 seconds to ready state
- [ ] Memory-efficient streaming response handling
- [ ] Performance regression tests in CI:
  - Baseline latency for each provider
  - Throughput under load (10 concurrent requests)

### Should Have (P1)

#### Admin & Support Tools (`spec: admin-tools`)
- [ ] Admin dashboard (web, internal/authenticated):
  - View user/team status and recent errors
  - Per-provider connection status
  - Feature flag toggles per user/team
- [ ] Support utilities:
  - Standardized error codes with documentation
  - CLI command: `korproxy debug-bundle` generates support bundle
  - Debug bundle includes: sanitized config, last 100 log entries, provider states
- [ ] Safe mode routing:
  - Force all requests to a stable fallback provider
  - Activated via CLI flag or admin toggle
- [ ] Override mechanisms:
  - Admin can reset user's routing rules
  - Emergency disable of specific providers

#### API/CLI Stabilization (`spec: api-cli`)
- [ ] Versioned HTTP API (`/v1/...`) with:
  - Profile management (CRUD)
  - Routing rule management
  - Provider status
  - Metrics export
- [ ] Deprecation policy documented
- [ ] CLI commands for automation:
  - `korproxy config export` / `korproxy config import`
  - `korproxy provider test <provider>` - smoketest single provider
  - `korproxy self-test` - test all configured providers
  - `korproxy profile list/create/delete/switch`
- [ ] Example automation scripts:
  - CI validation of config
  - Team bootstrapping script
- [ ] Auth model documentation (Electron ↔ Web ↔ CLI ↔ Proxy)

### Nice to Have (P2)

- [ ] Prometheus-compatible metrics endpoint (`/metrics`)
- [ ] OpenTelemetry trace export (optional, disabled by default)
- [ ] Automated changelog generation from git tags
- [ ] Performance dashboard with historical trends
- [ ] Webhook notifications for critical errors
- [ ] API rate limiting per client
- [ ] Config schema validation with detailed error messages

---

## Non-Functional Requirements

### Performance
- Proxy startup time: < 3 seconds
- Request overhead (proxy latency): < 50ms p50, < 100ms p95
- Memory usage: < 200MB idle, < 500MB under load
- E2E test suite: completes in < 10 minutes

### Reliability
- Provider E2E success rate: ≥ 99% when provider is healthy
- Crash-free sessions: > 99.5%
- Graceful degradation: app usable when one provider fails

### Security
- All diagnostic bundles sanitize secrets before export
- Correlation IDs don't leak sensitive data
- Admin tools require authentication
- Rate limit handling doesn't expose internal state

### Observability
- All errors have unique, documented error codes
- Logs include timestamp, level, source, correlation ID
- Metrics retain 7 days of history locally

---

## Technical Constraints

- **No Sentry**: All telemetry must be local-first
- **Bun only**: No npm commands in any package
- **CLIProxyAPI submodule**: Changes require separate PR
- **Convex validators**: All functions must have `returns` validators
- **Backward compatibility**: API v1 must not break existing integrations

## Dependencies

### External
- CLIProxyAPI releases for proxy changes
- Provider API stability (rate limits, auth flows)

### Internal
- Phases A-E complete (all implemented)
- Existing test infrastructure (Playwright, Vitest, Go testing)
- Existing metrics system (CLIProxyAPI metrics collector)
- Existing log manager (Electron log-manager.ts)

---

## Acceptance Criteria

### AC1: Provider E2E Coverage
- **Given**: A fresh KorProxy install
- **When**: E2E test suite runs against all 5 providers
- **Then**: All provider tests pass with > 99% success rate

### AC2: Diagnostic Bundle
- **Given**: A user experiencing issues
- **When**: They click "Copy diagnostic bundle" in settings
- **Then**: A JSON bundle is copied with sanitized logs, config, and system info

### AC3: Performance Baseline
- **Given**: KorProxy running with default config
- **When**: 10 concurrent chat requests sent to Claude
- **Then**: P95 latency overhead < 100ms, no requests dropped

### AC4: CLI Automation
- **Given**: A CI pipeline with KorProxy config
- **When**: `korproxy config validate` runs
- **Then**: Config errors reported with clear messages, exit code 1 on failure

### AC5: Admin Override
- **Given**: A user with broken routing rules
- **When**: Admin enables safe mode for that user
- **Then**: All requests route to fallback provider until resolved

### AC6: Error Documentation
- **Given**: Any error in KorProxy
- **When**: Error is shown to user
- **Then**: Error includes unique code (e.g., KP-AUTH-001) and links to docs

---

## Open Questions

### Pending
- [ ] Which provider should be the "safe mode" fallback? (Recommend: Claude Haiku for speed/reliability)
- [ ] Should admin dashboard be separate from user dashboard? (Recommend: same app, role-gated)
- [ ] Metrics retention policy: 7 days or configurable? (Recommend: 7 days default, configurable)
- [ ] Should API v1 require authentication? (Recommend: yes for writes, optional for reads)
- [ ] Error code namespace format? (Propose: KP-{CATEGORY}-{NUMBER})

### Resolved
- [x] Local-first vs cloud telemetry → Local-first only, no external services
- [x] Performance targets → < 50ms p50, < 100ms p95 overhead
- [x] Test coverage targets → E2E for all providers, unit tests for utilities

---

## Research Notes

### Existing Infrastructure to Leverage

**Test Infrastructure**:
- Playwright configs for web and Electron E2E tests
- Vitest setup with IPC mocks, store testing patterns
- Go test patterns with table-driven tests, httptest
- 219 unit tests, 10 E2E test files already exist

**Logging & Metrics**:
- `log-manager.ts` - File-based logging with 24h retention, JSON format
- `CLIProxyAPI/internal/logging/` - Logrus-based logging with rotation
- `CLIProxyAPI/internal/metrics/` - Collector, store, histogram, handler
- Metrics endpoint at `/_korproxy/metrics` with time range filtering
- Request logging middleware with sensitive data masking

**Request Tracking**:
- Correlation ID support via `X-Request-ID` header
- Request/response recording in Gin context
- Streaming response chunk tracking

### Performance Baseline (to measure)
- Current startup time: unknown
- Current request overhead: unknown
- Current memory usage: unknown
→ Need benchmarks before optimization

### Error Code Categories (proposed)
- `KP-AUTH-xxx` - Authentication errors
- `KP-PROV-xxx` - Provider errors
- `KP-CONF-xxx` - Configuration errors
- `KP-NET-xxx` - Network errors
- `KP-RATE-xxx` - Rate limiting errors

---

## Success Metrics (from Roadmap)

| Metric | Target | Measurement |
|--------|--------|-------------|
| E2E test success rate | ≥ 99% per provider | CI test results |
| Crash-free sessions | > 99.5% | Local error tracking |
| Time to diagnose issue | < 5 minutes | Support ticket analysis |
| CLI adoption | > 20% of power users | Usage analytics |

---

## Visuals

- TBD: Diagnostics view wireframe
- TBD: Admin dashboard mockup
- TBD: Error code documentation structure

---

## References

- [Product Roadmap](../../../product/roadmap.md)
- [Phase E Spec](../phase-e-ecosystem-growth/spec.md) - Recent patterns
- [Existing E2E Tests](../../../korproxy-app/e2e/)
- [Log Manager](../../../korproxy-app/electron/main/log-manager.ts)
- [Metrics System](../../../CLIProxyAPI/internal/metrics/)
- [Request Logging](../../../CLIProxyAPI/internal/logging/request_logger.go)

# Specification: Phase F - GA Readiness & Production Hardening

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.0 GA

## 1. Overview

### 1.1 Summary
Phase F prepares KorProxy for 1.0 General Availability by establishing comprehensive E2E test coverage across all providers, implementing local-first diagnostics with correlation IDs and debug bundles, optimizing performance with connection pooling and graceful rate limiting, building admin tools for support workflows, and stabilizing the API/CLI for automation. This phase ensures KorProxy is "boringly reliable" - predictable, well-tested, and easy to troubleshoot.

### 1.2 Goals
- **Reliability**: Every provider and critical flow is thoroughly tested with ≥99% E2E success rate
- **Observability**: Easy-to-understand diagnostics without external services (local-first)
- **Performance**: Low latency (<50ms p50), efficient resource usage, graceful degradation
- **Operability**: Support/admin can help users quickly with standardized tools
- **Automation**: Stable API/CLI surface for scripting and CI integration

### 1.3 Non-Goals
- Cloud-based telemetry or crash reporting (Sentry, DataDog, etc.)
- Mobile app or additional platform support
- Enterprise features (SSO, SAML, audit logs)
- Plugin system or third-party extensibility
- Real-time collaboration features
- Provider-side optimizations (beyond connection pooling)

---

## 2. User Stories

### Primary
1. **As a** developer, **I want** KorProxy to work reliably across all providers, **so that** I can trust it for daily coding work without surprises.
2. **As a** user debugging an issue, **I want** easy-to-understand diagnostics, **so that** I can quickly identify whether the problem is KorProxy, my config, or the provider.
3. **As a** power user, **I want** a stable CLI/API for automation, **so that** I can script KorProxy setup and integrate it into my workflows.
4. **As a** team admin, **I want** admin tools to help users, **so that** I can resolve issues without accessing their machines.
5. **As a** user on slower hardware, **I want** KorProxy to be lightweight and fast, **so that** it doesn't slow down my development environment.

### Secondary
1. **As a** support engineer, **I want** standardized error codes and debug bundles, **so that** I can quickly diagnose issues from user reports.
2. **As a** CI pipeline owner, **I want** to validate KorProxy configuration in CI, **so that** broken configs don't reach production.
3. **As a** user experiencing provider issues, **I want** clear feedback on rate limits and errors, **so that** I know when to retry or switch providers.

---

## 3. Requirements

### 3.1 Functional Requirements

#### E2E Test Coverage (`spec: e2e-coverage`)

| ID | Requirement | Priority |
|----|-------------|----------|
| E2E1 | E2E tests for all 5 providers: auth, chat, text completion (where supported), streaming, errors | P0 |
| E2E2 | E2E tests for critical flows: onboarding, profiles, routing, teams | P0 |
| E2E3 | Test matrix: Electron (Playwright), Next.js (Playwright), Go (testing) | P0 |
| E2E4 | CI integration with test gates blocking PRs on failure | P0 |
| E2E5 | Smoke tests for config migrations between versions | P0 |
| E2E6 | Provider mock server for offline CI testing | P1 |
| E2E7 | Performance regression tests in CI pipeline | P1 |

#### Local-First Diagnostics (`spec: local-diagnostics`)

| ID | Requirement | Priority |
|----|-------------|----------|
| LD1 | Correlation IDs propagated: client → proxy → provider → response | P0 |
| LD2 | User-facing diagnostics view: recent requests, filter, search | P0 |
| LD3 | "Copy diagnostic bundle" with sanitized logs + config + system info | P0 |
| LD4 | Local metrics dashboard: requests, errors, P50/P90/P99 latency by provider (7-day window) | P0 |
| LD5 | Configurable log verbosity per component | P0 |
| LD6 | Standardized error codes (KP-XXX-NNN format) with documentation | P1 |
| LD7 | CLI command `korproxy debug-bundle` for terminal users | P1 |

#### Performance & Resilience (`spec: performance`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PF1 | Connection pooling for provider APIs in Go proxy | P0 |
| PF2 | Graceful rate limit handling with backoff and user feedback | P0 |
| PF3 | Startup optimization: < 3 seconds to ready state | P0 |
| PF4 | Memory-efficient streaming response handling | P0 |
| PF5 | Keep-alive connections to reduce handshake overhead | P0 |
| PF6 | Performance baseline benchmarks in CI | P1 |
| PF7 | Prometheus-compatible metrics endpoint (`/metrics`) | P2 |

#### Admin & Support Tools (`spec: admin-tools`)

| ID | Requirement | Priority |
|----|-------------|----------|
| AT1 | Admin dashboard: user status, errors, provider health, feature flags | P1 |
| AT2 | Safe mode routing: force fallback provider for user/team | P1 |
| AT3 | Admin override: reset routing rules, disable providers | P1 |
| AT4 | Error code documentation with troubleshooting guides | P1 |
| AT5 | Webhook notifications for critical errors | P2 |

#### API/CLI Stabilization (`spec: api-cli`)

| ID | Requirement | Priority |
|----|-------------|----------|
| AC1 | Versioned HTTP API (`/v1/`) for profiles, routing, providers, metrics | P1 |
| AC2 | CLI commands: config export/import, provider test, self-test, profile CRUD | P1 |
| AC3 | Deprecation policy documented in API docs | P1 |
| AC4 | Example automation scripts for CI and team bootstrapping | P1 |
| AC5 | Auth model documentation across all surfaces | P1 |
| AC6 | API rate limiting per client | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Proxy startup time | < 3 seconds |
| NFR2 | Request latency overhead (p50) | < 50ms |
| NFR3 | Request latency overhead (p95) | < 100ms |
| NFR4 | Memory usage (idle) | < 200MB |
| NFR5 | Memory usage (under load) | < 500MB |
| NFR6 | E2E test suite duration | < 10 minutes |
| NFR7 | Provider E2E success rate | ≥ 99% |
| NFR8 | Crash-free sessions | > 99.5% |
| NFR9 | Metrics retention | 7 days locally |

### 3.3 Success Metrics (from Roadmap)

| ID | Metric | Target |
|----|--------|--------|
| SM1 | E2E test success rate | ≥ 99% per provider |
| SM2 | Crash-free sessions | > 99.5% |
| SM3 | Time to diagnose issue | < 5 minutes |
| SM4 | CLI adoption | > 20% of power users |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Phase F Architecture Overview                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Test Infrastructure                               │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ Provider    │  │ User Flow   │  │ Performance │  │ CI Pipeline     │  │   │
│  │  │ E2E Tests   │  │ E2E Tests   │  │ Benchmarks  │  │ Test Gates      │  │   │
│  │  │ (5 provs)   │  │ (onboard,   │  │ (latency,   │  │ (PR blocking)   │  │   │
│  │  │             │  │  profiles)  │  │  memory)    │  │                 │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌────────────────────┐              ┌────────────────────────────────────────┐ │
│  │   Desktop App      │              │           CLI Proxy (Go)               │ │
│  │   (Electron)       │              │                                        │ │
│  │                    │              │  ┌──────────────────────────────────┐  │ │
│  │ ┌────────────────┐ │  Correlation │  │       Connection Pool            │  │ │
│  │ │ Diagnostics    │ │     IDs      │  │  ┌─────┐ ┌─────┐ ┌─────┐        │  │ │
│  │ │ View           │◄├──────────────┤► │  │Claude│ │Codex│ │Gemini│ ...   │  │ │
│  │ │ - Requests     │ │              │  │  └─────┘ └─────┘ └─────┘        │  │ │
│  │ │ - Errors       │ │              │  └──────────────────────────────────┘  │ │
│  │ │ - Latency      │ │              │                                        │ │
│  │ └────────────────┘ │              │  ┌──────────────────────────────────┐  │ │
│  │                    │              │  │      Rate Limit Handler          │  │ │
│  │ ┌────────────────┐ │              │  │  - Detect 429 / error codes      │  │ │
│  │ │ Debug Bundle   │ │              │  │  - Exponential backoff + jitter  │  │ │
│  │ │ Generator      │ │              │  │  - User-facing messages          │  │ │
│  │ │ - Logs         │ │              │  └──────────────────────────────────┘  │ │
│  │ │ - Config       │ │              │                                        │ │
│  │ │ - System info  │ │              │  ┌──────────────────────────────────┐  │ │
│  │ └────────────────┘ │              │  │       Metrics Collector          │  │ │
│  └────────────────────┘              │  │  - Per-provider stats            │  │ │
│                                      │  │  - Latency histograms            │  │ │
│                                      │  │  - Error tracking                │  │ │
│                                      │  └──────────────────────────────────┘  │ │
│                                      │                                        │ │
│                                      │  ┌──────────────────────────────────┐  │ │
│                                      │  │       CLI Commands               │  │ │
│                                      │  │  korproxy config export/import   │  │ │
│                                      │  │  korproxy provider test          │  │ │
│                                      │  │  korproxy self-test              │  │ │
│                                      │  │  korproxy debug-bundle           │  │ │
│                                      │  └──────────────────────────────────┘  │ │
│                                      └────────────────────────────────────────┘ │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Web Dashboard (Next.js)                           │   │
│  │                                                                           │   │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │   │
│  │  │                      Admin Dashboard                                 │ │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │ │   │
│  │  │  │ User Status │  │ Provider    │  │ Feature     │  │ Safe Mode  │  │ │   │
│  │  │  │ + Errors    │  │ Health      │  │ Flags       │  │ Toggle     │  │ │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │ │   │
│  │  └─────────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         Convex Backend                                    │   │
│  │                                                                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │   │
│  │  │ featureFlags│  │ adminLogs   │  │ safeMode    │  │ errorCodes      │  │   │
│  │  │ per user    │  │ per user    │  │ per user    │  │ documentation   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

#### Error Codes (NEW standardized format)
- **Format**: `KP-{CATEGORY}-{NUMBER}` (e.g., `KP-AUTH-001`)
- **Categories**:
  - `AUTH` - Authentication errors (001-099)
  - `PROV` - Provider errors (100-199)
  - `CONF` - Configuration errors (200-299)
  - `NET` - Network errors (300-399)
  - `RATE` - Rate limiting errors (400-499)
  - `SYS` - System errors (500-599)
- Each code maps to: message, description, troubleshooting steps, severity

#### Diagnostic Bundle (NEW)
- `version`: Bundle format version
- `timestamp`: ISO 8601 generation time
- `system`: OS, platform, app version, node version
- `config`: Sanitized config (secrets masked with `***REDACTED***`)
- `providers`: Array of { id, status, lastError, lastSuccess }
- `logs`: Last 100 log entries (secrets redacted)
- `metrics`: Summary of last 24h (requests, errors, latency)

#### Feature Flags (EXTENDED in Convex)
- `userId`: User or team ID
- `flags`: Map of flag name → boolean/string value
- `safeMode`: Boolean - force fallback provider
- `safeModeProvider`: Provider ID for safe mode (default: claude-haiku)
- `updatedBy`: Admin user ID
- `updatedAt`: Timestamp

#### Admin Logs (NEW in Convex)
- `userId`: Affected user
- `adminId`: Admin who took action
- `action`: Action type (enable_safe_mode, reset_routing, disable_provider)
- `details`: JSON object with action-specific data
- `timestamp`: When action was taken

### 4.3 API Design

#### Versioned API (`/v1/`)

**Profile Management**:
- `GET /v1/profiles` - List all profiles
- `POST /v1/profiles` - Create profile
- `GET /v1/profiles/:id` - Get profile
- `PUT /v1/profiles/:id` - Update profile
- `DELETE /v1/profiles/:id` - Delete profile
- `POST /v1/profiles/:id/activate` - Set as active profile

**Provider Status**:
- `GET /v1/providers` - List providers with status
- `GET /v1/providers/:id` - Get provider details
- `POST /v1/providers/:id/test` - Run smoketest

**Metrics Export**:
- `GET /v1/metrics` - Get metrics summary (JSON)
- `GET /v1/metrics/prometheus` - Prometheus format (P2)

**Routing Rules**:
- `GET /v1/routing` - Get current routing configuration
- `PUT /v1/routing` - Update routing rules
- `GET /v1/routing/rules` - List all routing rules
- `POST /v1/routing/rules` - Create routing rule
- `DELETE /v1/routing/rules/:id` - Delete routing rule

**Diagnostics**:
- `GET /v1/diagnostics/bundle` - Generate debug bundle
- `GET /v1/diagnostics/health` - Health check endpoint

**Authentication**:
- All write endpoints (`POST`, `PUT`, `DELETE`) require authentication via `Authorization: Bearer <token>` or `X-Management-Key` header
- Read endpoints (`GET`) are public by default, can be secured via config

#### CLI Commands (Go proxy)

```
korproxy config export [--output file.json]
korproxy config import <file.json> [--merge]
korproxy config validate [file.json]

korproxy provider list
korproxy provider test <provider-id>
korproxy provider test --all

korproxy self-test [--verbose]

korproxy profile list
korproxy profile create <name> [--copy-from existing]
korproxy profile switch <name>
korproxy profile delete <name>

korproxy debug-bundle [--output bundle.json]
korproxy debug-bundle --upload  # P2: upload to support
```

### 4.4 Key Algorithms

#### Correlation ID Propagation
1. Client (Electron/CLI) generates UUID v4 as `X-Correlation-ID` (also accepts `X-Request-ID` for backward compatibility)
2. Proxy receives request, extracts correlation ID from either header or generates new one
3. Proxy adds correlation ID to provider request headers as `X-Correlation-ID`
4. All log entries include correlation ID field
5. Response includes both `X-Correlation-ID` and `X-Request-ID` headers for compatibility
6. Diagnostics view can filter/search by correlation ID

#### Rate Limit Handling
1. Provider responds with 429 or rate limit error code
2. Parse `Retry-After` header if present, else use default (5s)
3. Calculate backoff: `min(base * 2^attempt + jitter, maxBackoff)`
   - Base: 1 second
   - Max backoff: 60 seconds
   - Jitter: random 0-1 second
4. Show user message: "Provider rate limited. Retrying in {N}s..."
5. Update provider health status to `rate_limited`
6. After successful request, reset backoff counter

#### Debug Bundle Generation
1. Collect system info: OS, platform, versions
2. Read config file, mask sensitive fields (api keys, tokens, secrets)
3. Query log manager for last 100 entries
4. Apply secret redaction patterns to all log messages
5. Query metrics for 24h summary
6. Query provider states (connected, errors, last success)
7. Package as JSON with version header
8. Copy to clipboard or save to file

#### Connection Pooling
1. Initialize HTTP client pool per provider on startup
2. Pool settings: MaxIdleConns=100, MaxIdleConnsPerHost=10, IdleConnTimeout=90s
3. Reuse connections for sequential requests to same provider
4. Health check idle connections periodically (every 30s)
5. Close and recreate on connection errors

---

## 5. Reusable Code

### Existing Components to Leverage

#### Test Infrastructure
- `korproxy-app/playwright.config.ts` - Web E2E test configuration
- `korproxy-app/playwright.electron.config.ts` - Electron E2E test configuration
- `korproxy-app/vitest.config.ts` - Unit test configuration with mocks
- `korproxy-app/src/test/setup.ts` - Global test setup with IPC mocks
- `korproxy-app/e2e/*.spec.ts` - Existing E2E test patterns (8 files)
- `CLIProxyAPI/test/*_test.go` - Go test patterns with table-driven tests

#### Logging & Metrics
- `korproxy-app/electron/main/log-manager.ts` - File-based logging with 24h retention
- `CLIProxyAPI/internal/logging/global_logger.go` - Logrus-based logging with rotation
- `CLIProxyAPI/internal/metrics/collector.go` - Metrics collection with buffering
- `CLIProxyAPI/internal/metrics/store.go` - JSON file-based metrics persistence
- `CLIProxyAPI/internal/metrics/histogram.go` - Latency percentile tracking

#### Error Handling
- `korproxy-app/electron/common/ipc-types.ts` - AUTH_ERROR_CODES, PROVIDER_TEST_ERROR_CODES
- `CLIProxyAPI/sdk/cliproxy/auth/errors.go` - Standardized Error struct with codes
- `CLIProxyAPI/sdk/api/handlers/handlers.go` - ErrorResponse format
- `korproxy-app/src/components/providers/AuthErrorState.tsx` - Error UI patterns

#### Management API
- `CLIProxyAPI/internal/api/server.go` - Management routes under `/v0/management`
- `CLIProxyAPI/internal/api/handlers/management/` - Handler implementations
- `CLIProxyAPI/internal/api/middleware/` - Auth middleware patterns

#### Request Tracking
- `CLIProxyAPI/internal/logging/request_logger.go` - Request/response logging
- `CLIProxyAPI/internal/runtime/executor/logging_helpers.go` - Correlation ID handling

### Patterns to Follow
- **E2E Tests**: Pattern from `korproxy-app/e2e/auth.spec.ts` - page navigation, form interaction, assertions
- **Store Tests**: Pattern from `korproxy-app/src/test/stores/` - Zustand state testing with mocks
- **Go Tests**: Pattern from `CLIProxyAPI/test/` - table-driven tests, httptest, setup/teardown
- **Error Types**: Pattern from `CLIProxyAPI/sdk/cliproxy/auth/errors.go` - Code, Message, Retryable, HTTPStatus
- **Metrics Collection**: Pattern from `CLIProxyAPI/internal/metrics/collector.go` - buffered writes, background flush

---

## 6. Testing Strategy

### Unit Tests
- Error code mapping and message generation
- Debug bundle sanitization (secret redaction)
- Correlation ID generation and parsing
- Rate limit backoff calculation
- Config validation logic
- Metrics aggregation functions

### Integration Tests
- Correlation ID propagation through proxy to mock provider
- Debug bundle generation includes all expected fields
- Rate limit handler retries correctly
- CLI commands interact correctly with proxy API
- Admin actions update Convex state

### E2E Tests

#### Provider Tests (per provider)
- OAuth/auth flow completion
- Basic chat completion request
- Basic text completion request (where supported by provider)
- Streaming response handling
- Rate limit response handling
- Invalid auth handling

#### User Flow Tests
- Onboarding wizard start to finish
- Profile creation, switching, deletion
- Routing rule configuration and application
- Team invite, accept, member management
- Feedback submission with diagnostics
- Safe mode activation and routing verification

#### Performance Tests
- Startup time measurement (< 3s target)
- Request latency overhead (< 50ms p50, < 100ms p95)
- Concurrent request handling (10 parallel)
- Memory usage under load (< 500MB)

### Edge Case Tests
- Provider unavailable during request
- Network disconnect during streaming
- Corrupt config file recovery
- Maximum log entry size handling
- Concurrent admin actions on same user

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `E2E_TESTS_REQUIRED` - Block PRs without passing E2E (default: true after Phase F)
- `CORRELATION_IDS_ENABLED` - Enable correlation ID propagation (default: true)
- `NEW_ERROR_CODES` - Use new KP-XXX-NNN error format (default: true)
- `ADMIN_DASHBOARD_ENABLED` - Show admin dashboard for admin users (default: false initially)
- `SAFE_MODE_AVAILABLE` - Allow safe mode toggling (default: true)

### 7.2 Migration
- **Error codes**: Add new format alongside existing, deprecate old after 2 releases
- **API versioning**: `/v0/` remains for backward compatibility, `/v1/` is new standard
- **Metrics format**: Extend existing metrics store, no schema migration needed
- **Config format**: No changes, existing configs work unchanged

### 7.3 Rollback
- **E2E failures**: Disable test gate, investigate, fix tests or code
- **Performance regression**: Revert connection pooling, fallback to previous HTTP client
- **Admin dashboard issues**: Disable feature flag, dashboard hidden but data intact
- **Error code confusion**: Revert to old error messages, keep new codes in logs only
- **Correlation ID issues**: Disable `CORRELATION_IDS_ENABLED` flag, logs continue without correlation
- **Diagnostics/metrics performance**: Reduce metrics retention, disable real-time updates

### 7.4 Implementation Phases

#### Phase F1: Test Foundation (Week 1-2)
- Provider E2E test framework with mock server
- CI pipeline with test gates
- Performance benchmark baseline

#### Phase F2: Observability (Week 3-4)
- Correlation ID implementation
- Diagnostics view in desktop app
- Debug bundle generation
- Error code standardization

#### Phase F3: Performance (Week 5-6)
- Connection pooling implementation
- Rate limit handler with backoff
- Startup optimization
- Performance regression tests

#### Phase F4: Admin & Automation (Week 7-8)
- Admin dashboard (web)
- Safe mode implementation
- CLI commands
- API v1 stabilization

---

## 8. Open Questions

### Resolved
- [x] Local-first vs cloud telemetry → **Local-first only, no external services**
- [x] Performance targets → **< 50ms p50, < 100ms p95 overhead**
- [x] Test coverage targets → **E2E for all providers, unit tests for utilities**
- [x] Error code format → **KP-{CATEGORY}-{NUMBER}**
- [x] Safe mode fallback → **Claude Haiku (fast, reliable, low cost)**
- [x] Admin dashboard location → **Same web app, role-gated routes**
- [x] Metrics retention → **7 days default, not configurable in v1**
- [x] API v1 auth → **Required for writes, optional for reads**

### Pending
- [ ] Should mock provider server support all 5 providers or subset for CI?
- [ ] CLI distribution: bundled with desktop app or separate download?
- [ ] Debug bundle upload destination for support (P2 feature)?

### Deferred to Later Phase
- OpenTelemetry trace export (moved to Phase G if needed)
- Automated changelog generation from git tags (moved to Phase G)
- Performance dashboard with historical trends (covered by metrics dashboard + 7-day retention)

---

## 9. References

- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Phase E Spec](../phase-e-ecosystem-growth/spec.md) - Recent patterns
- [Existing E2E Tests](../../../korproxy-app/e2e/)
- [Log Manager](../../../korproxy-app/electron/main/log-manager.ts)
- [Metrics System](../../../CLIProxyAPI/internal/metrics/)
- [Request Logging](../../../CLIProxyAPI/internal/logging/request_logger.go)
- [Error Types](../../../CLIProxyAPI/sdk/cliproxy/auth/errors.go)
- [Management API](../../../CLIProxyAPI/internal/api/server.go)

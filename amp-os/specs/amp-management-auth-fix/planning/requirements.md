# Requirements: Amp Management Route Authentication Fix

## Overview
Fix authentication for Amp CLI management routes (threads, web search, user info) when using KorProxy. Currently, these routes fail with "unauthorized" because KorProxy passes through the client's KorProxy API key instead of injecting the Amp token that ampcode.com expects.

## User Stories

### Primary User Stories
1. **As a** KorProxy user, **I want** to read previous Amp threads, **so that** I can reference past work and continue conversations.
2. **As a** KorProxy user, **I want** web search to work through the proxy, **so that** I can use Amp's full feature set.
3. **As a** KorProxy user, **I want** all Amp CLI features to work transparently, **so that** there's no difference between direct and proxied access.

### Secondary User Stories
1. **As a** KorProxy admin, **I want** clear error messages when Amp token is missing, **so that** I can troubleshoot configuration issues.
2. **As a** KorProxy user, **I want** thread sharing to work, **so that** I can collaborate with team members.

---

## Functional Requirements

### Must Have (P0)
- [ ] Management proxy must inject Amp token from SecretSource
- [ ] Thread reading (`/api/threads/*`) must work through proxy
- [ ] Web search must work through proxy
- [ ] Provider routes must continue working (regression test)
- [ ] Token injection must support all sources: config, env var, file

### Should Have (P1)
- [ ] Clear error response when no Amp token is available
- [ ] Logging of management route auth decisions
- [ ] Hot-reload support for Amp token changes

### Nice to Have (P2)
- [ ] Per-request token override via header
- [ ] Health check endpoint for Amp connectivity

---

## Non-Functional Requirements

### Performance
- Token lookup must be cached (existing 5-minute TTL is sufficient)
- No additional latency for management routes

### Security
- Amp token must never be logged
- Token must only be sent to configured upstream URL
- Localhost-only restriction must remain for management routes

### Backwards Compatibility
- Existing provider route behavior unchanged
- Existing config format unchanged

---

## Technical Constraints
- Must use existing `SecretSource` interface
- Must maintain existing `MultiSourceSecret` precedence (config > env > file)
- Must not break existing tests
- Go 1.21+ compatibility

## Dependencies
- `net/http/httputil.ReverseProxy` for proxy implementation
- Existing `SecretSource` interface in `amp/secret.go`
- Existing `MultiSourceSecret` implementation

---

## Acceptance Criteria

### Criterion 1: Thread Reading Works
- **Given**: KorProxy configured with valid `ampcode.upstream-api-key`
- **When**: Amp CLI requests `GET /api/threads/T-xxx`
- **Then**: Request succeeds and returns thread data

### Criterion 2: Web Search Works
- **Given**: KorProxy configured with valid Amp token
- **When**: Amp CLI uses web_search tool
- **Then**: Search results are returned successfully

### Criterion 3: Missing Token Error
- **Given**: KorProxy configured without Amp token
- **When**: Amp CLI requests a management route
- **Then**: Returns 502 with clear error message about missing Amp credentials

### Criterion 4: Provider Routes Unchanged
- **Given**: KorProxy with valid configuration
- **When**: LLM requests go to `/api/provider/*`
- **Then**: Requests work exactly as before (regression test)

### Criterion 5: Token Hot-Reload
- **Given**: KorProxy running with one Amp token
- **When**: Token is updated in config file
- **Then**: New token is used for subsequent requests

---

## Open Questions
- [x] Should we validate the Amp token format before forwarding? **Decision: No, let ampcode.com validate**
- [x] Should management routes require Amp token even for local-only access? **Decision: Yes, ampcode.com always requires auth**
- [ ] Do we need per-user Amp tokens for multi-user scenarios?

## Research Notes

### Root Cause Analysis (from docs/amp-proxy-issues-analysis.md)
- Two proxies exist: provider proxy (injects token) vs management proxy (preserves client auth)
- Management proxy assumes client sends Amp token, but client sends KorProxy key
- Fix: Make management proxy behave like provider proxy (inject server's Amp token)

### Token Sources
1. Config: `ampcode.upstream-api-key`
2. Env: `AMP_API_KEY`
3. File: `~/.local/share/amp/secrets.json` → `apiKey@https://ampcode.com/`

### Files to Modify
- `CLIProxyAPI/internal/api/modules/amp/proxy.go` - Update `createManagementProxy`
- `CLIProxyAPI/internal/api/modules/amp/amp.go` - Pass SecretSource to management proxy

## Visuals
- See `docs/amp-proxy-issues-analysis.md` for flow diagrams

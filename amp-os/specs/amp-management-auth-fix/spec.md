# Specification: Amp Management Route Authentication Fix

> **Status**: Draft
> **Created**: 2024-12-18
> **Author**: Amp Agent

## 1. Overview

### 1.1 Summary
Fix authentication for Amp CLI management routes (threads, web search, user info) by modifying the management proxy to inject the server's Amp token instead of passing through the client's KorProxy API key. This enables all Amp features to work transparently through KorProxy.

### 1.2 Goals
- Enable thread reading (`read_thread` tool) through KorProxy
- Enable web search functionality through KorProxy
- Enable all management API routes (`/api/user`, `/api/auth`, `/api/threads`, etc.)
- Maintain existing provider route behavior unchanged

### 1.3 Non-Goals
- Per-user Amp token support (all requests use server's token)
- Amp token validation (let ampcode.com handle validation)
- Caching of management route responses

---

## 2. User Stories

### Primary
1. **As a** KorProxy user, **I want** to read previous Amp threads, **so that** I can reference past work.
2. **As a** KorProxy user, **I want** web search to work, **so that** I can use Amp's full feature set.

### Secondary
1. **As a** KorProxy admin, **I want** clear error messages when Amp token is missing, **so that** I can troubleshoot issues.
2. **As a** KorProxy user, **I want** thread sharing to work, **so that** I can collaborate.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR1 | Management proxy injects Amp token from SecretSource | P0 |
| FR2 | Thread reading works through proxy | P0 |
| FR3 | Web search works through proxy | P0 |
| FR4 | Provider routes unchanged (regression) | P0 |
| FR5 | Token sources: config > env > file | P0 |
| FR6 | Clear error when no Amp token available | P1 |
| FR7 | Hot-reload support for token changes | P1 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Token lookup performance | <1ms (cached) |
| NFR2 | Security - no token logging | 0 log entries with token |
| NFR3 | Backwards compatibility | All existing tests pass |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         KorProxy                                 │
│                                                                  │
│  ┌─────────────────┐                    ┌─────────────────┐     │
│  │  SecretSource   │                    │   Config        │     │
│  │  (Amp Token)    │◄───────────────────│ ampcode:        │     │
│  │                 │                    │   upstream-     │     │
│  │  Priority:      │                    │   api-key       │     │
│  │  1. Config      │                    └─────────────────┘     │
│  │  2. Env var     │                                            │
│  │  3. File        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │ Management      │         │ Provider        │                │
│  │ Proxy           │         │ Proxy           │                │
│  │                 │         │                 │                │
│  │ - Injects token │         │ - Injects token │                │
│  │ - /api/threads  │         │ - /api/provider │                │
│  │ - /api/user     │         │ - LLM requests  │                │
│  │ - /api/auth     │         │                 │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
└───────────┼───────────────────────────┼──────────────────────────┘
            │                           │
            ▼                           ▼
     ┌─────────────────────────────────────┐
     │           ampcode.com               │
     │  Authorization: Bearer <amp-token>  │
     └─────────────────────────────────────┘
```

### 4.2 Key Changes

**Current `createManagementProxy` behavior:**
- Preserves client's `Authorization` header
- Does not inject any credentials

**New `createManagementProxy` behavior:**
- Strips client's `Authorization` header (same as provider proxy)
- Injects Amp token from `SecretSource` (same as provider proxy)
- Returns 502 error if no token available

### 4.3 API Design

No API changes. The fix is internal to the proxy implementation.

**Affected routes (all management routes):**
- `/api/threads/*` - Thread reading/sharing
- `/api/user/*` - User info
- `/api/auth/*` - Authentication
- `/api/internal/*` - Internal APIs
- `/api/telemetry/*` - Telemetry
- `/api/meta` - Metadata
- `/threads/*` (root level) - Thread access

### 4.4 Key Algorithm

```
For each management route request:
1. Strip client's Authorization header
2. Look up Amp token from SecretSource (config > env > file)
3. If token found:
   - Set Authorization: Bearer <amp-token>
   - Forward request to upstream
4. If no token:
   - Return 502 with error message
```

---

## 5. Reusable Code

### Existing Components to Leverage
- `amp/secret.go:SecretSource` - Token retrieval interface
- `amp/secret.go:MultiSourceSecret` - Precedence-based token lookup with caching
- `amp/proxy.go:createReverseProxy` - Reference for token injection pattern

### Patterns to Follow
- Token injection pattern as seen in `proxy.go:69-100`
- Error handling pattern as seen in `proxy.go:191-196`

---

## 6. Testing Strategy

### Unit Tests
- `TestCreateManagementProxy_InjectsToken` - Verify token is injected
- `TestCreateManagementProxy_StripsClientAuth` - Verify client auth is removed
- `TestCreateManagementProxy_NoTokenError` - Verify 502 when no token

### Integration Tests
- `TestManagementRoute_ThreadsWithToken` - End-to-end thread access
- `TestManagementRoute_NoToken502` - Error case

### Regression Tests
- All existing `proxy_test.go` tests must pass
- Provider routes must work unchanged

---

## 7. Rollout Plan

### 7.1 Feature Flags
None required - this is a bug fix, not a new feature.

### 7.2 Migration
None required - uses existing config format.

### 7.3 Rollback
Revert the code changes. No data migration involved.

---

## 8. Open Questions
- [x] Should management proxy validate token format? **No, let ampcode.com validate**
- [ ] Do we need per-user tokens for multi-user scenarios? (Future consideration)

## 9. References
- [Requirements](planning/requirements.md)
- [Root Cause Analysis](../../docs/amp-proxy-issues-analysis.md)

# KorProxy Amp Integration - Root Cause Analysis

## Executive Summary

Multiple Amp CLI features fail when routed through KorProxy, including:
- **Thread reading** (`read_thread` tool) - Returns "unauthorized"
- **Web search** - Fails with authorization errors
- **Thread sharing** - Fails to access shared threads
- **Management APIs** - `/api/user`, `/api/auth`, etc.

**Root Cause:** KorProxy has a fundamental architectural mismatch in how it handles authentication for management routes vs. provider routes.

---

## Architecture Overview

### KorProxy's Two Proxy Types

KorProxy uses **two different reverse proxies** for Amp requests:

#### 1. Provider Proxy (`createReverseProxy`)
- **Used for:** `/api/provider/*` routes (Claude, OpenAI, Gemini API calls)
- **Auth behavior:**
  - **STRIPS** client's `Authorization` header
  - **INJECTS** `upstream-api-key` from config/env/file
- **Purpose:** Route LLM requests to ampcode.com using KorProxy's Amp subscription

#### 2. Management Proxy (`createManagementProxy`)
- **Used for:** `/api/threads`, `/api/user`, `/api/auth`, `/api/internal`, etc.
- **Auth behavior:**
  - **PRESERVES** client's `Authorization` header (passes through unchanged)
  - Does **NOT** inject any credentials
- **Purpose:** Allow clients to authenticate directly with ampcode.com

### The Problem

The management proxy design assumes the client sends a **valid Amp token** in the `Authorization` header. However:

1. **Amp CLI configured for KorProxy** sends a **KorProxy API key**, not an Amp token
2. KorProxy doesn't translate KorProxy auth → Amp auth for management routes
3. ampcode.com receives an invalid/missing Amp token → returns 401 "unauthorized"

---

## Detailed Flow Analysis

### Failing Flow: Thread Reading

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Amp CLI   │     │  KorProxy   │     │ ampcode.com │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ GET /api/threads/T-xxx               │
       │ Authorization: Bearer <korproxy-key> │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ GET /api/threads/T-xxx
       │                   │ Authorization: Bearer <korproxy-key>  ← WRONG!
       │                   │──────────────────>│
       │                   │                   │
       │                   │     401 Unauthorized
       │                   │<──────────────────│
       │                   │                   │
       │ 401 Unauthorized  │                   │
       │<──────────────────│                   │
```

### Working Flow (if design was correct)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Amp CLI   │     │  KorProxy   │     │ ampcode.com │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │ GET /api/threads/T-xxx               │
       │ Authorization: Bearer <korproxy-key> │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ GET /api/threads/T-xxx
       │                   │ Authorization: Bearer <amp-token>  ← TRANSLATED!
       │                   │──────────────────>│
       │                   │                   │
       │                   │     200 OK + thread data
       │                   │<──────────────────│
       │                   │                   │
       │ 200 OK + thread   │                   │
       │<──────────────────│                   │
```

---

## Affected Features

| Feature | Route | Status | Reason |
|---------|-------|--------|--------|
| Read threads | `/api/threads/*` | ❌ Fails | Management proxy doesn't inject Amp token |
| Web search | Various | ❌ Fails | May require Amp auth for some backend calls |
| User info | `/api/user/*` | ❌ Fails | Management proxy doesn't inject Amp token |
| Auth flow | `/api/auth/*` | ❌ Fails | OAuth flow expects Amp session |
| Telemetry | `/api/telemetry/*` | ❌ Fails | Requires Amp auth |
| Provider LLM | `/api/provider/*` | ✅ Works | Provider proxy correctly injects token |

---

## Code Evidence

### Management Proxy (proxy.go:32-56)
```go
func createManagementProxy(upstreamURL string) (*httputil.ReverseProxy, error) {
    // ...
    proxy.Director = func(req *http.Request) {
        originalDirector(req)
        req.Host = parsed.Host
        // Preserve client's Authorization header - it contains the Amp token
        // Do NOT strip or replace it       ← THIS IS THE PROBLEM
    }
}
```

### Management Routes Registration (amp.go:143)
```go
// Management routes do NOT use KorProxy API key auth - ampcode.com handles its own authentication.
m.registerManagementRoutes(ctx.Engine, ctx.BaseHandler, nil)  // nil = no auth middleware
```

### routes.go Comment (line 98-102)
```go
// Auth is handled by ampcode.com - KorProxy does not validate these requests.
// Routes are protected by localhost-only and availability middleware.
```

---

## Token Sources in KorProxy

KorProxy does have access to Amp tokens via `MultiSourceSecret`:

1. **Config:** `ampcode.upstream-api-key` in config.yaml
2. **Environment:** `AMP_API_KEY` env var
3. **File:** `~/.local/share/amp/secrets.json` → `apiKey@https://ampcode.com/`

However, this token is **only used for provider routes**, not management routes.

---

## Proposed Solutions

### Option A: Inject Amp Token for Management Routes (Recommended)

Modify `createManagementProxy` to inject the Amp token (from `SecretSource`) instead of preserving client auth:

```go
func createManagementProxy(upstreamURL string, secretSource SecretSource) (*httputil.ReverseProxy, error) {
    // ...
    proxy.Director = func(req *http.Request) {
        originalDirector(req)
        req.Host = parsed.Host
        
        // Replace client auth with Amp token
        req.Header.Del("Authorization")
        if key, err := secretSource.Get(req.Context()); err == nil && key != "" {
            req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))
        }
    }
}
```

**Pros:**
- Fixes all management route auth issues
- Uses existing token infrastructure
- Transparent to Amp CLI

**Cons:**
- All users share same Amp identity for management routes
- User-specific features (saved threads, preferences) may not work per-user

### Option B: Dual-Token Mode

Accept both KorProxy key (for auth) and Amp token (for forwarding):

- Client sends: `Authorization: Bearer <korproxy-key>` + `X-Amp-Token: <amp-token>`
- KorProxy validates korproxy-key, then forwards amp-token

**Pros:**
- Per-user Amp identity preserved
- Full feature support

**Cons:**
- Requires Amp CLI modification or custom client config
- More complex setup

### Option C: Hybrid Approach

- Management routes requiring user identity → require client to send Amp token
- Management routes that work with shared identity → inject server's Amp token

---

## The 1M Model Fix Was Unrelated

The previous fix (filtering `context-1m-2025-08-07` beta header for `[1m]` models) addressed a **different issue**:
- That fix was about preventing beta header conflicts for local OAuth providers
- It did NOT address the authentication issue for management routes
- Web search failures were misattributed to the beta header issue

---

## Recommended Next Steps

1. **Immediate:** Implement Option A to inject Amp token for all management routes
2. **Verify:** Test thread reading, web search, and other management features
3. **Future:** Consider Option B for multi-user support if needed
4. **Document:** Update integration guide with auth flow explanation

---

## Files to Modify

| File | Changes |
|------|---------|
| `proxy.go` | Update `createManagementProxy` to accept `SecretSource` and inject token |
| `amp.go` | Pass `SecretSource` to `createManagementProxy` |
| `routes.go` | No changes needed (management routes already registered correctly) |

---

## Testing Plan

1. Configure `ampcode.upstream-api-key` with valid Amp token
2. Test `read_thread` tool with thread ID
3. Test web search functionality
4. Test `/api/user` endpoint
5. Verify provider routes still work (regression test)

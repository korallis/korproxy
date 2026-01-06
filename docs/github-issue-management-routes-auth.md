# GitHub Issue: Management Routes Authentication Bug

**Repository:** https://github.com/router-for-me/CLIProxyAPI/issues/new

---

## Title

Management routes (threads, user, auth) fail with 401/402 because proxy strips client auth and injects provider-only credentials

---

## Labels

`bug`, `authentication`, `amp-module`

---

## Body

### Description

Management routes (`/api/threads/*`, `/api/user/*`, `/api/auth/*`, `/api/internal/*`, etc.) fail with authentication errors (401 Unauthorized or 402 Out of Credits) when proxied through CLIProxyAPI to ampcode.com.

The root cause is that all routes—both provider routes AND management routes—share the same `ReverseProxy` instance created by `createReverseProxy()`, which unconditionally:
1. **Strips** the client's `Authorization` header
2. **Injects** the `upstream-api-key` from config

This works correctly for **provider routes** (LLM API calls like `/api/provider/anthropic/v1/messages`) because those routes authenticate using the Amp subscription token.

However, **management routes** require a **user-specific Amp session token** for identity-based operations (reading threads, user info, etc.). The current implementation strips this token and replaces it with the provider subscription key, which lacks the necessary permissions.

### Steps to Reproduce

1. Configure CLIProxyAPI with a valid `ampcode.upstream-api-key`
2. Connect Amp CLI to CLIProxyAPI (e.g., `http://localhost:1337`)
3. Use a feature that calls management routes, such as:
   - `read_thread` tool
   - `find_thread` tool
   - Web search (which may call management APIs internally)
4. Observe 401 or 402 error responses

### Expected Behavior

Management routes should successfully proxy to ampcode.com with appropriate authentication that allows user-identity operations.

### Actual Behavior

Management routes return authentication errors:
- `{"error":{"code":402,"message":"Out of credits"}}`
- `{"error":"unauthorized"}`

### Root Cause Analysis

**File:** `internal/api/modules/amp/proxy.go` (lines 40-65)

```go
proxy.Director = func(req *http.Request) {
    originalDirector(req)
    req.Host = parsed.Host

    // Remove client's Authorization header - it was only used for CLI Proxy API authentication
    // We will set our own Authorization using the configured upstream-api-key
    req.Header.Del("Authorization")  // <-- PROBLEM: Strips user's Amp session token
    req.Header.Del("X-Api-Key")

    // Inject API key from secret source (only uses upstream-api-key from config)
    if key, err := secretSource.Get(req.Context()); err == nil && key != "" {
        req.Header.Set("X-Api-Key", key)
        req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", key))  // <-- PROBLEM: Wrong token type for management routes
    }
}
```

**File:** `internal/api/modules/amp/routes.go` (lines 117-134)

```go
proxyHandler := func(c *gin.Context) {
    // ...
    proxy := m.getProxy()  // <-- Uses same proxy for ALL routes
    proxy.ServeHTTP(c.Writer, c.Request)
}

// Management routes - these are proxied directly to Amp upstream
ampAPI.Any("/threads/*path", proxyHandler)  // Uses provider proxy!
ampAPI.Any("/user/*path", proxyHandler)     // Uses provider proxy!
ampAPI.Any("/auth/*path", proxyHandler)     // Uses provider proxy!
```

### Affected Routes

| Route Pattern | Purpose | Status |
|--------------|---------|--------|
| `/api/threads/*` | Read/list threads | ❌ Fails |
| `/api/user/*` | User info/preferences | ❌ Fails |
| `/api/auth/*` | OAuth flow | ❌ Fails |
| `/api/internal/*` | Internal APIs | ❌ Fails |
| `/api/telemetry/*` | Telemetry | ❌ Fails |
| `/api/provider/*` | LLM API calls | ✅ Works |

### Proposed Solutions

#### Option A: Separate Management Proxy (Recommended)

Create a separate `createManagementProxy()` that **preserves** the client's `Authorization` header instead of replacing it:

```go
func createManagementProxy(upstreamURL string) (*httputil.ReverseProxy, error) {
    parsed, err := url.Parse(upstreamURL)
    if err != nil {
        return nil, fmt.Errorf("invalid amp upstream url: %w", err)
    }

    proxy := httputil.NewSingleHostReverseProxy(parsed)
    originalDirector := proxy.Director

    proxy.Director = func(req *http.Request) {
        originalDirector(req)
        req.Host = parsed.Host
        // PRESERVE client's Authorization header - it contains their Amp session token
        // Do NOT strip or replace it
    }

    return proxy, nil
}
```

Then use this proxy for management routes in `registerManagementRoutes()`.

#### Option B: Inject Server's Amp Token for Management Routes

If user-specific identity isn't required, inject the server's Amp token (from `upstream-api-key`) for management routes. This would share a single identity for all users but would at least make the routes functional.

#### Option C: Dual-Token Mode

Accept both tokens from client:
- `Authorization: Bearer <korproxy-key>` for CLIProxyAPI authentication
- `X-Amp-Token: <amp-session-token>` for forwarding to ampcode.com

### Environment

- CLIProxyAPI version: v6.x
- Go version: 1.21+
- Upstream: ampcode.com

### Additional Context

The comments in the code suggest this was intentional design ("Auth is handled by ampcode.com - KorProxy does not validate these requests"), but the implementation doesn't match—the proxy actively modifies auth headers rather than passing them through.

---

## How to Submit

1. Go to https://github.com/router-for-me/CLIProxyAPI/issues/new
2. Copy the **Title** above
3. Copy the **Body** section above (everything from "### Description" onwards)
4. Add appropriate labels if available
5. Submit

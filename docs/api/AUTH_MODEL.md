# KorProxy Authentication Model

> **Version**: 1.0
> **Last Updated**: 2025-12-18

## Overview

KorProxy uses different authentication methods across its surfaces. This document explains how authentication works for each component.

## Authentication Surfaces

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Authentication Flow                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │ Desktop App  │    │   Web App    │    │      CLI Proxy           │   │
│  │  (Electron)  │    │  (Next.js)   │    │        (Go)              │   │
│  └──────┬───────┘    └──────┬───────┘    └────────────┬─────────────┘   │
│         │                   │                         │                  │
│         │ Convex Token      │ Convex Token            │ X-Management-Key │
│         │ (stored locally)  │ (httpOnly cookie)       │ (config file)    │
│         ▼                   ▼                         ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      Convex Backend                               │   │
│  │  - Session validation                                             │   │
│  │  - User role verification                                         │   │
│  │  - Rate limiting                                                  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Desktop App (Electron)

### User Authentication

1. **Login Flow**
   - User enters email/password
   - Credentials sent to Convex `auth.login` mutation
   - On success, receives session token
   - Token stored in Electron's secure storage (keychain/credential manager)

2. **Token Storage**
   - macOS: Keychain
   - Windows: Credential Manager
   - Linux: Secret Service API

3. **Token Refresh**
   - Tokens expire after 30 days
   - Auto-refresh 7 days before expiry
   - Silent refresh on app startup

### Proxy Communication

```typescript
// Desktop app sends token to local proxy
const response = await fetch('http://localhost:1337/v1/profiles', {
  headers: {
    'Authorization': `Bearer ${sessionToken}`,
  },
})
```

## Web App (Next.js)

### User Authentication

1. **Login Flow**
   - User enters credentials on login page
   - Credentials validated via Convex
   - Session token set as httpOnly cookie

2. **Cookie Configuration**
   ```typescript
   {
     httpOnly: true,
     secure: process.env.NODE_ENV === 'production',
     sameSite: 'lax',
     maxAge: 30 * 24 * 60 * 60, // 30 days
   }
   ```

3. **Server-Side Auth**
   - Middleware validates cookie on each request
   - Invalid tokens redirect to login
   - Admin routes check user role

## CLI Proxy (Go)

### Management API Authentication

The proxy accepts two authentication methods for `/v1/` endpoints:

1. **Bearer Token** (from desktop/web app)
   ```bash
   curl -H "Authorization: Bearer <token>" \
     http://localhost:1337/v1/profiles
   ```

2. **Management Key** (for automation)
   ```bash
   curl -H "X-Management-Key: <secret>" \
     http://localhost:1337/v1/profiles
   ```

### Setting Up Management Key

```yaml
# ~/.korproxy/config.yaml
remote_management:
  secret_key: "your-secret-key-here"
```

Or via environment variable:
```bash
export MANAGEMENT_PASSWORD="your-secret-key-here"
```

### Provider Authentication

Provider credentials are stored in the config and managed separately:

```yaml
# ~/.korproxy/config.yaml
providers:
  claude:
    type: oauth
    # OAuth tokens stored securely
  codex:
    type: api_key
    # API key encrypted at rest
```

## Permission Levels

| Role | Desktop App | Web App | CLI Proxy |
|------|-------------|---------|-----------|
| Anonymous | ❌ | ❌ | Read-only (if enabled) |
| User | ✅ Full access | ✅ User dashboard | ✅ With token |
| Admin | ✅ Full access | ✅ Admin dashboard | ✅ Full access |

## API Endpoint Auth Requirements

### Read Endpoints (Auth Optional)
- `GET /v1/profiles`
- `GET /v1/routing/rules`
- `GET /v1/diagnostics/health`
- `GET /v1/diagnostics/bundle`

### Write Endpoints (Auth Required)
- `POST /v1/profiles`
- `PUT /v1/profiles/:id`
- `DELETE /v1/profiles/:id`
- `POST /v1/routing/rules`
- `PUT /v1/routing/rules/:id`
- `DELETE /v1/routing/rules/:id`

## Security Best Practices

1. **Never commit secrets**: Use environment variables or secure storage
2. **Rotate keys regularly**: Change management keys every 90 days
3. **Use HTTPS in production**: Local proxy uses HTTP, but web traffic should be HTTPS
4. **Monitor access logs**: Check `~/.korproxy/logs/` for unauthorized access attempts

## Error Codes

| Code | Description |
|------|-------------|
| `KP-AUTH-001` | Invalid credentials |
| `KP-AUTH-002` | Token expired |
| `KP-AUTH-003` | OAuth flow failed |
| `KP-AUTH-004` | Insufficient permissions |
| `KP-AUTH-005` | Invalid management key |

## Troubleshooting

### "Invalid token" errors
1. Check token hasn't expired
2. Verify token format is correct
3. Try logging out and back in

### "Unauthorized" on management API
1. Verify `X-Management-Key` header is set
2. Check config file has `secret_key` configured
3. Ensure no typos in the key

### OAuth provider issues
1. Re-authenticate with provider
2. Check provider account status
3. Verify OAuth app hasn't been revoked

# KorProxy API Deprecation Policy

> **Version**: 1.0
> **Effective Date**: 2025-12-18
> **Last Updated**: 2025-12-18

## Overview

This document outlines KorProxy's API deprecation policy to help developers plan for API changes and ensure smooth transitions between versions.

## Versioning Scheme

KorProxy uses semantic versioning for its API:
- **Major version** (v1, v2): Breaking changes
- **Minor version**: New features, backward compatible
- **Patch version**: Bug fixes

## API Lifecycle

### 1. Active
- Fully supported
- Receives new features and bug fixes
- Current version: `/v1/`

### 2. Deprecated
- Still functional but scheduled for removal
- Receives security fixes only
- Returns `X-KorProxy-Deprecated: true` header
- Warning message in `X-KorProxy-Deprecation-Notice` header

### 3. Retired
- No longer available
- Returns `410 Gone` status code
- Migration guide provided in error response

## Deprecation Timeline

| Phase | Duration | API Behavior |
|-------|----------|--------------|
| Announcement | Day 0 | Deprecation notice added to docs |
| Soft Deprecation | 0-6 months | Warning headers added, API still functional |
| Hard Deprecation | 6-12 months | Errors logged, rate limits reduced |
| Retirement | 12+ months | API returns 410 Gone |

## Current Deprecations

### `/v0/` Management API → `/v1/`

| Old Endpoint | New Endpoint | Retirement Date |
|--------------|--------------|-----------------|
| `GET /v0/management/config` | `GET /v1/profiles` | 2026-06-01 |
| `POST /v0/management/config` | `POST /v1/profiles` | 2026-06-01 |
| `GET /v0/management/providers` | `GET /v1/routing/rules` | 2026-06-01 |

**Migration Steps:**
1. Update base URL from `/v0/management/` to `/v1/`
2. Update authentication header (see [Auth Model](#authentication))
3. Update request/response payloads to match v1 schema

## Authentication

### v0 (Deprecated)
```
X-Management-Key: <secret>
```

### v1 (Current)
```
Authorization: Bearer <token>
# OR
X-Management-Key: <secret>
```

## Response Headers

When calling deprecated endpoints, watch for these headers:

```http
X-KorProxy-Deprecated: true
X-KorProxy-Deprecation-Notice: This endpoint will be removed on 2026-06-01. Migrate to /v1/profiles
X-KorProxy-Sunset: 2026-06-01
```

## Best Practices

### For API Consumers

1. **Subscribe to changelog**: Follow releases at github.com/korallis/korproxy
2. **Watch for deprecation headers**: Log warnings when detected
3. **Test with new versions early**: Use beta releases to validate migrations
4. **Set calendar reminders**: Track deprecation dates

### For Scripts and Automation

```typescript
// Example: Check for deprecation headers
async function apiCall(url: string) {
  const response = await fetch(url)
  
  if (response.headers.get('X-KorProxy-Deprecated')) {
    console.warn(
      `⚠️  Deprecated API: ${response.headers.get('X-KorProxy-Deprecation-Notice')}`
    )
  }
  
  return response.json()
}
```

## Getting Help

- **Documentation**: https://korproxy.com/docs/api
- **GitHub Issues**: https://github.com/korallis/korproxy/issues
- **Migration Guides**: https://korproxy.com/docs/migration

## Changelog

| Date | Change |
|------|--------|
| 2025-12-18 | Initial deprecation policy published |
| 2025-12-18 | v0 management API deprecated in favor of v1 |

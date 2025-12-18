# KorProxy Release Preparation Plan

> Generated: 2025-12-18
> Status: In Progress

## Current State Summary

### Completed
- [x] Validated korproxy-app (typecheck, lint, tests pass)
- [x] Validated korproxy-web (build passes)
- [x] Validated korproxy-backend (typecheck passes)
- [x] Fixed 26 lint errors in korproxy-web
- [x] Committed lint fixes (`e5d1250`)

### Blocking Issues
- [ ] ~150 uncommitted files from previous agent work
- [ ] CLIProxyAPI submodule in messy state (uncommitted changes, 24 commits behind upstream)

---

## Phase 1: Commit Remaining Changes (Priority: HIGH)

### 1.1 Review and Stage korproxy-app Changes
```bash
# Review changes
git diff korproxy-app/

# Stage all korproxy-app changes
git add korproxy-app/
```

**Files include:**
- Electron main process updates (IPC, tray, sidecar)
- New components (analytics, billing, diagnostics, feedback, onboarding)
- New hooks (useEntitlements, useHealthStatus, useMetrics, etc.)
- New stores (entitlementStore, onboardingStore, profileStore)
- E2E test files
- Package updates

### 1.2 Review and Stage korproxy-backend Changes
```bash
git add korproxy-backend/
```

**Files include:**
- New Convex functions (devices, entitlements, feedback, invites, members, teams, users)
- Schema updates
- RBAC library

### 1.3 Review and Stage korproxy-web Changes
```bash
git add korproxy-web/
```

**Files include:**
- New pages (blog, changelog, billing, teams, roadmap, invite)
- New components (Analytics, UTMCapture, admin tools, MDX)
- New Convex functions
- Content files

### 1.4 Stage Supporting Files
```bash
git add .github/workflows/ci.yml
git add docs/
git add examples/
git add amp-os/
git add opencode-os/
git add .claude/
git add .opencode/
```

### 1.5 Commit All Changes
```bash
git commit -m "feat: add teams, billing, analytics, and onboarding features

- Add team management with invites and RBAC
- Add billing integration with Stripe
- Add analytics and UTM tracking
- Add onboarding flow for new users
- Add device sync and entitlements
- Add feedback collection system
- Add health monitoring and diagnostics
- Add blog and changelog content system
- Update CI workflow"
```

---

## Phase 2: Stabilize CLIProxyAPI Submodule (Priority: HIGH)

### 2.1 Commit Local Changes as Patch Stack

The submodule has significant uncommitted work that needs to be preserved:

```bash
cd CLIProxyAPI

# Stage and commit correlation ID changes
git add internal/api/middleware/correlation.go
git add internal/api/middleware/correlation_test.go
git add internal/logging/request_logger.go
git commit -m "feat(correlation): add request correlation ID middleware"

# Stage and commit v1 API handlers
git add internal/api/handlers/v1/
git add internal/routing/
git commit -m "feat(v1): add profiles, routing rules, and diagnostics API"

# Stage and commit supporting packages
git add internal/errors/
git add internal/metrics/
git add internal/pool/
git add internal/ratelimit/
git commit -m "feat(infra): add error handling, metrics, pooling, and rate limiting"

# Stage and commit SDK extensions
git add sdk/cliproxy/auth/group_selector.go
git add sdk/cliproxy/auth/group_selector_test.go
git add sdk/cliproxy/auth/health.go
git add sdk/cliproxy/auth/health_test.go
git commit -m "feat(sdk): add group selector and health check utilities"

# Stage and commit korproxy command
git add cmd/korproxy/
git commit -m "feat(cmd): add korproxy command entry point"

# Stage modified files
git add internal/api/modules/amp/proxy.go
git add internal/api/modules/amp/routes_test.go
git add internal/api/server.go
git commit -m "feat(server): integrate v1 API routes and correlation middleware"
```

### 2.2 Update Parent Repository Submodule Reference

```bash
cd ..
git add CLIProxyAPI
git commit -m "chore: update CLIProxyAPI submodule with v1 API and correlation features"
```

### 2.3 (Optional) Merge Upstream Changes

**Risk: MEDIUM-HIGH** - Upstream has 24 commits with potential conflicts in:
- Watcher refactoring
- Gemini 3 support
- Antigravity executor changes

```bash
cd CLIProxyAPI

# Create backup branch
git branch backup-korproxy-integration

# Fetch and rebase
git fetch origin
git rebase origin/main

# Resolve conflicts if any, then:
git push origin korproxy-integration --force-with-lease

cd ..
git add CLIProxyAPI
git commit -m "chore: rebase CLIProxyAPI on upstream main"
```

**Recommendation:** Defer upstream merge to a separate PR after the current changes are stable.

---

## Phase 3: Security Hardening (Priority: MEDIUM)

Based on Oracle security review:

### 3.1 Amp Management Proxy Security
- [ ] Ensure `restrict-management-to-localhost` defaults to `true`
- [ ] Consider adding local secret header requirement
- [ ] Audit proxied route allowlist

### 3.2 Diagnostics Endpoint Security
- [ ] Add authentication to `/v1/diagnostics/bundle`
- [ ] Rate limit diagnostics endpoints
- [ ] Remove detailed version/commit info from unauthenticated responses

### 3.3 Build Integrity
- [ ] Add CI check for clean submodule state
- [ ] Generate checksums for Go binary
- [ ] Document submodule workflow in CONTRIBUTING.md

---

## Phase 4: Pre-Push Verification (Priority: HIGH)

### 4.1 Run Full Test Suite
```bash
# korproxy-app
cd korproxy-app && npm run typecheck && npm run lint && npm test

# korproxy-web
cd ../korproxy-web && npm run lint && npm run build

# korproxy-backend
cd ../korproxy-backend && npx tsc --noEmit

# CLIProxyAPI
cd ../CLIProxyAPI && go build ./... && go test ./...
```

### 4.2 Verify Build Artifacts
```bash
cd korproxy-app
npm run package:mac  # or appropriate platform
```

### 4.3 Final Git Status Check
```bash
git status  # Should show clean working tree
git log --oneline -10  # Review commit history
```

---

## Phase 5: Push to Remote (Priority: HIGH)

### 5.1 Sync with Remote
```bash
# Your branch is behind origin/main by 4 commits
git pull --rebase origin main
```

### 5.2 Push Changes
```bash
git push origin main
```

### 5.3 Push Submodule (if on fork)
```bash
cd CLIProxyAPI
git push origin korproxy-integration
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Merge conflicts with upstream CLIProxyAPI | High | Medium | Defer to separate PR |
| CI failures on push | Medium | Low | Run full test suite locally first |
| Submodule reference mismatch | Medium | High | Verify submodule SHA matches |
| Breaking changes in new features | Low | High | E2E tests cover critical paths |

---

## Timeline Estimate

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Commit remaining changes | 30 min |
| Phase 2: Stabilize submodule | 1-2 hours |
| Phase 3: Security hardening | 2-4 hours (can defer) |
| Phase 4: Pre-push verification | 30 min |
| Phase 5: Push to remote | 15 min |

**Total:** 2-4 hours (excluding optional security hardening)

---

## Notes

- The `restrict-management-to-localhost` is already defaulted to `true` in recent commits
- korproxy-app tests pass with only warnings (act() warnings are non-blocking)
- korproxy-web lint has 18 warnings remaining (all non-blocking)
- CLIProxyAPI Go tests all pass

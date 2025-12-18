# Requirements: Phase C - Power Users & Routing Intelligence

## Overview
Phase C transforms KorProxy into the best tool for heavy users managing multiple AI providers and accounts. It introduces intelligent request routing based on request type, workspace profiles for per-project settings, multi-account load balancing with quota awareness, and local-only usage analytics—all while maintaining the privacy-first approach.

## Non-Goals
- **Per-request billing/cost tracking** - No token-level cost calculation or budget enforcement (Phase D)
- **Team/shared profiles** - Profiles are local-only, no team sharing (Phase D)
- **Provider-specific rate limit APIs** - No integration with provider quota APIs (too fragile)
- **Custom model fine-tuning routing** - No support for routing to fine-tuned models
- **Real-time collaborative profile editing** - Single-user local profiles only
- **Historical analytics beyond 90 days** - Local storage constraints

## User Stories

### Primary User Stories
1. **As a** power user with multiple AI subscriptions, **I want** to route code completions to fast models and chat to capable models, **so that** I get optimal performance for each task type.
2. **As a** developer working on multiple projects, **I want** workspace profiles with different provider configurations, **so that** I can use appropriate AI accounts per project.
3. **As a** user with multiple accounts per provider, **I want** automatic load balancing across accounts, **so that** I can maximize my usage quotas without manual switching.

### Secondary User Stories
1. **As a** user, **I want** to quickly switch profiles from the system tray, **so that** I don't have to open the app each time I change projects.
2. **As a** user, **I want** to see local usage analytics, **so that** I understand my AI usage patterns across providers.
3. **As a** user, **I want** optional cloud sync of aggregate metrics, **so that** I can view my usage across devices.

---

## Functional Requirements

### Must Have (P0)

#### Routing Rules (`spec: routing-rules`)
- [ ] Request type classification (chat, completion, embedding, other) based on endpoint path
- [ ] Model-family mapping as secondary classification signal
- [ ] Per-profile routing rules (request type → provider group)
- [ ] Default routing rules for unclassified requests
- [ ] RoutingConfig stored in shared config file readable by Go backend

#### Load Balancing (`spec: load-balancing`)
- [ ] Provider groups concept (logical grouping of accounts)
- [ ] Round-robin selection within provider groups
- [ ] Account health tracking (available, rate_limited, erroring)
- [ ] Automatic backoff for rate-limited accounts (429 responses)
- [ ] Fallback to next healthy account on failures

#### Profiles (`spec: profiles`)
- [ ] Profile model: id, name, color/icon, routing rules, default provider groups
- [ ] Create, edit, delete profiles in Settings UI
- [ ] Active profile selection (one at a time globally)
- [ ] Profile persistence via Zustand store with persist middleware
- [ ] Config sync from Electron to Go backend (file-based)

### Should Have (P1)

#### Tray Profiles (`spec: tray-profiles`)
- [ ] "Profiles" submenu in system tray context menu
- [ ] Radio-style selection showing current active profile
- [ ] Quick switch updates config and syncs to Go backend
- [ ] Current profile name visible in tray tooltip

#### Local Analytics (`spec: local-analytics`)
- [ ] Request counts per provider, model, profile, request type
- [ ] Latency tracking (p50/p90/p99) per provider and model
- [ ] Failure counts by provider and error type (4xx, 5xx, timeout, 429)
- [ ] Rolling retention (last 30 days, configurable up to 90 days)
- [ ] Metrics endpoint on localhost for Electron to query
- [ ] Analytics tab in Electron app with charts

##### Metrics API Design
```
GET /_korproxy/metrics?from=2025-01-01&to=2025-01-31&granularity=day

Response:
{
  "period": { "from": "2025-01-01", "to": "2025-01-31" },
  "summary": {
    "total_requests": 1247,
    "total_failures": 23,
    "avg_latency_ms": 342
  },
  "by_provider": {
    "openai": { "requests": 800, "failures": 10, "p50_ms": 280, "p90_ms": 450 },
    "anthropic": { "requests": 447, "failures": 13, "p50_ms": 320, "p90_ms": 520 }
  },
  "by_type": {
    "chat": { "requests": 900, "failures": 15 },
    "completion": { "requests": 300, "failures": 5 },
    "embedding": { "requests": 47, "failures": 3 }
  },
  "by_profile": {
    "work": { "requests": 1000 },
    "personal": { "requests": 247 }
  },
  "daily": [
    { "date": "2025-01-01", "requests": 42, "failures": 1, "avg_latency_ms": 310 },
    ...
  ]
}
```

### Nice to Have (P2)

#### Cloud Sync (`spec: cloud-sync`)
- [ ] Opt-in toggle in Settings with clear data explanation
- [ ] Daily aggregate sync to Convex (no prompts, no content)
- [ ] Anonymized workspace identifiers (hashed)
- [ ] Manual "Sync now" button
- [ ] Web dashboard view of aggregate metrics

#### Advanced Routing
- [ ] Request body inspection for ambiguous classification
- [ ] X-KorProxy-Profile header for per-request override
- [ ] X-KorProxy-Request-Type header for classification override
- [ ] Per-workspace auto-detection (git repo → profile mapping)

---

## Non-Functional Requirements

### Performance
- [ ] Routing decision latency < 5ms
- [ ] Proxy latency overhead < 80ms p50, < 200ms p95
- [ ] Config hot-reload without proxy restart
- [ ] Profile switch effective within 1 second

### Privacy & Security
- [ ] No prompt text or completions logged
- [ ] No user file paths or contents stored
- [ ] Local analytics inspectable by user
- [ ] Cloud sync fully opt-in with granular controls
- [ ] Anonymized identifiers for any cloud data

### Reliability
- [ ] Error rate per provider ≤ 1%
- [ ] Graceful degradation when all accounts rate-limited
- [ ] Account health recovery after backoff period
- [ ] Config parsing errors don't crash proxy

---

## Technical Constraints
- [ ] Routing logic must live in Go backend (CLIProxyAPI submodule)
- [ ] Profile/config UX lives in Electron app
- [ ] Use existing Zustand + persist patterns for profile store
- [ ] Use existing tray Menu.buildFromTemplate() pattern
- [ ] Go backend reads config from shared file (no direct IPC)
- [ ] Cloud sync uses existing Convex backend
- [ ] No Sentry - local logging only
- [ ] Use bun, not npm

## Dependencies
- **Phase B**: Onboarding & UX complete (provides foundation)
- **CLIProxyAPI**: Existing RoundRobinSelector, auth/manager.go
- **korproxy-app**: Existing appStore, authStore, tray.ts patterns
- **korproxy-backend**: Existing Convex schema for users/subscriptions

## Blockers
- **CLIProxyAPI version contract**: Must define stable config file schema before C1 implementation
- **Go submodule coordination**: Changes to CLIProxyAPI require separate PR and version bump
- **Config file location**: Must agree on `~/.korproxy/config.json` path across platforms

## Impact Analysis

### Existing Users
- **Single-account users**: Unaffected - default "Default" profile auto-created on upgrade
- **Existing settings**: Preserved - new profile system is additive
- **Proxy behavior**: Unchanged unless user configures routing rules

### Existing Code
- **auth/manager.go**: Extended, not replaced - new methods added alongside existing
- **RoundRobinSelector**: Enhanced with health tracking, backward compatible
- **Settings page**: New "Profiles" and "Analytics" tabs added, existing tabs unchanged
- **Tray menu**: Extended with "Profiles" submenu, existing items preserved

### Migration Path
1. On first launch post-upgrade, create "Default" profile with current settings
2. Existing accounts automatically assigned to "Default" provider group
3. No user action required - existing behavior preserved

---

## Acceptance Criteria

### Criterion 1: Request Routing
- **Given**: A user has configured "chat → openai-capable" and "completion → gemini-fast"
- **When**: A request to `/v1/chat/completions` arrives
- **Then**: The request is routed to an account in the "openai-capable" group

### Criterion 2: Load Balancing
- **Given**: A provider group has 3 accounts and one returns 429
- **When**: Subsequent requests arrive
- **Then**: The rate-limited account is deprioritized and other accounts used

### Criterion 3: Profile Switching
- **Given**: User has "Work" and "Personal" profiles configured
- **When**: User selects "Personal" from tray menu
- **Then**: Active profile changes and next request uses Personal profile rules

### Criterion 4: Local Analytics
- **Given**: User has made 100 requests today
- **When**: User opens Analytics tab
- **Then**: Charts show request distribution by provider, model, and type

### Criterion 5: Cloud Sync (Opt-in)
- **Given**: User has enabled cloud sync
- **When**: Daily sync runs
- **Then**: Only aggregate counts (no content) are sent to Convex

---

## Test Scenarios

### Happy Path
- User creates profile → saves successfully → appears in tray menu
- Request arrives → classified correctly → routed to configured provider group
- Account returns 429 → marked rate-limited → next request uses different account

### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| Config file missing | Create default config with "Default" profile |
| Config file corrupted/invalid JSON | Log error, use in-memory defaults, notify user |
| All accounts in group rate-limited | Use least-recently-limited account, log warning |
| Profile deleted while active | Switch to "Default" profile automatically |
| Unknown request type | Route using "other" rules, fallback to default provider |
| Metrics endpoint called with invalid date range | Return 400 with helpful error message |
| Profile name conflicts (duplicate) | Reject with validation error in UI |
| Go backend unreachable for config | Electron retries 3x, shows connection error |

### Error Recovery
- **Config parse failure**: Proxy starts with defaults, Electron shows "Config error" banner with "Reset" option
- **Metrics storage full**: Auto-prune oldest data, warn user in Analytics tab
- **Profile sync fails**: Queue changes, retry on next app focus, show sync status indicator

---

## Success Metrics (from Roadmap)
- ≥ 30% of active users with multiple providers connected
- Power user satisfaction ≥ 4/5 on routing features (survey)
- Proxy latency overhead < 80ms p50, < 200ms p95
- Error rate per provider ≤ 1%

---

## Open Questions
- [ ] Should profiles auto-switch based on detected workspace/repo?
- [ ] How detailed should token estimation be (rough vs accurate)?
- [ ] Should we support custom routing rules beyond type-based (e.g., time-of-day)?
- [ ] What visualizations are most valuable for the Analytics tab?

## Research Notes

### Existing Go Backend Patterns
- `RoundRobinSelector` in `sdk/cliproxy/auth/selector.go` - base for load balancing
- `pickNext()`, `rotateProviders()` in `auth/manager.go` - provider selection
- `FallbackHandler` in `amp/fallback_handlers.go` - already does model mapping
- Module system in `internal/api/modules/` - pluggable routes

### Existing Electron Patterns
- Zustand stores with `persist` middleware (appStore, authStore, themeStore)
- Main process sync via IPC for settings changes
- Tray uses `Menu.buildFromTemplate()` with click handlers
- Settings page uses Radix Tabs component

### Request Classification Strategy
1. **Primary**: Endpoint path (`/v1/chat/completions` → chat)
2. **Secondary**: Model name family mapping
3. **Fallback**: Request body schema inspection
4. **Override**: Optional headers for advanced users

### Proposed Architecture
```
Electron App (UI)                    Go Backend (Runtime)
┌─────────────────┐                 ┌──────────────────────┐
│ profileStore    │───writes───────▶│ ~/.korproxy/config   │
│ (Zustand)       │                 │     .json            │
├─────────────────┤                 └──────────┬───────────┘
│ Settings UI     │                            │ reads
│ - Profiles tab  │                            ▼
│ - Analytics tab │                 ┌──────────────────────┐
├─────────────────┤                 │ RoutingConfig        │
│ Tray Menu       │                 │ - active_profile     │
│ - Profile list  │                 │ - profiles[]         │
└─────────────────┘                 │ - provider_groups[]  │
                                    └──────────┬───────────┘
                                               │
                                    ┌──────────▼───────────┐
                                    │ RequestClassifier    │
                                    │ - ClassifyRequest()  │
                                    └──────────┬───────────┘
                                               │
                                    ┌──────────▼───────────┐
                                    │ EnhancedSelector     │
                                    │ - pickByGroup()      │
                                    │ - healthTracking     │
                                    └──────────────────────┘
```

## Visuals
- [planning/visuals/] - To be added during spec phase

---

## Implementation Slices (Proposed)

| Slice | Name | Scope | Est |
|-------|------|-------|-----|
| C1 | Routing Core | RequestContext, ClassifyRequest, RoutingConfig in Go | 4h |
| C2 | Multi-Account | Provider groups, enhanced selector, health tracking | 4h |
| C3 | Profiles & Tray | profileStore, Settings UI, tray menu extension | 5h |
| C4 | Local Analytics | Metrics collection, storage, localhost endpoint, UI | 6h |
| C5 | Cloud Sync | Opt-in toggle, Convex schema, periodic sync | 3h |

**Total Estimate**: ~22 hours

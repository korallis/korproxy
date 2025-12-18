# Specification: Phase C - Power Users & Routing Intelligence

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.2

## 1. Overview

### 1.1 Summary
Phase C transforms KorProxy into the best tool for power users managing multiple AI providers and accounts. It introduces intelligent request routing based on request type (chat vs completion), workspace profiles for per-project settings, multi-account load balancing with quota awareness, and local-only usage analytics—all while maintaining the privacy-first approach.

### 1.2 Goals
- **Smart Routing**: Route code completions to fast models and chat to capable models automatically
- **Multi-Account**: Load balance across multiple accounts per provider with quota awareness
- **Profiles**: Enable per-project configurations with quick tray switching
- **Visibility**: Provide local usage analytics without compromising privacy

### 1.3 Non-Goals
- Per-request billing/cost tracking (Phase D)
- Team/shared profiles (Phase D)
- Provider-specific rate limit API integrations
- Custom model fine-tuning routing
- Real-time collaborative profile editing
- Historical analytics beyond 90 days

---

## 2. User Stories

### Primary
1. **As a** power user with multiple AI subscriptions, **I want** to route code completions to fast models and chat to capable models, **so that** I get optimal performance for each task type.
2. **As a** developer working on multiple projects, **I want** workspace profiles with different provider configurations, **so that** I can use appropriate AI accounts per project.
3. **As a** user with multiple accounts per provider, **I want** automatic load balancing across accounts, **so that** I can maximize my usage quotas without manual switching.

### Secondary
1. **As a** user, **I want** to quickly switch profiles from the system tray, **so that** I don't have to open the app each time I change projects.
2. **As a** user, **I want** to see local usage analytics, **so that** I understand my AI usage patterns across providers.
3. **As a** user, **I want** optional cloud sync of aggregate metrics, **so that** I can view my usage across devices.

---

## 3. Requirements

### 3.1 Functional Requirements

#### Routing Rules (`spec: routing-rules`)

| ID | Requirement | Priority |
|----|-------------|----------|
| RR1 | Request type classification (chat, completion, embedding, other) based on endpoint path | P0 |
| RR2 | Model-family mapping as secondary classification signal | P0 |
| RR3 | Per-profile routing rules (request type → provider group) | P0 |
| RR4 | Default routing rules for unclassified requests | P0 |
| RR5 | RoutingConfig stored in shared config file readable by Go backend | P0 |
| RR6 | Request body inspection for ambiguous classification | P2 |
| RR7 | X-KorProxy-Profile header for per-request override | P2 |

#### Load Balancing (`spec: load-balancing`)

| ID | Requirement | Priority |
|----|-------------|----------|
| LB1 | Provider groups concept (logical grouping of accounts) | P0 |
| LB2 | Round-robin selection within provider groups | P0 |
| LB3 | Account health tracking (available, rate_limited, erroring) | P0 |
| LB4 | Automatic backoff for rate-limited accounts (429 responses) | P0 |
| LB5 | Fallback to next healthy account on failures | P0 |

#### Profiles (`spec: profiles`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PF1 | Profile model: id, name, color/icon, routing rules, default provider groups | P0 |
| PF2 | Create, edit, delete profiles in Settings UI | P0 |
| PF3 | Active profile selection (one at a time globally) | P0 |
| PF4 | Profile persistence via Zustand store with persist middleware | P0 |
| PF5 | Config sync from Electron to Go backend (file-based) | P0 |

#### Tray Profiles (`spec: tray-profiles`)

| ID | Requirement | Priority |
|----|-------------|----------|
| TP1 | "Profiles" submenu in system tray context menu | P1 |
| TP2 | Radio-style selection showing current active profile | P1 |
| TP3 | Quick switch updates config and syncs to Go backend | P1 |
| TP4 | Current profile name visible in tray tooltip | P1 |

#### Local Analytics (`spec: local-analytics`)

| ID | Requirement | Priority |
|----|-------------|----------|
| LA1 | Request counts per provider, model, profile, request type | P1 |
| LA2 | Latency tracking (p50/p90/p99) per provider and model | P1 |
| LA3 | Failure counts by provider and error type | P1 |
| LA4 | Rolling retention (30-90 days configurable) | P1 |
| LA5 | Metrics endpoint on localhost for Electron to query | P1 |
| LA6 | Analytics tab in Electron app with charts | P1 |

#### Cloud Sync (`spec: cloud-sync`)

| ID | Requirement | Priority |
|----|-------------|----------|
| CS1 | Opt-in toggle in Settings with clear data explanation | P2 |
| CS2 | Daily aggregate sync to Convex (no prompts, no content) | P2 |
| CS3 | Anonymized workspace identifiers (hashed) | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Routing decision latency | < 5ms |
| NFR2 | Proxy latency overhead | < 80ms p50, < 200ms p95 |
| NFR3 | Config hot-reload | Without proxy restart |
| NFR4 | Profile switch latency | < 1 second effective |
| NFR5 | Error rate per provider | ≤ 1% |
| NFR6 | Privacy | No prompt/completion logging |

### 3.3 Success Metrics (from Roadmap)

| ID | Metric | Target |
|----|--------|--------|
| SM1 | Users with multiple providers connected | ≥ 30% of active users |
| SM2 | Power user satisfaction on routing | ≥ 4/5 (survey) |
| SM3 | Proxy latency overhead | < 80ms p50, < 200ms p95 |
| SM4 | Error rate per provider | ≤ 1% |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        KorProxy Desktop App                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Electron Main Process                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │ │
│  │  │ConfigWriter │  │TrayManager  │  │     SettingsStore        │   │ │
│  │  │   (NEW)     │  │ (ENHANCED)  │  │      (existing)          │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────────────────────────┘   │ │
│  │         │                │                                         │ │
│  │  Writes │                │ Profiles submenu                        │ │
│  │         ▼                │                                         │ │
│  │  ~/.korproxy/config.json │                                         │ │
│  └─────────┬────────────────┴─────────────────────────────────────────┘ │
│            │                                                             │
│            │ IPC                                                         │
│            ▼                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                 Electron Renderer (React)                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │ │
│  │  │profileStore │  │AnalyticsTab │  │    SettingsProfiles      │   │ │
│  │  │   (NEW)     │  │   (NEW)     │  │        (NEW)             │   │ │
│  │  └─────────────┘  └─────────────┘  └──────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Reads config file
                                    │ File watcher
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLIProxyAPI (Go Sidecar)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │RoutingConfig    │  │RequestClassifier│  │   MetricsCollector      │ │
│  │   (NEW)         │  │    (NEW)        │  │       (NEW)             │ │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘ │
│           │                    │                       │               │
│           ▼                    ▼                       ▼               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              EnhancedSelector (extends RoundRobinSelector)       │   │
│  │  • Provider groups                                               │   │
│  │  • Health tracking (available, rate_limited, erroring)           │   │
│  │  • Quota-aware backoff                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    GET /_korproxy/metrics                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

#### Profile
- `id`: UUID string
- `name`: Display name (e.g., "Work", "Personal")
- `color`: Hex color for UI badge
- `icon`: Optional icon identifier
- `routingRules`: Map of request type → provider group ID
- `defaultProviderGroup`: Fallback provider group
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

#### ProviderGroup
- `id`: UUID string
- `name`: Display name (e.g., "Fast Models", "Capable Models")
- `accountIds`: Array of account IDs in this group
- `selectionStrategy`: "round-robin" | "random" | "priority"

#### RoutingConfig (shared config file)
- `version`: Schema version for migrations
- `activeProfileId`: Currently active profile
- `profiles`: Array of Profile objects
- `providerGroups`: Array of ProviderGroup objects
- `modelFamilies`: Map of request type → model name patterns

#### RequestContext (Go runtime)
- `Type`: chat | completion | embedding | other
- `Model`: Requested model name
- `Path`: Request endpoint path
- `ProfileID`: Active profile (from config or header override)
- `ProviderGroup`: Resolved target group

#### MetricsRecord (local storage)
- `date`: YYYY-MM-DD
- `provider`: Provider identifier
- `model`: Model name
- `profile`: Profile ID
- `requestType`: chat | completion | embedding | other
- `count`: Request count
- `failures`: Failure count by type
- `latency`: Histogram buckets for percentile calculation

### 4.3 API Design

#### Config File Schema (`~/.korproxy/config.json`)
```
{
  "version": 1,
  "activeProfileId": "uuid-1",
  "profiles": [...],
  "providerGroups": [...],
  "modelFamilies": {
    "chat": ["gpt-4*", "claude-*", "gemini-pro"],
    "completion": ["gpt-3.5-turbo-instruct", "code-*"],
    "embedding": ["text-embedding-*", "embed-*"]
  }
}
```

#### Metrics Endpoint
```
GET /_korproxy/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|hour

Response: {
  "period": { "from": "...", "to": "..." },
  "summary": { "total_requests": N, "total_failures": N, "avg_latency_ms": N },
  "by_provider": { "<provider>": { "requests": N, "failures": N, "p50_ms": N, "p90_ms": N } },
  "by_type": { "<type>": { "requests": N, "failures": N } },
  "by_profile": { "<profile>": { "requests": N } },
  "daily": [{ "date": "...", "requests": N, "failures": N, "avg_latency_ms": N }]
}
```

#### New IPC Channels
- `PROFILE_LIST` - Get all profiles
- `PROFILE_CREATE` - Create new profile
- `PROFILE_UPDATE` - Update profile
- `PROFILE_DELETE` - Delete profile
- `PROFILE_SET_ACTIVE` - Switch active profile
- `PROVIDER_GROUP_LIST` - Get all provider groups
- `PROVIDER_GROUP_CREATE` - Create provider group
- `CONFIG_SYNC` - Force config write to disk

### 4.4 Key Algorithms

#### Request Classification
1. **Endpoint path matching** (primary): `/v1/chat/completions` → chat, `/v1/completions` → completion, `/v1/embeddings` → embedding
2. **Model family matching** (secondary): If path ambiguous, check model name against configured patterns
3. **Body inspection** (fallback, P2): Check for `messages` array vs `prompt` string
4. **Header override** (advanced): `X-KorProxy-Request-Type` header takes precedence

#### Provider Selection
1. Get active profile from config
2. Resolve request type using classifier
3. Look up provider group from profile's routing rules
4. Get healthy accounts in that group (filter by health status)
5. Apply round-robin selection among healthy accounts
6. On 429/5xx: mark account as rate_limited, set backoff timer, retry with next account

#### Health State Machine
```
AVAILABLE ──[429/5xx]──▶ RATE_LIMITED ──[backoff expires]──▶ AVAILABLE
    │                         │
    │                    [repeated 429]
    │                         │
    ▼                         ▼
ERRORING ◀──[3+ failures]─────┘
    │
    [manual reset or 30min timeout]
    │
    ▼
AVAILABLE
```

---

## 5. Reusable Code

### Existing Components to Leverage

#### Go Backend
- `sdk/cliproxy/auth/selector.go` - `RoundRobinSelector` base class with `Pick()` method
- `sdk/cliproxy/auth/manager.go` - `pickNext()`, `rotateProviders()` for provider selection
- `internal/api/modules/amp/fallback_handlers.go` - Model mapping patterns
- `internal/api/server.go` - Route registration patterns

#### Electron App
- `src/stores/appStore.ts` - Zustand with persist middleware pattern
- `src/stores/onboardingStore.ts` - Store with navigation state
- `electron/main/tray.ts` - `Menu.buildFromTemplate()` with submenus
- `src/pages/Settings.tsx` - Radix Tabs component structure

### Patterns to Follow
- **Zustand persist** as seen in `src/stores/appStore.ts` - partialize for selective persistence
- **IPC with Zod validation** as seen in `electron/main/ipc.ts`
- **Tray submenu** pattern from `electron/main/tray.ts` with `type: 'radio'` for profile selection
- **Go selector interface** from `selector.go` for extending with health tracking

---

## 6. Testing Strategy

### Unit Tests
- Request classifier correctly identifies chat/completion/embedding/other
- Profile store CRUD operations
- Provider group membership updates
- Health state transitions (available → rate_limited → available)
- Metrics aggregation calculations
- Config file parsing and validation

### Integration Tests
- Full routing flow: request → classify → route → select account
- Profile switch propagates to Go backend via config file
- Tray menu updates when profiles change
- Metrics endpoint returns correct aggregates
- 429 handling triggers account rotation

### E2E Tests
- Create profile → configure routing → verify requests route correctly
- Switch profile via tray → verify next request uses new profile
- Simulate rate limiting → verify automatic failover
- Open Analytics tab → verify charts render with real data
- Enable cloud sync → verify only aggregates sent to Convex

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `ROUTING_ENABLED` - Enable request classification and routing (default: true)
- `ANALYTICS_ENABLED` - Enable local metrics collection (default: true)
- `CLOUD_SYNC_AVAILABLE` - Show cloud sync option in settings (default: false initially)

### 7.2 Migration
1. On first launch post-upgrade, create "Default" profile with current settings
2. Existing accounts automatically assigned to "Default" provider group
3. No routing rules by default (all requests use default group)
4. User must explicitly configure routing to enable smart routing

### 7.3 Rollback
- **Config reset**: Delete `~/.korproxy/config.json` to reset to defaults
- **Profile fallback**: If active profile deleted, auto-switch to "Default"
- **Feature disable**: Set feature flags to false in settings
- **Metrics clear**: "Clear Analytics Data" button in Settings → Analytics

---

## 8. Open Questions
- [ ] Should profiles auto-switch based on detected workspace/repo?
- [ ] How detailed should token estimation be (rough vs accurate)?
- [ ] Should we support custom routing rules beyond type-based (e.g., time-of-day)?
- [ ] What visualizations are most valuable for the Analytics tab?

## 8.1 Decisions Made
- **Config communication**: File-based (Go reads `~/.korproxy/config.json`) rather than IPC
- **Profile scope**: Global active profile, not per-window
- **Health tracking**: Simple state machine, not ML-based prediction
- **Metrics storage**: JSON files per day, not SQLite (simpler, inspectable)
- **Cloud sync backend**: Reuse Convex, not separate service

---

## 9. References
- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Phase B Spec](../phase-b-onboarding-ux/spec.md) - Pattern reference
- [Existing Selector](../../../CLIProxyAPI/sdk/cliproxy/auth/selector.go)
- [Existing Tray](../../../korproxy-app/electron/main/tray.ts)
- [Existing App Store](../../../korproxy-app/src/stores/appStore.ts)

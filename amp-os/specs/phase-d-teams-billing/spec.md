# Specification: Phase D - Teams, Billing & Web Dashboard

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.3

## 1. Overview

### 1.1 Summary
Phase D transforms KorProxy into a sustainable product with subscription billing (Stripe), team functionality with seat-based pricing, multi-device account sync, and a web dashboard for usage/billing/team administration. This phase builds on Phase C's routing and analytics foundation, adding monetization and collaboration features while maintaining privacy-first principles.

### 1.2 Goals
- **Monetization**: Implement Free/Pro/Team subscription tiers with Stripe billing
- **Team Collaboration**: Enable team accounts with seat management and role-based access
- **Multi-Device**: Sync settings and entitlements across user devices in real-time
- **Web Dashboard**: Provide comprehensive usage, billing, and team management interface
- **Graceful Enforcement**: Limit features based on plan without breaking user workflows

### 1.3 Non-Goals
- Per-request cost tracking (future phase)
- Custom/enterprise pricing tiers
- Self-hosted team servers
- SSO/SAML authentication
- Usage-based billing
- Mobile app support
- Team profile/workspace sharing (teams share billing only)
- Offline team operations
- Historical data migration for new tables

---

## 2. User Stories

### Primary
1. **As a** power user, **I want** to upgrade to a Pro subscription, **so that** I can unlock premium features like smart routing and multiple profiles.
2. **As a** team lead, **I want** to create a team account with seat-based billing, **so that** my developers can share KorProxy Pro features under one subscription.
3. **As a** team admin, **I want** to invite members and manage roles, **so that** I can control who has access to team resources.
4. **As a** user with multiple devices, **I want** my settings synced across devices, **so that** I have a consistent experience everywhere.
5. **As a** subscriber, **I want** to manage my billing through a web dashboard, **so that** I can update payment methods and view invoices.

### Secondary
1. **As a** user, **I want** a clear trial experience, **so that** I can evaluate Pro features before committing.
2. **As a** team owner, **I want** to see usage across team members, **so that** I understand value and utilization.
3. **As a** user with a past-due payment, **I want** graceful degradation (not lockout), **so that** I can fix billing without losing my work.
4. **As an** admin, **I want** to transfer team ownership, **so that** billing continuity is maintained when leadership changes.

---

## 3. Requirements

### 3.1 Functional Requirements

#### Subscription Enforcement (`spec: subscription-enforcement`)

| ID | Requirement | Priority |
|----|-------------|----------|
| SE1 | Plan tiers: Free (limited), Pro (individual), Team (per-seat) | P0 |
| SE2 | Desktop app entitlementStore with cached entitlements | P0 |
| SE3 | Graceful degradation for past-due/expired subscriptions | P0 |
| SE4 | 72-hour offline grace period before degrading to Free | P0 |
| SE5 | Free tier limits: 1 profile, 2 provider groups, 7-day analytics | P0 |
| SE6 | Upgrade CTA when user hits plan limits | P0 |
| SE7 | Real-time entitlement updates via Convex subscription | P1 |

#### Stripe Integration (`spec: stripe-integration`)

| ID | Requirement | Priority |
|----|-------------|----------|
| ST1 | Checkout session creation for Pro and Team plans | P0 |
| ST2 | Billing Portal session for subscription management | P0 |
| ST3 | Webhook handling for all subscription lifecycle events | P0 |
| ST4 | Team subscription with seat quantity management | P0 |
| ST5 | 7-day trial period for new subscriptions | P0 |
| ST6 | Idempotent webhook processing via stripeEventId | P0 |

#### Team Management (`spec: team-management`)

| ID | Requirement | Priority |
|----|-------------|----------|
| TM1 | Create/delete teams with automatic owner assignment | P0 |
| TM2 | Invite members via email with role selection | P0 |
| TM3 | Roles: owner (billing), admin (members), member (usage) | P0 |
| TM4 | Seat tracking: seatsPurchased vs seatsUsed | P0 |
| TM5 | Block invites when seats exhausted | P0 |
| TM6 | Ownership transfer between team members | P1 |
| TM7 | 7-day invite expiration with resend capability | P1 |

#### Multi-Device Sync (`spec: device-sync`)

| ID | Requirement | Priority |
|----|-------------|----------|
| DS1 | Device registration on app startup with OS metadata | P0 |
| DS2 | Settings/entitlements sync via Convex real-time queries | P0 |
| DS3 | Device list in web dashboard | P1 |
| DS4 | Remote device sign-out capability | P1 |
| DS5 | Auto-remove stale devices (90 days inactive) | P2 |

#### Web Dashboard (`spec: web-dashboard`)

| ID | Requirement | Priority |
|----|-------------|----------|
| WD1 | Overview page: plan status, usage summary, alerts | P1 |
| WD2 | Usage page: metrics charts by provider, type, time | P1 |
| WD3 | Billing page: plan details, Stripe Portal access | P1 |
| WD4 | Teams page: member list, invite management | P1 |
| WD5 | Account page: profile, devices, preferences | P1 |
| WD6 | Invite acceptance page with auth flow | P1 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Entitlement check latency | < 10ms (cached) |
| NFR2 | Dashboard page load | < 2 seconds |
| NFR3 | Webhook processing time | < 500ms |
| NFR4 | Subscription activation | < 30 seconds after checkout |
| NFR5 | Device sync latency | < 5 seconds |
| NFR6 | Billing error rate | < 1 per 500 events |

### 3.3 Success Metrics (from Roadmap)

| ID | Metric | Target |
|----|--------|--------|
| SM1 | Paid conversion | ≥ 5-10% of active users |
| SM2 | Monthly churn | < 5% |
| SM3 | Live team accounts | ≥ 2 teams |
| SM4 | Billing error rate | < 1 per 500 events |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Phase D Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐       ┌──────────────────────┐      ┌───────────┐│
│  │   Desktop App        │       │   Web Dashboard      │      │  Stripe   ││
│  │   (Electron)         │       │   (Next.js)          │      │           ││
│  │                      │       │                      │      │ Checkout  ││
│  │ ┌──────────────────┐ │       │ ┌──────────────────┐ │      │ Portal    ││
│  │ │ entitlementStore │◄┼───────┼─┤ /dashboard/*     │ │      │ Webhooks  ││
│  │ │ (Zustand+persist)│ │  RT   │ │ /billing         │─┼──────┼──────────►││
│  │ └──────────────────┘ │ Sync  │ │ /teams           │ │      │           ││
│  │                      │       │ │ /account         │ │      └───────────┘│
│  │ ┌──────────────────┐ │       │ └──────────────────┘ │           │       │
│  │ │ Upgrade Modal    │─┼───────┼──────────────────────┼───────────┘       │
│  │ └──────────────────┘ │       │                      │                   │
│  │                      │       │ ┌──────────────────┐ │                   │
│  │ ┌──────────────────┐ │       │ │ /invite/[token]  │ │                   │
│  │ │ deviceId (local) │ │       │ └──────────────────┘ │                   │
│  │ └──────────────────┘ │       └──────────────────────┘                   │
│  └──────────────────────┘                │                                  │
│            │                             │                                  │
│            │ IPC + Convex               │ Convex                           │
│            ▼                             ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Convex Backend                                │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │   users     │  │   teams     │  │teamMembers  │  │  devices    │  │  │
│  │  │ +stripe     │  │ +stripe     │  │ +role       │  │ +lastSeen   │  │  │
│  │  │ +plan       │  │ +seats      │  │ +status     │  │ +platform   │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────────────────────────────────────────┐│  │
│  │  │teamInvites  │  │              Convex Functions                    ││  │
│  │  │ +token      │  │  entitlements.ts │ teams.ts    │ devices.ts     ││  │
│  │  │ +expiresAt  │  │  stripe.ts (ext) │ invites.ts  │ dashboard.ts   ││  │
│  │  └─────────────┘  └─────────────────────────────────────────────────┘│  │
│  │                                          │                            │  │
│  │  ┌───────────────────────────────────────┴───────────────────────┐   │  │
│  │  │                    POST /stripe-webhook                        │   │  │
│  │  └───────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

#### teams (NEW table)
- `id`: Auto-generated Convex ID
- `name`: Team display name
- `ownerUserId`: Reference to owner in users table
- `stripeCustomerId`: Stripe customer for team billing
- `stripeSubscriptionId`: Active subscription reference
- `subscriptionStatus`: none | trialing | active | past_due | canceled | expired
- `seatsPurchased`: Number from Stripe subscription quantity
- `seatsUsed`: Count of active teamMembers
- `currentPeriodEnd`: Unix timestamp for billing period
- `cancelAtPeriodEnd`: Boolean for pending cancellation
- `createdAt`, `updatedAt`: Timestamps
- Indexes: `by_owner`, `by_stripe_customer`

#### teamMembers (NEW table)
- `id`: Auto-generated Convex ID
- `teamId`: Reference to teams table
- `userId`: Reference to users table
- `role`: owner | admin | member
- `status`: active | invited | removed
- `joinedAt`, `removedAt`: Optional timestamps
- Indexes: `by_team`, `by_user`, `by_team_user`

#### teamInvites (NEW table)
- `id`: Auto-generated Convex ID
- `teamId`: Reference to teams table
- `invitedEmail`: Email address of invitee
- `inviterUserId`: Who sent the invite
- `role`: admin | member (owner cannot be invited)
- `status`: pending | accepted | expired | revoked
- `token`: Secure random string for invite URL
- `expiresAt`: 7 days from creation
- `createdAt`: Timestamp
- Indexes: `by_team`, `by_token`, `by_email`

#### devices (NEW table)
- `id`: Auto-generated Convex ID
- `userId`: Reference to users table
- `deviceId`: Persistent UUID stored in local app config
- `deviceName`: From OS (e.g., "MacBook Pro")
- `deviceType`: desktop | laptop | other
- `platform`: darwin | win32 | linux
- `appVersion`: KorProxy version string
- `lastSeenAt`: Updated on each app launch/sync
- `createdAt`: First registration timestamp
- Indexes: `by_user`, `by_device_id`

#### Entitlements (computed type, not stored)
- `plan`: free | pro | team
- `scope`: personal | team
- `teamId`: If scope is team
- `status`: active | trialing | grace | past_due | expired
- `maxProfiles`: Free=1, Pro=10, Team=unlimited
- `maxProviderGroups`: Free=2, Pro=10, Team=unlimited
- `maxDevices`: Free=1, Pro=3, Team=5
- `smartRoutingEnabled`: Free=false, Pro/Team=true
- `analyticsRetentionDays`: Free=7, Pro/Team=90
- `currentPeriodEnd`, `gracePeriodEnd`: Timestamps

### 4.3 API Design

#### New Convex Queries
- `entitlements.get(userId)` → Returns computed Entitlements object
- `entitlements.getForTeam(teamId)` → Returns team Entitlements
- `teams.listForUser(userId)` → Array of teams user belongs to
- `teams.get(teamId)` → Team details with member count
- `teams.listMembers(teamId)` → Array of members with user info
- `teams.listInvites(teamId)` → Pending invites
- `devices.listForUser(userId)` → Array of registered devices
- `dashboard.getOverview(userId)` → Plan, usage summary, alerts
- `dashboard.getUsageMetrics(userId, dateRange)` → Charts data

#### New Convex Mutations
- `teams.create(name)` → Creates team, sets caller as owner
- `teams.update(teamId, {name})` → Update team settings
- `teams.delete(teamId)` → Delete team (owner only, must remove members)
- `teams.transferOwnership(teamId, newOwnerId)` → Change owner
- `invites.create(teamId, email, role)` → Send invite (checks seat count)
- `invites.accept(token)` → Join team (validates token, checks seats)
- `invites.revoke(inviteId)` → Cancel pending invite
- `invites.resend(inviteId)` → Reset expiry, resend email
- `members.updateRole(memberId, role)` → Change member role
- `members.remove(memberId)` → Remove from team
- `devices.register(deviceInfo)` → Upsert device record
- `devices.remove(deviceId)` → Sign out device

#### Extended Stripe Actions
- `stripe.createTeamCheckoutSession(teamId, seats)` → Team subscription
- `stripe.updateTeamSeats(teamId, newSeatCount)` → Modify quantity

#### New IPC Channels (Desktop)
- `ENTITLEMENTS_GET` → Fetch current entitlements
- `ENTITLEMENTS_SUBSCRIBE` → Start real-time sync
- `DEVICE_REGISTER` → Register this device on startup
- `DEVICE_GET_INFO` → Get OS device name, platform
- `BILLING_OPEN_CHECKOUT(plan)` → Open Stripe Checkout in browser
- `BILLING_OPEN_PORTAL` → Open Stripe Portal in browser

#### Web Dashboard Routes
- `/dashboard` → Overview with plan status, alerts
- `/dashboard/usage` → Usage metrics with charts
- `/dashboard/billing` → Subscription management
- `/dashboard/teams` → Team list and creation
- `/dashboard/teams/[id]` → Team detail with members
- `/dashboard/account` → Profile and device management
- `/invite/[token]` → Invite acceptance flow

### 4.4 Key Algorithms

#### Entitlement Resolution
1. Fetch user's subscription status from users table
2. Fetch all teams where user is active member
3. Determine highest plan level (personal Pro beats team member)
4. If in team context, use team's subscription status
5. Apply plan limits based on tier
6. Calculate grace period if past_due (3 days) or offline (72 hours)
7. Return computed Entitlements object

#### Seat Management
1. On invite creation: check `seatsUsed < seatsPurchased`
2. If seats full: return error with "upgrade seats" suggestion
3. On invite acceptance: increment `seatsUsed`
4. On member removal: decrement `seatsUsed`
5. Seats only auto-increase via Stripe subscription update

#### Team Subscription Webhook Flow
1. Receive `customer.subscription.updated` event
2. Extract `quantity` from subscription items → `seatsPurchased`
3. Look up team by `stripeCustomerId`
4. Update team's subscription fields
5. Log to subscriptionEvents for audit

#### Graceful Degradation
1. On subscription status change to `past_due`:
   - Set 3-day grace period
   - Show banner in desktop app
   - Allow existing features, block new resource creation
2. After grace period expires:
   - Treat as Free tier
   - Disable premium features
   - Keep app functional for basic usage
3. On offline (Convex unreachable):
   - Use cached entitlements for 72 hours
   - After 72 hours, fall back to Free tier
   - Show "reconnect" banner

---

## 5. Reusable Code

### Existing Components to Leverage

#### Convex Backend
- `korproxy-backend/convex/stripe.ts` - Complete Stripe integration with webhook handling
- `korproxy-backend/convex/auth.ts` - Session validation, token management
- `korproxy-backend/convex/subscriptions.ts` - Subscription status query pattern
- `korproxy-backend/convex/schema.ts` - Existing users table with Stripe fields

#### Desktop App (Electron)
- `korproxy-app/src/stores/authStore.ts` - Zustand persist pattern, subscription sync to main
- `korproxy-app/src/stores/profileStore.ts` - Store with config sync pattern
- `korproxy-app/electron/main/ipc.ts` - IPC handler patterns with subscription validation
- `korproxy-app/src/hooks/useProxy.ts` - Subscription check before operations

#### Web Dashboard (Next.js)
- `korproxy-web/src/app/dashboard/layout.tsx` - Protected route pattern
- `korproxy-web/src/providers/AuthProvider.tsx` - Convex auth integration
- `korproxy-web/src/app/dashboard/subscription/page.tsx` - Stripe checkout/portal pattern
- `korproxy-web/src/lib/api.ts` - Convex query wrapper pattern

### Patterns to Follow
- **Zustand persist with sync** as in `authStore.ts` - persist to localStorage, sync to main process
- **Protected dashboard routes** as in `dashboard/layout.tsx` - check auth, redirect if needed
- **Stripe webhook idempotency** as in `stripe.ts` - use event ID to prevent duplicates
- **IPC with Zod validation** as in `ipc.ts` - validate all IPC payloads
- **Real-time Convex queries** - use `useQuery` for automatic updates
- **Convex returns validators** - all queries/mutations must include `returns` validator
- **Discriminated unions for state** - use `status: 'active' | 'trialing' | ...` pattern

### Error Types (following global standards)
```typescript
// Billing errors
class BillingError extends AppError {
  constructor(message: string, code: string) {
    super(message, code, 402, true);
  }
}

// Team errors  
class TeamError extends AppError {
  constructor(message: string, code: string, statusCode = 400) {
    super(message, code, statusCode, true);
  }
}

// Error codes
const BILLING_ERRORS = {
  SEATS_EXHAUSTED: 'seats_exhausted',
  PAYMENT_REQUIRED: 'payment_required',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
} as const;

const TEAM_ERRORS = {
  INVITE_EXPIRED: 'invite_expired',
  OWNER_CANNOT_LEAVE: 'owner_cannot_leave',
  DUPLICATE_INVITE: 'duplicate_invite',
} as const;
```

### Environment Variables Required
```bash
# Stripe (existing)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...

# New for Phase D
STRIPE_TEAM_PRICE_ID=price_...  # Team plan price
```

---

## 6. Testing Strategy

### Unit Tests
- Entitlement computation for all plan/status combinations
- Seat count validation (create invite, accept, remove)
- Role permission checks (owner vs admin vs member)
- Invite token generation and validation
- Device registration and deduplication
- Grace period calculations

### Integration Tests
- Full checkout flow: free user → checkout → active subscription
- Team creation → invite → accept → member visible
- Webhook processing: subscription events update correct records
- Multi-device sync: change setting → see on other device
- Entitlement enforcement: hit limit → show upgrade prompt

### E2E Tests
- Create Pro subscription via Stripe Checkout, verify features unlock
- Create team, invite member, member accepts and joins
- Simulate payment failure, verify graceful degradation
- Visit web dashboard, navigate all pages, verify data loads
- Switch profile on Device A, verify sync to Device B

### Edge Case Tests
- Webhook replay (same event twice) → no duplicate changes
- Expired invite link → show error with request-new option
- Owner tries to leave team → blocked, shown transfer prompt
- Seats exhausted → invite blocked with upgrade message
- 72+ hours offline → falls back to Free tier with banner

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `TEAMS_ENABLED` - Show team creation/management (default: true)
- `BILLING_ENABLED` - Enable Stripe integration (default: true)
- `DEVICE_SYNC_ENABLED` - Enable multi-device sync (default: true)

### 7.2 Migration
- All new tables (teams, teamMembers, teamInvites, devices) are additive
- No migration needed for existing user data
- Existing users start as Free tier, can upgrade
- First device registration happens on next app launch

### 7.3 Rollback
- **Subscription issues**: Users can manage via Stripe Portal directly
- **Team issues**: Delete team via Convex dashboard, members become individual users
- **Device issues**: Clear `~/.korproxy/device-id` to re-register
- **Feature disable**: Set feature flags to false, graceful fallback to individual mode

### 7.4 Implementation Phases

#### Phase D1: Subscription Enforcement (Week 1-2)
- entitlementStore in desktop app
- Free tier limits enforcement
- Graceful degradation for past-due
- Offline grace period
- Upgrade CTA components

#### Phase D2: Team Infrastructure (Week 3-4)
- Convex tables: teams, teamMembers, teamInvites
- Team CRUD with RBAC
- Invite flow (create, accept, revoke)
- Team Stripe checkout with seats
- Webhook handling for team subscriptions

#### Phase D3: Multi-Device & Dashboard (Week 5-6)
- Devices table and registration
- Convex real-time sync
- Web dashboard: Overview, Usage, Billing, Teams, Account
- Remote device sign-out

---

## 8. Open Questions

### Resolved
- [x] Should team workspaces have separate profiles? → **No, teams share billing only**
- [x] How to handle team owner leaving? → **Block leave, require ownership transfer**

### Pending
- [ ] What specific Free tier limits? (Proposed: 1 profile, 2 provider groups)
- [ ] Support annual billing with discount at launch?
- [ ] Email service for invite notifications? (Convex action vs external service)

### Decisions Made
- **Entitlement source of truth**: Convex, with local caching for offline
- **Team subscription location**: On teams table, not users (personal Pro separate)
- **Seat semantics**: Manual seat count changes, not auto-shrink
- **Device identification**: Persistent UUID in local config file
- **Invite expiration**: 7 days, with resend option

---

## 9. References
- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Phase C Spec](../phase-c-power-users/spec.md) - Pattern reference
- [Existing Stripe Integration](../../../korproxy-backend/convex/stripe.ts)
- [Existing Auth Store](../../../korproxy-app/src/stores/authStore.ts)
- [Existing Dashboard Layout](../../../korproxy-web/src/app/dashboard/layout.tsx)

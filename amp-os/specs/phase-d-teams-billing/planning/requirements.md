# Requirements: Phase D - Teams, Billing & Web Dashboard

## Overview
Phase D transforms KorProxy into a sustainable product with subscription billing (Stripe), team functionality with seat management, multi-device account sync, and a web dashboard for usage/billing/team administration. This phase builds on the existing Convex backend with Stripe integration patterns already in place.

## Goals & Success Metrics

| Metric | Target | Source |
|--------|--------|--------|
| Paid conversion | ≥ 5-10% of active users | Roadmap |
| Monthly churn | < 5% | Roadmap |
| Live team accounts | ≥ 2 teams | Roadmap |
| Billing error rate | < 1 per 500 events | Roadmap |
| Subscription activation latency | < 30 seconds after checkout | UX |
| Device sync latency | < 5 seconds | UX |

## Non-Goals

The following are explicitly **out of scope** for Phase D:

- **Per-request cost tracking** - Deferred to Phase E or beyond
- **Custom/enterprise pricing** - Only Free, Pro, Team tiers
- **Self-hosted team servers** - Cloud-only teams via Convex
- **SSO/SAML for teams** - Email/password auth only
- **Usage-based billing** - Flat subscription pricing only
- **Mobile app support** - Desktop and web only
- **Team profile sharing** - Teams share billing, not workspace profiles
- **Offline team features** - Team operations require connectivity
- **Historical data migration** - Fresh start for new tables

## User Stories

### Primary User Stories
1. **As a** power user, **I want** to upgrade to a Pro subscription, **so that** I can unlock premium features like smart routing and multiple profiles.
2. **As a** team lead, **I want** to create a team account with seat-based billing, **so that** my developers can share KorProxy Pro features under one subscription.
3. **As a** team admin, **I want** to invite members and manage roles, **so that** I can control who has access to team resources.
4. **As a** user with multiple devices, **I want** my settings synced across devices, **so that** I have a consistent experience everywhere.
5. **As a** subscriber, **I want** to manage my billing through a web dashboard, **so that** I can update payment methods and view invoices.

### Secondary User Stories
1. **As a** user, **I want** a clear trial experience, **so that** I can evaluate Pro features before committing.
2. **As a** team owner, **I want** to see usage across team members, **so that** I understand value and utilization.
3. **As a** user with a past-due payment, **I want** graceful degradation (not lockout), **so that** I can fix billing without losing my work.
4. **As an** admin, **I want** to transfer team ownership, **so that** billing continuity is maintained when leadership changes.

---

## Functional Requirements

### Must Have (P0)

#### Subscription Enforcement
- [ ] Plan tiers: Free (limited features), Pro (individual), Team (per-seat)
- [ ] Desktop app enforces entitlements with graceful degradation
- [ ] Cached entitlements with 72-hour offline grace period
- [ ] Free tier allows basic routing, limits profiles/provider groups
- [ ] Past-due status shows banner, limits new resource creation

#### Stripe Integration
- [ ] Checkout session creation for Pro and Team plans
- [ ] Billing Portal session for subscription management
- [ ] Webhook handling for subscription lifecycle events
- [ ] Seat quantity management for Team plans
- [ ] Trial period support (7 days, configurable)

#### Team Management
- [ ] Create/delete teams with owner assignment
- [ ] Invite members via email with role assignment
- [ ] Roles: owner, admin, member with appropriate permissions
- [ ] Seat count tracking (purchased vs used)
- [ ] Block invites when seats exhausted

#### Multi-Device Sync
- [ ] Device registration on app startup
- [ ] Settings/profiles sync via Convex real-time
- [ ] Device list visible in web dashboard
- [ ] Sign out device remotely

### Should Have (P1)

#### Web Dashboard
- [ ] Overview page with plan status and usage summary
- [ ] Usage page with metrics charts (requests, latency, providers)
- [ ] Billing page with plan details and Stripe Portal access
- [ ] Teams page with member management UI
- [ ] Account page with profile and device management

#### Entitlements
- [ ] Zustand store for entitlements in desktop app
- [ ] Real-time subscription status updates via Convex
- [ ] Feature flags for plan-specific capabilities
- [ ] Clear upgrade CTAs when hitting limits

### Nice to Have (P2)

#### Advanced Team Features
- [ ] Audit log for team admin actions
- [ ] Usage breakdown by team member
- [ ] Team workspace with shared profiles
- [ ] Custom seat pricing tiers (small, large teams)

#### Platform Expansion
- [ ] CLI authentication with same account
- [ ] API tokens for automation

---

## Non-Functional Requirements

### Performance
- Entitlement checks < 10ms (cached locally)
- Dashboard page loads < 2 seconds
- Webhook processing < 500ms

### Security
- Stripe webhook signature verification
- Role-based access control on all team mutations
- Secure invite token generation (single-use, expiring)

### Reliability
- Billing error rate < 1 per 500 events
- Offline grace period prevents accidental lockout
- Idempotent webhook handlers (via stripeEventId)

### Accessibility
- Web dashboard WCAG 2.1 AA compliant
- Keyboard navigation for all billing flows

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Phase D Architecture                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐│
│  │  Desktop App     │         │   Web Dashboard  │         │   Stripe     ││
│  │  (Electron)      │         │   (Next.js)      │         │              ││
│  │                  │         │                  │         │  ┌────────┐  ││
│  │ ┌──────────────┐ │         │ ┌──────────────┐ │         │  │Checkout│  ││
│  │ │entitleStore  │ │         │ │ /dashboard/* │ │         │  │Session │  ││
│  │ │(Zustand)     │◄┼────┐    │ │ /billing     │ │         │  └────┬───┘  ││
│  │ └──────────────┘ │    │    │ │ /teams       │ │         │       │      ││
│  │                  │    │    │ │ /account     │ │         │  ┌────▼───┐  ││
│  │ ┌──────────────┐ │    │    │ └──────┬───────┘ │         │  │Portal  │  ││
│  │ │Upgrade CTA   │─┼────┼────┼────────┼─────────┼─────────┼─►│Session │  ││
│  │ └──────────────┘ │    │    │        │         │         │  └────────┘  ││
│  └──────────────────┘    │    └────────┼─────────┘         │              ││
│                          │             │                    │  ┌────────┐  ││
│                          │             │                    │  │Webhooks│  ││
│                          │             │                    │  └────┬───┘  ││
│                          │             │                         │       ││
│  ┌───────────────────────┴─────────────┴─────────────────────────┴───────┐ │
│  │                        Convex Backend                                  │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │   users     │  │   teams     │  │teamMembers  │  │  devices    │   │ │
│  │  │+entitlements│  │+stripe fields│ │+invites     │  │+lastSeen    │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │ │
│  │                                                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Convex Functions                              │  │ │
│  │  │  stripe.ts (existing)  │  teams.ts (new)  │  devices.ts (new)   │  │ │
│  │  │  entitlements.ts (new) │  invites.ts (new)│  dashboard.ts (new) │  │ │
│  │  └─────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model

#### teams table (NEW)
```typescript
teams: defineTable({
  name: v.string(),
  ownerUserId: v.id("users"),
  
  // Stripe integration (team-level billing)
  stripeCustomerId: v.optional(v.string()),
  stripeSubscriptionId: v.optional(v.string()),
  subscriptionStatus: v.union(
    v.literal("none"),
    v.literal("trialing"),
    v.literal("active"),
    v.literal("past_due"),
    v.literal("canceled"),
    v.literal("expired")
  ),
  
  // Seat management
  seatsPurchased: v.number(),  // from Stripe subscription quantity
  seatsUsed: v.number(),       // count of active teamMembers
  
  // Subscription dates
  currentPeriodEnd: v.optional(v.number()),
  cancelAtPeriodEnd: v.optional(v.boolean()),
  
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_owner", ["ownerUserId"])
  .index("by_stripe_customer", ["stripeCustomerId"])
```

#### teamMembers table (NEW)
```typescript
teamMembers: defineTable({
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: v.union(
    v.literal("owner"),
    v.literal("admin"),
    v.literal("member")
  ),
  status: v.union(
    v.literal("active"),
    v.literal("invited"),
    v.literal("removed")
  ),
  joinedAt: v.optional(v.number()),
  removedAt: v.optional(v.number()),
})
  .index("by_team", ["teamId"])
  .index("by_user", ["userId"])
  .index("by_team_user", ["teamId", "userId"])
```

#### teamInvites table (NEW)
```typescript
teamInvites: defineTable({
  teamId: v.id("teams"),
  invitedEmail: v.string(),
  inviterUserId: v.id("users"),
  role: v.union(
    v.literal("admin"),
    v.literal("member")
  ),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("expired"),
    v.literal("revoked")
  ),
  token: v.string(),  // secure random token for invite link
  expiresAt: v.number(),
  createdAt: v.number(),
})
  .index("by_team", ["teamId"])
  .index("by_token", ["token"])
  .index("by_email", ["invitedEmail"])
```

#### devices table (NEW)
```typescript
devices: defineTable({
  userId: v.id("users"),
  deviceId: v.string(),      // persistent UUID stored locally
  deviceName: v.string(),    // from OS (e.g., "MacBook Pro")
  deviceType: v.union(
    v.literal("desktop"),
    v.literal("laptop"),
    v.literal("other")
  ),
  platform: v.string(),      // "darwin", "win32", "linux"
  appVersion: v.string(),
  lastSeenAt: v.number(),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_device_id", ["deviceId"])
```

#### Entitlements Type (computed, not stored)
```typescript
interface Entitlements {
  plan: 'free' | 'pro' | 'team';
  scope: 'personal' | 'team';
  teamId?: string;
  status: 'active' | 'trialing' | 'grace' | 'past_due' | 'expired';
  
  // Feature limits
  maxProfiles: number;           // Free: 1, Pro: 10, Team: unlimited
  maxProviderGroups: number;     // Free: 2, Pro: 10, Team: unlimited
  maxDevices: number;            // Free: 1, Pro: 3, Team: 5
  smartRoutingEnabled: boolean;  // Free: false, Pro/Team: true
  analyticsEnabled: boolean;     // Free: 7d, Pro/Team: 90d
  
  // Dates
  currentPeriodEnd?: number;
  gracePeriodEnd?: number;
}
```

### API Design

#### New Convex Queries
```typescript
// entitlements.ts
getEntitlements(userId: Id<"users">) → Entitlements
getTeamEntitlements(teamId: Id<"teams">) → Entitlements

// teams.ts
listUserTeams(userId: Id<"users">) → Team[]
getTeam(teamId: Id<"teams">) → Team | null
listTeamMembers(teamId: Id<"teams">) → TeamMember[]
listTeamInvites(teamId: Id<"teams">) → TeamInvite[]

// devices.ts
listUserDevices(userId: Id<"users">) → Device[]

// dashboard.ts
getDashboardOverview(userId: Id<"users">) → DashboardOverview
getUsageMetrics(userId: Id<"users">, range: DateRange) → UsageMetrics
```

#### New Convex Mutations
```typescript
// teams.ts
createTeam(name: string) → Team
updateTeam(teamId: Id<"teams">, updates: Partial<Team>) → void
deleteTeam(teamId: Id<"teams">) → void
transferOwnership(teamId: Id<"teams">, newOwnerId: Id<"users">) → void

// invites.ts
createInvite(teamId: Id<"teams">, email: string, role: Role) → TeamInvite
acceptInvite(token: string) → void
revokeInvite(inviteId: Id<"teamInvites">) → void
resendInvite(inviteId: Id<"teamInvites">) → void

// teamMembers.ts
updateMemberRole(memberId: Id<"teamMembers">, role: Role) → void
removeMember(memberId: Id<"teamMembers">) → void

// devices.ts
registerDevice(deviceInfo: DeviceInfo) → Device
removeDevice(deviceId: Id<"devices">) → void
```

#### New Convex Actions
```typescript
// stripe.ts (extend existing)
createTeamCheckoutSession(teamId: Id<"teams">, seats: number) → { url: string }
updateTeamSeats(teamId: Id<"teams">, seats: number) → void

// invites.ts
sendInviteEmail(inviteId: Id<"teamInvites">) → void
```

#### New IPC Channels (Desktop App)
```typescript
// Entitlements
ENTITLEMENTS_GET: () => Entitlements
ENTITLEMENTS_SUBSCRIBE: () => void  // start real-time sync

// Devices
DEVICE_REGISTER: (info: DeviceInfo) => Device
DEVICE_GET_INFO: () => DeviceInfo  // from OS

// Billing
BILLING_OPEN_CHECKOUT: (plan: 'pro' | 'team') => void  // opens browser
BILLING_OPEN_PORTAL: () => void  // opens browser
```

#### Web Dashboard Routes
```
/dashboard              → Overview page
/dashboard/usage        → Usage metrics page
/dashboard/billing      → Billing management page
/dashboard/teams        → Teams list page
/dashboard/teams/[id]   → Team detail page
/dashboard/account      → Account settings page
/invite/[token]         → Invite acceptance page
```

---

## Technical Constraints

### Existing Infrastructure
- **Convex backend**: Must use existing auth patterns (`auth.ts`, `stripe.ts`)
- **Stripe integration**: Already configured with webhook handler and customer management
- **Desktop app**: Zustand stores with persist middleware pattern
- **Go backend**: Config sync via `~/.korproxy/config.json` file, not IPC

### Development Constraints
- Use `bun` only, never `npm`
- No Sentry - local logging with 24-hour auto-deletion
- CLIProxyAPI is git submodule - changes need separate PR
- Follow existing IPC patterns with Zod validation

### Schema Constraints
- Existing users table has: `stripeCustomerId`, `subscriptionStatus`, `subscriptionPlan`, `stripeSubscriptionId`
- `subscriptionEvents` table exists for audit trail
- Must add new tables: `teams`, `teamMembers`, `teamInvites`, `devices`

## Dependencies

### External
- Stripe Products/Prices for Free, Pro, Team tiers
- Stripe Billing Portal configuration
- Vercel for web dashboard deployment

### Internal
- Phase C complete (profiles, routing, analytics already working)
- Convex deployed with correct environment variables
- Auth flows working in both desktop app and web

---

## Acceptance Criteria

### Criterion 1: Subscription Checkout
- **Given**: A free user in the desktop app
- **When**: They click "Upgrade to Pro" and complete Stripe Checkout
- **Then**: Their account shows "active" status and premium features unlock within 30 seconds

### Criterion 2: Team Invite Flow
- **Given**: A team owner with available seats
- **When**: They invite a new member via email
- **Then**: The invitee receives an email, clicks the link, and joins the team with correct role

### Criterion 3: Graceful Degradation
- **Given**: A Pro user whose payment fails
- **When**: They open the desktop app
- **Then**: They see a banner about payment issues but can still use Free-tier features

### Criterion 4: Multi-Device Sync
- **Given**: A user logged in on two devices
- **When**: They change a setting on Device A
- **Then**: Device B reflects the change within 5 seconds

### Criterion 5: Web Dashboard Access
- **Given**: A logged-in user
- **When**: They visit the web dashboard
- **Then**: They see their current plan, usage metrics, and billing management options

### Edge Case Scenarios

#### Billing Edge Cases
- **Webhook replay**: Same `stripeEventId` processed twice → no duplicate state changes
- **Checkout abandoned**: User starts checkout but never completes → no subscription created
- **Payment retry**: First payment fails, retry succeeds → status transitions past_due → active
- **Subscription downgrade**: Team → Pro while members exist → block until members removed

#### Team Edge Cases
- **Invite expired**: User clicks 7-day-old invite link → show "invite expired" page with request-new option
- **Seats exhausted**: Admin invites when `seatsUsed == seatsPurchased` → show "upgrade seats" prompt
- **Owner leaves**: Owner tries to leave team → block, require ownership transfer first
- **Duplicate invite**: Invite same email twice → update existing pending invite, don't create new
- **Self-invite**: Owner invites their own email → reject with clear error

#### Device Edge Cases
- **Offline app**: App can't reach Convex for 72+ hours → degrade to Free tier with banner
- **Stale device**: Device not seen in 90 days → auto-remove from device list
- **Max devices**: User at device limit tries new device → show "manage devices" prompt

---

## Implementation Phases

Given the scope, Phase D should be split into sub-phases:

### Phase D1: Subscription Enforcement (Week 1-2)
- Entitlements store in desktop app
- Free tier limits (1 profile, 2 provider groups)
- Graceful degradation for past-due/expired
- Offline grace period
- Upgrade CTA in desktop app

### Phase D2: Team Infrastructure (Week 3-4)
- New Convex tables (teams, teamMembers, teamInvites)
- Team CRUD mutations with RBAC
- Invite flow (create, accept, revoke)
- Team Stripe checkout with seat quantity
- Webhook handling for team subscriptions

### Phase D3: Multi-Device & Dashboard (Week 5-6)
- Devices table and registration
- Device sync via Convex real-time
- Web dashboard pages (Overview, Usage, Billing, Teams, Account)
- Remote device sign-out

---

## Open Questions
- [x] ~~Should team workspaces have separate profiles from personal workspaces?~~ → **No, teams share billing only**
- [ ] What Free tier limits are appropriate (1 profile? 2 provider groups)?
- [ ] Should we support annual billing with discount at launch?
- [ ] How to handle team owner leaving without transferring ownership? → **Block leave, require transfer**

## Research Notes

### Existing Stripe Integration
The codebase already has a comprehensive Stripe integration in `korproxy-backend/convex/stripe.ts`:
- `createCheckoutSession` action with trial support
- `createPortalSession` action for billing management
- `handleWebhook` internal action with signature verification
- Webhook handlers for: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
- Internal mutations for customer ID and subscription status updates

### Existing Schema
Users table already includes:
```typescript
stripeCustomerId: v.optional(v.string()),
subscriptionStatus: v.union("none", "trialing", "active", "past_due", "canceled", "expired", "lifetime"),
subscriptionPlan: v.optional("monthly", "yearly"),
stripeSubscriptionId: v.optional(v.string()),
stripePriceId: v.optional(v.string()),
trialEnd, currentPeriodEnd, cancelAtPeriodEnd
```

### Desktop App Patterns
- Auth store in `korproxy-app/src/stores/authStore.ts` with token persistence
- Subscription sync to main process via `window.korproxy.subscription.setStatus()`
- Profile store syncs to tray via `window.korproxy.tray.syncProfiles()`

## Visuals
- [x] Architecture diagram (included above)
- [ ] Web dashboard wireframes (to be added)
- [ ] Team management flow diagram (to be added)

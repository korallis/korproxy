# Specification: KorProxyV2 Migration

## Goal
Ship the KorProxyV2 desktop app on macOS and Windows while preserving existing user access, subscriptions, and licensing behavior from the current Electron app.

## Tech Stack (Confirmed)
- Language/runtime: C# on .NET 8
- UI framework: Avalonia 11 (desktop)
- App architecture: .NET Generic Host + DI
- Project location: `/Users/leebarry/Development/KorProxyV2/src` (projects `KorProxy`, `KorProxy.Core`, `KorProxy.Infrastructure`)
- Proxy integration: CLIProxyAPI management API client in `KorProxy.Infrastructure/Services/ManagementApiClient.cs`
- Build/publish scripts: `/Users/leebarry/Development/KorProxyV2/scripts/`

## User Stories
- As an existing subscriber, I want to install KorProxyV2 and keep my account, subscription, and entitlements without re-registering so I can keep working immediately.
- As a team owner, I want team entitlements and seat limits to remain accurate after migration so my team access stays consistent.
- As a release engineer, I want tagged releases to build and sign KorProxyV2 artifacts for macOS and Windows so the new app replaces the old pipeline.

## Specific Requirements

**KorProxyV2 app replacement**
- Replace the Electron app with the KorProxyV2 stack while matching critical user-facing behavior (login, proxy status, entitlement display).
- Preserve local proxy routing and CLIProxyAPI integration with equivalent lifecycle controls.
- Ensure the new app uses the existing backend and does not introduce new service dependencies.
- Keep storage of session token and entitlement cache in a durable local store.
- Support one-time import of existing session data if feasible, otherwise re-auth flow only.
- Do not change the backend schemas or endpoints used by the current app.

**Auth and session continuity**
- Continue using Convex session tokens from `korproxy-backend/convex/auth.ts` for login, refresh, and validation.
- Preserve the existing session duration behavior and token refresh semantics.
- Handle first-run auth by either re-auth or import without forcing account resets.
- Ensure admin/lifetime users retain access exactly as today.
- Fail fast on invalid/expired tokens and present a clear re-auth path.

**Subscription and entitlement parity**
- Preserve subscription states: active, trialing, past_due, canceled, expired, lifetime, and team memberships.
- Continue to compute entitlements via `korproxy-backend/convex/entitlements.ts` and sync to the client.
- Maintain grace-period handling for past_due and offline entitlement cache behavior.
- Grace period (past_due): 3 days, matching `GRACE_PERIOD_PAST_DUE_DAYS` in the current app.
- Offline grace: 72 hours since last successful sync, matching `GRACE_PERIOD_OFFLINE_HOURS`.
- Ensure team entitlements override personal plan when team membership is active.
- Keep entitlement limits (profiles, provider groups, devices, smart routing, analytics retention) unchanged.

**License validation parity**
- Re-implement the existing entitlement checks performed by the Electron app to avoid access regressions.
- Sync entitlement status to the proxy/runtime layer for enforcement as done today.
- Block restricted features when entitlements are expired or grace period has ended.

**Device registration and limits**
- Continue device registration via `korproxy-backend/convex/devices.ts` with the same device fields.
- Enforce device limits from entitlements, including team limits when applicable.
- Update device last-seen on app launch and periodic heartbeats (every 24 hours).
- Allow users to remove devices using existing backend actions.

**Billing and Stripe continuity**
- Keep Stripe checkout, portal, and webhook flows unchanged.
- Continue using existing Stripe price IDs and subscription update logic.
- Preserve team billing behavior, including seats purchased/used logic.
- Avoid any changes to subscription status derivation in the backend.

**Auto-update support**
- Provide an auto-update flow compatible with Avalonia/.NET 8 and signed release artifacts.
- Surface update status, download progress, and install actions in the UI.
- Default to user-initiated download with install-on-quit behavior.

**Packaging and signing**
- Ship macOS and Windows builds in the first release of KorProxyV2.
- macOS: produce signed and notarized `.dmg` and `.zip` artifacts.
- Windows: produce a signed installer and a portable `.zip` build.
- Bundle the correct CLIProxyAPI binary per runtime/architecture in each build.

**CI/CD replacement**
- Update GitHub Actions to build and sign KorProxyV2 artifacts on version tags.
- Replace the existing Electron release workflow with the KorProxyV2 pipeline (no parallel releases).
- Maintain tag-triggered release behavior and artifact publishing.
- Do not trigger builds or pushes without explicit user permission.

## Visual Design
No mockups provided.

## Architecture and App Structure
- App bootstrap: `KorProxy/Program.cs` builds a .NET host, configures services, then runs Avalonia app.
- Configuration: `KorProxy/appsettings.json` provides proxy settings (base URL, port, management key).
- Proxy lifecycle: `KorProxy/Services/ProxyHostedService.cs` + `KorProxy.Infrastructure/Services/ProxySupervisor.cs` manage CLIProxyAPI.
- Management API client: `KorProxy.Infrastructure/Services/ManagementApiClient.cs` handles config, auth, usage, models, logs.
- Local storage: store session token + entitlement cache in OS secure storage.
  - Windows: DPAPI via `System.Security.Cryptography.ProtectedData`.
  - macOS: Keychain via native Security APIs (or a vetted .NET wrapper).
  - If secure storage is unavailable, fall back to an encrypted local file with a per-device key.
- IPC replacement: use in-process services and view-model bindings; no Electron IPC layer.

## Migration Strategy
- Distribution: existing users download the new app; no in-place Electron auto-update to the new stack.
- First run: prompt to re-auth and pull entitlements; optional import of stored session token if feasible.
- Local data: if the storage format differs, provide a one-time import path; otherwise re-auth only.
- Old app: deprecate Electron releases and direct users to KorProxyV2.

## Windows Packaging Decision
- Installer: NSIS-based signed installer (.exe) with Program Files install and Add/Remove Programs entry.
- Portable: keep the signed portable zip from `scripts/package-windows.sh`.
- Update strategy: in-app updater targets installed builds; portable builds show update available and link to download.

## Auto-Update Decision
- Use Velopack for .NET desktop updates (supports Windows + macOS) and signed artifacts.
- Update feed: GitHub Releases for tagged versions.
- Signature verification required before install.

## Existing Code to Leverage

**korproxy-backend/convex/auth.ts**
- Session token creation, validation, and refresh behaviors should remain unchanged.
- Preserve user role and subscription fields returned by `me`.

**korproxy-backend/convex/stripe.ts and korproxy-backend/convex/subscriptions.ts**
- Reuse checkout, portal, and webhook update logic without changes.
- Keep status normalization and plan mapping for subscription updates.

**korproxy-backend/convex/entitlements.ts**
- Use the same entitlement computation, plan limits, and grace-period logic.
- Preserve team-based entitlement resolution and limits.

**korproxy-backend/convex/devices.ts**
- Keep device registration, list, remove, and update-last-seen behavior.
- Use identical device metadata fields for consistency across installs.

**korproxy-app/src/stores/authStore.ts and korproxy-app/src/stores/entitlementStore.ts**
- Mirror token persistence, subscription sync, and entitlement syncing semantics.
- Preserve offline grace handling and client-side entitlement mapping.

## Out of Scope
- Changing Stripe pricing, products, or webhook behavior.
- Modifying Convex schemas or existing backend endpoints.
- Adding Linux release artifacts in the initial KorProxyV2 launch.
- Reworking subscription status rules or entitlement limit values.
- Introducing new licensing tiers or new billing flows.
- Redesigning the marketing website or dashboard.
- Creating new proxy features unrelated to migration.
- Parallel Electron and KorProxyV2 release pipelines.

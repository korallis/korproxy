# KorProxyV2 Migration Requirements

## Goals
- Replace the Electron app with the KorProxyV2 stack while preserving existing user access.
- Ship macOS and Windows together in the first release of the new app.
- Keep Stripe subscription behavior and Convex auth/entitlements unchanged.
- Support auto-update in the new app.
- Replace the current CI/release pipeline with KorProxyV2 builds (no parallel releases).

## User and Account Continuity
- Existing customers must not lose access or be forced to reset accounts.
- Allow a new install with one-time import or re-auth as needed.
- Licensing/entitlement checks must work for active, trial, past_due, lifetime, and team users.
- Continue using Convex session tokens and existing backend functions.

## Billing and Entitlements
- Stripe integration remains unchanged (checkout, portal, webhooks, team billing).
- Entitlements must continue to be computed via Convex and synced to the client.
- Device registration and limits continue to be enforced via Convex.

## Platform and Packaging
- macOS and Windows builds must be code-signed from the start.
- Windows must be fully supported (installer/portable packaging as decided in spec).
- CLIProxyAPI binaries must be bundled per runtime.

## CI/CD Constraints
- Update GitHub Actions to build/sign KorProxyV2 artifacts on version tags.
- Do not push or trigger builds without explicit user permission.

## Existing System References
- Convex auth and sessions: `korproxy-backend/convex/auth.ts`
- Stripe + subscriptions: `korproxy-backend/convex/stripe.ts`, `korproxy-backend/convex/subscriptions.ts`
- Entitlements: `korproxy-backend/convex/entitlements.ts`
- Devices: `korproxy-backend/convex/devices.ts`
- Current app entitlement syncing: `korproxy-app/src/stores/authStore.ts`, `korproxy-app/src/stores/entitlementStore.ts`

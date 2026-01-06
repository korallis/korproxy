Goal: Replace the current Electron app with KorProxyV2’s simpler stack while preserving existing subscriptions/accounts and licensing checks; deliver macOS + Windows builds and update CI/signing accordingly.

Scope
- Replatform desktop app to KorProxyV2 stack (match behavior/UI/UX exactly).
- Port subscription/account flows and licensing checks from Electron app.
- Ensure backward-compatible auth and billing (existing users keep access).
- Update GitHub Actions/build/signing to target new app (macOS + Windows).

Proposed approach
1) Discovery & gap analysis
- Read KorProxyV2 structure, runtime, and build process.
- Map current Electron app flows: auth, subscription sync, licensing validation, update checks, IPC/daemon interactions.
- Identify shared backend dependencies (Convex endpoints, licensing service, device binding).

2) Architecture mapping
- Define how KorProxyV2 handles: local proxy lifecycle, UI shell, system tray/menus, auto-start, updates, logging.
- Decide equivalent integration points for licensing checks and account session persistence.

3) Feature porting
- Implement licensing/auth in KorProxyV2 stack using existing endpoints and schemas.
- Migrate UI flows for login, subscription status, error states.
- Preserve data storage paths or add migration if storage layout differs.

4) Cross-platform enablement
- Bring Windows support to KorProxyV2 (build toolchain, installers, runtime checks).
- Add platform-specific behaviors (startup, tray, auto-update, proxy permissions).

5) CI/CD & signing
- Replace Electron workflows with KorProxyV2 build/sign steps.
- Maintain macOS notarization and Windows EV signing steps.
- Update release artifacts and tag triggers.

6) Validation
- Smoke tests: login, subscription restore, license check, proxy routing.
- Upgrade path test: existing users install new app and retain access.

Open questions
- What is KorProxyV2 stack (language/framework, packaging, updater)?
- Where is KorProxyV2 source structure and build commands?
- How does KorProxyV2 persist user state/licenses today?
- Any UI/feature differences to retain or exclude from Electron app?
- Which backend endpoints/services are authoritative for licensing?

If you approve this plan, I’ll proceed to inspect KorProxyV2 and the existing Electron app to produce a concrete migration task list and then implement.
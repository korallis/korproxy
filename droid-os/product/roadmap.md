# Product Roadmap

1. [ ] Account Login And Existing Account Linking — Implement KorProxyV2 sign-in that connects to existing KorProxy accounts so current users authenticate without re-registering, and verify account identity matches prior app records. `[M]`
2. [ ] Subscription Sync And Entitlements — Sync subscription status from the existing backend and display entitlements in-app; verify paid users retain access and expired users are correctly restricted. `[M]`
3. [ ] License Validation Parity — Re-implement the Electron app’s licensing checks in KorProxyV2 and validate the same success/failure outcomes against real licenses. `[M]`
4. [ ] Local Proxy Routing With Provider Accounts — Integrate CLIProxyAPI runtime and confirm the local proxy works with supported AI tools, including start/stop controls and status reporting. `[M]`
5. [ ] Tray And Core Controls — Add tray menu actions for proxy status, quick start/stop, and settings access; verify behavior across app restarts. `[S]`
6. [ ] Cross-Platform Installers And Windows Support — Produce macOS and Windows installers with correct runtime bundling and app metadata; validate clean install, upgrade, and uninstall flows. `[L]`
7. [ ] GitHub Actions Build And Signing For KorProxyV2 — Update CI to build, sign, and publish KorProxyV2 artifacts on version tags, matching the existing release flow. `[M]`
8. [ ] Auto-Update Delivery — Add an auto-update mechanism that consumes release artifacts and verifies signatures before applying updates. `[M]`

> Notes
> - Order items by technical dependencies and product architecture
> - Each item should represent an end-to-end (frontend + backend) functional and testable feature

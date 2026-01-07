# Changelog

This changelog is written for **users** (what changed, what’s new, what’s fixed).  
Starting **2025‑12‑19**, KorProxy began a major desktop rewrite from **Electron** to a native **.NET 8 + Avalonia 11** app (“KorProxyV2”). This file tracks changes from that rewrite onward.

For Electron-era releases, see git tags `v1.0.1` through `v1.0.25`.

Format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2.2.1] — 2026‑01‑07

### Fixed
- **Login reliability**: Prevented login failures for some accounts caused by invalid subscription timestamps.

### Added
- **Admin maintenance**: Added an admin repair operation to clear invalid subscription date fields.

## [2.2.0] — 2026‑01‑07

### Added
- **In-app log viewer**: View proxy logs with level filtering and search directly in the app.
- **Copy-to-clipboard**: Click to copy the proxy endpoint URL from the dashboard.
- **Result<T> type**: Functional error handling with `Map`, `Bind`, and `Match` operations.
- **46 new unit tests**: Comprehensive coverage for `UsageAggregator`, `ProxyCircuitBreaker`, and `Result<T>` (91 total tests passing).

### Changed
- **Architecture refactoring**:
  - Extracted `IAppLifetimeService` from `App.axaml.cs` for cleaner lifecycle management.
  - Split `ProxySupervisor` into `IProxyProcessRunner` + `IProxyCircuitBreaker` for better separation of concerns.
  - Added `IProxyConfigStore` with YamlDotNet for type-safe YAML config management.
  - Extracted `IUsageAggregator` for date range calculations.
  - Created `IUserNotificationService` for centralized UI notifications.
  - Created `IClipboardService` for consistent clipboard operations.
- **Adaptive dashboard polling**: 2s/5s/15s intervals based on proxy state and API health.

### Fixed
- **Usage statistics tracking**: Auto-enables on proxy start (was not working previously).
- **Management key mismatch**: Skip bcrypt hashes in config migration.
- **Settings edit warning**: Shows "Start proxy to edit settings" when proxy is stopped.
- **Dashboard disconnected state**: Shows "Disconnected" indicator when API is unreachable.

### Security
- **Cryptographically secure ManagementKey**: Generated using secure random on first run.
- **OS secure storage**: Management key stored in Keychain (macOS), DPAPI (Windows), or encrypted file (Linux).

## [2.1.7] — 2026‑01‑07

### Fixed
- **Port consistency**: Standardized proxy port to 1337 and management API to 8317 across all UI and configuration.
- **Dynamic dashboard URL binding**: Dashboard now correctly binds to the configured management API port.
- **Circuit breaker reset**: Properly resets on successful proxy operations.
- **Settings persistence**: Improved error handling for settings save/load operations.
- **Proxy restart reliability**: Fixed issues with proxy restart after configuration changes.

## [2.1.6] — 2026‑01‑07

### Fixed
- Port display corrections in UI (showing correct 1337 proxy port vs 8317 management port).

## [2.1.5] — 2026‑01‑06

### Fixed
- Corrected Convex deployment URL configuration.

## [2.1.3] — 2026‑01‑06

### Fixed
- Convex deployment URL and version bump.

## [2.1.2] — 2026‑01‑06

### Fixed
- **macOS DMG notarization**: Stabilized the notarization process for macOS releases.

## [2.1.1] — 2026‑01‑06

### Fixed
- **Windows CLIProxyAPI binary**: Now correctly ships in release artifacts.

## [2.1.0] — 2026‑01‑06

### Added
- **GitHub-backed support tickets**: Submit support requests directly from the app.
- **Providers UI**: View and manage AI provider configurations.
- **Password change functionality**: Change password for logged-in users.
- **Forgot password flow**: Reset password from both website and desktop app.
- **Team discounted seats billing**: Support for team billing with seat-based discounts.

### Changed
- Refreshed app icons across all platforms.

### Fixed
- Admin logs server error prevention in Convex backend.

## [2.0.2] — 2026‑01‑06

### Fixed
- **macOS launch**: Added the required Hardened Runtime entitlements for .NET (JIT), fixing macOS builds that wouldn’t open and failed with CoreCLR initialization errors.
- **App icons (macOS + Windows)**: Restored proper `.icns`/`.ico` assets so both platforms display the correct KorProxy icon.
- **Windows proxy start**: Fixed bundled proxy binary discovery (now resolves `runtimes/<rid>/native/cliproxy[.exe]`), and surfaced the real underlying error message instead of a generic “Error”.

## [2.0.1] — 2026‑01‑06

### Fixed
- **Windows release packaging**: CI now reliably finds `makensis` after installing NSIS, so the signed Windows installer is produced during GitHub Releases.

## [2.0.0] — 2026‑01‑06

### Added
- **Native desktop app rewrite (Electron → .NET/Avalonia)**:
  - Faster startup and lower overhead compared to the Electron version.
  - Native-feeling UI built with Avalonia, using MVVM architecture.
- **Sign-in, sessions, and subscription enforcement**:
  - Sign in to your KorProxy account and keep sessions persisted across restarts.
  - Subscription/entitlement checks gate proxy start (prevents running when not entitled).
  - Grace periods supported:
    - **Past due** grace.
    - **Offline** grace.
  - Team entitlements override personal plans when applicable.
- **Device management (for account + subscription rules)**:
  - Devices are registered per installation.
  - Device limits enforced per plan (including team overrides).
  - Background heartbeat to keep device “last seen” current.
- **Proxy lifecycle management**:
  - Start/stop the bundled CLI proxy reliably.
  - Health monitoring with automatic recovery.
  - Circuit breaker behavior after repeated failures to prevent restart loops.
- **Auto-updates**:
  - Update checking and download/install flow via GitHub Releases (Velopack backend).
  - Portable build handling with clear guidance when auto-install isn’t possible.
- **Core app screens (UI parity effort)**:
  - Auth flows (login/register/onboarding).
  - Dashboard and core navigation shell.
  - Accounts / models / logs / integrations / settings screens.

### Changed
- **Desktop experience**:
  - KorProxy is now a native .NET desktop app (Avalonia) instead of Electron.
- **macOS window behavior (tray-style)**:
  - Clicking the **red close button** hides the window (app keeps running).
  - Clicking the **dock icon** restores the main window.

### Fixed
- **macOS quit/hang behavior**:
  - Dock “Quit” now properly exits instead of appearing to do nothing.
  - Clicking the dock icon after closing the window now reliably re-opens the app window.

### Known limitations
- **Some UI/UX validation is manual**: core logic is unit-tested, but full end-to-end UI verification still requires hands-on testing across macOS/Windows.

## 2025‑12‑19 — KorProxyV2 rewrite begins (Electron → .NET/Avalonia)

### Highlights
- Began the transition to a native desktop stack with .NET 8 + Avalonia 11.
- Implemented core product foundations:
  - Auth/session persistence
  - Subscription/entitlement enforcement + grace periods
  - Device registration + limits + heartbeat
  - Proxy lifecycle supervisor + health monitoring
  - Auto-update state machine


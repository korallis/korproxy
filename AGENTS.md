<coding_guidelines>
# KorProxy Development Guide

## Overview
KorProxy is a desktop application that acts as a local AI gateway, allowing users to use their existing AI subscriptions (Claude Pro, ChatGPT Plus, Google AI) with AI coding tools like Cursor, Cline, Windsurf, and others. It runs a local proxy server on port 1337 that handles OAuth authentication and routes requests to the appropriate AI providers.

## Project Structure
```
KorProxy/
├── src/                   # .NET/Avalonia desktop app
│   ├── KorProxy/          # Main Avalonia UI application
│   ├── KorProxy.Core/     # Domain models and service interfaces
│   ├── KorProxy.Infrastructure/  # Service implementations
│   └── KorProxy.Tests/    # Unit tests
├── korproxy-web/          # Next.js marketing website & dashboard
├── korproxy-backend/      # Convex backend for auth & subscriptions
├── CLIProxyAPI/           # Go proxy server binary (git submodule)
├── scripts/               # Build and packaging scripts
├── runtimes/              # Platform-specific native binaries
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD workflows
```

### src/KorProxy/ (Main Avalonia App)
- **Stack:** .NET 8, Avalonia 11, CommunityToolkit.Mvvm, Microsoft.Extensions.DI
- **Views:** `Views/*.axaml` - XAML UI definitions
- **ViewModels:** `ViewModels/*.cs` - MVVM view models
- **Services:** `Services/*.cs` - App-specific services (navigation, proxy hosting)
- **Entry Point:** `Program.cs` - Application startup and DI configuration

### src/KorProxy.Core/ (Domain Layer)
- **Models:** `Models/*.cs` - Domain entities (AuthSession, ProxyState, LogEntry, etc.)
- **Services:** `Services/I*.cs` - Service interfaces (IAuthService, IProxySupervisor, etc.)

### src/KorProxy.Infrastructure/ (Infrastructure Layer)
- **Services:** `Services/*.cs` - Concrete service implementations
- **Key Services:**
  - `AuthService` - OAuth authentication with Convex
  - `ProxySupervisor` - CLIProxyAPI process management
  - `SecureStorage` - Cross-platform credential storage
  - `ManagementApiClient` - Proxy management API client
  - `DeviceService` - Device identity and heartbeat

### korproxy-web/ (Marketing Website & Dashboard)
- **Stack:** Next.js 16, React 18, TypeScript, TailwindCSS, Framer Motion
- **Deployment:** Vercel (auto-deploys from main branch)
- **Routes:**
  - `/` - Marketing homepage with glassmorphism styling
  - `/guides/*` - Public setup guides (no auth required)
  - `/dashboard/*` - Authenticated user dashboard
  - `/login`, `/register` - Auth pages via Convex

### korproxy-backend/ (Convex Backend)
- **Stack:** Convex (serverless backend)
- **Functions:** `convex/` - queries, mutations, actions
- **Schema:** `convex/schema.ts` - database schema
- **Auth:** Convex Auth with email/password

### CLIProxyAPI/ (Go Proxy Server)
- **Note:** Git submodule - do not modify directly
- **Binary:** Compiled per-platform during build
- **Port:** Runs on localhost:1337 (management API on 8317)

## Commands

### .NET Desktop App
```bash
dotnet restore                           # Restore NuGet packages
dotnet build                             # Build all projects
dotnet run --project src/KorProxy        # Run the app
dotnet test                              # Run unit tests
dotnet publish src/KorProxy -c Release   # Publish for current platform
```

### Build Scripts
```bash
./scripts/publish.sh osx-arm64           # Publish for macOS ARM64
./scripts/publish.sh osx-x64             # Publish for macOS Intel
./scripts/publish.sh win-x64             # Publish for Windows
./scripts/publish.sh linux-x64           # Publish for Linux
./scripts/bundle-macos.sh arm64          # Create macOS .app bundle
./scripts/create-dmg.sh arm64            # Create macOS DMG installer
```

### korproxy-web/
```bash
bun install
bun run dev              # Start Next.js dev server
bun run build            # Production build
bun run lint             # ESLint
vercel --prod            # Deploy to production
```

### korproxy-backend/
```bash
bun install
bun run dev              # Start Convex dev server (syncs schema/functions)
bun run deploy           # Deploy to Convex production
bun run codegen          # Generate Convex types
```

## CI/CD & Releases

### GitHub Actions Workflows
- **`.github/workflows/build.yml`** - Builds & releases on version tags (v*)

### Release Process
1. Update version in `src/KorProxy/KorProxy.csproj`
2. Commit: `git add -A && git commit -m "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push origin vX.Y.Z`
5. Build workflow creates GitHub Release with all platform installers

### Build Artifacts
- **macOS:** `.dmg` and `.zip` (arm64 + x64), signed & notarized
- **Windows:** `.exe` installer (NSIS) and portable `.zip`, signed with SSL.com
- **Linux:** `.tar.gz` (x64)

## Code Signing

### macOS (Apple Developer)
- **Certificate:** Developer ID Application certificate
- **Notarization:** Apple notary service
- **Secrets Required:**
  - `APPLE_ID` - Apple Developer email
  - `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password
  - `APPLE_TEAM_ID` - Team ID
  - `CSC_LINK` - Base64-encoded .p12 certificate
  - `CSC_KEY_PASSWORD` - Certificate password

### Windows (SSL.com eSigner EV Certificate)
- **Method:** SSL.com eSigner cloud signing via GitHub Action
- **Action:** `sslcom/esigner-codesign@develop`
- **Secrets Required:**
  - `ES_USERNAME` - SSL.com account email
  - `ES_PASSWORD` - SSL.com account password
  - `ES_CREDENTIAL_ID` - eSigner credential ID
  - `ES_TOTP_SECRET` - TOTP secret for 2FA

## Code Style

### C# / .NET
- Target framework: .NET 8.0
- Nullable reference types enabled
- Use `CommunityToolkit.Mvvm` for MVVM patterns ([ObservableProperty], [RelayCommand])
- Dependency injection via `Microsoft.Extensions.DependencyInjection`
- Async/await patterns with CancellationToken support

### Avalonia XAML
- Use `x:DataType` for compiled bindings
- Theme resources defined in `App.axaml`
- Design system: "Midnight Aurora" dark theme with teal accent (#00D4AA)
- Glassmorphism styling with `KorGlassBase`, `KorGlassBorder` colors

### Project Organization
- **Core:** Domain models and interfaces only (no external dependencies)
- **Infrastructure:** Service implementations, API clients, platform-specific code
- **App:** Views, ViewModels, and app-level orchestration

## Supported AI Models

Models must match CLIProxyAPI registry. See `CLIProxyAPI/internal/registry/model_definitions.go`.

### Claude (Anthropic)
- `claude-opus-4-5-20251101` - Premium flagship (thinking: 1024-100000)
- `claude-sonnet-4-5-20250929` - Balanced (thinking: 1024-100000)
- `claude-haiku-4-5-20251001` - Fast responses (no thinking)

### Codex (OpenAI)
- `gpt-5.1-codex-max` - Max reasoning (levels: low, medium, high, xhigh)
- `gpt-5.1-codex` - Standard (levels: low, medium, high)
- `gpt-5.1-codex-mini` - Faster/cheaper (levels: low, medium, high)
- `gpt-5-codex` - Legacy (levels: low, medium, high)
- `gpt-5` - Base model (levels: minimal, low, medium, high)

### Gemini (Google)
- `gemini-3-pro-preview` - Latest flagship (thinking: 128-32768)
- `gemini-3-pro-image-preview` - With image generation (thinking: 128-32768)
- `gemini-2.5-pro` - Stable flagship (thinking: 128-32768)
- `gemini-2.5-flash` - Fast (thinking: 0-24576)
- `gemini-2.5-flash-lite` - Fastest/cheapest (thinking: 0-24576)

## Convex Reference
**IMPORTANT:** When creating or modifying any Convex code, ALWAYS read [docs/convex-llms-reference.md](docs/convex-llms-reference.md) first.
Full docs: https://docs.convex.dev/llms.txt

## Architecture Notes

### Proxy Lifecycle
1. App starts → `ProxyHostedService` checks for auto-start
2. User signs in → `SessionStore` persists JWT tokens
3. Proxy starts → `ProxySupervisor` spawns CLIProxyAPI process
4. Management API → `ManagementApiClient` communicates on port 8317
5. AI requests → CLIProxyAPI handles on port 1337

### Secure Storage
- **macOS:** Keychain via `security` command
- **Windows:** DPAPI (`ProtectedData`)
- **Linux:** AES-encrypted file with machine-derived key

### Device Identity
- Unique device ID generated per installation
- Heartbeat service reports to Convex backend
- Enables multi-device management in dashboard

## Troubleshooting

### App Won't Start
- Check .NET 8 SDK is installed: `dotnet --version`
- Verify all NuGet packages restored: `dotnet restore`
- Check console output for exceptions

### Proxy Connection Refused
- Ensure CLIProxyAPI binary exists in `runtimes/{rid}/native/`
- Check port 1337 is not in use
- Verify management API on port 8317 is responding

### Build Fails on macOS
- Install Xcode command line tools: `xcode-select --install`
- For code signing, ensure certificate is in keychain

### Tests Fail
- Run `dotnet test --logger "console;verbosity=detailed"` for more info
- Check that mock services are properly configured
</coding_guidelines>

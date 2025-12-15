# KorProxy Development Guide

## Overview
KorProxy is a desktop application that acts as a local AI gateway, allowing users to use their existing AI subscriptions (Claude Pro, ChatGPT Plus, Google AI) with AI coding tools like Cursor, Cline, Windsurf, and others. It runs a local proxy server on port 1337 that handles OAuth authentication and routes requests to the appropriate AI providers.

## Project Structure
```
KorProxy/
├── korproxy-app/          # Electron + React + TypeScript desktop app
├── korproxy-web/          # Next.js marketing website & dashboard
├── korproxy-backend/      # Convex backend for auth & subscriptions
├── CLIProxyAPI/           # Go proxy server binary (git submodule)
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD workflows
```

### korproxy-app/ (Electron Desktop App)
- **Stack:** Electron 33, React 18, TypeScript, Vite, Zustand, TailwindCSS, Radix UI
- **Main Process:** `electron/main/` - app lifecycle, tray, IPC handlers
- **Preload:** `electron/preload/index.cjs` - bridge between main/renderer (CommonJS required)
- **Renderer:** `src/` - React UI components and pages
- **Config:** `electron-builder.yml` - build and signing configuration

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
- **Port:** Runs on localhost:1337

## Commands

### korproxy-app/
```bash
npm run dev              # Start Vite dev server + Electron
npm run typecheck        # TypeScript check
npm run lint             # ESLint
npm run test             # Run Vitest tests
npm run package:mac      # Build macOS (signed/notarized if env vars set)
npm run package:win      # Build Windows (unsigned locally)
npm run package:linux    # Build Linux
```

### korproxy-web/
```bash
npm run dev              # Start Next.js dev server
npm run build            # Production build
npm run lint             # ESLint
vercel --prod            # Deploy to production
```

### korproxy-backend/
```bash
npm run dev              # Start Convex dev server (syncs schema/functions)
npm run deploy           # Deploy to Convex production
```

## CI/CD & Releases

### GitHub Actions Workflows
- **`.github/workflows/ci.yml`** - Runs on all pushes: lint, typecheck, tests
- **`.github/workflows/build.yml`** - Runs on version tags (v*): builds & releases

### Release Process
1. Bump version: `cd korproxy-app && npm version patch`
2. Commit: `git add -A && git commit -m "chore: bump version to X.Y.Z"`
3. Tag: `git tag vX.Y.Z`
4. Push: `git push && git push origin vX.Y.Z`
5. Build workflow creates GitHub Release with all platform installers

### Build Artifacts
- **macOS:** `.dmg` and `.zip` (arm64 + x64), signed & notarized
- **Windows:** `.exe` installer and `.zip` (x64), signed with SSL.com
- **Linux:** `.AppImage` and `.deb` (x64)

## Code Signing

### macOS (Apple Developer)
- **Certificate:** Developer ID Application certificate
- **Notarization:** Apple notary service via `notarize.cjs`
- **Secrets Required:**
  - `APPLE_ID` - Apple Developer email
  - `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password
  - `APPLE_TEAM_ID` - Team ID
  - `CSC_LINK` - Base64-encoded .p12 certificate
  - `CSC_KEY_PASSWORD` - Certificate password

### Windows (SSL.com eSigner EV Certificate)
- **Method:** SSL.com eSigner cloud signing via GitHub Action
- **Action:** `sslcom/esigner-codesign@develop`
- **Process:** Signs the final `.exe` installer after electron-builder creates it
- **Secrets Required:**
  - `ES_USERNAME` - SSL.com account email
  - `ES_PASSWORD` - SSL.com account password
  - `ES_CREDENTIAL_ID` - eSigner credential ID
  - `ES_TOTP_SECRET` - TOTP secret for 2FA

**Important:** Windows signing happens AFTER the build, not during. The `electron-builder.yml` does NOT use a custom sign script - signing is handled by the GitHub Action.

## Code Style

### TypeScript
- Strict mode enabled, ESM modules (`"type": "module"`)
- Prefer absolute imports with `@/` alias
- Use Zod for runtime validation

### React
- Components in `src/components/`
- Pages in `src/pages/` (app) or `src/app/` (web)
- Hooks in `src/hooks/`
- State management: Zustand (app), React Context (web)

### Electron
- Main process: `electron/main/` (ESM)
- Preload scripts: Must be `.cjs` (CommonJS) - Electron requirement
- IPC: Type-safe handlers in `electron/main/ipc.ts`

### Styling
- TailwindCSS with custom theme
- CSS variables for theming (dark mode default)
- Glassmorphism effects using `glass-card` utility class

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

## Troubleshooting

### Windows Build "Unknown Publisher"
- Ensure `ES_*` secrets are set in GitHub repository settings
- Check that `sslcom/esigner-codesign` action runs successfully
- The signing step must complete AFTER `npm run package:win`

### macOS Notarization Fails
- Verify Apple credentials are correct
- Check `notarize.cjs` script for errors
- Ensure app is signed before notarization

### Electron Preload Script Errors
- Preload scripts MUST use `.cjs` extension
- Cannot use ESM imports in preload
- Use `require()` syntax in preload scripts

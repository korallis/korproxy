# KorProxy Development Guide

## Project Structure
- `korproxy-app/` - Electron + React + TypeScript desktop app (Vite, Zustand, TailwindCSS, Radix UI)
- `korproxy-backend/` - Convex backend for auth & subscriptions
- `CLIProxyAPI/` - Go proxy server binary (submodule, not modified directly)

## Commands (run from korproxy-app/)
- `npm run dev` - Start Vite dev server + Electron
- `npm run typecheck` - TypeScript check
- `npm run lint` - ESLint
- `npm run test` - Run Vitest tests
- `npm run test -- path/to/file.test.ts` - Run single test file
- `npm run package:mac` - Build macOS installer (signed if env vars set)

## Commands (run from korproxy-backend/)
- `npm run dev` - Start Convex dev server (syncs schema/functions)
- `npm run deploy` - Deploy to production

## Code Style
- TypeScript strict mode, ESM modules (`"type": "module"`)
- React components in `src/components/`, pages in `src/pages/`, hooks in `src/hooks/`
- Electron main process in `electron/main/`, preload in `electron/preload/index.cjs` (CommonJS)
- Use Zustand for state, TanStack Query for async data, Zod for validation
- Convex functions: queries/mutations in `convex/`, use `v` validators from `convex/values`
- Prefer absolute imports with `@/` alias for src files

## Convex Reference
**IMPORTANT:** When creating or modifying any Convex code, ALWAYS read [docs/convex-llms-reference.md](docs/convex-llms-reference.md) first.
Full docs: https://docs.convex.dev/llms.txt

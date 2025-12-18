# Specification: Phase B - Delightful Onboarding & UX

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.1

## 1. Overview

### 1.1 Summary
Phase B transforms KorProxy into a delightful first-experience by adding a guided onboarding wizard, polished OAuth flows with clear error handling, refined dark/light theming, and public setup guides. The focus is on reducing friction for new users while maintaining the professional aesthetic developers expect.

### 1.2 Goals
- **Fast Setup**: New users can connect a provider and test within 7 minutes
- **Clear Errors**: OAuth failures have actionable, human-readable messages
- **Polish**: Smooth animations and theme support create a premium feel
- **Self-Service**: Public guides reduce support burden

### 1.3 Non-Goals
- Per-provider routing rules (Phase C)
- Multi-account load balancing (Phase C)
- Team features or billing (Phase D)
- In-app telemetry/analytics (privacy-first approach)

---

## 2. User Stories

### Primary
1. **As a** new user, **I want** a step-by-step wizard on first launch, **so that** I can start using KorProxy without reading documentation.
2. **As a** developer, **I want** clear error messages during OAuth, **so that** I can fix issues myself without contacting support.
3. **As a** user, **I want** dark and light theme options, **so that** the app matches my preferences and reduces eye strain.

### Secondary
1. **As a** new user, **I want** to test my connection at the end of onboarding, **so that** I know everything is working.
2. **As a** returning user, **I want** to skip onboarding, **so that** I can get straight to work.
3. **As a** troubleshooting user, **I want** web-based setup guides, **so that** I can follow along in a browser.

---

## 3. Requirements

### 3.1 Functional Requirements

#### Onboarding Wizard (`spec: onboarding-wizard`)

| ID | Requirement | Priority |
|----|-------------|----------|
| OW1 | First-run detection flag persisted in localStorage | P0 |
| OW2 | 6-step wizard: Welcome → Providers → Connect → Tools → Test → Done | P0 |
| OW3 | Progress indicator showing "Step X of 6" | P0 |
| OW4 | Back navigation between steps | P0 |
| OW5 | Skip button available on every step | P0 |
| OW6 | State preserved if user closes/reopens wizard | P0 |
| OW7 | Modal overlay with backdrop blur (not full-page) | P0 |
| OW8 | Keyboard navigation: Tab, Enter, Escape to close | P1 |

#### Auth UX (`spec: auth-ux`)

| ID | Requirement | Priority |
|----|-------------|----------|
| AU1 | Loading state with provider logo during OAuth | P0 |
| AU2 | Success state: Green badge, "Connected", token expiry | P0 |
| AU3 | Error mapping to human-readable messages (see 4.2) | P0 |
| AU4 | Retry button for failed connections | P0 |
| AU5 | Auto-refresh tokens 5 min before expiry | P0 |
| AU6 | Manual "Refresh Token" button per provider | P1 |
| AU7 | Disconnect confirmation modal | P1 |
| AU8 | Token expiry countdown in provider card | P1 |

#### Theming (`spec: theming`)

| ID | Requirement | Priority |
|----|-------------|----------|
| TH1 | Three modes: Dark, Light, System | P0 |
| TH2 | Theme toggle in Settings (already exists) | P0 |
| TH3 | Compact theme toggle in title bar | P1 |
| TH4 | No flash of wrong theme on app load | P0 |
| TH5 | Smooth 200ms transition on theme change | P1 |
| TH6 | Sync theme to Electron main process for native UI | P1 |

#### UI Polish (`spec: ui-polish`)

| ID | Requirement | Priority |
|----|-------------|----------|
| UP1 | Page transitions: slide + fade (300ms) | P1 |
| UP2 | Button hover/tap micro-interactions | P1 |
| UP3 | Loading skeletons for async content | P1 |
| UP4 | Toast animations on appear/dismiss | P1 |
| UP5 | Health status pulse animation | P1 |
| UP6 | Reduced motion support (prefers-reduced-motion) | P0 |

#### Setup Guides (`spec: setup-guides`)

| ID | Requirement | Priority |
|----|-------------|----------|
| SG1 | `/guides/cline-setup` page on korproxy-web | P1 |
| SG2 | `/guides/continue-setup` page on korproxy-web | P1 |
| SG3 | `/guides/troubleshooting` page | P1 |
| SG4 | Deep links from app to web guides | P1 |
| SG5 | SEO meta tags and OpenGraph images | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Onboarding wizard render time | < 100ms |
| NFR2 | Theme toggle apply time | < 50ms |
| NFR3 | Page transition duration | < 300ms |
| NFR4 | OAuth callback processing | < 500ms |
| NFR5 | Time to first proxied request | < 7 minutes |
| NFR6 | Onboarding completion rate | > 75% |
| NFR7 | Onboarding drop-off rate | < 10% at provider step |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     KorProxy Desktop App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Electron Main Process                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │AuthManager  │  │ThemeManager │  │   SettingsStore     │ │ │
│  │  │ (existing)  │  │   (NEW)     │  │     (existing)      │ │ │
│  │  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘ │ │
│  │         │                │                                  │ │
│  │  ┌──────┴────────────────┴──────────────────────────────┐  │ │
│  │  │                  IPC Handlers                         │  │ │
│  │  │  AUTH_* (existing)                                    │  │ │
│  │  │  THEME_SET / THEME_GET (new)                         │  │ │
│  │  │  ONBOARDING_STATE_GET / SET (new)                    │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              ▲                                  │
│                              │ IPC                              │
│                              ▼                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Electron Renderer (React)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │OnboardWizard│  │ AuthUX      │  │ ThemeProvider       │ │ │
│  │  │   (NEW)     │  │  (ENHANCED) │  │   (ENHANCED)        │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │          PageTransitionProvider (NEW)                │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Deep links
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    korproxy-web (Next.js)                       │
│  /guides/cline-setup                                            │
│  /guides/continue-setup                                         │
│  /guides/troubleshooting                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

**OnboardingState** (new interface):
```typescript
interface OnboardingState {
  completed: boolean           // True after wizard finishes or skipped
  currentStep: number          // 0-5 for persistence on close
  selectedProviders: Provider[] // Providers user chose in step 2
  selectedTools: ToolId[]      // Tools user chose in step 4
  startedAt?: string           // ISO timestamp for analytics
  completedAt?: string         // ISO timestamp
}
```

**OnboardingStep** (new enum):
```typescript
enum OnboardingStep {
  WELCOME = 0,      // Value proposition, start button
  PROVIDERS = 1,    // Select which AI providers to connect
  CONNECT = 2,      // OAuth flow for selected providers
  TOOLS = 3,        // Select coding tools to configure
  TEST = 4,         // Run test request, show success/failure
  DONE = 5          // Celebration, open dashboard CTA
}
```

**AuthError** (enhanced interface):
```typescript
interface AuthError {
  code: AuthErrorCode
  message: string           // Human-readable
  technicalMessage?: string // For debugging
  retryable: boolean
  suggestedAction?: string
}

type AuthErrorCode = 
  | 'TOKEN_EXPIRED'
  | 'AUTH_CANCELLED' 
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'INVALID_GRANT'
  | 'SCOPE_DENIED'
```

**Error Message Mapping**:
| Code | User Message | Action |
|------|-------------|--------|
| `TOKEN_EXPIRED` | "Your session has expired" | "Click to reconnect" |
| `AUTH_CANCELLED` | "Connection was cancelled" | "Try again when ready" |
| `NETWORK_ERROR` | "Connection failed" | "Check your internet" |
| `PROVIDER_ERROR` | "Provider is unavailable" | "Try again in a few minutes" |
| `INVALID_GRANT` | "Authorization was rejected" | "Reconnect your account" |
| `SCOPE_DENIED` | "Required permissions were not granted" | "Reconnect and allow all permissions" |

### 4.3 API Design

**New IPC Channels**:

`ONBOARDING_STATE_GET` (renderer → main):
- Returns: `OnboardingState`

`ONBOARDING_STATE_SET` (renderer → main):
- Input: `Partial<OnboardingState>`
- Persists to settings store

`THEME_SYNC` (main → renderer push):
- Emits when system theme changes
- Payload: `{ resolvedTheme: 'dark' | 'light' }`

**Modified Existing Channels**:

`AUTH_START_OAUTH` - Add enhanced error response:
- Output now includes: `AuthError` on failure

### 4.4 Key Algorithms

**Onboarding Wizard State Machine**:
```
                    ┌─────────┐
                    │ WELCOME │
                    └────┬────┘
                         │ Next
                    ┌────▼────┐
           ┌────────│PROVIDERS│────────┐
           │        └────┬────┘        │
           │ Skip        │ Next        │ Back
           ▼             ▼             │
    ┌──────────┐   ┌─────────┐         │
    │  DONE    │◄──│ CONNECT │◄────────┘
    └──────────┘   └────┬────┘
                        │ All connected
                   ┌────▼────┐
                   │  TOOLS  │
                   └────┬────┘
                        │ Next
                   ┌────▼────┐
                   │  TEST   │
                   └────┬────┘
                        │ Complete
                   ┌────▼────┐
                   │  DONE   │
                   └─────────┘
```

**Theme Application Flow** (no flash):
1. In `<head>` script (before React):
   - Read theme from localStorage
   - Apply `dark` or `light` class to `<html>`
2. React hydrates with correct theme
3. On theme change:
   - Update localStorage
   - Apply class transition (200ms)
   - Sync to Electron main via IPC

**Auth Token Refresh Flow**:
1. On provider card mount: Check token expiry
2. If expiry < 5 minutes: Trigger background refresh
3. On refresh success: Update UI badge silently
4. On refresh failure: Show warning badge + manual refresh button
5. On click "Refresh": Block UI, attempt refresh, show result

---

## 5. Reusable Code

### Existing Components to Leverage
- `src/stores/themeStore.ts` - Already has dark/light/system with persist
- `src/components/shared/ThemeToggle.tsx` - Just needs title bar variant
- `src/pages/Settings.tsx` - Pattern for Radix Tabs + settings rows
- `src/hooks/useToast.ts` - Toast notifications
- `electron/main/ipc.ts` - IPC handler patterns with Zod

### New Components to Create
- `src/components/onboarding/OnboardingWizard.tsx` - Main wizard container
- `src/components/onboarding/steps/*.tsx` - Individual step components
- `src/components/shared/PageTransition.tsx` - Motion wrapper for route transitions
- `src/components/providers/AuthStatusBadge.tsx` - Connection status display
- `src/components/providers/AuthErrorState.tsx` - Error with retry

### Patterns to Follow
- Zustand stores with persist middleware (see `themeStore.ts`)
- Motion `AnimatePresence` + `motion.div` (see `ThemeToggle.tsx`) - **Note: Migrate to `motion/react` imports**
- Radix primitives for accessibility (see `Settings.tsx`)
- IPC handlers with Zod validation (see `ipc.ts`)

---

## 6. Testing Strategy

### Unit Tests
- Onboarding state machine transitions (all valid paths)
- Error message mapping (all error codes → user messages)
- Theme application without flash
- Wizard step validation logic

### Integration Tests
- Full wizard flow: Welcome → Done
- OAuth error handling + retry
- Theme persistence across app restart
- Skip functionality at each step

### E2E Tests
- New user onboarding flow (happy path)
- OAuth failure recovery flow
- Theme toggle persistence
- Deep link to web guides opens browser
- Keyboard navigation through wizard

### Visual Regression
- Dark theme screenshots (all pages)
- Light theme screenshots (all pages)
- Error state screenshots
- Loading state screenshots

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `ONBOARDING_ENABLED` - Toggle wizard (default: true)
- `NEW_AUTH_UX` - Toggle enhanced OAuth UI (default: true)

### 7.2 Migration
- Existing users: `onboarding.completed = true` automatically
- No data migration required for theming (already persisted)
- Web guides are additive (no migration)

### 7.3 Rollback
- `ONBOARDING_ENABLED = false` hides wizard entirely
- Theme system is backward compatible
- Web guides are independent of app

---

## 8. Open Questions

- [ ] Should we auto-detect installed coding tools (VS Code, JetBrains)?
- [ ] How to handle users with no AI subscriptions? Show upgrade prompt?
- [ ] Any analytics to collect? (Leaning toward zero for privacy)

## 8.1 Decisions Made
- **Wizard style**: Modal with backdrop blur (not full-page takeover)
- **Theme default**: Dark (matches current behavior)
- **Auth error display**: Inline in provider card, not toast
- **Onboarding storage**: localStorage for fast hydration
- **Skip behavior**: Skip button skips the entire onboarding (marks as complete), not just current step. Users who want to proceed without completing a step can use "Back" or close/reopen wizard.

---

## 9. Animation Library

### 9.1 Motion (formerly Framer Motion)

**IMPORTANT**: As of November 2024, Framer Motion was renamed to **Motion** and became an independent project. Phase B MUST use the new library.

**Migration Required**:
- Replace: `"framer-motion": "^11.x"` → `"motion": "latest"`
- Update imports: `from "framer-motion"` → `from "motion/react"`

**Import Pattern**:
```typescript
// ✅ Correct (Motion - December 2025)
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "motion/react"

// ❌ Deprecated (Framer Motion - legacy)
import { motion, AnimatePresence } from "framer-motion"
```

**API Compatibility**:
The core API remains the same as Framer Motion v11:
- `motion.*` components (motion.div, motion.span, etc.)
- `AnimatePresence` for exit animations
- Hooks: `useMotionValue`, `useTransform`, `useSpring`
- Gesture props: `whileHover`, `whileTap`, `drag`
- Transition props: `initial`, `animate`, `exit`, `transition`

**Pre-Phase B Task**:
Before implementing Phase B features, migrate all 19 existing files from `framer-motion` to `motion/react`:
```bash
# In korproxy-app/
npm uninstall framer-motion
npm install motion
# Then update imports in all files
```

---

## 10. References
- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Phase A Spec](../phase-a-reliable-gateway/spec.md) - Pattern reference
- [Existing Theme Store](../../../korproxy-app/src/stores/themeStore.ts)
- [Existing Settings Page](../../../korproxy-app/src/pages/Settings.tsx)
- [Motion Docs](https://motion.dev/docs/react-quick-start) - Official documentation
- [Motion Announcement](https://motion.dev/blog/framer-motion-is-now-independent-introducing-motion) - Nov 2024
- [Radix UI Docs](https://www.radix-ui.com/)

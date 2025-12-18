# Requirements: Phase B - Delightful Onboarding & UX

## Overview
Phase B transforms KorProxy's first-time user experience with a guided onboarding wizard, polished OAuth flows, and refined visual design. The goal is to reduce time-to-first-proxied-request to under 7 minutes while maintaining the app's technical credibility for developer users.

## User Stories

### Primary User Stories
1. **As a** new user, **I want** a step-by-step wizard when I first open the app, **so that** I can connect my AI provider and start using KorProxy without reading docs.
2. **As a** developer, **I want** clear error states during OAuth connection, **so that** I understand what went wrong and how to fix it.
3. **As a** user, **I want** to toggle between dark and light themes, **so that** the app matches my system preferences or personal taste.

### Secondary User Stories
1. **As a** new user, **I want** pre-configured setup for my coding tool (Cline, Continue.dev), **so that** I can start coding immediately after onboarding.
2. **As a** returning user, **I want** to skip onboarding if I've already completed it, **so that** I can get straight to work.
3. **As a** user, **I want** smooth page transitions, **so that** the app feels polished and professional.
4. **As a** troubleshooting user, **I want** public setup guides on korproxy.dev, **so that** I can follow along without being in the app.

---

## Functional Requirements

### Must Have (P0)

#### Onboarding Wizard (`spec: onboarding-wizard`)
- [ ] First-run detection: Show wizard only on first launch (persisted flag)
- [ ] Step 1: Welcome screen with value proposition
- [ ] Step 2: AI provider selection (checkboxes for Gemini, Claude, Codex, Qwen, iFlow)
- [ ] Step 3: OAuth connection for selected providers with progress indicator
- [ ] Step 4: Tool selection (Cline, Continue.dev, Amp, Factory)
- [ ] Step 5: Test connection with success/failure feedback
- [ ] Step 6: Completion with "Open Dashboard" CTA
- [ ] Skip option available at every step (persists onboarding as complete)
- [ ] Progress indicator showing current step (e.g., "2 of 6")
- [ ] Back navigation between steps

#### Auth UX (`spec: auth-ux`)
- [ ] OAuth loading state with animated spinner and provider branding
- [ ] Success state: Green checkmark, "Connected" badge, expiry countdown
- [ ] Error states with actionable messages:
  - `TOKEN_EXPIRED`: "Your session expired. Click to reconnect."
  - `AUTH_CANCELLED`: "Connection cancelled. Try again when ready."
  - `NETWORK_ERROR`: "Connection failed. Check your internet and try again."
  - `PROVIDER_ERROR`: "Provider unavailable. Try again later."
- [ ] Token refresh UI: Auto-refresh 5 min before expiry, manual refresh button
- [ ] Disconnect confirmation modal with warning about impact

#### Theming (`spec: theming`)
- [ ] Three theme modes: Light, Dark, System (follows OS)
- [ ] Theme toggle in Settings → General (already exists, needs polish)
- [ ] Theme toggle in window title bar (compact version)
- [ ] CSS variables for all semantic colors
- [ ] Smooth transition when switching themes (0.2s fade)
- [ ] Persist selection in localStorage and sync to Electron main

### Should Have (P1)

#### UI Polish (`spec: ui-polish`)
- [ ] Framer Motion page transitions between routes (slide + fade)
- [ ] Micro-interactions on buttons (hover scale, tap feedback)
- [ ] Loading skeletons for async content
- [ ] Success/error toast animations
- [ ] Status badge pulse animations (health states)

#### Setup Guides (`spec: setup-guides`)
- [ ] `/guides/cline-setup` page on korproxy-web
- [ ] `/guides/continue-setup` page on korproxy-web
- [ ] `/guides/troubleshooting` page with common issues
- [ ] Deep links from app to web guides ("Need help?" links)
- [ ] Search-engine friendly content (SEO meta tags)

### Nice to Have (P2)

#### Documentation (`spec: documentation`)
- [ ] In-app help sidebar with FAQ
- [ ] Security documentation (what data is stored, what's transmitted)
- [ ] Video walkthroughs embedded in web guides
- [ ] Changelog page on korproxy-web

---

## Non-Functional Requirements

### Performance
- [ ] Onboarding wizard renders in < 100ms
- [ ] Theme toggle applies in < 50ms (no flash of wrong theme)
- [ ] Page transitions complete in < 300ms
- [ ] OAuth callback handling in < 500ms

### Security
- [ ] No OAuth tokens stored in localStorage (main process only)
- [ ] Token refresh happens in background without exposing credentials
- [ ] Onboarding state stored locally (no analytics during onboarding)

### Accessibility
- [ ] All wizard steps keyboard-navigable (Tab, Enter, Escape)
- [ ] Focus trap within wizard modal
- [ ] ARIA labels for screen readers
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Reduced motion support (respect prefers-reduced-motion)

---

## Technical Constraints

### Existing Implementation to Leverage
- **Theme system**: `src/stores/themeStore.ts` - Zustand with persist middleware, supports dark/light/system
- **Theme toggle**: `src/components/shared/ThemeToggle.tsx` - Already has Framer Motion animations
- **Settings page**: `src/pages/Settings.tsx` - Radix Tabs, already has theme toggle
- **IPC patterns**: `electron/main/ipc.ts` - Zod validation pattern for handlers
- **Auth handlers**: `AUTH_START_OAUTH`, `AUTH_LIST_ACCOUNTS`, `AUTH_GET_TOKEN` already exist
- **Toast system**: `src/hooks/useToast.ts` - For notifications

### Constraints
- Must work offline after initial setup (no external dependencies in wizard)
- OAuth flows require Electron main process (use existing IPC channels)
- Web guides must work without JavaScript for SEO
- Theme must apply before first paint (no flash of unstyled content)

### Dependencies
- **motion** (migrate from framer-motion) - For animations (`motion/react` imports)
- **@radix-ui** (already installed) - For accessible primitives
- **zustand** (already installed) - For state management
- **Electron nativeTheme** - For system theme detection
- **Next.js** (korproxy-web) - For setup guides

**Note**: As of November 2024, Framer Motion was renamed to Motion. Phase B requires migrating from `framer-motion` to `motion` package.

---

## Acceptance Criteria

### Criterion 1: Onboarding Completion Rate
- **Given**: A new user launches KorProxy for the first time
- **When**: They complete the onboarding wizard
- **Then**: They have at least one provider connected and can make a test request

### Criterion 2: Time to First Request
- **Given**: A user starts the onboarding wizard
- **When**: They complete all steps including provider connection
- **Then**: Total time is under 7 minutes (excluding provider OAuth time)

### Criterion 3: OAuth Error Recovery
- **Given**: A user encounters an OAuth error during connection
- **When**: They see the error message
- **Then**: They can understand the problem and have a clear path to retry

### Criterion 4: Theme Persistence
- **Given**: A user sets their theme preference
- **When**: They restart the app
- **Then**: The theme is restored without any flash of wrong theme

### Criterion 5: Drop-off Rate
- **Given**: Users start the onboarding wizard
- **When**: Measured over a cohort of 100 users
- **Then**: Less than 10% drop off before completing provider connection

---

## Open Questions
- [x] **Decided**: Use multi-step wizard modal vs. full-page flow? → **Modal with backdrop blur**
- [ ] Should we auto-detect installed coding tools before tool selection step?
- [ ] How to handle users who have no AI subscriptions (free tier marketing opportunity)?
- [ ] Should onboarding be skippable entirely, or just individual steps?
- [ ] What analytics (if any) to collect during onboarding? (Privacy consideration)

---

## Research Notes

### Wizard UX Best Practices (from Exa/web research)
1. **Progress visibility**: Always show current step and total steps
2. **Back navigation**: Users must be able to return to previous steps
3. **Skip option**: Power users want to skip; don't force linear completion
4. **Validation timing**: Validate on step completion, not on every keystroke
5. **Success celebration**: Use micro-animations to acknowledge progress
6. **Error recovery**: Never lose user progress; store state locally

### Motion Patterns (from Exa code search)

**Note**: As of November 2024, Framer Motion was renamed to **Motion**. Import from `motion/react`:

```typescript
import { motion, AnimatePresence } from "motion/react"

// Page transitions
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}

// Wizard step transitions
const stepVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 })
}
```

### OAuth Error Handling Patterns (from Exa code search)
```typescript
// Arctic library pattern for error classification
if (error instanceof OAuth2RequestError) {
  // Invalid authorization code, credentials, or redirect URI
}
if (error instanceof ArcticFetchError) {
  // Network failure - Failed to call fetch()
}
// Parse error - Invalid response from provider
```

### Theme Implementation (from existing codebase)
- Already using Zustand persist middleware
- CSS variables in `src/styles/globals.css`
- Tailwind `dark:` variant classes throughout
- System theme detection via `window.matchMedia`

### Existing Theme Store Pattern
```typescript
// From src/stores/themeStore.ts - already implemented well
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => {
        applyTheme(theme)
        set({ theme })
      },
    }),
    { name: 'korproxy-theme-storage' }
  )
)
```

---

## Visuals
- [ ] Wireframe: Onboarding wizard steps (planning/visuals/onboarding-wireframe.png)
- [ ] Mockup: Error state designs (planning/visuals/error-states.png)
- [ ] Reference: Theme color palette comparison (planning/visuals/theme-palette.png)

---

## References
- [Phase A Spec](../phase-a-reliable-gateway/spec.md) - Pattern to follow
- [Product Roadmap](../../product/roadmap.md) - Phase B goals
- [Existing Theme Store](../../../korproxy-app/src/stores/themeStore.ts)
- [Existing Settings Page](../../../korproxy-app/src/pages/Settings.tsx)
- [Existing IPC Handlers](../../../korproxy-app/electron/main/ipc.ts)

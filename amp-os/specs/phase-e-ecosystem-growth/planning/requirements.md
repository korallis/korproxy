# Requirements: Phase E - Ecosystem & Growth

> **Status**: Shaping Complete
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.4+

## Overview

Phase E focuses on growing KorProxy adoption through comprehensive editor integration guides, a scalable content pipeline (blog/changelog), an in-app feedback system with contextual logging, and new provider support. This phase leverages the stable foundation from Phases A-D (reliable gateway, polished onboarding, power-user features, teams/billing) to drive organic traffic and improve product quality through user feedback.

## User Stories

### Primary User Stories
1. **As a** JetBrains user, **I want** a step-by-step guide for configuring KorProxy with my IDE, **so that** I can use my Claude Pro subscription in IntelliJ/PyCharm.
2. **As a** NeoVim/Emacs user, **I want** clear documentation for HTTP proxy setup, **so that** I can route AI requests through KorProxy without complex configuration.
3. **As a** user encountering issues, **I want** to submit feedback with relevant context (logs, provider, model), **so that** the team can diagnose and fix problems quickly.
4. **As a** prospective user, **I want** to read blog posts about use cases and comparisons, **so that** I can decide if KorProxy fits my workflow.
5. **As a** current user, **I want** to see what's on the roadmap and recent changes, **so that** I can understand the product direction and new features.

### Secondary User Stories
1. **As a** power user, **I want** support for additional AI providers (as CLIProxyAPI expands), **so that** I can use new models when they become available.
2. **As a** developer evaluating KorProxy, **I want** detailed technical blog posts (advanced routing, multi-account strategies), **so that** I understand the full capability.
3. **As a** user who reported a bug, **I want** acknowledgment and visibility into resolution, **so that** I trust the feedback system is working.

---

## Functional Requirements

### Must Have (P0)

#### Editor Guides (`spec: editor-guides`)
- [ ] VS Code guide polish: complete settings.json examples, environment variables, screenshots, troubleshooting (P0)
- [ ] JetBrains guide: IntelliJ/PyCharm/WebStorm setup via Continue plugin or direct HTTP proxy (P0)
- [ ] NeoVim guide: configuration for popular AI plugins (Copilot alternatives, custom LLM clients) (P0)
- [ ] Emacs guide: HTTP proxy configuration for AI packages (P0)
- [ ] SEO optimization: meta tags, structured data, descriptive URLs for all guides (P0)
- [ ] Cross-linking between related guides (e.g., VS Code ↔ Continue, JetBrains ↔ Continue) (P0)

#### Marketing Content (`spec: marketing-content`)
- [ ] Blog system: MDX-based `/blog/[slug]` routes with listing page
- [ ] Initial cornerstone posts (2-3):
  - "Use Your Claude Pro Subscription in Any Editor"
  - "KorProxy vs Native Integrations: When to Use a Proxy"
  - "Setting Up Multi-Provider Routing for AI Code Assistants"
- [ ] Landing page optimization: clarify value prop, highlight supported tools/providers
- [ ] Download attribution: UTM tracking from guides/blog to install

#### Analytics Infrastructure (Cross-cutting)
- [ ] Privacy-friendly analytics on korproxy-web via external service (P0)
- [ ] "How did you hear about KorProxy?" question in onboarding, stored in Convex (P0)
- [ ] UTM param capture in sessionStorage → Convex on signup (P0)
- [ ] Attribution correlation: guide/blog → download → activation (P0)

### Should Have (P1)

#### Feedback System (`spec: feedback-system`)
- [ ] In-app feedback modal triggered from Help menu or error states
- [ ] Category selection: Bug Report, Feature Request, General Feedback
- [ ] Optional fields: contact email, single "Include diagnostic info" checkbox (logs + system info)
- [ ] Context attachment: last 50 log entries (error/warn only, 500 char max each), provider/model, OS/app version
- [ ] Secret redaction: patterns for API keys, Bearer tokens before sending
- [ ] Convex `feedback` table with mutation and `returns` validators
- [ ] User association: userId if authenticated, null if anonymous
- [ ] Privacy: explicit opt-in, clear explanation of what's sent
- [ ] Acknowledgment toast after submission

#### Public Roadmap (`spec: public-roadmap`)
- [ ] `/roadmap` page rendering from `amp-os/product/roadmap.md`
- [ ] `/changelog` page with version history (manual MDX initially)
- [ ] Visual status indicators per phase/feature (Planned/In Progress/Done)
- [ ] Link to GitHub issues/milestones for transparency

#### Provider Expansion Framework (`spec: provider-expansion`)
- [ ] Standardized provider descriptor format for CLIProxyAPI integration
- [ ] Desktop UI scaffolding for new providers (accounts, routing, analytics)
- [ ] Automated smoketests per provider
- [ ] `/guides/models` page auto-update when providers added
- [ ] Documentation template for new provider guides

### Nice to Have (P2)

- [ ] Automated changelog from GitHub releases/tags
- [ ] GitHub integration for roadmap status badges
- [ ] NeoVim/Emacs deep-dive guides for specific plugins
- [ ] "Top requested features" section on roadmap derived from feedback
- [ ] Blog RSS feed
- [ ] Social sharing metadata (OG images, Twitter cards)
- [ ] Feedback-to-GitHub-issue automation

---

## Non-Functional Requirements

### Performance
- Guide pages: < 1.5s LCP (Largest Contentful Paint)
- Blog pages: < 2s LCP
- Feedback submission: < 500ms perceived latency
- Log context collection: < 100ms

### Security
- No PII in logs sent with feedback (redact prompts, API keys)
- Explicit user consent for context attachment
- Feedback stored in Convex with user association (for follow-up)

### Accessibility
- All guide pages meet WCAG 2.1 AA
- Code blocks with proper aria labels
- Keyboard-navigable feedback modal

### SEO
- Unique meta titles/descriptions per guide
- Structured data (HowTo, FAQPage where appropriate)
- Canonical URLs, proper heading hierarchy
- Sitemap including all guides and blog posts

---

## Technical Constraints

- **Bun only**: No npm commands in any package
- **No Sentry**: All logging local with 24-hour auto-deletion (already implemented in `log-manager.ts`)
- **CLIProxyAPI submodule**: Provider changes require separate PR and submodule update
- **Convex validators**: All queries/mutations must include `returns` validator
- **Zustand persistence**: Desktop stores use persist middleware pattern
- **IPC validation**: All IPC handlers use Zod schemas
- **Log retention**: 24-hour TTL for logs (configurable via `log-manager.ts`)

## Dependencies

### External
- CLIProxyAPI releases for new provider support
- GitHub API for changelog automation (optional)
- Privacy-friendly analytics service (Plausible, self-hosted alternative, or custom)

### Internal
- Phase A-D completion (stable gateway, onboarding, power features, billing)
- Existing guide page patterns (`korproxy-web/src/app/guides/`)
- Existing log manager (`korproxy-app/electron/main/log-manager.ts`)
- Toast notification system (`korproxy-app/src/hooks/useToast.ts`)
- Modal patterns (`korproxy-app/src/components/auth/AuthModal.tsx`)

---

## Acceptance Criteria

### AC1: Editor Guide Completeness
- **Given**: A user visits `/guides/jetbrains`
- **When**: They follow all steps
- **Then**: They can successfully route AI requests through KorProxy in IntelliJ

### AC2: Blog System Functional
- **Given**: An MDX file exists in the blog content directory
- **When**: A user visits `/blog/[slug]`
- **Then**: The post renders with proper styling, code highlighting, and navigation

### AC3: Feedback Submission
- **Given**: A user encounters an error
- **When**: They open feedback modal, select "Bug Report", optionally attach logs, and submit
- **Then**: Feedback is stored in Convex with context, and user sees confirmation toast

### AC4: Public Roadmap Visibility
- **Given**: A prospective user visits `/roadmap`
- **When**: The page loads
- **Then**: They see all phases with current status indicators and links to relevant GitHub issues

### AC5: Attribution Tracking
- **Given**: A user arrives at korproxy-web from a guide link with UTM params
- **When**: They download and complete onboarding
- **Then**: Their source is recorded in the backend for conversion analytics

### AC6: New Provider Integration
- **Given**: CLIProxyAPI adds support for a new provider
- **When**: The submodule is updated and desktop app rebuilt
- **Then**: The provider appears in UI with accounts, routing, and analytics support

---

## Open Questions

### Resolved
- [x] Log context size → **50 entries max, 500 chars each, error/warn only**
- [x] Feedback authentication → **Optional, userId set if authenticated, null if anonymous**
- [x] Analytics storage → **External service for pageviews, Convex for attribution only**

### Pending
- [ ] Which specific analytics service? (Plausible recommended)
- [ ] Should blog posts support comments? (None for MVP recommended)
- [ ] Priority order for new providers? (Based on user demand)
- [ ] Quarterly guide maintenance process ownership?
- [ ] Deep link URL scheme registration for all platforms?

## Research Notes

### Existing Patterns to Reuse

**Guide Pages** (`korproxy-web/src/app/guides/`):
- 9 existing guides with consistent structure: overview, prerequisites, configuration steps, troubleshooting
- Layout wrapper with "Back to guides" navigation
- Static rendering (server-side) except for interactive models page
- Card-based grid layout on index page
- Icon usage: Lucide React (Settings, Terminal, AlertCircle, CheckCircle2)

**Log Manager** (`korproxy-app/electron/main/log-manager.ts`):
- File-based persistence with rotation
- 24-hour default retention
- Filtering by level (debug, info, warn, error)
- Export capability (already supports context extraction)

**Toast System** (`korproxy-app/src/hooks/useToast.ts`):
- Zustand-based state management
- Success/error/info variants
- Framer Motion animations
- Can extend for feedback confirmation

**Modal Patterns** (`korproxy-app/src/components/auth/AuthModal.tsx`, `UpgradeModal.tsx`):
- Radix UI Dialog-based
- Form handling with validation
- Can serve as template for feedback modal

**IPC Types** (`korproxy-app/electron/common/ipc-types.ts`):
- Channel constants pattern
- LogEntry, LogLevel types already defined
- Extend with FEEDBACK_SUBMIT channel

### Content Pipeline Decision

**Recommended approach for blog/changelog:**
1. Add MDX support to korproxy-web (install `@next/mdx`, `gray-matter`)
2. Create `content/blog/` and `content/changelog/` directories
3. Use dynamic routes: `/blog/[slug]/page.tsx`, `/changelog/page.tsx`
4. Render `roadmap.md` at `/roadmap` via MDX or raw markdown

**Alternative (not recommended for MVP):**
- Convex-stored content (adds complexity, no clear benefit yet)
- GitHub releases API only (already have `github.ts`, could enhance)

### Analytics Options

**Privacy-friendly candidates:**
1. **Plausible Analytics** - Self-hosted option available, GDPR compliant
2. **Umami** - Open source, self-hosted
3. **Custom Convex tracking** - pageviews/events table, minimal data

**Attribution implementation:**
- Parse UTM params on landing pages
- Store in sessionStorage until onboarding
- Send to Convex as `acquisitionSource` on user creation

---

## Success Metrics (from Roadmap)

| Metric | Target | Measurement Approach |
|--------|--------|---------------------|
| Organic traffic growth | > 20% MoM | Analytics pageviews |
| Users from guides/blog | ≥ 30% | Attribution tracking |
| GitHub closed/created ratio | > 1 | GitHub API/manual tracking |

---

## Visuals

- TBD: Blog post template mockup
- TBD: Feedback modal wireframe
- TBD: Roadmap page design

---

## References

- [Product Roadmap](../../../product/roadmap.md)
- [Phase D Spec](../../phase-d-teams-billing/spec.md) - Recent patterns reference
- [Existing Guides Implementation](../../../../korproxy-web/src/app/guides/)
- [Log Manager](../../../../korproxy-app/electron/main/log-manager.ts)
- [Website Redesign Plan](../../../../korproxy-web/WEBSITE_REDESIGN_PLAN.md)

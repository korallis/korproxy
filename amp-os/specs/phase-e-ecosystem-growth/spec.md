# Specification: Phase E - Ecosystem & Growth

> **Status**: Ready for Implementation
> **Created**: 2025-12-17
> **Author**: Amp Agent
> **Target**: KorProxy 1.4+

## 1. Overview

### 1.1 Summary
Phase E drives KorProxy adoption through comprehensive editor integration guides (JetBrains, NeoVim, Emacs), a content pipeline (blog/changelog), an in-app feedback system with contextual logging, and a framework for rapid provider expansion. This phase leverages the stable foundation from Phases A-D to grow organic traffic, improve product quality through user feedback, and establish KorProxy as the go-to proxy for AI coding tools.

### 1.2 Goals
- **Content-Driven Growth**: Comprehensive editor guides and blog posts driving organic traffic
- **User Feedback Loop**: In-app feedback with contextual logs for faster issue resolution
- **Transparency**: Public roadmap and changelog building user trust
- **Provider Scalability**: Framework for rapidly integrating new AI providers
- **Attribution**: Measure which content drives conversions

### 1.3 Non-Goals
- Paid advertising or marketing automation
- Community forum or discussion platform
- Video tutorials or live streaming
- Localization/i18n of guides (English only for MVP)
- Real-time chat support
- Provider-specific desktop app features (beyond routing)
- Mobile-responsive feedback modal (desktop app only)

---

## 2. User Stories

### Primary
1. **As a** JetBrains user, **I want** a step-by-step guide for configuring KorProxy, **so that** I can use my Claude Pro subscription in IntelliJ/PyCharm.
2. **As a** NeoVim/Emacs user, **I want** clear HTTP proxy documentation, **so that** I can route AI requests without complex configuration.
3. **As a** user encountering issues, **I want** to submit feedback with context (logs, provider, model), **so that** the team can diagnose problems quickly.
4. **As a** prospective user, **I want** to read blog posts about use cases, **so that** I can decide if KorProxy fits my workflow.
5. **As a** current user, **I want** to see the roadmap and changelog, **so that** I understand product direction and new features.

### Secondary
1. **As a** power user, **I want** new provider support when CLIProxyAPI expands, **so that** I can use emerging AI models.
2. **As a** developer evaluating KorProxy, **I want** technical blog posts on advanced routing, **so that** I understand full capabilities.
3. **As a** user who reported a bug, **I want** acknowledgment of my feedback, **so that** I trust the system works.
4. **As a** marketing lead, **I want** attribution data on user acquisition, **so that** I can optimize content strategy.

---

## 3. Requirements

### 3.1 Functional Requirements

#### Editor Guides (`spec: editor-guides`)

| ID | Requirement | Priority |
|----|-------------|----------|
| EG1 | JetBrains guide: IntelliJ/PyCharm/WebStorm setup via Continue plugin or HTTP proxy | P0 |
| EG2 | NeoVim guide: configuration for AI plugins (avante.nvim, ChatGPT.nvim, etc.) | P0 |
| EG3 | Emacs guide: HTTP proxy for AI packages (gptel, chatgpt-shell, etc.) | P0 |
| EG4 | VS Code guide polish: complete settings.json, env vars, screenshots | P0 |
| EG5 | SEO optimization: meta tags, structured data, descriptive URLs | P0 |
| EG6 | Cross-linking between related guides | P0 |
| EG7 | "Verified working" badges with last-tested date | P2 |

#### Marketing Content (`spec: marketing-content`)

| ID | Requirement | Priority |
|----|-------------|----------|
| MC1 | MDX-based blog system at `/blog/[slug]` with listing page | P0 |
| MC2 | Cornerstone post: "Use Your Claude Pro Subscription in Any Editor" | P0 |
| MC3 | Cornerstone post: "KorProxy vs Native Integrations: When to Use a Proxy" | P0 |
| MC4 | Cornerstone post: "Multi-Provider Routing for AI Code Assistants" | P1 |
| MC5 | Landing page optimization: value prop clarity, tool/provider showcase | P0 |
| MC6 | UTM tracking on all download links | P0 |
| MC7 | Blog RSS feed | P2 |
| MC8 | Social sharing metadata (OG images, Twitter cards) | P2 |

#### Feedback System (`spec: feedback-system`)

| ID | Requirement | Priority |
|----|-------------|----------|
| FS1 | Feedback modal in desktop app (Help menu + error state trigger) | P1 |
| FS2 | Category selection: Bug Report, Feature Request, General Feedback | P1 |
| FS3 | Optional context attachment: last 50 logs (500 char max each), provider/model, OS/version | P1 |
| FS4 | Privacy: single opt-in checkbox for "Include diagnostic info" (logs + system info), clear disclosure | P1 |
| FS5 | Convex `feedback` table with mutation and `returns` validators | P1 |
| FS6 | Confirmation toast after submission | P1 |
| FS7 | User association: if authenticated, set `userId`; anonymous allowed with `userId = null` | P1 |
| FS8 | Admin view for feedback in web dashboard | P2 |
| FS9 | Feedback-to-GitHub-issue automation | P2 |

#### Public Roadmap (`spec: public-roadmap`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PR1 | `/roadmap` page rendering from `amp-os/product/roadmap.md` | P1 |
| PR2 | `/changelog` page with version history (manual MDX initially, automation P2) | P1 |
| PR3 | Visual status indicators: Planned, In Progress, Done | P1 |
| PR4 | Links to GitHub issues/milestones | P1 |
| PR5 | GitHub status badges on roadmap items | P2 |
| PR6 | Automated changelog from GitHub releases | P2 |

#### Provider Expansion (`spec: provider-expansion`)

| ID | Requirement | Priority |
|----|-------------|----------|
| PE1 | Standardized provider descriptor format for CLIProxyAPI | P1 |
| PE2 | Desktop UI scaffolding for new providers (accounts, routing) | P1 |
| PE3 | Minimal smoketests per provider (1 completion + 1 chat call) | P1 |
| PE4 | `/guides/models` update from provider registry (single source of truth) | P1 |
| PE5 | Provider guide template for documentation | P2 |
| PE6 | Provider-specific analytics in desktop UI | P2 |

#### Analytics Infrastructure (`spec: analytics-infra`)

| ID | Requirement | Priority |
|----|-------------|----------|
| AI1 | Privacy-friendly analytics on korproxy-web (external service, not Convex) | P0 |
| AI2 | "How did you hear about KorProxy?" in onboarding | P0 |
| AI3 | UTM param capture and storage in sessionStorage → Convex on signup | P0 |
| AI4 | Attribution correlation: content → download → activation | P0 |
| AI5 | Analytics dashboard for content performance | P2 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR1 | Guide page LCP | < 1.5 seconds |
| NFR2 | Blog page LCP | < 2 seconds |
| NFR3 | Feedback submission latency | < 500ms perceived |
| NFR4 | Log context collection | < 100ms |
| NFR5 | SEO: Core Web Vitals | Pass all metrics |
| NFR6 | Accessibility | WCAG 2.1 AA compliance |

### 3.3 Success Metrics (from Roadmap)

| ID | Metric | Target |
|----|--------|--------|
| SM1 | Organic traffic growth | > 20% MoM (6 months) |
| SM2 | Users from guides/blog | ≥ 30% of signups |
| SM3 | GitHub closed/created ratio | > 1 |

---

## 4. Technical Approach

### 4.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Phase E Architecture                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────┐       ┌────────────────────────────────────────────┐  │
│  │   Desktop App        │       │            korproxy-web (Next.js)          │  │
│  │   (Electron)         │       │                                            │  │
│  │                      │       │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │ ┌──────────────────┐ │       │  │ /guides  │  │  /blog   │  │/roadmap  │  │  │
│  │ │ Feedback Modal   │ │       │  │ JetBrains│  │  MDX     │  │/changelog│  │  │
│  │ │ - Category       │ │       │  │ NeoVim   │  │  Posts   │  │          │  │  │
│  │ │ - Context attach │ │       │  │ Emacs    │  │          │  │          │  │  │
│  │ │ - Log excerpt    │ │       │  └──────────┘  └──────────┘  └──────────┘  │  │
│  │ └────────┬─────────┘ │       │                                            │  │
│  │          │           │       │  ┌──────────────────────────────────────┐  │  │
│  │ ┌────────▼─────────┐ │       │  │          Analytics Layer             │  │  │
│  │ │ Log Manager      │ │       │  │  UTM capture │ Pageviews │ Events    │  │  │
│  │ │ (24h TTL)        │ │       │  └──────────────────────────────────────┘  │  │
│  │ └──────────────────┘ │       └────────────────────────────────────────────┘  │
│  └──────────────────────┘                          │                            │
│            │                                       │                            │
│            │ IPC + Convex                         │ Convex                      │
│            ▼                                       ▼                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         Convex Backend                                    │  │
│  │                                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │  feedback   │  │ pageviews   │  │  users      │  │ CLIProxyAPI     │  │  │
│  │  │ +category   │  │ +source     │  │ +acqSource  │  │ (submodule)     │  │  │
│  │  │ +context    │  │ +utm        │  │ +utm        │  │ +new providers  │  │  │
│  │  │ +logs       │  │ +timestamp  │  │             │  │                 │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  │                                                                           │  │
│  │  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  │              Convex Functions                                      │   │  │
│  │  │  feedback.ts  │  analytics.ts  │  content.ts (optional)           │   │  │
│  │  └───────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    Content Pipeline (Local)                               │  │
│  │  content/blog/*.mdx  │  content/changelog/*.mdx  │  roadmap.md           │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

#### feedback (NEW table)
- `id`: Auto-generated Convex ID
- `userId`: Optional reference to users table (set if authenticated, null if anonymous)
- `category`: bug | feature | general
- `message`: User's feedback text (max 5000 chars)
- `contactEmail`: Optional email for follow-up
- `includesDiagnostics`: Boolean flag (true if user opted in)
- `logExcerpt`: Optional array of log entries (max 50 entries, each max 500 chars)
- `context`: Object with provider, model, appVersion, platform, os (only if opted in)
- `status`: new | reviewed | resolved | closed
- `createdAt`: Timestamp
- Indexes: `by_status`, `by_user`, `by_date`

**Log entry constraints:**
- Maximum 50 entries from last 24 hours
- Each entry truncated to 500 characters
- Only `error` and `warn` level logs included
- Secrets redacted: patterns matching `sk-*`, `Bearer *`, API key formats

#### users (EXTENDED)
- Add `acquisitionSource`: Optional string (guide, blog, direct, referral, onboarding-question)
- Add `acquisitionUtm`: Optional object `{ source?, medium?, campaign? }`
- Add `acquisitionDate`: Timestamp of first visit

**Note:** Analytics pageviews handled by external privacy-friendly service (e.g., Plausible), not Convex. Only attribution data stored in Convex for conversion tracking.

### 4.3 API Design

#### New Convex Mutations (all include `returns` validators)
- `feedback.submit({ category, message, contactEmail?, context?, logExcerpt? })` → Creates feedback entry
- `feedback.updateStatus(feedbackId, status)` → Admin status update
- `users.setAcquisitionSource(userId, source, utm?)` → Set attribution on signup

#### New Convex Queries (all include `returns` validators)
- `feedback.list({ status?, limit?, cursor? })` → Admin feedback list
- `feedback.get(feedbackId)` → Single feedback detail

#### New IPC Channels (Desktop) - all with Zod schema validation
- `FEEDBACK_OPEN` → Open feedback modal
- `FEEDBACK_SUBMIT({ category, message, includeDiagnostics, contactEmail? })` → Submit feedback
- `LOGS_GET_RECENT(count)` → Get last N log entries (filtered, truncated, redacted)
- `SYSTEM_GET_INFO` → Get OS, app version, platform for context

Each IPC channel will have corresponding Zod schemas in `electron/common/ipc-types.ts` with handlers validating all incoming data.

#### Web Routes (New)
- `/blog` → Blog listing page
- `/blog/[slug]` → Individual blog post
- `/roadmap` → Public roadmap
- `/changelog` → Version history
- `/guides/jetbrains` → JetBrains setup guide
- `/guides/neovim` → NeoVim setup guide
- `/guides/emacs` → Emacs setup guide

### 4.4 Key Algorithms

#### Feedback Context Collection
1. User clicks "Send Feedback" in Help menu or error state
2. Modal opens with category selection
3. If "Include diagnostic info" checkbox checked:
   - Call `LOGS_GET_RECENT(50)` via IPC
   - Filter to only `error` and `warn` level entries from last 24h
   - Redact secrets using patterns: `/sk-[a-zA-Z0-9]+/`, `/Bearer\s+\S+/`, `/api[_-]?key[=:]\s*\S+/i`
   - Truncate each entry message to 500 chars
   - Call `SYSTEM_GET_INFO` for provider, model, appVersion, platform, os
4. If checkbox unchecked: submit without logs or context
5. If user authenticated: attach `userId`; otherwise `userId = null`
6. Submit to Convex via IPC → main process → Convex mutation
7. Show confirmation toast with "Thank you for your feedback"

#### UTM Attribution Flow
1. User lands on korproxy-web with UTM params (`?utm_source=guide&utm_medium=web&utm_campaign=jetbrains`)
2. Parse params from URL, store in sessionStorage as `korproxy_attribution`
3. On download button click:
   - For direct downloads: attribution tracked via analytics service only
   - For "Open in App" deep links: encode UTM in URL scheme `korproxy://launch?utm_source=...`
4. Desktop app onboarding:
   - Check for deep link params first
   - If no params, show "How did you hear about KorProxy?" dropdown with options:
     - Search engine, Blog post, Setup guide, Friend/colleague, Social media, Other
5. On account creation: call `users.setAcquisitionSource(userId, source, utm)`
6. Attribution data persisted in Convex, survives app reinstalls

#### Blog/Changelog MDX Pipeline
1. MDX files in `content/blog/` with frontmatter (title, date, description, author)
2. Next.js dynamic route reads directory, parses frontmatter
3. Generate listing page with sorted posts
4. Individual posts render MDX with code highlighting
5. Generate RSS feed from same data source

#### Provider Expansion Flow
1. CLIProxyAPI adds new provider support via PR
2. Update submodule reference in korproxy-app
3. Add provider to UI registry (icon, name, auth type)
4. Add routing rule options for new provider
5. Update `/guides/models` page with new models
6. Create provider-specific guide if needed
7. Run smoketests against new provider endpoints

---

## 5. Reusable Code

### Existing Components to Leverage

#### korproxy-web (Next.js)
- `src/app/guides/layout.tsx` - Guide page layout with back navigation
- `src/app/guides/page.tsx` - Guide index with card grid pattern
- `src/app/guides/*/page.tsx` - Existing guide structure (9 guides as templates)
- `src/lib/github.ts` - GitHub releases fetching (for changelog)
- `src/components/home/FAQ.tsx` - Accordion pattern for FAQ sections

#### korproxy-app (Electron)
- `electron/main/log-manager.ts` - Log storage with TTL, filtering, export
- `src/hooks/useToast.ts` - Toast notification system
- `src/components/auth/AuthModal.tsx` - Radix Dialog modal pattern
- `src/components/billing/UpgradeModal.tsx` - Form modal pattern
- `electron/common/ipc-types.ts` - IPC channel and type definitions
- `src/stores/appStore.ts` - Zustand persist pattern

#### korproxy-backend (Convex)
- `convex/schema.ts` - Table definition patterns
- `convex/auth.ts` - Session validation pattern
- `convex/lib/rbac.ts` - Permission checking pattern

### Patterns to Follow
- **Guide page structure** as in `guides/cursor/page.tsx` - Overview, Prerequisites, Steps, Troubleshooting
- **Modal with form** as in `AuthModal.tsx` - Radix Dialog, controlled state, validation
- **Log retrieval** as in `log-manager.ts` - Filter by level, limit count, format entries
- **Toast feedback** as in `useToast.ts` - Success/error variants with Framer Motion
- **MDX rendering** - Standard Next.js MDX setup with `@next/mdx` and `gray-matter`
- **Convex validators** - All queries/mutations must include `returns` validator

### New Dependencies Required
```bash
# korproxy-web
bun add @next/mdx @mdx-js/react gray-matter reading-time
bun add -D @types/mdx

# Optional: self-hosted analytics (if not using external service)
# Consider: Plausible self-hosted, Umami, or custom Convex solution
```

---

## 6. Testing Strategy

### Unit Tests
- Feedback context sanitization (no secrets in logs)
- UTM param parsing and validation
- MDX frontmatter parsing
- Log excerpt truncation
- Provider descriptor validation

### Integration Tests
- Feedback submission flow: modal → IPC → Convex → confirmation
- Attribution flow: UTM on landing → stored in session → persisted on signup
- Blog post rendering: MDX file → parsed → rendered with code highlighting
- Guide page SEO: meta tags present, structured data valid

### E2E Tests
- Complete feedback flow from error state to submission
- Navigate all new guide pages, verify content loads
- Blog listing and individual post navigation
- Roadmap/changelog page rendering
- Download with UTM tracking preserved

### Edge Case Tests
- Feedback with maximum log excerpt (50 entries)
- Empty blog directory handling
- Invalid MDX frontmatter
- Missing UTM params (graceful degradation)
- Secret redaction patterns (ensure no API keys leak)
- Deep link URL scheme handling on all platforms

---

## 7. Rollout Plan

### 7.1 Feature Flags
- `FEEDBACK_ENABLED` - Show feedback option in Help menu (default: true)
- `BLOG_ENABLED` - Enable /blog routes (default: true)
- `ANALYTICS_ENABLED` - Enable analytics tracking (default: true)

### 7.2 Migration
- No schema migrations for existing data
- New `feedback` table is additive
- `users.acquisitionSource` field added as optional
- Existing users will have null acquisition data (acceptable)

### 7.3 Rollback
- **Feedback issues**: Disable flag, users lose ability to submit but no data loss
- **Blog issues**: Disable flag, falls back to guides-only content
- **Analytics issues**: Disable tracking, lose new data but existing users unaffected

### 7.4 Implementation Phases

#### Phase E1: Content Foundation (Week 1-2)
- MDX blog system setup
- First 2 cornerstone blog posts
- JetBrains guide
- NeoVim guide
- UTM tracking on download links

#### Phase E2: Feedback & Analytics (Week 3-4)
- Feedback modal in desktop app
- Convex feedback table and mutations
- "How did you hear?" in onboarding
- Analytics integration (external or self-hosted)

#### Phase E3: Transparency & Polish (Week 5-6)
- Public roadmap page
- Changelog page
- Emacs guide
- VS Code guide polish
- SEO optimization pass
- Provider expansion framework

---

## 8. Open Questions

### Resolved
- [x] Blog system: MDX files vs Convex-stored → **MDX files for simplicity**
- [x] Feedback authentication required? → **Optional, allow anonymous with userId=null**
- [x] Analytics approach → **External privacy-friendly service (e.g., Plausible), not Convex**
- [x] Log excerpt size limit → **50 entries max, 500 chars each, error/warn only**
- [x] User association for feedback → **Set userId if authenticated, null if anonymous**
- [x] Opt-in granularity → **Single checkbox "Include diagnostic info" covers logs + system info**

### Pending
- [ ] Which specific analytics service? (Plausible recommended, needs final decision)
- [ ] Should blog support comments? (Recommend: none for MVP, add Giscus later if needed)
- [ ] Priority order for new providers in Phase E? (Based on user demand)
- [ ] Quarterly guide maintenance process ownership? (Needs assignment)
- [ ] Deep link URL scheme registration for all platforms (technical spike needed)

### Decisions Made
- **Content source of truth**: Local MDX files, not Convex
- **Feedback storage**: Convex with conditional user association
- **Analytics pageviews**: External service only (not Convex) - keeps separation of concerns
- **Attribution data**: Stored in Convex users table for conversion tracking
- **Attribution flow**: Deep link params OR onboarding question, persisted on signup
- **Guide maintenance**: Version-tested badges with quarterly review
- **Secret redaction**: Deterministic patterns for API keys, Bearer tokens
- **Offline feedback**: Not supported in Phase E (requires online connection)

---

## 9. References
- [Requirements Document](planning/requirements.md)
- [Product Roadmap](../../product/roadmap.md)
- [Phase D Spec](../phase-d-teams-billing/spec.md) - Pattern reference
- [Existing Guides](../../../korproxy-web/src/app/guides/)
- [Log Manager](../../../korproxy-app/electron/main/log-manager.ts)
- [Toast System](../../../korproxy-app/src/hooks/useToast.ts)
- [Website Redesign Plan](../../../korproxy-web/WEBSITE_REDESIGN_PLAN.md)

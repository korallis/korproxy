# KorProxy Website Redesign Plan

## Executive Summary

The current website fails to communicate KorProxy's value proposition and doesn't reflect the quality of the desktop application. This plan outlines a comprehensive redesign to:

1. Match the website's visual design to the app's glassmorphism aesthetic
2. Add compelling content that converts visitors to subscribers
3. Provide social proof and build trust
4. Improve developer experience with code examples and clear documentation

---

## Part 1: Visual Design Overhaul

### 1.1 Glassmorphism Design System

**Current State**: Flat cards with basic borders
**Target State**: Match the app's glassmorphism design

#### CSS Changes Required

Add to `globals.css`:

```css
/* Glassmorphism card styles (from app) */
.glass-card {
  @apply relative overflow-hidden rounded-2xl;
  background: oklch(0.18 0.025 280 / 0.6);
  border: 1px solid oklch(0.35 0.03 280 / 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.glass-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    oklch(1 0 0 / 0.1) 0%,
    transparent 50%,
    oklch(0 0 0 / 0.1) 100%
  );
  pointer-events: none;
}

/* Glow effects */
.glow-primary {
  box-shadow: 0 0 20px oklch(0.75 0.18 250 / 0.5),
              0 0 40px oklch(0.75 0.18 250 / 0.3);
}

.shadow-glow {
  box-shadow: 0 0 15px oklch(0.75 0.18 250 / 0.3);
}

.shadow-glow-lg {
  box-shadow: 0 0 30px oklch(0.75 0.18 250 / 0.4);
}

/* Provider-specific glow colors */
.glow-gemini { --glow: oklch(0.70 0.18 230); }
.glow-claude { --glow: oklch(0.70 0.20 50); }
.glow-codex { --glow: oklch(0.70 0.19 145); }
.glow-qwen { --glow: oklch(0.70 0.18 300); }
.glow-iflow { --glow: oklch(0.70 0.20 180); }
```

#### Components to Update

| Component | Current | Target |
|-----------|---------|--------|
| Feature cards | `bg-card border border-border` | `glass-card` |
| Pricing cards | `bg-card border border-border` | `glass-card` with glow on hover |
| Dashboard cards | Basic cards | `glass-card` |
| Guide cards | Flat design | `glass-card` |

### 1.2 Logo Consistency

**Current State**: Gradient square in header
**Target State**: Match app's Zap icon in gradient circle

```tsx
// Header.tsx - Update logo
<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
  <Zap className="w-5 h-5 text-primary" />
</div>
```

### 1.3 Animation System

**Add framer-motion** animations matching the app:

```tsx
// Shared animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}
```

**Install dependency**:
```bash
bun add framer-motion
```

### 1.4 Provider Gradient Colors

Match the app's provider color scheme:

```tsx
const providers = [
  { id: 'gemini', name: 'Gemini', icon: '✦', color: 'from-blue-500 to-cyan-500' },
  { id: 'claude', name: 'Claude', icon: '◈', color: 'from-orange-500 to-amber-500' },
  { id: 'codex', name: 'Codex', icon: '◎', color: 'from-emerald-500 to-green-500' },
  { id: 'qwen', name: 'Qwen', icon: '◉', color: 'from-purple-500 to-violet-500' },
  { id: 'iflow', name: 'iFlow', icon: '◆', color: 'from-cyan-500 to-teal-500' },
]
```

---

## Part 2: Homepage Redesign

### 2.1 Hero Section

**Current State**:
- Generic headline: "Use Your AI Subscriptions Everywhere"
- No visual demonstration
- Two basic buttons

**Target State**:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│     Use Claude, Gemini & GPT with ANY Coding Tool               │
│     ─────────────────────────────────────────────               │
│     KorProxy turns your existing AI subscriptions into a        │
│     local API that works with Cursor, Windsurf, Cline & more.   │
│     No API keys needed - just OAuth login.                      │
│                                                                 │
│     [Get Started - 7 Day Free Trial]  [Watch Demo →]            │
│                                                                 │
│     ┌─────────────────────────────────────────────┐             │
│     │  [Animated App Screenshot / Video]          │             │
│     │  Showing: Dashboard with proxy running,     │             │
│     │  provider cards, glassmorphism design       │             │
│     └─────────────────────────────────────────────┘             │
│                                                                 │
│     Trusted by 500+ developers  ⭐ 4.9/5 rating                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Required Assets

- [ ] App screenshot (Dashboard view with proxy running)
- [ ] App screenshot (Providers page with auth)
- [ ] Animated GIF or video walkthrough (30-60 seconds)
- [ ] Provider logos (Claude, Gemini, OpenAI, Qwen)

### 2.2 New "How It Works" Section

**Position**: Below hero, above features

```
┌─────────────────────────────────────────────────────────────────┐
│                     How It Works                                │
│                                                                 │
│   ┌──────────┐      ┌──────────┐      ┌──────────┐             │
│   │    1     │ ───► │    2     │ ───► │    3     │             │
│   │ Download │      │  Login   │      │  Code    │             │
│   │ KorProxy │      │  OAuth   │      │          │             │
│   └──────────┘      └──────────┘      └──────────┘             │
│                                                                 │
│   Download the       Sign in with      Point any tool to        │
│   desktop app        your existing     localhost:1337           │
│   for free           Claude/Gemini     and start coding         │
│                      accounts                                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────┐          │
│   │ # Quick Start                                   │          │
│   │                                                 │          │
│   │ # In Cursor/Cline settings:                     │          │
│   │ baseUrl: http://localhost:1337/v1               │          │
│   │ apiKey: anything                                │          │
│   │ model: claude-sonnet-4-5-20250929               │          │
│   │                                     [Copy]      │          │
│   └─────────────────────────────────────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Supported Tools Section

**New section showing compatible tools**

```
┌─────────────────────────────────────────────────────────────────┐
│              Works With Your Favorite Tools                     │
│                                                                 │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│   │ Cursor │  │Windsurf│  │ Cline  │  │Continue│  │ VSCode │   │
│   │  [logo]│  │  [logo]│  │  [logo]│  │  [logo]│  │  [logo]│   │
│   └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                                 │
│   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│   │  Amp   │  │ Droid  │  │  Aider │  │ Claude │  │  Any   │   │
│   │  [logo]│  │  [logo]│  │  [logo]│  │  Code  │  │ OpenAI │   │
│   └────────┘  └────────┘  └────────┘  └────────┘  │compat. │   │
│                                                    └────────┘   │
│                                                                 │
│         + Any tool that supports OpenAI-compatible API          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Models Preview Section

**Show supported models on homepage**

```
┌─────────────────────────────────────────────────────────────────┐
│                   50+ Models Available                          │
│         Access through your existing subscriptions              │
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│   │ 🟠 Claude       │  │ 🔵 Gemini       │  │ 🟢 OpenAI      ││
│   │                 │  │                 │  │                 ││
│   │ • Opus 4.5      │  │ • 3 Pro Preview │  │ • GPT 5.1      ││
│   │ • Sonnet 4.5    │  │ • 2.5 Pro       │  │ • Codex Max    ││
│   │ • Haiku 4.5     │  │ • 2.5 Flash     │  │ • Codex Mini   ││
│   │ • Thinking      │  │ • Flash Lite    │  │ • Reasoning    ││
│   └─────────────────┘  └─────────────────┘  └─────────────────┘│
│                                                                 │
│   ┌─────────────────┐  ┌─────────────────┐                     │
│   │ 🟣 Qwen         │  │ 🔷 iFlow        │                     │
│   │                 │  │                 │                     │
│   │ • Coder Plus    │  │ • DeepSeek V3   │                     │
│   │ • Coder Flash   │  │ • Kimi K2       │                     │
│   │ • Vision        │  │ • GLM 4.6       │                     │
│   └─────────────────┘  └─────────────────┘                     │
│                                                                 │
│                    [View All Models →]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Social Proof Section

**New section for testimonials and trust indicators**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Trusted by Developers                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ "Finally I can use my Claude Pro subscription in        │   │
│   │  Cursor without paying for another API!"                │   │
│   │                                                         │   │
│   │  — @developer_name, Senior Engineer at Company          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ "Setup took 2 minutes. Works flawlessly with Windsurf." │   │
│   │                                                         │   │
│   │  — @another_dev, Indie Developer                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│   │  500+      │  │  10,000+   │  │  99.9%     │               │
│   │  Users     │  │  Requests  │  │  Uptime    │               │
│   │            │  │  Daily     │  │            │               │
│   └────────────┘  └────────────┘  └────────────┘               │
│                                                                 │
│   [Product Hunt Badge]  [GitHub Stars: 1.5k]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.6 FAQ Section

**New FAQ section addressing common questions**

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frequently Asked Questions                     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ▼ How is this different from OpenRouter?                │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │   KorProxy uses your EXISTING subscriptions via OAuth.  │   │
│   │   No API credits to buy. If you have Claude Pro or      │   │
│   │   ChatGPT Plus, you already have access.                │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ▼ Do I need API keys?                                   │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │   No! KorProxy uses OAuth authentication. Just sign in  │   │
│   │   with your existing accounts (Google, Anthropic, etc.) │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ▼ What's included in the subscription?                  │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │   The KorProxy app itself. AI usage comes from your     │   │
│   │   existing subscriptions. Unlimited proxy requests.     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ▼ Is my data secure?                                    │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │   Yes. KorProxy runs locally on your machine. Your      │   │
│   │   credentials never leave your computer. We never see   │   │
│   │   your API requests or responses.                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ ▼ What if I cancel?                                     │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │   You keep access until your billing period ends.       │   │
│   │   No questions asked, cancel anytime.                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.7 Updated Pricing Section

**Add comparison and clearer value**

```
┌─────────────────────────────────────────────────────────────────┐
│              Simple, Transparent Pricing                        │
│         Use your existing AI subscriptions everywhere           │
│                                                                 │
│   ┌────────────────────────┐  ┌────────────────────────┐       │
│   │       Monthly          │  │    Yearly (Save 33%)   │       │
│   │                        │  │    ⭐ POPULAR          │       │
│   │       £14.99/mo        │  │       £120/year        │       │
│   │                        │  │       (£10/mo)         │       │
│   │ ✓ All providers        │  │ ✓ All providers        │       │
│   │ ✓ Unlimited requests   │  │ ✓ Unlimited requests   │       │
│   │ ✓ All coding tools     │  │ ✓ All coding tools     │       │
│   │ ✓ Auto-updates         │  │ ✓ Auto-updates         │       │
│   │ ✓ Priority support     │  │ ✓ Priority support     │       │
│   │                        │  │ ✓ 2 months free        │       │
│   │                        │  │                        │       │
│   │ [Start 7-Day Trial]    │  │ [Start 7-Day Trial]    │       │
│   └────────────────────────┘  └────────────────────────┘       │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  💡 You're NOT paying for AI usage!                     │   │
│   │                                                         │   │
│   │  KorProxy is a desktop app that connects to YOUR        │   │
│   │  existing Claude Pro, ChatGPT Plus, or Gemini accounts. │   │
│   │  The subscription is for the proxy software only.       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│            No credit card required for trial                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Guide Pages Improvements

### 3.1 Add Screenshots to All Guides

Each guide page needs:

- [ ] Screenshot: Tool settings panel
- [ ] Screenshot: Where to enter base URL
- [ ] Screenshot: Where to enter API key
- [ ] Screenshot: Model selection (if applicable)
- [ ] Screenshot: Successful connection test

### 3.2 Guide Page Template Update

```tsx
// New guide page structure
<GuidePage>
  <GuideHeader 
    icon={CursorIcon}
    title="Cursor Setup Guide"
    description="Configure Cursor to use your AI subscriptions"
    timeEstimate="2 minutes"
  />
  
  <QuickConfig
    baseUrl="http://localhost:1337/v1"
    apiKey="korproxy"
    model="claude-sonnet-4-5-20250929"
  />
  
  <StepByStep>
    <Step number={1} title="Open Settings" screenshot="/guides/cursor-step1.png">
      Press Cmd/Ctrl + , to open settings...
    </Step>
    <Step number={2} title="Configure API" screenshot="/guides/cursor-step2.png">
      Navigate to Models section...
    </Step>
  </StepByStep>
  
  <VideoWalkthrough youtubeId="xxx" />
  
  <Troubleshooting issues={commonIssues} />
</GuidePage>
```

### 3.3 Models Page Improvements

Current: Text list of models
Target: Interactive, filterable grid

```
┌─────────────────────────────────────────────────────────────────┐
│                    Supported Models                             │
│                                                                 │
│   [All] [Claude] [Gemini] [OpenAI] [Qwen] [iFlow]  🔍 Search   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ claude-sonnet-4-5-20250929                    [Copy]    │   │
│   │ Claude 4.5 Sonnet • 200K context • Fast responses       │   │
│   │ Best for: Coding, general tasks                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ claude-opus-4-5-thinking                     [Copy]     │   │
│   │ Claude 4.5 Opus Thinking • 200K context • Extended      │   │
│   │ Best for: Complex reasoning, analysis                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4: New Pages/Sections

### 4.1 Changelog Page

**Route**: `/changelog`

Display:
- Version history with release notes
- New features highlighted
- Bug fixes listed
- Download links for each version

### 4.2 Comparison Page

**Route**: `/compare`

```
┌─────────────────────────────────────────────────────────────────┐
│              KorProxy vs Alternatives                           │
│                                                                 │
│   ┌──────────────┬────────────┬────────────┬────────────┐      │
│   │ Feature      │ KorProxy   │ OpenRouter │ LiteLLM    │      │
│   ├──────────────┼────────────┼────────────┼────────────┤      │
│   │ Uses your    │     ✅     │     ❌     │     ❌     │      │
│   │ subscriptions│            │            │            │      │
│   ├──────────────┼────────────┼────────────┼────────────┤      │
│   │ No API costs │     ✅     │     ❌     │     ❌     │      │
│   ├──────────────┼────────────┼────────────┼────────────┤      │
│   │ Desktop app  │     ✅     │     ❌     │     ❌     │      │
│   ├──────────────┼────────────┼────────────┼────────────┤      │
│   │ Local/Private│     ✅     │     ❌     │     ✅     │      │
│   ├──────────────┼────────────┼────────────┼────────────┤      │
│   │ Multi-account│     ✅     │     ❌     │     ✅     │      │
│   │ load balance │            │            │            │      │
│   └──────────────┴────────────┴────────────┴────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Status Page

**Route**: `/status`

Show:
- Latest version available
- Download counts
- Known issues
- System status

---

## Part 5: Technical Implementation

### 5.1 New Dependencies

```bash
bun add framer-motion
bun add @radix-ui/react-accordion  # For FAQ
bun add @radix-ui/react-tabs       # For model filters
```

### 5.2 New Components to Create

```
src/components/
├── home/
│   ├── Hero.tsx              # New hero with video/screenshot
│   ├── HowItWorks.tsx        # 3-step explanation
│   ├── SupportedTools.tsx    # Tool logos grid
│   ├── ModelsPreview.tsx     # Model cards preview
│   ├── Testimonials.tsx      # Social proof section
│   ├── FAQ.tsx               # Accordion FAQ
│   └── QuickStart.tsx        # Code block with copy
├── guides/
│   ├── GuideHeader.tsx       # Consistent guide headers
│   ├── StepByStep.tsx        # Numbered steps with screenshots
│   ├── QuickConfig.tsx       # Copy-paste config block
│   └── Troubleshooting.tsx   # Common issues accordion
├── shared/
│   ├── GlassCard.tsx         # Reusable glass card
│   ├── ProviderIcon.tsx      # Provider icons with gradients
│   ├── CopyButton.tsx        # Copy to clipboard
│   └── AnimatedCounter.tsx   # Number animation
└── ui/
    └── accordion.tsx         # Radix accordion styled
```

### 5.3 Asset Requirements

**Screenshots needed**:
- [ ] `app-dashboard.png` - Dashboard with proxy running
- [ ] `app-providers.png` - Providers page
- [ ] `app-auth-flow.gif` - OAuth login animation
- [ ] `cursor-settings.png` - Cursor configuration
- [ ] `cline-settings.png` - Cline configuration
- [ ] `windsurf-settings.png` - Windsurf configuration
- [ ] `continue-settings.png` - Continue configuration

**Logos needed**:
- [ ] Cursor logo
- [ ] Windsurf logo
- [ ] Cline logo
- [ ] Continue logo
- [ ] VSCode logo
- [ ] Claude logo
- [ ] Gemini logo
- [ ] OpenAI logo
- [ ] Qwen logo

**Video**:
- [ ] 60-second demo video (optional but recommended)

---

## Part 6: Implementation Order

### Phase 1: Quick Wins (1-2 hours)
1. [ ] Update CSS with glassmorphism styles
2. [ ] Update logo in header to match app
3. [ ] Add framer-motion dependency
4. [ ] Update feature cards to use glass-card

### Phase 2: Homepage Content (2-3 hours)
1. [ ] Create HowItWorks component
2. [ ] Create QuickStart code block
3. [ ] Add FAQ section
4. [ ] Update pricing section with value clarification

### Phase 3: Visual Polish (2-3 hours)
1. [ ] Add animations to homepage sections
2. [ ] Create SupportedTools grid
3. [ ] Create ModelsPreview section
4. [ ] Add glow effects to interactive elements

### Phase 4: Screenshots & Assets (1-2 hours)
1. [ ] Take app screenshots
2. [ ] Add screenshots to hero
3. [ ] Create tool logo grid
4. [ ] Add provider icons

### Phase 5: Guide Improvements (2-3 hours)
1. [ ] Create guide page template components
2. [ ] Add screenshots to each guide
3. [ ] Improve models page with filters
4. [ ] Add copy buttons everywhere

### Phase 6: New Pages (1-2 hours)
1. [ ] Create changelog page
2. [ ] Create comparison page (optional)
3. [ ] Add social proof section when data available

---

## Success Metrics

After implementation, track:

1. **Conversion Rate**: Visitors → Trial signups
2. **Time on Page**: Should increase with better content
3. **Bounce Rate**: Should decrease with compelling hero
4. **Guide Completion**: Track if users follow setup guides
5. **Support Tickets**: Should decrease with better FAQ/docs

---

## Appendix: Content to Write

### Hero Tagline Options

1. "Use Claude, Gemini & GPT with ANY Coding Tool"
2. "Your AI Subscriptions. Every Coding Tool. One Proxy."
3. "Turn Your Claude Pro into an API That Works Everywhere"
4. "Stop Paying Twice for AI. Use What You Already Have."

### Key Messages to Communicate

1. **No additional API costs** - Uses your existing subscriptions
2. **Works with any tool** - OpenAI-compatible API
3. **Completely local** - Your data stays on your machine
4. **Easy setup** - 2 minutes to configure
5. **Multi-provider** - Claude, Gemini, GPT, Qwen, iFlow

### FAQ Content

See Section 2.6 for full FAQ content.

---

*Last updated: December 2025*
*Author: KorProxy Team*

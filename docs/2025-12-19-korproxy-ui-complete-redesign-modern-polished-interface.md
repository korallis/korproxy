# KorProxy UI Complete Redesign Spec

## Executive Summary
A comprehensive UI redesign to achieve a **highly polished, modern dark-mode desktop application** inspired by premium software like Linear, Raycast, and Arc Browser. The existing "Midnight Aurora" design system provides an excellent foundation - we'll enhance it with advanced animations, glassmorphism effects, micro-interactions, and refined visual hierarchy.

---

## Design Philosophy

### Core Principles
1. **Premium Feel** - Every interaction should feel intentional and smooth
2. **Visual Hierarchy** - Clear information architecture with proper spacing
3. **Subtle Motion** - Purposeful animations that enhance UX without distraction
4. **Glassmorphism** - Modern blur effects on cards and overlays
5. **Consistency** - Unified patterns across all views

---

## Phase 1: Enhanced Design System (App.axaml)

### 1.1 New Color Tokens
```xml
<!-- Glassmorphism Backgrounds -->
<Color x:Key="KorGlassBase">#1A1C2666</Color>
<Color x:Key="KorGlassBorder">#FFFFFF15</Color>
<Color x:Key="KorGlassHighlight">#FFFFFF08</Color>

<!-- Glow Effects -->
<Color x:Key="KorGlowAccent">#00D4AA30</Color>
<Color x:Key="KorGlowSecondary">#8B5CF630</Color>
```

### 1.2 Enhanced Card Styles
- **Glass Cards**: Blur backdrop with subtle gradient overlay
- **Elevated Cards**: Shadow depth on hover with smooth lift animation
- **Interactive Cards**: Border glow effect on focus/hover
- **Stat Cards**: Special emphasis with gradient accents

### 1.3 New Animation Primitives
```xml
<!-- Smooth hover transitions (200-300ms) -->
<!-- Scale transforms on interactive elements -->
<!-- Border glow transitions -->
<!-- Opacity fades for loading states -->
```

### 1.4 Enhanced Typography
- Add letter-spacing tokens for headers (-0.5 to -1.5)
- Refined line-heights for body text
- Monospace styling for code/IDs

---

## Phase 2: MainWindow Enhancement

### 2.1 Sidebar Improvements
- **Gradient background** with subtle mesh pattern
- **Active nav item** with animated accent indicator (left border glow)
- **Hover states** with smooth background fade
- **Collapsed mode** option for more content space
- **Status pill** redesign with animated pulse for "Running"

### 2.2 Content Area
- Smooth **page transitions** (CrossFade 200ms)
- Proper **content padding** rhythm (32px default)

---

## Phase 3: View-by-View Redesign

### 3.1 AccountView (Priority - Currently Weakest)

**Current Issues:**
- Basic card layout without visual interest
- No proper loading/error states
- Inconsistent form styling
- Missing visual hierarchy

**Redesign:**

```
┌─────────────────────────────────────────────────────────┐
│ HEADER                                                  │
│ ┌─────────────────────────────────────┐  ┌──────────┐  │
│ │ Account                             │  │ Refresh  │  │
│ │ Manage your subscription & devices  │  └──────────┘  │
│ └─────────────────────────────────────┘                │
├─────────────────────────────────────────────────────────┤
│ TWO-COLUMN LAYOUT (when authenticated)                  │
│ ┌───────────────────────┐ ┌───────────────────────────┐│
│ │ PROFILE CARD          │ │ SUBSCRIPTION CARD         ││
│ │ ┌────┐ User Name      │ │ ┌─────────────────────┐   ││
│ │ │ Av │ user@email.com │ │ │ Plan: Pro           │   ││
│ │ └────┘                │ │ │ Status: Active ✓    │   ││
│ │                       │ │ │ Expires: Dec 2025   │   ││
│ │ [Sign Out]            │ │ │                     │   ││
│ │                       │ │ │ [Manage] [Upgrade]  │   ││
│ └───────────────────────┘ └───────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ ENTITLEMENTS CARD                                   ││
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐││
│ │ │ Plan    │ │ Scope   │ │ Limits  │ │ Grace       │││
│ │ │ Pro     │ │ User    │ │ 100k/mo │ │ 7 days      │││
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────────┘││
│ │                                                     ││
│ │ ████████████████████░░░░░░ 68% used  [Sync]        ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │ DEVICES                              [+ Register]   ││
│ │ ┌─────────────────────────────────────────────────┐││
│ │ │ 💻 MacBook Pro • macOS • This Device ✓          │││
│ │ │    Last seen: Just now              [Remove]    │││
│ │ ├─────────────────────────────────────────────────┤││
│ │ │ 🖥️ Windows Desktop • Windows 11                 │││
│ │ │    Last seen: 2 days ago            [Remove]    │││
│ │ └─────────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘

NOT AUTHENTICATED STATE:
┌─────────────────────────────────────────────────────────┐
│ CENTERED AUTH CARD (max-width: 420px)                   │
│ ┌─────────────────────────────────────────────────────┐│
│ │           ┌────────────────┐                        ││
│ │           │   KorProxy 🔐  │                        ││
│ │           └────────────────┘                        ││
│ │                                                     ││
│ │  ┌───────────────────────────────────────────────┐ ││
│ │  │ Sign In │ Create Account │  (Tab Switch)      │ ││
│ │  └───────────────────────────────────────────────┘ ││
│ │                                                     ││
│ │  Email                                              ││
│ │  ┌───────────────────────────────────────────────┐ ││
│ │  │ you@example.com                               │ ││
│ │  └───────────────────────────────────────────────┘ ││
│ │                                                     ││
│ │  Password                                           ││
│ │  ┌───────────────────────────────────────────────┐ ││
│ │  │ ••••••••••                              👁️    │ ││
│ │  └───────────────────────────────────────────────┘ ││
│ │                                                     ││
│ │  (Name field appears in Register mode)              ││
│ │                                                     ││
│ │  ┌───────────────────────────────────────────────┐ ││
│ │  │              ████ Sign In ████                │ ││
│ │  └───────────────────────────────────────────────┘ ││
│ │                                                     ││
│ │  ⚠️ Error message appears here                     ││
│ │                                                     ││
│ └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Key Enhancements:**
- Centered auth form when not logged in
- Tab-based Sign In / Register toggle
- Profile avatar placeholder with gradient background
- Stat cards grid for entitlements
- Progress bar for usage visualization
- Device list with platform icons and "This Device" indicator
- Proper loading skeleton states

### 3.2 DashboardView (Polish Existing)
- Add **animated counters** for stats
- **Sparkline mini-charts** placeholder for request trends
- Enhanced **provider status rows** with brand colors
- **Quick actions** section for common tasks

### 3.3 AccountsView (Minor Polish)
- **Staggered animation** on card appearance
- **Brand-colored icons** per provider (Claude=orange, Gemini=blue, ChatGPT=green)
- **Connection status pulse** animation

### 3.4 SettingsView (Minor Polish)
- **Section collapse/expand** animation
- **Validation feedback** on inputs
- **Save confirmation** toast/animation

### 3.5 LogsView (Minor Polish)
- **Virtual scrolling** for performance
- **Syntax highlighting** for JSON in messages
- **Level filter badges** with counts

### 3.6 ModelsView (Minor Polish)
- **Searchable** model list
- **Capability badges** (vision, function-calling, etc.)

### 3.7 IntegrationsView (Minor Polish)
- **Copy feedback** animation (checkmark)
- **One-click setup** buttons where possible

---

## Phase 4: Global Enhancements

### 4.1 Loading States
- Skeleton loaders matching content shape
- Progress indicators with branded styling
- Smooth fade transitions

### 4.2 Empty States
- Branded illustrations (simple geometric)
- Clear CTAs with primary button
- Helpful subtext

### 4.3 Error States
- Inline validation with red accents
- Banner notifications for global errors
- Retry mechanisms

### 4.4 Toast/Notification System
- Success/error/info variants
- Auto-dismiss with progress indicator
- Positioned bottom-right

---

## Implementation Order

1. **App.axaml** - Enhanced design tokens & global styles
2. **AccountView.axaml** - Complete redesign (highest impact)
3. **MainWindow.axaml** - Sidebar/navigation polish
4. **DashboardView.axaml** - Animation & stat enhancements
5. **Other Views** - Progressive polish

---

## Technical Notes

- All animations use Avalonia's `Transitions` (no external dependencies)
- Colors use existing `StaticResource` pattern
- Glassmorphism achieved via `Opacity` and `Background` layering
- Views remain MVVM-compatible (no code-behind changes needed for styling)

---

## Approval Required
This is a significant UI overhaul touching all view files. Shall I proceed with implementation starting from the design system (App.axaml) and AccountView?
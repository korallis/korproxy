# KorProxy UI Redesign: "Midnight Precision"

## Design Philosophy
Shift from "Neon/Gamer" aesthetic to **"Industrial Precision"** (VS Code, Linear, Vercel style). The app should feel like a professional dev tool cockpit - reliable, information-dense, and efficient.

---

## Phase 1: Foundation (Theme & Layout Shell)

### 1.1 New Theme System - `MidnightPrecisionTheme.axaml`
**Color Palette "Deep Space":**
```
Backgrounds:
- Surface-Base: #09090B (deepest)
- Surface-Layer: #18181B (cards, sidebar)  
- Surface-Highlight: #27272A (hover states)

Borders: #27272A (subtle), #3F3F46 (active)

Text: #FAFAFA (primary), #A1A1AA (secondary), #52525B (muted)

Accents:
- Brand/Primary: #3B82F6 (Electric Blue)
- Success: #10B981 (Emerald)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)
- Info: #8B5CF6 (Violet)
```

### 1.2 Typography
- **UI Font:** Inter (or system default)
- **Data/Code Font:** JetBrains Mono
- **Hierarchy:** H1=24px SemiBold, H2=16px Medium, Body=14px, Caption=12px Uppercase

### 1.3 Layout Shell - `MainView.axaml` Redesign
```
+------------------+--------------------------------+
| SIDEBAR (240px)  |  CONTENT AREA (fluid)          |
|                  |                                |
| [Logo]           |  [Page Header + Actions]       |
| KorProxy v1.0.x  |  ---------------------------   |
|                  |                                |
| GENERAL          |  [Scrollable Content]          |
|  Dashboard       |                                |
|  Accounts (3)    |                                |
|  Models          |                                |
|                  |                                |
| CONFIGURATION    |                                |
|  Integrations    |                                |
|  Settings        |                                |
|                  |                                |
| DIAGNOSTICS      |                                |
|  Logs            |                                |
|                  |                                |
| [User Avatar]    |                                |
+------------------+--------------------------------+
| STATUS BAR: Proxy Active on :1337    | v1.0.25   |
+-----------------------------------------------+
```

---

## Phase 2: Navigation System

### 2.1 Sidebar Navigation (`MainView.axaml`)
- **Width:** Fixed 240px
- **Groups:** GENERAL, CONFIGURATION, DIAGNOSTICS (with section headers)
- **Items:** Icon + Label (not icons-only)
- **Active State:** Left accent bar (#3B82F6) + highlighted background
- **Hover:** Background highlight + text brighten
- **Badges:** Account count, unread logs, etc.

### 2.2 Navigation Item Component
```xml
<!-- NavItem structure -->
<Border Height="40" CornerRadius="6">
  <Grid ColumnDefinitions="40,*,Auto">
    <PathIcon Width="18" /> <!-- Icon -->
    <TextBlock Text="Dashboard" /> <!-- Label -->
    <Border Classes="nav-badge" /> <!-- Optional badge -->
  </Grid>
</Border>
```

### 2.3 Bottom User Section
- User avatar (initials) + email
- Quick logout action
- Subscription badge if applicable

---

## Phase 3: Dashboard Redesign - "Command Center"

### 3.1 Top Hero Band - Global Status
```
+-------------------------------------------------------+
| [Toggle Switch]  PROXY ACTIVE                   |  24 req/min  |
| Listening on localhost:1337                     | 1.2K tok/sec |
+-------------------------------------------------------+
```
- Large toggle switch for start/stop
- Status text with port info
- Real-time throughput counters (right side)

### 3.2 Provider Health Cards Row
```
+----------------+  +----------------+  +----------------+
| [Claude Icon]  |  | [OpenAI Icon]  |  | [Gemini Icon]  |
| Claude         |  | ChatGPT        |  | Gemini         |
| ● Connected    |  | ● Connected    |  | ○ Disconnected |
| 42ms latency   |  | 38ms latency   |  | [Connect]      |
+----------------+  +----------------+  +----------------+
```
- Provider logo + name
- Status indicator (green dot = connected)
- Optional latency/health metric
- Quick action button if disconnected

### 3.3 Traffic Analytics Split
```
+-----------------------------+  +-------------------+
| REQUESTS (Last 24h)         |  | RECENT ACTIVITY   |
| [Sparkline Chart]           |  | POST /v1/chat...  |
|                             |  | 200 ● Claude      |
| 1,247 total | +12% vs prev  |  | POST /v1/chat...  |
+-----------------------------+  | 200 ● OpenAI      |
                                 | [View All Logs →] |
+-----------------------------+  +-------------------+
| TOKENS (Last 24h)           |
| [Sparkline Chart]           |
| 98.4K total | +8% vs prev   |
+-----------------------------+
```

---

## Phase 4: View Redesigns

### 4.1 Accounts View
- Card grid layout for providers
- Each card: Logo, Provider name, Connection status, Email, Expiry, Actions
- "Connect" CTA for disconnected providers
- Visual hierarchy: Connected accounts first, then disconnected

### 4.2 Models View
- Grouped by provider with collapsible sections
- Search/filter bar at top
- Model cards: ID (monospace), display name, type badge

### 4.3 Integrations View
- Clear sections for each CLI tool
- Copy-to-clipboard buttons with visual feedback
- Proxy endpoint prominently displayed at top

### 4.4 Settings View
- Grouped settings with section headers
- Consistent row layout: Label + Description + Control
- Save button fixed at bottom when changes exist

### 4.5 Logs View
- Fixed header with filters (level, search)
- Virtualized log list for performance
- Color-coded log levels (error=red, warn=amber, info=blue)
- Timestamp + Level + Source + Message columns
- Monospace font for log content

---

## Phase 5: Animations & Polish

### 5.1 Transitions
- **Page transitions:** 150ms opacity fade
- **Button press:** 98% scale on click
- **Hover states:** 150ms background transitions

### 5.2 Status Indicators
- **Breathing pulse:** Slow pulse on "active" status dots
- **Toggle switch:** Spring physics animation

### 5.3 List Animations
- New log entries slide in from bottom
- Card hover: subtle border color shift

---

## Files to Create/Modify

### New Files:
1. `src/KorProxy/Styles/MidnightPrecisionTheme.axaml` - New theme
2. `src/KorProxy/Views/Components/NavItem.axaml` - Navigation item template
3. `src/KorProxy/Views/Components/StatusBar.axaml` - Bottom status bar
4. `src/KorProxy/Views/Components/ProviderHealthCard.axaml` - Provider status card

### Modified Files:
1. `src/KorProxy/App.axaml` - Switch to new theme, update styles
2. `src/KorProxy/Views/AppShellView.axaml` - Add status bar
3. `src/KorProxy/Views/MainView.axaml` - Complete sidebar redesign
4. `src/KorProxy/Views/DashboardView.axaml` - Command center layout
5. `src/KorProxy/Views/AccountsView.axaml` - Updated card design
6. `src/KorProxy/Views/ModelsView.axaml` - Search + grouped layout
7. `src/KorProxy/Views/IntegrationsView.axaml` - Cleaner sections
8. `src/KorProxy/Views/SettingsView.axaml` - Consistent row layout
9. `src/KorProxy/Views/LogsView.axaml` - Performance + styling
10. `src/KorProxy/Views/LoginView.axaml` - Match new theme
11. `src/KorProxy/Views/OnboardingView.axaml` - Match new theme
12. `src/KorProxy/ViewModels/MainWindowViewModel.cs` - Navigation groups
13. `src/KorProxy/ViewModels/NavigationItem.cs` - Add group/badge support

---

## Implementation Order

1. **Theme Foundation** - Create `MidnightPrecisionTheme.axaml`, update `App.axaml`
2. **Layout Shell** - Redesign `MainView.axaml` with 240px labeled sidebar
3. **Status Bar** - Add global status bar to `AppShellView.axaml`
4. **Dashboard** - Implement "Command Center" layout
5. **Provider Health Cards** - Create reusable component
6. **Remaining Views** - Apply consistent styling across all views
7. **Animations** - Add transitions and micro-interactions
8. **Polish** - Test, refine spacing, ensure all states work

---

## Key Differentiators from Current UI

| Aspect | Current (Neon Tech) | New (Midnight Precision) |
|--------|---------------------|--------------------------|
| **Nav Width** | 80px icons-only | 240px with labels |
| **Nav Groups** | None | GENERAL, CONFIG, DIAGNOSTICS |
| **Colors** | Cyan/Purple glow | Blue accent, muted grays |
| **Dashboard** | Generic cards | Status band + Health + Activity |
| **Typography** | Monospace everywhere | Inter UI + JetBrains Mono data |
| **Status** | Small dot in sidebar | Global status bar + hero section |
| **Cards** | Glow effects | Clean borders, no shadows |
| **Feel** | Gaming/Cyberpunk | Professional/Industrial |

This redesign transforms KorProxy from a "cool app" into **reliable infrastructure** that developers will trust and use daily.
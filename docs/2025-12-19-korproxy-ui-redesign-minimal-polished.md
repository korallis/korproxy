# KorProxy UI Redesign: Minimal & Polished

## Problems with Current UI

1. **Over-designed** - Too many elements competing for attention (gradients, colored accents everywhere, badges, section headers)
2. **Busy navigation** - 240px sidebar with uppercase section headers ("GENERAL", "CONFIGURATION") feels corporate and dated
3. **Too much visual hierarchy** - Metric labels with letter-spacing, colored numbers, multiple font weights
4. **Card overload** - Everything is in a card with borders, padding, and hover states
5. **Inconsistent density** - Some areas too spacious, others too cramped

---

## Design Philosophy: "Quiet Confidence"

**Reference:** Linear, Raycast, Arc Browser, Apple System Preferences

**Core Principles:**
- **Invisible design** - UI should disappear, content should speak
- **Monochrome first** - Color only for status/action, never decoration
- **Single accent** - One color (subtle), used sparingly
- **Generous whitespace** - Let elements breathe
- **System fonts** - Native feel, no custom fonts

---

## Color Palette (Simplified)

```
Background:     #0A0A0B (near black)
Surface:        #141415 (cards/elevated)
Border:         #1F1F22 (very subtle)
Border Hover:   #2A2A2E

Text Primary:   #EDEDEF (off-white)
Text Secondary: #7A7A7F (muted)
Text Tertiary:  #4A4A4E (very muted)

Accent:         #6366F1 (indigo, used sparingly)
Success:        #22C55E (green, status only)
Error:          #EF4444 (red, status only)
```

---

## Layout Changes

### Navigation (Collapsed, 56px)
- **Icon-only by default**, no labels
- No section headers
- Minimal 6 items max
- Selected state: subtle background, no accent bar
- Tooltip on hover for labels

### Dashboard (Minimal Stats)
- **Single status line** at top: "Proxy Running · localhost:1337"
- **Two numbers only**: Requests today, Tokens used
- **Provider list**: Simple rows, no cards
- No "Quick Stats" panel, no time range selectors

### Accounts
- **Simple list**, not cards in a grid
- Provider icon, name, status dot, action button
- One line per provider

---

## Component Simplification

### Buttons
- **Primary**: Solid indigo, no gradients
- **Secondary**: Ghost with border
- **Danger**: Ghost with red text
- Uniform 32px height, 12px padding

### Cards
- Remove almost all cards
- Use subtle 1px borders only when grouping
- No hover states on non-interactive elements

### Typography
- **Page titles**: 18px, medium weight
- **Body**: 14px, regular
- **Small**: 12px, muted color
- No uppercase labels, no letter-spacing tricks

---

## File Changes

| File | Change |
|------|--------|
| `App.axaml` | Simplified color palette, remove gradients |
| `MainView.axaml` | 56px icon-only nav, remove section headers |
| `DashboardView.axaml` | Single status bar, minimal stats row |
| `AccountsView.axaml` | List view, not card grid |
| `MidnightPrecisionTheme.axaml` | Delete (replace with inline minimal styles) |

---

## Visual Comparison

| Current | Proposed |
|---------|----------|
| 240px labeled sidebar | 56px icon sidebar |
| Gradient logo box | Simple text "K" |
| UPPERCASE SECTIONS | None |
| Cards with borders + hover | Flat rows |
| Blue/violet accent everywhere | Indigo accent, status only |
| JetBrains Mono numbers | System monospace |
| 24px page titles | 18px page titles |
| Provider "cards" with details | Provider rows |

---

## Implementation Order

1. **App.axaml** - New minimal color palette
2. **MainView.axaml** - Collapsed icon nav
3. **DashboardView.axaml** - Minimal status + stats
4. **AccountsView.axaml** - List view
5. **Remove** MidnightPrecisionTheme.axaml
6. **Test** and verify all views render

---

Ready to implement this minimal, polished design?
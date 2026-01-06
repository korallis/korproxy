# KorProxy UI/UX Redesign Specification: "Midnight Precision"

## 1. Design Philosophy: "Industrial Precision"
Shift away from the "Gamer/Neon" aesthetic to a **"Pro-Tool"** aesthetic. Think VS Code, Linear, or Vercel dashboard. The design should communicate stability, speed, and transparency.
*   **Keywords:** Utility, Density, Clarity, Stealth.
*   **Concept:** The app is a "cockpit" for AI traffic. It should feel like high-end instrumentation.
*   **Visual Style:** Flat design with subtle depth (borders over shadows), high contrast, strict alignment.

## 2. Layout Architecture
Adopt a classic "Shell" layout optimized for desktop usage.

*   **Sidebar (Left, Fixed, 240px):** Primary navigation. Always visible. Contains App Logo, Navigation Groups, and User Profile at the bottom.
*   **Title Bar (Top, 40px):** Drag region, integrated search/command palette trigger, window controls.
*   **Main Content Area (Fluid):** The primary workspace.
    *   **Header (Within Content):** Page Title, Contextual Actions (e.g., "Refresh", "Add Account"), Breadcrumbs.
    *   **Scrollable Body:** The view content.
*   **Status Bar (Bottom, 24px - Optional):** Global proxy status (e.g., "Proxy: Listening on :1337"), version number, quick health indicator.

## 3. Color Palette: "Deep Space & Signal Lights"
Developers prefer dark modes that are easy on the eyes for long periods. Avoid "pure black" (#000000) in favor of deep grays/blues to reduce eye strain.

*   **Backgrounds:**
    *   `Surface-Base`: #09090B (Deepest gray, almost black)
    *   `Surface-Layer`: #18181B (Card backgrounds, sidebar)
    *   `Surface-Highlight`: #27272A (Hover states, inputs)
*   **Borders:**
    *   `Border-Subtle`: #27272A
    *   `Border-Active`: #3F3F46
*   **Text:**
    *   `Text-Primary`: #FAFAFA (White, 98% opacity)
    *   `Text-Secondary`: #A1A1AA (Gray, 60% opacity)
    *   `Text-Muted`: #52525B (Dark Gray, 40% opacity)
*   **Accents (Functional Colors):**
    *   `Brand/Primary`: #3B82F6 (Electric Blue - distinct but professional)
    *   `Success`: #10B981 (Emerald Green - for "Online/Active")
    *   `Warning`: #F59E0B (Amber - for "Rate Limited")
    *   `Error`: #EF4444 (Red - for "Disconnected")
    *   `Info/Data`: #8B5CF6 (Violet - for tokens/analytics)

## 4. Typography Strategy
Mix a clean sans-serif for UI with a monospaced font for data/logs to reinforce the "technical tool" feel.

*   **Primary Font (UI):** `Inter` or system default (San Francisco on macOS, Segoe UI on Windows).
    *   **Weights:** Regular (400) for body, Medium (500) for navigation, Semibold (600) for headers.
*   **Secondary Font (Data/Code):** `JetBrains Mono` or `Consolas`.
    *   Used for: Port numbers, API keys, Log entries, JSON payloads, Token counts.
*   **Hierarchy:**
    *   `H1` (Page Title): 24px, Semibold.
    *   `H2` (Section Header): 16px, Medium, Text-Secondary color.
    *   `Body`: 14px, Regular.
    *   `Caption/Label`: 12px, Medium, Uppercase + Tracking (spaced out).

## 5. Component Design

### Navigation
*   **Structure:** Vertical list.
*   **Item State:**
    *   *Default:* Icon + Text (Text-Secondary), transparent background.
    *   *Hover:* Text-Primary, Surface-Highlight background.
    *   *Active:* Text-Primary, Brand-colored vertical bar on left edge, Surface-Layer background.
*   **Grouping:** separating "Core" (Dashboard, Accounts, Integrations) from "System" (Logs, Settings).

### Cards (Dashboard/Lists)
*   **Style:** No drop shadows. Use 1px borders (`Border-Subtle`) on `Surface-Layer` background.
*   **Interaction:** Subtle border color change to `Border-Active` on hover.
*   **Header:** Icon + Title (Left), Action/Status (Right).

### Data Display (Metrics)
*   **Format:** Label (top, muted, uppercase) -> Value (large, monospace) -> Trend (small, green/red arrow).
*   **Sparklines:** Simple SVG line charts inside cards to show activity over time (e.g., Request Volume).

### Buttons
*   **Primary:** Brand background, White text. Slight border radius (4px - 6px).
*   **Secondary:** Transparent background, Border-Subtle, Text-Primary.
*   **Ghost/Icon:** Transparent, Text-Secondary -> Text-Primary on hover.

## 6. Animation Recommendations
Keep it snappy. Developers hate waiting for animations to finish.

*   **Transitions:** Fast opacity fades (150ms) when switching tabs.
*   **Micro-interactions:**
    *   Buttons scale down slightly (98%) on click.
    *   Toggle switches slide smoothly (spring physics).
    *   Status indicators (green dots) pulse slowly (breathing effect) to show "alive" state.
*   **Lists:** When adding a new item (e.g., log entry), slide in from top/bottom quickly.

## 7. Dashboard Redesign
Move from "Generic Grid" to "Command Center".

1.  **Top Band (Hero): Global Status**
    *   **Left:** Big "Proxy Status" indicator. Toggle Switch (Large). Text: "Active - Listening on :1337".
    *   **Right:** Real-time throughput (e.g., "24 req/min", "1.2k tokens/sec").
2.  **Middle Band: Provider Health**
    *   A row of smaller cards for each connected provider (Claude, OpenAI, Google).
    *   Visual: Logo + Status Dot + Response Time (ms).
    *   *Quick Action:* "Reconnect" button if auth fails.
3.  **Bottom Area: Recent Traffic**
    *   Split view:
        *   **Left (60%):** Activity Chart (Requests over last hour).
        *   **Right (40%):** "Live Stream" preview of the last 3-5 requests (Method, Path, Status Code). Click "View Logs" to see more.

## 8. Navigation Redesign (Detailed)

**Sidebar Structure:**

*   **Header:** [App Icon] **KorProxy** (Badge: `v1.0.2`)
*   **Section: GENERAL**
    *   [Icon: LayoutDashboard] **Dashboard**
    *   [Icon: Users] **Accounts** (Badge: Number of connected accts)
    *   [Icon: Box] **Models**
*   **Section: CONFIGURATION**
    *   [Icon: Terminal] **Integrations**
    *   [Icon: Shield] **Rules/Routing** (Future proofing)
    *   [Icon: Settings] **Settings**
*   **Section: DIAGNOSTICS**
    *   [Icon: Activity] **Logs**
*   **Footer:**
    *   [User Avatar] [Username]
    *   [Settings Gear - Quick Access]

## Summary of Changes from Current State
| Feature | Current (Neon/Gamer) | Proposed (Industrial/Pro) |
| :--- | :--- | :--- |
| **Theme** | Dark + Neon Glows | Matte Dark + Subtle Borders |
| **Nav** | Icons Only | Icons + Labels + Grouping |
| **Typography** | Generic Sans | Inter + JetBrains Mono |
| **Dashboard** | Unstructured Widgets | Hierarchy: Status -> Health -> Activity |
| **Vibe** | "Cool App" | "Reliable Infrastructure" |

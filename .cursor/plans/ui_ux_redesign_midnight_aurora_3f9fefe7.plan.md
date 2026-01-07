---
name: "UI/UX Redesign: Midnight Aurora"
overview: A complete visual overhaul of the desktop application to implement a "Midnight Aurora" design language. This plan replaces the flat dark theme with a layered depth system using simulated mesh gradients, true glassmorphism, and a high-density "Mission Control" dashboard layout.
todos:
  - id: assets
    content: Create assets/NoiseTexture.png (or use base64 data URI) for glass texture
    status: pending
  - id: theme-colors
    content: Rewrite Colors.axaml with "Deep Space" Slate/Teal palette
    status: pending
  - id: styles-core
    content: Implement MeshGradient and GlassCard styles in Controls.axaml
    status: pending
    dependencies:
      - theme-colors
  - id: shell-bg
    content: Add Mesh Gradient Background layer to AppShellView.axaml
    status: pending
    dependencies:
      - styles-core
  - id: layout-sidebar
    content: Implement Floating Dock Sidebar in MainView.axaml
    status: pending
    dependencies:
      - styles-core
  - id: dashboard-grid
    content: Refactor DashboardView.axaml to "Bento Grid" layout
    status: pending
    dependencies:
      - layout-sidebar
  - id: polish-anim
    content: Add shimmer loading effects and transition animations
    status: pending
    dependencies:
      - dashboard-grid
---

# UI/UX Redesign: Midnight Aurora

This plan outlines the transformation of KorProxy into a "Midnight Aurora" aesthetic, focusing on depth, lighting, and polished interactivity. We will move from a flat dark theme to a layered, translucent interface.

## 1. Design Language: "Midnight Aurora"

### 1.1 Color Palette

We will replace the "Void Black" (`#050505`) with a "Deep Space" slate palette to reduce eye strain and increase perceived depth.

- **Background Deep:** `#030712` (Rich, cool black) -> replaces `MidnightDeep`
- **Background Surface:** `#0F172A` (Slate 900) -> replaces `MidnightBase`
- **Glass Tint:** `#1E293B` (Slate 800) with 40-60% Opacity
- **Accents:**
- **Aurora Teal:** `#2DD4BF` (Teal 400) - Primary Action
- **Nebula Purple:** `#818CF8` (Indigo 400) - Secondary/Gradients
- **Starlight:** `#F8FAFC` (Slate 50) - Primary Text

### 1.2 Visual Effects (The "Polished" Look)

Instead of flat colors, we will implement:

- **Mesh Gradients:** A background layer composed of 3-4 large, animated `Ellipse` shapes with `RadialGradientBrush` and high `Blur` effects (`Effect="blur(120)"`), creating a subtle, shifting aurora background.
- **True Glass:** A layered approach for cards:

1.  **Backdrop:** Semi-transparent distinct color (`#10FFFFFF`)
2.  **Border:** Linear Gradient (Top-Left White -> Bottom-Right Transparent) to simulate a light source.
3.  **Noise:** A generic "noise.png" tile (optional, or simulated via opacity layers) to add texture.
4.  **Shadow:** Colored, diffused shadows (`BoxShadow="0 10 40 -10 #40000000"`) for elevation.

## 2. Core Components Overhaul

### 2.1 The "Floating Dock" Sidebar ([MainView.axaml](src/KorProxy/Views/MainView.axaml))

- **Current:** Rigid 56px strip attached to the left.
- **New:** A floating "Dock" pill, detached from the window edges.
- **Glass Panel:** Fully transparent blur background.
- **Active Indicator:** Glowing "pill" behind the active icon, not just a color change.
- **Tooltips:** Custom-styled dark tooltips with instant appearance.

### 2.2 Dashboard "Mission Control" ([DashboardView.axaml](src/KorProxy/Views/DashboardView.axaml))

- **Grid Layout:** Switch to a **Bento Grid** layout (asymmetrical grid) rather than equal columns.
- **Hero Card:** "Proxy Status" becomes a wide card (ColSpan 2) combining status, uptime, and a mini-chart.
- **Metrics:** Compact "Sparkline" cards for Requests/Tokens.
- **Typography:**
- Use `FontWeight.Light` for large numbers (Display style).
- Use monospaced fonts (`JetBrains Mono`) for data values (IDs, IPs, Ports) to reinforce the "Engineer Tool" vibe.

### 2.3 Input & Interactive Elements ([Controls.axaml](src/KorProxy/Styles/MidnightPrecision/Controls.axaml))

- **Inputs:** "Sunk" styling (Inner Shadow) instead of flat borders.
- **Buttons:**
- **Primary:** Gradient background + Bottom Inner Shadow (highlight) + Drop Shadow (glow).
- **Secondary:** Glass background + Border Gradient.

## 3. Implementation Strategy

### Phase 1: Foundation

1.  **Assets:** Create `NoiseTexture.png` (programmatically or embedded resource) for glass texture.
2.  **Theme Resources:** Rewrite `Colors.axaml` and `Brushes.axaml` with the new Slate/Teal palette.
3.  **Styles:** Implement the `GlassCard`, `MeshBackground`, and `NeonButton` control themes in `Controls.axaml`.

### Phase 2: Shell & Layout

4.  **App Shell:** Update `AppShellView.axaml` to include the global **Mesh Gradient Background** layer behind all content.
5.  **Main Layout:** Refactor `MainView.axaml` to implement the Floating Dock sidebar.

### Phase 3: Dashboard Remodel

6.  **Bento Grid:** Rewrite `DashboardView.axaml` using `Grid` with explicit Row/Col definitions for the asymmetrical layout.
7.  **Data Viz:** Implement simple "Sparkline" paths using `Path` geometry for the metric cards (simulated data visualization).
# KorProxy UI Redesign: "Neon Tech" Specification

## 1. Executive Summary
The goal is to replace the current "Standard Dark Mode" UI with a radical **"Neon Tech" / Cyberpunk** aesthetic. The new interface will feature high-contrast neon accents, glassmorphism, glowing elements, and a "HUD-style" dashboard layout. This is a complete rebrand, moving away from standard FluentAvalonia visuals to a custom, highly polished look.

## 2. Design Language: "Neon Nexus"

### 2.1 Color Palette
*   **Backgrounds:**
    *   `DeepVoid`: `#050508` (Main app background - near black)
    *   `GlassPanel`: `#1A1A24` (Semi-transparent card background with 60% opacity)
*   **Accents:**
    *   `CyberCyan`: `#00F3FF` (Primary Action / Brand)
    *   `NeonPurple`: `#BC13FE` (Secondary / Gradients)
    *   `MatrixGreen`: `#00FF94` (Success / Online Status)
    *   `AlertRed`: `#FF2A6D` (Error / Offline)
*   **Typography:**
    *   Primary: `Inter` (Clean sans-serif for body)
    *   Headers/Data: `JetBrains Mono` / `Consolas` / `Menlo` (Monospace for that "Terminal/Tech" feel)

### 2.2 Visual Effects
*   **Glows:** Heavy use of `BoxShadow` (simulated via Border Shadow property in Avalonia 11) for active elements.
*   **Glass:** `Mica` or `AcrylicBlur` window transparency, with overlaid semi-transparent dark panels.
*   **Borders:** 1px borders with subtle gradients or low-opacity white (`#FFFFFF20`) to define edges in the dark.

## 3. Component Architecture

### 3.1 Layout Strategy (MainView)
*   **Removal:** Deprecate the standard `ui:NavigationView` sidebar.
*   **New Structure:** "Floating Dock" layout.
    *   **Sidebar:** A detached, floating glass pill on the left side (width ~60px -> expands on hover).
    *   **Header:** Minimalist top bar, integrated into the window title area. No standard title bar.
    *   **Content Area:** A "Viewport" frame with a subtle CRT scanline overlay (optional) or just deep depth.

### 3.2 Dashboard (HUD)
*   **Concept:** "Mission Control"
*   **Widgets:**
    *   **Status Ring:** Custom circular progress indicator for Proxy Status.
    *   **Traffic Stream:** A horizontal "heartbeat" style graph (implemented via `Path`) for request volume.
    *   **Metrics Grid:** Monospace digital counters for "Total Requests", "Tokens", "Uptime".
    *   **Provider Grid:** Instead of a list, a grid of "Cards" that light up (Green border) when connected.

## 4. Implementation Plan

### Step 1: The Foundation
*   Create `src/KorProxy/Styles/NeonTechTheme.axaml`.
*   Define all Brush resources (`SolidColorBrush`, `LinearGradientBrush`) and `ControlTheme` overrides.
*   Remove `MidnightAuroraTheme.axaml` references from `App.axaml`.

### Step 2: The Shell (Window)
*   Update `AppShellView.axaml` to maximize transparency (`TransparencyLevelHint="AcrylicBlur"`).
*   Set Window background to `Transparent` to allow the Theme's glass effect to work.

### Step 3: The Navigation (MainView)
*   Rebuild `MainView.axaml`.
*   Implement `Grid` layout: `ColumnDefinitions="Auto, *"`
*   Create a custom sidebar using a `Border` with `CornerRadius="20"` (Pill shape) and `BoxShadow`.
*   Implement custom navigation buttons (`CyberNavButton` style).

### Step 4: The Dashboard (DashboardView)
*   Rebuild `DashboardView.axaml`.
*   Implement "GlassCard" style: `Border` with `Background="{DynamicResource GlassPanel}"`, `CornerRadius="16"`, `BorderBrush="#33FFFFFF"`.
*   Replace standard text with Monospace "Data" text styles.
*   Add visual flair: "Online" indicators that actually glow (using nested borders with opacity).

## 5. Technical Considerations
*   **No New Dependencies:** We will use standard Avalonia shapes (`Path`, `Ellipse`, `Rectangle`) for charts to avoid bloat.
*   **Performance:** Shadow effects can be expensive. We will apply them selectively (hover states, primary buttons).
*   **Fonts:** We will rely on system monospace fonts for the tech look to avoid bundling issues, unless `Avalonia.Fonts.Inter` is sufficient (it is installed).

## 6. Verification
*   Build and run.
*   Check for "Pink" backgrounds (resource missing errors).
*   Verify navigation switching works with the new custom sidebar.

## 7. Next Steps Document
*   A `NEXTSTEPS.md` file will be created to track the migration and allow rollback if needed.

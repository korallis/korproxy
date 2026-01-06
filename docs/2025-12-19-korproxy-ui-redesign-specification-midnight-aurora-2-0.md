# KorProxy UI Redesign Specification: "Midnight Aurora 2.0"

This plan outlines a complete interface rebuild for the KorProxy desktop application to deliver a sleek, modern, and native experience leveraging Fluent Design principles.

## 1. Design Philosophy
- **Modern Native Feel**: Move away from "web-like" custom styling to native platform materials (Mica/Acrylic) and controls.
- **Fluent Navigation**: Replace the static sidebar with a standard `NavigationView` for robust, accessible, and animated routing.
- **"Midnight Aurora" Evolution**: Deepen the current teal/dark theme by integrating it directly into the `FluentAvaloniaTheme` resource system rather than manual style classes.

## 2. Core Architecture Changes

### A. Main Window & Shell (`MainWindow.axaml` & `MainView.axaml`)
**Current:** Custom Grid with `240,*` columns and manual Sidebar implementation.
**New:**
- **Window**: Use `Window` with `TransparencyLevelHint="Mica, AcrylicBlur"` and `ExtendClientAreaToDecorationsHint="True"`.
- **Shell**: Implement `ui:NavigationView` from `FluentAvaloniaUI`.
  - **Pane**: Collapsible, adaptive navigation pane.
  - **Header**: Integrated "KorProxy" branding.
  - **Footer**: User profile and proxy controls (Start/Stop) integrated into the pane footer.

### B. Theme System (`App.axaml`)
**Current:** Manual `ResourceDictionary` with `Kor*` keys and manual Styles.
**New:**
- Initialize `FluentAvaloniaTheme`.
- Override `SystemAccentColor` to `#00D4AA` (Teal).
- Define "Semantic" resources that map to Fluent brushes (e.g., `CardBackground` -> `LayerFillColorDefaultBrush`).
- Remove manual `kor-primary`, `kor-card` styles in favor of native ControlThemes with lightweight overrides.

## 3. Component Redesign

### Dashboard (`DashboardView.axaml`)
- **Hero Section**: A large, welcoming header with the user's name and status.
- **Glass Cards**: Use `Border` with `Background="{DynamicResource SolidBackgroundFillColorBaseBrush}"` and subtle transparency.
- **Status Pulse**: A high-quality "heartbeat" animation for the proxy status.
- **Metrics**: Clean, minimalist stat cards for Requests and Tokens.

## 4. Implementation Steps

### Step 1: Theme & Resources Setup
- Update `App.axaml` to initialize `FluentAvaloniaTheme`.
- Create `Styles/MidnightAuroraTheme.axaml` to handle color overrides cleanly.

### Step 2: Main Window Transformation
- Refactor `MainWindow.axaml` to enable Mica and remove the old grid layout.
- Implement `NavigationView` binding to `MainWindowViewModel.NavigationItems`.

### Step 3: Dashboard Rebuild
- Rewrite `DashboardView.axaml` using the new design system.

### Step 4: Verification
- Verify navigation works correctly with the existing ViewModel.
- Check dark mode consistency and transparency effects.

## Code Preview (MainWindow.axaml)

```xml
<Window ...
        TransparencyLevelHint="Mica, AcrylicBlur"
        Background="Transparent"
        ExtendClientAreaToDecorationsHint="True">
    
    <ui:NavigationView PaneDisplayMode="Left"
                       IsSettingsVisible="False"
                       MenuItemsSource="{Binding NavigationItems}"
                       SelectedItem="{Binding SelectedNavItem}"
                       Content="{Binding CurrentPage}">
        <ui:NavigationView.PaneHeader>
            <!-- Branding -->
        </ui:NavigationView.PaneHeader>
        
        <ui:NavigationView.PaneFooter>
             <!-- Profile & Proxy Controls -->
        </ui:NavigationView.PaneFooter>
    </ui:NavigationView>
</Window>
```

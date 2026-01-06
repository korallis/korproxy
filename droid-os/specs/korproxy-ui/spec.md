# Specification: KorProxy Desktop UI Rebuild

## Goal
Rebuild the KorProxy Avalonia/.NET desktop application UI with complete authentication flows, subscription gating, onboarding wizard, and proper app state management while leveraging existing backend services (AuthService, EntitlementService, SessionStore).

## User Stories
- As a new user, I want to create an account and be guided through setup so that I can start using KorProxy quickly
- As a returning user, I want the app to automatically log me in so that I can immediately start the proxy without friction
- As a trial user, I want to see my remaining trial days so that I know when to upgrade my subscription

## Specific Requirements

**App Shell State Machine**
- Implement root `AppShellViewModel` that manages five app states: Loading, Unauthenticated, SubscriptionExpired, Onboarding, Ready
- On app startup, call `AuthService.LoadSessionAsync()` to check for existing session
- If no session exists, transition to Unauthenticated state showing LoginView
- If session exists but subscription is expired/invalid, transition to SubscriptionExpired state
- Track first-run status via settings to trigger Onboarding flow for new users
- Use `SessionChanged` event from AuthService to handle logout/session invalidation reactively
- Implement state transitions with 200-300ms fade animations for polish

**Login View**
- Create `LoginViewModel` with email and password fields using ObservableProperty pattern
- Implement `LoginCommand` that calls `AuthService.LoginAsync(email, password)`
- Display loading state during authentication request
- Show validation errors inline (empty fields, invalid email format)
- Handle AuthResult.Error messages from backend with user-friendly display
- Include "Forgot Password" link that opens korproxy.com/forgot-password in system browser
- Include "Create Account" link to navigate to RegisterView
- Use existing `kor-input`, `kor-primary` button styles from App.axaml

**Register View**
- Create `RegisterViewModel` with email, password, confirmPassword, and name fields
- Implement `RegisterCommand` that calls `AuthService.RegisterAsync(email, password, name)`
- Validate password confirmation matches before submission
- Minimum password length validation (8 characters)
- Display loading state and handle registration errors
- Auto-login on successful registration and transition to Onboarding
- Include "Already have an account?" link back to LoginView

**Onboarding Wizard**
- Replace existing incomplete `FirstRunWizardViewModel` with full onboarding flow
- Implement 6 wizard steps: Welcome → SignUp/Login → ConnectProviders → ConfigureTools → TestConnection → Complete
- Welcome step: KorProxy branding, value proposition copy, teal accent gradient logo
- ConnectProviders step: Show Claude, ChatGPT, Gemini cards with "Connect" buttons that open OAuth in browser
- ConfigureTools step: Display configuration snippets for Cursor, Cline, Windsurf, Continue with copy buttons
- TestConnection step: Start proxy, make test request, show success/failure status
- Complete step: Summary of connected providers, "Get Started" button to transition to Ready state
- Persist onboarding completion in settings to skip on subsequent launches

**Subscription Status Display**
- Add subscription badge to sidebar header showing current plan (Free/Pro/Team/Trial)
- Display trial countdown ("5 days left") for Trial status using `SubscriptionInfo.DaysLeft`
- Show warning badge for PastDue status with "Update Payment" link to korproxy.com/billing
- Use existing `kor-badge-success`, `kor-badge-warning`, `kor-badge-error` styles
- Update MainWindowViewModel to include subscription info from AuthSession

**Subscription Gating**
- Modify proxy start flow to check subscription status via existing `ISubscriptionGate.CanStartProxy()`
- Block proxy start for Expired, NoSubscription, and Canceled statuses
- Display upgrade prompt modal when gating triggers with link to korproxy.com/pricing
- For PastDue status, show grace period warning but allow proxy operation
- Show in-app notification banner for accounts approaching trial end (≤3 days)

**Provider OAuth Flows**
- Create `ProviderConnectionService` to manage OAuth flow state
- Open system browser for provider OAuth URLs (Claude, ChatGPT, Gemini)
- Register `korproxy://` deep link handler to receive OAuth callbacks
- Store received tokens via `ManagementApiClient` provider endpoints
- Update AccountsView to show connection status per provider with Connect/Disconnect buttons
- Handle OAuth errors with user-friendly messages and retry options

**Updated Sidebar Navigation**
- Modify existing sidebar to include user profile section at bottom
- Display user email and avatar placeholder from `AuthSession.User`
- Add "Logout" button that calls `AuthService.LogoutAsync()` and transitions to Unauthenticated
- Show subscription badge inline with user info
- Keep existing navigation items: Dashboard, Models, Accounts, Integrations, Settings, Logs

**Error Handling Patterns**
- Create `ErrorDisplayService` for consistent error presentation across views
- Implement toast/notification system for transient errors (network timeouts, API failures)
- Display inline validation errors on forms using consistent red border and error text styling
- Handle session expiration globally by catching 401 responses and triggering re-authentication
- Log errors via existing ILogger infrastructure for debugging

## Visual Design
No visual mockups provided. Follow existing "Midnight Aurora" design system defined in App.axaml:
- Background hierarchy: KorBgDeep → KorBgBase → KorBgElevated → KorBgCard
- Primary accent: #00D4AA (teal), Secondary: #8B5CF6 (violet)
- Card styling: `kor-card-static` class with KorBorderDefault border
- Button styles: `kor-primary` (teal), `kor-secondary` (surface), `kor-ghost` (transparent)
- Input styling: `kor-input` class with focus state accent border
- Typography: `kor-heading-lg`, `kor-body`, `kor-caption` text styles
- Transitions: 200ms for hover states, 300ms for page transitions

## Existing Code to Leverage

**AuthService (Infrastructure/Services/AuthService.cs)**
- Fully implemented LoginAsync, RegisterAsync, LogoutAsync, LoadSessionAsync methods
- SessionChanged event for reactive session state handling
- BuildSessionAsync retrieves user profile and subscription info from Convex backend
- Use directly in new ViewModels without modification

**SessionStore (Infrastructure/Services/SessionStore.cs)**
- Handles token persistence via ISecureStorage abstraction
- LoadTokenAsync/SaveTokenAsync/ClearTokenAsync for session management
- Already integrated with AuthService, no direct usage needed in ViewModels

**EntitlementService (Infrastructure/Services/EntitlementService.cs)**
- Provides entitlement cache with plan limits and status
- CacheChanged event for reactive updates when entitlements change
- CheckFeature/CheckLimit methods for feature gating (use for future feature flags)

**MainWindowViewModel (ViewModels/MainWindowViewModel.cs)**
- Existing navigation pattern with ObservableCollection<NavigationItem>
- Page switching via ContentControl bound to CurrentPage
- ToggleProxyCommand already integrates with SubscriptionGate
- Extend to add user profile section and logout functionality

**App.axaml Design System**
- Complete color palette, brushes, and style definitions already in place
- Reuse all existing styles: kor-card, kor-primary, kor-secondary, kor-input, kor-badge-*
- Follow established patterns for new views to maintain visual consistency

## Out of Scope
- Password reset flow in-app (redirect to web only)
- Two-factor authentication
- Social login (Google, GitHub, etc.)
- In-app payment processing (redirect to Stripe via web)
- Offline mode / cached authentication
- Multi-language / internationalization
- Custom theming / light mode
- Keyboard shortcut customization
- Accessibility audit and screen reader optimization
- Unit tests for new ViewModels (defer to testing phase)

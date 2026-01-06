# Task Breakdown: KorProxy Desktop UI Rebuild

## Overview
Total Tasks: 45 tasks across 4 phases

This task list implements a complete UI rebuild for KorProxy's Avalonia/.NET desktop application, including authentication flows, subscription gating, onboarding wizard, and proper app state management.

## Tech Stack
- **Framework:** .NET 8, Avalonia 11
- **Pattern:** MVVM with CommunityToolkit.Mvvm
- **DI:** Microsoft.Extensions.DependencyInjection
- **Styling:** "Midnight Aurora" dark theme (App.axaml design system)

## Existing Services (No Modifications Needed)
- `AuthService` - Login, register, logout, session management
- `EntitlementService` - Subscription/entitlement checking
- `SessionStore` - Token persistence via ISecureStorage
- `SubscriptionGate` - Proxy start authorization
- `ManagementApiClient` - Provider management API

---

## Task List

### Phase 1: Core Authentication & App Shell

#### Task Group 1.0: App Shell State Machine
**Dependencies:** None

- [ ] 1.0 Complete App Shell State Machine
  - [ ] 1.1 Write 4-6 focused tests for AppShellViewModel state transitions
    - Test Loading → Unauthenticated transition when no session exists
    - Test Loading → Ready transition when valid session exists
    - Test Ready → Unauthenticated transition on logout/session invalidation
    - Test Unauthenticated → Onboarding transition after first login
    - Test SubscriptionExpired state when subscription is invalid
  - [ ] 1.2 Create AppShellViewModel with state management
    - States enum: Loading, Unauthenticated, SubscriptionExpired, Onboarding, Ready
    - CurrentState property with OnPropertyChanged notification
    - Inject IAuthService, IEntitlementService, IAppSettings
    - Subscribe to AuthService.SessionChanged event
  - [ ] 1.3 Implement InitializeAsync method
    - Call AuthService.LoadSessionAsync() on startup
    - Check for first-run status via IAppSettings.IsFirstRun
    - Transition to appropriate state based on session validity
    - Handle subscription expiration check via ISubscriptionGate
  - [ ] 1.4 Create AppShellView XAML with ContentControl
    - Define content region that switches based on CurrentState
    - Use DataTemplate selectors for different state views
    - Add fade transitions (200-300ms) for state changes
    - Apply KorBgDeep background from design system
  - [ ] 1.5 Update App.axaml.cs to use AppShellView as root
    - Replace MainWindow instantiation with AppShellView
    - Wire up AppShellViewModel via DI
    - Register AppShellViewModel in Program.cs DI container
  - [ ] 1.6 Run App Shell tests to verify state machine works
    - Execute only tests from 1.1
    - Verify state transitions work correctly

**Acceptance Criteria:**
- App shell correctly manages 5 app states
- State transitions trigger appropriate view changes
- SessionChanged event properly handles logout/invalidation
- Fade transitions animate state changes smoothly

---

#### Task Group 1.1: Login View
**Dependencies:** Task Group 1.0

- [ ] 1.1.0 Complete Login View implementation
  - [ ] 1.1.1 Write 4-6 focused tests for LoginViewModel
    - Test successful login flow calls AuthService.LoginAsync
    - Test validation prevents empty email/password submission
    - Test invalid email format shows validation error
    - Test AuthResult.Error message is displayed to user
    - Test loading state during authentication request
  - [ ] 1.1.2 Create LoginViewModel
    - ObservableProperty: Email, Password, IsLoading, ErrorMessage
    - ObservableProperty: EmailError, PasswordError (inline validation)
    - Inject IAuthService and parent AppShellViewModel reference
    - Implement ValidateInput() method for client-side validation
  - [ ] 1.1.3 Implement LoginCommand
    - Use [RelayCommand] attribute with CanExecute binding
    - Call AuthService.LoginAsync(email, password)
    - Handle success: notify AppShellViewModel to transition state
    - Handle failure: display ErrorMessage from AuthResult
    - Toggle IsLoading during request
  - [ ] 1.1.4 Implement navigation commands
    - ForgotPasswordCommand: Open korproxy.com/forgot-password in browser
    - CreateAccountCommand: Navigate to RegisterView via AppShellViewModel
  - [ ] 1.1.5 Create LoginView.axaml
    - Centered card layout using kor-card-static style
    - KorProxy logo with teal accent gradient
    - Email TextBox with kor-input style and validation error display
    - Password TextBox with PasswordChar="•" and kor-input style
    - Login button with kor-primary style, bound to LoginCommand
    - "Forgot Password?" and "Create Account" links with kor-ghost style
    - Error message display area with kor-badge-error style
    - Loading indicator (ProgressRing) when IsLoading=true
  - [ ] 1.1.6 Register LoginViewModel and LoginView in DI
    - Add DataTemplate for LoginViewModel → LoginView in App.axaml
    - Register LoginViewModel as transient in Program.cs
  - [ ] 1.1.7 Run Login View tests
    - Execute only tests from 1.1.1
    - Verify all validation and auth flows work

**Acceptance Criteria:**
- Login form validates input before submission
- Loading state shown during authentication
- Error messages displayed inline for validation
- Backend errors shown in error message area
- Navigation to register and forgot password works

---

#### Task Group 1.2: Register View
**Dependencies:** Task Group 1.1

- [ ] 1.2.0 Complete Register View implementation
  - [ ] 1.2.1 Write 4-6 focused tests for RegisterViewModel
    - Test successful registration calls AuthService.RegisterAsync
    - Test password confirmation validation
    - Test minimum password length (8 chars) validation
    - Test auto-login after successful registration
    - Test navigation back to login view
  - [ ] 1.2.2 Create RegisterViewModel
    - ObservableProperty: Email, Password, ConfirmPassword, Name
    - ObservableProperty: IsLoading, ErrorMessage
    - ObservableProperty: EmailError, PasswordError, ConfirmPasswordError
    - Inject IAuthService and AppShellViewModel reference
  - [ ] 1.2.3 Implement RegisterCommand
    - Validate email format, password length ≥8, confirmation match
    - Call AuthService.RegisterAsync(email, password, name)
    - On success: trigger Onboarding state transition (first run)
    - On failure: display error message
  - [ ] 1.2.4 Create RegisterView.axaml
    - Match LoginView card layout for consistency
    - Name field (optional) with kor-input style
    - Email field with validation error display
    - Password field with strength hint text
    - Confirm Password field with match validation
    - Register button with kor-primary style
    - "Already have an account?" link to LoginView
  - [ ] 1.2.5 Register RegisterViewModel in DI and App.axaml
  - [ ] 1.2.6 Run Register View tests
    - Execute only tests from 1.2.1

**Acceptance Criteria:**
- Registration validates all required fields
- Password confirmation must match
- Minimum 8 character password enforced
- Auto-login on successful registration
- Transitions to Onboarding for first-time users

---

### Phase 2: Onboarding Wizard

#### Task Group 2.0: Onboarding Infrastructure
**Dependencies:** Phase 1 complete

- [ ] 2.0.0 Complete Onboarding Infrastructure
  - [ ] 2.0.1 Write 3-4 focused tests for OnboardingViewModel
    - Test step navigation (next/previous)
    - Test step completion tracking
    - Test onboarding completion persists to settings
    - Test skip to Ready state from final step
  - [ ] 2.0.2 Create OnboardingViewModel base
    - ObservableProperty: CurrentStep (0-5), TotalSteps (6)
    - ObservableProperty: CanGoBack, CanGoNext, IsComplete
    - Dictionary of step ViewModels (lazy loaded)
    - Inject IAppSettings for completion tracking
  - [ ] 2.0.3 Implement step navigation commands
    - NextStepCommand: Increment CurrentStep, validate current step complete
    - PreviousStepCommand: Decrement CurrentStep
    - SkipCommand: Mark onboarding complete, transition to Ready
    - FinishCommand: Persist completion, transition to Ready
  - [ ] 2.0.4 Create OnboardingView.axaml shell
    - Step progress indicator (horizontal dots/steps)
    - ContentControl for current step content
    - Navigation buttons (Back, Next, Skip)
    - Animated step transitions (slide left/right)
  - [ ] 2.0.5 Run Onboarding infrastructure tests

**Acceptance Criteria:**
- Step navigation works bidirectionally
- Progress indicator shows current step
- Skip option available throughout
- Completion state persisted to settings

---

#### Task Group 2.1: Onboarding Wizard Steps
**Dependencies:** Task Group 2.0

- [ ] 2.1.0 Complete all 6 onboarding steps
  - [ ] 2.1.1 Create WelcomeStepViewModel and WelcomeStepView
    - KorProxy branding with animated logo
    - Value proposition copy (3-4 key benefits)
    - Teal accent gradient on logo
    - "Get Started" CTA button
  - [ ] 2.1.2 Create AccountStepViewModel and AccountStepView
    - Embedded LoginView or RegisterView (reuse components)
    - Skip if user already authenticated
    - Auto-advance on successful auth
  - [ ] 2.1.3 Create ConnectProvidersStepViewModel and View
    - Provider cards: Claude, ChatGPT, Gemini
    - Each card shows: provider icon, name, "Connect" button
    - "Connect" opens OAuth URL in system browser
    - Status indicator (connected/not connected) per provider
    - "Skip for now" option to proceed without connecting
  - [ ] 2.1.4 Create ConfigureToolsStepViewModel and View
    - Tool configuration snippets: Cursor, Cline, Windsurf, Continue
    - Each snippet in kor-mono code block
    - "Copy to Clipboard" button per snippet
    - Visual check/complete indicator when copied
  - [ ] 2.1.5 Create TestConnectionStepViewModel and View
    - "Test Connection" button to start proxy and verify
    - Progress indicator during test
    - Success/failure status display
    - Inject IProxySupervisor for proxy control
    - Handle test failures with retry option
  - [ ] 2.1.6 Create CompleteStepViewModel and View
    - Summary of connected providers
    - Quick tips for getting started
    - "Get Started" button to finish onboarding
    - Celebration animation/confetti effect (optional polish)
  - [ ] 2.1.7 Register all step ViewModels in DI
  - [ ] 2.1.8 Run step navigation flow manually to verify

**Acceptance Criteria:**
- All 6 steps render correctly
- Provider OAuth opens system browser
- Tool snippets copy to clipboard
- Connection test verifies proxy functionality
- Completion summary shows accurate data

---

### Phase 3: Subscription & Provider Integration

#### Task Group 3.0: Subscription Status Display
**Dependencies:** Phase 2 complete

- [ ] 3.0.0 Complete Subscription Status Display
  - [ ] 3.0.1 Write 3-4 tests for subscription status display
    - Test correct badge for each plan type (Free/Pro/Team/Trial)
    - Test trial countdown displays correctly
    - Test PastDue shows warning badge
  - [ ] 3.0.2 Create SubscriptionBadgeViewModel
    - ObservableProperty: PlanName, BadgeStyle, DaysLeftText
    - ObservableProperty: ShowWarning, WarningMessage
    - Subscribe to AuthService.SessionChanged for updates
    - Compute display values from SubscriptionInfo
  - [ ] 3.0.3 Create SubscriptionBadge UserControl
    - Badge displays current plan name
    - Use appropriate kor-badge-* style based on status
    - Trial countdown text when applicable
    - Warning icon for PastDue status
  - [ ] 3.0.4 Integrate SubscriptionBadge into Sidebar
    - Add to MainWindowViewModel or create SidebarViewModel
    - Position in sidebar header area
    - Click action opens korproxy.com/billing for warnings
  - [ ] 3.0.5 Run subscription display tests

**Acceptance Criteria:**
- Badge correctly reflects current subscription plan
- Trial days countdown is accurate
- PastDue shows appropriate warning styling
- Clicking warning badge opens billing page

---

#### Task Group 3.1: Subscription Gating UI
**Dependencies:** Task Group 3.0

- [ ] 3.1.0 Complete Subscription Gating UI
  - [ ] 3.1.1 Write 3-4 tests for subscription gating
    - Test proxy start blocked for expired subscription
    - Test upgrade modal shown when gating triggers
    - Test grace period warning for PastDue
    - Test trial warning banner ≤3 days remaining
  - [ ] 3.1.2 Create UpgradePromptViewModel
    - ObservableProperty: Title, Message, ShowBanner
    - UpgradeCommand: Open korproxy.com/pricing in browser
    - DismissCommand: Hide prompt temporarily
  - [ ] 3.1.3 Create UpgradePromptView (Modal)
    - Modal overlay with kor-card-static styling
    - Compelling upgrade message with feature highlights
    - "Upgrade Now" kor-primary button
    - "Not Now" kor-ghost dismiss button
  - [ ] 3.1.4 Create TrialWarningBanner UserControl
    - Horizontal banner for top of app
    - Shows when DaysLeft ≤ 3 for Trial status
    - Yellow warning styling (kor-badge-warning based)
    - "X days left in trial - Upgrade" message
  - [ ] 3.1.5 Integrate gating into MainWindowViewModel
    - Modify ToggleProxyCommand to show UpgradePrompt when blocked
    - Add TrialWarningBanner visibility logic
    - Connect to existing ISubscriptionGate checks
  - [ ] 3.1.6 Run subscription gating tests

**Acceptance Criteria:**
- Expired subscriptions cannot start proxy
- Upgrade modal appears with clear CTA
- PastDue shows grace period warning but allows operation
- Trial warning banner visible when ≤3 days left

---

#### Task Group 3.2: Provider OAuth Integration
**Dependencies:** Task Group 3.1

- [ ] 3.2.0 Complete Provider OAuth Integration
  - [ ] 3.2.1 Write 3-4 tests for provider OAuth flow
    - Test OAuth URL opened in system browser
    - Test deep link callback handling
    - Test token storage via ManagementApiClient
    - Test error handling with retry option
  - [ ] 3.2.2 Create ProviderConnectionService
    - Method: StartOAuthFlow(ProviderType) → opens browser
    - Deep link registration for korproxy:// scheme
    - Callback handler to extract OAuth tokens
    - Inject IManagementApiClient for token storage
  - [ ] 3.2.3 Update AccountsViewModel with provider status
    - ObservableCollection<ProviderStatus> for Claude/ChatGPT/Gemini
    - ConnectProviderCommand per provider
    - DisconnectProviderCommand per provider
    - Refresh status from ManagementApiClient on load
  - [ ] 3.2.4 Update AccountsView.axaml
    - Provider cards with connection status indicator
    - "Connect" button when not connected (kor-primary)
    - "Disconnect" button when connected (kor-danger)
    - Provider icon with brand color
    - Last sync timestamp display
  - [ ] 3.2.5 Register deep link handler in App startup
    - Platform-specific URI scheme registration
    - Route callbacks to ProviderConnectionService
  - [ ] 3.2.6 Run provider OAuth tests

**Acceptance Criteria:**
- OAuth flow opens correct provider auth URL
- Deep link callbacks properly parsed
- Tokens stored securely via ManagementApiClient
- UI reflects current connection status per provider

---

#### Task Group 3.3: Updated Sidebar with User Profile
**Dependencies:** Task Group 3.2

- [ ] 3.3.0 Complete Updated Sidebar
  - [ ] 3.3.1 Write 2-3 tests for sidebar user profile
    - Test user email and name displayed correctly
    - Test logout command clears session and transitions state
    - Test subscription badge integration
  - [ ] 3.3.2 Create SidebarUserProfileViewModel
    - ObservableProperty: UserEmail, UserName, AvatarInitials
    - LogoutCommand: Call AuthService.LogoutAsync
    - Inject IAuthService and AppShellViewModel
  - [ ] 3.3.3 Update Sidebar layout in MainWindowView
    - User profile section at bottom of sidebar
    - Avatar placeholder (initials or default icon)
    - User email display (truncated if long)
    - Subscription badge inline
    - Logout button with kor-ghost style
  - [ ] 3.3.4 Ensure sidebar navigation items unchanged
    - Dashboard, Models, Accounts, Integrations, Settings, Logs
  - [ ] 3.3.5 Run sidebar tests

**Acceptance Criteria:**
- User profile shows email and avatar
- Subscription badge visible in sidebar
- Logout triggers state transition to Unauthenticated
- Navigation items remain functional

---

### Phase 4: Polish & Error Handling

#### Task Group 4.0: Error Handling Patterns
**Dependencies:** Phase 3 complete

- [ ] 4.0.0 Complete Error Handling Implementation
  - [ ] 4.0.1 Write 3-4 tests for error handling
    - Test toast notification displays for transient errors
    - Test inline validation error styling
    - Test global 401 handling triggers re-auth
    - Test error logging via ILogger
  - [ ] 4.0.2 Create ErrorDisplayService
    - ShowToast(message, type) for transient notifications
    - ShowInlineError(field, message) for form validation
    - Toast types: Info, Warning, Error, Success
    - Auto-dismiss toasts after 5 seconds
  - [ ] 4.0.3 Create ToastNotification UserControl
    - Positioned top-right of app window
    - Animated slide-in/fade-out
    - Use appropriate kor-badge-* styling per type
    - Close button for manual dismiss
  - [ ] 4.0.4 Implement global 401 interceptor
    - Add HTTP message handler to detect 401 responses
    - Trigger re-authentication flow via AppShellViewModel
    - Clear stale session data
  - [ ] 4.0.5 Add inline validation error styling
    - Red border on invalid inputs (KorError color)
    - Error text below field (kor-caption with error color)
    - Transition animation on error state change
  - [ ] 4.0.6 Integrate ErrorDisplayService across ViewModels
    - Login/Register error handling
    - Provider connection errors
    - Proxy start failures
  - [ ] 4.0.7 Run error handling tests

**Acceptance Criteria:**
- Toast notifications appear for transient errors
- Inline validation errors clearly visible
- 401 responses trigger re-authentication
- Errors logged for debugging

---

#### Task Group 4.1: Test Review & Integration
**Dependencies:** Task Group 4.0

- [ ] 4.1.0 Review and validate complete UI implementation
  - [ ] 4.1.1 Review all tests from Phase 1-4
    - Verify test coverage for critical user flows
    - Identify any gaps in authentication flow testing
    - Ensure state machine transitions fully tested
  - [ ] 4.1.2 Write up to 8 additional integration tests
    - End-to-end: New user registration → Onboarding → Ready
    - End-to-end: Returning user auto-login → Ready
    - End-to-end: Session expiration → Re-authentication
    - End-to-end: Provider OAuth complete flow
    - Subscription gating prevents unauthorized proxy start
  - [ ] 4.1.3 Run complete test suite for UI rebuild
    - Execute all tests from task groups 1.0-4.0
    - Verify no regressions in existing functionality
  - [ ] 4.1.4 Manual smoke test of complete user journey
    - Test new user flow (register → onboard → dashboard)
    - Test returning user flow (auto-login → dashboard)
    - Test logout and re-login
    - Test subscription badge and gating

**Acceptance Criteria:**
- All automated tests pass
- Manual smoke tests verify end-to-end flows
- No regressions in existing app functionality
- Total test count approximately 30-40 tests

---

## Execution Order

Recommended implementation sequence:

1. **Phase 1: Core Authentication** (Task Groups 1.0 → 1.2)
   - App Shell state machine must be complete first
   - Login/Register views depend on App Shell
   
2. **Phase 2: Onboarding Wizard** (Task Groups 2.0 → 2.1)
   - Requires authentication to be functional
   - Can reuse Login/Register views in onboarding

3. **Phase 3: Subscription & Provider** (Task Groups 3.0 → 3.3)
   - Requires onboarding to demonstrate subscription flow
   - Provider integration depends on sidebar updates

4. **Phase 4: Polish & Error Handling** (Task Groups 4.0 → 4.1)
   - Error handling improves all previous phases
   - Integration tests validate complete system

## Notes

- All new ViewModels should follow the existing pattern using `CommunityToolkit.Mvvm` attributes
- Use `[ObservableProperty]` for bindable properties
- Use `[RelayCommand]` for command implementations
- Follow existing DI registration patterns in `Program.cs`
- Leverage existing design system styles from `App.axaml`
- No modifications to existing backend services (AuthService, EntitlementService, etc.)

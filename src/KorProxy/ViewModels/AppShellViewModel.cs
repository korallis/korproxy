using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public enum AppState
{
    Loading,
    Unauthenticated,
    SubscriptionExpired,
    Onboarding,
    Ready
}

public partial class AppShellViewModel : ViewModelBase
{
    private readonly IAuthService _authService;
    private readonly IEntitlementService _entitlementService;
    private readonly ISubscriptionGate _subscriptionGate;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AppShellViewModel>? _logger;

    [ObservableProperty]
    private AppState _currentState = AppState.Loading;

    [ObservableProperty]
    private ViewModelBase? _currentView;

    [ObservableProperty]
    private bool _isInitialized;

    [ObservableProperty]
    private string? _initializationError;

    // Cached view models
    private LoginViewModel? _loginViewModel;
    private RegisterViewModel? _registerViewModel;
    private OnboardingViewModel? _onboardingViewModel;
    private MainWindowViewModel? _mainViewModel;

    [ActivatorUtilitiesConstructor]
    public AppShellViewModel(
        IAuthService authService,
        IEntitlementService entitlementService,
        ISubscriptionGate subscriptionGate,
        IServiceProvider serviceProvider,
        ILogger<AppShellViewModel> logger)
    {
        _authService = authService;
        _entitlementService = entitlementService;
        _subscriptionGate = subscriptionGate;
        _serviceProvider = serviceProvider;
        _logger = logger;

        _authService.SessionChanged += OnSessionChanged;
    }

    // Design-time constructor
    public AppShellViewModel()
    {
        _authService = null!;
        _entitlementService = null!;
        _subscriptionGate = null!;
        _serviceProvider = null!;
    }

    public async Task InitializeAsync()
    {
        if (IsInitialized) return;

        try
        {
            _logger?.LogInformation("AppShell initializing...");
            CurrentState = AppState.Loading;

            // Try to load existing session
            var session = await _authService.LoadSessionAsync();

            if (session == null)
            {
                _logger?.LogInformation("No session found, transitioning to Unauthenticated");
                await TransitionToStateAsync(AppState.Unauthenticated);
            }
            else
            {
                _logger?.LogInformation("Session loaded for user {Email}", session.User.Email);
                await HandleAuthenticatedSessionAsync(session);
            }

            IsInitialized = true;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to initialize AppShell");
            InitializationError = "Failed to initialize application. Please restart.";
            await TransitionToStateAsync(AppState.Unauthenticated);
            IsInitialized = true;
        }
    }

    private async Task HandleAuthenticatedSessionAsync(AuthSession session)
    {
        // Check subscription status
        var subscription = session.Subscription;
        
        if (subscription == null || !subscription.IsActive)
        {
            var status = subscription?.Status ?? SubscriptionInfoStatus.NoSubscription;
            
            if (status == SubscriptionInfoStatus.Expired || 
                status == SubscriptionInfoStatus.NoSubscription ||
                status == SubscriptionInfoStatus.Canceled)
            {
                _logger?.LogInformation("Subscription expired/inactive, showing expired state");
                await TransitionToStateAsync(AppState.SubscriptionExpired);
                return;
            }
        }

        // Check if first run (needs onboarding)
        if (IsFirstRun())
        {
            _logger?.LogInformation("First run detected, starting onboarding");
            await TransitionToStateAsync(AppState.Onboarding);
        }
        else
        {
            _logger?.LogInformation("Transitioning to Ready state");
            await TransitionToStateAsync(AppState.Ready);
        }
    }

    private bool IsFirstRun()
    {
        // TODO: Check app settings for onboarding completion flag
        // For now, return false to skip onboarding during initial development
        return false;
    }

    private void MarkOnboardingComplete()
    {
        // TODO: Save onboarding completion to app settings
    }

    private void OnSessionChanged(object? sender, AuthSession? session)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(async () =>
        {
            if (session == null)
            {
                _logger?.LogInformation("Session cleared, transitioning to Unauthenticated");
                await TransitionToStateAsync(AppState.Unauthenticated);
            }
            else
            {
                await HandleAuthenticatedSessionAsync(session);
            }
        });
    }

    public async Task TransitionToStateAsync(AppState newState)
    {
        if (CurrentState == newState) return;

        _logger?.LogInformation("State transition: {OldState} -> {NewState}", CurrentState, newState);
        
        // Deactivate current view
        if (CurrentView != null)
        {
            try
            {
                await CurrentView.DeactivateAsync();
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error deactivating view");
            }
        }

        CurrentState = newState;
        CurrentView = GetViewForState(newState);

        // Activate new view
        if (CurrentView != null)
        {
            try
            {
                await CurrentView.ActivateAsync();
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error activating view");
            }
        }
    }

    private ViewModelBase? GetViewForState(AppState state)
    {
        return state switch
        {
            AppState.Loading => null, // Show loading indicator
            AppState.Unauthenticated => GetLoginViewModel(),
            AppState.SubscriptionExpired => GetSubscriptionExpiredViewModel(),
            AppState.Onboarding => GetOnboardingViewModel(),
            AppState.Ready => GetMainViewModel(),
            _ => null
        };
    }

    private LoginViewModel GetLoginViewModel()
    {
        _loginViewModel ??= new LoginViewModel(this, _authService, _logger);
        return _loginViewModel;
    }

    private RegisterViewModel GetRegisterViewModel()
    {
        _registerViewModel ??= new RegisterViewModel(this, _authService, _logger);
        return _registerViewModel;
    }

    private ViewModelBase GetSubscriptionExpiredViewModel()
    {
        // For now, reuse login with a message
        // TODO: Create dedicated SubscriptionExpiredViewModel
        return GetLoginViewModel();
    }

    private OnboardingViewModel GetOnboardingViewModel()
    {
        _onboardingViewModel ??= _serviceProvider.GetRequiredService<OnboardingViewModel>();
        return _onboardingViewModel;
    }

    private MainWindowViewModel GetMainViewModel()
    {
        _mainViewModel ??= _serviceProvider.GetRequiredService<MainWindowViewModel>();
        return _mainViewModel;
    }

    // Navigation methods for child views
    public void NavigateToLogin()
    {
        CurrentView = GetLoginViewModel();
    }

    public void NavigateToRegister()
    {
        CurrentView = GetRegisterViewModel();
    }

    public async Task OnLoginSuccessAsync(AuthSession session)
    {
        await HandleAuthenticatedSessionAsync(session);
    }

    public async Task OnRegisterSuccessAsync(AuthSession session)
    {
        // New registration always goes to onboarding
        await TransitionToStateAsync(AppState.Onboarding);
    }

    public async Task CompleteOnboardingAsync()
    {
        MarkOnboardingComplete();
        await TransitionToStateAsync(AppState.Ready);
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        await _authService.LogoutAsync();
        // SessionChanged event will handle transition to Unauthenticated
    }
}

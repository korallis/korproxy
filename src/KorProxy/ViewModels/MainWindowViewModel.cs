using System.Collections.ObjectModel;
using Avalonia;
using Avalonia.Media;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Services;
using Material.Icons;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IAuthService _authService;
    private readonly IEntitlementService _entitlementService;
    private readonly ISubscriptionGate _subscriptionGate;
    private readonly IServiceProvider _serviceProvider;
    private readonly IDialogService? _dialogService;
    private readonly ILogger<MainWindowViewModel>? _logger;

    [ObservableProperty]
    private ObservableCollection<NavigationItem> _navigationItems = [];

    [ObservableProperty]
    private NavigationItem? _selectedNavItem;

    [ObservableProperty]
    private ViewModelBase? _currentPage;

    [ObservableProperty]
    private string _statusText = "Initializing...";

    [ObservableProperty]
    private string _proxyStateText = "Stopped";

    [ObservableProperty]
    private Color _proxyStateColor = Colors.Gray;

    [ObservableProperty]
    private string _endpointUrl = "";

    [ObservableProperty]
    private string _startStopButtonText = "Start";

    [ObservableProperty]
    private bool _canToggleProxy = true;

    // User profile properties
    [ObservableProperty]
    private string _userEmail = "";

    [ObservableProperty]
    private string _userName = "";

    [ObservableProperty]
    private string _userInitials = "";

    // Subscription properties
    [ObservableProperty]
    private string _subscriptionPlan = "";

    [ObservableProperty]
    private string _subscriptionBadgeStyle = "muted";

    [ObservableProperty]
    private bool _showTrialWarning;

    [ObservableProperty]
    private string _trialDaysText = "";

    [ObservableProperty]
    private bool _showUpgradePrompt;

    [ObservableProperty]
    private string _upgradePromptMessage = "";

    // Theme properties
    [ObservableProperty]
    private MaterialIconKind _themeIcon = MaterialIconKind.WeatherNight;

    [ObservableProperty]
    private bool _isDarkTheme = true;

    [ActivatorUtilitiesConstructor]
    public MainWindowViewModel(
        IProxySupervisor proxySupervisor,
        IAuthService authService,
        IEntitlementService entitlementService,
        ISubscriptionGate subscriptionGate,
        IServiceProvider serviceProvider,
        IDialogService dialogService,
        ILogger<MainWindowViewModel> logger)
    {
        _proxySupervisor = proxySupervisor;
        _authService = authService;
        _entitlementService = entitlementService;
        _subscriptionGate = subscriptionGate;
        _serviceProvider = serviceProvider;
        _dialogService = dialogService;
        _logger = logger;

        InitializeNavigation();
        InitializeTheme();
        _proxySupervisor.StateChanged += OnProxyStateChanged;
        _authService.SessionChanged += OnSessionChanged;
        
        UpdateProxyState(_proxySupervisor.State);
        UpdateUserInfo();
        UpdateSubscriptionInfo();
    }

    // Design-time constructor
    public MainWindowViewModel()
    {
        _proxySupervisor = null!;
        _authService = null!;
        _entitlementService = null!;
        _subscriptionGate = null!;
        _serviceProvider = null!;
        InitializeNavigation();
    }

    private void InitializeNavigation()
    {
        NavigationItems =
        [
            // General Group
            new NavigationItem { Title = "Dashboard", Tag = "dashboard", Icon = NavigationItem.Icons.Dashboard, Group = NavigationGroup.General },
            new NavigationItem { Title = "Accounts", Tag = "accounts", Icon = NavigationItem.Icons.Accounts, Group = NavigationGroup.General },
            new NavigationItem { Title = "Models", Tag = "models", Icon = NavigationItem.Icons.Models, Group = NavigationGroup.General },
            // Configuration Group
            new NavigationItem { Title = "Integrations", Tag = "integrations", Icon = NavigationItem.Icons.Integrations, Group = NavigationGroup.Configuration },
            new NavigationItem { Title = "Settings", Tag = "settings", Icon = NavigationItem.Icons.Settings, Group = NavigationGroup.Configuration },
            // Diagnostics Group
            new NavigationItem { Title = "Logs", Tag = "logs", Icon = NavigationItem.Icons.Logs, Group = NavigationGroup.Diagnostics },
            new NavigationItem { Title = "Support", Tag = "support", Icon = NavigationItem.Icons.Support, Group = NavigationGroup.Diagnostics }
        ];

        SelectedNavItem = NavigationItems.FirstOrDefault();
    }

    private void InitializeTheme()
    {
        // Load saved theme preference
        var savedTheme = LoadThemePreference();
        IsDarkTheme = savedTheme ?? true; // Default to dark theme
        
        // Apply theme
        ApplyTheme(IsDarkTheme);
        UpdateThemeIcon();
    }

    private static bool? LoadThemePreference()
    {
        try
        {
            var prefsPath = GetThemePreferencePath();
            if (File.Exists(prefsPath))
            {
                var content = File.ReadAllText(prefsPath);
                return content.Trim().Equals("dark", StringComparison.OrdinalIgnoreCase);
            }
        }
        catch
        {
            // Ignore errors loading preferences
        }
        return null;
    }

    private static void SaveThemePreference(bool isDark)
    {
        try
        {
            var prefsPath = GetThemePreferencePath();
            var directory = Path.GetDirectoryName(prefsPath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
            File.WriteAllText(prefsPath, isDark ? "dark" : "light");
        }
        catch
        {
            // Ignore errors saving preferences
        }
    }

    private static string GetThemePreferencePath()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(appData, "KorProxy", "theme.pref");
    }

    private static void ApplyTheme(bool isDark)
    {
        // Apply theme using Avalonia's built-in theme system
        if (Avalonia.Application.Current != null)
        {
            Avalonia.Application.Current.RequestedThemeVariant = isDark 
                ? Avalonia.Styling.ThemeVariant.Dark 
                : Avalonia.Styling.ThemeVariant.Light;
        }
    }

    private void UpdateThemeIcon()
    {
        ThemeIcon = IsDarkTheme ? MaterialIconKind.WeatherNight : MaterialIconKind.WeatherSunny;
    }

    [RelayCommand]
    private void ToggleTheme()
    {
        IsDarkTheme = !IsDarkTheme;
        ApplyTheme(IsDarkTheme);
        UpdateThemeIcon();
        SaveThemePreference(IsDarkTheme);
        _logger?.LogInformation("Theme changed to {Theme}", IsDarkTheme ? "dark" : "light");
    }

    [RelayCommand]
    private void SelectNavItem(NavigationItem? item)
    {
        if (item != null)
        {
            SelectedNavItem = item;
        }
    }

    // Navigation group helpers for the view
    public IEnumerable<NavigationItem> AllNavItems => NavigationItems;
    public IEnumerable<NavigationItem> GeneralNavItems => NavigationItems.Where(n => n.Group == NavigationGroup.General);
    public IEnumerable<NavigationItem> ConfigNavItems => NavigationItems.Where(n => n.Group == NavigationGroup.Configuration);
    public IEnumerable<NavigationItem> DiagnosticsNavItems => NavigationItems.Where(n => n.Group == NavigationGroup.Diagnostics);

    partial void OnSelectedNavItemChanged(NavigationItem? value)
    {
        if (value == null) return;

        ViewModelBase? newPage = value.Tag switch
        {
            "dashboard" => GetViewModel<DashboardViewModel>(),
            "account" => GetViewModel<AccountViewModel>(),
            "models" => GetViewModel<ModelsViewModel>(),
            "accounts" => GetViewModel<AccountsViewModel>(),
            "integrations" => GetViewModel<IntegrationsViewModel>(),
            "settings" => GetViewModel<SettingsViewModel>(),
            "logs" => GetViewModel<LogsViewModel>(),
            "support" => GetViewModel<SupportViewModel>(),
            _ => null
        };

        _ = SwitchPageAsync(newPage);
    }

    private async Task SwitchPageAsync(ViewModelBase? newPage)
    {
        if (CurrentPage != null)
        {
            try 
            { 
                await CurrentPage.DeactivateAsync(); 
            }
            catch (Exception ex) 
            { 
                _logger?.LogWarning(ex, "Error deactivating page {PageType}", CurrentPage.GetType().Name);
            }
        }

        CurrentPage = newPage;

        if (newPage != null)
        {
            try 
            { 
                await newPage.ActivateAsync(); 
            }
            catch (Exception ex) 
            { 
                _logger?.LogWarning(ex, "Error activating page {PageType}", newPage.GetType().Name);
            }
        }
    }

    private T? GetViewModel<T>() where T : class
    {
        if (_serviceProvider == null) return null;
        return _serviceProvider.GetService(typeof(T)) as T;
    }

    private void OnProxyStateChanged(object? sender, ProxyState state)
    {
        // Ensure UI update on UI thread
        Avalonia.Threading.Dispatcher.UIThread.Post(() => UpdateProxyState(state));
    }

    private void UpdateProxyState(ProxyState state)
    {
        var status = _proxySupervisor?.GetStatus();
        
        (ProxyStateText, ProxyStateColor, StartStopButtonText, CanToggleProxy) = state switch
        {
            ProxyState.Stopped => ("Stopped", Colors.Gray, "Start", true),
            ProxyState.Starting => ("Starting...", Colors.Orange, "Starting...", false),
            ProxyState.Running => ("Running", Colors.LimeGreen, "Stop", true),
            ProxyState.Stopping => ("Stopping...", Colors.Orange, "Stopping...", false),
            ProxyState.Error => ("Error", Colors.Red, "Retry", true),
            ProxyState.CircuitOpen => ("Circuit Open", Colors.DarkRed, "Reset", true),
            _ => ("Unknown", Colors.Gray, "Start", false)
        };

        EndpointUrl = state == ProxyState.Running && status?.EndpointUrl != null 
            ? status.EndpointUrl 
            : "";

        StatusText = state switch
        {
            ProxyState.Running => $"Proxy running on port {status?.EndpointUrl?.Split(':').LastOrDefault() ?? "8317"}",
            ProxyState.Error => status?.LastError?.Message ?? "Proxy error",
            ProxyState.CircuitOpen => status?.LastError?.Message ?? "Circuit breaker is open",
            _ => state.ToString()
        };
    }

    [RelayCommand(CanExecute = nameof(CanToggleProxy))]
    private async Task ToggleProxyAsync()
    {
        if (_proxySupervisor == null) return;

        var state = _proxySupervisor.State;
        
        if (state == ProxyState.Running)
        {
            // Show confirmation dialog before stopping proxy
            if (_dialogService != null)
            {
                var confirmed = await _dialogService.ShowConfirmAsync(
                    "Stop Proxy",
                    "Are you sure you want to stop the proxy? Active connections will be terminated.");
                
                if (!confirmed)
                {
                    return;
                }
            }
            
            await _proxySupervisor.StopAsync();
        }
        else if (state == ProxyState.CircuitOpen)
        {
            await _proxySupervisor.ResetCircuitAsync();
        }
        else
        {
            var entitlements = _entitlementService.Cache.Entitlements;
            var allowed = _subscriptionGate.CanStartProxy(
                _authService.CurrentSession,
                entitlements,
                DateTimeOffset.UtcNow,
                out var reason);

            if (!allowed)
            {
                StatusText = reason ?? "Active subscription required.";
                UpgradePromptMessage = reason ?? "An active subscription is required to use KorProxy.";
                ShowUpgradePrompt = true;
                return;
            }

            await _proxySupervisor.StartAsync();
        }
    }

    [RelayCommand]
    private async Task CopyEndpointAsync()
    {
        if (string.IsNullOrEmpty(EndpointUrl)) return;
        
        if (Application.Current?.ApplicationLifetime is Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop)
        {
            var clipboard = desktop.MainWindow?.Clipboard;
            if (clipboard != null)
            {
                await clipboard.SetTextAsync(EndpointUrl);
            }
        }
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        // Show confirmation dialog before logging out
        if (_dialogService != null)
        {
            var confirmed = await _dialogService.ShowConfirmAsync(
                "Sign Out",
                "Are you sure you want to sign out? The proxy will be stopped.");
            
            if (!confirmed)
            {
                return;
            }
        }
        
        _logger?.LogInformation("User logging out");
        await _authService.LogoutAsync();
        // SessionChanged event will handle the transition in AppShellViewModel
    }

    [RelayCommand]
    private async Task OpenUpgradeAsync()
    {
        await OpenBrowserAsync("https://korproxy.com/pricing");
        ShowUpgradePrompt = false;
    }

    [RelayCommand]
    private void DismissUpgradePrompt()
    {
        ShowUpgradePrompt = false;
    }

    private void OnSessionChanged(object? sender, AuthSession? session)
    {
        Avalonia.Threading.Dispatcher.UIThread.Post(() =>
        {
            UpdateUserInfo();
            UpdateSubscriptionInfo();
        });
    }

    private void UpdateUserInfo()
    {
        var session = _authService?.CurrentSession;
        if (session?.User != null)
        {
            UserEmail = session.User.Email;
            UserName = session.User.Name ?? "";
            UserInitials = GetInitials(session.User.Name, session.User.Email);
        }
        else
        {
            UserEmail = "";
            UserName = "";
            UserInitials = "?";
        }
    }

    private static string GetInitials(string? name, string email)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
                return $"{parts[0][0]}{parts[1][0]}".ToUpperInvariant();
            if (parts.Length == 1 && parts[0].Length >= 1)
                return parts[0][0].ToString().ToUpperInvariant();
        }
        
        if (!string.IsNullOrWhiteSpace(email))
            return email[0].ToString().ToUpperInvariant();
        
        return "?";
    }

    private void UpdateSubscriptionInfo()
    {
        var session = _authService?.CurrentSession;
        var subscription = session?.Subscription;

        if (subscription == null)
        {
            SubscriptionPlan = "Free";
            SubscriptionBadgeStyle = "muted";
            ShowTrialWarning = false;
            return;
        }

        // Determine plan name and badge style
        (SubscriptionPlan, SubscriptionBadgeStyle) = subscription.Status switch
        {
            SubscriptionInfoStatus.Lifetime => ("Lifetime", "success"),
            SubscriptionInfoStatus.Active => (subscription.Plan ?? "Pro", "success"),
            SubscriptionInfoStatus.Trial => ("Trial", "info"),
            SubscriptionInfoStatus.PastDue => ("Past Due", "warning"),
            SubscriptionInfoStatus.Expired => ("Expired", "error"),
            SubscriptionInfoStatus.Canceled => ("Canceled", "error"),
            _ => ("Free", "muted")
        };

        // Show trial warning if <= 3 days left
        if (subscription.Status == SubscriptionInfoStatus.Trial && subscription.DaysLeft.HasValue)
        {
            var daysLeft = subscription.DaysLeft.Value;
            ShowTrialWarning = daysLeft <= 3;
            TrialDaysText = daysLeft == 1 ? "1 day left" : $"{daysLeft} days left";
        }
        else
        {
            ShowTrialWarning = false;
            TrialDaysText = "";
        }
    }

    private static async Task OpenBrowserAsync(string url)
    {
        await Task.Run(() =>
        {
            try
            {
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                };
                System.Diagnostics.Process.Start(psi);
            }
            catch
            {
                if (OperatingSystem.IsWindows())
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
                }
                else if (OperatingSystem.IsMacOS())
                {
                    System.Diagnostics.Process.Start("open", url);
                }
                else if (OperatingSystem.IsLinux())
                {
                    System.Diagnostics.Process.Start("xdg-open", url);
                }
            }
        });
    }
}

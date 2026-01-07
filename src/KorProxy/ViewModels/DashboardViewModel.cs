using System.Collections.ObjectModel;
using Avalonia.Media;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KorProxy.ViewModels;

public partial class DashboardViewModel : ViewModelBase
{
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IManagementApiClient _apiClient;
    private readonly INavigationService? _navigationService;
    private readonly IClipboardService? _clipboardService;
    private readonly IUsageAggregator? _usageAggregator;
    private CancellationTokenSource? _refreshCts;

    private UsageStats? _latestUsage;
    
    private int _consecutiveFailures;
    private int _pollIntervalMs = FastPollMs;
    
    private const int FastPollMs = 2000;
    private const int MediumPollMs = 5000;
    private const int SlowPollMs = 15000;
    private const int MaxConsecutiveFailures = 5;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(ProxyStateColor))]
    private string _stateText = "Unknown";

    public Color ProxyStateColor => StateText switch
    {
        "Running" => Colors.LimeGreen,
        "Starting" => Colors.Orange,
        "Stopped" => Colors.Gray,
        "Error" => Colors.Red,
        "CircuitOpen" => Colors.DarkRed,
        _ => Colors.Gray
    };

    [ObservableProperty]
    private string _uptimeText = "—";

    [ObservableProperty]
    private string _endpointUrl = "localhost:8317";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(SuccessRateText))]
    private int _totalRequests;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(SuccessRateText))]
    private int _successfulRequests;

    [ObservableProperty]
    private int _failedRequests;

    [ObservableProperty]
    private long _totalTokens;

    public string SuccessRateText => TotalRequests > 0 
        ? $"{(double)SuccessfulRequests / TotalRequests:P1}" 
        : "—";

    public ObservableCollection<string> RequestRangePresets { get; } =
    [
        "Today",
        "Last 7 days",
        "Last 30 days",
        "This month",
        "Custom"
    ];

    [ObservableProperty]
    private string _selectedRequestRangePreset = "Last 7 days";

    [ObservableProperty]
    private DateTimeOffset? _customRangeStart;

    [ObservableProperty]
    private DateTimeOffset? _customRangeEnd;

    [ObservableProperty]
    private int _rangeRequests;

    [ObservableProperty]
    private long _rangeTokens;

    [ObservableProperty]
    private int _connectedAccounts;

    [ObservableProperty]
    private ObservableCollection<ProviderStatusItem> _providerStatuses = [];

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isConnected = true;

    [ActivatorUtilitiesConstructor]
    public DashboardViewModel(IProxySupervisor proxySupervisor, IManagementApiClient apiClient, INavigationService navigationService, IClipboardService clipboardService, IUsageAggregator usageAggregator)
    {
        _proxySupervisor = proxySupervisor;
        _apiClient = apiClient;
        _navigationService = navigationService;
        _clipboardService = clipboardService;
        _usageAggregator = usageAggregator;
    }

    // Design-time constructor
    public DashboardViewModel()
    {
        _proxySupervisor = null!;
        _apiClient = null!;
        _navigationService = null;
        _clipboardService = null;
        
        // Sample data for designer
        StateText = "Running";
        UptimeText = "2h 34m";
        TotalRequests = 1234;
        SuccessfulRequests = 1200;
        FailedRequests = 34;
        TotalTokens = 98765;
        ConnectedAccounts = 3;

        RangeRequests = 42;
        RangeTokens = 1234;
    }

    [RelayCommand]
    private void GoToAccounts()
    {
        _navigationService?.NavigateTo("accounts");
    }

    [RelayCommand]
    private async Task CopyEndpointAsync()
    {
        if (_clipboardService == null) return;
        var fullUrl = $"http://{EndpointUrl}";
        await _clipboardService.CopyWithFeedbackAsync(fullUrl, "Endpoint URL copied!");
    }

    public bool IsCustomRangeSelected => SelectedRequestRangePreset == "Custom";

    partial void OnSelectedRequestRangePresetChanged(string value)
    {
        OnPropertyChanged(nameof(IsCustomRangeSelected));
        RecalculateRangeStats();
    }

    partial void OnCustomRangeStartChanged(DateTimeOffset? value)
    {
        if (SelectedRequestRangePreset == "Custom")
            RecalculateRangeStats();
    }

    partial void OnCustomRangeEndChanged(DateTimeOffset? value)
    {
        if (SelectedRequestRangePreset == "Custom")
            RecalculateRangeStats();
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        _refreshCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        await RefreshAsync();
        _ = StartAutoRefreshAsync(_refreshCts.Token);
    }

    public override Task DeactivateAsync(CancellationToken ct = default)
    {
        _refreshCts?.Cancel();
        _refreshCts?.Dispose();
        _refreshCts = null;
        return Task.CompletedTask;
    }

    private async Task StartAutoRefreshAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                if (_consecutiveFailures >= MaxConsecutiveFailures)
                {
                    await Task.Delay(SlowPollMs, ct);
                    await RefreshAsync();
                    continue;
                }
                
                await Task.Delay(_pollIntervalMs, ct);
                await RefreshAsync();
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
    
    private void UpdatePollInterval()
    {
        var status = _proxySupervisor?.GetStatus();
        var isRunning = status?.State == ProxyState.Running;
        
        if (_consecutiveFailures > 0)
        {
            _pollIntervalMs = SlowPollMs;
        }
        else if (isRunning)
        {
            _pollIntervalMs = FastPollMs;
        }
        else
        {
            _pollIntervalMs = MediumPollMs;
        }
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        if (_apiClient == null) return;
        
        await Dispatcher.UIThread.InvokeAsync(() => IsLoading = true);
        try
        {
            var status = _proxySupervisor?.GetStatus();
            var stateText = status?.State.ToString() ?? "Unknown";
            var uptimeText = status?.StartedAt != null 
                ? FormatUptime(DateTimeOffset.Now - status.StartedAt.Value) 
                : "—";

            // Fetch usage stats
            var usage = await _apiClient.GetUsageAsync();
            
            // Fetch accounts
            var accounts = await _apiClient.GetAccountsAsync();

            // API call succeeded - reset failure counter and restore fast polling
            _consecutiveFailures = 0;
            UpdatePollInterval();

            // Marshal all UI updates to the UI thread
            await Dispatcher.UIThread.InvokeAsync(() =>
            {
                IsConnected = true;
                StateText = stateText;
                UptimeText = uptimeText;
                
                // Update endpoint URL from proxy status
                if (status?.EndpointUrl != null)
                {
                    EndpointUrl = status.EndpointUrl.Replace("http://", "");
                }

                if (usage != null)
                {
                    _latestUsage = usage;
                    TotalRequests = usage.TotalRequests;
                    SuccessfulRequests = usage.SuccessfulRequests;
                    FailedRequests = usage.FailedRequests;
                    TotalTokens = usage.TotalTokens;

                    RecalculateRangeStats();
                }

                ConnectedAccounts = accounts?.Count(a => a.IsConnected) ?? 0;

                // Update provider statuses
                ProviderStatuses.Clear();
                if (accounts != null)
                {
                    foreach (var account in accounts.Where(a => a.IsConnected))
                    {
                        ProviderStatuses.Add(new ProviderStatusItem
                        {
                            ProviderName = Providers.GetDisplayName(account.Provider),
                            IsConnected = account.IsConnected,
                            StatusText = account.IsConnected ? "Connected" : "Not connected",
                            RequestCount = usage?.RequestsByProvider.GetValueOrDefault(account.Provider) ?? 0
                        });
                    }
                }
            });
        }
        catch (Exception) when (_apiClient != null)
        {
            _consecutiveFailures++;
            UpdatePollInterval();
            
            await Dispatcher.UIThread.InvokeAsync(() =>
            {
                IsConnected = false;
            });
        }
        finally
        {
            await Dispatcher.UIThread.InvokeAsync(() => IsLoading = false);
        }
    }

    private void RecalculateRangeStats()
    {
        if (_latestUsage is null || _usageAggregator is null)
        {
            RangeRequests = 0;
            RangeTokens = 0;
            return;
        }

        var preset = SelectedRequestRangePreset switch
        {
            "Today" => DateRangePreset.Today,
            "Last 7 days" => DateRangePreset.Last7Days,
            "Last 30 days" => DateRangePreset.Last30Days,
            "This month" => DateRangePreset.ThisMonth,
            "Custom" => DateRangePreset.Custom,
            _ => DateRangePreset.Last7Days
        };

        DateOnly? customStart = CustomRangeStart.HasValue 
            ? DateOnly.FromDateTime(CustomRangeStart.Value.LocalDateTime) 
            : null;
        DateOnly? customEnd = CustomRangeEnd.HasValue 
            ? DateOnly.FromDateTime(CustomRangeEnd.Value.LocalDateTime) 
            : null;

        var stats = _usageAggregator.CalculateRangeStats(_latestUsage, preset, customStart, customEnd);
        RangeRequests = stats.Requests;
        RangeTokens = stats.Tokens;
    }

    private static string FormatUptime(TimeSpan uptime)
    {
        if (uptime.TotalDays >= 1)
            return $"{(int)uptime.TotalDays}d {uptime.Hours}h";
        if (uptime.TotalHours >= 1)
            return $"{(int)uptime.TotalHours}h {uptime.Minutes}m";
        return $"{uptime.Minutes}m {uptime.Seconds}s";
    }
}

public class ProviderStatusItem
{
    public required string ProviderName { get; init; }
    public bool IsConnected { get; init; }
    public string StatusText { get; init; } = "";
    public int RequestCount { get; init; }
    
    public Color StatusColor => IsConnected ? Colors.LimeGreen : Colors.Gray;
}

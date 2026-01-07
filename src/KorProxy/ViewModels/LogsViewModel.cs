using System.Collections.ObjectModel;
using Avalonia.Threading;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public partial class LogsViewModel : ViewModelBase
{
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IManagementApiClient _apiClient;
    private readonly ILogger<LogsViewModel>? _logger;
    private CancellationTokenSource? _refreshCts;
    private DateTimeOffset? _lastLogTime;
    private List<LogEntry> _allLogs = [];

    [ObservableProperty]
    private ObservableCollection<LogEntryViewModel> _logs = [];

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _filterLevel = "All";

    [ObservableProperty]
    private string _searchText = "";

    [ObservableProperty]
    private bool _autoScroll = true;

    public string[] LogLevels { get; } = ["All", "Debug", "Info", "Warning", "Error"];

    [ActivatorUtilitiesConstructor]
    public LogsViewModel(IProxySupervisor proxySupervisor, IManagementApiClient apiClient, ILogger<LogsViewModel> logger)
    {
        _proxySupervisor = proxySupervisor;
        _apiClient = apiClient;
        _logger = logger;
    }

    // Design-time constructor
    public LogsViewModel()
    {
        _proxySupervisor = null!;
        _apiClient = null!;
        
        // Sample data
        Logs =
        [
            new LogEntryViewModel(new LogEntry(DateTimeOffset.Now.AddMinutes(-5), "INFO", "proxy", "Server started on port 8317")),
            new LogEntryViewModel(new LogEntry(DateTimeOffset.Now.AddMinutes(-4), "INFO", "gemini", "Connected to Gemini API")),
            new LogEntryViewModel(new LogEntry(DateTimeOffset.Now.AddMinutes(-3), "DEBUG", "proxy", "Received request for /v1/chat/completions")),
            new LogEntryViewModel(new LogEntry(DateTimeOffset.Now.AddMinutes(-2), "WARN", "claude", "Rate limit approaching")),
            new LogEntryViewModel(new LogEntry(DateTimeOffset.Now.AddMinutes(-1), "ERROR", "codex", "Authentication failed"))
        ];
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        _refreshCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        await RefreshLogsAsync();
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
                await Task.Delay(TimeSpan.FromSeconds(2), ct);
                await RefreshLogsAsync();
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    [RelayCommand]
    private async Task RefreshLogsAsync()
    {
        if (_apiClient == null) return;
        
        try
        {
            // Get logs from management API
            var newLogs = await _apiClient.GetLogsAsync(_lastLogTime);
            
            if (newLogs != null && newLogs.Count > 0)
            {
                // Store all logs for filtering
                _allLogs.AddRange(newLogs.OrderBy(l => l.Timestamp));
                _lastLogTime = newLogs.Max(l => l.Timestamp);

                // Marshal UI updates to the UI thread
                await Dispatcher.UIThread.InvokeAsync(() =>
                {
                    foreach (var log in newLogs.OrderBy(l => l.Timestamp))
                    {
                        if (ShouldShowLog(log))
                        {
                            Logs.Add(new LogEntryViewModel(log));
                        }
                    }
                });
            }
        }
        catch (Exception ex)
        {
            _logger?.LogDebug(ex, "Failed to refresh logs");
        }
    }

    [RelayCommand]
    private void ClearLogs()
    {
        Logs.Clear();
        _allLogs.Clear();
        _lastLogTime = null;
    }

    [RelayCommand]
    private async Task ExportLogsAsync()
    {
        // Would use file save dialog - simplified for now
        var logsText = string.Join("\n", Logs.Select(l => l.FormattedLine));
        
        var fileName = $"korproxy-logs-{DateTime.Now:yyyyMMdd-HHmmss}.txt";
        var path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), fileName);
        
        await File.WriteAllTextAsync(path, logsText);
    }

    private bool ShouldShowLog(LogEntry log)
    {
        // Level filter
        if (FilterLevel != "All" && !string.Equals(log.Level, FilterLevel, StringComparison.OrdinalIgnoreCase))
            return false;

        // Search filter
        if (!string.IsNullOrWhiteSpace(SearchText))
        {
            var searchLower = SearchText.ToLowerInvariant();
            if (!log.Message.Contains(searchLower, StringComparison.OrdinalIgnoreCase) &&
                !log.Source.Contains(searchLower, StringComparison.OrdinalIgnoreCase))
                return false;
        }

        return true;
    }

    partial void OnFilterLevelChanged(string value)
    {
        // Refilter existing logs
        RefreshDisplayedLogs();
    }

    partial void OnSearchTextChanged(string value)
    {
        RefreshDisplayedLogs();
    }

    private void RefreshDisplayedLogs()
    {
        Dispatcher.UIThread.Post(() =>
        {
            Logs.Clear();
            foreach (var log in _allLogs)
            {
                if (ShouldShowLog(log))
                {
                    Logs.Add(new LogEntryViewModel(log));
                }
            }
        });
    }
}

public class LogEntryViewModel
{
    public LogEntry Entry { get; }
    
    public string Timestamp => Entry.Timestamp.ToString("HH:mm:ss.fff");
    public string Level => Entry.Level.ToUpperInvariant();
    public string Source => Entry.Source;
    public string Message => Entry.Message;
    
    public string FormattedLine => $"[{Timestamp}] [{Level}] [{Source}] {Message}";
    
    public string LevelColor => Entry.Level.ToUpperInvariant() switch
    {
        "ERROR" => "#FF5252",
        "WARN" or "WARNING" => "#FFB74D",
        "INFO" => "#4FC3F7",
        "DEBUG" => "#81C784",
        _ => "#BDBDBD"
    };

    public LogEntryViewModel(LogEntry entry)
    {
        Entry = entry;
    }
}

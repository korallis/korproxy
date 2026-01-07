using System.Reflection;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace KorProxy.ViewModels;

public partial class SettingsViewModel : ViewModelBase
{
    private readonly IManagementApiClient _apiClient;
    private readonly IAppPaths _appPaths;
    private readonly IUpdateService _updateService;
    private readonly IStartupLaunchService? _startupLaunchService;
    private readonly INavigationService? _navigationService;
    private readonly ProxyOptions _options;

    // Settings page navigation
    [ObservableProperty]
    private int _selectedPageIndex;
    
    // Proxy settings
    [ObservableProperty]
    private int _port = 8317;

    [ObservableProperty]
    private bool _autoStart = true;

    [ObservableProperty]
    private bool _debugMode;

    [ObservableProperty]
    private bool _usageStatisticsEnabled;

    [ObservableProperty]
    private string _apiKeys = "";

    // App settings
    [ObservableProperty]
    private bool _openAtStartup;
    
    // Paths
    [ObservableProperty]
    private string _configFilePath = "";

    [ObservableProperty]
    private string _dataDirectory = "";

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _hasChanges;

    [ObservableProperty]
    private string? _statusMessage;

    // Updates
    [ObservableProperty]
    private string _updateStatus = "";

    [ObservableProperty]
    private string _updateMessage = "";

    [ObservableProperty]
    private double _updateProgress;

    [ObservableProperty]
    private bool _isPortableBuild;
    
    // Version info
    [ObservableProperty]
    private string _appVersion = "";
    
    [ObservableProperty]
    private string _lastUpdatedDate = "";
    
    [ObservableProperty]
    private string _buildInfo = "";

    private const string DefaultHost = "127.0.0.1";
    private const string BillingPortalUrl = "https://korproxy.com/dashboard/billing";
    private const string DocsUrl = "https://korproxy.com/docs";

    [ActivatorUtilitiesConstructor]
    public SettingsViewModel(
        IManagementApiClient apiClient, 
        IAppPaths appPaths,
        IUpdateService updateService,
        IStartupLaunchService startupLaunchService,
        INavigationService navigationService,
        IOptions<ProxyOptions> options)
    {
        _apiClient = apiClient;
        _appPaths = appPaths;
        _updateService = updateService;
        _startupLaunchService = startupLaunchService;
        _navigationService = navigationService;
        _options = options.Value;
        
        ConfigFilePath = _appPaths.ConfigFilePath;
        DataDirectory = _appPaths.DataDirectory;
        IsPortableBuild = updateService.IsPortableBuild;

        _updateService.StateChanged += OnUpdateStateChanged;
        UpdateFromState(_updateService.State);
        
        LoadVersionInfo();
    }

    // Design-time constructor
    public SettingsViewModel()
    {
        _apiClient = null!;
        _appPaths = null!;
        _updateService = null!;
        _startupLaunchService = null;
        _navigationService = null;
        _options = new ProxyOptions();
        
        Port = 8317;
        AutoStart = true;
        ConfigFilePath = "~/.config/KorProxy/config.yaml";
        DataDirectory = "~/.config/KorProxy";
        AppVersion = "1.0.0";
        LastUpdatedDate = "January 2026";
        BuildInfo = ".NET 8.0 / Avalonia 11";
    }
    
    private void LoadVersionInfo()
    {
        try
        {
            var assembly = Assembly.GetEntryAssembly();
            var version = assembly?.GetName().Version;
            AppVersion = version?.ToString(3) ?? "0.0.0";
            
            // Try to get informational version (includes git hash for release builds)
            var infoVersion = assembly?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
            if (!string.IsNullOrWhiteSpace(infoVersion) && infoVersion != AppVersion)
            {
                // Extract just the version part if it includes +commitHash
                var plusIndex = infoVersion.IndexOf('+');
                if (plusIndex > 0)
                {
                    AppVersion = infoVersion[..plusIndex];
                }
            }
            
            // Get executable last write time as "installed date"
            var exePath = Environment.ProcessPath;
            if (!string.IsNullOrWhiteSpace(exePath) && File.Exists(exePath))
            {
                var lastWrite = File.GetLastWriteTime(exePath);
                LastUpdatedDate = lastWrite.ToString("MMMM d, yyyy");
            }
            else
            {
                LastUpdatedDate = "Unknown";
            }
            
            // Build info
            var runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription;
            BuildInfo = $"{runtime} / Avalonia 11";
        }
        catch
        {
            AppVersion = "0.0.0";
            LastUpdatedDate = "Unknown";
            BuildInfo = ".NET 8.0 / Avalonia 11";
        }
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await LoadSettingsAsync();
        await LoadStartupSettingAsync();
    }
    
    private async Task LoadStartupSettingAsync()
    {
        if (_startupLaunchService == null) return;
        
        try
        {
            OpenAtStartup = await _startupLaunchService.IsEnabledAsync();
        }
        catch
        {
            OpenAtStartup = false;
        }
    }
    
    partial void OnOpenAtStartupChanged(bool value)
    {
        if (_startupLaunchService == null) return;
        
        _ = Task.Run(async () =>
        {
            try
            {
                await _startupLaunchService.SetEnabledAsync(value);
            }
            catch
            {
                // Revert on failure
                Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                {
                    StatusMessage = "Failed to update startup setting";
                });
            }
        });
    }

    [RelayCommand]
    private async Task LoadSettingsAsync()
    {
        if (_apiClient == null) return;
        
        IsLoading = true;
        StatusMessage = null;
        
        try
        {
            var config = await _apiClient.GetConfigAsync();
            if (config != null)
            {
                Port = config.Port;
                AutoStart = config.AutoStart;
                DebugMode = config.Debug;
                UsageStatisticsEnabled = config.UsageStatisticsEnabled;
                ApiKeys = string.Join("\n", config.ApiKeys);
            }
            
            HasChanges = false;
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to load settings: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SaveSettingsAsync()
    {
        if (_apiClient == null) return;

        if (Port is < 1 or > 65535)
        {
            StatusMessage = "Port must be between 1 and 65535";
            return;
        }
        
        IsLoading = true;
        StatusMessage = null;
        
        try
        {
            // IMPORTANT: CLIProxyAPI's config.yaml uses kebab-case keys (e.g. api-keys, auth-dir).
            // Never overwrite the whole file from scratch here; preserve existing sections.
            var yaml = await _apiClient.GetConfigYamlAsync();
            if (string.IsNullOrWhiteSpace(yaml))
            {
                // Fall back to a safe default baseline, matching ProxySupervisor.EnsureConfigFileExists().
                yaml = $"""
                    host: \"{DefaultHost}\"
                    port: {_options.Port}
                    auth-dir: \"{_appPaths.AuthDirectory.Replace("\\", "/")}\"
                    api-keys:
                      - \"korproxy-local-key\"
                    remote-management:
                      secret-key: \"{_options.ManagementKey}\"
                    debug: false
                    logging-to-file: false
                    usage-statistics-enabled: true
                    request-retry: 3
                    max-retry-interval: 30
                    """;
            }

            // Update the keys the Settings page owns.
            yaml = UpsertTopLevelScalar(yaml, "port", Port.ToString());
            yaml = UpsertTopLevelScalar(yaml, "debug", DebugMode.ToString().ToLowerInvariant());
            yaml = UpsertTopLevelScalar(yaml, "usage-statistics-enabled", UsageStatisticsEnabled.ToString().ToLowerInvariant());

            // Only overwrite api-keys if the user provided at least one key.
            // (Avoid accidentally wiping auth and locking users out.)
            var keys = ApiKeys
                .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToArray();
            if (keys.Length > 0)
            {
                var apiKeysSection = BuildApiKeysYamlSection(keys);
                yaml = UpsertTopLevelYamlSection(yaml, "api-keys", apiKeysSection);
            }

            // Ensure required keys exist for a healthy proxy start.
            yaml = EnsureTopLevelScalar(yaml, "host", $"\"{DefaultHost}\"");
            yaml = EnsureTopLevelScalar(yaml, "auth-dir", $"\"{_appPaths.AuthDirectory.Replace("\\", "/")}\"");
            yaml = EnsureTopLevelYamlSection(yaml, "remote-management", BuildRemoteManagementYamlSection(_options.ManagementKey));

            var success = await _apiClient.UpdateConfigAsync(yaml);
            
            if (success)
            {
                StatusMessage = "Settings saved successfully!";
                HasChanges = false;
                
                // Reload settings to confirm they were persisted
                await Task.Delay(500); // Give the proxy a moment to write to disk
                await LoadSettingsAsync();
            }
            else
            {
                StatusMessage = "Failed to save settings - check that the proxy is running";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to save settings: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    private static string BuildApiKeysYamlSection(IEnumerable<string> apiKeys)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("api-keys:");
        foreach (var key in apiKeys.Where(k => !string.IsNullOrWhiteSpace(k)))
        {
            sb.AppendLine($"  - \"{key.Replace("\"", "\\\"")}\"");
        }
        return sb.ToString().TrimEnd() + "\n";
    }

    private static string BuildRemoteManagementYamlSection(string managementKey)
    {
        var escaped = managementKey.Replace("\"", "\\\"");
        return $"""
            remote-management:
              secret-key: "{escaped}"
            """.TrimEnd() + "\n";
    }

    private static string EnsureTopLevelScalar(string yaml, string key, string value)
    {
        var normalized = yaml.Replace("\r\n", "\n");
        var lines = normalized.Split('\n');
        var needle = key + ":";

        foreach (var line in lines)
        {
            if (string.Equals(line.TrimEnd(), needle, StringComparison.Ordinal) ||
                line.StartsWith(needle + " ", StringComparison.Ordinal))
            {
                return yaml; // already present
            }
        }

        return yaml.TrimEnd() + "\n" + $"{key}: {value}" + "\n";
    }

    private static string EnsureTopLevelYamlSection(string yaml, string key, string section)
    {
        var normalized = yaml.Replace("\r\n", "\n");
        var lines = normalized.Split('\n');

        for (var i = 0; i < lines.Length; i++)
        {
            if (string.Equals(lines[i].TrimEnd(), $"{key}:", StringComparison.Ordinal))
            {
                return yaml; // already present
            }
        }

        return normalized.TrimEnd().Length == 0
            ? section
            : normalized.TrimEnd() + "\n\n" + section;
    }


    [RelayCommand]
    private async Task CheckUpdatesAsync()
    {
        if (_updateService == null) return;
        await _updateService.CheckForUpdatesAsync(CancellationToken.None);
    }

    [RelayCommand]
    private async Task DownloadUpdateAsync()
    {
        if (_updateService == null) return;
        await _updateService.DownloadUpdateAsync(CancellationToken.None);
    }

    [RelayCommand]
    private async Task InstallUpdateAsync()
    {
        if (_updateService == null) return;
        await _updateService.InstallUpdateAsync(CancellationToken.None);
    }

    private void OnUpdateStateChanged(object? sender, KorProxy.Core.Models.UpdateState state)
    {
        UpdateFromState(state);
    }

    private void UpdateFromState(KorProxy.Core.Models.UpdateState state)
    {
        UpdateStatus = state.Status.ToString();
        UpdateMessage = state.Message ?? "";
        UpdateProgress = state.Progress ?? 0;
    }

    private static string UpsertTopLevelScalar(string yaml, string key, string value)
    {
        var normalized = yaml.Replace("\r\n", "\n");
        var lines = normalized.Split('\n');
        var needle = key + ":";

        for (var i = 0; i < lines.Length; i++)
        {
            var line = lines[i];
            if (line.StartsWith(needle, StringComparison.Ordinal) && (line.Length == needle.Length || char.IsWhiteSpace(line[needle.Length])))
            {
                lines[i] = $"{key}: {value}";
                return string.Join("\n", lines).TrimEnd() + "\n";
            }
        }

        return yaml.TrimEnd() + "\n" + $"{key}: {value}" + "\n";
    }

    private static string UpsertTopLevelYamlSection(string yaml, string key, string section)
    {
        if (string.IsNullOrWhiteSpace(section))
            return yaml;

        var normalized = yaml.Replace("\r\n", "\n");
        var lines = normalized.Split('\n');
        var sectionLines = section.Replace("\r\n", "\n").Split('\n');

        var start = -1;
        for (var i = 0; i < lines.Length; i++)
        {
            if (string.Equals(lines[i].TrimEnd(), $"{key}:", StringComparison.Ordinal))
            {
                start = i;
                break;
            }
        }

        if (start < 0)
        {
            var trimmed = normalized.TrimEnd();
            return trimmed.Length == 0
                ? section
                : trimmed + "\n\n" + section;
        }

        var end = lines.Length;
        for (var i = start + 1; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line))
                continue;

            if (!char.IsWhiteSpace(line[0]) && !line.StartsWith('#') && line.Contains(':'))
            {
                end = i;
                break;
            }
        }

        var rebuilt = new List<string>(lines.Length - (end - start) + sectionLines.Length);
        rebuilt.AddRange(lines.Take(start));
        rebuilt.AddRange(sectionLines);
        rebuilt.AddRange(lines.Skip(end));

        return string.Join("\n", rebuilt).TrimEnd() + "\n";
    }

    [RelayCommand]
    private void OpenConfigFolder()
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = DataDirectory,
                UseShellExecute = true
            };
            System.Diagnostics.Process.Start(psi);
        }
        catch
        {
            StatusMessage = "Could not open folder";
        }
    }
    
    [RelayCommand]
    private void OpenBilling()
    {
        OpenUrl(BillingPortalUrl);
    }
    
    [RelayCommand]
    private void OpenSupport()
    {
        // Navigate to the in-app Support page
        _navigationService?.NavigateTo("support");
    }
    
    [RelayCommand]
    private void OpenDocs()
    {
        OpenUrl(DocsUrl);
    }
    
    [RelayCommand]
    private void ReportIssue()
    {
        // Navigate to the in-app Support page for issue reporting
        _navigationService?.NavigateTo("support");
    }
    
    private static void OpenUrl(string url)
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
            // Ignore errors
        }
    }

    partial void OnPortChanged(int value) => HasChanges = true;
    partial void OnAutoStartChanged(bool value) => HasChanges = true;
    partial void OnDebugModeChanged(bool value) => HasChanges = true;
    partial void OnUsageStatisticsEnabledChanged(bool value) => HasChanges = true;
    partial void OnApiKeysChanged(string value) => HasChanges = true;
}

using System.Collections.ObjectModel;
using System.Diagnostics;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KorProxy.ViewModels;

public partial class AccountsViewModel : ViewModelBase
{
    private readonly IManagementApiClient _apiClient;
    private CancellationTokenSource? _oauthPollCts;

    [ObservableProperty]
    private ObservableCollection<AccountCardViewModel> _accounts = [];

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string? _statusMessage;

    [ActivatorUtilitiesConstructor]
    public AccountsViewModel(IManagementApiClient apiClient)
    {
        _apiClient = apiClient;
    }

    // Design-time constructor
    public AccountsViewModel()
    {
        _apiClient = null!;
        
        // Sample data for designer
        Accounts =
        [
            new AccountCardViewModel { ProviderName = "Google Gemini", Provider = "gemini", IsConnected = true, Email = "user@gmail.com" },
            new AccountCardViewModel { ProviderName = "Claude Code", Provider = "claude", IsConnected = false },
            new AccountCardViewModel { ProviderName = "ChatGPT Codex", Provider = "codex", IsConnected = true, Email = "user@example.com" }
        ];
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await RefreshAccountsAsync();
    }

    public override Task DeactivateAsync(CancellationToken ct = default)
    {
        _oauthPollCts?.Cancel();
        _oauthPollCts?.Dispose();
        _oauthPollCts = null;
        return Task.CompletedTask;
    }

    [RelayCommand]
    private async Task RefreshAccountsAsync()
    {
        if (_apiClient == null) return;
        
        IsLoading = true;
        StatusMessage = null;
        
        try
        {
            var providerAccounts = await _apiClient.GetAccountsAsync();
            
            Accounts.Clear();
            foreach (var provider in Providers.All)
            {
                var account = providerAccounts?.FirstOrDefault(a => a.Provider == provider);
                Accounts.Add(new AccountCardViewModel
                {
                    ProviderName = Providers.GetDisplayName(provider),
                    Provider = provider,
                    IsConnected = account?.IsConnected ?? false,
                    Email = account?.Email,
                    TokenExpiry = account?.TokenExpiry,
                    NeedsRefresh = account?.NeedsRefresh ?? false,
                    ErrorMessage = account?.ErrorMessage,
                    ConnectCommand = new AsyncRelayCommand(() => ConnectProviderAsync(provider)),
                    DisconnectCommand = new AsyncRelayCommand(() => DisconnectProviderAsync(provider))
                });
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to load accounts: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task ConnectProviderAsync(string provider)
    {
        if (_apiClient == null) return;

        StatusMessage = $"Connecting to {Providers.GetDisplayName(provider)}...";
        
        try
        {
            // Get OAuth URL
            var oauthUrl = await _apiClient.GetOAuthUrlAsync(provider);
            if (string.IsNullOrEmpty(oauthUrl))
            {
                StatusMessage = "Failed to get OAuth URL";
                return;
            }

            // Open browser
            OpenBrowser(oauthUrl);
            
            // Extract state from URL for polling
            var uri = new Uri(oauthUrl);
            var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
            var state = query["state"];

            if (string.IsNullOrEmpty(state))
            {
                StatusMessage = "Invalid OAuth response";
                return;
            }

            StatusMessage = "Complete authentication in your browser...";

            // Cancel and dispose previous polling CTS before creating a new one
            if (_oauthPollCts != null)
            {
                _oauthPollCts.Cancel();
                _oauthPollCts.Dispose();
            }
            _oauthPollCts = new CancellationTokenSource();
            
            var success = await PollOAuthStatusAsync(state, _oauthPollCts.Token);
            
            if (success)
            {
                StatusMessage = $"Successfully connected to {Providers.GetDisplayName(provider)}!";
                await RefreshAccountsAsync();
            }
            else
            {
                StatusMessage = "Authentication timed out or was cancelled";
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Connection failed: {ex.Message}";
        }
    }

    private async Task<bool> PollOAuthStatusAsync(string state, CancellationToken ct)
    {
        const int maxAttempts = 60; // 2 minutes
        const int delayMs = 2000;

        for (int i = 0; i < maxAttempts && !ct.IsCancellationRequested; i++)
        {
            try
            {
                var isComplete = await _apiClient.CheckOAuthStatusAsync(state, ct);
                if (isComplete) return true;
                
                await Task.Delay(delayMs, ct);
            }
            catch (OperationCanceledException)
            {
                return false;
            }
            catch
            {
                // Continue polling on errors
            }
        }

        return false;
    }

    private Task DisconnectProviderAsync(string provider)
    {
        // Note: CLIProxyAPI may not support disconnect - this would require manual token removal
        StatusMessage = $"To disconnect {Providers.GetDisplayName(provider)}, remove the auth file manually.";
        return Task.CompletedTask;
    }

    private static bool IsValidHttpUrl(string url)
    {
        return Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static void OpenBrowser(string url)
    {
        if (!IsValidHttpUrl(url))
        {
            return;
        }

        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch
        {
            // Fallback for Linux
            if (OperatingSystem.IsLinux())
            {
                Process.Start("xdg-open", url);
            }
            else if (OperatingSystem.IsMacOS())
            {
                Process.Start("open", url);
            }
        }
    }
}

public partial class AccountCardViewModel : ObservableObject
{
    public required string ProviderName { get; init; }
    public required string Provider { get; init; }
    
    [ObservableProperty]
    private bool _isConnected;
    
    public string? Email { get; init; }
    public DateTimeOffset? TokenExpiry { get; init; }
    public bool NeedsRefresh { get; init; }
    public string? ErrorMessage { get; init; }
    
    public IAsyncRelayCommand? ConnectCommand { get; init; }
    public IAsyncRelayCommand? DisconnectCommand { get; init; }
    
    public string StatusText => IsConnected 
        ? NeedsRefresh ? "Needs refresh" : "Connected" 
        : "Not connected";
    
    public string ExpiryText => TokenExpiry.HasValue 
        ? $"Expires: {TokenExpiry.Value:g}" 
        : "";
}

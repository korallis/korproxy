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
            new AccountCardViewModel { ProviderName = "ChatGPT Codex", Provider = "codex", IsConnected = true, Email = "user@example.com" },
            new AccountCardViewModel { ProviderName = "BigModel (GLM-4)", Provider = "bigmodel", IsApiKeyProvider = true, IsConnected = false, Description = "Zhipu AI GLM-4 series" }
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
            
            // Load API-key provider status
            var apiKeyProviderStatus = await LoadApiKeyProviderStatusAsync();
            
            Accounts.Clear();
            foreach (var provider in Providers.All)
            {
                var isApiKeyProvider = Providers.IsApiKeyProvider(provider);
                var account = providerAccounts?.FirstOrDefault(a => a.Provider == provider);
                
                var cardVm = new AccountCardViewModel
                {
                    ProviderName = Providers.GetDisplayName(provider),
                    Provider = provider,
                    Description = Providers.GetDescription(provider),
                    IsApiKeyProvider = isApiKeyProvider,
                    IsConnected = isApiKeyProvider 
                        ? apiKeyProviderStatus.GetValueOrDefault(provider, false)
                        : account?.IsConnected ?? false,
                    Email = account?.Email,
                    TokenExpiry = account?.TokenExpiry,
                    NeedsRefresh = account?.NeedsRefresh ?? false,
                    ErrorMessage = account?.ErrorMessage,
                };
                
                // Set up commands based on provider type
                if (isApiKeyProvider)
                {
                    cardVm.SaveApiKeyCommand = new AsyncRelayCommand<string>(apiKey => SaveApiKeyProviderAsync(provider, apiKey));
                    cardVm.DisconnectCommand = new AsyncRelayCommand(() => DisableApiKeyProviderAsync(provider));
                }
                else
                {
                    cardVm.ConnectCommand = new AsyncRelayCommand(() => ConnectProviderAsync(provider));
                    cardVm.DisconnectCommand = new AsyncRelayCommand(() => DisconnectProviderAsync(provider));
                }
                
                Accounts.Add(cardVm);
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
    
    private async Task<Dictionary<string, bool>> LoadApiKeyProviderStatusAsync()
    {
        var result = new Dictionary<string, bool>();
        
        try
        {
            var providers = await _apiClient.GetOpenAiCompatProvidersAsync();
            
            // Check BigModel
            var bigModel = providers.FirstOrDefault(p => 
                p.Name.Equals("bigmodel", StringComparison.OrdinalIgnoreCase) ||
                p.Name.Equals("zhipu", StringComparison.OrdinalIgnoreCase));
            result[Providers.BigModel] = bigModel != null;
        }
        catch
        {
            // Ignore errors, default to not connected
        }
        
        return result;
    }
    
    private async Task SaveApiKeyProviderAsync(string provider, string? apiKey)
    {
        if (_apiClient == null || string.IsNullOrWhiteSpace(apiKey)) return;
        
        StatusMessage = $"Saving {Providers.GetDisplayName(provider)}...";
        
        try
        {
            if (provider == Providers.BigModel)
            {
                var providerConfig = new OpenAiCompatProvider
                {
                    Name = "bigmodel",
                    BaseUrl = "https://open.bigmodel.cn/api/paas/v4",
                    ApiKeyEntries = [new OpenAiCompatApiKeyEntry { ApiKey = apiKey }],
                    Models =
                    [
                        new OpenAiCompatModel { Name = "glm-4", Alias = "GLM-4" },
                        new OpenAiCompatModel { Name = "glm-4-plus", Alias = "GLM-4-Plus" },
                        new OpenAiCompatModel { Name = "glm-4-flash", Alias = "GLM-4-Flash" },
                        new OpenAiCompatModel { Name = "glm-4-air", Alias = "GLM-4-Air" },
                        new OpenAiCompatModel { Name = "glm-4-airx", Alias = "GLM-4-AirX" },
                        new OpenAiCompatModel { Name = "glm-4-long", Alias = "GLM-4-Long" },
                        new OpenAiCompatModel { Name = "glm-4-flashx", Alias = "GLM-4-FlashX" },
                        new OpenAiCompatModel { Name = "glm-4v", Alias = "GLM-4V" },
                        new OpenAiCompatModel { Name = "glm-4v-plus", Alias = "GLM-4V-Plus" },
                        new OpenAiCompatModel { Name = "glm-4v-flash", Alias = "GLM-4V-Flash" }
                    ]
                };
                
                var success = await _apiClient.UpsertOpenAiCompatProviderAsync(providerConfig);
                
                if (success)
                {
                    StatusMessage = $"{Providers.GetDisplayName(provider)} enabled! Restart the proxy to use GLM models.";
                    await RefreshAccountsAsync();
                }
                else
                {
                    StatusMessage = $"Failed to save {Providers.GetDisplayName(provider)} configuration";
                }
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to save: {ex.Message}";
        }
    }
    
    private async Task DisableApiKeyProviderAsync(string provider)
    {
        if (_apiClient == null) return;
        
        StatusMessage = $"Disabling {Providers.GetDisplayName(provider)}...";
        
        try
        {
            if (provider == Providers.BigModel)
            {
                var success = await _apiClient.DeleteOpenAiCompatProviderAsync("bigmodel");
                
                if (success)
                {
                    StatusMessage = $"{Providers.GetDisplayName(provider)} disabled. Restart the proxy to apply changes.";
                    await RefreshAccountsAsync();
                }
                else
                {
                    StatusMessage = $"Failed to disable {Providers.GetDisplayName(provider)}";
                }
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to disable: {ex.Message}";
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
    public string? Description { get; init; }
    
    /// <summary>
    /// True if this provider uses API key authentication instead of OAuth.
    /// </summary>
    public bool IsApiKeyProvider { get; init; }
    
    [ObservableProperty]
    private bool _isConnected;
    
    [ObservableProperty]
    private string _apiKeyInput = "";
    
    [ObservableProperty]
    private bool _isSaving;
    
    public string? Email { get; init; }
    public DateTimeOffset? TokenExpiry { get; init; }
    public bool NeedsRefresh { get; init; }
    public string? ErrorMessage { get; init; }
    
    // OAuth provider commands
    public IAsyncRelayCommand? ConnectCommand { get; set; }
    public IAsyncRelayCommand? DisconnectCommand { get; set; }
    
    // API-key provider commands
    public IAsyncRelayCommand<string>? SaveApiKeyCommand { get; set; }
    
    public string StatusText => IsConnected 
        ? NeedsRefresh ? "Needs refresh" : "Connected" 
        : "Not connected";
    
    public string ExpiryText => TokenExpiry.HasValue 
        ? $"Expires: {TokenExpiry.Value:g}" 
        : "";
}

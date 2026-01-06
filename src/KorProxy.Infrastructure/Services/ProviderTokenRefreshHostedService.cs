using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Background service that triggers proactive token refresh for connected providers on startup.
/// CLIProxyAPI executors automatically refresh tokens when making requests if they're near expiry.
/// This service makes lightweight test requests for providers whose tokens haven't been refreshed recently.
/// </summary>
public sealed class ProviderTokenRefreshHostedService : IHostedService, IDisposable
{
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IManagementApiClient _apiClient;
    private readonly ILogger<ProviderTokenRefreshHostedService> _logger;
    private CancellationTokenSource? _cts;
    private bool _refreshTriggered;
    private readonly object _lock = new();

    public ProviderTokenRefreshHostedService(
        IProxySupervisor proxySupervisor,
        IManagementApiClient apiClient,
        ILogger<ProviderTokenRefreshHostedService> logger)
    {
        _proxySupervisor = proxySupervisor;
        _apiClient = apiClient;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        // Subscribe to state changes to trigger refresh when proxy becomes ready
        _proxySupervisor.StateChanged += OnProxyStateChanged;

        // If proxy is already running, trigger refresh immediately
        if (_proxySupervisor.State == ProxyState.Running)
        {
            _ = TriggerRefreshAsync(_cts.Token);
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _proxySupervisor.StateChanged -= OnProxyStateChanged;
        _cts?.Cancel();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _cts?.Dispose();
    }

    private void OnProxyStateChanged(object? sender, ProxyState state)
    {
        if (state == ProxyState.Running)
        {
            _ = TriggerRefreshAsync(_cts?.Token ?? CancellationToken.None);
        }
    }

    private async Task TriggerRefreshAsync(CancellationToken ct)
    {
        // Only trigger once per app lifetime
        lock (_lock)
        {
            if (_refreshTriggered)
                return;
            _refreshTriggered = true;
        }

        // Give the proxy a moment to fully initialize
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(2), ct);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        await RefreshStaleTokensAsync(ct);
    }

    private async Task RefreshStaleTokensAsync(CancellationToken ct)
    {
        List<ProviderAccount> accounts;
        try
        {
            accounts = await _apiClient.GetAccountsAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get accounts for token refresh check");
            return;
        }

        var staleAccounts = accounts.Where(a => a.ShouldRefresh).ToList();
        
        if (staleAccounts.Count == 0)
        {
            _logger.LogDebug("No provider tokens need refresh");
            return;
        }

        _logger.LogInformation(
            "Found {Count} provider(s) with stale tokens: {Providers}",
            staleAccounts.Count,
            string.Join(", ", staleAccounts.Select(a => a.Provider)));

        foreach (var account in staleAccounts)
        {
            if (ct.IsCancellationRequested)
                break;

            try
            {
                _logger.LogDebug("Triggering token refresh for {Provider}", account.Provider);
                var success = await _apiClient.TestProviderAsync(account.Provider, ct);

                if (success)
                {
                    _logger.LogInformation("Token refresh triggered successfully for {Provider}", account.Provider);
                }
                else
                {
                    _logger.LogWarning("Token refresh request failed for {Provider}", account.Provider);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh token for {Provider}", account.Provider);
            }

            // Small delay between providers to avoid overwhelming the proxy
            try
            {
                await Task.Delay(TimeSpan.FromMilliseconds(500), ct);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}

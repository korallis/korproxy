using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

/// <summary>
/// Client for CLIProxyAPI's Management API
/// </summary>
public interface IManagementApiClient
{
    /// <summary>Check if the proxy is healthy</summary>
    Task<bool> PingAsync(CancellationToken ct = default);
    
    /// <summary>Get current configuration</summary>
    Task<ProxyConfig?> GetConfigAsync(CancellationToken ct = default);

    /// <summary>Download the persisted YAML config as-is</summary>
    Task<string?> GetConfigYamlAsync(CancellationToken ct = default);
    
    /// <summary>Update configuration</summary>
    Task<bool> UpdateConfigAsync(string yamlContent, CancellationToken ct = default);
    
    /// <summary>Get usage statistics</summary>
    Task<UsageStats?> GetUsageAsync(CancellationToken ct = default);
    
    /// <summary>Get connected OAuth accounts</summary>
    Task<List<ProviderAccount>> GetAccountsAsync(CancellationToken ct = default);
    
    /// <summary>Get OAuth URL for a provider</summary>
    Task<string?> GetOAuthUrlAsync(string provider, CancellationToken ct = default);
    
    /// <summary>Check OAuth status</summary>
    Task<bool> CheckOAuthStatusAsync(string state, CancellationToken ct = default);
    
    /// <summary>Get recent logs</summary>
    Task<List<LogEntry>> GetLogsAsync(DateTimeOffset? after = null, CancellationToken ct = default);
    
    /// <summary>Get available models</summary>
    Task<List<AvailableModel>> GetModelsAsync(CancellationToken ct = default);

    /// <summary>Get proxy API keys for client authentication (e.g., Amp CLI)</summary>
    Task<List<string>> GetProxyApiKeysAsync(CancellationToken ct = default);

    /// <summary>
    /// Make a lightweight completion request to trigger token refresh for a provider.
    /// CLIProxyAPI executors automatically refresh tokens when they're near expiry.
    /// </summary>
    /// <param name="provider">Provider name (claude, codex, gemini, etc.)</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>True if the request succeeded (token is valid or was refreshed)</returns>
    Task<bool> TestProviderAsync(string provider, CancellationToken ct = default);
}

namespace KorProxy.Core.Services;

public interface IProxyConfigStore
{
    Task<ProxyConfigFile?> LoadAsync(CancellationToken ct = default);
    Task<bool> SaveAsync(ProxyConfigFile config, CancellationToken ct = default);
    
    Task<int> GetPortAsync(CancellationToken ct = default);
    Task<bool> SetPortAsync(int port, CancellationToken ct = default);
    Task<bool> GetUsageStatisticsEnabledAsync(CancellationToken ct = default);
    Task<bool> SetUsageStatisticsEnabledAsync(bool enabled, CancellationToken ct = default);
    Task<bool> GetDebugAsync(CancellationToken ct = default);
    Task<bool> SetDebugAsync(bool debug, CancellationToken ct = default);
    Task<List<string>> GetApiKeysAsync(CancellationToken ct = default);
    Task<bool> SetApiKeysAsync(List<string> apiKeys, CancellationToken ct = default);
}

public sealed class ProxyConfigFile
{
    public string Host { get; set; } = "127.0.0.1";
    public int Port { get; set; } = 8317;
    public string? AuthDir { get; set; }
    public List<string> ApiKeys { get; set; } = new();
    public RemoteManagementConfig? RemoteManagement { get; set; }
    public bool Debug { get; set; }
    public bool LoggingToFile { get; set; }
    public bool UsageStatisticsEnabled { get; set; } = true;
    public int RequestRetry { get; set; } = 3;
    public int MaxRetryInterval { get; set; } = 30;
}

public sealed class RemoteManagementConfig
{
    public string? SecretKey { get; set; }
}

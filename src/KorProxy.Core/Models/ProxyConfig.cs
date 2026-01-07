namespace KorProxy.Core.Models;

/// <summary>
/// Configuration for the proxy application
/// </summary>
public sealed class ProxyConfig
{
    /// <summary>Port for the proxy server</summary>
    public int Port { get; set; } = 8317;
    
    /// <summary>Host to bind to</summary>
    public string Host { get; set; } = "";
    
    /// <summary>Whether to start proxy automatically on app launch</summary>
    public bool AutoStart { get; set; } = true;
    
    /// <summary>API keys for authentication</summary>
    public List<string> ApiKeys { get; set; } = [];
    
    /// <summary>Enable debug logging</summary>
    public bool Debug { get; set; }
    
    /// <summary>Enable usage statistics</summary>
    public bool UsageStatisticsEnabled { get; set; }

    /// <summary>Amp CLI integration settings</summary>
    public AmpCodeConfig? AmpCode { get; set; }
}

public sealed class AmpCodeConfig
{
    public string? UpstreamUrl { get; set; }
    public string? UpstreamApiKey { get; set; }
    public bool RestrictManagementToLocalhost { get; set; } = true;
}

/// <summary>
/// Options for the proxy supervisor
/// </summary>
public sealed class ProxyOptions
{
    public const string SectionName = "Proxy";
    
    public string ApiBaseUrl { get; set; } = "http://127.0.0.1:8317";
    public int Port { get; set; } = 8317;
    public int ProxyPort { get; set; } = 8317;
    public bool AutoStart { get; set; } = true;
    public int HttpTimeoutSeconds { get; set; } = 10;
    public int StartupTimeoutSeconds { get; set; } = 30;
    public int MaxConsecutiveFailures { get; set; } = 5;
    public string ManagementKey { get; set; } = "korproxy-mgmt-key";
}

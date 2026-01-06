namespace KorProxy.Core.Services;

/// <summary>
/// Provides cross-platform application paths
/// </summary>
public interface IAppPaths
{
    /// <summary>Application data directory (config, logs, cache)</summary>
    string DataDirectory { get; }
    
    /// <summary>Config file path</summary>
    string ConfigFilePath { get; }
    
    /// <summary>Path to extracted CLIProxyAPI binary</summary>
    string ProxyBinaryPath { get; }
    
    /// <summary>Logs directory</summary>
    string LogsDirectory { get; }
    
    /// <summary>Auth directory for OAuth tokens</summary>
    string AuthDirectory { get; }
}

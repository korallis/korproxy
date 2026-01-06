using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

/// <summary>
/// Manages the lifecycle of the CLIProxyAPI process
/// </summary>
public interface IProxySupervisor
{
    /// <summary>Current state of the proxy</summary>
    ProxyState State { get; }
    
    /// <summary>Get detailed status information</summary>
    ProxyStatus GetStatus();
    
    /// <summary>Fired when state changes</summary>
    event EventHandler<ProxyState>? StateChanged;
    
    /// <summary>Start the proxy process</summary>
    Task StartAsync(CancellationToken cancellationToken = default);
    
    /// <summary>Stop the proxy process</summary>
    Task StopAsync(CancellationToken cancellationToken = default);
    
    /// <summary>Reset the circuit breaker after repeated failures</summary>
    Task ResetCircuitAsync(CancellationToken cancellationToken = default);
    
    /// <summary>Get recent log lines from the proxy process</summary>
    IReadOnlyList<string> GetRecentLogs();
}

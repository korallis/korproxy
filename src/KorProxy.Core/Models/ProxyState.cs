namespace KorProxy.Core.Models;

/// <summary>
/// Represents the current state of the proxy process
/// </summary>
public enum ProxyState
{
    /// <summary>Proxy is not running</summary>
    Stopped,
    
    /// <summary>Proxy is starting up</summary>
    Starting,
    
    /// <summary>Proxy is running and healthy</summary>
    Running,
    
    /// <summary>Proxy is shutting down</summary>
    Stopping,
    
    /// <summary>Proxy encountered an error</summary>
    Error,
    
    /// <summary>Too many failures, circuit breaker is open</summary>
    CircuitOpen
}

/// <summary>
/// Detailed status information about the proxy
/// </summary>
public sealed record ProxyStatus(
    ProxyState State,
    int? ProcessId,
    DateTimeOffset? StartedAt,
    string? EndpointUrl,
    int ConsecutiveFailures,
    Exception? LastError);

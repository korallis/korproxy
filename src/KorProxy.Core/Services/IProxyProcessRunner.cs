namespace KorProxy.Core.Services;

public interface IProxyProcessRunner
{
    int? ProcessId { get; }
    bool IsRunning { get; }
    DateTimeOffset? StartedAt { get; }
    IReadOnlyList<string> RecentLogs { get; }
    
    event EventHandler<int>? ProcessExited;
    
    Task<bool> StartAsync(CancellationToken ct = default);
    Task StopAsync(CancellationToken ct = default);
}

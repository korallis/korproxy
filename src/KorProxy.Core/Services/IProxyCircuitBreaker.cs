namespace KorProxy.Core.Services;

public interface IProxyCircuitBreaker
{
    bool IsOpen { get; }
    int ConsecutiveFailures { get; }
    int MaxFailures { get; }
    Exception? LastError { get; }
    
    void RecordSuccess();
    void RecordFailure(Exception? error = null);
    void Reset();
}

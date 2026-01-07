namespace KorProxy.Core.Services;

public interface IAppLifetimeService
{
    event EventHandler? ShutdownRequested;
    event EventHandler? WindowRestoreRequested;
    
    bool IsShuttingDown { get; }
    void RequestShutdown();
    void RequestWindowRestore();
}

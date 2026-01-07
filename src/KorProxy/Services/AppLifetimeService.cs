using KorProxy.Core.Services;

namespace KorProxy.Services;

public class AppLifetimeService : IAppLifetimeService
{
    private volatile bool _isShuttingDown;
    private readonly object _shutdownLock = new();

    public event EventHandler? ShutdownRequested;
    public event EventHandler? WindowRestoreRequested;

    public bool IsShuttingDown
    {
        get
        {
            lock (_shutdownLock)
            {
                return _isShuttingDown;
            }
        }
    }

    public void RequestShutdown()
    {
        lock (_shutdownLock)
        {
            if (_isShuttingDown)
                return;
            _isShuttingDown = true;
        }

        ShutdownRequested?.Invoke(this, EventArgs.Empty);
    }

    public void RequestWindowRestore()
    {
        if (_isShuttingDown)
            return;

        WindowRestoreRequested?.Invoke(this, EventArgs.Empty);
    }
}

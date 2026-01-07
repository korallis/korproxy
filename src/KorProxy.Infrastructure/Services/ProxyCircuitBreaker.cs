using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

public sealed class ProxyCircuitBreaker : IProxyCircuitBreaker
{
    private readonly ILogger<ProxyCircuitBreaker> _logger;
    private readonly object _lock = new();
    
    private int _consecutiveFailures;
    private Exception? _lastError;
    private bool _isOpen;

    public bool IsOpen
    {
        get { lock (_lock) return _isOpen; }
    }

    public int ConsecutiveFailures
    {
        get { lock (_lock) return _consecutiveFailures; }
    }

    public int MaxFailures { get; }

    public Exception? LastError
    {
        get { lock (_lock) return _lastError; }
    }

    public ProxyCircuitBreaker(int maxFailures, ILogger<ProxyCircuitBreaker> logger)
    {
        MaxFailures = maxFailures;
        _logger = logger;
    }

    public void RecordSuccess()
    {
        lock (_lock)
        {
            _consecutiveFailures = 0;
            _lastError = null;
        }
    }

    public void RecordFailure(Exception? error = null)
    {
        lock (_lock)
        {
            _consecutiveFailures++;
            _lastError = error;

            if (_consecutiveFailures >= MaxFailures && !_isOpen)
            {
                _isOpen = true;
                _logger.LogError("Circuit breaker opened after {Count} consecutive failures", _consecutiveFailures);
            }
        }
    }

    public void Reset()
    {
        lock (_lock)
        {
            var wasOpen = _isOpen;
            _consecutiveFailures = 0;
            _lastError = null;
            _isOpen = false;

            if (wasOpen)
            {
                _logger.LogInformation("Circuit breaker reset");
            }
        }
    }
}

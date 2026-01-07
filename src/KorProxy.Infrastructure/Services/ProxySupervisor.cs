using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KorProxy.Infrastructure.Services;

public sealed class ProxySupervisor : IProxySupervisor, IDisposable
{
    private readonly IProxyProcessRunner _processRunner;
    private readonly IProxyCircuitBreaker _circuitBreaker;
    private readonly ILogger<ProxySupervisor> _logger;
    private readonly ProxyOptions _options;

    private readonly object _stateLock = new();
    private ProxyState _state = ProxyState.Stopped;
    private CancellationTokenSource? _shutdownCts;
    private volatile bool _isDisposing;

    public ProxyState State
    {
        get { lock (_stateLock) return _state; }
    }

    public event EventHandler<ProxyState>? StateChanged;

    public ProxySupervisor(
        IProxyProcessRunner processRunner,
        IProxyCircuitBreaker circuitBreaker,
        IOptions<ProxyOptions> options,
        ILogger<ProxySupervisor> logger)
    {
        _processRunner = processRunner;
        _circuitBreaker = circuitBreaker;
        _options = options.Value;
        _logger = logger;
        _shutdownCts = new CancellationTokenSource();

        _processRunner.ProcessExited += OnProcessExited;
    }

    public ProxyStatus GetStatus()
    {
        lock (_stateLock)
        {
            return new ProxyStatus(
                _state,
                _processRunner.ProcessId,
                _processRunner.StartedAt,
                _state == ProxyState.Running ? $"http://localhost:{_options.ProxyPort}" : null,
                _circuitBreaker.ConsecutiveFailures,
                _circuitBreaker.LastError);
        }
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Cannot start proxy - supervisor is disposing");
            return;
        }

        lock (_stateLock)
        {
            if (_state == ProxyState.Starting || _state == ProxyState.Running)
            {
                _logger.LogDebug("Proxy already starting or running");
                return;
            }

            if (_circuitBreaker.IsOpen)
            {
                _logger.LogWarning("Cannot start - circuit breaker is open. Call ResetCircuitAsync first.");
                return;
            }

            SetState(ProxyState.Starting);
        }

        await StartProcessAsync(cancellationToken);
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        CancellationTokenSource? oldShutdownCts;
        lock (_stateLock)
        {
            oldShutdownCts = _shutdownCts;
            _shutdownCts = new CancellationTokenSource();
        }

        try { oldShutdownCts?.Cancel(); } catch { }
        try { oldShutdownCts?.Dispose(); } catch { }

        lock (_stateLock)
        {
            if (_state == ProxyState.Stopped)
                return;

            SetState(ProxyState.Stopping);
        }

        await _processRunner.StopAsync(cancellationToken);

        lock (_stateLock)
        {
            SetState(ProxyState.Stopped);
        }
    }

    public Task ResetCircuitAsync(CancellationToken cancellationToken = default)
    {
        lock (_stateLock)
        {
            if (!_circuitBreaker.IsOpen)
                return Task.CompletedTask;

            _circuitBreaker.Reset();
            SetState(ProxyState.Stopped);
        }

        return Task.CompletedTask;
    }

    public IReadOnlyList<string> GetRecentLogs()
    {
        return _processRunner.RecentLogs;
    }

    private async Task StartProcessAsync(CancellationToken cancellationToken)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Skipping process start during shutdown");
            return;
        }

        try
        {
            var success = await _processRunner.StartAsync(cancellationToken);

            if (success)
            {
                _circuitBreaker.RecordSuccess();
                SetState(ProxyState.Running);
            }
            else
            {
                throw new InvalidOperationException("Failed to start proxy process");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start proxy");
            await HandleStartupFailureAsync(ex);
        }
    }

    private async void OnProcessExited(object? sender, int exitCode)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Process exited during shutdown, skipping restart logic");
            return;
        }

        try
        {
            lock (_stateLock)
            {
                if (_state == ProxyState.Stopping || _state == ProxyState.Stopped)
                    return;
            }

            if (_isDisposing)
                return;

            await HandleRuntimeFailureAsync(new Exception($"Process exited unexpectedly with code {exitCode}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception in OnProcessExited handler");
        }
    }

    private Task HandleStartupFailureAsync(Exception ex)
    {
        _circuitBreaker.RecordFailure(ex);

        if (_circuitBreaker.IsOpen)
        {
            SetState(ProxyState.CircuitOpen);
        }
        else
        {
            SetState(ProxyState.Error);
        }

        return Task.CompletedTask;
    }

    private async Task HandleRuntimeFailureAsync(Exception ex)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Skipping runtime failure handling during shutdown");
            return;
        }

        _circuitBreaker.RecordFailure(ex);

        if (_circuitBreaker.IsOpen)
        {
            SetState(ProxyState.CircuitOpen);
            return;
        }

        SetState(ProxyState.Error);

        var failures = _circuitBreaker.ConsecutiveFailures;
        var backoffSeconds = Math.Pow(2, Math.Min(failures - 1, 4));
        _logger.LogInformation("Retrying in {Seconds}s (attempt {Count}/{Max})",
            backoffSeconds, failures, _circuitBreaker.MaxFailures);

        try
        {
            await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), _shutdownCts?.Token ?? CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Restart backoff cancelled due to shutdown");
            return;
        }

        if (_isDisposing)
        {
            _logger.LogDebug("Skipping auto-restart due to shutdown");
            return;
        }

        SetState(ProxyState.Starting);
        await StartProcessAsync(CancellationToken.None);
    }

    private void SetState(ProxyState newState)
    {
        ProxyState oldState;
        lock (_stateLock)
        {
            oldState = _state;
            if (oldState == newState) return;
            _state = newState;
        }

        _logger.LogInformation("Proxy state: {OldState} -> {NewState}", oldState, newState);
        StateChanged?.Invoke(this, newState);
    }

    public void Dispose()
    {
        if (_isDisposing)
            return;

        _isDisposing = true;

        _processRunner.ProcessExited -= OnProcessExited;

        try
        {
            _shutdownCts?.Cancel();
        }
        catch (ObjectDisposedException) { }

        try { _shutdownCts?.Dispose(); } catch { }

        _shutdownCts = null;

        if (_processRunner is IDisposable disposable)
        {
            disposable.Dispose();
        }
    }
}

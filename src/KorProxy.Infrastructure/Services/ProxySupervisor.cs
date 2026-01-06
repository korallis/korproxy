using System.Collections.Concurrent;
using System.Diagnostics;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Manages the CLIProxyAPI subprocess lifecycle with crash recovery and circuit breaker
/// </summary>
public sealed class ProxySupervisor : IProxySupervisor, IDisposable
{
    private readonly IAppPaths _appPaths;
    private readonly IManagementApiClient _apiClient;
    private readonly ILogger<ProxySupervisor> _logger;
    private readonly ProxyOptions _options;
    
    private readonly object _stateLock = new();
    private readonly ConcurrentQueue<string> _recentLogs = new();
    private const int MaxLogLines = 500;
    
    private Process? _process;
    private ProxyState _state = ProxyState.Stopped;
    private int _consecutiveFailures;
    private DateTimeOffset? _startedAt;
    private Exception? _lastError;
    private CancellationTokenSource? _healthCheckCts;
    private CancellationTokenSource? _shutdownCts;
    private volatile bool _isDisposing;

    public ProxyState State
    {
        get { lock (_stateLock) return _state; }
    }

    public event EventHandler<ProxyState>? StateChanged;

    public ProxySupervisor(
        IAppPaths appPaths,
        IManagementApiClient apiClient,
        IOptions<ProxyOptions> options,
        ILogger<ProxySupervisor> logger)
    {
        _appPaths = appPaths;
        _apiClient = apiClient;
        _options = options.Value;
        _logger = logger;
        _shutdownCts = new CancellationTokenSource();
    }

    public ProxyStatus GetStatus()
    {
        lock (_stateLock)
        {
            return new ProxyStatus(
                _state,
                _process?.Id,
                _startedAt,
                _state == ProxyState.Running ? $"http://127.0.0.1:{_options.Port}" : null,
                _consecutiveFailures,
                _lastError);
        }
    }

    public async Task StartAsync(CancellationToken cancellationToken = default)
    {
        // Don't start if we're disposing
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

            if (_state == ProxyState.CircuitOpen)
            {
                _logger.LogWarning("Cannot start - circuit breaker is open. Call ResetCircuitAsync first.");
                return;
            }

            // Set state inside lock to prevent race condition where multiple callers
            // could pass the check and start multiple processes
            SetState(ProxyState.Starting);
        }

        await StartProcessAsync(cancellationToken);
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        // Signal all background operations to stop and prevent restarts
        _isDisposing = true;
        
        try
        {
            _shutdownCts?.Cancel();
        }
        catch (ObjectDisposedException)
        {
            // Already disposed
        }
        
        _healthCheckCts?.Cancel();
        
        Process? proc;
        lock (_stateLock)
        {
            if (_state == ProxyState.Stopped)
                return;

            SetState(ProxyState.Stopping);
            proc = _process;
        }

        if (proc != null && !proc.HasExited)
        {
            _logger.LogInformation("Stopping proxy process {ProcessId}", proc.Id);
            
            try
            {
                // Unsubscribe from Exited event to prevent restart attempts during shutdown
                proc.Exited -= OnProcessExited;
                
                // Kill the process
                proc.Kill(entireProcessTree: true);
                
                // Wait for exit with timeout
                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                timeoutCts.CancelAfter(TimeSpan.FromSeconds(5));
                
                try
                {
                    await proc.WaitForExitAsync(timeoutCts.Token);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogWarning("Proxy process did not exit gracefully within timeout");
                }
            }
            catch (InvalidOperationException)
            {
                // Process already exited
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping proxy process");
            }
        }

        lock (_stateLock)
        {
            try
            {
                _process?.Dispose();
            }
            catch (InvalidOperationException)
            {
                // Process already disposed
            }
            _process = null;
            _startedAt = null;
            SetState(ProxyState.Stopped);
        }
    }

    public Task ResetCircuitAsync(CancellationToken cancellationToken = default)
    {
        lock (_stateLock)
        {
            if (_state != ProxyState.CircuitOpen)
                return Task.CompletedTask;

            _consecutiveFailures = 0;
            _lastError = null;
            SetState(ProxyState.Stopped);
        }

        _logger.LogInformation("Circuit breaker reset");
        return Task.CompletedTask;
    }

    public IReadOnlyList<string> GetRecentLogs()
    {
        return _recentLogs.ToArray();
    }

    private async Task StartProcessAsync(CancellationToken cancellationToken)
    {
        // State already set to Starting in StartAsync before calling this method
        
        // Check disposal state before proceeding
        if (_isDisposing)
        {
            _logger.LogDebug("Skipping process start during shutdown");
            return;
        }
        
        try
        {
            var binaryPath = _appPaths.ProxyBinaryPath;
            
            if (!File.Exists(binaryPath))
            {
                throw new FileNotFoundException($"CLIProxyAPI binary not found at: {binaryPath}");
            }

            // Ensure binary is executable on Unix
            if (!OperatingSystem.IsWindows())
            {
                await MakeExecutableAsync(binaryPath, cancellationToken);
            }

            // Ensure config file exists before starting
            EnsureConfigFileExists();
            
            var startInfo = new ProcessStartInfo
            {
                FileName = binaryPath,
                Arguments = $"-config \"{_appPaths.ConfigFilePath}\"",
                WorkingDirectory = _appPaths.DataDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                Environment =
                {
                    ["KORPROXY_DATA_DIR"] = _appPaths.DataDirectory,
                    ["KORPROXY_AUTH_DIR"] = _appPaths.AuthDirectory
                }
            };

            _logger.LogInformation("Starting proxy: {Binary} -config {Config}", binaryPath, _appPaths.ConfigFilePath);

            var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };
            
            process.OutputDataReceived += (_, e) => HandleOutput(e.Data);
            process.ErrorDataReceived += (_, e) => HandleOutput(e.Data, isError: true);
            process.Exited += OnProcessExited;

            if (!process.Start())
            {
                throw new InvalidOperationException("Failed to start proxy process");
            }

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            lock (_stateLock)
            {
                _process = process;
            }

            // Wait for health check
            var healthy = await WaitForHealthyAsync(cancellationToken);
            
            if (healthy)
            {
                lock (_stateLock)
                {
                    _startedAt = DateTimeOffset.Now;
                    _consecutiveFailures = 0;
                    SetState(ProxyState.Running);
                }
                
                _logger.LogInformation("Proxy started successfully on port {Port}", _options.Port);
                
                // Start background health monitoring
                StartHealthMonitoring();
            }
            else
            {
                throw new TimeoutException("Proxy failed to become healthy within timeout");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start proxy");
            await HandleStartupFailureAsync(ex);
        }
    }

    private async Task<bool> WaitForHealthyAsync(CancellationToken cancellationToken)
    {
        var timeout = TimeSpan.FromSeconds(_options.StartupTimeoutSeconds);
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeout);

        var delay = TimeSpan.FromMilliseconds(100);
        var maxDelay = TimeSpan.FromSeconds(2);

        while (!timeoutCts.Token.IsCancellationRequested)
        {
            try
            {
                var isHealthy = await _apiClient.PingAsync(timeoutCts.Token);
                if (isHealthy) return true;
            }
            catch
            {
                // Expected during startup
            }

            try
            {
                await Task.Delay(delay, timeoutCts.Token);
                delay = TimeSpan.FromMilliseconds(Math.Min(delay.TotalMilliseconds * 1.5, maxDelay.TotalMilliseconds));
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        return false;
    }

    private void StartHealthMonitoring()
    {
        _healthCheckCts?.Cancel();
        _healthCheckCts = new CancellationTokenSource();
        
        _ = MonitorHealthAsync(_healthCheckCts.Token);
    }

    private async Task MonitorHealthAsync(CancellationToken ct)
    {
        var failedChecks = 0;
        const int maxFailedChecks = 3;

        while (!ct.IsCancellationRequested && !_isDisposing)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(10), ct);
                
                // Check disposal state after delay
                if (_isDisposing)
                    break;
                
                var isHealthy = await _apiClient.PingAsync(ct);
                
                if (isHealthy)
                {
                    failedChecks = 0;
                }
                else
                {
                    failedChecks++;
                    _logger.LogWarning("Health check failed ({Count}/{Max})", failedChecks, maxFailedChecks);
                    
                    if (failedChecks >= maxFailedChecks && !_isDisposing)
                    {
                        _logger.LogError("Too many failed health checks, marking as unhealthy");
                        await HandleRuntimeFailureAsync(new Exception("Health check failed"));
                        break;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                if (_isDisposing)
                    break;
                    
                failedChecks++;
                _logger.LogWarning(ex, "Health check error ({Count}/{Max})", failedChecks, maxFailedChecks);
                
                if (failedChecks >= maxFailedChecks && !_isDisposing)
                {
                    await HandleRuntimeFailureAsync(ex);
                    break;
                }
            }
        }
    }

    private async void OnProcessExited(object? sender, EventArgs e)
    {
        // Check disposal first - if we're shutting down, don't do anything
        if (_isDisposing)
        {
            _logger.LogDebug("Process exited during shutdown, skipping restart logic");
            return;
        }
        
        try
        {
            var exitCode = _process?.ExitCode ?? -1;
            _logger.LogWarning("Proxy process exited with code {ExitCode}", exitCode);

            lock (_stateLock)
            {
                if (_state == ProxyState.Stopping || _state == ProxyState.Stopped)
                    return;
            }

            // Double-check we're not disposing before attempting restart
            if (_isDisposing)
                return;

            await HandleRuntimeFailureAsync(new Exception($"Process exited unexpectedly with code {exitCode}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception in OnProcessExited handler");
        }
    }

    private async Task HandleStartupFailureAsync(Exception ex)
    {
        lock (_stateLock)
        {
            _consecutiveFailures++;
            _lastError = ex;
            
            if (_consecutiveFailures >= _options.MaxConsecutiveFailures)
            {
                _logger.LogError("Circuit breaker opened after {Count} consecutive failures", _consecutiveFailures);
                SetState(ProxyState.CircuitOpen);
            }
            else
            {
                SetState(ProxyState.Error);
            }
        }

        // Cleanup
        if (_process != null)
        {
            try
            {
                if (!_process.HasExited)
                    _process.Kill(entireProcessTree: true);
            }
            catch { }
            
            _process.Dispose();
            _process = null;
        }

        await Task.CompletedTask;
    }

    private async Task HandleRuntimeFailureAsync(Exception ex)
    {
        // Don't attempt restart if we're shutting down
        if (_isDisposing)
        {
            _logger.LogDebug("Skipping runtime failure handling during shutdown");
            return;
        }
        
        _healthCheckCts?.Cancel();
        
        int failures;
        lock (_stateLock)
        {
            _consecutiveFailures++;
            _lastError = ex;
            failures = _consecutiveFailures;
            
            if (failures >= _options.MaxConsecutiveFailures)
            {
                SetState(ProxyState.CircuitOpen);
                return;
            }
            
            SetState(ProxyState.Error);
        }

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        var backoffSeconds = Math.Pow(2, Math.Min(failures - 1, 4));
        _logger.LogInformation("Retrying in {Seconds}s (attempt {Count}/{Max})", 
            backoffSeconds, failures, _options.MaxConsecutiveFailures);

        try
        {
            // Use shutdown token to allow cancellation during backoff wait
            await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), _shutdownCts?.Token ?? CancellationToken.None);
        }
        catch (OperationCanceledException)
        {
            _logger.LogDebug("Restart backoff cancelled due to shutdown");
            return;
        }

        // Final check before restart
        if (_isDisposing)
        {
            _logger.LogDebug("Skipping auto-restart due to shutdown");
            return;
        }

        // Auto-restart
        await StartProcessAsync(CancellationToken.None);
    }

    private void HandleOutput(string? data, bool isError = false)
    {
        if (string.IsNullOrEmpty(data)) return;

        // Add to log buffer
        _recentLogs.Enqueue(data);
        while (_recentLogs.Count > MaxLogLines)
            _recentLogs.TryDequeue(out _);

        // Log based on content
        if (isError || data.Contains("error", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("[Proxy] {Message}", data);
        }
        else if (data.Contains("warn", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("[Proxy] {Message}", data);
        }
        else
        {
            _logger.LogDebug("[Proxy] {Message}", data);
        }
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

    private static async Task MakeExecutableAsync(string path, CancellationToken ct)
    {
        using var chmod = Process.Start(new ProcessStartInfo
        {
            FileName = "chmod",
            Arguments = $"+x \"{path}\"",
            UseShellExecute = false,
            CreateNoWindow = true
        });

        if (chmod != null)
        {
            await chmod.WaitForExitAsync(ct);
        }
    }

    private void EnsureConfigFileExists()
    {
        var configPath = _appPaths.ConfigFilePath;
        if (File.Exists(configPath))
            return;

        var configDir = Path.GetDirectoryName(configPath);
        if (!string.IsNullOrEmpty(configDir))
            Directory.CreateDirectory(configDir);

        var defaultConfig = $"""
            host: "127.0.0.1"
            port: {_options.Port}
            auth-dir: "{_appPaths.AuthDirectory.Replace("\\", "/")}"
            api-keys:
              - "korproxy-local-key"
            remote-management:
              secret-key: "{_options.ManagementKey}"
            debug: false
            logging-to-file: false
            usage-statistics-enabled: true
            request-retry: 3
            max-retry-interval: 30
            """;

        File.WriteAllText(configPath, defaultConfig);
        _logger.LogInformation("Created default config at {Path}", configPath);
    }

    public void Dispose()
    {
        if (_isDisposing)
            return;
            
        _isDisposing = true;
        
        // Cancel all background operations
        try
        {
            _shutdownCts?.Cancel();
        }
        catch (ObjectDisposedException)
        {
            // Already disposed
        }
        
        try
        {
            _healthCheckCts?.Cancel();
        }
        catch (ObjectDisposedException)
        {
            // Already disposed
        }
        
        // Kill the process if still running
        try
        {
            if (_process != null)
            {
                _process.Exited -= OnProcessExited;
                
                if (!_process.HasExited)
                {
                    _process.Kill(entireProcessTree: true);
                }
            }
        }
        catch (InvalidOperationException)
        {
            // Process already exited
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error killing proxy process during dispose");
        }
        
        // Dispose resources
        try
        {
            _healthCheckCts?.Dispose();
        }
        catch { }
        
        try
        {
            _shutdownCts?.Dispose();
        }
        catch { }
        
        try
        {
            _process?.Dispose();
        }
        catch { }
        
        _healthCheckCts = null;
        _shutdownCts = null;
        _process = null;
    }
}

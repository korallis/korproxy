using System.Collections.Concurrent;
using System.Diagnostics;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KorProxy.Infrastructure.Services;

public sealed class ProxyProcessRunner : IProxyProcessRunner, IDisposable
{
    private readonly IAppPaths _appPaths;
    private readonly IManagementApiClient _apiClient;
    private readonly IManagementKeyProvider _keyProvider;
    private readonly ILogger<ProxyProcessRunner> _logger;
    private readonly ProxyOptions _options;

    private readonly object _stateLock = new();
    private readonly ConcurrentQueue<string> _recentLogs = new();
    private const int MaxLogLines = 500;

    private Process? _process;
    private DateTimeOffset? _startedAt;
    private CancellationTokenSource? _healthCheckCts;
    private volatile bool _isDisposing;

    public int? ProcessId
    {
        get { lock (_stateLock) return _process?.Id; }
    }

    public bool IsRunning
    {
        get
        {
            lock (_stateLock)
            {
                return _process != null && !_process.HasExited;
            }
        }
    }

    public DateTimeOffset? StartedAt
    {
        get { lock (_stateLock) return _startedAt; }
    }

    public IReadOnlyList<string> RecentLogs => _recentLogs.ToArray();

    public event EventHandler<int>? ProcessExited;

    public ProxyProcessRunner(
        IAppPaths appPaths,
        IManagementApiClient apiClient,
        IManagementKeyProvider keyProvider,
        IOptions<ProxyOptions> options,
        ILogger<ProxyProcessRunner> logger)
    {
        _appPaths = appPaths;
        _apiClient = apiClient;
        _keyProvider = keyProvider;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<bool> StartAsync(CancellationToken ct = default)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Cannot start process - runner is disposing");
            return false;
        }

        lock (_stateLock)
        {
            if (IsRunning)
            {
                _logger.LogDebug("Process already running");
                return true;
            }
        }

        try
        {
            var binaryPath = _appPaths.ProxyBinaryPath;

            if (!File.Exists(binaryPath))
            {
                throw new FileNotFoundException($"CLIProxyAPI binary not found at: {binaryPath}");
            }

            if (!OperatingSystem.IsWindows())
            {
                await MakeExecutableAsync(binaryPath, ct);
            }

            await EnsureConfigFileExistsAsync(ct);

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

            var healthy = await WaitForHealthyAsync(ct);

            if (healthy)
            {
                lock (_stateLock)
                {
                    _startedAt = DateTimeOffset.Now;
                }

                _logger.LogInformation("Proxy started successfully on port {Port}", _options.Port);

                await EnsureUsageStatisticsEnabledAsync();
                StartHealthMonitoring();
                return true;
            }
            else
            {
                throw new TimeoutException("Proxy failed to become healthy within timeout");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start proxy");
            await CleanupProcessAsync();
            throw;
        }
    }

    public async Task StopAsync(CancellationToken ct = default)
    {
        _healthCheckCts?.Cancel();

        Process? proc;
        lock (_stateLock)
        {
            proc = _process;
        }

        if (proc != null && !proc.HasExited)
        {
            _logger.LogInformation("Stopping proxy process {ProcessId}", proc.Id);

            try
            {
                proc.Exited -= OnProcessExited;
                proc.Kill(entireProcessTree: true);

                using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
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
                    break;
                }
            }
        }
    }

    private void OnProcessExited(object? sender, EventArgs e)
    {
        if (_isDisposing)
        {
            _logger.LogDebug("Process exited during shutdown, skipping event");
            return;
        }

        try
        {
            var exitCode = _process?.ExitCode ?? -1;
            _logger.LogWarning("Proxy process exited with code {ExitCode}", exitCode);
            ProcessExited?.Invoke(this, exitCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception in OnProcessExited handler");
        }
    }

    private Task CleanupProcessAsync()
    {
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

        return Task.CompletedTask;
    }

    private void HandleOutput(string? data, bool isError = false)
    {
        if (string.IsNullOrEmpty(data)) return;

        _recentLogs.Enqueue(data);
        while (_recentLogs.Count > MaxLogLines)
            _recentLogs.TryDequeue(out _);

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

    private async Task EnsureConfigFileExistsAsync(CancellationToken ct)
    {
        var configPath = _appPaths.ConfigFilePath;
        if (File.Exists(configPath))
            return;

        var configDir = Path.GetDirectoryName(configPath);
        if (!string.IsNullOrEmpty(configDir))
            Directory.CreateDirectory(configDir);

        var managementKey = await _keyProvider.GetOrCreateKeyAsync(ct);

        var defaultConfig = $"""
            host: "127.0.0.1"
            port: {_options.Port}
            auth-dir: "{_appPaths.AuthDirectory.Replace("\\", "/")}"
            api-keys:
              - "korproxy-local-key"
            remote-management:
              secret-key: "{managementKey}"
            debug: false
            logging-to-file: false
            usage-statistics-enabled: true
            request-retry: 3
            max-retry-interval: 30
            """;

        await File.WriteAllTextAsync(configPath, defaultConfig, ct);
        _logger.LogInformation("Created default config at {Path}", configPath);
    }

    private async Task EnsureUsageStatisticsEnabledAsync()
    {
        try
        {
            var enabled = await _apiClient.GetUsageStatisticsEnabledAsync();
            if (enabled == true)
            {
                _logger.LogDebug("Usage statistics already enabled");
                return;
            }

            _logger.LogInformation("Enabling usage statistics for existing config");
            var success = await _apiClient.SetUsageStatisticsEnabledAsync(true);
            if (success)
            {
                _logger.LogInformation("Usage statistics enabled successfully");
            }
            else
            {
                _logger.LogWarning("Failed to enable usage statistics via API");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error ensuring usage statistics are enabled");
        }
    }

    public void Dispose()
    {
        if (_isDisposing)
            return;

        _isDisposing = true;

        try
        {
            _healthCheckCts?.Cancel();
        }
        catch (ObjectDisposedException) { }

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
        catch (InvalidOperationException) { }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error killing proxy process during dispose");
        }

        try { _healthCheckCts?.Dispose(); } catch { }
        try { _process?.Dispose(); } catch { }

        _healthCheckCts = null;
        _process = null;
    }
}

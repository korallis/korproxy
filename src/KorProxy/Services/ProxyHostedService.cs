using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace KorProxy.Services;

/// <summary>
/// Background service that manages the proxy lifecycle with the application
/// </summary>
public sealed class ProxyHostedService : BackgroundService
{
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IAuthService _authService;
    private readonly IEntitlementService _entitlementService;
    private readonly ISubscriptionGate _subscriptionGate;
    private readonly ProxyOptions _options;
    private readonly ILogger<ProxyHostedService> _logger;

    public ProxyHostedService(
        IProxySupervisor proxySupervisor,
        IAuthService authService,
        IEntitlementService entitlementService,
        ISubscriptionGate subscriptionGate,
        IOptions<ProxyOptions> options,
        ILogger<ProxyHostedService> logger)
    {
        _proxySupervisor = proxySupervisor;
        _authService = authService;
        _entitlementService = entitlementService;
        _subscriptionGate = subscriptionGate;
        _options = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ProxyHostedService starting, AutoStart={AutoStart}", _options.AutoStart);
        
        if (_options.AutoStart)
        {
            await AutoStartWhenReadyAsync(stoppingToken);
        }

        // Keep running until shutdown
        try
        {
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            // Expected on shutdown
        }
    }

    private async Task AutoStartWhenReadyAsync(CancellationToken stoppingToken)
    {
        // Auto-start depends on session + entitlements. Those are initialized by other hosted services and may
        // complete after this service starts, so we wait for the prerequisites and then trigger StartAsync once.
        var signal = new SemaphoreSlim(0, int.MaxValue);

        void Kick()
        {
            try
            {
                signal.Release();
            }
            catch (SemaphoreFullException)
            {
                // Ignore (coalescing signals is fine).
            }
            catch (ObjectDisposedException)
            {
                // Shutdown.
            }
        }

        EventHandler<AuthSession?>? sessionHandler = (_, _) => Kick();
        EventHandler<EntitlementCache>? entitlementHandler = (_, _) => Kick();

        _authService.SessionChanged += sessionHandler;
        _entitlementService.CacheChanged += entitlementHandler;

        try
        {
            // Give the UI a moment to initialize.
            await Task.Delay(500, stoppingToken);

            // Initial attempt.
            Kick();

            while (!stoppingToken.IsCancellationRequested)
            {
                // Wait for a meaningful state change (session/entitlements) or poll occasionally to avoid missing events.
                try
                {
                    await signal.WaitAsync(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                // If already running/starting, nothing to do.
                var state = _proxySupervisor.State;
                if (state == ProxyState.Running || state == ProxyState.Starting)
                    return;

                var session = _authService.CurrentSession;
                if (session == null)
                {
                    _logger.LogDebug("Auto-start waiting: no session yet");
                    continue;
                }

                var entitlements = _entitlementService.Cache.Entitlements;
                var allowed = _subscriptionGate.CanStartProxy(
                    session,
                    entitlements,
                    DateTimeOffset.UtcNow,
                    out var reason);

                if (!allowed)
                {
                    _logger.LogDebug("Auto-start blocked: {Reason}", reason);
                    continue;
                }

                try
                {
                    _logger.LogInformation("Auto-starting proxy...");
                    await _proxySupervisor.StartAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to auto-start proxy");
                }

                // Only attempt auto-start once; supervisor handles runtime restarts.
                return;
            }
        }
        finally
        {
            _authService.SessionChanged -= sessionHandler;
            _entitlementService.CacheChanged -= entitlementHandler;
            signal.Dispose();
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("ProxyHostedService stopping...");
        
        try
        {
            await _proxySupervisor.StopAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping proxy");
        }

        await base.StopAsync(cancellationToken);
    }
}

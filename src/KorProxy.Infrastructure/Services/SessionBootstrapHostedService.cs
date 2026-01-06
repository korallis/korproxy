using KorProxy.Core.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

public sealed class SessionBootstrapHostedService : IHostedService
{
    private readonly IAuthService _authService;
    private readonly IEntitlementService _entitlementService;
    private readonly IDeviceService _deviceService;
    private readonly ILogger<SessionBootstrapHostedService> _logger;

    public SessionBootstrapHostedService(
        IAuthService authService,
        IEntitlementService entitlementService,
        IDeviceService deviceService,
        ILogger<SessionBootstrapHostedService> logger)
    {
        _authService = authService;
        _entitlementService = entitlementService;
        _deviceService = deviceService;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            await _entitlementService.InitializeAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to initialize entitlements on startup");
        }

        try
        {
            var session = await _authService.LoadSessionAsync(cancellationToken);
            if (session == null)
            {
                var imported = await _authService.TryImportLegacySessionAsync(cancellationToken);
                if (imported)
                {
                    session = await _authService.LoadSessionAsync(cancellationToken);
                }
            }

            if (session != null)
            {
                await SyncSessionAsync(session.Token, cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to load session on startup - app will continue without auth");
        }

        _authService.SessionChanged += OnSessionChanged;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _authService.SessionChanged -= OnSessionChanged;
        return Task.CompletedTask;
    }

    private void OnSessionChanged(object? sender, Core.Models.AuthSession? session)
    {
        if (session == null)
            return;

        _ = Task.Run(() => SyncSessionAsync(session.Token, CancellationToken.None));
    }

    private async Task SyncSessionAsync(string token, CancellationToken ct)
    {
        try
        {
            await _entitlementService.SyncAsync(token, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync entitlements on startup");
        }

        try
        {
            await _deviceService.RegisterAsync(token, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to register device");
        }
    }
}

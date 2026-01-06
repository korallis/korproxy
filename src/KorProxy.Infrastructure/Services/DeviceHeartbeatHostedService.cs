using KorProxy.Core.Services;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

public sealed class DeviceHeartbeatHostedService : BackgroundService
{
    private readonly IAuthService _authService;
    private readonly IDeviceIdentityProvider _identityProvider;
    private readonly IDeviceService _deviceService;
    private readonly ILogger<DeviceHeartbeatHostedService> _logger;

    public DeviceHeartbeatHostedService(
        IAuthService authService,
        IDeviceIdentityProvider identityProvider,
        IDeviceService deviceService,
        ILogger<DeviceHeartbeatHostedService> logger)
    {
        _authService = authService;
        _identityProvider = identityProvider;
        _deviceService = deviceService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var session = _authService.CurrentSession;
                if (session != null)
                {
                    var deviceId = await _identityProvider.GetDeviceIdAsync(stoppingToken);
                    await _deviceService.UpdateLastSeenAsync(session.Token, deviceId, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Device heartbeat failed");
            }

            try
            {
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}

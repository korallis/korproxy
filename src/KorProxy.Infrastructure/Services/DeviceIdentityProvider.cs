using System.Reflection;
using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class DeviceIdentityProvider : IDeviceIdentityProvider
{
    private readonly ISessionStore _sessionStore;

    public DeviceIdentityProvider(ISessionStore sessionStore)
    {
        _sessionStore = sessionStore;
    }

    public async Task<DeviceInfo> GetDeviceInfoAsync(CancellationToken ct = default)
    {
        var deviceId = await GetDeviceIdAsync(ct);
        var deviceName = Environment.MachineName;
        var deviceType = DeviceType.Desktop;
        var platform = OperatingSystem.IsWindows() ? DevicePlatform.Win32
            : OperatingSystem.IsMacOS() ? DevicePlatform.Darwin
            : DevicePlatform.Linux;

        var version = Assembly.GetEntryAssembly()?.GetName().Version?.ToString() ?? "1.0.0";

        return new DeviceInfo(deviceId, deviceName, deviceType, platform, version);
    }

    public async Task<string> GetDeviceIdAsync(CancellationToken ct = default)
    {
        var existing = await _sessionStore.LoadDeviceIdAsync(ct);
        if (!string.IsNullOrWhiteSpace(existing))
            return existing;

        var deviceId = Guid.NewGuid().ToString("N");
        await _sessionStore.SaveDeviceIdAsync(deviceId, ct);
        return deviceId;
    }
}

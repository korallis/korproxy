using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IDeviceIdentityProvider
{
    Task<DeviceInfo> GetDeviceInfoAsync(CancellationToken ct = default);
    Task<string> GetDeviceIdAsync(CancellationToken ct = default);
}

using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IDeviceService
{
    Task<DeviceInfo> GetDeviceInfoAsync(CancellationToken ct = default);
    Task<DeviceRegistrationResult> RegisterAsync(string token, CancellationToken ct = default);
    Task<IReadOnlyList<DeviceRecord>> ListAsync(string token, CancellationToken ct = default);
    Task<DeviceActionResult> RemoveAsync(string token, string deviceId, CancellationToken ct = default);
    Task<DeviceActionResult> UpdateLastSeenAsync(string token, string deviceId, CancellationToken ct = default);
}

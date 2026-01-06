using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface ISessionStore
{
    Task<string?> LoadTokenAsync(CancellationToken ct = default);
    Task SaveTokenAsync(string token, CancellationToken ct = default);
    Task ClearTokenAsync(CancellationToken ct = default);

    Task<EntitlementCache?> LoadEntitlementCacheAsync(CancellationToken ct = default);
    Task SaveEntitlementCacheAsync(EntitlementCache cache, CancellationToken ct = default);
    Task ClearEntitlementCacheAsync(CancellationToken ct = default);

    Task<string?> LoadDeviceIdAsync(CancellationToken ct = default);
    Task SaveDeviceIdAsync(string deviceId, CancellationToken ct = default);
}

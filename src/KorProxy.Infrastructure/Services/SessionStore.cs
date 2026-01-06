using System.Text.Json;
using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class SessionStore : ISessionStore
{
    private const string TokenKey = "session-token";
    private const string EntitlementsKey = "entitlement-cache";
    private const string DeviceIdKey = "device-id";

    private readonly ISecureStorage _secureStorage;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = true
    };

    public SessionStore(ISecureStorage secureStorage)
    {
        _secureStorage = secureStorage;
    }

    public Task<string?> LoadTokenAsync(CancellationToken ct = default)
        => _secureStorage.ReadAsync(TokenKey, ct);

    public Task SaveTokenAsync(string token, CancellationToken ct = default)
        => _secureStorage.SaveAsync(TokenKey, token, ct);

    public Task ClearTokenAsync(CancellationToken ct = default)
        => _secureStorage.DeleteAsync(TokenKey, ct);

    public async Task<EntitlementCache?> LoadEntitlementCacheAsync(CancellationToken ct = default)
    {
        var payload = await _secureStorage.ReadAsync(EntitlementsKey, ct);
        if (string.IsNullOrWhiteSpace(payload))
            return null;

        return JsonSerializer.Deserialize<EntitlementCache>(payload, JsonOptions);
    }

    public Task SaveEntitlementCacheAsync(EntitlementCache cache, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(cache, JsonOptions);
        return _secureStorage.SaveAsync(EntitlementsKey, json, ct);
    }

    public Task ClearEntitlementCacheAsync(CancellationToken ct = default)
        => _secureStorage.DeleteAsync(EntitlementsKey, ct);

    public Task<string?> LoadDeviceIdAsync(CancellationToken ct = default)
        => _secureStorage.ReadAsync(DeviceIdKey, ct);

    public Task SaveDeviceIdAsync(string deviceId, CancellationToken ct = default)
        => _secureStorage.SaveAsync(DeviceIdKey, deviceId, ct);
}

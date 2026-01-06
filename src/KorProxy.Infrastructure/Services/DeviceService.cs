using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class DeviceService : IDeviceService
{
    private readonly IConvexApiClient _convex;
    private readonly IDeviceIdentityProvider _identityProvider;
    private readonly IEntitlementService _entitlements;

    public DeviceService(IConvexApiClient convex, IDeviceIdentityProvider identityProvider, IEntitlementService entitlements)
    {
        _convex = convex;
        _identityProvider = identityProvider;
        _entitlements = entitlements;
    }

    public Task<DeviceInfo> GetDeviceInfoAsync(CancellationToken ct = default)
        => _identityProvider.GetDeviceInfoAsync(ct);

    public async Task<DeviceRegistrationResult> RegisterAsync(string token, CancellationToken ct = default)
    {
        var devices = await ListAsync(token, ct);
        if (!_entitlements.CheckLimit("devices", devices.Count))
            return new DeviceRegistrationResult(false, null, "Device limit reached.");

        var info = await _identityProvider.GetDeviceInfoAsync(ct);
        var response = await _convex.MutationAsync<RegisterResponse>("devices:register", new
        {
            token,
            deviceInfo = new
            {
                deviceId = info.DeviceId,
                deviceName = info.DeviceName,
                deviceType = info.DeviceType.ToString().ToLowerInvariant(),
                platform = info.Platform switch
                {
                    DevicePlatform.Darwin => "darwin",
                    DevicePlatform.Win32 => "win32",
                    _ => "linux"
                },
                appVersion = info.AppVersion
            }
        }, ct);

        if (response == null || !response.Success)
            return new DeviceRegistrationResult(false, null, response?.Error ?? "Device registration failed.");

        return new DeviceRegistrationResult(true, response.DeviceId, null);
    }

    public async Task<IReadOnlyList<DeviceRecord>> ListAsync(string token, CancellationToken ct = default)
    {
        var response = await _convex.QueryAsync<List<DeviceResponse>>("devices:listForUser", new { token }, ct);
        if (response == null)
            return [];

        return response.Select(d => new DeviceRecord(
            d.Id,
            d.UserId,
            d.DeviceId,
            d.DeviceName,
            ParseDeviceType(d.DeviceType),
            ParsePlatform(d.Platform),
            d.AppVersion,
            d.LastSeenAt,
            d.CreatedAt)).ToList();
    }

    public async Task<DeviceActionResult> RemoveAsync(string token, string deviceId, CancellationToken ct = default)
    {
        var response = await _convex.MutationAsync<SimpleResponse>("devices:remove", new { token, deviceId }, ct);
        return response != null && response.Success
            ? new DeviceActionResult(true, null)
            : new DeviceActionResult(false, response?.Error ?? "Failed to remove device.");
    }

    public async Task<DeviceActionResult> UpdateLastSeenAsync(string token, string deviceId, CancellationToken ct = default)
    {
        var response = await _convex.MutationAsync<SimpleResponse>("devices:updateLastSeen", new { token, deviceId }, ct);
        return response != null && response.Success
            ? new DeviceActionResult(true, null)
            : new DeviceActionResult(false, response?.Error ?? "Failed to update device.");
    }

    private static DeviceType ParseDeviceType(string? deviceType)
        => deviceType?.ToLowerInvariant() switch
        {
            "laptop" => DeviceType.Laptop,
            "other" => DeviceType.Other,
            _ => DeviceType.Desktop
        };

    private static DevicePlatform ParsePlatform(string? platform)
        => platform?.ToLowerInvariant() switch
        {
            "darwin" => DevicePlatform.Darwin,
            "win32" => DevicePlatform.Win32,
            _ => DevicePlatform.Linux
        };

    private sealed record RegisterResponse(bool Success, string? DeviceId, string? Error);

    private sealed record SimpleResponse(bool Success, string? Error);

    private sealed record DeviceResponse(
        string Id,
        string UserId,
        string DeviceId,
        string DeviceName,
        string DeviceType,
        string Platform,
        string AppVersion,
        long LastSeenAt,
        long CreatedAt);
}

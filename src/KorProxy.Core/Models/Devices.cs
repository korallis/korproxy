namespace KorProxy.Core.Models;

public enum DeviceType
{
    Desktop,
    Laptop,
    Other
}

public enum DevicePlatform
{
    Darwin,
    Win32,
    Linux
}

public sealed record DeviceInfo(
    string DeviceId,
    string DeviceName,
    DeviceType DeviceType,
    DevicePlatform Platform,
    string AppVersion);

public sealed record DeviceRecord(
    string Id,
    string UserId,
    string DeviceId,
    string DeviceName,
    DeviceType DeviceType,
    DevicePlatform Platform,
    string AppVersion,
    long LastSeenAt,
    long CreatedAt);

public sealed record DeviceActionResult(bool Success, string? Error);

public sealed record DeviceRegistrationResult(bool Success, string? DeviceId, string? Error);

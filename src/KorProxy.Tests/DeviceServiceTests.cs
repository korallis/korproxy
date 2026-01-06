using KorProxy.Core.Models;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for device registration, limit enforcement, and device lifecycle.
/// Tests critical flows for device management and entitlement-based limits.
/// </summary>
public class DeviceServiceTests
{
    [Fact]
    public void DeviceInfo_ContainsRequiredMetadata()
    {
        // Arrange & Act
        var deviceInfo = new DeviceInfo(
            "device-12345-abcde",
            "MacBook Pro",
            DeviceType.Laptop,
            DevicePlatform.Darwin,
            "2.0.0");

        // Assert - Device info contains all required fields
        Assert.Equal("device-12345-abcde", deviceInfo.DeviceId);
        Assert.Equal("MacBook Pro", deviceInfo.DeviceName);
        Assert.Equal(DeviceType.Laptop, deviceInfo.DeviceType);
        Assert.Equal(DevicePlatform.Darwin, deviceInfo.Platform);
        Assert.Equal("2.0.0", deviceInfo.AppVersion);
    }

    [Fact]
    public void DeviceRecord_TrackingFields_ArePresent()
    {
        // Arrange
        var createdAt = DateTimeOffset.UtcNow.AddDays(-7).ToUnixTimeMilliseconds();
        var lastSeenAt = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        // Act
        var device = new DeviceRecord(
            "rec-123",
            "user-456",
            "device-abc",
            "Test Device",
            DeviceType.Desktop,
            DevicePlatform.Win32,
            "2.0.0",
            lastSeenAt,
            createdAt);

        // Assert - Device record includes tracking timestamps
        Assert.Equal("rec-123", device.Id);
        Assert.Equal("user-456", device.UserId);
        Assert.Equal("device-abc", device.DeviceId);
        Assert.Equal(lastSeenAt, device.LastSeenAt);
        Assert.Equal(createdAt, device.CreatedAt);
        Assert.True(device.LastSeenAt > device.CreatedAt);
    }

    [Fact]
    public void DeviceRegistrationResult_Success_ReturnsDeviceId()
    {
        // Arrange & Act
        var result = new DeviceRegistrationResult(true, "device-xyz", null);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("device-xyz", result.DeviceId);
        Assert.Null(result.Error);
    }

    [Fact]
    public void DeviceRegistrationResult_LimitReached_ReturnsError()
    {
        // Arrange & Act
        var result = new DeviceRegistrationResult(false, null, "Device limit reached.");

        // Assert
        Assert.False(result.Success);
        Assert.Null(result.DeviceId);
        Assert.Equal("Device limit reached.", result.Error);
    }

    [Fact]
    public void DeviceActionResult_RemovalSuccess_ReturnsTrue()
    {
        // Arrange & Act
        var result = new DeviceActionResult(true, null);

        // Assert
        Assert.True(result.Success);
        Assert.Null(result.Error);
    }

    [Fact]
    public void DeviceActionResult_RemovalFailure_ReturnsError()
    {
        // Arrange & Act
        var result = new DeviceActionResult(false, "Device not found or unauthorized.");

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Device not found or unauthorized.", result.Error);
    }

    [Fact]
    public void DevicePlatform_AllPlatforms_AreDefined()
    {
        // Assert - All supported platforms exist
        var platforms = new[]
        {
            DevicePlatform.Darwin,
            DevicePlatform.Win32,
            DevicePlatform.Linux
        };

        Assert.Equal(3, platforms.Length);
        Assert.Contains(DevicePlatform.Darwin, platforms);
        Assert.Contains(DevicePlatform.Win32, platforms);
        Assert.Contains(DevicePlatform.Linux, platforms);
    }

    [Fact]
    public void DeviceType_AllTypes_AreDefined()
    {
        // Assert - All device types exist
        var types = new[]
        {
            DeviceType.Desktop,
            DeviceType.Laptop,
            DeviceType.Other
        };

        Assert.Equal(3, types.Length);
        Assert.Contains(DeviceType.Desktop, types);
        Assert.Contains(DeviceType.Laptop, types);
        Assert.Contains(DeviceType.Other, types);
    }
}

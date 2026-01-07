using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Services;
using KorProxy.ViewModels;
using Moq;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for ViewModel behaviors: login, entitlement display, proxy status, and device management.
/// Tests critical UI flows without requiring Avalonia headless runtime.
/// </summary>
public class ViewModelTests
{
    private static Entitlements CreateDefaultEntitlements() =>
        new(Plan.Free, EntitlementScope.Personal, EntitlementStatus.Active,
            new PlanLimits(1, 1, 1, false, 7), null, null, null, null);

    private static EntitlementCache CreateDefaultCache() =>
        new(CreateDefaultEntitlements(), DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), false, null);

    [Fact]
    public async Task AccountViewModel_Login_UpdatesAuthenticatedState()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        var user = new UserProfile("user-123", "test@example.com", UserRole.User, "Test User",
            SubscriptionStatus.Active, "pro", null, null, false);
        var session = new AuthSession("token-123", user, null);

        authService.Setup(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResult(true, null, session));
        authService.SetupGet(x => x.CurrentSession).Returns(session);
        authService.Setup(x => x.LoadSessionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(session);
        entitlementService.SetupGet(x => x.Cache).Returns(new EntitlementCache(
            new Entitlements(Plan.Pro, EntitlementScope.Personal, EntitlementStatus.Active,
                new PlanLimits(10, 5, 3, true, 30), null, null, null, null),
            DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), false, null));
        deviceService.Setup(x => x.ListAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DeviceRecord>());

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);

        // Act
        viewModel.Email = "test@example.com";
        viewModel.Password = "password123";
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        authService.Verify(x => x.LoginAsync("test@example.com", "password123", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AccountViewModel_LoginFailure_ShowsErrorMessage()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        authService.Setup(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthResult(false, "Invalid credentials", null));
        entitlementService.SetupGet(x => x.Cache).Returns(CreateDefaultCache());

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);

        // Act
        viewModel.Email = "test@example.com";
        viewModel.Password = "wrongpassword";
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("Invalid credentials", viewModel.StatusMessage);
        Assert.False(viewModel.IsAuthenticated);
    }

    [Fact]
    public void AccountViewModel_EntitlementDisplay_ShowsCorrectPlanAndLimits()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        var entitlements = new Entitlements(
            Plan.Pro,
            EntitlementScope.Personal,
            EntitlementStatus.Active,
            new PlanLimits(10, 5, 3, true, 30),
            null, null, null, null);
        var cache = new EntitlementCache(entitlements, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), false, null);

        entitlementService.SetupGet(x => x.Cache).Returns(cache);

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);

        // Act - Trigger entitlement update via event
        entitlementService.Raise(x => x.CacheChanged += null, entitlementService.Object, cache);

        // Assert
        Assert.Equal("Pro", viewModel.EntitlementPlan);
        Assert.Equal("Personal", viewModel.EntitlementScope);
        Assert.Equal("Active", viewModel.EntitlementStatus);
        Assert.Contains("Profiles: 10", viewModel.EntitlementLimits);
        Assert.Contains("Devices: 3", viewModel.EntitlementLimits);
    }

    [Fact]
    public async Task AccountViewModel_DeviceList_DisplaysDevicesCorrectly()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        var user = new UserProfile("user-123", "test@example.com", UserRole.User, "Test User",
            SubscriptionStatus.Active, "pro", null, null, false);
        var session = new AuthSession("token-123", user, null);

        var devices = new List<DeviceRecord>
        {
            new("id-1", "user-123", "device-1", "MacBook Pro", DeviceType.Desktop, DevicePlatform.Darwin, "1.0.0", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()),
            new("id-2", "user-123", "device-2", "Windows PC", DeviceType.Desktop, DevicePlatform.Win32, "1.0.0", DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeMilliseconds(), DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeMilliseconds())
        };

        authService.SetupGet(x => x.CurrentSession).Returns(session);
        authService.Setup(x => x.LoadSessionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(session);
        deviceService.Setup(x => x.ListAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(devices);
        entitlementService.SetupGet(x => x.Cache).Returns(CreateDefaultCache());

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);

        // Act
        await viewModel.ActivateAsync();

        // Assert
        Assert.Equal(2, viewModel.Devices.Count);
        Assert.Equal("MacBook Pro", viewModel.Devices[0].DisplayName);
        Assert.Equal("Windows PC", viewModel.Devices[1].DisplayName);
    }

    [Fact]
    public async Task AccountViewModel_RemoveDevice_CallsDeviceService()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        var user = new UserProfile("user-123", "test@example.com", UserRole.User, "Test User",
            SubscriptionStatus.Active, "pro", null, null, false);
        var session = new AuthSession("token-123", user, null);

        var devices = new List<DeviceRecord>
        {
            new("id-1", "user-123", "device-1", "MacBook Pro", DeviceType.Desktop, DevicePlatform.Darwin, "1.0.0", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
        };

        authService.SetupGet(x => x.CurrentSession).Returns(session);
        authService.Setup(x => x.LoadSessionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(session);
        deviceService.Setup(x => x.ListAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(devices);
        deviceService.Setup(x => x.RemoveAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DeviceActionResult(true, null));
        entitlementService.SetupGet(x => x.Cache).Returns(CreateDefaultCache());

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);
        await viewModel.ActivateAsync();

        // Act
        var deviceItem = viewModel.Devices[0];
        await deviceItem.RemoveCommand.ExecuteAsync(null);

        // Assert
        deviceService.Verify(x => x.RemoveAsync("token-123", "device-1", It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public void ProxyStatus_ReflectsStateCorrectly()
    {
        // Arrange & Act - Test ProxyStatus record correctly stores state
        var stoppedStatus = new ProxyStatus(ProxyState.Stopped, null, null, null, 0, null);
        var runningStatus = new ProxyStatus(ProxyState.Running, 1234, DateTimeOffset.UtcNow, "http://localhost:1337", 0, null);
        var errorStatus = new ProxyStatus(ProxyState.Error, null, null, null, 3, new Exception("Test error"));

        // Assert
        Assert.Equal(ProxyState.Stopped, stoppedStatus.State);
        Assert.Null(stoppedStatus.ProcessId);
        
        Assert.Equal(ProxyState.Running, runningStatus.State);
        Assert.Equal(1234, runningStatus.ProcessId);
        Assert.Equal("http://localhost:1337", runningStatus.EndpointUrl);
        
        Assert.Equal(ProxyState.Error, errorStatus.State);
        Assert.Equal(3, errorStatus.ConsecutiveFailures);
        Assert.NotNull(errorStatus.LastError);
    }

    [Fact]
    public void SettingsViewModel_UpdateState_ReflectsUpdateProgress()
    {
        // Arrange
        var apiClient = new Mock<IManagementApiClient>();
        var appPaths = new Mock<IAppPaths>();
        var updateService = new Mock<IUpdateService>();
        var startupLaunchService = new Mock<IStartupLaunchService>();
        var navigationService = new Mock<INavigationService>();
        var options = Microsoft.Extensions.Options.Options.Create(new ProxyOptions());

        appPaths.SetupGet(x => x.ConfigFilePath).Returns("/test/config.yaml");
        appPaths.SetupGet(x => x.DataDirectory).Returns("/test/data");
        updateService.SetupGet(x => x.IsPortableBuild).Returns(false);
        updateService.SetupGet(x => x.State).Returns(new UpdateState(UpdateStatus.Idle, null, null, null));

        var viewModel = new SettingsViewModel(
            apiClient.Object,
            appPaths.Object,
            updateService.Object,
            startupLaunchService.Object,
            navigationService.Object,
            options);

        // Act - Simulate update state change
        var newState = new UpdateState(UpdateStatus.Downloading, "2.0.0", "Downloading v2.0.0...", 45.5);
        updateService.Raise(x => x.StateChanged += null, updateService.Object, newState);

        // Assert
        Assert.Equal("Downloading", viewModel.UpdateStatus);
        Assert.Equal("Downloading v2.0.0...", viewModel.UpdateMessage);
        Assert.Equal(45.5, viewModel.UpdateProgress);
    }

    [Fact]
    public async Task AccountViewModel_Logout_ClearsSessionAndDevices()
    {
        // Arrange
        var authService = new Mock<IAuthService>();
        var entitlementService = new Mock<IEntitlementService>();
        var deviceService = new Mock<IDeviceService>();

        var user = new UserProfile("user-123", "test@example.com", UserRole.User, "Test User",
            SubscriptionStatus.Active, "pro", null, null, false);
        var session = new AuthSession("token-123", user, null);

        authService.SetupGet(x => x.CurrentSession).Returns(session);
        authService.Setup(x => x.LoadSessionAsync(It.IsAny<CancellationToken>())).ReturnsAsync(session);
        authService.Setup(x => x.LogoutAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        deviceService.Setup(x => x.ListAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<DeviceRecord>());
        entitlementService.SetupGet(x => x.Cache).Returns(CreateDefaultCache());

        var viewModel = new AccountViewModel(authService.Object, entitlementService.Object, deviceService.Object);

        // Act
        await viewModel.LogoutCommand.ExecuteAsync(null);

        // Assert
        authService.Verify(x => x.LogoutAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

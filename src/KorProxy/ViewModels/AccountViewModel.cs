using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;

namespace KorProxy.ViewModels;

public partial class AccountViewModel : ViewModelBase
{
    private readonly IAuthService _authService;
    private readonly IEntitlementService _entitlementService;
    private readonly IDeviceService _deviceService;

    [ObservableProperty]
    private string _email = "";

    [ObservableProperty]
    private string _password = "";

    [ObservableProperty]
    private string _name = "";

    [ObservableProperty]
    private bool _isRegisterMode;

    [ObservableProperty]
    private bool _isBusy;

    [ObservableProperty]
    private string? _statusMessage;

    [ObservableProperty]
    private bool _isAuthenticated;

    [ObservableProperty]
    private string _userEmail = "";

    [ObservableProperty]
    private string _subscriptionStatus = "";

    [ObservableProperty]
    private string _subscriptionPlan = "";

    [ObservableProperty]
    private string _entitlementPlan = "";

    [ObservableProperty]
    private string _entitlementScope = "";

    [ObservableProperty]
    private string _entitlementStatus = "";

    [ObservableProperty]
    private string _entitlementLimits = "";

    [ObservableProperty]
    private string _gracePeriod = "";

    [ObservableProperty]
    private string _offlineGrace = "";

    public ObservableCollection<DeviceItemViewModel> Devices { get; } = [];

    [ActivatorUtilitiesConstructor]
    public AccountViewModel(IAuthService authService, IEntitlementService entitlementService, IDeviceService deviceService)
    {
        _authService = authService;
        _entitlementService = entitlementService;
        _deviceService = deviceService;

        _authService.SessionChanged += OnSessionChanged;
        _entitlementService.CacheChanged += OnEntitlementChanged;
    }

    public AccountViewModel()
    {
        _authService = null!;
        _entitlementService = null!;
        _deviceService = null!;
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await RefreshAsync(ct);
    }

    public override Task DeactivateAsync(CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }

    [RelayCommand]
    private Task ToggleModeAsync()
    {
        IsRegisterMode = !IsRegisterMode;
        StatusMessage = null;
        Password = "";
        return Task.CompletedTask;
    }

    [RelayCommand]
    private async Task LoginAsync()
    {
        IsBusy = true;
        StatusMessage = null;

        var result = await _authService.LoginAsync(Email.Trim(), Password, CancellationToken.None);
        IsBusy = false;

        if (!result.Success)
        {
            StatusMessage = result.Error ?? "Login failed.";
            return;
        }

        await RefreshAsync(CancellationToken.None);
    }

    [RelayCommand]
    private async Task RegisterAsync()
    {
        IsBusy = true;
        StatusMessage = null;

        var result = await _authService.RegisterAsync(Email.Trim(), Password, string.IsNullOrWhiteSpace(Name) ? null : Name.Trim(), CancellationToken.None);
        IsBusy = false;

        if (!result.Success)
        {
            StatusMessage = result.Error ?? "Registration failed.";
            return;
        }

        await RefreshAsync(CancellationToken.None);
    }

    [RelayCommand]
    private async Task LogoutAsync()
    {
        IsBusy = true;
        StatusMessage = null;
        await _authService.LogoutAsync(CancellationToken.None);
        IsBusy = false;

        await RefreshAsync(CancellationToken.None);
    }

    [RelayCommand]
    private async Task RefreshAsync(CancellationToken ct)
    {
        IsBusy = true;
        StatusMessage = null;

        var session = _authService.CurrentSession ?? await _authService.LoadSessionAsync(ct);
        UpdateSession(session);

        if (session != null)
        {
            await _entitlementService.SyncAsync(session.Token, ct);
            await LoadDevicesAsync(session.Token, ct);
        }
        else
        {
            Devices.Clear();
        }

        UpdateEntitlements(_entitlementService.Cache);

        IsBusy = false;
    }

    [RelayCommand]
    private async Task SyncEntitlementsAsync()
    {
        var session = _authService.CurrentSession;
        if (session == null)
        {
            StatusMessage = "Sign in to sync entitlements.";
            return;
        }

        IsBusy = true;
        StatusMessage = null;

        var ok = await _entitlementService.SyncAsync(session.Token, CancellationToken.None);
        StatusMessage = ok ? "Entitlements synced." : "Failed to sync entitlements.";

        IsBusy = false;
    }

    [RelayCommand]
    private async Task RegisterDeviceAsync()
    {
        var session = _authService.CurrentSession;
        if (session == null)
        {
            StatusMessage = "Sign in to register devices.";
            return;
        }

        IsBusy = true;
        var result = await _deviceService.RegisterAsync(session.Token, CancellationToken.None);
        if (!result.Success)
        {
            StatusMessage = result.Error ?? "Device registration failed.";
        }
        await LoadDevicesAsync(session.Token, CancellationToken.None);
        IsBusy = false;
    }

    private async Task LoadDevicesAsync(string token, CancellationToken ct)
    {
        var devices = await _deviceService.ListAsync(token, ct);
        Devices.Clear();

        foreach (var device in devices.OrderByDescending(d => d.LastSeenAt))
        {
            Devices.Add(new DeviceItemViewModel(device, RemoveDeviceAsync));
        }
    }

    private async Task RemoveDeviceAsync(DeviceRecord device)
    {
        var session = _authService.CurrentSession;
        if (session == null)
        {
            StatusMessage = "Sign in to manage devices.";
            return;
        }

        IsBusy = true;
        var result = await _deviceService.RemoveAsync(session.Token, device.DeviceId, CancellationToken.None);
        if (!result.Success)
        {
            StatusMessage = result.Error ?? "Failed to remove device.";
        }
        await LoadDevicesAsync(session.Token, CancellationToken.None);
        IsBusy = false;
    }

    private void OnSessionChanged(object? sender, AuthSession? session)
    {
        UpdateSession(session);
    }

    private void OnEntitlementChanged(object? sender, EntitlementCache cache)
    {
        UpdateEntitlements(cache);
    }

    private void UpdateSession(AuthSession? session)
    {
        IsAuthenticated = session != null;
        UserEmail = session?.User.Email ?? "";
        SubscriptionStatus = session?.Subscription?.Status.ToString() ?? "";
        SubscriptionPlan = session?.Subscription?.Plan ?? "";
    }

    private void UpdateEntitlements(EntitlementCache cache)
    {
        var entitlements = cache.Entitlements;
        EntitlementPlan = entitlements.Plan.ToString();
        EntitlementScope = entitlements.Scope.ToString();
        EntitlementStatus = entitlements.Status.ToString();
        EntitlementLimits = $"Profiles: {FormatLimit(entitlements.Limits.MaxProfiles)}, Groups: {FormatLimit(entitlements.Limits.MaxProviderGroups)}, Devices: {FormatLimit(entitlements.Limits.MaxDevices)}, Smart routing: {(entitlements.Limits.SmartRoutingEnabled ? "On" : "Off")}";
        GracePeriod = entitlements.GracePeriodEnd.HasValue
            ? $"Grace ends: {DateTimeOffset.FromUnixTimeMilliseconds(entitlements.GracePeriodEnd.Value):g}"
            : "";
        OfflineGrace = cache.OfflineGraceUntil.HasValue
            ? $"Offline grace until: {DateTimeOffset.FromUnixTimeMilliseconds(cache.OfflineGraceUntil.Value):g}"
            : "";
    }

    private static string FormatLimit(int value)
    {
        return value == int.MaxValue ? "Unlimited" : value.ToString();
    }
}

public sealed class DeviceItemViewModel
{
    public DeviceRecord Device { get; }
    public string DisplayName => Device.DeviceName;
    public string Platform => Device.Platform.ToString();
    public string LastSeen => DateTimeOffset.FromUnixTimeMilliseconds(Device.LastSeenAt).ToLocalTime().ToString("g");

    public IAsyncRelayCommand RemoveCommand { get; }

    public DeviceItemViewModel(DeviceRecord device, Func<DeviceRecord, Task> onRemove)
    {
        Device = device;
        RemoveCommand = new AsyncRelayCommand(() => onRemove(device));
    }
}

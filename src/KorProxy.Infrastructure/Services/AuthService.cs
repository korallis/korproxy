using System.Text.Json;
using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly IConvexApiClient _convex;
    private readonly ISessionStore _sessionStore;
    private readonly IAppPaths _appPaths;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public AuthSession? CurrentSession { get; private set; }

    public event EventHandler<AuthSession?>? SessionChanged;

    public AuthService(IConvexApiClient convex, ISessionStore sessionStore, IAppPaths appPaths)
    {
        _convex = convex;
        _sessionStore = sessionStore;
        _appPaths = appPaths;
    }

    public async Task<AuthSession?> LoadSessionAsync(CancellationToken ct = default)
    {
        var token = await _sessionStore.LoadTokenAsync(ct);
        if (string.IsNullOrWhiteSpace(token))
        {
            SetSession(null);
            return null;
        }

        var session = await BuildSessionAsync(token, ct);
        if (session == null)
        {
            await _sessionStore.ClearTokenAsync(ct);
            SetSession(null);
            return null;
        }

        SetSession(session);
        return session;
    }

    public async Task<AuthResult> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var result = await _convex.MutationAsync<LoginResponse>("auth:login", new
        {
            email,
            password
        }, ct);

        if (result == null || !result.Success || string.IsNullOrWhiteSpace(result.Token))
        {
            return new AuthResult(false, result?.Error ?? "Login failed.", null);
        }

        await _sessionStore.SaveTokenAsync(result.Token, ct);
        var session = await BuildSessionAsync(result.Token, ct);
        SetSession(session);
        return new AuthResult(session != null, session == null ? "Login failed." : null, session);
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string? name, CancellationToken ct = default)
    {
        var result = await _convex.MutationAsync<LoginResponse>("auth:register", new
        {
            email,
            password,
            name
        }, ct);

        if (result == null || !result.Success || string.IsNullOrWhiteSpace(result.Token))
        {
            return new AuthResult(false, result?.Error ?? "Registration failed.", null);
        }

        await _sessionStore.SaveTokenAsync(result.Token, ct);
        var session = await BuildSessionAsync(result.Token, ct);
        SetSession(session);
        return new AuthResult(session != null, session == null ? "Registration failed." : null, session);
    }

    public async Task LogoutAsync(CancellationToken ct = default)
    {
        if (CurrentSession != null)
        {
            await _convex.MutationAsync<LogoutResponse>("auth:logout", new { token = CurrentSession.Token }, ct);
        }

        await _sessionStore.ClearTokenAsync(ct);
        SetSession(null);
    }

    public async Task<AuthSession?> ValidateSessionAsync(CancellationToken ct = default)
    {
        var token = CurrentSession?.Token ?? await _sessionStore.LoadTokenAsync(ct);
        if (string.IsNullOrWhiteSpace(token))
        {
            SetSession(null);
            return null;
        }

        var session = await BuildSessionAsync(token, ct);
        if (session == null)
        {
            await _sessionStore.ClearTokenAsync(ct);
            SetSession(null);
            return null;
        }

        SetSession(session);
        return session;
    }

    public async Task<AuthSession?> RefreshSessionAsync(CancellationToken ct = default)
    {
        var token = CurrentSession?.Token ?? await _sessionStore.LoadTokenAsync(ct);
        if (string.IsNullOrWhiteSpace(token))
        {
            SetSession(null);
            return null;
        }

        var refresh = await _convex.MutationAsync<RefreshResponse>("auth:refreshSession", new { token }, ct);
        if (refresh == null || !refresh.Success || string.IsNullOrWhiteSpace(refresh.NewToken))
        {
            await _sessionStore.ClearTokenAsync(ct);
            SetSession(null);
            return null;
        }

        await _sessionStore.SaveTokenAsync(refresh.NewToken, ct);
        var session = await BuildSessionAsync(refresh.NewToken, ct);
        SetSession(session);
        return session;
    }

    public async Task<bool> TryImportLegacySessionAsync(CancellationToken ct = default)
    {
        var existing = await _sessionStore.LoadTokenAsync(ct);
        if (!string.IsNullOrWhiteSpace(existing))
            return false;

        var legacyPaths = new[]
        {
            Path.Combine(_appPaths.DataDirectory, "legacy-session.json"),
            Path.Combine(_appPaths.DataDirectory, "legacy-auth.json"),
            Path.Combine(_appPaths.DataDirectory, "korproxy-auth.json")
        };

        foreach (var path in legacyPaths)
        {
            if (!File.Exists(path))
                continue;

            try
            {
                var json = await File.ReadAllTextAsync(path, ct);
                if (string.IsNullOrWhiteSpace(json))
                    continue;

                var payload = JsonSerializer.Deserialize<LegacySessionPayload>(json, JsonOptions);
                if (payload != null && !string.IsNullOrWhiteSpace(payload.Token))
                {
                    await _sessionStore.SaveTokenAsync(payload.Token, ct);
                    return true;
                }
            }
            catch
            {
                // Ignore malformed legacy data.
            }
        }

        return false;
    }

    private async Task<AuthSession?> BuildSessionAsync(string token, CancellationToken ct)
    {
        var validation = await _convex.QueryAsync<ValidateResponse>("auth:validateToken", new { token }, ct);
        if (validation == null || !validation.Valid)
            return null;

        var user = await _convex.QueryAsync<UserResponse>("auth:me", new { token }, ct);
        if (user == null)
            return null;

        var subscription = await _convex.QueryAsync<SubscriptionResponse>("subscriptions:getStatus", new { token }, ct);

        return new AuthSession(
            token,
            new UserProfile(
                user.Id,
                user.Email,
                ParseRole(user.Role),
                user.Name,
                ParseSubscriptionStatus(user.SubscriptionStatus),
                user.SubscriptionPlan,
                user.TrialEnd,
                user.CurrentPeriodEnd,
                user.CancelAtPeriodEnd),
            subscription == null ? null : new SubscriptionInfo(
                ParseSubscriptionInfoStatus(subscription.Status),
                subscription.Plan,
                subscription.TrialEnd,
                subscription.CurrentPeriodEnd,
                subscription.CancelAtPeriodEnd,
                subscription.IsActive,
                subscription.DaysLeft));
    }

    private void SetSession(AuthSession? session)
    {
        CurrentSession = session;
        SessionChanged?.Invoke(this, session);
    }

    private static UserRole ParseRole(string? role)
        => string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase) ? UserRole.Admin : UserRole.User;

    private static SubscriptionStatus ParseSubscriptionStatus(string? status)
        => status?.ToLowerInvariant() switch
        {
            "trialing" => SubscriptionStatus.Trialing,
            "active" => SubscriptionStatus.Active,
            "past_due" => SubscriptionStatus.PastDue,
            "canceled" => SubscriptionStatus.Canceled,
            "expired" => SubscriptionStatus.Expired,
            "lifetime" => SubscriptionStatus.Lifetime,
            _ => SubscriptionStatus.None
        };

    private static SubscriptionInfoStatus ParseSubscriptionInfoStatus(string? status)
        => status?.ToLowerInvariant() switch
        {
            "active" => SubscriptionInfoStatus.Active,
            "trial" => SubscriptionInfoStatus.Trial,
            "expired" => SubscriptionInfoStatus.Expired,
            "no_subscription" => SubscriptionInfoStatus.NoSubscription,
            "past_due" => SubscriptionInfoStatus.PastDue,
            "lifetime" => SubscriptionInfoStatus.Lifetime,
            "canceled" => SubscriptionInfoStatus.Canceled,
            _ => SubscriptionInfoStatus.NoSubscription
        };

    private sealed record LoginResponse(bool Success, string? Token, string? Error);
    private sealed record LogoutResponse(bool Success);
    private sealed record ValidateResponse(bool Valid, string? UserId);
    private sealed record RefreshResponse(bool Success, string? NewToken);

    private sealed record UserResponse(
        string Id,
        string Email,
        string? Name,
        string Role,
        string SubscriptionStatus,
        string? SubscriptionPlan,
        long? TrialEnd,
        long? CurrentPeriodEnd,
        bool? CancelAtPeriodEnd);

    private sealed record SubscriptionResponse(
        string Status,
        string? Plan,
        long? TrialEnd,
        long? CurrentPeriodEnd,
        bool? CancelAtPeriodEnd,
        bool IsActive,
        int? DaysLeft);

    private sealed record LegacySessionPayload(string? Token);
}

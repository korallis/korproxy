using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class EntitlementService : IEntitlementService
{
    private readonly IConvexApiClient _convex;
    private readonly ISessionStore _sessionStore;

    private static readonly PlanLimits FreeLimits = new(1, 2, 1, false, 7);
    private static readonly PlanLimits ProLimits = new(10, 10, 3, true, 90);
    private static readonly PlanLimits TeamLimits = new(int.MaxValue, int.MaxValue, 5, true, 90);

    private static readonly Entitlements DefaultEntitlements = new(
        Plan.Free,
        EntitlementScope.Personal,
        EntitlementStatus.Active,
        FreeLimits,
        null,
        null,
        null,
        null);

    private EntitlementCache _cache = new(DefaultEntitlements, null, false, null);

    public EntitlementCache Cache => _cache;

    public event EventHandler<EntitlementCache>? CacheChanged;

    public EntitlementService(IConvexApiClient convex, ISessionStore sessionStore)
    {
        _convex = convex;
        _sessionStore = sessionStore;
    }

    public async Task InitializeAsync(CancellationToken ct = default)
    {
        var cached = await _sessionStore.LoadEntitlementCacheAsync(ct);
        if (cached != null)
        {
            UpdateCache(cached);
        }
    }

    public async Task<bool> SyncAsync(string token, CancellationToken ct = default)
    {
        try
        {
            var response = await _convex.QueryAsync<EntitlementResponse>("entitlements:get", new { token }, ct);
            if (response == null)
            {
                UpdateCache(new EntitlementCache(DefaultEntitlements, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), false, null));
                return true;
            }

            var entitlements = MapEntitlements(response);
            var updated = new EntitlementCache(entitlements, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(), false, null);
            await _sessionStore.SaveEntitlementCacheAsync(updated, ct);
            UpdateCache(updated);
            return true;
        }
        catch
        {
            var lastSynced = _cache.LastSynced;
            if (!_cache.IsOffline && lastSynced.HasValue)
            {
                var offlineUntil = lastSynced.Value + (long)TimeSpan.FromHours(EntitlementConstants.GracePeriodOfflineHours).TotalMilliseconds;
                UpdateCache(new EntitlementCache(_cache.Entitlements, lastSynced, true, offlineUntil));
            }
            return false;
        }
    }

    public bool CheckFeature(string featureName)
    {
        var limits = GetEffectiveLimits();

        return featureName switch
        {
            "smartRoutingEnabled" => limits.SmartRoutingEnabled,
            _ => true
        };
    }

    public bool CheckLimit(string resourceName, int count)
    {
        var limits = GetEffectiveLimits();

        return resourceName switch
        {
            "profiles" => limits.MaxProfiles == int.MaxValue || count < limits.MaxProfiles,
            "providerGroups" => limits.MaxProviderGroups == int.MaxValue || count < limits.MaxProviderGroups,
            "devices" => limits.MaxDevices == int.MaxValue || count < limits.MaxDevices,
            _ => true
        };
    }

    public void SetOffline(bool isOffline)
    {
        if (isOffline)
        {
            var lastSynced = _cache.LastSynced;
            if (lastSynced.HasValue)
            {
                var offlineUntil = lastSynced.Value + (long)TimeSpan.FromHours(EntitlementConstants.GracePeriodOfflineHours).TotalMilliseconds;
                UpdateCache(new EntitlementCache(_cache.Entitlements, lastSynced, true, offlineUntil));
                return;
            }
        }

        UpdateCache(new EntitlementCache(_cache.Entitlements, _cache.LastSynced, false, null));
    }

    public void Reset()
    {
        UpdateCache(new EntitlementCache(DefaultEntitlements, null, false, null));
    }

    private PlanLimits GetEffectiveLimits()
    {
        if (_cache.IsOffline && _cache.OfflineGraceUntil.HasValue)
        {
            if (DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() > _cache.OfflineGraceUntil.Value)
                return FreeLimits;
        }

        return _cache.Entitlements.Limits;
    }

    private Entitlements MapEntitlements(EntitlementResponse response)
    {
        var plan = ParsePlan(response.Plan);
        var limits = response.Limits != null
            ? new PlanLimits(
                NormalizeLimit(response.Limits.MaxProfiles),
                NormalizeLimit(response.Limits.MaxProviderGroups),
                NormalizeLimit(response.Limits.MaxDevices),
                response.Limits.SmartRouting,
                response.Limits.AnalyticsRetentionDays)
            : GetLimitsForPlan(plan);

        var scope = string.IsNullOrWhiteSpace(response.TeamId) ? EntitlementScope.Personal : EntitlementScope.Team;
        var status = response.InGracePeriod
            ? EntitlementStatus.Grace
            : response.IsActive
                ? EntitlementStatus.Active
                : EntitlementStatus.Expired;

        return new Entitlements(
            plan,
            scope,
            status,
            limits,
            response.TeamId,
            response.TeamName,
            null,
            response.GraceEndsAt);
    }

    private static Plan ParsePlan(string? plan)
        => plan?.ToLowerInvariant() switch
        {
            "pro" => Plan.Pro,
            "team" => Plan.Team,
            _ => Plan.Free
        };

    private static PlanLimits GetLimitsForPlan(Plan plan)
        => plan switch
        {
            Plan.Pro => ProLimits,
            Plan.Team => TeamLimits,
            _ => FreeLimits
        };

    private static int NormalizeLimit(int value)
        => value < 0 ? int.MaxValue : value;

    private void UpdateCache(EntitlementCache cache)
    {
        _cache = cache;
        CacheChanged?.Invoke(this, cache);
    }

    private sealed record EntitlementResponse(
        string Plan,
        bool IsActive,
        bool InGracePeriod,
        long? GraceEndsAt,
        EntitlementLimits? Limits,
        string? TeamId,
        string? TeamName);

    private sealed record EntitlementLimits(
        int MaxProfiles,
        int MaxProviderGroups,
        int MaxDevices,
        bool SmartRouting,
        int AnalyticsRetentionDays);
}

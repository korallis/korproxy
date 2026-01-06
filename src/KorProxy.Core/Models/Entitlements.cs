namespace KorProxy.Core.Models;

public enum Plan
{
    Free,
    Pro,
    Team
}

public enum EntitlementScope
{
    Personal,
    Team
}

public enum EntitlementStatus
{
    Active,
    Trialing,
    Grace,
    PastDue,
    Expired
}

public sealed record PlanLimits(
    int MaxProfiles,
    int MaxProviderGroups,
    int MaxDevices,
    bool SmartRoutingEnabled,
    int AnalyticsRetentionDays);

public sealed record Entitlements(
    Plan Plan,
    EntitlementScope Scope,
    EntitlementStatus Status,
    PlanLimits Limits,
    string? TeamId,
    string? TeamName,
    long? CurrentPeriodEnd,
    long? GracePeriodEnd);

public sealed record EntitlementCache(
    Entitlements Entitlements,
    long? LastSynced,
    bool IsOffline,
    long? OfflineGraceUntil);

public static class EntitlementConstants
{
    public const int GracePeriodPastDueDays = 3;
    public const int GracePeriodOfflineHours = 72;
}

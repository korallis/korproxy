namespace KorProxy.Core.Models;

public enum UserRole
{
    User,
    Admin
}

public enum SubscriptionStatus
{
    None,
    Trialing,
    Active,
    PastDue,
    Canceled,
    Expired,
    Lifetime
}

public sealed record UserProfile(
    string Id,
    string Email,
    UserRole Role,
    string? Name,
    SubscriptionStatus SubscriptionStatus,
    string? SubscriptionPlan,
    long? TrialEnd,
    long? CurrentPeriodEnd,
    bool? CancelAtPeriodEnd);

public enum SubscriptionInfoStatus
{
    Active,
    Trial,
    Expired,
    NoSubscription,
    PastDue,
    Lifetime,
    Canceled
}

public sealed record SubscriptionInfo(
    SubscriptionInfoStatus Status,
    string? Plan,
    long? TrialEnd,
    long? CurrentPeriodEnd,
    bool? CancelAtPeriodEnd,
    bool IsActive,
    int? DaysLeft);

public sealed record AuthSession(
    string Token,
    UserProfile User,
    SubscriptionInfo? Subscription);

public sealed record AuthResult(bool Success, string? Error, AuthSession? Session);

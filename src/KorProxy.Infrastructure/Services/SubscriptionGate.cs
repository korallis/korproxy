using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class SubscriptionGate : ISubscriptionGate
{
    public bool CanStartProxy(AuthSession? session, Entitlements entitlements, DateTimeOffset now, out string? reason)
    {
        if (session == null)
        {
            reason = "Sign in to your KorProxy account to start the proxy.";
            return false;
        }

        if (entitlements.Status == EntitlementStatus.Active || entitlements.Status == EntitlementStatus.Trialing)
        {
            reason = null;
            return true;
        }

        if (entitlements.Status == EntitlementStatus.Grace)
        {
            if (entitlements.GracePeriodEnd.HasValue && now.ToUnixTimeMilliseconds() > entitlements.GracePeriodEnd.Value)
            {
                reason = "Your grace period has ended. Please renew your subscription.";
                return false;
            }

            reason = null;
            return true;
        }

        reason = "Active subscription required to start the proxy.";
        return false;
    }
}

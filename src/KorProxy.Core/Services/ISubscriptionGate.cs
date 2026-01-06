using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface ISubscriptionGate
{
    bool CanStartProxy(AuthSession? session, Entitlements entitlements, DateTimeOffset now, out string? reason);
}

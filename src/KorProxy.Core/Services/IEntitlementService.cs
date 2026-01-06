using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IEntitlementService
{
    EntitlementCache Cache { get; }
    event EventHandler<EntitlementCache>? CacheChanged;

    Task InitializeAsync(CancellationToken ct = default);

    Task<bool> SyncAsync(string token, CancellationToken ct = default);
    bool CheckFeature(string featureName);
    bool CheckLimit(string resourceName, int count);
    void SetOffline(bool isOffline);
    void Reset();
}

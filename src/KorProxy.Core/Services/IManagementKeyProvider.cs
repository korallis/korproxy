namespace KorProxy.Core.Services;

public interface IManagementKeyProvider
{
    Task<string> GetOrCreateKeyAsync(CancellationToken ct = default);
    Task<string?> GetKeyAsync(CancellationToken ct = default);
}

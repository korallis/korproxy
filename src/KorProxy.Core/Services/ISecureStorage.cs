namespace KorProxy.Core.Services;

public interface ISecureStorage
{
    Task SaveAsync(string key, string value, CancellationToken ct = default);
    Task<string?> ReadAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
}

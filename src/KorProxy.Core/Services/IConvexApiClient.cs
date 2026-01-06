namespace KorProxy.Core.Services;

public interface IConvexApiClient
{
    Task<T?> QueryAsync<T>(string path, object args, CancellationToken ct = default);
    Task<T?> MutationAsync<T>(string path, object args, CancellationToken ct = default);
}

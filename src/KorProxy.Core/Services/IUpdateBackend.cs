namespace KorProxy.Core.Services;

public interface IUpdateBackend
{
    Task<UpdateCheckResult?> CheckForUpdatesAsync(CancellationToken ct = default);
    Task DownloadUpdatesAsync(UpdateCheckResult update, IProgress<double>? progress = null, CancellationToken ct = default);
    Task ApplyUpdatesAndRestartAsync(CancellationToken ct = default);
    bool IsInstalled { get; }
}

public sealed record UpdateCheckResult(string Version);

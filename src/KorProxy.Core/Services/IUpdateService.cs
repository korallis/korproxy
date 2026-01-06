using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IUpdateService
{
    UpdateState State { get; }
    event EventHandler<UpdateState>? StateChanged;

    Task CheckForUpdatesAsync(CancellationToken ct = default);
    Task DownloadUpdateAsync(CancellationToken ct = default);
    Task InstallUpdateAsync(CancellationToken ct = default);
    bool IsPortableBuild { get; }
}

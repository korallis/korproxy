using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class UpdateService : IUpdateService
{
    private readonly IUpdateBackend _backend;
    private readonly UpdateOptions _options;
    private UpdateCheckResult? _pending;

    public UpdateState State { get; private set; } = new(UpdateStatus.Idle, null, null, null);

    public event EventHandler<UpdateState>? StateChanged;

    public bool IsPortableBuild { get; }

    public UpdateService(IUpdateBackend backend, UpdateOptions options, IAppPaths appPaths)
    {
        _backend = backend;
        _options = options;
        IsPortableBuild = DetectPortable(appPaths);
    }

    public async Task CheckForUpdatesAsync(CancellationToken ct = default)
    {
        if (IsPortableBuild)
        {
            UpdateState(UpdateStatus.UpdateAvailable, null, "Portable builds must be updated manually.", null);
            return;
        }

        UpdateState(UpdateStatus.Checking, null, "Checking for updates...", null);

        try
        {
            var update = await _backend.CheckForUpdatesAsync(ct);
            if (update == null)
            {
                _pending = null;
                UpdateState(UpdateStatus.UpToDate, null, "You're up to date.", null);
                return;
            }

            _pending = update;
            UpdateState(UpdateStatus.UpdateAvailable, update.Version, "Update available.", null);
        }
        catch (Exception ex)
        {
            UpdateState(UpdateStatus.Error, null, $"Update check failed: {ex.Message}", null);
        }
    }

    public async Task DownloadUpdateAsync(CancellationToken ct = default)
    {
        if (IsPortableBuild)
        {
            UpdateState(UpdateStatus.UpdateAvailable, null, "Download the latest build from GitHub.", null);
            return;
        }

        if (_pending == null)
            return;

        var progress = new Progress<double>(p => UpdateState(UpdateStatus.Downloading, _pending.Version, "Downloading update...", p));

        try
        {
            await _backend.DownloadUpdatesAsync(_pending, progress, ct);
            UpdateState(UpdateStatus.ReadyToInstall, _pending.Version, "Ready to install on quit.", 1.0);
        }
        catch (Exception ex)
        {
            UpdateState(UpdateStatus.Error, _pending.Version, $"Download failed: {ex.Message}", null);
        }
    }

    public async Task InstallUpdateAsync(CancellationToken ct = default)
    {
        if (IsPortableBuild)
        {
            UpdateState(UpdateStatus.UpdateAvailable, null, "Portable builds must be updated manually.", null);
            return;
        }

        try
        {
            await _backend.ApplyUpdatesAndRestartAsync(ct);
        }
        catch (Exception ex)
        {
            UpdateState(UpdateStatus.Error, _pending?.Version, $"Install failed: {ex.Message}", null);
        }
    }

    private static bool DetectPortable(IAppPaths appPaths)
    {
        var marker = Path.Combine(appPaths.DataDirectory, "portable.marker");
        if (File.Exists(marker))
            return true;

        var exeDir = AppContext.BaseDirectory;
        return File.Exists(Path.Combine(exeDir, "portable.marker"));
    }

    private void UpdateState(UpdateStatus status, string? version, string? message, double? progress)
    {
        State = new UpdateState(status, version, message, progress);
        StateChanged?.Invoke(this, State);
    }
}

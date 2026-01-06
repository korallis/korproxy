using System.Reflection;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class VelopackUpdateBackend : IUpdateBackend
{
    private readonly object? _updateManager;
    private readonly MethodInfo? _checkMethod;
    private readonly MethodInfo? _downloadMethod;
    private readonly MethodInfo? _applyMethod;
    private readonly PropertyInfo? _isInstalledProperty;

    public VelopackUpdateBackend(UpdateOptions options)
    {
        var sourceType = Type.GetType("Velopack.Sources.GithubSource, Velopack.Sources");
        var updateManagerType = Type.GetType("Velopack.UpdateManager, Velopack");

        if (sourceType == null || updateManagerType == null)
            return;

        object? source = null;
        foreach (var ctor in sourceType.GetConstructors())
        {
            var parameters = ctor.GetParameters();
            if (parameters.Length >= 2)
            {
                var args = new List<object?> { options.GithubOwner, options.GithubRepo };
                while (args.Count < parameters.Length)
                {
                    if (parameters[args.Count].ParameterType == typeof(string))
                        args.Add(options.Channel);
                    else
                        args.Add(null);
                }
                try
                {
                    source = ctor.Invoke(args.ToArray());
                    break;
                }
                catch
                {
                    // Try next constructor.
                }
            }
        }

        if (source == null)
            return;

        _updateManager = Activator.CreateInstance(updateManagerType, source);
        if (_updateManager == null)
            return;

        _checkMethod = updateManagerType.GetMethod("CheckForUpdatesAsync");
        _downloadMethod = updateManagerType.GetMethod("DownloadUpdatesAsync");
        _applyMethod = updateManagerType.GetMethod("ApplyUpdatesAndRestart");
        _isInstalledProperty = updateManagerType.GetProperty("IsInstalled");
    }

    public bool IsInstalled
    {
        get
        {
            if (_updateManager == null || _isInstalledProperty == null)
                return false;
            return _isInstalledProperty.GetValue(_updateManager) as bool? ?? false;
        }
    }

    public async Task<UpdateCheckResult?> CheckForUpdatesAsync(CancellationToken ct = default)
    {
        if (_updateManager == null || _checkMethod == null)
            return null;

        var task = _checkMethod.Invoke(_updateManager, null) as Task;
        if (task == null)
            return null;

        await task.ConfigureAwait(false);

        var resultProperty = task.GetType().GetProperty("Result");
        var result = resultProperty?.GetValue(task);
        if (result == null)
            return null;

        var versionProperty = result.GetType().GetProperty("TargetVersion")
            ?? result.GetType().GetProperty("Version");
        var versionValue = versionProperty?.GetValue(result)?.ToString();
        if (string.IsNullOrWhiteSpace(versionValue))
            return null;

        return new UpdateCheckResult(versionValue);
    }

    public async Task DownloadUpdatesAsync(UpdateCheckResult update, IProgress<double>? progress = null, CancellationToken ct = default)
    {
        if (_updateManager == null || _downloadMethod == null)
            return;

        var parameters = _downloadMethod.GetParameters();
        var args = parameters.Length switch
        {
            0 => Array.Empty<object?>(),
            1 => new object?[] { update },
            _ => new object?[] { update, progress }
        };

        var task = _downloadMethod.Invoke(_updateManager, args) as Task;
        if (task != null)
            await task.ConfigureAwait(false);
    }

    public Task ApplyUpdatesAndRestartAsync(CancellationToken ct = default)
    {
        if (_updateManager == null || _applyMethod == null)
            return Task.CompletedTask;

        _applyMethod.Invoke(_updateManager, null);
        return Task.CompletedTask;
    }
}

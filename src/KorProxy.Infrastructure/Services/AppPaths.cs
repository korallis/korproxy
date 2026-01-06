using System.Runtime.InteropServices;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Cross-platform application paths
/// </summary>
public sealed class AppPaths : IAppPaths
{
    private readonly Lazy<string> _dataDirectory;
    private readonly Lazy<string> _appDirectory;
    
    public AppPaths()
    {
        _dataDirectory = new Lazy<string>(GetDataDirectory);
        _appDirectory = new Lazy<string>(GetAppDirectory);
    }
    
    public string DataDirectory => _dataDirectory.Value;
    
    public string ConfigFilePath => Path.Combine(DataDirectory, "config.yaml");
    
    public string ProxyBinaryPath
    {
        get
        {
            var runtimeId = GetRuntimeId();

            var candidateNames = GetProxyBinaryCandidateNames();

            // Prefer the packaged binary that ships with the app.
            foreach (var name in candidateNames)
            {
                var packaged = Path.Combine(_appDirectory.Value, "runtimes", runtimeId, "native", name);
                if (File.Exists(packaged))
                    return packaged;

                var packagedLegacy = Path.Combine(_appDirectory.Value, "runtimes", runtimeId, name);
                if (File.Exists(packagedLegacy))
                    return packagedLegacy;
            }

            // Next, check for a user-installed binary that our first-run wizard may have downloaded.
            foreach (var name in candidateNames)
            {
                var userInstalled = Path.Combine(DataDirectory, "bin", runtimeId, "native", name);
                if (File.Exists(userInstalled))
                    return userInstalled;

                var userInstalledLegacy = Path.Combine(DataDirectory, "bin", runtimeId, name);
                if (File.Exists(userInstalledLegacy))
                    return userInstalledLegacy;
            }

            // Finally, fall back to PATH resolution if the user installed it globally.
            foreach (var name in candidateNames)
            {
                var resolved = ResolveFromPath(name);
                if (!string.IsNullOrWhiteSpace(resolved))
                    return resolved;
            }

            // Fallback to the expected packaged path (even if missing) for better error messages.
            return Path.Combine(_appDirectory.Value, "runtimes", runtimeId, "native", candidateNames[0]);
        }
    }
    
    public string LogsDirectory => Path.Combine(DataDirectory, "logs");
    
    public string AuthDirectory => Path.Combine(DataDirectory, "auth");
    
    private static string GetAppDirectory()
    {
        var exePath = Environment.ProcessPath ?? AppContext.BaseDirectory;
        return Path.GetDirectoryName(exePath) ?? AppContext.BaseDirectory;
    }
    
    private static string GetDataDirectory()
    {
        string basePath;
        
        if (OperatingSystem.IsWindows())
        {
            basePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        }
        else if (OperatingSystem.IsMacOS())
        {
            basePath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Library", "Application Support");
        }
        else
        {
            var xdgConfig = Environment.GetEnvironmentVariable("XDG_CONFIG_HOME");
            basePath = !string.IsNullOrEmpty(xdgConfig) 
                ? xdgConfig 
                : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".config");
        }
        
        var appDir = Path.Combine(basePath, "KorProxy");
        Directory.CreateDirectory(appDir);
        return appDir;
    }
    
    private static string GetRuntimeId()
    {
        var arch = RuntimeInformation.ProcessArchitecture switch
        {
            Architecture.X64 => "x64",
            Architecture.Arm64 => "arm64",
            _ => "x64"
        };
        
        if (OperatingSystem.IsWindows()) return $"win-{arch}";
        if (OperatingSystem.IsMacOS()) return $"osx-{arch}";
        return $"linux-{arch}";
    }

    private static string[] GetProxyBinaryCandidateNames()
    {
        if (OperatingSystem.IsWindows())
        {
            return
            [
                "cliproxy.exe",
                "CLIProxyAPI.exe",
                "cliproxyapi.exe"
            ];
        }

        return
        [
            "cliproxy",
            "CLIProxyAPI",
            "cliproxyapi"
        ];
    }

    private static string? ResolveFromPath(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return null;

        var pathValue = Environment.GetEnvironmentVariable("PATH");
        if (string.IsNullOrWhiteSpace(pathValue))
            return null;

        var dirs = pathValue.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var dir in dirs)
        {
            try
            {
                var candidate = Path.Combine(dir, fileName);
                if (File.Exists(candidate))
                    return candidate;
            }
            catch
            {
                // Ignore invalid PATH entries.
            }
        }

        return null;
    }
}

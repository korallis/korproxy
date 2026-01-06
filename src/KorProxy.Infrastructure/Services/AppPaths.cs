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
            var binaryName = OperatingSystem.IsWindows() ? "CLIProxyAPI.exe" : "CLIProxyAPI";
            
            var appRuntimesPath = Path.Combine(_appDirectory.Value, "runtimes", runtimeId, binaryName);
            if (File.Exists(appRuntimesPath))
                return appRuntimesPath;
            
            var userInstalledPath = Path.Combine(DataDirectory, "bin", runtimeId, binaryName);
            if (File.Exists(userInstalledPath))
                return userInstalledPath;
            
            return appRuntimesPath;
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
}

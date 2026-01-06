using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.Infrastructure.Services;

/// <summary>
/// Cross-platform implementation of startup launch (open at login) functionality.
/// - Windows: Registry key at HKCU\Software\Microsoft\Windows\CurrentVersion\Run
/// - macOS: LaunchAgent plist at ~/Library/LaunchAgents/com.korproxy.app.plist
/// - Linux: XDG Desktop Entry at ~/.config/autostart/KorProxy.desktop
/// </summary>
public sealed class StartupLaunchService : IStartupLaunchService
{
    private readonly ILogger<StartupLaunchService>? _logger;
    
    private const string AppName = "KorProxy";
    private const string MacOSBundleIdentifier = "com.korproxy.app";
    private const string LinuxDesktopFileName = "KorProxy.desktop";
    
    public StartupLaunchService(ILogger<StartupLaunchService>? logger = null)
    {
        _logger = logger;
    }
    
    public async Task<bool> IsEnabledAsync(CancellationToken ct = default)
    {
        return await Task.Run(() =>
        {
            if (OperatingSystem.IsWindows())
            {
                return IsWindowsStartupEnabled();
            }
            else if (OperatingSystem.IsMacOS())
            {
                return IsMacOSStartupEnabled();
            }
            else if (OperatingSystem.IsLinux())
            {
                return IsLinuxStartupEnabled();
            }
            
            return false;
        }, ct);
    }
    
    public async Task EnableAsync(CancellationToken ct = default)
    {
        await Task.Run(() =>
        {
            if (OperatingSystem.IsWindows())
            {
                EnableWindowsStartup();
            }
            else if (OperatingSystem.IsMacOS())
            {
                EnableMacOSStartup();
            }
            else if (OperatingSystem.IsLinux())
            {
                EnableLinuxStartup();
            }
        }, ct);
    }
    
    public async Task DisableAsync(CancellationToken ct = default)
    {
        await Task.Run(() =>
        {
            if (OperatingSystem.IsWindows())
            {
                DisableWindowsStartup();
            }
            else if (OperatingSystem.IsMacOS())
            {
                DisableMacOSStartup();
            }
            else if (OperatingSystem.IsLinux())
            {
                DisableLinuxStartup();
            }
        }, ct);
    }
    
    public async Task SetEnabledAsync(bool enabled, CancellationToken ct = default)
    {
        if (enabled)
        {
            await EnableAsync(ct);
        }
        else
        {
            await DisableAsync(ct);
        }
    }
    
    #region Windows Implementation
    
    private bool IsWindowsStartupEnabled()
    {
        if (!OperatingSystem.IsWindows())
            return false;
            
        try
        {
            using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Run", 
                writable: false);
            
            var value = key?.GetValue(AppName) as string;
            return !string.IsNullOrWhiteSpace(value);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to check Windows startup registry");
            return false;
        }
    }
    
    private void EnableWindowsStartup()
    {
        if (!OperatingSystem.IsWindows())
            return;
            
        try
        {
            var exePath = GetCurrentExecutablePath();
            if (string.IsNullOrWhiteSpace(exePath))
            {
                _logger?.LogWarning("Could not determine executable path for Windows startup");
                return;
            }
            
            using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Run", 
                writable: true);
            
            if (key == null)
            {
                _logger?.LogWarning("Could not open Windows Run registry key");
                return;
            }
            
            // Quote the path and add --minimized flag for startup
            key.SetValue(AppName, $"\"{exePath}\" --minimized");
            _logger?.LogInformation("Enabled Windows startup for {Path}", exePath);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to enable Windows startup");
        }
    }
    
    private void DisableWindowsStartup()
    {
        if (!OperatingSystem.IsWindows())
            return;
            
        try
        {
            using var key = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(
                @"Software\Microsoft\Windows\CurrentVersion\Run", 
                writable: true);
            
            key?.DeleteValue(AppName, throwOnMissingValue: false);
            _logger?.LogInformation("Disabled Windows startup");
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to disable Windows startup");
        }
    }
    
    #endregion
    
    #region macOS Implementation
    
    private static string GetMacOSLaunchAgentPath()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
        return Path.Combine(home, "Library", "LaunchAgents", $"{MacOSBundleIdentifier}.plist");
    }
    
    private bool IsMacOSStartupEnabled()
    {
        if (!OperatingSystem.IsMacOS())
            return false;
            
        try
        {
            var plistPath = GetMacOSLaunchAgentPath();
            return File.Exists(plistPath);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to check macOS launch agent");
            return false;
        }
    }
    
    private void EnableMacOSStartup()
    {
        if (!OperatingSystem.IsMacOS())
            return;
            
        try
        {
            var exePath = GetCurrentExecutablePath();
            if (string.IsNullOrWhiteSpace(exePath))
            {
                _logger?.LogWarning("Could not determine executable path for macOS startup");
                return;
            }
            
            // For .app bundles, use the bundle path with 'open' command
            var appPath = GetMacOSAppBundlePath(exePath);
            
            var plistPath = GetMacOSLaunchAgentPath();
            var plistDir = Path.GetDirectoryName(plistPath);
            if (!string.IsNullOrWhiteSpace(plistDir) && !Directory.Exists(plistDir))
            {
                Directory.CreateDirectory(plistDir);
            }
            
            string plistContent;
            
            if (!string.IsNullOrWhiteSpace(appPath))
            {
                // Use 'open' command for .app bundles (more reliable)
                plistContent = $"""
                    <?xml version="1.0" encoding="UTF-8"?>
                    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
                    <plist version="1.0">
                    <dict>
                        <key>Label</key>
                        <string>{MacOSBundleIdentifier}</string>
                        <key>ProgramArguments</key>
                        <array>
                            <string>/usr/bin/open</string>
                            <string>-a</string>
                            <string>{appPath}</string>
                            <string>--args</string>
                            <string>--minimized</string>
                        </array>
                        <key>RunAtLoad</key>
                        <true/>
                        <key>LaunchOnlyOnce</key>
                        <true/>
                    </dict>
                    </plist>
                    """;
            }
            else
            {
                // Direct executable (dev builds)
                plistContent = $"""
                    <?xml version="1.0" encoding="UTF-8"?>
                    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
                    <plist version="1.0">
                    <dict>
                        <key>Label</key>
                        <string>{MacOSBundleIdentifier}</string>
                        <key>ProgramArguments</key>
                        <array>
                            <string>{exePath}</string>
                            <string>--minimized</string>
                        </array>
                        <key>RunAtLoad</key>
                        <true/>
                        <key>LaunchOnlyOnce</key>
                        <true/>
                    </dict>
                    </plist>
                    """;
            }
            
            File.WriteAllText(plistPath, plistContent, Encoding.UTF8);
            _logger?.LogInformation("Enabled macOS startup at {Path}", plistPath);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to enable macOS startup");
        }
    }
    
    private void DisableMacOSStartup()
    {
        if (!OperatingSystem.IsMacOS())
            return;
            
        try
        {
            var plistPath = GetMacOSLaunchAgentPath();
            if (File.Exists(plistPath))
            {
                File.Delete(plistPath);
                _logger?.LogInformation("Disabled macOS startup");
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to disable macOS startup");
        }
    }
    
    /// <summary>
    /// Gets the .app bundle path if the executable is running inside a macOS app bundle.
    /// </summary>
    private static string? GetMacOSAppBundlePath(string exePath)
    {
        // macOS app bundle structure: /Applications/KorProxy.app/Contents/MacOS/KorProxy
        // Walk up to find .app directory
        var current = exePath;
        for (var i = 0; i < 5; i++)
        {
            var parent = Path.GetDirectoryName(current);
            if (string.IsNullOrWhiteSpace(parent))
                break;
                
            if (parent.EndsWith(".app", StringComparison.OrdinalIgnoreCase))
            {
                return parent;
            }
            
            current = parent;
        }
        
        return null;
    }
    
    #endregion
    
    #region Linux Implementation
    
    private static string GetLinuxAutostartPath()
    {
        var xdgConfigHome = Environment.GetEnvironmentVariable("XDG_CONFIG_HOME");
        var baseDir = !string.IsNullOrWhiteSpace(xdgConfigHome)
            ? xdgConfigHome
            : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".config");
        
        return Path.Combine(baseDir, "autostart", LinuxDesktopFileName);
    }
    
    private bool IsLinuxStartupEnabled()
    {
        if (!OperatingSystem.IsLinux())
            return false;
            
        try
        {
            var desktopPath = GetLinuxAutostartPath();
            return File.Exists(desktopPath);
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to check Linux autostart");
            return false;
        }
    }
    
    private void EnableLinuxStartup()
    {
        if (!OperatingSystem.IsLinux())
            return;
            
        try
        {
            var exePath = GetCurrentExecutablePath();
            if (string.IsNullOrWhiteSpace(exePath))
            {
                _logger?.LogWarning("Could not determine executable path for Linux startup");
                return;
            }
            
            var desktopPath = GetLinuxAutostartPath();
            var desktopDir = Path.GetDirectoryName(desktopPath);
            if (!string.IsNullOrWhiteSpace(desktopDir) && !Directory.Exists(desktopDir))
            {
                Directory.CreateDirectory(desktopDir);
            }
            
            // XDG Desktop Entry specification
            var desktopContent = $"""
                [Desktop Entry]
                Type=Application
                Name=KorProxy
                Comment=Local AI Gateway for Coding Tools
                Exec="{exePath}" --minimized
                Icon=korproxy
                Terminal=false
                Categories=Development;Utility;
                StartupNotify=false
                X-GNOME-Autostart-enabled=true
                """;
            
            File.WriteAllText(desktopPath, desktopContent, Encoding.UTF8);
            _logger?.LogInformation("Enabled Linux autostart at {Path}", desktopPath);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to enable Linux autostart");
        }
    }
    
    private void DisableLinuxStartup()
    {
        if (!OperatingSystem.IsLinux())
            return;
            
        try
        {
            var desktopPath = GetLinuxAutostartPath();
            if (File.Exists(desktopPath))
            {
                File.Delete(desktopPath);
                _logger?.LogInformation("Disabled Linux autostart");
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to disable Linux autostart");
        }
    }
    
    #endregion
    
    #region Helpers
    
    private static string? GetCurrentExecutablePath()
    {
        // Get the path to the currently running executable
        var processPath = Environment.ProcessPath;
        if (!string.IsNullOrWhiteSpace(processPath) && File.Exists(processPath))
        {
            return processPath;
        }
        
        // Fallback to entry assembly location
        var entryAssembly = System.Reflection.Assembly.GetEntryAssembly();
        var assemblyLocation = entryAssembly?.Location;
        if (!string.IsNullOrWhiteSpace(assemblyLocation) && File.Exists(assemblyLocation))
        {
            // For .NET executables, find the corresponding .exe
            if (assemblyLocation.EndsWith(".dll", StringComparison.OrdinalIgnoreCase))
            {
                var exePath = Path.ChangeExtension(assemblyLocation, ".exe");
                if (File.Exists(exePath))
                    return exePath;
                    
                // On macOS/Linux, there's no .exe; use the native host
                var nativePath = assemblyLocation[..^4]; // Remove .dll
                if (File.Exists(nativePath))
                    return nativePath;
            }
            
            return assemblyLocation;
        }
        
        return null;
    }
    
    #endregion
}

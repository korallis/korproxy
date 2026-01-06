namespace KorProxy.Core.Services;

/// <summary>
/// Cross-platform service for managing "Open at Login" functionality.
/// Controls whether the KorProxy application launches automatically when the user logs in.
/// </summary>
public interface IStartupLaunchService
{
    /// <summary>
    /// Gets whether the app is currently configured to launch at OS login.
    /// </summary>
    Task<bool> IsEnabledAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Enables launching the app at OS login.
    /// </summary>
    Task EnableAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Disables launching the app at OS login.
    /// </summary>
    Task DisableAsync(CancellationToken ct = default);
    
    /// <summary>
    /// Sets the startup launch state.
    /// </summary>
    Task SetEnabledAsync(bool enabled, CancellationToken ct = default);
}

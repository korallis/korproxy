namespace KorProxy.Core.Models;

public enum UpdateStatus
{
    Idle,
    Checking,
    UpdateAvailable,
    Downloading,
    ReadyToInstall,
    UpToDate,
    Error
}

public sealed record UpdateState(
    UpdateStatus Status,
    string? Version,
    string? Message,
    double? Progress);

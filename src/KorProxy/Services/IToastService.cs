namespace KorProxy.Services;

public enum ToastType
{
    Info,
    Success,
    Warning,
    Error
}

public interface IToastService
{
    void Show(string message, ToastType type = ToastType.Info, int durationMs = 5000);
    void ShowSuccess(string message);
    void ShowError(string message);
    void ShowWarning(string message);
    void ShowInfo(string message);
    
    event EventHandler<ToastEventArgs>? ToastRequested;
}

public class ToastEventArgs : EventArgs
{
    public required string Message { get; init; }
    public required ToastType Type { get; init; }
    public int DurationMs { get; init; } = 5000;
}

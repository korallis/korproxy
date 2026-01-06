namespace KorProxy.Services;

public sealed class ToastService : IToastService
{
    public event EventHandler<ToastEventArgs>? ToastRequested;

    public void Show(string message, ToastType type = ToastType.Info, int durationMs = 5000)
    {
        ToastRequested?.Invoke(this, new ToastEventArgs
        {
            Message = message,
            Type = type,
            DurationMs = durationMs
        });
    }

    public void ShowSuccess(string message) => Show(message, ToastType.Success);
    public void ShowError(string message) => Show(message, ToastType.Error);
    public void ShowWarning(string message) => Show(message, ToastType.Warning);
    public void ShowInfo(string message) => Show(message, ToastType.Info);
}

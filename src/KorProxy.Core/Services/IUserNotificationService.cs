namespace KorProxy.Core.Services;

public enum NotificationLevel
{
    Info,
    Success,
    Warning,
    Error
}

public interface IUserNotificationService
{
    void ShowNotification(string message, NotificationLevel level = NotificationLevel.Info);
    void ShowError(string message, Exception? exception = null);
    void ShowSuccess(string message);
    Task<bool> ConfirmAsync(string title, string message);
}

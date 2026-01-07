using Microsoft.Extensions.Logging;
using KorProxy.Core.Services;

namespace KorProxy.Services;

public class UserNotificationService : IUserNotificationService
{
    private readonly ILogger<UserNotificationService> _logger;
    private readonly IToastService _toastService;

    public UserNotificationService(ILogger<UserNotificationService> logger, IToastService toastService)
    {
        _logger = logger;
        _toastService = toastService;
    }

    public void ShowNotification(string message, NotificationLevel level = NotificationLevel.Info)
    {
        switch (level)
        {
            case NotificationLevel.Info:
                _logger.LogInformation("Notification: {Message}", message);
                _toastService.ShowInfo(message);
                break;
            case NotificationLevel.Success:
                _logger.LogInformation("Success: {Message}", message);
                _toastService.ShowSuccess(message);
                break;
            case NotificationLevel.Warning:
                _logger.LogWarning("Warning: {Message}", message);
                _toastService.ShowWarning(message);
                break;
            case NotificationLevel.Error:
                _logger.LogError("Error: {Message}", message);
                _toastService.ShowError(message);
                break;
        }
    }

    public void ShowError(string message, Exception? exception = null)
    {
        if (exception != null)
        {
            _logger.LogError(exception, "Error: {Message}", message);
        }
        else
        {
            _logger.LogError("Error: {Message}", message);
        }
        _toastService.ShowError(message);
    }

    public void ShowSuccess(string message)
    {
        _logger.LogInformation("Success: {Message}", message);
        _toastService.ShowSuccess(message);
    }

    public Task<bool> ConfirmAsync(string title, string message)
    {
        _logger.LogInformation("Confirmation requested: {Title} - {Message}", title, message);
        return Task.FromResult(true);
    }
}

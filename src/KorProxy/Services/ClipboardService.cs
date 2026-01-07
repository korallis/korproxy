using Avalonia;
using Avalonia.Input.Platform;
using KorProxy.Core.Services;

namespace KorProxy.Services;

public class ClipboardService : IClipboardService
{
    private readonly IUserNotificationService _notificationService;

    public ClipboardService(IUserNotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    public async Task SetTextAsync(string text)
    {
        var clipboard = GetClipboard();
        if (clipboard != null)
        {
            await clipboard.SetTextAsync(text);
        }
    }

    public async Task<string?> GetTextAsync()
    {
        var clipboard = GetClipboard();
        return clipboard != null ? await clipboard.GetTextAsync() : null;
    }

    public async Task CopyWithFeedbackAsync(string text, string successMessage = "Copied to clipboard")
    {
        await SetTextAsync(text);
        _notificationService.ShowSuccess(successMessage);
    }

    private static IClipboard? GetClipboard()
    {
        return Application.Current?.ApplicationLifetime is Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop
            ? desktop.MainWindow?.Clipboard
            : null;
    }
}

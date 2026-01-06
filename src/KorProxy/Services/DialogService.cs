using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Platform.Storage;
using MsBox.Avalonia;
using MsBox.Avalonia.Dto;
using MsBox.Avalonia.Enums;

namespace KorProxy.Services;

/// <summary>
/// Dialog service implementation using MessageBox.Avalonia and Avalonia storage APIs.
/// </summary>
public sealed class DialogService : IDialogService
{
    private Avalonia.Controls.Window? GetMainWindow()
    {
        return Application.Current?.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop
            ? desktop.MainWindow
            : null;
    }

    public async Task ShowInfoAsync(string title, string message)
    {
        var box = MessageBoxManager.GetMessageBoxStandard(new MessageBoxStandardParams
        {
            ContentTitle = title,
            ContentMessage = message,
            Icon = Icon.Info,
            ButtonDefinitions = ButtonEnum.Ok,
            WindowStartupLocation = Avalonia.Controls.WindowStartupLocation.CenterOwner
        });

        var window = GetMainWindow();
        if (window != null)
        {
            await box.ShowWindowDialogAsync(window);
        }
        else
        {
            await box.ShowAsync();
        }
    }

    public async Task ShowWarningAsync(string title, string message)
    {
        var box = MessageBoxManager.GetMessageBoxStandard(new MessageBoxStandardParams
        {
            ContentTitle = title,
            ContentMessage = message,
            Icon = Icon.Warning,
            ButtonDefinitions = ButtonEnum.Ok,
            WindowStartupLocation = Avalonia.Controls.WindowStartupLocation.CenterOwner
        });

        var window = GetMainWindow();
        if (window != null)
        {
            await box.ShowWindowDialogAsync(window);
        }
        else
        {
            await box.ShowAsync();
        }
    }

    public async Task ShowErrorAsync(string title, string message)
    {
        var box = MessageBoxManager.GetMessageBoxStandard(new MessageBoxStandardParams
        {
            ContentTitle = title,
            ContentMessage = message,
            Icon = Icon.Error,
            ButtonDefinitions = ButtonEnum.Ok,
            WindowStartupLocation = Avalonia.Controls.WindowStartupLocation.CenterOwner
        });

        var window = GetMainWindow();
        if (window != null)
        {
            await box.ShowWindowDialogAsync(window);
        }
        else
        {
            await box.ShowAsync();
        }
    }

    public async Task<bool> ShowConfirmAsync(string title, string message)
    {
        var box = MessageBoxManager.GetMessageBoxStandard(new MessageBoxStandardParams
        {
            ContentTitle = title,
            ContentMessage = message,
            Icon = Icon.Question,
            ButtonDefinitions = ButtonEnum.YesNo,
            WindowStartupLocation = Avalonia.Controls.WindowStartupLocation.CenterOwner
        });

        var window = GetMainWindow();
        var result = window != null
            ? await box.ShowWindowDialogAsync(window)
            : await box.ShowAsync();

        return result == ButtonResult.Yes;
    }

    public async Task<DialogResult> ShowConfirmAsync(string title, string message, string confirmText, string cancelText)
    {
        // Use custom dialog with specified button text
        var box = MessageBoxManager.GetMessageBoxStandard(new MessageBoxStandardParams
        {
            ContentTitle = title,
            ContentMessage = message,
            Icon = Icon.Question,
            ButtonDefinitions = ButtonEnum.OkCancel,
            WindowStartupLocation = Avalonia.Controls.WindowStartupLocation.CenterOwner
        });

        var window = GetMainWindow();
        var result = window != null
            ? await box.ShowWindowDialogAsync(window)
            : await box.ShowAsync();

        return result == ButtonResult.Ok ? DialogResult.Confirm : DialogResult.Cancel;
    }
    
    public async Task<IReadOnlyList<IStorageFile>> OpenFilePickerAsync(FilePickerOpenOptions options)
    {
        var window = GetMainWindow();
        if (window == null)
        {
            return [];
        }

        var storageProvider = window.StorageProvider;
        if (storageProvider == null || !storageProvider.CanOpen)
        {
            return [];
        }

        return await storageProvider.OpenFilePickerAsync(options);
    }
}

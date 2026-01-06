using Avalonia.Controls;
using KorProxy.ViewModels;

namespace KorProxy.Views;

public partial class AppShellView : Window
{
    public AppShellView()
    {
        InitializeComponent();
    }

    protected override async void OnOpened(EventArgs e)
    {
        base.OnOpened(e);

        if (DataContext is AppShellViewModel vm)
        {
            await vm.InitializeAsync();
        }
    }

    protected override void OnClosing(WindowClosingEventArgs e)
    {
        base.OnClosing(e);

        // On macOS we want the red close button to hide the window (keep proxy running),
        // but we MUST allow the app to actually quit on ApplicationShutdown/OSShutdown.
        if (!OperatingSystem.IsMacOS())
            return;

        // Only intercept user-driven window close. Avalonia uses ApplicationShutdown/OSShutdown when quitting:
        // https://github.com/AvaloniaUI/Avalonia/blob/master/src/Avalonia.Controls/ApplicationLifetimes/ClassicDesktopStyleApplicationLifetime.cs
        if (e.CloseReason == WindowCloseReason.WindowClosing && !e.IsProgrammatic)
        {
            e.Cancel = true;
            Hide();
        }
    }
}

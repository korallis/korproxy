using Avalonia.Threading;
using KorProxy.ViewModels;

namespace KorProxy.Services;

public sealed class NavigationService : INavigationService
{
    private readonly IServiceProvider _serviceProvider;

    public NavigationService(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public void NavigateTo(string tag)
    {
        if (string.IsNullOrWhiteSpace(tag))
            return;

        var mainWindow = _serviceProvider.GetService(typeof(MainWindowViewModel)) as MainWindowViewModel;
        if (mainWindow is null)
            return;

        var target = mainWindow.NavigationItems.FirstOrDefault(i =>
            string.Equals(i.Tag, tag, StringComparison.OrdinalIgnoreCase));

        if (target is null)
            return;

        Dispatcher.UIThread.Post(() => mainWindow.SelectedNavItem = target);
    }
}

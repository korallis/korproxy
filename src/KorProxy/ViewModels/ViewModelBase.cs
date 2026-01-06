using CommunityToolkit.Mvvm.ComponentModel;

namespace KorProxy.ViewModels;

/// <summary>
/// Base class for all ViewModels
/// </summary>
public abstract class ViewModelBase : ObservableObject
{
    /// <summary>
    /// Called when the view is activated/shown
    /// </summary>
    public virtual Task ActivateAsync(CancellationToken ct = default) => Task.CompletedTask;
    
    /// <summary>
    /// Called when the view is deactivated/hidden
    /// </summary>
    public virtual Task DeactivateAsync(CancellationToken ct = default) => Task.CompletedTask;
}

using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.ViewModels;
using KorProxy.Views;

namespace KorProxy;

public partial class App : Application
{
    private TrayIcon? _trayIcon;
    private IProxySupervisor? _proxySupervisor;
    private IAppLifetimeService? _appLifetime;
    private ILogger<App>? _logger;
    private EventHandler<ProxyState>? _stateChangedHandler;
    private CancellationTokenSource? _shutdownCts;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var services = Program.AppHost!.Services;

            _proxySupervisor = services.GetRequiredService<IProxySupervisor>();
            _appLifetime = services.GetRequiredService<IAppLifetimeService>();
            _logger = services.GetService<ILogger<App>>();
            _shutdownCts = new CancellationTokenSource();

            // Use AppShellView as the root window - handles auth state
            var appShellViewModel = services.GetRequiredService<AppShellViewModel>();
            desktop.MainWindow = new AppShellView
            {
                DataContext = appShellViewModel
            };

            desktop.MainWindow?.Show();
            desktop.MainWindow?.Activate();

            // Setup system tray
            SetupTrayIcon(desktop);

            // Subscribe to window restore requests from the lifetime service
            _appLifetime.WindowRestoreRequested += (_, _) =>
            {
                Avalonia.Threading.Dispatcher.UIThread.Post(() =>
                {
                    desktop.MainWindow?.Show();
                    desktop.MainWindow?.Activate();
                });
            };

            // On macOS, clicking the dock icon when the window is hidden triggers ActivationKind.Reopen.
            // Use IActivatableLifetime to restore the main window in that scenario.
            var activatableFeature = Application.Current?.TryGetFeature(typeof(IActivatableLifetime));
            if (activatableFeature is IActivatableLifetime activatableLifetime)
            {
                activatableLifetime.Activated += (_, args) =>
                {
                    if (_appLifetime.IsShuttingDown)
                        return;

                    if (args.Kind == ActivationKind.Reopen)
                    {
                        _appLifetime.RequestWindowRestore();
                    }
                };
            }

            desktop.ShutdownRequested += OnShutdownRequested;
            desktop.Exit += OnExit;
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void OnShutdownRequested(object? sender, ShutdownRequestedEventArgs e)
    {
        // Don't flip IsShuttingDown here. Some macOS quit paths can end up cancelled at the OS/window level,
        // and setting this flag too early makes the app appear "frozen" (dock click won't re-open, etc).
        // We'll set IsShuttingDown in OnExit once shutdown is actually proceeding.
        _logger?.LogInformation("ShutdownRequested received");

        // IMPORTANT:
        // Do NOT cancel shutdown. Cancelling can cause macOS "Quit" to appear to do nothing
        // if any other shutdown path doesn't re-enter here (e.g., force/programmatic shutdown).
        // Instead, let Avalonia proceed with shutdown and stop the proxy concurrently.
        _ = Task.Run(async () =>
        {
            try
            {
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await (_proxySupervisor?.StopAsync(cts.Token) ?? Task.CompletedTask);
            }
            catch (OperationCanceledException)
            {
                _logger?.LogInformation("Proxy shutdown cancelled due to timeout");
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error stopping proxy during shutdown");
            }
        });
    }

    private void OnExit(object? sender, ControlledApplicationLifetimeExitEventArgs e)
    {
        _appLifetime?.RequestShutdown();

        _logger?.LogInformation("Exit event received (ApplicationExitCode={ExitCode})", e.ApplicationExitCode);

        // Cancel any pending shutdown operations
        try
        {
            _shutdownCts?.Cancel();
            _shutdownCts?.Dispose();
            _shutdownCts = null;
        }
        catch (ObjectDisposedException)
        {
            // Already disposed, ignore
        }

        // Unsubscribe from proxy events first to prevent race conditions
        if (_proxySupervisor != null && _stateChangedHandler != null)
        {
            try
            {
                _proxySupervisor.StateChanged -= _stateChangedHandler;
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error unsubscribing from proxy state changes");
            }
            _stateChangedHandler = null;
        }

        // Dispose TrayIcon safely
        if (_trayIcon != null)
        {
            try
            {
                _trayIcon.IsVisible = false;
                _trayIcon.Dispose();
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error disposing tray icon");
            }
            _trayIcon = null;
        }
    }

    private void SetupTrayIcon(IClassicDesktopStyleApplicationLifetime desktop)
    {
        var menu = new NativeMenu();

        var startStopItem = new NativeMenuItem("Stop");
        startStopItem.Click += async (_, _) =>
        {
            if (_appLifetime?.IsShuttingDown == true) return;

            try
            {
                var state = _proxySupervisor?.State;
                if (state == ProxyState.Running)
                {
                    await _proxySupervisor!.StopAsync();
                }
                else if (state == ProxyState.CircuitOpen)
                {
                    // Reset circuit breaker first, then start
                    await _proxySupervisor!.ResetCircuitAsync();
                    await _proxySupervisor.StartAsync();
                }
                else
                {
                    await _proxySupervisor!.StartAsync();
                }
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Error toggling proxy state from tray");
            }
        };

        var showItem = new NativeMenuItem("Show");
        showItem.Click += (_, _) =>
        {
            if (_appLifetime?.IsShuttingDown == true) return;
            _appLifetime?.RequestWindowRestore();
        };

        var exitItem = new NativeMenuItem("Exit");
        exitItem.Click += (_, _) => desktop.Shutdown();

        menu.Add(startStopItem);
        menu.Add(new NativeMenuItemSeparator());
        menu.Add(showItem);
        menu.Add(exitItem);

        _trayIcon = new TrayIcon
        {
            ToolTipText = "KorProxy",
            Menu = menu,
            IsVisible = true
        };

        // Click on tray icon shows the window (macOS behavior)
        _trayIcon.Clicked += (_, _) =>
        {
            if (_appLifetime?.IsShuttingDown == true) return;
            _appLifetime?.RequestWindowRestore();
        };

        _stateChangedHandler = (_, state) =>
        {
            // Guard against updates during shutdown
            if (_appLifetime?.IsShuttingDown == true || _trayIcon == null) return;

            // Use InvokeAsync for safer thread marshalling
            Avalonia.Threading.Dispatcher.UIThread.InvokeAsync(() =>
            {
                // Double-check state after marshalling to UI thread
                if (_appLifetime?.IsShuttingDown == true || _trayIcon == null) return;

                try
                {
                    startStopItem.Header = state == ProxyState.Running ? "Stop" : "Start";

                    var status = _proxySupervisor?.GetStatus();
                    var lastErrorMessage = status?.LastError?.Message;
                    if (!string.IsNullOrWhiteSpace(lastErrorMessage))
                    {
                        // Keep tooltips short and single-line.
                        var firstLine = lastErrorMessage.Split('\n', '\r')[0].Trim();
                        lastErrorMessage = firstLine.Length > 120 ? firstLine[..120] + "…" : firstLine;
                    }

                    _trayIcon.ToolTipText = state switch
                    {
                        ProxyState.Running => "KorProxy - Running",
                        ProxyState.Error => !string.IsNullOrWhiteSpace(lastErrorMessage)
                            ? $"KorProxy - Error: {lastErrorMessage}"
                            : "KorProxy - Error",
                        ProxyState.Starting => "KorProxy - Starting...",
                        ProxyState.CircuitOpen => !string.IsNullOrWhiteSpace(lastErrorMessage)
                            ? $"KorProxy - Circuit Open: {lastErrorMessage}"
                            : "KorProxy - Circuit Open",
                        _ => "KorProxy - Stopped"
                    };
                }
                catch (Exception ex)
                {
                    _logger?.LogWarning(ex, "Error updating tray icon state");
                }
            });
        };
        _proxySupervisor!.StateChanged += _stateChangedHandler;
    }
}

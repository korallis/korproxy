using Avalonia;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using System.Runtime.InteropServices;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Infrastructure.Services;
using KorProxy.ViewModels;
using KorProxy.Services;

namespace KorProxy;

internal static class Program
{
    public static IHost? AppHost { get; private set; }
    private static int _shutdownInitiated;
    private static readonly List<PosixSignalRegistration> _posixSignalRegistrations = new();
    private static int _initialParentPid;

    [STAThread]
    public static int Main(string[] args)
    {
        // Build and start the host
        AppHost = CreateHost(args);
        AppHost.Start();

        RegisterSignalHandlers();
        StartParentWatchdog();

        var exitCode = 0;
        try
        {
            // Build and run Avalonia app
            exitCode = BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);

            return exitCode;
        }
        finally
        {
            ShutdownHostBestEffort(exitCode, TimeSpan.FromSeconds(5));
        }
    }

    [DllImport("libc")]
    private static extern int getppid();

    private static void RegisterSignalHandlers()
    {
        // When running from `dotnet run` on macOS/Linux, the process may receive POSIX signals (SIGTERM/SIGINT)
        // instead of Avalonia lifetime shutdown events. Handle them explicitly to ensure we always exit cleanly.
        if (!OperatingSystem.IsWindows())
        {
            try
            {
                // IMPORTANT: keep the registrations alive. If they are GC'd, the handlers stop firing.
                _posixSignalRegistrations.Add(PosixSignalRegistration.Create(PosixSignal.SIGTERM, ctx =>
                {
                    ctx.Cancel = true;
                    HandleExternalShutdownSignal("SIGTERM");
                }));
                _posixSignalRegistrations.Add(PosixSignalRegistration.Create(PosixSignal.SIGINT, ctx =>
                {
                    ctx.Cancel = true;
                    HandleExternalShutdownSignal("SIGINT");
                }));
                _posixSignalRegistrations.Add(PosixSignalRegistration.Create(PosixSignal.SIGQUIT, ctx =>
                {
                    ctx.Cancel = true;
                    HandleExternalShutdownSignal("SIGQUIT");
                }));
            }
            catch
            {
                // If signal registration fails, rely on normal shutdown paths.
            }
        }
    }

    private static void StartParentWatchdog()
    {
        // In dev runs (e.g. `dotnet run`), the Dock can show the parent runner process ("exec"),
        // and "Quit" may terminate the parent without delivering a clean shutdown to this process.
        // If our parent disappears, we become adopted by pid 1. Detect that and exit to avoid
        // a "zombie" app sitting in the Dock.
        if (OperatingSystem.IsWindows())
            return;

        try
        {
            _initialParentPid = getppid();
        }
        catch
        {
            return;
        }

        // If we're already adopted by init/launchd (common for packaged apps), don't enable the watchdog.
        if (_initialParentPid <= 1)
            return;

        _ = Task.Run(async () =>
        {
            while (true)
            {
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(1));

                    var currentParentPid = getppid();

                    // Parent is gone; we were adopted by init/launchd.
                    if (currentParentPid <= 1)
                    {
                        HandleExternalShutdownSignal("PARENT_EXIT");
                        return;
                    }
                }
                catch
                {
                    // If watchdog fails, just stop it; don't crash the app.
                    return;
                }
            }
        });
    }

    private static void HandleExternalShutdownSignal(string signalName)
    {
        // Ensure we only run shutdown once even if multiple signals arrive.
        if (Interlocked.Exchange(ref _shutdownInitiated, 1) != 0)
            return;

        ShutdownHostBestEffort(0, TimeSpan.FromSeconds(3), forceExit: true);
    }

    private static void ShutdownHostBestEffort(int exitCode, TimeSpan timeout, bool forceExit = false)
    {
        var host = AppHost;
        AppHost = null;

        var stopTimedOut = false;

        if (host != null)
        {
            try
            {
                var stopTask = host.StopAsync(CancellationToken.None);
                if (!stopTask.Wait(timeout))
                {
                    stopTimedOut = true;
                }
            }
            catch
            {
                // Ignore shutdown failures.
            }

            try
            {
                host.Dispose();
            }
            catch
            {
                // Ignore dispose errors.
            }
        }

        // If the host didn't stop within the timeout, force terminate to avoid macOS Dock "Quit" hangs.
        if (forceExit || stopTimedOut)
        {
            Environment.Exit(exitCode);
        }
    }

    private static IHost CreateHost(string[] args)
    {
        return Host.CreateDefaultBuilder(args)
            .UseContentRoot(AppContext.BaseDirectory)
            .ConfigureAppConfiguration((context, config) =>
            {
                config.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
            })
            .ConfigureServices((context, services) =>
            {
                // Configuration
                services.Configure<ProxyOptions>(
                    context.Configuration.GetSection(ProxyOptions.SectionName));

                // Core services
                services.AddSingleton<IAppPaths, AppPaths>();
                services.AddSingleton<IProxySupervisor, ProxySupervisor>();

                services.Configure<ConvexOptions>(
                    context.Configuration.GetSection(ConvexOptions.SectionName));
                services.Configure<UpdateOptions>(
                    context.Configuration.GetSection(UpdateOptions.SectionName));

                services.AddHttpClient<IConvexApiClient, ConvexHttpClient>((sp, client) =>
                {
                    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ConvexOptions>>().Value;
                    client.BaseAddress = new Uri(options.DeploymentUrl);
                });

                services.AddSingleton<ISecureStorage, SecureStorage>();
                services.AddSingleton<ISessionStore, SessionStore>();
                services.AddSingleton<IAuthService, AuthService>();
                services.AddSingleton<IEntitlementService, EntitlementService>();
                services.AddSingleton<IDeviceIdentityProvider, DeviceIdentityProvider>();
                services.AddSingleton<IDeviceService, DeviceService>();
                services.AddSingleton<ISubscriptionGate, SubscriptionGate>();
                services.AddSingleton<IUpdateBackend>(sp =>
                {
                    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<UpdateOptions>>().Value;
                    return new VelopackUpdateBackend(options);
                });
                services.AddSingleton<IUpdateService>(sp =>
                {
                    var backend = sp.GetRequiredService<IUpdateBackend>();
                    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<UpdateOptions>>().Value;
                    var appPaths = sp.GetRequiredService<IAppPaths>();
                    return new UpdateService(backend, options, appPaths);
                });

                // HTTP client for Management API
                services.AddHttpClient<IManagementApiClient, ManagementApiClient>((sp, client) =>
                {
                    var options = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ProxyOptions>>().Value;
                    client.BaseAddress = new Uri(options.ApiBaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(options.HttpTimeoutSeconds);
                    client.DefaultRequestHeaders.Authorization = 
                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", options.ManagementKey);
                });

                // Background service to manage proxy lifecycle
                services.AddHostedService<ProxyHostedService>();

                services.AddHostedService<SessionBootstrapHostedService>();
                services.AddHostedService<DeviceHeartbeatHostedService>();
                services.AddHostedService<ProviderTokenRefreshHostedService>();

                // ViewModels - App Shell (root)
                services.AddSingleton<AppShellViewModel>();
                
                // ViewModels - Auth & Onboarding
                services.AddTransient<OnboardingViewModel>();
                
                // ViewModels - Main App
                services.AddSingleton<MainWindowViewModel>();

                // UI services
                services.AddSingleton<INavigationService, NavigationService>();
                services.AddSingleton<IToastService, ToastService>();
                services.AddSingleton<IDialogService, DialogService>();

                // ViewModels - Page Views
                services.AddTransient<DashboardViewModel>();
                services.AddTransient<AccountViewModel>();
                services.AddTransient<ModelsViewModel>();
                services.AddTransient<AccountsViewModel>();
                services.AddTransient<IntegrationsViewModel>();
                services.AddTransient<SettingsViewModel>();
                services.AddTransient<LogsViewModel>();
            })
            .Build();
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}

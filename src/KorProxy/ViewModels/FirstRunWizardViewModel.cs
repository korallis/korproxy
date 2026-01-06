using System.Diagnostics;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Services;

namespace KorProxy.ViewModels;

public partial class FirstRunWizardViewModel : ViewModelBase
{
    private readonly IAppPaths _appPaths;
    private readonly IProxySupervisor _proxySupervisor;

    [ObservableProperty]
    private int _currentStep;

    [ObservableProperty]
    private bool _isBrewInstalled;

    [ObservableProperty]
    private bool _isInstalling;

    [ObservableProperty]
    private string _installStatus = "";

    [ObservableProperty]
    private string _apiKey = "";

    [ObservableProperty]
    private bool _canGoNext;

    public FirstRunWizardViewModel(IAppPaths appPaths, IProxySupervisor proxySupervisor)
    {
        _appPaths = appPaths;
        _proxySupervisor = proxySupervisor;
        
        CheckEnvironment();
    }

    private void CheckEnvironment()
    {
        // Simple check for brew on macOS/Linux
        if (!OperatingSystem.IsWindows())
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "brew",
                    Arguments = "--version",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var proc = Process.Start(psi);
                proc?.WaitForExit();
                IsBrewInstalled = proc?.ExitCode == 0;
            }
            catch
            {
                IsBrewInstalled = false;
            }
        }
        
        UpdateCanGoNext();
    }

    [RelayCommand]
    private async Task InstallViaBrew()
    {
        IsInstalling = true;
        InstallStatus = "Installing cli-proxy-api via Homebrew...";

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "brew",
                Arguments = "install cliproxyapi",
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            var proc = Process.Start(psi);
            if (proc != null)
            {
                await proc.WaitForExitAsync();
                if (proc.ExitCode == 0)
                {
                    InstallStatus = "Installation successful!";
                    // Assume brew installs to standard path, we might need to find it
                    // For now, let's assume the user can proceed
                    CheckBinary();
                }
                else
                {
                    var error = await proc.StandardError.ReadToEndAsync();
                    InstallStatus = $"Installation failed: {error}";
                }
            }
        }
        catch (Exception ex)
        {
            InstallStatus = $"Error: {ex.Message}";
        }
        finally
        {
            IsInstalling = false;
        }
    }

    [RelayCommand]
    private void BrowseForBinary()
    {
        // In a real app this would open a file picker
        // For now we'll just simulate it or wait for the View to handle the interaction
        // This command logic might move to the View code-behind to access StorageProvider
    }

    [RelayCommand]
    private void Next()
    {
        if (CurrentStep < 2)
        {
            CurrentStep++;
            UpdateCanGoNext();
        }
        else
        {
            // Finish
            Finish();
        }
    }

    private void UpdateCanGoNext()
    {
        CanGoNext = CurrentStep switch
        {
            0 => true, // Welcome
            1 => File.Exists(_appPaths.ProxyBinaryPath) || IsBrewInstalled, // Binary check (simplified)
            2 => !string.IsNullOrWhiteSpace(ApiKey), // API Key
            _ => false
        };
    }
    
    partial void OnApiKeyChanged(string value)
    {
        UpdateCanGoNext();
    }

    private void CheckBinary()
    {
         // Logic to verify binary exists at expected path
         // If generic "cliproxyapi" is in PATH, we might need to resolve it
         UpdateCanGoNext();
    }

    private void Finish()
    {
        // Save Config
        // Close Wizard, Open Main Window
        // This will be handled by the View/App messaging
    }
}

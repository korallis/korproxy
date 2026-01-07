using System.ComponentModel.DataAnnotations;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public partial class LoginViewModel : ViewModelBase
{
    private readonly AppShellViewModel _appShell;
    private readonly IAuthService _authService;
    private readonly ILogger? _logger;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(LoginCommand))]
    private string _email = string.Empty;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(LoginCommand))]
    private string _password = string.Empty;

    [ObservableProperty]
    private string? _emailError;

    [ObservableProperty]
    private string? _passwordError;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _hasError;

    public LoginViewModel(
        AppShellViewModel appShell,
        IAuthService authService,
        ILogger? logger)
    {
        _appShell = appShell;
        _authService = authService;
        _logger = logger;
    }

    // Design-time constructor
    public LoginViewModel()
    {
        _appShell = null!;
        _authService = null!;
    }

    private bool CanLogin => !IsLoading && 
                             !string.IsNullOrWhiteSpace(Email) && 
                             !string.IsNullOrWhiteSpace(Password);

    private bool ValidateInput()
    {
        var isValid = true;
        EmailError = null;
        PasswordError = null;

        if (string.IsNullOrWhiteSpace(Email))
        {
            EmailError = "Email is required";
            isValid = false;
        }
        else if (!IsValidEmail(Email))
        {
            EmailError = "Please enter a valid email address";
            isValid = false;
        }

        if (string.IsNullOrWhiteSpace(Password))
        {
            PasswordError = "Password is required";
            isValid = false;
        }

        return isValid;
    }

    private static bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }

    [RelayCommand(CanExecute = nameof(CanLogin))]
    private async Task LoginAsync()
    {
        if (!ValidateInput())
            return;

        try
        {
            IsLoading = true;
            HasError = false;
            ErrorMessage = null;

            _logger?.LogInformation("Attempting login for {Email}", Email);

            var result = await _authService.LoginAsync(Email.Trim(), Password);

            if (result.Success && result.Session != null)
            {
                _logger?.LogInformation("Login successful for {Email}", Email);
                await _appShell.OnLoginSuccessAsync(result.Session);
            }
            else
            {
                _logger?.LogWarning("Login failed for {Email}: {Error}", Email, result.Error);
                ErrorMessage = result.Error ?? "Login failed. Please check your credentials.";
                HasError = true;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Login error for {Email}", Email);
            ErrorMessage = ex.Message.Contains("Convex") || ex.Message.Contains("network", StringComparison.OrdinalIgnoreCase)
                ? "Unable to connect to server. Please check your internet connection."
                : $"Login failed: {ex.Message}";
            HasError = true;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void NavigateToRegister()
    {
        ClearForm();
        _appShell.NavigateToRegister();
    }

    [RelayCommand]
    private async Task ForgotPasswordAsync()
    {
        try
        {
            var url = "https://korproxy.com/forgot-password";
            await OpenBrowserAsync(url);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to open forgot password URL");
        }
    }

    private static async Task OpenBrowserAsync(string url)
    {
        await Task.Run(() =>
        {
            try
            {
                var psi = new System.Diagnostics.ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                };
                System.Diagnostics.Process.Start(psi);
            }
            catch
            {
                // Fallback for different platforms
                if (OperatingSystem.IsWindows())
                {
                    System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo("cmd", $"/c start {url}") { CreateNoWindow = true });
                }
                else if (OperatingSystem.IsMacOS())
                {
                    System.Diagnostics.Process.Start("open", url);
                }
                else if (OperatingSystem.IsLinux())
                {
                    System.Diagnostics.Process.Start("xdg-open", url);
                }
            }
        });
    }

    private void ClearForm()
    {
        Email = string.Empty;
        Password = string.Empty;
        EmailError = null;
        PasswordError = null;
        ErrorMessage = null;
        HasError = false;
    }

    public override Task ActivateAsync(CancellationToken ct = default)
    {
        ClearForm();
        return Task.CompletedTask;
    }
}

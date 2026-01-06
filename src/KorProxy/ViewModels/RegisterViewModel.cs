using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Services;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public partial class RegisterViewModel : ViewModelBase
{
    private readonly AppShellViewModel _appShell;
    private readonly IAuthService _authService;
    private readonly ILogger? _logger;

    private const int MinPasswordLength = 8;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(RegisterCommand))]
    private string _email = string.Empty;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(RegisterCommand))]
    private string _password = string.Empty;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(RegisterCommand))]
    private string _confirmPassword = string.Empty;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private string? _emailError;

    [ObservableProperty]
    private string? _passwordError;

    [ObservableProperty]
    private string? _confirmPasswordError;

    [ObservableProperty]
    private string? _errorMessage;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _hasError;

    public RegisterViewModel(
        AppShellViewModel appShell,
        IAuthService authService,
        ILogger? logger)
    {
        _appShell = appShell;
        _authService = authService;
        _logger = logger;
    }

    // Design-time constructor
    public RegisterViewModel()
    {
        _appShell = null!;
        _authService = null!;
    }

    private bool CanRegister => !IsLoading &&
                                !string.IsNullOrWhiteSpace(Email) &&
                                !string.IsNullOrWhiteSpace(Password) &&
                                !string.IsNullOrWhiteSpace(ConfirmPassword);

    private bool ValidateInput()
    {
        var isValid = true;
        EmailError = null;
        PasswordError = null;
        ConfirmPasswordError = null;

        // Email validation
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

        // Password validation
        if (string.IsNullOrWhiteSpace(Password))
        {
            PasswordError = "Password is required";
            isValid = false;
        }
        else if (Password.Length < MinPasswordLength)
        {
            PasswordError = $"Password must be at least {MinPasswordLength} characters";
            isValid = false;
        }

        // Confirm password validation
        if (string.IsNullOrWhiteSpace(ConfirmPassword))
        {
            ConfirmPasswordError = "Please confirm your password";
            isValid = false;
        }
        else if (Password != ConfirmPassword)
        {
            ConfirmPasswordError = "Passwords do not match";
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

    [RelayCommand(CanExecute = nameof(CanRegister))]
    private async Task RegisterAsync()
    {
        if (!ValidateInput())
            return;

        try
        {
            IsLoading = true;
            HasError = false;
            ErrorMessage = null;

            _logger?.LogInformation("Attempting registration for {Email}", Email);

            var result = await _authService.RegisterAsync(
                Email.Trim(),
                Password,
                string.IsNullOrWhiteSpace(Name) ? null : Name.Trim());

            if (result.Success && result.Session != null)
            {
                _logger?.LogInformation("Registration successful for {Email}", Email);
                await _appShell.OnRegisterSuccessAsync(result.Session);
            }
            else
            {
                _logger?.LogWarning("Registration failed for {Email}: {Error}", Email, result.Error);
                ErrorMessage = result.Error ?? "Registration failed. Please try again.";
                HasError = true;
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Registration error for {Email}", Email);
            ErrorMessage = "An error occurred. Please try again.";
            HasError = true;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void NavigateToLogin()
    {
        ClearForm();
        _appShell.NavigateToLogin();
    }

    private void ClearForm()
    {
        Email = string.Empty;
        Password = string.Empty;
        ConfirmPassword = string.Empty;
        Name = string.Empty;
        EmailError = null;
        PasswordError = null;
        ConfirmPasswordError = null;
        ErrorMessage = null;
        HasError = false;
    }

    public override Task ActivateAsync(CancellationToken ct = default)
    {
        ClearForm();
        return Task.CompletedTask;
    }
}

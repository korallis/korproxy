using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace KorProxy.ViewModels;

public enum OnboardingStep
{
    Welcome = 0,
    ConnectProviders = 1,
    ConfigureTools = 2,
    TestConnection = 3,
    Complete = 4
}

public partial class OnboardingViewModel : ViewModelBase
{
    private readonly AppShellViewModel _appShell;
    private readonly IProxySupervisor _proxySupervisor;
    private readonly IManagementApiClient _managementApi;
    private readonly ILogger<OnboardingViewModel>? _logger;

    public const int TotalSteps = 5;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(Step0Active))]
    [NotifyPropertyChangedFor(nameof(Step1Active))]
    [NotifyPropertyChangedFor(nameof(Step2Active))]
    [NotifyPropertyChangedFor(nameof(Step3Active))]
    [NotifyPropertyChangedFor(nameof(Step4Active))]
    [NotifyPropertyChangedFor(nameof(Step0Completed))]
    [NotifyPropertyChangedFor(nameof(Step1Completed))]
    [NotifyPropertyChangedFor(nameof(Step2Completed))]
    [NotifyPropertyChangedFor(nameof(Step3Completed))]
    private OnboardingStep _currentStep = OnboardingStep.Welcome;

    [ObservableProperty]
    private int _currentStepIndex;

    // Step active states
    public bool Step0Active => CurrentStep == OnboardingStep.Welcome;
    public bool Step1Active => CurrentStep == OnboardingStep.ConnectProviders;
    public bool Step2Active => CurrentStep == OnboardingStep.ConfigureTools;
    public bool Step3Active => CurrentStep == OnboardingStep.TestConnection;
    public bool Step4Active => CurrentStep == OnboardingStep.Complete;

    // Step completed states
    public bool Step0Completed => CurrentStepIndex > 0;
    public bool Step1Completed => CurrentStepIndex > 1;
    public bool Step2Completed => CurrentStepIndex > 2;
    public bool Step3Completed => CurrentStepIndex > 3;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(NextStepCommand))]
    [NotifyCanExecuteChangedFor(nameof(PreviousStepCommand))]
    private bool _canGoNext = true;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(PreviousStepCommand))]
    private bool _canGoBack;

    [ObservableProperty]
    private bool _isLastStep;

    [ObservableProperty]
    private bool _isTestingConnection;

    [ObservableProperty]
    private bool _testPassed;

    [ObservableProperty]
    private string? _testResultMessage;

    // Provider connection status
    [ObservableProperty]
    private bool _claudeConnected;

    [ObservableProperty]
    private bool _chatGptConnected;

    [ObservableProperty]
    private bool _geminiConnected;

    [ActivatorUtilitiesConstructor]
    public OnboardingViewModel(
        AppShellViewModel appShell,
        IProxySupervisor proxySupervisor,
        IManagementApiClient managementApi,
        ILogger<OnboardingViewModel> logger)
    {
        _appShell = appShell;
        _proxySupervisor = proxySupervisor;
        _managementApi = managementApi;
        _logger = logger;
        UpdateStepState();
    }

    // Design-time constructor
    public OnboardingViewModel()
    {
        _appShell = null!;
        _proxySupervisor = null!;
        _managementApi = null!;
    }

    private void UpdateStepState()
    {
        CurrentStepIndex = (int)CurrentStep;
        CanGoBack = CurrentStep > OnboardingStep.Welcome;
        IsLastStep = CurrentStep == OnboardingStep.Complete;
        CanGoNext = !IsLastStep && !IsTestingConnection;
    }

    [RelayCommand(CanExecute = nameof(CanGoNext))]
    private void NextStep()
    {
        if (CurrentStep < OnboardingStep.Complete)
        {
            CurrentStep = (OnboardingStep)((int)CurrentStep + 1);
            UpdateStepState();
            _logger?.LogInformation("Onboarding advanced to step {Step}", CurrentStep);
        }
    }

    [RelayCommand(CanExecute = nameof(CanGoBack))]
    private void PreviousStep()
    {
        if (CurrentStep > OnboardingStep.Welcome)
        {
            CurrentStep = (OnboardingStep)((int)CurrentStep - 1);
            UpdateStepState();
            _logger?.LogInformation("Onboarding went back to step {Step}", CurrentStep);
        }
    }

    [RelayCommand]
    private async Task SkipOnboardingAsync()
    {
        _logger?.LogInformation("User skipped onboarding");
        await _appShell.CompleteOnboardingAsync();
    }

    [RelayCommand]
    private async Task FinishOnboardingAsync()
    {
        _logger?.LogInformation("User completed onboarding");
        await _appShell.CompleteOnboardingAsync();
    }

    [RelayCommand]
    private async Task ConnectClaudeAsync()
    {
        await OpenProviderOAuthAsync("claude", "https://claude.ai");
    }

    [RelayCommand]
    private async Task ConnectChatGptAsync()
    {
        await OpenProviderOAuthAsync("chatgpt", "https://chat.openai.com");
    }

    [RelayCommand]
    private async Task ConnectGeminiAsync()
    {
        await OpenProviderOAuthAsync("gemini", "https://aistudio.google.com");
    }

    private async Task OpenProviderOAuthAsync(string provider, string url)
    {
        _logger?.LogInformation("Opening OAuth for {Provider}", provider);
        await OpenBrowserAsync(url);
        // TODO: Implement deep link callback handling
    }

    [RelayCommand]
    private async Task TestConnectionAsync()
    {
        IsTestingConnection = true;
        TestPassed = false;
        TestResultMessage = "Testing connection...";
        CanGoNext = false;

        try
        {
            _logger?.LogInformation("Starting connection test");

            // Start proxy if not running
            if (_proxySupervisor.State != Core.Models.ProxyState.Running)
            {
                await _proxySupervisor.StartAsync();
                await Task.Delay(2000); // Wait for startup
            }

            // Check proxy status
            var status = _proxySupervisor.GetStatus();
            if (status?.EndpointUrl != null)
            {
                TestPassed = true;
                TestResultMessage = $"Connection successful! Proxy running at {status.EndpointUrl}";
                _logger?.LogInformation("Connection test passed");
            }
            else
            {
                TestResultMessage = "Connection test failed. Please check your configuration.";
                _logger?.LogWarning("Connection test failed - no endpoint URL");
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Connection test error");
            TestResultMessage = $"Connection test failed: {ex.Message}";
        }
        finally
        {
            IsTestingConnection = false;
            CanGoNext = true;
            UpdateStepState();
        }
    }

    [RelayCommand]
    private async Task CopyToClipboardAsync(string? text)
    {
        if (string.IsNullOrEmpty(text)) return;

        try
        {
            if (Avalonia.Application.Current?.ApplicationLifetime is Avalonia.Controls.ApplicationLifetimes.IClassicDesktopStyleApplicationLifetime desktop)
            {
                var clipboard = desktop.MainWindow?.Clipboard;
                if (clipboard != null)
                {
                    await clipboard.SetTextAsync(text);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to copy to clipboard");
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

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        // Refresh provider status
        try
        {
            var accounts = await _managementApi.GetAccountsAsync(ct);
            if (accounts != null)
            {
                ClaudeConnected = accounts.Any(a => a.Provider.Equals("claude", StringComparison.OrdinalIgnoreCase) && a.IsConnected);
                ChatGptConnected = accounts.Any(a => a.Provider.Equals("codex", StringComparison.OrdinalIgnoreCase) && a.IsConnected);
                GeminiConnected = accounts.Any(a => a.Provider.Equals("gemini", StringComparison.OrdinalIgnoreCase) && a.IsConnected);
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to refresh provider status");
        }
    }

    // Tool configuration snippets
    public string CursorConfig => @"{
  ""openai.apiKey"": ""sk-korproxy"",
  ""openai.baseUrl"": ""http://localhost:1337/v1""
}";

    public string ClineConfig => @"API Key: sk-korproxy
Base URL: http://localhost:1337/v1";

    public string WindsurfConfig => @"Provider: OpenAI Compatible
API Key: sk-korproxy
Base URL: http://localhost:1337/v1";

    public string ContinueConfig => @"- provider: openai
  apiKey: sk-korproxy
  baseUrl: http://localhost:1337/v1";
}

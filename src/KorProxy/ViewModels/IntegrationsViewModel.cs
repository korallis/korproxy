using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Microsoft.Extensions.Options;

namespace KorProxy.ViewModels;

public partial class IntegrationsViewModel : ViewModelBase
{
    private readonly IManagementApiClient _apiClient;
    private readonly IAppPaths _appPaths;
    private readonly ProxyOptions _options;

    private bool _suppressChangeTracking;

    [ObservableProperty]
    private string _ampUpstreamUrl = "https://ampcode.com";

    [ObservableProperty]
    private string _ampUpstreamApiKey = "";

    [ObservableProperty]
    private bool _ampRestrictToLocalhost;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string? _statusMessage;

    [ObservableProperty]
    private bool _hasChanges;

    public string ProxyEndpoint => $"http://127.0.0.1:{_options.Port}";
    public string AmpSettingsUrl => "https://ampcode.com/settings";

    public IntegrationsViewModel(
        IManagementApiClient apiClient,
        IAppPaths appPaths,
        IOptions<ProxyOptions> options)
    {
        _apiClient = apiClient;
        _appPaths = appPaths;
        _options = options.Value;
    }

    public IntegrationsViewModel()
    {
        _apiClient = null!;
        _appPaths = null!;
        _options = new ProxyOptions { Port = 8317 };
    }

    public override async Task ActivateAsync(CancellationToken ct = default)
    {
        await LoadCurrentConfigAsync();
    }

    [RelayCommand]
    private async Task LoadCurrentConfigAsync()
    {
        if (_apiClient == null) return;

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var config = await _apiClient.GetConfigAsync();
            if (config != null)
            {
                _suppressChangeTracking = true;
                AmpUpstreamUrl = string.IsNullOrWhiteSpace(config.AmpCode?.UpstreamUrl)
                    ? "https://ampcode.com"
                    : config.AmpCode!.UpstreamUrl!;
                AmpUpstreamApiKey = config.AmpCode?.UpstreamApiKey ?? "";
                AmpRestrictToLocalhost = config.AmpCode?.RestrictManagementToLocalhost ?? true;
                _suppressChangeTracking = false;
            }
            HasChanges = false;
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to load config: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CopyAmpCliConfigAsync()
    {
        var settingsJson = JsonSerializer.Serialize(new
        {
            amp_url = ProxyEndpoint
        }, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower, WriteIndented = true });

        const string apiKey = "korproxy-local-key";
        var secretsJson = JsonSerializer.Serialize(new Dictionary<string, string>
        {
            [$"apiKey@{ProxyEndpoint}"] = apiKey
        }, new JsonSerializerOptions { WriteIndented = true });

        var config = $"""
            === Amp CLI Configuration ===
            
            1. Edit ~/.config/amp/settings.json:
            {settingsJson.Replace("amp_url", "amp.url")}
            
            2. Edit ~/.local/share/amp/secrets.json:
            {secretsJson}
            
            3. Or use environment variables:
            export AMP_URL={ProxyEndpoint}
            export AMP_API_KEY={apiKey}
            """;

        await CopyToClipboardAsync(config);
        StatusMessage = "Amp CLI configuration copied to clipboard!";
    }

    [RelayCommand]
    private async Task CopyFactoryConfigAsync()
    {
        if (_apiClient == null)
            return;

        const string apiKey = "korproxy-local-key";

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var models = await _apiClient.GetModelsAsync();

            // Factory expects provider-specific base_url + provider id.
            // Anthropic models are best routed via the Anthropic-compatible endpoints on the proxy;
            // everything else can go through the OpenAI-compatible surface.
            var customModels = models
                .Where(m => !string.IsNullOrWhiteSpace(m.Id))
                .OrderBy(m => m.Provider)
                .ThenBy(m => m.Id)
                .Select(m =>
                {
                    var ownedBy = (m.OwnedBy ?? "").ToLowerInvariant();
                    var isAnthropic = ownedBy == "anthropic";

                    return new
                    {
                        model = m.Id,
                        base_url = isAnthropic ? ProxyEndpoint : $"{ProxyEndpoint}/v1",
                        api_key = apiKey,
                        provider = isAnthropic ? "anthropic" : "openai"
                    };
                })
                .ToArray();

            var config = new { custom_models = customModels };
            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });

            var output = $"""
                === Factory Droid Configuration ===

                Save this to ~/.factory/config.json:

                {json}
                """;

            await CopyToClipboardAsync(output);
            StatusMessage = customModels.Length == 0
                ? "No models found to include. Make sure you’ve authenticated providers and the proxy is running, then try again."
                : $"Factory Droid configuration copied to clipboard! ({customModels.Length} models)";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to generate Factory config: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CopyClaudeCodeConfigAsync()
    {
        if (_apiClient == null)
            return;

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var models = await _apiClient.GetModelsAsync();
            var (opus, sonnet, haiku) = PickClaudeCodeTierModels(models);

            const string token = "sk-dummy";

            var output = $"""
                === Claude Code (Anthropic-compatible) ===

                Set these environment variables:

                export ANTHROPIC_BASE_URL={ProxyEndpoint}
                export ANTHROPIC_AUTH_TOKEN={token}

                # Claude Code v2.x.x
                export ANTHROPIC_DEFAULT_OPUS_MODEL={opus}
                export ANTHROPIC_DEFAULT_SONNET_MODEL={sonnet}
                export ANTHROPIC_DEFAULT_HAIKU_MODEL={haiku}

                # Claude Code v1.x.x (legacy)
                export ANTHROPIC_MODEL={sonnet}
                export ANTHROPIC_SMALL_FAST_MODEL={haiku}
                """;

            await CopyToClipboardAsync(output);
            StatusMessage = "Claude Code configuration copied to clipboard!";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to generate Claude Code config: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CopyCodexConfigAsync()
    {
        if (_apiClient == null)
            return;

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var models = await _apiClient.GetModelsAsync();
            var model = PickPreferredCodexModel(models);

            var configToml = $"""
                model_provider = "cliproxyapi"
                model = "{model}"
                model_reasoning_effort = "high"

                [model_providers.cliproxyapi]
                name = "cliproxyapi"
                base_url = "{ProxyEndpoint}/v1"
                wire_api = "responses"
                """;

            var authJson = JsonSerializer.Serialize(
                new Dictionary<string, string> { ["OPENAI_API_KEY"] = "sk-dummy" },
                new JsonSerializerOptions { WriteIndented = true });

            var output = $"""
                === Codex ===

                1) Save this to ~/.codex/config.toml:

                {configToml}

                2) Save this to ~/.codex/auth.json:

                {authJson}
                """;

            await CopyToClipboardAsync(output);
            StatusMessage = "Codex configuration copied to clipboard!";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to generate Codex config: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CopyGeminiCliConfigAsync()
    {
        if (_apiClient == null)
            return;

        IsLoading = true;
        StatusMessage = null;

        try
        {
            // We still fetch models so the UX feels "authenticated-aware" (and to surface errors early),
            // but Gemini CLI config itself is env-var based.
            _ = await _apiClient.GetModelsAsync();

            const string token = "sk-dummy";

            var output = $"""
                === Gemini CLI ===

                Option A: Login with Google (OAuth)
                export CODE_ASSIST_ENDPOINT=\"{ProxyEndpoint}\"

                Option B: Use Gemini API Key
                export GOOGLE_GEMINI_BASE_URL=\"{ProxyEndpoint}\"
                export GEMINI_API_KEY=\"{token}\"
                """;

            await CopyToClipboardAsync(output);
            StatusMessage = "Gemini CLI configuration copied to clipboard!";
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to generate Gemini CLI config: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task SaveAmpConfigAsync()
    {
        if (_apiClient == null || string.IsNullOrWhiteSpace(AmpUpstreamApiKey))
        {
            StatusMessage = "Please enter your Amp API key from ampcode.com/settings";
            return;
        }

        IsLoading = true;
        StatusMessage = null;

        try
        {
            var yaml = await _apiClient.GetConfigYamlAsync();
            if (string.IsNullOrWhiteSpace(yaml))
            {
                StatusMessage = "Failed to load config.yaml from the proxy (is Management API enabled?)";
                return;
            }

            var ampSection = BuildAmpcodeYamlSection(
                AmpUpstreamUrl,
                AmpUpstreamApiKey,
                AmpRestrictToLocalhost);

            var updatedYaml = UpsertTopLevelYamlSection(yaml, "ampcode", ampSection);
            var ok = await _apiClient.UpdateConfigAsync(updatedYaml);

            // Also update Amp CLI local settings so Amp points at this proxy.
            // Do not overwrite user MCP server config; only upsert `amp.url`.
            // And add the required secrets entry for API key auth.
            var (cliOk, cliPath, cliError) = await TryUpsertAmpCliSettingsAsync();

            var proxyApiKey = "korproxy-local-key";
            try
            {
                var keys = await _apiClient.GetProxyApiKeysAsync();
                var first = keys.FirstOrDefault(k => !string.IsNullOrWhiteSpace(k));
                if (!string.IsNullOrWhiteSpace(first))
                    proxyApiKey = first;
            }
            catch
            {
                // Best-effort; fall back to default.
            }

            var (secretsOk, secretsPath, secretsError) = await TryUpsertAmpCliSecretsAsync(proxyApiKey);

            if (ok && cliOk && secretsOk)
            {
                StatusMessage = $"Amp configuration saved! Updated Amp CLI settings at {cliPath} and secrets at {secretsPath}.";
                HasChanges = false;
            }
            else if (ok && (!cliOk || !secretsOk))
            {
                var parts = new List<string>();
                if (!cliOk)
                    parts.Add($"settings at {cliPath}: {cliError}");
                if (!secretsOk)
                    parts.Add($"secrets at {secretsPath}: {secretsError}");
                StatusMessage = $"Amp configuration saved to proxy, but failed to update Amp CLI {string.Join("; ", parts)}";
                HasChanges = false;
            }
            else if (!ok && cliOk && secretsOk)
            {
                StatusMessage = $"Amp CLI settings updated at {cliPath} and secrets at {secretsPath}, but proxy rejected config.yaml update.";
                HasChanges = true;
            }
            else
            {
                var parts = new List<string>();
                if (!cliOk)
                    parts.Add($"settings at {cliPath}: {cliError}");
                if (!secretsOk)
                    parts.Add($"secrets at {secretsPath}: {secretsError}");
                StatusMessage = $"Failed to save Amp configuration (proxy rejected config.yaml update). Also failed to update Amp CLI {string.Join("; ", parts)}";
                HasChanges = true;
            }
        }
        catch (Exception ex)
        {
            StatusMessage = $"Failed to save: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task<(bool ok, string path, string? error)> TryUpsertAmpCliSettingsAsync()
    {
        try
        {
            var settingsPath = GetAmpCliSettingsPath();
            var dir = Path.GetDirectoryName(settingsPath);
            if (!string.IsNullOrWhiteSpace(dir))
                Directory.CreateDirectory(dir);

            JsonObject root;
            if (File.Exists(settingsPath))
            {
                var existingText = await File.ReadAllTextAsync(settingsPath);
                var node = string.IsNullOrWhiteSpace(existingText)
                    ? null
                    : JsonNode.Parse(existingText);

                root = node as JsonObject ?? new JsonObject();
            }
            else
            {
                root = new JsonObject();
            }

            // Amp uses dotted keys in JSON (e.g., "amp.url").
            root["amp.url"] = ProxyEndpoint;

            var output = root.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(settingsPath, output + "\n");

            return (true, settingsPath, null);
        }
        catch (Exception ex)
        {
            return (false, GetAmpCliSettingsPath(), ex.Message);
        }
    }

    private async Task<(bool ok, string path, string? error)> TryUpsertAmpCliSecretsAsync(string proxyApiKey)
    {
        try
        {
            var secretsPath = GetAmpCliSecretsPath();
            var dir = Path.GetDirectoryName(secretsPath);
            if (!string.IsNullOrWhiteSpace(dir))
                Directory.CreateDirectory(dir);

            JsonObject root;
            if (File.Exists(secretsPath))
            {
                var existingText = await File.ReadAllTextAsync(secretsPath);
                var node = string.IsNullOrWhiteSpace(existingText)
                    ? null
                    : JsonNode.Parse(existingText);

                root = node as JsonObject ?? new JsonObject();
            }
            else
            {
                root = new JsonObject();
            }

            // Amp secrets key format: apiKey@http://localhost:8317
            root[$"apiKey@{ProxyEndpoint}"] = proxyApiKey;

            var output = root.ToJsonString(new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(secretsPath, output + "\n");

            if (!OperatingSystem.IsWindows())
            {
                try
                {
                    File.SetUnixFileMode(secretsPath, UnixFileMode.UserRead | UnixFileMode.UserWrite);
                }
                catch
                {
                    // Best-effort; ignore permission errors.
                }
            }

            return (true, secretsPath, null);
        }
        catch (Exception ex)
        {
            return (false, GetAmpCliSecretsPath(), ex.Message);
        }
    }

    private static string GetAmpCliSettingsPath()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        // Prefer XDG_CONFIG_HOME when present (common on Linux/macOS when user customizes it).
        var xdg = Environment.GetEnvironmentVariable("XDG_CONFIG_HOME");
        var baseDir = !string.IsNullOrWhiteSpace(xdg)
            ? xdg
            : Path.Combine(home, ".config");

        return Path.Combine(baseDir, "amp", "settings.json");
    }

    private static string GetAmpCliSecretsPath()
    {
        var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);

        // Amp docs use XDG data dir for secrets: ~/.local/share/amp/secrets.json
        var xdg = Environment.GetEnvironmentVariable("XDG_DATA_HOME");
        var baseDir = !string.IsNullOrWhiteSpace(xdg)
            ? xdg
            : Path.Combine(home, ".local", "share");

        return Path.Combine(baseDir, "amp", "secrets.json");
    }

    [RelayCommand]
    private void OpenAmpSettings()
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = AmpSettingsUrl,
                UseShellExecute = true
            };
            System.Diagnostics.Process.Start(psi);
        }
        catch
        {
            StatusMessage = "Could not open browser";
        }
    }

    private static async Task CopyToClipboardAsync(string text)
    {
        if (Application.Current?.ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var clipboard = desktop.MainWindow?.Clipboard;
            if (clipboard != null)
            {
                await clipboard.SetTextAsync(text);
            }
        }
    }

    private static (string opus, string sonnet, string haiku) PickClaudeCodeTierModels(List<AvailableModel> models)
    {
        static string? FindByPrefix(IEnumerable<string> ids, params string[] prefixes)
        {
            foreach (var p in prefixes)
            {
                var match = ids.FirstOrDefault(id => id.StartsWith(p, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrWhiteSpace(match))
                    return match;
            }

            return null;
        }

        static string? FindByContains(IEnumerable<string> ids, params string[] needles)
        {
            foreach (var needle in needles)
            {
                var match = ids.FirstOrDefault(id => id.Contains(needle, StringComparison.OrdinalIgnoreCase));
                if (!string.IsNullOrWhiteSpace(match))
                    return match;
            }

            return null;
        }

        var ids = models
            .Select(m => m.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Prefer true Claude models when present.
        var opus = FindByPrefix(ids, "claude-opus")
                   ?? FindByContains(ids, "gpt-5-codex(high)", "gpt-5(high)")
                   ?? FindByPrefix(ids, "gpt-5-codex", "gpt-5")
                   ?? FindByPrefix(ids, "gemini-2.5-pro", "gemini-")
                   ?? ids.FirstOrDefault()
                   ?? "gpt-5";

        var sonnet = FindByPrefix(ids, "claude-sonnet")
                     ?? FindByContains(ids, "gpt-5-codex(medium)", "gpt-5(medium)")
                     ?? FindByPrefix(ids, "gpt-5-codex", "gpt-5")
                     ?? FindByPrefix(ids, "gemini-2.5-flash", "gemini-")
                     ?? opus;

        var haiku = FindByPrefix(ids, "claude-haiku", "claude-3-5-haiku")
                    ?? FindByContains(ids, "gpt-5-codex(low)", "gpt-5(minimal)")
                    ?? FindByPrefix(ids, "gemini-2.5-flash-lite", "gemini-")
                    ?? sonnet;

        return (opus, sonnet, haiku);
    }

    private static string PickPreferredCodexModel(List<AvailableModel> models)
    {
        var ids = models
            .Select(m => m.Id)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return ids.FirstOrDefault(id => id.StartsWith("gpt-5-codex", StringComparison.OrdinalIgnoreCase))
               ?? ids.FirstOrDefault(id => id.StartsWith("gpt-5", StringComparison.OrdinalIgnoreCase))
               ?? ids.FirstOrDefault()
               ?? "gpt-5-codex";
    }

    private static string BuildAmpcodeYamlSection(string upstreamUrl, string upstreamApiKey, bool restrictToLocalhost)
    {
        var sb = new StringBuilder();
        sb.AppendLine("ampcode:");
        sb.AppendLine($"  upstream-url: \"{upstreamUrl}\"");
        sb.AppendLine($"  upstream-api-key: \"{upstreamApiKey}\"");
        sb.AppendLine($"  restrict-management-to-localhost: {restrictToLocalhost.ToString().ToLowerInvariant()}");
        return sb.ToString().TrimEnd() + "\n";
    }

    private static string UpsertTopLevelYamlSection(string yaml, string key, string section)
    {
        if (string.IsNullOrWhiteSpace(section))
            return yaml;

        var lines = yaml.Replace("\r\n", "\n").Split('\n');
        var sectionLines = section.Replace("\r\n", "\n").Split('\n');

        var start = -1;
        for (var i = 0; i < lines.Length; i++)
        {
            if (string.Equals(lines[i].TrimEnd(), $"{key}:", StringComparison.Ordinal))
            {
                start = i;
                break;
            }
        }

        if (start < 0)
        {
            var trimmed = yaml.TrimEnd();
            return trimmed.Length == 0
                ? section
                : trimmed + "\n\n" + section;
        }

        var end = lines.Length;
        for (var i = start + 1; i < lines.Length; i++)
        {
            var line = lines[i];
            if (string.IsNullOrWhiteSpace(line))
                continue;

            // new top-level key
            if (!char.IsWhiteSpace(line[0]) && !line.StartsWith('#') && line.Contains(':'))
            {
                end = i;
                break;
            }
        }

        var rebuilt = new List<string>(lines.Length - (end - start) + sectionLines.Length);
        rebuilt.AddRange(lines.Take(start));
        rebuilt.AddRange(sectionLines);
        rebuilt.AddRange(lines.Skip(end));

        return string.Join("\n", rebuilt).TrimEnd() + "\n";
    }

    partial void OnAmpUpstreamUrlChanged(string value)
    {
        if (!_suppressChangeTracking)
            HasChanges = true;
    }

    partial void OnAmpUpstreamApiKeyChanged(string value)
    {
        if (!_suppressChangeTracking)
            HasChanges = true;
    }

    partial void OnAmpRestrictToLocalhostChanged(bool value)
    {
        if (!_suppressChangeTracking)
            HasChanges = true;
    }
}

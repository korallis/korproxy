namespace KorProxy.Core.Models;

/// <summary>
/// Represents an OAuth provider account
/// </summary>
public sealed class ProviderAccount
{
    /// <summary>
    /// Tokens older than this threshold should be proactively refreshed.
    /// </summary>
    private static readonly TimeSpan RefreshThreshold = TimeSpan.FromDays(3);

    public required string Provider { get; init; }
    public required string DisplayName { get; init; }
    public string? Email { get; init; }
    public DateTimeOffset? TokenExpiry { get; init; }
    public bool IsConnected { get; init; }
    public bool NeedsRefresh { get; init; }
    public string? ErrorMessage { get; init; }

    /// <summary>
    /// When the token was last refreshed by the proxy.
    /// </summary>
    public DateTimeOffset? LastRefresh { get; init; }

    /// <summary>
    /// Returns true if the token should be proactively refreshed
    /// (connected but no refresh in the last 3 days).
    /// </summary>
    public bool ShouldRefresh => IsConnected &&
        (!LastRefresh.HasValue || DateTimeOffset.UtcNow - LastRefresh.Value > RefreshThreshold);
}

/// <summary>
/// Supported providers (both OAuth and API-key based)
/// </summary>
public static class Providers
{
    // OAuth-based providers
    public const string Gemini = "gemini";
    public const string Claude = "claude";
    public const string Codex = "codex";
    public const string Qwen = "qwen";
    public const string IFlow = "iflow";
    public const string Antigravity = "antigravity";
    
    // API-key based providers
    public const string BigModel = "bigmodel";
    
    /// <summary>
    /// All OAuth-based providers that use browser authentication.
    /// </summary>
    public static readonly string[] OAuthProviders = [Gemini, Claude, Codex, Qwen, IFlow, Antigravity];
    
    /// <summary>
    /// All API-key based providers that use manual API key entry.
    /// </summary>
    public static readonly string[] ApiKeyProviders = [BigModel];
    
    /// <summary>
    /// All providers.
    /// </summary>
    public static readonly string[] All = [Gemini, Claude, Codex, Qwen, IFlow, Antigravity, BigModel];
    
    /// <summary>
    /// Returns true if the provider uses API key authentication instead of OAuth.
    /// </summary>
    public static bool IsApiKeyProvider(string provider) => provider switch
    {
        BigModel => true,
        _ => false
    };
    
    public static string GetDisplayName(string provider) => provider switch
    {
        Gemini => "Google Gemini",
        Claude => "Claude Code",
        Codex => "ChatGPT Codex",
        Qwen => "Qwen Code",
        IFlow => "iFlow",
        Antigravity => "Antigravity",
        BigModel => "BigModel (GLM-4)",
        _ => provider
    };
    
    public static string GetDescription(string provider) => provider switch
    {
        Gemini => "Google AI models",
        Claude => "Anthropic Claude",
        Codex => "OpenAI models",
        Qwen => "Alibaba Qwen",
        IFlow => "iFlow AI",
        Antigravity => "Antigravity AI",
        BigModel => "Zhipu AI GLM-4 series",
        _ => ""
    };
}

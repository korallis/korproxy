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
/// Supported OAuth providers
/// </summary>
public static class Providers
{
    public const string Gemini = "gemini";
    public const string Claude = "claude";
    public const string Codex = "codex";
    public const string Qwen = "qwen";
    public const string IFlow = "iflow";
    public const string Antigravity = "antigravity";
    
    public static readonly string[] All = [Gemini, Claude, Codex, Qwen, IFlow, Antigravity];
    
    public static string GetDisplayName(string provider) => provider switch
    {
        Gemini => "Google Gemini",
        Claude => "Claude Code",
        Codex => "ChatGPT Codex",
        Qwen => "Qwen Code",
        IFlow => "iFlow",
        Antigravity => "Antigravity",
        _ => provider
    };
}

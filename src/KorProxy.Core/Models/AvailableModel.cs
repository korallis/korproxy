namespace KorProxy.Core.Models;

public class AvailableModel
{
    public required string Id { get; init; }
    public string? DisplayName { get; init; }
    public string? OwnedBy { get; init; }
    public string? Type { get; init; }
    
    public string Provider => OwnedBy?.ToLowerInvariant() switch
    {
        "anthropic" => "Claude",
        "openai" => "Codex",
        "antigravity" => "Antigravity",
        "google" => "Gemini",
        _ => OwnedBy ?? "Unknown"
    };
}

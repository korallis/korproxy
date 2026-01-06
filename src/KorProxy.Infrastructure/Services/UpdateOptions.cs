namespace KorProxy.Infrastructure.Services;

public sealed class UpdateOptions
{
    public const string SectionName = "Updates";
    public string GithubOwner { get; set; } = "router-for-me";
    public string GithubRepo { get; set; } = "KorProxy";
    public string AppId { get; set; } = "KorProxy";
    public string Channel { get; set; } = "stable";
    public string? DownloadUrl { get; set; }
}

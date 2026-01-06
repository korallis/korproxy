namespace KorProxy.Core.Models;

/// <summary>
/// A log entry from the proxy
/// </summary>
public sealed record LogEntry(
    DateTimeOffset Timestamp,
    string Level,
    string Source,
    string Message);

/// <summary>
/// Usage statistics from the proxy
/// </summary>
public sealed class UsageStats
{
    public int TotalRequests { get; init; }
    public int SuccessfulRequests { get; init; }
    public int FailedRequests { get; init; }
    public long TotalTokens { get; init; }
    public Dictionary<string, int> RequestsByProvider { get; init; } = new();
    public Dictionary<string, int> RequestsByModel { get; init; } = new();

    // Daily aggregates keyed by local date.
    public Dictionary<DateOnly, int> RequestsByDay { get; init; } = new();
    public Dictionary<DateOnly, long> TokensByDay { get; init; } = new();
}

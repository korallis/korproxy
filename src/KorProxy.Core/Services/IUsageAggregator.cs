using KorProxy.Core.Models;

namespace KorProxy.Core.Services;

public interface IUsageAggregator
{
    UsageRangeStats CalculateRangeStats(UsageStats usage, DateRangePreset preset, DateOnly? customStart = null, DateOnly? customEnd = null);
}

public enum DateRangePreset
{
    Today,
    Last7Days,
    Last30Days,
    ThisMonth,
    Custom
}

public sealed record UsageRangeStats(int Requests, long Tokens);

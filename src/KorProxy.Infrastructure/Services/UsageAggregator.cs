using KorProxy.Core.Models;
using KorProxy.Core.Services;

namespace KorProxy.Infrastructure.Services;

public sealed class UsageAggregator : IUsageAggregator
{
    public UsageRangeStats CalculateRangeStats(UsageStats usage, DateRangePreset preset, DateOnly? customStart = null, DateOnly? customEnd = null)
    {
        if (usage.RequestsByDay.Count == 0)
        {
            return new UsageRangeStats(usage.TotalRequests, usage.TotalTokens);
        }

        var today = DateOnly.FromDateTime(DateTime.Now);
        var (start, end) = GetDateRange(preset, today, customStart, customEnd);

        if (start is null || end is null)
        {
            return new UsageRangeStats(0, 0);
        }

        var totalRequests = 0;
        foreach (var (day, count) in usage.RequestsByDay)
        {
            if (day >= start && day <= end)
                totalRequests += count;
        }

        long totalTokens = 0;
        foreach (var (day, count) in usage.TokensByDay)
        {
            if (day >= start && day <= end)
                totalTokens += count;
        }

        return new UsageRangeStats(totalRequests, totalTokens);
    }

    private static (DateOnly? Start, DateOnly? End) GetDateRange(DateRangePreset preset, DateOnly today, DateOnly? customStart, DateOnly? customEnd)
    {
        return preset switch
        {
            DateRangePreset.Today => (today, today),
            DateRangePreset.Last7Days => (today.AddDays(-6), today),
            DateRangePreset.Last30Days => (today.AddDays(-29), today),
            DateRangePreset.ThisMonth => (new DateOnly(today.Year, today.Month, 1), today),
            DateRangePreset.Custom when customStart.HasValue && customEnd.HasValue =>
                customEnd < customStart ? (customEnd, customStart) : (customStart, customEnd),
            DateRangePreset.Custom => (null, null),
            _ => (today.AddDays(-6), today)
        };
    }
}

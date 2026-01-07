using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Infrastructure.Services;
using Xunit;

namespace KorProxy.Tests;

public class UsageAggregatorTests
{
    private readonly UsageAggregator _aggregator = new();

    [Fact]
    public void CalculateRangeStats_EmptyData_ReturnsTotals()
    {
        var usage = new UsageStats
        {
            TotalRequests = 100,
            TotalTokens = 5000
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Today);

        Assert.Equal(100, result.Requests);
        Assert.Equal(5000, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_Today_ReturnsOnlyTodayData()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var yesterday = today.AddDays(-1);

        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [today] = 50,
                [yesterday] = 100
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [today] = 2500,
                [yesterday] = 5000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Today);

        Assert.Equal(50, result.Requests);
        Assert.Equal(2500, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_Last7Days_IncludesSevenDays()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [today] = 10,
                [today.AddDays(-6)] = 10,
                [today.AddDays(-7)] = 100 // Should be excluded
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [today] = 100,
                [today.AddDays(-6)] = 100,
                [today.AddDays(-7)] = 1000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Last7Days);

        Assert.Equal(20, result.Requests);
        Assert.Equal(200, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_Last30Days_IncludesThirtyDays()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [today] = 5,
                [today.AddDays(-29)] = 5,
                [today.AddDays(-30)] = 1000 // Should be excluded
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [today] = 50,
                [today.AddDays(-29)] = 50,
                [today.AddDays(-30)] = 10000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Last30Days);

        Assert.Equal(10, result.Requests);
        Assert.Equal(100, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_ThisMonth_StartsFromFirstOfMonth()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var firstOfMonth = new DateOnly(today.Year, today.Month, 1);
        var lastMonth = firstOfMonth.AddDays(-1);

        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [today] = 20,
                [firstOfMonth] = 30,
                [lastMonth] = 500 // Should be excluded
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [today] = 200,
                [firstOfMonth] = 300,
                [lastMonth] = 5000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.ThisMonth);

        Assert.Equal(50, result.Requests);
        Assert.Equal(500, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_CustomRange_FiltersCorrectly()
    {
        var start = new DateOnly(2024, 6, 1);
        var end = new DateOnly(2024, 6, 30);

        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [new DateOnly(2024, 6, 15)] = 25,
                [new DateOnly(2024, 5, 31)] = 100, // Before range
                [new DateOnly(2024, 7, 1)] = 100   // After range
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [new DateOnly(2024, 6, 15)] = 250,
                [new DateOnly(2024, 5, 31)] = 1000,
                [new DateOnly(2024, 7, 1)] = 1000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Custom, start, end);

        Assert.Equal(25, result.Requests);
        Assert.Equal(250, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_CustomRangeInverted_SwapsDates()
    {
        var end = new DateOnly(2024, 6, 1);
        var start = new DateOnly(2024, 6, 30);

        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [new DateOnly(2024, 6, 15)] = 42
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [new DateOnly(2024, 6, 15)] = 420
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Custom, start, end);

        Assert.Equal(42, result.Requests);
        Assert.Equal(420, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_CustomRangeMissingDates_ReturnsZero()
    {
        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [new DateOnly(2024, 6, 15)] = 100
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [new DateOnly(2024, 6, 15)] = 1000
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Custom, null, null);

        Assert.Equal(0, result.Requests);
        Assert.Equal(0, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_SingleDayData_CalculatesCorrectly()
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [today] = 77
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [today] = 7700
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Last7Days);

        Assert.Equal(77, result.Requests);
        Assert.Equal(7700, result.Tokens);
    }

    [Fact]
    public void CalculateRangeStats_NoMatchingDays_ReturnsZero()
    {
        var farPast = new DateOnly(2020, 1, 1);
        var usage = new UsageStats
        {
            RequestsByDay = new Dictionary<DateOnly, int>
            {
                [farPast] = 999
            },
            TokensByDay = new Dictionary<DateOnly, long>
            {
                [farPast] = 9999
            }
        };

        var result = _aggregator.CalculateRangeStats(usage, DateRangePreset.Today);

        Assert.Equal(0, result.Requests);
        Assert.Equal(0, result.Tokens);
    }
}

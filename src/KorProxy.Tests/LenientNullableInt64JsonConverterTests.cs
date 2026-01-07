using System.Text.Json;
using KorProxy.Infrastructure.Serialization;
using Xunit;

namespace KorProxy.Tests;

public sealed class LenientNullableInt64JsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters =
        {
            new LenientNullableInt64JsonConverter()
        }
    };

    private sealed record Payload(long? TrialEnd, long? CurrentPeriodEnd);

    [Fact]
    public void Read_StringNaN_ReturnsNull()
    {
        var payload = JsonSerializer.Deserialize<Payload>(
            "{\"trialEnd\":\"NaN\",\"currentPeriodEnd\":\"NaN\"}",
            Options);

        Assert.NotNull(payload);
        Assert.Null(payload.TrialEnd);
        Assert.Null(payload.CurrentPeriodEnd);
    }

    [Fact]
    public void Read_Number_ReturnsInt64()
    {
        var payload = JsonSerializer.Deserialize<Payload>(
            "{\"trialEnd\":1766401180000,\"currentPeriodEnd\":1766401180000}",
            Options);

        Assert.NotNull(payload);
        Assert.Equal(1766401180000, payload.TrialEnd);
        Assert.Equal(1766401180000, payload.CurrentPeriodEnd);
    }

    [Fact]
    public void Read_WholeNumberWithDecimal_ReturnsInt64()
    {
        var payload = JsonSerializer.Deserialize<Payload>(
            "{\"trialEnd\":1766401180000.0,\"currentPeriodEnd\":1766401180000.0}",
            Options);

        Assert.NotNull(payload);
        Assert.Equal(1766401180000, payload.TrialEnd);
        Assert.Equal(1766401180000, payload.CurrentPeriodEnd);
    }

    [Fact]
    public void Read_NumericString_ReturnsInt64()
    {
        var payload = JsonSerializer.Deserialize<Payload>(
            "{\"trialEnd\":\"1766401180000\",\"currentPeriodEnd\":\"1766401180000\"}",
            Options);

        Assert.NotNull(payload);
        Assert.Equal(1766401180000, payload.TrialEnd);
        Assert.Equal(1766401180000, payload.CurrentPeriodEnd);
    }

    [Fact]
    public void Read_Null_ReturnsNull()
    {
        var payload = JsonSerializer.Deserialize<Payload>(
            "{\"trialEnd\":null,\"currentPeriodEnd\":null}",
            Options);

        Assert.NotNull(payload);
        Assert.Null(payload.TrialEnd);
        Assert.Null(payload.CurrentPeriodEnd);
    }
}


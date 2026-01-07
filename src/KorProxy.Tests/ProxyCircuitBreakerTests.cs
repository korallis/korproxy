using KorProxy.Infrastructure.Services;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace KorProxy.Tests;

public class ProxyCircuitBreakerTests
{
    private readonly Mock<ILogger<ProxyCircuitBreaker>> _loggerMock = new();

    private ProxyCircuitBreaker CreateBreaker(int maxFailures = 3) =>
        new(maxFailures, _loggerMock.Object);

    [Fact]
    public void Constructor_InitialState_IsClosed()
    {
        var breaker = CreateBreaker();

        Assert.False(breaker.IsOpen);
        Assert.Equal(0, breaker.ConsecutiveFailures);
        Assert.Null(breaker.LastError);
    }

    [Fact]
    public void RecordSuccess_ResetsConsecutiveFailures()
    {
        var breaker = CreateBreaker();
        breaker.RecordFailure(new Exception("test"));
        breaker.RecordFailure(new Exception("test2"));

        breaker.RecordSuccess();

        Assert.Equal(0, breaker.ConsecutiveFailures);
        Assert.Null(breaker.LastError);
    }

    [Fact]
    public void RecordFailure_IncrementsConsecutiveFailures()
    {
        var breaker = CreateBreaker();

        breaker.RecordFailure();
        Assert.Equal(1, breaker.ConsecutiveFailures);

        breaker.RecordFailure();
        Assert.Equal(2, breaker.ConsecutiveFailures);
    }

    [Fact]
    public void RecordFailure_StoresLastError()
    {
        var breaker = CreateBreaker();
        var exception = new InvalidOperationException("test error");

        breaker.RecordFailure(exception);

        Assert.Same(exception, breaker.LastError);
    }

    [Fact]
    public void RecordFailure_ReachingMaxFailures_OpensCircuit()
    {
        var breaker = CreateBreaker(maxFailures: 3);

        breaker.RecordFailure();
        Assert.False(breaker.IsOpen);

        breaker.RecordFailure();
        Assert.False(breaker.IsOpen);

        breaker.RecordFailure();
        Assert.True(breaker.IsOpen);
    }

    [Fact]
    public void RecordFailure_BeyondMaxFailures_RemainsOpen()
    {
        var breaker = CreateBreaker(maxFailures: 2);

        breaker.RecordFailure();
        breaker.RecordFailure();
        breaker.RecordFailure();
        breaker.RecordFailure();

        Assert.True(breaker.IsOpen);
        Assert.Equal(4, breaker.ConsecutiveFailures);
    }

    [Fact]
    public void Reset_ClosesCircuitAndClearsState()
    {
        var breaker = CreateBreaker(maxFailures: 1);
        breaker.RecordFailure(new Exception("error"));

        Assert.True(breaker.IsOpen);

        breaker.Reset();

        Assert.False(breaker.IsOpen);
        Assert.Equal(0, breaker.ConsecutiveFailures);
        Assert.Null(breaker.LastError);
    }

    [Fact]
    public void Reset_WhenAlreadyClosed_DoesNothing()
    {
        var breaker = CreateBreaker();
        breaker.RecordFailure();

        breaker.Reset();

        Assert.False(breaker.IsOpen);
        Assert.Equal(0, breaker.ConsecutiveFailures);
    }

    [Fact]
    public void RecordSuccess_AfterOpen_DoesNotCloseCircuit()
    {
        var breaker = CreateBreaker(maxFailures: 1);
        breaker.RecordFailure();

        Assert.True(breaker.IsOpen);

        breaker.RecordSuccess();

        Assert.True(breaker.IsOpen);
        Assert.Equal(0, breaker.ConsecutiveFailures);
    }

    [Fact]
    public void MaxFailures_ReturnsConfiguredValue()
    {
        var breaker = CreateBreaker(maxFailures: 5);

        Assert.Equal(5, breaker.MaxFailures);
    }

    [Fact]
    public void RecordFailure_WithNullError_UpdatesConsecutiveFailures()
    {
        var breaker = CreateBreaker();

        breaker.RecordFailure(null);

        Assert.Equal(1, breaker.ConsecutiveFailures);
        Assert.Null(breaker.LastError);
    }

    [Fact]
    public void RecordFailure_UpdatesLastErrorOnEachCall()
    {
        var breaker = CreateBreaker();
        var first = new Exception("first");
        var second = new Exception("second");

        breaker.RecordFailure(first);
        Assert.Same(first, breaker.LastError);

        breaker.RecordFailure(second);
        Assert.Same(second, breaker.LastError);
    }

    [Fact]
    public async Task CircuitBreaker_ThreadSafety_ConcurrentRecordFailures()
    {
        var breaker = CreateBreaker(maxFailures: 100);
        var tasks = new Task[50];

        for (int i = 0; i < tasks.Length; i++)
        {
            tasks[i] = Task.Run(() =>
            {
                for (int j = 0; j < 10; j++)
                {
                    breaker.RecordFailure();
                }
            });
        }

        await Task.WhenAll(tasks);

        Assert.Equal(500, breaker.ConsecutiveFailures);
        Assert.True(breaker.IsOpen);
    }
}

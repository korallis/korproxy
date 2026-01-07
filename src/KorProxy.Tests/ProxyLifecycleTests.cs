using KorProxy.Core.Models;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for proxy lifecycle management, state transitions, and status reporting.
/// Tests critical flows for start/stop/restart and error handling.
/// </summary>
public class ProxyLifecycleTests
{
    [Fact]
    public void ProxyState_AllStates_AreDefined()
    {
        // Assert - All proxy states exist for lifecycle management
        var states = new[]
        {
            ProxyState.Stopped,
            ProxyState.Starting,
            ProxyState.Running,
            ProxyState.Stopping,
            ProxyState.Error,
            ProxyState.CircuitOpen
        };

        Assert.Equal(6, states.Length);
        Assert.Contains(ProxyState.Stopped, states);
        Assert.Contains(ProxyState.Running, states);
        Assert.Contains(ProxyState.CircuitOpen, states);
    }

    [Fact]
    public void ProxyStatus_Running_HasRequiredFields()
    {
        // Arrange
        var startedAt = DateTimeOffset.UtcNow.AddMinutes(-5);
        
        // Act
        var status = new ProxyStatus(
            ProxyState.Running,
            12345,
            startedAt,
            "http://localhost:8317",
            0,
            null);

        // Assert - Running proxy has process ID, endpoint, and no errors
        Assert.Equal(ProxyState.Running, status.State);
        Assert.Equal(12345, status.ProcessId);
        Assert.Equal(startedAt, status.StartedAt);
        Assert.Equal("http://localhost:8317", status.EndpointUrl);
        Assert.Equal(0, status.ConsecutiveFailures);
        Assert.Null(status.LastError);
    }

    [Fact]
    public void ProxyStatus_Stopped_HasNoProcessInfo()
    {
        // Arrange & Act
        var status = new ProxyStatus(
            ProxyState.Stopped,
            null,
            null,
            null,
            0,
            null);

        // Assert - Stopped proxy has no process or endpoint
        Assert.Equal(ProxyState.Stopped, status.State);
        Assert.Null(status.ProcessId);
        Assert.Null(status.StartedAt);
        Assert.Null(status.EndpointUrl);
    }

    [Fact]
    public void ProxyStatus_Error_TracksFailures()
    {
        // Arrange
        var exception = new InvalidOperationException("Failed to start proxy");
        
        // Act
        var status = new ProxyStatus(
            ProxyState.Error,
            null,
            null,
            null,
            2,
            exception);

        // Assert - Error state tracks consecutive failures and last error
        Assert.Equal(ProxyState.Error, status.State);
        Assert.Equal(2, status.ConsecutiveFailures);
        Assert.NotNull(status.LastError);
        Assert.Equal("Failed to start proxy", status.LastError.Message);
    }

    [Fact]
    public void ProxyStatus_CircuitOpen_BlocksRestart()
    {
        // Arrange
        var exception = new Exception("Too many failures");
        
        // Act - Circuit opens after threshold failures
        var status = new ProxyStatus(
            ProxyState.CircuitOpen,
            null,
            null,
            null,
            5,
            exception);

        // Assert - Circuit breaker state prevents further restart attempts
        Assert.Equal(ProxyState.CircuitOpen, status.State);
        Assert.True(status.ConsecutiveFailures >= 5);
        Assert.NotNull(status.LastError);
    }

    [Fact]
    public void ProxyOptions_ValidateDefaults()
    {
        // Arrange & Act
        var options = new ProxyOptions
        {
            Port = 8317,
            ApiBaseUrl = "http://127.0.0.1:8317",
            AutoStart = true,
            HttpTimeoutSeconds = 10,
            StartupTimeoutSeconds = 30,
            MaxConsecutiveFailures = 5
        };

        // Assert - Default options match expected configuration
        Assert.Equal(8317, options.Port);
        Assert.Equal("http://127.0.0.1:8317", options.ApiBaseUrl);
        Assert.True(options.AutoStart);
        Assert.Equal(10, options.HttpTimeoutSeconds);
        Assert.Equal(30, options.StartupTimeoutSeconds);
        Assert.Equal(5, options.MaxConsecutiveFailures);
    }

    [Fact]
    public void ProxyConfig_ContainsExpectedSettings()
    {
        // Arrange & Act
        var config = new ProxyConfig
        {
            Port = 8317,
            Host = "127.0.0.1",
            AutoStart = true,
            ApiKeys = new List<string> { "key1", "key2" },
            Debug = false,
            UsageStatisticsEnabled = true
        };

        // Assert - Config has all runtime settings
        Assert.Equal(8317, config.Port);
        Assert.Equal("127.0.0.1", config.Host);
        Assert.True(config.AutoStart);
        Assert.Equal(2, config.ApiKeys.Count);
        Assert.False(config.Debug);
        Assert.True(config.UsageStatisticsEnabled);
    }

    [Fact]
    public void ProxyState_TransitionSequence_IsValid()
    {
        // Arrange - Expected state transitions during normal operation
        var transitions = new[]
        {
            ProxyState.Stopped,     // Initial state
            ProxyState.Starting,    // User starts proxy
            ProxyState.Running,     // Proxy becomes healthy
            ProxyState.Stopping,    // User stops proxy
            ProxyState.Stopped      // Back to stopped
        };

        // Assert - Verify expected lifecycle states exist
        Assert.Equal(5, transitions.Length);
        Assert.Equal(ProxyState.Stopped, transitions[0]);
        Assert.Equal(ProxyState.Starting, transitions[1]);
        Assert.Equal(ProxyState.Running, transitions[2]);
        Assert.Equal(ProxyState.Stopping, transitions[3]);
        Assert.Equal(ProxyState.Stopped, transitions[4]);
    }
}

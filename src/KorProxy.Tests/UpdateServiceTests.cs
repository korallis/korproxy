using KorProxy.Core.Models;
using KorProxy.Core.Services;
using KorProxy.Infrastructure.Services;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for update flow, download progress, and install-on-quit behavior.
/// Tests critical flows for Velopack auto-update integration.
/// </summary>
public class UpdateServiceTests
{
    [Fact]
    public void UpdateStatus_AllStates_AreDefined()
    {
        // Assert - All update states exist for flow control
        var states = new[]
        {
            UpdateStatus.Idle,
            UpdateStatus.Checking,
            UpdateStatus.UpdateAvailable,
            UpdateStatus.Downloading,
            UpdateStatus.ReadyToInstall,
            UpdateStatus.UpToDate,
            UpdateStatus.Error
        };

        Assert.Equal(7, states.Length);
        Assert.Contains(UpdateStatus.Idle, states);
        Assert.Contains(UpdateStatus.UpdateAvailable, states);
        Assert.Contains(UpdateStatus.ReadyToInstall, states);
    }

    [Fact]
    public void UpdateState_Idle_HasNoData()
    {
        // Arrange & Act
        var state = new UpdateState(UpdateStatus.Idle, null, null, null);

        // Assert - Idle state has no version or progress
        Assert.Equal(UpdateStatus.Idle, state.Status);
        Assert.Null(state.Version);
        Assert.Null(state.Message);
        Assert.Null(state.Progress);
    }

    [Fact]
    public void UpdateState_UpdateAvailable_HasVersion()
    {
        // Arrange & Act
        var state = new UpdateState(
            UpdateStatus.UpdateAvailable,
            "2.1.0",
            "Update available.",
            null);

        // Assert - Available state includes version
        Assert.Equal(UpdateStatus.UpdateAvailable, state.Status);
        Assert.Equal("2.1.0", state.Version);
        Assert.Equal("Update available.", state.Message);
        Assert.Null(state.Progress);
    }

    [Fact]
    public void UpdateState_Downloading_HasProgress()
    {
        // Arrange & Act
        var state = new UpdateState(
            UpdateStatus.Downloading,
            "2.1.0",
            "Downloading update...",
            0.65);

        // Assert - Downloading state tracks progress
        Assert.Equal(UpdateStatus.Downloading, state.Status);
        Assert.Equal("2.1.0", state.Version);
        Assert.NotNull(state.Progress);
        Assert.Equal(0.65, state.Progress.Value, precision: 2);
        Assert.True(state.Progress.Value >= 0.0 && state.Progress.Value <= 1.0);
    }

    [Fact]
    public void UpdateState_ReadyToInstall_HasFullProgress()
    {
        // Arrange & Act
        var state = new UpdateState(
            UpdateStatus.ReadyToInstall,
            "2.1.0",
            "Ready to install on quit.",
            1.0);

        // Assert - Ready state shows 100% progress
        Assert.Equal(UpdateStatus.ReadyToInstall, state.Status);
        Assert.Equal("2.1.0", state.Version);
        Assert.Equal("Ready to install on quit.", state.Message);
        Assert.Equal(1.0, state.Progress);
    }

    [Fact]
    public void UpdateState_Error_HasErrorMessage()
    {
        // Arrange & Act
        var state = new UpdateState(
            UpdateStatus.Error,
            "2.1.0",
            "Download failed: Network error.",
            null);

        // Assert - Error state includes failure message
        Assert.Equal(UpdateStatus.Error, state.Status);
        Assert.NotNull(state.Message);
        Assert.Contains("failed", state.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void UpdateOptions_ValidateConfiguration()
    {
        // Arrange & Act
        var options = new UpdateOptions
        {
            GithubOwner = "router-for-me",
            GithubRepo = "KorProxy",
            AppId = "KorProxy",
            Channel = "stable"
        };

        // Assert - Update options specify GitHub release feed
        Assert.Equal("router-for-me", options.GithubOwner);
        Assert.Equal("KorProxy", options.GithubRepo);
        Assert.Equal("KorProxy", options.AppId);
        Assert.Equal("stable", options.Channel);
    }

    [Fact]
    public void UpdateCheckResult_NewVersion_IsDetectable()
    {
        // Arrange & Act
        var result = new UpdateCheckResult("2.1.0");

        // Assert - Result contains version
        Assert.Equal("2.1.0", result.Version);
    }
}

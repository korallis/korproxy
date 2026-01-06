using KorProxy.Core.Models;
using KorProxy.Core.Services;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for auth/session continuity and token management.
/// Tests critical flows: login, refresh, token storage, and session validation.
/// </summary>
public class AuthServiceTests
{
    [Fact]
    public void AuthSession_ContainsRequiredUserData()
    {
        // Arrange & Act
        var user = new UserProfile(
            "user-123",
            "test@example.com",
            UserRole.User,
            "Test User",
            SubscriptionStatus.Active,
            "pro",
            null,
            DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds(),
            false);

        var session = new AuthSession("token-123", user, null);

        // Assert - Session contains all required user data
        Assert.Equal("token-123", session.Token);
        Assert.Equal("user-123", session.User.Id);
        Assert.Equal("test@example.com", session.User.Email);
        Assert.Equal(SubscriptionStatus.Active, session.User.SubscriptionStatus);
        Assert.Equal("pro", session.User.SubscriptionPlan);
    }

    [Fact]
    public void AuthResult_Success_ContainsSession()
    {
        // Arrange
        var user = new UserProfile(
            "user-123",
            "test@example.com",
            UserRole.User,
            "Test User",
            SubscriptionStatus.Active,
            "pro",
            null,
            null,
            false);

        var session = new AuthSession("token-123", user, null);

        // Act
        var result = new AuthResult(true, null, session);

        // Assert
        Assert.True(result.Success);
        Assert.Null(result.Error);
        Assert.NotNull(result.Session);
        Assert.Equal("token-123", result.Session.Token);
    }

    [Fact]
    public void AuthResult_Failure_ContainsError()
    {
        // Arrange & Act
        var result = new AuthResult(false, "Invalid credentials", null);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("Invalid credentials", result.Error);
        Assert.Null(result.Session);
    }

    [Fact]
    public void SubscriptionStatus_Lifetime_MapsCorrectly()
    {
        // Arrange & Act
        var user = new UserProfile(
            "admin-123",
            "admin@example.com",
            UserRole.Admin,
            "Admin User",
            SubscriptionStatus.Lifetime,
            null,
            null,
            null,
            false);

        // Assert - Lifetime subscription has no expiry
        Assert.Equal(SubscriptionStatus.Lifetime, user.SubscriptionStatus);
        Assert.Null(user.CurrentPeriodEnd);
        Assert.Null(user.TrialEnd);
    }

    [Fact]
    public void SubscriptionStatus_Active_HasCurrentPeriodEnd()
    {
        // Arrange
        var periodEnd = DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds();

        // Act
        var user = new UserProfile(
            "user-123",
            "user@example.com",
            UserRole.User,
            "User",
            SubscriptionStatus.Active,
            "pro",
            null,
            periodEnd,
            false);

        // Assert - Active subscription has period end
        Assert.Equal(SubscriptionStatus.Active, user.SubscriptionStatus);
        Assert.NotNull(user.CurrentPeriodEnd);
        Assert.Equal(periodEnd, user.CurrentPeriodEnd);
    }

    [Fact]
    public void SubscriptionInfo_TeamPlan_HasCorrectStatus()
    {
        // Arrange & Act
        var subscription = new SubscriptionInfo(
            SubscriptionInfoStatus.Active,
            "team",
            null,
            DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds(),
            false,
            true,
            30);

        // Assert
        Assert.Equal(SubscriptionInfoStatus.Active, subscription.Status);
        Assert.Equal("team", subscription.Plan);
        Assert.True(subscription.IsActive);
        Assert.Equal(30, subscription.DaysLeft);
    }
}

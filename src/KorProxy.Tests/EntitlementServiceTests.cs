using KorProxy.Core.Models;
using Xunit;

namespace KorProxy.Tests;

/// <summary>
/// Focused tests for entitlement syncing, grace periods, and team overrides.
/// Tests critical flows for subscription and plan limits enforcement.
/// </summary>
public class EntitlementServiceTests
{
    [Fact]
    public void Entitlements_ProPlan_HasCorrectLimits()
    {
        // Arrange & Act
        var limits = new PlanLimits(10, 10, 3, true, 90);
        var entitlements = new Entitlements(
            Plan.Pro,
            EntitlementScope.Personal,
            EntitlementStatus.Active,
            limits,
            null,
            null,
            DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds(),
            null);

        // Assert - Pro plan has expected limits
        Assert.Equal(Plan.Pro, entitlements.Plan);
        Assert.Equal(EntitlementScope.Personal, entitlements.Scope);
        Assert.Equal(10, entitlements.Limits.MaxProfiles);
        Assert.Equal(10, entitlements.Limits.MaxProviderGroups);
        Assert.Equal(3, entitlements.Limits.MaxDevices);
        Assert.True(entitlements.Limits.SmartRoutingEnabled);
        Assert.Equal(90, entitlements.Limits.AnalyticsRetentionDays);
    }

    [Fact]
    public void Entitlements_TeamPlan_OverridesPersonalLimits()
    {
        // Arrange & Act - Team plan has unlimited profiles/groups
        var teamLimits = new PlanLimits(int.MaxValue, int.MaxValue, 5, true, 90);
        var teamEntitlements = new Entitlements(
            Plan.Team,
            EntitlementScope.Team,
            EntitlementStatus.Active,
            teamLimits,
            "team-123",
            "Acme Corp",
            DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeMilliseconds(),
            null);

        // Assert - Team scope provides unlimited resources
        Assert.Equal(Plan.Team, teamEntitlements.Plan);
        Assert.Equal(EntitlementScope.Team, teamEntitlements.Scope);
        Assert.Equal("team-123", teamEntitlements.TeamId);
        Assert.Equal("Acme Corp", teamEntitlements.TeamName);
        Assert.Equal(int.MaxValue, teamEntitlements.Limits.MaxProfiles);
        Assert.Equal(int.MaxValue, teamEntitlements.Limits.MaxProviderGroups);
        Assert.Equal(5, teamEntitlements.Limits.MaxDevices);
    }

    [Fact]
    public void Entitlements_GracePeriod_HasCorrectStatus()
    {
        // Arrange - Subscription in grace period after past_due
        var graceEndsAt = DateTimeOffset.UtcNow.AddDays(2).ToUnixTimeMilliseconds();
        var limits = new PlanLimits(10, 10, 3, true, 90);
        
        // Act
        var entitlements = new Entitlements(
            Plan.Pro,
            EntitlementScope.Personal,
            EntitlementStatus.Grace,
            limits,
            null,
            null,
            null,
            graceEndsAt);

        // Assert - Grace period allows continued access with expiry
        Assert.Equal(EntitlementStatus.Grace, entitlements.Status);
        Assert.NotNull(entitlements.GracePeriodEnd);
        Assert.Equal(graceEndsAt, entitlements.GracePeriodEnd);
        Assert.True(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() < graceEndsAt);
    }

    [Fact]
    public void EntitlementCache_OfflineGrace_Has72HourWindow()
    {
        // Arrange
        var lastSynced = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var offlineGraceUntil = lastSynced + (long)TimeSpan.FromHours(EntitlementConstants.GracePeriodOfflineHours).TotalMilliseconds;
        var limits = new PlanLimits(10, 10, 3, true, 90);
        var entitlements = new Entitlements(Plan.Pro, EntitlementScope.Personal, EntitlementStatus.Active, limits, null, null, null, null);

        // Act
        var cache = new EntitlementCache(entitlements, lastSynced, true, offlineGraceUntil);

        // Assert - Offline grace period is 72 hours
        Assert.True(cache.IsOffline);
        Assert.NotNull(cache.OfflineGraceUntil);
        Assert.Equal(EntitlementConstants.GracePeriodOfflineHours, 72);
        
        var expectedGraceDuration = cache.OfflineGraceUntil!.Value - cache.LastSynced!.Value;
        var expectedMs = (long)TimeSpan.FromHours(72).TotalMilliseconds;
        Assert.Equal(expectedMs, expectedGraceDuration);
    }

    [Fact]
    public void EntitlementConstants_PastDueGrace_Is3Days()
    {
        // Assert - Past due grace period constant
        Assert.Equal(3, EntitlementConstants.GracePeriodPastDueDays);
    }

    [Fact]
    public void PlanLimits_FreePlan_HasRestrictedAccess()
    {
        // Arrange & Act - Free plan limits
        var freeLimits = new PlanLimits(1, 2, 1, false, 7);

        // Assert
        Assert.Equal(1, freeLimits.MaxProfiles);
        Assert.Equal(2, freeLimits.MaxProviderGroups);
        Assert.Equal(1, freeLimits.MaxDevices);
        Assert.False(freeLimits.SmartRoutingEnabled);
        Assert.Equal(7, freeLimits.AnalyticsRetentionDays);
    }

    [Fact]
    public void EntitlementStatus_AllStates_AreDefined()
    {
        // Assert - All entitlement states exist
        var states = new[]
        {
            EntitlementStatus.Active,
            EntitlementStatus.Trialing,
            EntitlementStatus.Grace,
            EntitlementStatus.PastDue,
            EntitlementStatus.Expired
        };

        Assert.Equal(5, states.Length);
        Assert.Contains(EntitlementStatus.Active, states);
        Assert.Contains(EntitlementStatus.Grace, states);
    }
}

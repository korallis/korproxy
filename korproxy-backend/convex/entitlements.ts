import { v } from "convex/values";
import { query, QueryCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";

type Plan = "free" | "pro" | "team";
type SubscriptionStatus = Doc<"users">["subscriptionStatus"];

const PLAN_LIMITS = {
  free: {
    maxProfiles: 1,
    maxProviderGroups: 2,
    maxDevices: 1,
    smartRouting: false,
    analyticsRetentionDays: 7,
  },
  pro: {
    maxProfiles: 10,
    maxProviderGroups: 10,
    maxDevices: 3,
    smartRouting: true,
    analyticsRetentionDays: 90,
  },
  team: {
    maxProfiles: -1,
    maxProviderGroups: -1,
    maxDevices: 5,
    smartRouting: true,
    analyticsRetentionDays: 90,
  },
} as const;

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

const entitlementsValidator = v.object({
  plan: v.union(v.literal("free"), v.literal("pro"), v.literal("team")),
  isActive: v.boolean(),
  inGracePeriod: v.boolean(),
  graceEndsAt: v.optional(v.number()),
  limits: v.object({
    maxProfiles: v.number(),
    maxProviderGroups: v.number(),
    maxDevices: v.number(),
    smartRouting: v.boolean(),
    analyticsRetentionDays: v.number(),
  }),
  teamId: v.optional(v.id("teams")),
  teamName: v.optional(v.string()),
});

async function getUserFromToken(ctx: QueryCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

function computePlanLimits(plan: Plan) {
  return { ...PLAN_LIMITS[plan] };
}

function calculateGracePeriod(
  status: SubscriptionStatus,
  periodEnd: number | undefined
): { inGrace: boolean; graceEndsAt: number | undefined } {
  if (status !== "past_due") {
    return { inGrace: false, graceEndsAt: undefined };
  }
  
  const graceEndsAt = periodEnd ? periodEnd + GRACE_PERIOD_MS : Date.now() + GRACE_PERIOD_MS;
  const inGrace = Date.now() < graceEndsAt;
  
  return { inGrace, graceEndsAt: inGrace ? graceEndsAt : undefined };
}

function resolveHighestPlan(
  userStatus: SubscriptionStatus,
  teamMemberships: Array<{ team: Doc<"teams">; membership: Doc<"teamMembers"> }>
): { plan: Plan; teamId?: Id<"teams">; teamName?: string } {
  const activeStatuses: SubscriptionStatus[] = ["active", "trialing", "lifetime", "past_due"];
  const userHasPro = activeStatuses.includes(userStatus);
  
  if (userHasPro) {
    return { plan: "pro" };
  }
  
  const activeTeam = teamMemberships.find(
    ({ team, membership }) =>
      activeStatuses.includes(team.subscriptionStatus) && membership.status === "active"
  );
  
  if (activeTeam) {
    return {
      plan: "team",
      teamId: activeTeam.team._id,
      teamName: activeTeam.team.name,
    };
  }
  
  return { plan: "free" };
}

export const get = query({
  args: {
    token: v.string(),
  },
  returns: v.union(entitlementsValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const teamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const teamsWithMembership: Array<{ team: Doc<"teams">; membership: Doc<"teamMembers"> }> = [];
    for (const membership of teamMemberships) {
      if (membership.status !== "active") continue;
      const team = await ctx.db.get(membership.teamId);
      if (team) {
        teamsWithMembership.push({ team, membership });
      }
    }

    const { plan, teamId, teamName } = resolveHighestPlan(
      user.subscriptionStatus,
      teamsWithMembership
    );

    const relevantPeriodEnd =
      plan === "team" && teamId
        ? teamsWithMembership.find((t) => t.team._id === teamId)?.team.currentPeriodEnd
        : user.currentPeriodEnd;

    const relevantStatus =
      plan === "team" && teamId
        ? teamsWithMembership.find((t) => t.team._id === teamId)?.team.subscriptionStatus ?? "none"
        : user.subscriptionStatus;

    const { inGrace, graceEndsAt } = calculateGracePeriod(
      relevantStatus as SubscriptionStatus,
      relevantPeriodEnd
    );

    const activeStatuses: SubscriptionStatus[] = ["active", "trialing", "lifetime"];
    const isActive = activeStatuses.includes(relevantStatus as SubscriptionStatus) || inGrace;

    return {
      plan,
      isActive,
      inGracePeriod: inGrace,
      graceEndsAt,
      limits: computePlanLimits(plan),
      teamId,
      teamName,
    };
  },
});

export const getForTeam = query({
  args: {
    teamId: v.id("teams"),
    token: v.string(),
  },
  returns: v.union(entitlementsValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_user", (q) => q.eq("teamId", args.teamId).eq("userId", user._id))
      .first();

    if (!membership || membership.status !== "active") return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const { inGrace, graceEndsAt } = calculateGracePeriod(
      team.subscriptionStatus,
      team.currentPeriodEnd
    );

    const activeStatuses = ["active", "trialing"];
    const isActive = activeStatuses.includes(team.subscriptionStatus) || inGrace;

    return {
      plan: "team" as const,
      isActive,
      inGracePeriod: inGrace,
      graceEndsAt,
      limits: computePlanLimits("team"),
      teamId: team._id,
      teamName: team.name,
    };
  },
});

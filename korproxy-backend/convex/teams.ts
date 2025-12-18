import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserFromToken, requireTeamRole, getTeamMembership } from "./lib/rbac";

/**
 * Create a new team - caller becomes owner
 */
export const create = mutation({
  args: {
    token: v.string(),
    name: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    teamId: v.optional(v.id("teams")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const name = args.name.trim();
    if (!name || name.length < 2) {
      return { success: false, error: "Team name must be at least 2 characters" };
    }

    if (name.length > 100) {
      return { success: false, error: "Team name must be 100 characters or less" };
    }

    const teamId = await ctx.db.insert("teams", {
      name,
      ownerUserId: user._id,
      subscriptionStatus: "none",
      seatsPurchased: 1,
      seatsUsed: 1,
      createdAt: Date.now(),
    });

    await ctx.db.insert("teamMembers", {
      teamId,
      userId: user._id,
      role: "owner",
      status: "active",
      joinedAt: Date.now(),
    });

    return { success: true, teamId };
  },
});

/**
 * Get team by ID with member count
 */
export const get = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
  },
  returns: v.union(
    v.object({
      id: v.id("teams"),
      name: v.string(),
      ownerUserId: v.id("users"),
      subscriptionStatus: v.string(),
      seatsPurchased: v.number(),
      seatsUsed: v.number(),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      createdAt: v.number(),
      memberCount: v.number(),
      userRole: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    const membership = await getTeamMembership(ctx, args.teamId, user._id);
    if (!membership || membership.status !== "active") return null;

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      id: team._id,
      name: team.name,
      ownerUserId: team.ownerUserId,
      subscriptionStatus: team.subscriptionStatus,
      seatsPurchased: team.seatsPurchased,
      seatsUsed: team.seatsUsed,
      currentPeriodEnd: team.currentPeriodEnd,
      cancelAtPeriodEnd: team.cancelAtPeriodEnd,
      createdAt: team.createdAt,
      memberCount: members.length,
      userRole: membership.role,
    };
  },
});

/**
 * List all teams for current user with their role
 */
export const listForUser = query({
  args: {
    token: v.string(),
  },
  returns: v.array(
    v.object({
      id: v.id("teams"),
      name: v.string(),
      role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
      memberCount: v.number(),
      subscriptionStatus: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const teams = [];
    for (const membership of memberships) {
      const team = await ctx.db.get(membership.teamId);
      if (!team) continue;

      const allMembers = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", team._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      teams.push({
        id: team._id,
        name: team.name,
        role: membership.role,
        memberCount: allMembers.length,
        subscriptionStatus: team.subscriptionStatus,
      });
    }

    return teams;
  },
});

/**
 * Update team name (owner/admin only)
 */
export const update = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    updates: v.object({
      name: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const membership = await requireTeamRole(ctx, args.teamId, user._id, "admin");
    if (!membership) {
      return { success: false, error: "Must be admin or owner to update team" };
    }

    const updateData: { name?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };

    if (args.updates.name !== undefined) {
      const name = args.updates.name.trim();
      if (!name || name.length < 2) {
        return { success: false, error: "Team name must be at least 2 characters" };
      }
      if (name.length > 100) {
        return { success: false, error: "Team name must be 100 characters or less" };
      }
      updateData.name = name;
    }

    await ctx.db.patch(args.teamId, updateData);
    return { success: true };
  },
});

/**
 * Delete team (owner only, must have no other members)
 */
export const deleteTeam = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const membership = await requireTeamRole(ctx, args.teamId, user._id, "owner");
    if (!membership) {
      return { success: false, error: "Only the owner can delete the team" };
    }

    const activeMembers = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    if (activeMembers.length > 1) {
      return { success: false, error: "Cannot delete team with other members. Remove all members first." };
    }

    const pendingInvites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    for (const invite of pendingInvites) {
      await ctx.db.patch(invite._id, { status: "revoked" });
    }

    await ctx.db.delete(membership._id);
    await ctx.db.delete(args.teamId);

    return { success: true };
  },
});

/**
 * Transfer ownership to another member
 */
export const transferOwnership = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    newOwnerId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const ownerMembership = await requireTeamRole(ctx, args.teamId, user._id, "owner");
    if (!ownerMembership) {
      return { success: false, error: "Only the owner can transfer ownership" };
    }

    if (args.newOwnerId === user._id) {
      return { success: false, error: "You are already the owner" };
    }

    const newOwnerMembership = await getTeamMembership(ctx, args.teamId, args.newOwnerId);
    if (!newOwnerMembership || newOwnerMembership.status !== "active") {
      return { success: false, error: "New owner must be an active team member" };
    }

    await ctx.db.patch(ownerMembership._id, { role: "admin" });
    await ctx.db.patch(newOwnerMembership._id, { role: "owner" });
    await ctx.db.patch(args.teamId, {
      ownerUserId: args.newOwnerId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * List all members of a team
 */
export const listMembers = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
  },
  returns: v.array(
    v.object({
      memberId: v.id("teamMembers"),
      userId: v.id("users"),
      email: v.string(),
      name: v.optional(v.string()),
      role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
      status: v.string(),
      joinedAt: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const membership = await getTeamMembership(ctx, args.teamId, user._id);
    if (!membership || membership.status !== "active") return [];

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const result = [];
    for (const member of members) {
      const memberUser = await ctx.db.get(member.userId);
      if (!memberUser) continue;

      result.push({
        memberId: member._id,
        userId: member.userId,
        email: memberUser.email,
        name: memberUser.name,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      });
    }

    return result;
  },
});

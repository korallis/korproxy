import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserFromToken, requireTeamRole } from "./lib/rbac";

/**
 * Update a member's role (owner/admin only)
 */
export const updateRole = mutation({
  args: {
    token: v.string(),
    memberId: v.id("teamMembers"),
    role: v.union(v.literal("admin"), v.literal("member")),
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

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    if (targetMember.status !== "active") {
      return { success: false, error: "Member is not active" };
    }

    if (targetMember.role === "owner") {
      return { success: false, error: "Cannot change owner's role. Use transfer ownership instead." };
    }

    const callerMembership = await requireTeamRole(ctx, targetMember.teamId, user._id, "admin");
    if (!callerMembership) {
      return { success: false, error: "Must be admin or owner to change roles" };
    }

    if (callerMembership.role !== "owner" && targetMember.role === "admin") {
      return { success: false, error: "Only owner can demote admins" };
    }

    if (callerMembership.role !== "owner" && args.role === "admin") {
      return { success: false, error: "Only owner can promote to admin" };
    }

    await ctx.db.patch(args.memberId, { role: args.role });

    return { success: true };
  },
});

/**
 * Remove a member from the team
 */
export const remove = mutation({
  args: {
    token: v.string(),
    memberId: v.id("teamMembers"),
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

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    if (targetMember.status !== "active") {
      return { success: false, error: "Member is not active" };
    }

    if (targetMember.role === "owner") {
      return { success: false, error: "Cannot remove the owner. Transfer ownership first." };
    }

    const team = await ctx.db.get(targetMember.teamId);
    if (!team) {
      return { success: false, error: "Team not found" };
    }

    const isSelfRemove = targetMember.userId === user._id;

    if (!isSelfRemove) {
      const callerMembership = await requireTeamRole(ctx, targetMember.teamId, user._id, "admin");
      if (!callerMembership) {
        return { success: false, error: "Must be admin or owner to remove members" };
      }

      if (callerMembership.role !== "owner" && targetMember.role === "admin") {
        return { success: false, error: "Only owner can remove admins" };
      }
    }

    await ctx.db.patch(args.memberId, {
      status: "removed",
      removedAt: Date.now(),
    });

    await ctx.db.patch(targetMember.teamId, {
      seatsUsed: Math.max(0, team.seatsUsed - 1),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

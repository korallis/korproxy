import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserFromToken,
  requireTeamRole,
  generateSecureToken,
  getInviteExpiration,
  getTeamMembership,
} from "./lib/rbac";

/**
 * Create a new team invite
 */
export const create = mutation({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  returns: v.object({
    success: v.boolean(),
    inviteId: v.optional(v.id("teamInvites")),
    inviteToken: v.optional(v.string()),
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
      return { success: false, error: "Only the team owner can invite members" };
    }

    const email = args.email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    if (team.seatsUsed >= team.seatsPurchased) {
      return { success: false, error: "No available seats. Please purchase more seats." };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      const existingMembership = await getTeamMembership(ctx, args.teamId, existingUser._id);
      if (existingMembership && existingMembership.status === "active") {
        return { success: false, error: "User is already a team member" };
      }
    }

    const existingInvite = await ctx.db
      .query("teamInvites")
      .withIndex("by_email", (q) => q.eq("invitedEmail", email))
      .filter((q) =>
        q.and(
          q.eq(q.field("teamId"), args.teamId),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();

    if (existingInvite) {
      return { success: false, error: "An invite for this email is already pending" };
    }

    const inviteToken = generateSecureToken();
    const inviteId = await ctx.db.insert("teamInvites", {
      teamId: args.teamId,
      invitedEmail: email,
      inviterUserId: user._id,
      role: args.role,
      status: "pending",
      token: inviteToken,
      expiresAt: getInviteExpiration(),
      createdAt: Date.now(),
    });

    return { success: true, inviteId, inviteToken };
  },
});

/**
 * Accept a team invite using the invite token
 */
export const accept = mutation({
  args: {
    token: v.string(),
    inviteToken: v.string(),
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

    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_token", (q) => q.eq("token", args.inviteToken))
      .first();

    if (!invite) {
      return { success: false, error: "Invalid invite token" };
    }

    if (invite.status !== "pending") {
      return { success: false, error: `Invite has been ${invite.status}` };
    }

    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: "expired" });
      return { success: false, error: "Invite has expired" };
    }

    if (invite.invitedEmail !== user.email) {
      return { success: false, error: "This invite was sent to a different email address" };
    }

    const team = await ctx.db.get(invite.teamId);
    if (!team) {
      return { success: false, error: "Team no longer exists" };
    }

    const existingMembership = await getTeamMembership(ctx, invite.teamId, user._id);
    if (existingMembership && existingMembership.status === "active") {
      await ctx.db.patch(invite._id, { status: "accepted" });
      return { success: false, error: "You are already a member of this team" };
    }

    if (team.seatsUsed >= team.seatsPurchased) {
      return { success: false, error: "No available seats. Please ask the team owner to purchase more seats." };
    }

    if (existingMembership && existingMembership.status === "removed") {
      await ctx.db.patch(existingMembership._id, {
        role: invite.role,
        status: "active",
        joinedAt: Date.now(),
        removedAt: undefined,
      });
    } else {
      await ctx.db.insert("teamMembers", {
        teamId: invite.teamId,
        userId: user._id,
        role: invite.role,
        status: "active",
        joinedAt: Date.now(),
      });
    }

    await ctx.db.patch(invite.teamId, {
      seatsUsed: team.seatsUsed + 1,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(invite._id, { status: "accepted" });

    return { success: true, teamId: invite.teamId };
  },
});

/**
 * Revoke a pending invite
 */
export const revoke = mutation({
  args: {
    token: v.string(),
    inviteId: v.id("teamInvites"),
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

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.status !== "pending") {
      return { success: false, error: "Can only revoke pending invites" };
    }

    const membership = await requireTeamRole(ctx, invite.teamId, user._id, "owner");
    if (!membership) {
      return { success: false, error: "Only the team owner can revoke invites" };
    }

    await ctx.db.patch(args.inviteId, { status: "revoked" });

    return { success: true };
  },
});

/**
 * Resend an invite - reset expiry and regenerate token
 */
export const resend = mutation({
  args: {
    token: v.string(),
    inviteId: v.id("teamInvites"),
  },
  returns: v.object({
    success: v.boolean(),
    newToken: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.status !== "pending" && invite.status !== "expired") {
      return { success: false, error: "Can only resend pending or expired invites" };
    }

    const membership = await requireTeamRole(ctx, invite.teamId, user._id, "owner");
    if (!membership) {
      return { success: false, error: "Only the team owner can resend invites" };
    }

    const newToken = generateSecureToken();
    await ctx.db.patch(args.inviteId, {
      token: newToken,
      status: "pending",
      expiresAt: getInviteExpiration(),
    });

    return { success: true, newToken };
  },
});

/**
 * List pending invites for a team
 */
export const listForTeam = query({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
  },
  returns: v.array(
    v.object({
      id: v.id("teamInvites"),
      email: v.string(),
      role: v.union(v.literal("admin"), v.literal("member")),
      status: v.string(),
      inviterEmail: v.string(),
      expiresAt: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return [];

    const membership = await requireTeamRole(ctx, args.teamId, user._id, "owner");
    if (!membership) return [];

    const invites = await ctx.db
      .query("teamInvites")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const result = [];
    for (const invite of invites) {
      const inviter = await ctx.db.get(invite.inviterUserId);
      result.push({
        id: invite._id,
        email: invite.invitedEmail,
        role: invite.role,
        status: invite.status,
        inviterEmail: inviter?.email ?? "Unknown",
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
      });
    }

    return result;
  },
});

/**
 * Get invite details by token (for accept page - no auth required)
 */
export const getByToken = query({
  args: {
    inviteToken: v.string(),
  },
  returns: v.union(
    v.object({
      teamName: v.string(),
      invitedEmail: v.string(),
      role: v.union(v.literal("admin"), v.literal("member")),
      status: v.string(),
      expiresAt: v.number(),
      isExpired: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("teamInvites")
      .withIndex("by_token", (q) => q.eq("token", args.inviteToken))
      .first();

    if (!invite) return null;

    const team = await ctx.db.get(invite.teamId);
    if (!team) return null;

    return {
      teamName: team.name,
      invitedEmail: invite.invitedEmail,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      isExpired: invite.expiresAt < Date.now(),
    };
  },
});

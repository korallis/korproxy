import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type TeamRole = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<TeamRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Check if a role has at least the required permission level
 */
export function hasPermission(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get user from session token
 */
export async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  return await ctx.db.get(session.userId);
}

/**
 * Get a user's membership in a team
 */
export async function getTeamMembership(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">
) {
  return await ctx.db
    .query("teamMembers")
    .withIndex("by_team_user", (q) => q.eq("teamId", teamId).eq("userId", userId))
    .first();
}

/**
 * Check if user has required role in team
 * Returns the membership if authorized, null otherwise
 */
export async function requireTeamRole(
  ctx: QueryCtx | MutationCtx,
  teamId: Id<"teams">,
  userId: Id<"users">,
  requiredRole: TeamRole
) {
  const membership = await getTeamMembership(ctx, teamId, userId);
  
  if (!membership || membership.status !== "active") {
    return null;
  }

  if (!hasPermission(membership.role, requiredRole)) {
    return null;
  }

  return membership;
}

/**
 * Generate a secure random token (32 bytes hex)
 */
export function generateSecureToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Invite expiration: 7 days from now
 */
export function getInviteExpiration(): number {
  return Date.now() + 7 * 24 * 60 * 60 * 1000;
}

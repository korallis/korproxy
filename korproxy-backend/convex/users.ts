import { v } from "convex/values";
import { mutation, QueryCtx, MutationCtx } from "./_generated/server";

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

const utmValidator = v.object({
  source: v.optional(v.string()),
  medium: v.optional(v.string()),
  campaign: v.optional(v.string()),
});

export const setAcquisitionSource = mutation({
  args: {
    token: v.string(),
    acquisitionSource: v.optional(v.string()),
    acquisitionUtm: v.optional(utmValidator),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) {
      return { success: false, error: "Invalid or expired session" };
    }

    await ctx.db.patch(user._id, {
      acquisitionSource: args.acquisitionSource,
      acquisitionUtm: args.acquisitionUtm,
      acquisitionDate: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";

async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

const categoryValidator = v.union(v.literal("bug"), v.literal("feature"), v.literal("general"));
const statusValidator = v.union(v.literal("new"), v.literal("reviewed"), v.literal("resolved"), v.literal("closed"));

const logEntryValidator = v.object({
  level: v.string(),
  message: v.string(),
  timestamp: v.number(),
});

const contextValidator = v.object({
  provider: v.optional(v.string()),
  model: v.optional(v.string()),
  appVersion: v.string(),
  platform: v.string(),
  os: v.string(),
});

const feedbackValidator = v.object({
  _id: v.id("feedback"),
  _creationTime: v.number(),
  userId: v.optional(v.id("users")),
  category: categoryValidator,
  message: v.string(),
  contactEmail: v.optional(v.string()),
  includesDiagnostics: v.boolean(),
  logExcerpt: v.optional(v.array(logEntryValidator)),
  context: v.optional(contextValidator),
  status: statusValidator,
  createdAt: v.number(),
});

export const submit = mutation({
  args: {
    token: v.optional(v.string()),
    category: categoryValidator,
    message: v.string(),
    contactEmail: v.optional(v.string()),
    includesDiagnostics: v.boolean(),
    logExcerpt: v.optional(v.array(logEntryValidator)),
    context: v.optional(contextValidator),
  },
  returns: v.object({
    success: v.boolean(),
    feedbackId: v.optional(v.id("feedback")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    let userId = undefined;
    
    if (args.token) {
      const user = await getUserFromToken(ctx, args.token);
      if (user) {
        userId = user._id;
      }
    }

    if (!args.message.trim()) {
      return { success: false, error: "Message is required" };
    }

    const feedbackId = await ctx.db.insert("feedback", {
      userId,
      category: args.category,
      message: args.message.trim(),
      contactEmail: args.contactEmail,
      includesDiagnostics: args.includesDiagnostics,
      logExcerpt: args.logExcerpt,
      context: args.context,
      status: "new",
      createdAt: Date.now(),
    });

    return { success: true, feedbackId };
  },
});

export const list = query({
  args: {
    token: v.string(),
    status: v.optional(statusValidator),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("feedback")),
  },
  returns: v.object({
    feedback: v.array(feedbackValidator),
    nextCursor: v.optional(v.id("feedback")),
  }),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") {
      return { feedback: [] };
    }

    const limit = args.limit ?? 20;
    
    let feedbackQuery;
    if (args.status) {
      feedbackQuery = ctx.db
        .query("feedback")
        .withIndex("by_status", (q) => q.eq("status", args.status!));
    } else {
      feedbackQuery = ctx.db
        .query("feedback")
        .withIndex("by_date");
    }

    const results = await feedbackQuery
      .order("desc")
      .take(limit + 1);

    const hasMore = results.length > limit;
    const feedback = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore ? feedback[feedback.length - 1]._id : undefined;

    return { feedback, nextCursor };
  },
});

export const get = query({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
  },
  returns: v.union(feedbackValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user || user.role !== "admin") {
      return null;
    }

    return await ctx.db.get(args.feedbackId);
  },
});

export const updateStatus = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
    status: statusValidator,
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

    if (user.role !== "admin") {
      return { success: false, error: "Not authorized" };
    }

    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return { success: false, error: "Feedback not found" };
    }

    await ctx.db.patch(args.feedbackId, {
      status: args.status,
    });

    return { success: true };
  },
});

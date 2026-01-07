import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";

function optionalFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Helper to get user from token
 */
async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;
  return await ctx.db.get(session.userId);
}

/**
 * Get subscription status for current user
 */
export const getStatus = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.union(
        v.literal("active"),
        v.literal("trial"),
        v.literal("expired"),
        v.literal("no_subscription"),
        v.literal("past_due"),
        v.literal("lifetime"),
        v.literal("canceled")
      ),
      plan: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
      trialEnd: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      isActive: v.boolean(),
      daysLeft: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    const trialEnd = optionalFiniteNumber(user.trialEnd);
    const currentPeriodEnd = optionalFiniteNumber(user.currentPeriodEnd);

    const now = Date.now();

    // Normalize subscription status for UI
    let status: "active" | "trial" | "expired" | "no_subscription" | "past_due" | "lifetime" | "canceled";
    let isActive = false;
    let daysLeft: number | undefined;

    switch (user.subscriptionStatus) {
      case "lifetime":
        status = "lifetime";
        isActive = true;
        break;
      case "active":
        // Check if actually expired
        if (currentPeriodEnd && currentPeriodEnd < now) {
          status = "expired";
          isActive = false;
        } else {
          status = "active";
          isActive = true;
          if (currentPeriodEnd) {
            daysLeft = Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
          }
        }
        break;
      case "trialing":
        // Check if trial expired
        if (trialEnd && trialEnd < now) {
          status = "expired";
          isActive = false;
        } else {
          status = "trial";
          isActive = true;
          if (trialEnd) {
            daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
          }
        }
        break;
      case "past_due":
        status = "past_due";
        isActive = false;
        break;
      case "canceled":
        // Canceled but might still have access until period end
        if (currentPeriodEnd && currentPeriodEnd > now) {
          status = "canceled";
          isActive = true;
          daysLeft = Math.ceil((currentPeriodEnd - now) / (1000 * 60 * 60 * 24));
        } else {
          status = "expired";
          isActive = false;
        }
        break;
      case "expired":
        status = "expired";
        isActive = false;
        break;
      default:
        status = "no_subscription";
        isActive = false;
    }

    return {
      status,
      plan: user.subscriptionPlan,
      trialEnd,
      currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      isActive,
      daysLeft,
    };
  },
});

/**
 * Update subscription status (called by Stripe webhook handler)
 */
export const updateSubscription = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("none"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired")
    ),
    plan: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    trialEnd: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { success: false };

    const trialEnd = typeof args.trialEnd === "number" && Number.isFinite(args.trialEnd) ? args.trialEnd : undefined;
    const currentPeriodEnd =
      typeof args.currentPeriodEnd === "number" && Number.isFinite(args.currentPeriodEnd)
        ? args.currentPeriodEnd
        : undefined;

    // Don't modify lifetime users
    if (user.subscriptionStatus === "lifetime") {
      return { success: true };
    }

    const previousStatus = user.subscriptionStatus;

    // Update user
    await ctx.db.patch(args.userId, {
      subscriptionStatus: args.status,
      subscriptionPlan: args.plan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      trialEnd,
      currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      updatedAt: Date.now(),
    });

    // Log subscription event
    await ctx.db.insert("subscriptionEvents", {
      userId: args.userId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      eventType: "subscription_updated",
      fromStatus: previousStatus,
      toStatus: args.status,
      plan: args.plan,
      occurredAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Set Stripe customer ID for a user
 */
export const setStripeCustomerId = mutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Get user by Stripe customer ID (for webhook processing)
 */
export const getUserByStripeCustomer = query({
  args: {
    stripeCustomerId: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.id("users"),
      email: v.string(),
      subscriptionStatus: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      subscriptionStatus: user.subscriptionStatus,
    };
  },
});

/**
 * Get user by email (for Stripe checkout session creation)
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.id("users"),
      email: v.string(),
      stripeCustomerId: v.optional(v.string()),
      subscriptionStatus: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionStatus: user.subscriptionStatus,
    };
  },
});

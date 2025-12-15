import { v } from "convex/values";
import { query, mutation, QueryCtx } from "./_generated/server";
import { hashPassword } from "./lib/password";

// Pricing in GBP (pence for calculations)
const MONTHLY_PRICE = 1499; // £14.99
const YEARLY_PRICE = 12000; // £120.00

// Master admin email
const MASTER_ADMIN_EMAIL = "leebarry84@icloud.com";

/**
 * Helper to verify admin access
 */
async function verifyAdmin(ctx: QueryCtx, token: string): Promise<boolean> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return false;

  const user = await ctx.db.get(session.userId);
  return user?.role === "admin";
}

/**
 * List all users (admin only)
 */
export const listUsers = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      users: v.array(
        v.object({
          id: v.string(),
          email: v.string(),
          name: v.optional(v.string()),
          role: v.string(),
          subscriptionStatus: v.string(),
          subscriptionPlan: v.optional(v.string()),
          currentPeriodEnd: v.optional(v.number()),
          createdAt: v.number(),
        })
      ),
      total: v.number(),
    }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx, args.token);
    if (!isAdmin) {
      return { error: "Unauthorized - admin access required" };
    }

    const allUsers = await ctx.db.query("users").collect();
    const total = allUsers.length;

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers.map((user) => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan,
        currentPeriodEnd: user.currentPeriodEnd,
        createdAt: user.createdAt,
      })),
      total,
    };
  },
});

/**
 * Get dashboard metrics (admin only)
 */
export const getMetrics = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      totalUsers: v.number(),
      activeSubscriptions: v.number(),
      trialUsers: v.number(),
      expiredUsers: v.number(),
      lifetimeUsers: v.number(),
      monthlyMRR: v.number(), // In GBP (pence)
      annualizedRevenue: v.number(), // In GBP (pence)
      monthlySubscribers: v.number(),
      yearlySubscribers: v.number(),
    }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx, args.token);
    if (!isAdmin) {
      return { error: "Unauthorized - admin access required" };
    }

    const users = await ctx.db.query("users").collect();

    let activeSubscriptions = 0;
    let trialUsers = 0;
    let expiredUsers = 0;
    let lifetimeUsers = 0;
    let monthlySubscribers = 0;
    let yearlySubscribers = 0;

    const now = Date.now();

    for (const user of users) {
      switch (user.subscriptionStatus) {
        case "lifetime":
          lifetimeUsers++;
          break;
        case "active":
          // Check if actually still active
          if (!user.currentPeriodEnd || user.currentPeriodEnd > now) {
            activeSubscriptions++;
            if (user.subscriptionPlan === "monthly") {
              monthlySubscribers++;
            } else if (user.subscriptionPlan === "yearly") {
              yearlySubscribers++;
            }
          } else {
            expiredUsers++;
          }
          break;
        case "trialing":
          if (!user.trialEnd || user.trialEnd > now) {
            trialUsers++;
          } else {
            expiredUsers++;
          }
          break;
        case "canceled":
          // Canceled but might still have access
          if (user.currentPeriodEnd && user.currentPeriodEnd > now) {
            activeSubscriptions++;
            if (user.subscriptionPlan === "monthly") {
              monthlySubscribers++;
            } else if (user.subscriptionPlan === "yearly") {
              yearlySubscribers++;
            }
          } else {
            expiredUsers++;
          }
          break;
        case "expired":
        case "past_due":
          expiredUsers++;
          break;
      }
    }

    // Calculate MRR (Monthly Recurring Revenue)
    // Monthly subs contribute full price, yearly subs contribute 1/12
    const monthlyMRR = (monthlySubscribers * MONTHLY_PRICE) + 
                       Math.round(yearlySubscribers * YEARLY_PRICE / 12);

    // Annualized revenue
    const annualizedRevenue = (monthlySubscribers * MONTHLY_PRICE * 12) + 
                              (yearlySubscribers * YEARLY_PRICE);

    return {
      totalUsers: users.length,
      activeSubscriptions,
      trialUsers,
      expiredUsers,
      lifetimeUsers,
      monthlyMRR,
      annualizedRevenue,
      monthlySubscribers,
      yearlySubscribers,
    };
  },
});

/**
 * Get recent subscription events (admin only)
 */
export const getRecentEvents = query({
  args: {
    token: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      events: v.array(
        v.object({
          id: v.string(),
          userId: v.string(),
          userEmail: v.optional(v.string()),
          eventType: v.string(),
          fromStatus: v.optional(v.string()),
          toStatus: v.string(),
          plan: v.optional(v.string()),
          occurredAt: v.number(),
        })
      ),
    }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx, args.token);
    if (!isAdmin) {
      return { error: "Unauthorized - admin access required" };
    }

    const limit = args.limit ?? 20;
    const events = await ctx.db
      .query("subscriptionEvents")
      .order("desc")
      .take(limit);

    // Get user emails for events
    const eventsWithEmail = await Promise.all(
      events.map(async (event) => {
        const user = await ctx.db.get(event.userId);
        return {
          id: event._id,
          userId: event.userId,
          userEmail: user?.email,
          eventType: event.eventType,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          plan: event.plan,
          occurredAt: event.occurredAt,
        };
      })
    );

    return { events: eventsWithEmail };
  },
});

/**
 * Grant lifetime access to a user by email (admin only via secret key)
 * Creates the user if they don't exist
 */
export const grantLifetimeAccess = mutation({
  args: {
    secretKey: v.string(),
    email: v.string(),
  },
  returns: v.union(
    v.object({ success: v.boolean(), message: v.string() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    if (args.secretKey !== "korproxy-admin-bootstrap-2024") {
      return { error: "Invalid secret key" };
    }

    const normalizedEmail = args.email.toLowerCase().trim();
    
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      // Create user with lifetime access - they can set password via "forgot password" later
      const userId = await ctx.db.insert("users", {
        email: normalizedEmail,
        passwordHash: "", // Empty - user needs to reset password
        role: "user",
        subscriptionStatus: "lifetime",
        createdAt: Date.now(),
      });

      // Log the event
      await ctx.db.insert("subscriptionEvents", {
        userId,
        eventType: "lifetime_granted",
        fromStatus: "none",
        toStatus: "lifetime",
        occurredAt: Date.now(),
      });

      return { 
        success: true, 
        message: `Created user ${normalizedEmail} with lifetime access. User needs to set password via forgot password flow.` 
      };
    }

    const previousStatus = user.subscriptionStatus;
    
    await ctx.db.patch(user._id, {
      subscriptionStatus: "lifetime",
      currentPeriodEnd: undefined,
      cancelAtPeriodEnd: false,
      updatedAt: Date.now(),
    });

    // Log the event
    await ctx.db.insert("subscriptionEvents", {
      userId: user._id,
      eventType: "lifetime_granted",
      fromStatus: previousStatus,
      toStatus: "lifetime",
      occurredAt: Date.now(),
    });

    return { 
      success: true, 
      message: `User ${normalizedEmail} granted lifetime access` 
    };
  },
});

/**
 * Bootstrap admin user - upgrades master admin email to admin role with lifetime access
 * This is safe to call multiple times - only affects the master admin email
 */
export const bootstrapAdmin = mutation({
  args: {
    secretKey: v.string(), // Simple protection - must match to execute
  },
  returns: v.union(
    v.object({ success: v.boolean(), message: v.string() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    // Simple secret key check (change this in production or use env var)
    if (args.secretKey !== "korproxy-admin-bootstrap-2024") {
      return { error: "Invalid secret key" };
    }

    // Find the master admin user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), MASTER_ADMIN_EMAIL))
      .first();

    if (!user) {
      return { error: `User ${MASTER_ADMIN_EMAIL} not found. Please register first.` };
    }

    // Update to admin with lifetime access
    await ctx.db.patch(user._id, {
      role: "admin",
      subscriptionStatus: "lifetime",
    });

    return { 
      success: true, 
      message: `User ${MASTER_ADMIN_EMAIL} upgraded to admin with lifetime access` 
    };
  },
});

/**
 * Reset a user's password (admin only via secret key)
 */
export const resetUserPassword = mutation({
  args: {
    secretKey: v.string(),
    email: v.string(),
    newPassword: v.string(),
  },
  returns: v.union(
    v.object({ success: v.boolean(), message: v.string() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    if (args.secretKey !== "korproxy-admin-bootstrap-2024") {
      return { error: "Invalid secret key" };
    }

    if (args.newPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }

    const normalizedEmail = args.email.toLowerCase().trim();
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (!user) {
      return { error: `User ${normalizedEmail} not found` };
    }

    const passwordHash = await hashPassword(args.newPassword);
    
    await ctx.db.patch(user._id, {
      passwordHash,
      updatedAt: Date.now(),
    });

    return { 
      success: true, 
      message: `Password reset for ${normalizedEmail}` 
    };
  },
});

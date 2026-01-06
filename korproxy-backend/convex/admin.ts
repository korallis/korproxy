import { v } from "convex/values";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { hashPassword } from "./lib/password";
import { Id } from "./_generated/dataModel";

// Pricing in GBP (pence for calculations)
const MONTHLY_PRICE = 1499; // £14.99
const YEARLY_PRICE = 12000; // £120.00

// Master admin email
const MASTER_ADMIN_EMAIL = "leebarry84@icloud.com";

// Default safe mode fallback provider
const SAFE_MODE_DEFAULT_PROVIDER = "claude-haiku";

/**
 * Helper to verify admin access
 */
async function verifyAdmin(ctx: QueryCtx | MutationCtx, token: string): Promise<boolean> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return false;

  const user = await ctx.db.get(session.userId);
  return user?.role === "admin";
}

/**
 * Helper to get admin user ID from token
 */
async function getAdminId(ctx: QueryCtx | MutationCtx, token: string): Promise<Id<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session || session.expiresAt < Date.now()) return null;

  const user = await ctx.db.get(session.userId);
  if (!user || user.role !== "admin") return null;

  return user._id;
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

// ============================================================================
// Feature Flags & Safe Mode Functions
// ============================================================================

/**
 * Get feature flags for a user (admin only)
 */
export const getFeatureFlags = query({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      flags: v.record(v.string(), v.boolean()),
      safeMode: v.boolean(),
      safeModeProvider: v.string(),
      updatedAt: v.number(),
    }),
    v.object({ error: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx, args.token);
    if (!isAdmin) {
      return { error: "Unauthorized - admin access required" };
    }

    const flags = await ctx.db
      .query("featureFlags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!flags) {
      return null;
    }

    return {
      userId: flags.userId,
      flags: flags.flags,
      safeMode: flags.safeMode,
      safeModeProvider: flags.safeModeProvider,
      updatedAt: flags.updatedAt,
    };
  },
});

/**
 * Set a feature flag for a user (admin only)
 */
export const setFeatureFlag = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    flagName: v.string(),
    value: v.boolean(),
  },
  returns: v.union(
    v.object({ success: v.boolean() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const adminId = await getAdminId(ctx, args.token);
    if (!adminId) {
      return { error: "Unauthorized - admin access required" };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { error: "User not found" };
    }

    const existingFlags = await ctx.db
      .query("featureFlags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existingFlags) {
      const newFlags = { ...existingFlags.flags, [args.flagName]: args.value };
      await ctx.db.patch(existingFlags._id, {
        flags: newFlags,
        updatedBy: adminId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("featureFlags", {
        userId: args.userId,
        flags: { [args.flagName]: args.value },
        safeMode: false,
        safeModeProvider: SAFE_MODE_DEFAULT_PROVIDER,
        updatedBy: adminId,
        updatedAt: now,
      });
    }

    await ctx.db.insert("adminLogs", {
      userId: args.userId,
      adminId,
      action: "set_feature_flag",
      details: `Set flag "${args.flagName}" to ${args.value}`,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Enable safe mode for a user (admin only)
 */
export const enableSafeMode = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    provider: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ success: v.boolean() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const adminId = await getAdminId(ctx, args.token);
    if (!adminId) {
      return { error: "Unauthorized - admin access required" };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { error: "User not found" };
    }

    const provider = args.provider ?? SAFE_MODE_DEFAULT_PROVIDER;
    const now = Date.now();

    const existingFlags = await ctx.db
      .query("featureFlags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingFlags) {
      await ctx.db.patch(existingFlags._id, {
        safeMode: true,
        safeModeProvider: provider,
        updatedBy: adminId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("featureFlags", {
        userId: args.userId,
        flags: {},
        safeMode: true,
        safeModeProvider: provider,
        updatedBy: adminId,
        updatedAt: now,
      });
    }

    await ctx.db.insert("adminLogs", {
      userId: args.userId,
      adminId,
      action: "enable_safe_mode",
      details: `Enabled safe mode with provider: ${provider}`,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Disable safe mode for a user (admin only)
 */
export const disableSafeMode = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({ success: v.boolean() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args) => {
    const adminId = await getAdminId(ctx, args.token);
    if (!adminId) {
      return { error: "Unauthorized - admin access required" };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { error: "User not found" };
    }

    const now = Date.now();

    const existingFlags = await ctx.db
      .query("featureFlags")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingFlags) {
      await ctx.db.patch(existingFlags._id, {
        safeMode: false,
        updatedBy: adminId,
        updatedAt: now,
      });
    }

    await ctx.db.insert("adminLogs", {
      userId: args.userId,
      adminId,
      action: "disable_safe_mode",
      details: "Disabled safe mode",
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Get admin logs for a user (admin only)
 */
export const getAdminLogs = query({
  args: {
    token: v.string(),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      logs: v.array(
        v.object({
          id: v.string(),
          userId: v.string(),
          userEmail: v.optional(v.string()),
          adminId: v.string(),
          adminEmail: v.optional(v.string()),
          action: v.string(),
          details: v.string(),
          timestamp: v.number(),
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

    const rawLimit = args.limit ?? 50;
    const limit = Math.max(1, Math.min(rawLimit, 200));

    let logs: Array<{
      _id: Id<"adminLogs">;
      _creationTime: number;
      userId: Id<"users">;
      adminId: Id<"users">;
      action: string;
      details: string;
      timestamp: number;
    }>;

    try {
      if (args.userId) {
        const userId = args.userId;
        logs = await ctx.db
          .query("adminLogs")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .order("desc")
          .take(limit);
      } else {
        logs = await ctx.db
          .query("adminLogs")
          .order("desc")
          .take(limit);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return { error: `Failed to load admin logs: ${message}` };
    }

    const logsWithEmails = await Promise.all(
      logs.map(async (log) => {
        const userId = typeof log.userId === "string" && log.userId.length > 0 ? (log.userId as Id<"users">) : null;
        const adminId = typeof log.adminId === "string" && log.adminId.length > 0 ? (log.adminId as Id<"users">) : null;

        let userEmail: string | null = null;
        if (userId) {
          try {
            const user = await ctx.db.get(userId);
            userEmail = typeof user?.email === "string" ? user.email : null;
          } catch {
            userEmail = null;
          }
        }

        let adminEmail: string | null = null;
        if (adminId) {
          try {
            const admin = await ctx.db.get(adminId);
            adminEmail = typeof admin?.email === "string" ? admin.email : null;
          } catch {
            adminEmail = null;
          }
        }

        const action = typeof log.action === "string" ? log.action : "unknown";
        const details = typeof log.details === "string" ? log.details : "";
        const timestamp =
          typeof log.timestamp === "number" && Number.isFinite(log.timestamp)
            ? log.timestamp
            : log._creationTime;

        return {
          id: log._id,
          userId: typeof log.userId === "string" ? log.userId : "",
          adminId: typeof log.adminId === "string" ? log.adminId : "",
          action,
          details,
          timestamp,
          ...(userEmail ? { userEmail } : {}),
          ...(adminEmail ? { adminEmail } : {}),
        };
      })
    );

    return { logs: logsWithEmails };
  },
});

/**
 * Get user by ID (admin only) - for detailed user view
 */
export const getUserById = query({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  returns: v.union(
    v.object({
      id: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      role: v.string(),
      subscriptionStatus: v.string(),
      subscriptionPlan: v.optional(v.string()),
      currentPeriodEnd: v.optional(v.number()),
      trialEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
      stripeCustomerId: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.optional(v.number()),
    }),
    v.object({ error: v.string() }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const isAdmin = await verifyAdmin(ctx, args.token);
    if (!isAdmin) {
      return { error: "Unauthorized - admin access required" };
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      currentPeriodEnd: user.currentPeriodEnd,
      trialEnd: user.trialEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
});

/**
 * Search users by email (admin only)
 */
export const searchUsers = query({
  args: {
    token: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
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

    const searchQuery = args.query.toLowerCase().trim();
    const limit = args.limit ?? 20;

    if (searchQuery.length < 2) {
      return { users: [] };
    }

    const allUsers = await ctx.db.query("users").collect();
    
    const matchingUsers = allUsers
      .filter((u) => u.email.toLowerCase().includes(searchQuery))
      .slice(0, limit)
      .map((u) => ({
        id: u._id,
        email: u.email,
        name: u.name,
        role: u.role,
        subscriptionStatus: u.subscriptionStatus,
      }));

    return { users: matchingUsers };
  },
});

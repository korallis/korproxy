import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { hashPassword, verifyPassword, generateToken } from "./lib/password";

// Master admin email - gets unlimited access
const MASTER_ADMIN_EMAIL = "leebarry84@icloud.com";

// Session duration: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Get current user from session token
 */
async function getUserFromToken(ctx: QueryCtx | MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();

  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;

  return await ctx.db.get(session.userId);
}

/**
 * Register a new user
 */
export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    token: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Invalid email format" };
    }

    // Validate password strength
    if (args.password.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      return { success: false, error: "Email already registered" };
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Determine role and subscription status
    const isAdmin = email === MASTER_ADMIN_EMAIL;
    const role = isAdmin ? "admin" : "user";
    const subscriptionStatus = isAdmin ? "lifetime" : "none";

    // Create user
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash,
      role,
      name: args.name,
      subscriptionStatus,
      createdAt: Date.now(),
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { success: true, token };
  },
});

/**
 * Login with email and password
 */
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    token: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(args.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid email or password" };
    }

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { success: true, token };
  },
});

/**
 * Logout - invalidate session
 */
export const logout = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

/**
 * Get current user from token
 */
export const me = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      id: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      role: v.union(v.literal("user"), v.literal("admin")),
      subscriptionStatus: v.string(),
      subscriptionPlan: v.optional(v.string()),
      trialEnd: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getUserFromToken(ctx, args.token);
    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionPlan: user.subscriptionPlan,
      trialEnd: user.trialEnd,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    };
  },
});

/**
 * Validate a session token (for quick auth checks)
 */
export const validateToken = query({
  args: {
    token: v.string(),
  },
  returns: v.object({
    valid: v.boolean(),
    userId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return { valid: false };
    }

    return { valid: true, userId: session.userId };
  },
});

/**
 * Refresh session - extend expiration
 */
export const refreshSession = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    newToken: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return { success: false };
    }

    // Delete old session
    await ctx.db.delete(session._id);

    // Create new session
    const newToken = generateToken();
    await ctx.db.insert("sessions", {
      userId: session.userId,
      token: newToken,
      expiresAt: Date.now() + SESSION_DURATION_MS,
      createdAt: Date.now(),
    });

    return { success: true, newToken };
  },
});

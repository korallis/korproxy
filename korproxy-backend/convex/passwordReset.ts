import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./lib/password";

// Token expiration: 1 hour
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Request a password reset - generates a token for the email
 * Returns success even if email doesn't exist (security: don't reveal valid emails)
 */
export const requestReset = mutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    // In production, don't return the token - send via email instead
    // For now, we return it since we don't have email configured
    token: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      // Don't reveal that the email doesn't exist
      return {
        success: true,
        message: "If an account exists with this email, a reset link has been sent.",
      };
    }

    // Invalidate any existing tokens for this email
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();

    for (const token of existingTokens) {
      await ctx.db.patch(token._id, { used: true });
    }

    // Generate new token
    const token = generateResetToken();
    const now = Date.now();

    await ctx.db.insert("passwordResetTokens", {
      email,
      token,
      expiresAt: now + TOKEN_EXPIRATION_MS,
      used: false,
      createdAt: now,
    });

    // In production, you would send an email here with the reset link
    // For now, we return the token directly (for testing)
    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
      token, // Remove this in production!
    };
  },
});

/**
 * Validate a reset token (for showing the reset form)
 */
export const validateToken = query({
  args: {
    token: v.string(),
  },
  returns: v.object({
    valid: v.boolean(),
    email: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      return { valid: false, error: "Invalid or expired reset link" };
    }

    if (resetToken.used) {
      return { valid: false, error: "This reset link has already been used" };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { valid: false, error: "This reset link has expired" };
    }

    return { valid: true, email: resetToken.email };
  },
});

/**
 * Reset password using a valid token
 */
export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Validate password strength
    if (args.newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    // Find the token
    const resetToken = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken) {
      return { success: false, error: "Invalid or expired reset link" };
    }

    if (resetToken.used) {
      return { success: false, error: "This reset link has already been used" };
    }

    if (resetToken.expiresAt < Date.now()) {
      return { success: false, error: "This reset link has expired" };
    }

    // Find the user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", resetToken.email))
      .first();

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Hash the new password
    const passwordHash = await hashPassword(args.newPassword);

    // Update user's password
    await ctx.db.patch(user._id, {
      passwordHash,
      updatedAt: Date.now(),
    });

    // Mark token as used
    await ctx.db.patch(resetToken._id, { used: true });

    return { success: true };
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - stores user accounts
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    name: v.optional(v.string()),
    
    // Stripe integration
    stripeCustomerId: v.optional(v.string()),
    
    // Subscription status
    subscriptionStatus: v.union(
      v.literal("none"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired"),
      v.literal("lifetime")
    ),
    subscriptionPlan: v.optional(v.union(v.literal("monthly"), v.literal("yearly"))),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    
    // Subscription dates (Unix timestamps in ms)
    trialEnd: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_subscription_status", ["subscriptionStatus"]),

  // Sessions table - stores active login sessions
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"])
    .index("by_expiry", ["expiresAt"]),

  // Subscription events - for analytics and audit trail
  subscriptionEvents: defineTable({
    userId: v.id("users"),
    stripeSubscriptionId: v.optional(v.string()),
    eventType: v.string(),
    fromStatus: v.optional(v.string()),
    toStatus: v.string(),
    plan: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    occurredAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["occurredAt"]),

  // Teams table - stores team accounts for seat-based billing
  teams: defineTable({
    name: v.string(),
    ownerUserId: v.id("users"),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    subscriptionStatus: v.union(
      v.literal("none"),
      v.literal("trialing"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("expired")
    ),
    seatsPurchased: v.number(),
    seatsUsed: v.number(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_stripe_customer", ["stripeCustomerId"]),

  // Team members table - links users to teams with roles
  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("removed")),
    joinedAt: v.optional(v.number()),
    removedAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"]),

  // Team invites table - pending invitations
  teamInvites: defineTable({
    teamId: v.id("teams"),
    invitedEmail: v.string(),
    inviterUserId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_token", ["token"])
    .index("by_email", ["invitedEmail"]),

  // Devices table - registered user devices for multi-device sync
  devices: defineTable({
    userId: v.id("users"),
    deviceId: v.string(),
    deviceName: v.string(),
    deviceType: v.union(v.literal("desktop"), v.literal("laptop"), v.literal("other")),
    platform: v.union(v.literal("darwin"), v.literal("win32"), v.literal("linux")),
    appVersion: v.string(),
    lastSeenAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_device_id", ["deviceId"]),
});

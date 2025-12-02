import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import Stripe from "stripe";

// Stripe price IDs (set these in Stripe dashboard)
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

// Trial period in days
const TRIAL_DAYS = 7;

function getStripeClient(): Stripe {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(stripeSecretKey);
}

/**
 * Create a Stripe Checkout session for subscription
 */
export const createCheckoutSession = action({
  args: {
    token: v.string(),
    plan: v.union(v.literal("monthly"), v.literal("yearly")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.union(
    v.object({ url: v.string() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args): Promise<{ url: string } | { error: string }> => {
    try {
      const stripe = getStripeClient();

      // Validate session and get user
      const userSession = await ctx.runQuery(internal.stripe.getSessionUser, { token: args.token });
      if (!userSession) {
        return { error: "Invalid session" };
      }

      const priceId = PRICE_IDS[args.plan];
      if (!priceId) {
        return { error: `Price not configured for plan: ${args.plan}` };
      }

      // Create or get Stripe customer
      let customerId: string | undefined = userSession.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: userSession.email,
          metadata: {
            convexUserId: userSession.userId,
          },
        });
        customerId = customer.id;

        // Save customer ID to user
        await ctx.runMutation(internal.stripe.setCustomerId, {
          userId: userSession.userId as Id<"users">,
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: TRIAL_DAYS,
          metadata: {
            convexUserId: userSession.userId,
            plan: args.plan,
          },
        },
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        metadata: {
          convexUserId: userSession.userId,
          plan: args.plan,
        },
      });

      return { url: checkoutSession.url || "" };
    } catch (error) {
      console.error("Stripe checkout error:", error);
      return { error: error instanceof Error ? error.message : "Failed to create checkout session" };
    }
  },
});

/**
 * Create a Stripe Customer Portal session for managing subscription
 */
export const createPortalSession = action({
  args: {
    token: v.string(),
    returnUrl: v.string(),
  },
  returns: v.union(
    v.object({ url: v.string() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args): Promise<{ url: string } | { error: string }> => {
    try {
      const stripe = getStripeClient();

      const userSession = await ctx.runQuery(internal.stripe.getSessionUser, { token: args.token });
      if (!userSession || !userSession.stripeCustomerId) {
        return { error: "No subscription found" };
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: userSession.stripeCustomerId,
        return_url: args.returnUrl,
      });

      return { url: portalSession.url };
    } catch (error) {
      console.error("Portal session error:", error);
      return { error: error instanceof Error ? error.message : "Failed to create portal session" };
    }
  },
});

/**
 * Handle Stripe webhook events
 */
export const handleWebhook = internalAction({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { success: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
    }

    let stripe: Stripe;
    try {
      stripe = getStripeClient();
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Stripe not configured" };
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(args.payload, args.signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return { success: false, error: "Invalid signature" };
    }

    console.log(`Processing Stripe event: ${event.type}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(ctx, stripe, session);
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdate(ctx, stripe, subscription);
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(ctx, subscription);
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await handleSubscriptionUpdate(ctx, stripe, subscription);
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            await handlePaymentFailed(ctx, invoice);
          }
          break;
        }

        case "customer.subscription.trial_will_end": {
          console.log("Trial ending soon for subscription:", (event.data.object as Stripe.Subscription).id);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error processing webhook:", error);
      return { success: false, error: error instanceof Error ? error.message : "Processing failed" };
    }
  },
});

// Helper type for context
import type { ActionCtx } from "./_generated/server";
type ActionContext = ActionCtx;

/**
 * Handle checkout.session.completed - this fires when checkout is complete
 * The subscription may or may not be active yet (especially with trials)
 */
async function handleCheckoutCompleted(
  ctx: ActionContext,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log("Handling checkout.session.completed:", session.id);
  
  // Get customer ID
  const customerId = session.customer as string;
  if (!customerId) {
    console.error("No customer ID in checkout session");
    return;
  }

  // Try to get user by customer ID first
  let user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  
  // If not found, try to get user from session metadata
  if (!user && session.metadata?.convexUserId) {
    const userId = session.metadata.convexUserId as Id<"users">;
    // Set the customer ID for this user
    await ctx.runMutation(internal.stripe.setCustomerId, {
      userId,
      stripeCustomerId: customerId,
    });
    user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  }

  if (!user) {
    console.error("User not found for checkout session:", session.id);
    return;
  }

  // If there's a subscription, fetch it and update the user
  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(ctx, stripe, subscription);
  } else {
    console.log("No subscription in checkout session - may be a one-time payment");
  }
}

/**
 * Handle subscription creation/update
 */
async function handleSubscriptionUpdate(
  ctx: ActionContext,
  _stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;
  
  // Get user by Stripe customer ID
  const user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Determine status
  let status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  switch (subscription.status) {
    case "trialing":
      status = "trialing";
      break;
    case "active":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
    case "unpaid":
      status = "canceled";
      break;
    default:
      status = "expired";
  }

  // Get plan from price
  const priceId = subscription.items.data[0]?.price.id;
  let plan: "monthly" | "yearly" | undefined;
  if (priceId === PRICE_IDS.monthly) {
    plan = "monthly";
  } else if (priceId === PRICE_IDS.yearly) {
    plan = "yearly";
  }

  await ctx.runMutation(internal.stripe.updateUserSubscription, {
    userId: user.id,
    status,
    plan,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    trialEnd: subscription.trial_end ? subscription.trial_end * 1000 : undefined,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

/**
 * Handle subscription deletion
 */
async function handleSubscriptionDeleted(
  ctx: ActionContext,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;
  
  const user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await ctx.runMutation(internal.stripe.updateUserSubscription, {
    userId: user.id,
    status: "expired",
    plan: undefined,
    stripeSubscriptionId: undefined,
    stripePriceId: undefined,
    trialEnd: undefined,
    currentPeriodEnd: undefined,
    cancelAtPeriodEnd: undefined,
  });
}

/**
 * Handle payment failure
 */
async function handlePaymentFailed(
  ctx: ActionContext,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  
  const user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  await ctx.runMutation(internal.stripe.updateUserSubscription, {
    userId: user.id,
    status: "past_due",
    plan: user.subscriptionPlan as "monthly" | "yearly" | undefined,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripePriceId: user.stripePriceId,
    trialEnd: user.trialEnd,
    currentPeriodEnd: user.currentPeriodEnd,
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
  });
}

// ============================================
// Internal functions (not exposed to clients)
// ============================================

/**
 * Get session user info for checkout
 */
export const getSessionUser = internalQuery({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      userId: v.string(),
      email: v.string(),
      stripeCustomerId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      userId: user._id,
      email: user.email,
      stripeCustomerId: user.stripeCustomerId,
    };
  },
});

/**
 * Get user by Stripe customer ID
 */
export const getUserByCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  returns: v.union(
    v.object({
      id: v.id("users"),
      email: v.string(),
      subscriptionStatus: v.string(),
      subscriptionPlan: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      stripePriceId: v.optional(v.string()),
      trialEnd: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
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
      subscriptionPlan: user.subscriptionPlan,
      stripeSubscriptionId: user.stripeSubscriptionId,
      stripePriceId: user.stripePriceId,
      trialEnd: user.trialEnd,
      currentPeriodEnd: user.currentPeriodEnd,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    };
  },
});

/**
 * Set Stripe customer ID for user
 */
export const setCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Update user subscription status
 */
export const updateUserSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Don't modify lifetime users
    if (user.subscriptionStatus === "lifetime") return null;

    const previousStatus = user.subscriptionStatus;

    await ctx.db.patch(args.userId, {
      subscriptionStatus: args.status,
      subscriptionPlan: args.plan,
      stripeSubscriptionId: args.stripeSubscriptionId,
      stripePriceId: args.stripePriceId,
      trialEnd: args.trialEnd,
      currentPeriodEnd: args.currentPeriodEnd,
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

    return null;
  },
});

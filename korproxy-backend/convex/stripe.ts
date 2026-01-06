import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import Stripe from "stripe";

// Stripe price IDs (set these in Stripe dashboard)
const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
  team: process.env.STRIPE_TEAM_PRICE_ID,
};

// Trial period in days
const TRIAL_DAYS = 7;

// Team seats: Stripe quantity tracks discounted seats (excludes owner).
// In Convex, `teams.seatsPurchased` tracks total seats (includes owner).
const TEAM_OWNER_SEAT_COUNT = 1;
const MIN_DISCOUNTED_TEAM_SEATS = 5;

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

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
 * Create a Stripe Checkout session for team subscription
 */
export const createTeamCheckoutSession = action({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    seats: v.number(),
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

      if (!isNonNegativeInteger(args.seats)) {
        return { error: "Seat count must be a whole number" };
      }

      // Get team and validate ownership
      const team = await ctx.runQuery(internal.stripe.getTeamById, { teamId: args.teamId });
      if (!team) {
        return { error: "Team not found" };
      }

      if (team.ownerUserId !== userSession.userId) {
        return { error: "Only the team owner can manage billing" };
      }

      const priceId = PRICE_IDS.team;
      if (!priceId) {
        return { error: "Team price not configured" };
      }

      // args.seats is discounted seats (excludes owner)
      if (args.seats < MIN_DISCOUNTED_TEAM_SEATS) {
        return { error: `Must purchase at least ${MIN_DISCOUNTED_TEAM_SEATS} discounted seats` };
      }

      // Recommended: only allow discounted-seat add-on for users with an active main subscription
      const user = await ctx.runQuery(internal.stripe.getUserById, { userId: userSession.userId });
      if (!user) {
        return { error: "User not found" };
      }
      const allowedStatuses = new Set(["active", "trialing", "lifetime"]);
      if (!allowedStatuses.has(user.subscriptionStatus)) {
        return { error: "You must have an active KorProxy subscription to purchase discounted seats" };
      }

      // Create or get Stripe customer for team
      let customerId: string | undefined = team.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          name: team.name,
          metadata: {
            teamId: args.teamId,
            convexUserId: userSession.userId,
            type: "team",
          },
        });
        customerId = customer.id;

        // Save customer ID to team
        await ctx.runMutation(internal.stripe.setTeamStripeCustomerId, {
          teamId: args.teamId,
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
            quantity: args.seats,
          },
        ],
        subscription_data: {
          metadata: {
            teamId: args.teamId,
            convexUserId: userSession.userId,
            type: "team",
            discountedSeats: String(args.seats),
            totalSeats: String(args.seats + TEAM_OWNER_SEAT_COUNT),
          },
        },
        success_url: args.successUrl,
        cancel_url: args.cancelUrl,
        metadata: {
          teamId: args.teamId,
          convexUserId: userSession.userId,
          type: "team",
          discountedSeats: String(args.seats),
          totalSeats: String(args.seats + TEAM_OWNER_SEAT_COUNT),
        },
      });

      return { url: checkoutSession.url || "" };
    } catch (error) {
      console.error("Stripe team checkout error:", error);
      return { error: error instanceof Error ? error.message : "Failed to create checkout session" };
    }
  },
});

/**
 * Update team seat count
 */
export const updateTeamSeats = action({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
    newSeatCount: v.number(),
  },
  returns: v.union(
    v.object({ success: v.boolean() }),
    v.object({ error: v.string() })
  ),
  handler: async (ctx, args): Promise<{ success: boolean } | { error: string }> => {
    try {
      const stripe = getStripeClient();

      // Validate session and get user
      const userSession = await ctx.runQuery(internal.stripe.getSessionUser, { token: args.token });
      if (!userSession) {
        return { error: "Invalid session" };
      }

      if (!isNonNegativeInteger(args.newSeatCount)) {
        return { error: "Seat count must be a whole number" };
      }

      // Get team and validate ownership
      const team = await ctx.runQuery(internal.stripe.getTeamById, { teamId: args.teamId });
      if (!team) {
        return { error: "Team not found" };
      }

      if (team.ownerUserId !== userSession.userId) {
        return { error: "Only the team owner can manage billing" };
      }

      if (!team.stripeSubscriptionId) {
        return { error: "No active subscription found" };
      }

      // args.newSeatCount is discounted seats (excludes owner)
      if (args.newSeatCount < MIN_DISCOUNTED_TEAM_SEATS) {
        return { error: `Discounted seats must be at least ${MIN_DISCOUNTED_TEAM_SEATS}` };
      }

      if (args.newSeatCount + TEAM_OWNER_SEAT_COUNT < team.seatsUsed) {
        return {
          error: `Cannot reduce total seats below current usage (${team.seatsUsed} seats in use)`,
        };
      }

      // Get the subscription
      const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId);
      const subscriptionItem =
        PRICE_IDS.team
          ? subscription.items.data.find((item) => item.price.id === PRICE_IDS.team)
          : subscription.items.data[0];

      if (!subscriptionItem) {
        return { error: "Subscription item not found" };
      }

      // Update the subscription quantity
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        items: [
          {
            id: subscriptionItem.id,
            quantity: args.newSeatCount,
          },
        ],
        proration_behavior: "create_prorations",
      });

      // Update local record
      await ctx.runMutation(internal.stripe.updateTeamSubscription, {
        teamId: args.teamId,
        seatsPurchased: args.newSeatCount + TEAM_OWNER_SEAT_COUNT,
      });

      return { success: true };
    } catch (error) {
      console.error("Stripe update seats error:", error);
      return { error: error instanceof Error ? error.message : "Failed to update seats" };
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
 * Create a Stripe Customer Portal session for managing a team's seat add-on subscription
 */
export const createTeamPortalSession = action({
  args: {
    token: v.string(),
    teamId: v.id("teams"),
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
      if (!userSession) {
        return { error: "Invalid session" };
      }

      const team = await ctx.runQuery(internal.stripe.getTeamById, { teamId: args.teamId });
      if (!team) {
        return { error: "Team not found" };
      }

      if (team.ownerUserId !== userSession.userId) {
        return { error: "Only the team owner can manage billing" };
      }

      if (!team.stripeCustomerId) {
        return { error: "No team Stripe customer found" };
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: team.stripeCustomerId,
        return_url: args.returnUrl,
      });

      return { url: portalSession.url };
    } catch (error) {
      console.error("Team portal session error:", error);
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
    console.log("=== Stripe Webhook Received ===");
    console.log("Signature present:", !!args.signature);
    console.log("Payload length:", args.payload.length);
    
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured!");
      return { success: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
    }
    console.log("Webhook secret configured:", webhookSecret.substring(0, 10) + "...");

    let stripe: Stripe;
    try {
      stripe = getStripeClient();
    } catch (error) {
      console.error("Failed to initialize Stripe client:", error);
      return { success: false, error: error instanceof Error ? error.message : "Stripe not configured" };
    }

    let event: Stripe.Event;

    try {
      // Use async version for Convex runtime compatibility
      event = await stripe.webhooks.constructEventAsync(args.payload, args.signature, webhookSecret);
      console.log("Webhook signature verified successfully");
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      console.error("This usually means STRIPE_WEBHOOK_SECRET doesn't match the Stripe dashboard webhook secret");
      return { success: false, error: "Invalid signature" };
    }

    console.log(`Processing Stripe event: ${event.type}, id: ${event.id}`);

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          // Check if this is a team checkout
          if (session.metadata?.teamId) {
            console.log("Processing team checkout:", session.metadata.teamId);
            await handleTeamCheckoutCompleted(ctx, stripe, session);
          } else {
            await handleCheckoutCompleted(ctx, stripe, session);
          }
          break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          // Check if this is a team subscription
          if (subscription.metadata?.teamId) {
            console.log("Processing team subscription update:", subscription.metadata.teamId);
            await handleTeamSubscriptionUpdate(ctx, stripe, subscription);
          } else {
            await handleSubscriptionUpdate(ctx, stripe, subscription);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          // Check if this is a team subscription
          if (subscription.metadata?.teamId) {
            console.log("Processing team subscription deletion:", subscription.metadata.teamId);
            await handleTeamSubscriptionDeleted(ctx, subscription);
          } else {
            await handleSubscriptionDeleted(ctx, subscription);
          }
          break;
        }

        case "invoice.payment_succeeded": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            if (subscription.metadata?.teamId) {
              await handleTeamSubscriptionUpdate(ctx, stripe, subscription);
            } else {
              await handleSubscriptionUpdate(ctx, stripe, subscription);
            }
          }
          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            if (subscription.metadata?.teamId) {
              await handleTeamPaymentFailed(ctx, subscription);
            } else {
              await handlePaymentFailed(ctx, invoice);
            }
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
  let user = await ctx.runQuery(internal.stripe.getUserByCustomer, { stripeCustomerId: customerId });
  
  // Fallback: try to find user by Convex ID from subscription metadata
  if (!user && subscription.metadata?.convexUserId) {
    console.log("User not found by customer ID, trying metadata.convexUserId:", subscription.metadata.convexUserId);
    user = await ctx.runQuery(internal.stripe.getUserById, { userId: subscription.metadata.convexUserId });
    
    // If found, update the user's stripeCustomerId
    if (user) {
      console.log("Found user by metadata, updating stripeCustomerId");
      await ctx.runMutation(internal.stripe.setCustomerId, {
        userId: user.id,
        stripeCustomerId: customerId,
      });
    }
  }
  
  if (!user) {
    console.error("User not found for customer:", customerId, "metadata:", subscription.metadata);
    return;
  }
  
  console.log("Updating subscription for user:", user.email, "status:", subscription.status);

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
// Team-specific webhook handlers
// ============================================

/**
 * Handle team checkout.session.completed
 */
async function handleTeamCheckoutCompleted(
  ctx: ActionContext,
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<void> {
  console.log("Handling team checkout.session.completed:", session.id);
  
  const teamId = session.metadata?.teamId as Id<"teams"> | undefined;
  const customerId = session.customer as string;

  if (!teamId) {
    console.error("No teamId in checkout session metadata");
    return;
  }

  if (!customerId) {
    console.error("No customer ID in checkout session");
    return;
  }

  // Set customer ID if not already set
  const team = await ctx.runQuery(internal.stripe.getTeamById, { teamId });
  if (team && !team.stripeCustomerId) {
    await ctx.runMutation(internal.stripe.setTeamStripeCustomerId, {
      teamId,
      stripeCustomerId: customerId,
    });
  }

  // If there's a subscription, fetch it and update the team
  if (session.subscription) {
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleTeamSubscriptionUpdate(ctx, stripe, subscription);
  }
}

/**
 * Handle team subscription creation/update
 */
async function handleTeamSubscriptionUpdate(
  ctx: ActionContext,
  _stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<void> {
  const teamId = subscription.metadata?.teamId as Id<"teams"> | undefined;
  const customerId = subscription.customer as string;
  
  if (!teamId) {
    // Try to find team by customer ID
    const team = await ctx.runQuery(internal.stripe.getTeamByStripeCustomer, { stripeCustomerId: customerId });
    if (!team) {
      console.error("Team not found for subscription:", subscription.id);
      return;
    }
    console.log("Found team by customer ID:", team.id);
    await updateTeamFromSubscription(ctx, team.id, subscription);
    return;
  }

  console.log("Updating team subscription for teamId:", teamId, "status:", subscription.status);
  await updateTeamFromSubscription(ctx, teamId, subscription);
}

/**
 * Helper to update team from subscription data
 */
async function updateTeamFromSubscription(
  ctx: ActionContext,
  teamId: Id<"teams">,
  subscription: Stripe.Subscription
): Promise<void> {
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

  // Stripe quantity is discounted seats (excludes owner). Convex stores total seats.
  const subscriptionItem =
    PRICE_IDS.team
      ? subscription.items.data.find((item) => item.price.id === PRICE_IDS.team)
      : subscription.items.data[0];
  const rawQuantity = subscriptionItem?.quantity;
  const discountedSeats =
    typeof rawQuantity === "number" && Number.isFinite(rawQuantity) && rawQuantity >= 0
      ? Math.trunc(rawQuantity)
      : 0;
  const seatsPurchased = discountedSeats + TEAM_OWNER_SEAT_COUNT;

  await ctx.runMutation(internal.stripe.updateTeamSubscription, {
    teamId,
    status,
    stripeSubscriptionId: subscription.id,
    seatsPurchased,
    currentPeriodEnd: subscription.current_period_end * 1000,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

/**
 * Handle team subscription deletion
 */
async function handleTeamSubscriptionDeleted(
  ctx: ActionContext,
  subscription: Stripe.Subscription
): Promise<void> {
  const teamId = subscription.metadata?.teamId as Id<"teams"> | undefined;
  const customerId = subscription.customer as string;
  
  let targetTeamId = teamId;
  
  if (!targetTeamId) {
    const team = await ctx.runQuery(internal.stripe.getTeamByStripeCustomer, { stripeCustomerId: customerId });
    if (!team) {
      console.error("Team not found for customer:", customerId);
      return;
    }
    targetTeamId = team.id;
  }

  await ctx.runMutation(internal.stripe.updateTeamSubscription, {
    teamId: targetTeamId,
    status: "expired",
    stripeSubscriptionId: undefined,
    seatsPurchased: TEAM_OWNER_SEAT_COUNT,
    currentPeriodEnd: undefined,
    cancelAtPeriodEnd: undefined,
  });
}

/**
 * Handle team payment failure
 */
async function handleTeamPaymentFailed(
  ctx: ActionContext,
  subscription: Stripe.Subscription
): Promise<void> {
  const teamId = subscription.metadata?.teamId as Id<"teams"> | undefined;
  const customerId = subscription.customer as string;
  
  let targetTeamId = teamId;
  
  if (!targetTeamId) {
    const team = await ctx.runQuery(internal.stripe.getTeamByStripeCustomer, { stripeCustomerId: customerId });
    if (!team) {
      console.error("Team not found for customer:", customerId);
      return;
    }
    targetTeamId = team.id;
  }

  const team = await ctx.runQuery(internal.stripe.getTeamById, { teamId: targetTeamId });
  if (!team) {
    console.error("Team not found:", targetTeamId);
    return;
  }

  await ctx.runMutation(internal.stripe.updateTeamSubscription, {
    teamId: targetTeamId,
    status: "past_due",
    stripeSubscriptionId: team.stripeSubscriptionId,
    seatsPurchased: team.seatsPurchased,
    currentPeriodEnd: team.currentPeriodEnd,
    cancelAtPeriodEnd: team.cancelAtPeriodEnd,
  });
}

// ============================================
// Internal functions (not exposed to clients)
// ============================================

/**
 * Get user by Convex user ID (for webhook fallback when customer ID not found)
 */
export const getUserById = internalQuery({
  args: { userId: v.string() },
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
    try {
      const user = await ctx.db.get(args.userId as Id<"users">);
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
    } catch {
      return null;
    }
  },
});

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
    console.log("=== updateUserSubscription called ===");
    console.log("userId:", args.userId, "new status:", args.status, "plan:", args.plan);
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("User not found for ID:", args.userId);
      return null;
    }

    // Don't modify lifetime users
    if (user.subscriptionStatus === "lifetime") {
      console.log("Skipping update - user has lifetime status");
      return null;
    }

    const previousStatus = user.subscriptionStatus;
    console.log("Updating user:", user.email, "from", previousStatus, "to", args.status);

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

// ============================================
// Team-specific internal functions
// ============================================

/**
 * Get team by ID (internal)
 */
export const getTeamById = internalQuery({
  args: { teamId: v.id("teams") },
  returns: v.union(
    v.object({
      id: v.id("teams"),
      name: v.string(),
      ownerUserId: v.id("users"),
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      subscriptionStatus: v.string(),
      seatsPurchased: v.number(),
      seatsUsed: v.number(),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db.get(args.teamId);
    if (!team) return null;

    return {
      id: team._id,
      name: team.name,
      ownerUserId: team.ownerUserId,
      stripeCustomerId: team.stripeCustomerId,
      stripeSubscriptionId: team.stripeSubscriptionId,
      subscriptionStatus: team.subscriptionStatus,
      seatsPurchased: team.seatsPurchased,
      seatsUsed: team.seatsUsed,
      currentPeriodEnd: team.currentPeriodEnd,
      cancelAtPeriodEnd: team.cancelAtPeriodEnd,
    };
  },
});

/**
 * Get team by Stripe customer ID (for webhook lookup)
 */
export const getTeamByStripeCustomer = internalQuery({
  args: { stripeCustomerId: v.string() },
  returns: v.union(
    v.object({
      id: v.id("teams"),
      name: v.string(),
      ownerUserId: v.id("users"),
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      subscriptionStatus: v.string(),
      seatsPurchased: v.number(),
      seatsUsed: v.number(),
      currentPeriodEnd: v.optional(v.number()),
      cancelAtPeriodEnd: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .withIndex("by_stripe_customer", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first();

    if (!team) return null;

    return {
      id: team._id,
      name: team.name,
      ownerUserId: team.ownerUserId,
      stripeCustomerId: team.stripeCustomerId,
      stripeSubscriptionId: team.stripeSubscriptionId,
      subscriptionStatus: team.subscriptionStatus,
      seatsPurchased: team.seatsPurchased,
      seatsUsed: team.seatsUsed,
      currentPeriodEnd: team.currentPeriodEnd,
      cancelAtPeriodEnd: team.cancelAtPeriodEnd,
    };
  },
});

/**
 * Set Stripe customer ID for team
 */
export const setTeamStripeCustomerId = internalMutation({
  args: {
    teamId: v.id("teams"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teamId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Update team subscription status
 */
export const updateTeamSubscription = internalMutation({
  args: {
    teamId: v.id("teams"),
    status: v.optional(
      v.union(
        v.literal("none"),
        v.literal("trialing"),
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("expired")
      )
    ),
    stripeSubscriptionId: v.optional(v.string()),
    seatsPurchased: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log("=== updateTeamSubscription called ===");
    console.log("teamId:", args.teamId, "updates:", args);
    
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      console.error("Team not found for ID:", args.teamId);
      return null;
    }

    const previousStatus = team.subscriptionStatus;
    console.log("Updating team:", team.name, "from", previousStatus, "to", args.status || previousStatus);

    const updates: Partial<{
      subscriptionStatus: "none" | "trialing" | "active" | "past_due" | "canceled" | "expired";
      stripeSubscriptionId: string | undefined;
      seatsPurchased: number;
      currentPeriodEnd: number | undefined;
      cancelAtPeriodEnd: boolean | undefined;
      updatedAt: number;
    }> = {
      updatedAt: Date.now(),
    };

    if (args.status !== undefined) {
      updates.subscriptionStatus = args.status;
    }
    if (args.stripeSubscriptionId !== undefined) {
      updates.stripeSubscriptionId = args.stripeSubscriptionId;
    }
    if (args.seatsPurchased !== undefined) {
      updates.seatsPurchased = args.seatsPurchased;
    }
    if (args.currentPeriodEnd !== undefined) {
      updates.currentPeriodEnd = args.currentPeriodEnd;
    }
    if (args.cancelAtPeriodEnd !== undefined) {
      updates.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    }

    await ctx.db.patch(args.teamId, updates);

    // Log subscription event for team owner
    if (args.status !== undefined) {
      await ctx.db.insert("subscriptionEvents", {
        userId: team.ownerUserId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        eventType: "team_subscription_updated",
        fromStatus: previousStatus,
        toStatus: args.status,
        plan: "team",
        occurredAt: Date.now(),
      });
    }

    return null;
  },
});

# Stripe setup: discounted team seats

This repo uses Stripe to sell **discounted team seats** for teams. The billing model is:

- **Stripe subscription quantity** = **discounted seats only** (excludes the owner).
- Convex `teams.seatsPurchased` = **total seats** (includes the owner) = `stripeQuantity + 1`.
- Minimum discounted seats purchase is **5** (so **6 total seats** including the owner).

## Create the discounted-seat Price in Stripe

In Stripe Dashboard, create (or confirm) a recurring Price with:

- **Currency**: GBP
- **Unit amount**: 500 (pence) = **£5.00**
- **Recurring interval**: monthly
- **Quantity**: adjustable

Copy the resulting Stripe Price ID (looks like `price_...`).

## Set Convex environment variables

Set the following env vars for the Convex deployment running `korproxy-backend/convex`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- `STRIPE_TEAM_PRICE_ID` (**the £5 GBP/month discounted-seat Price ID**)

For local development, see `korproxy-backend/.env.example`.

## Configure Stripe webhooks

The Convex backend exposes a Stripe webhook endpoint at:

- `POST` `https://<your-convex-deployment>.convex.site/stripe-webhook`

Enable the following events for that webhook endpoint:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

These events are handled in `korproxy-backend/convex/stripe.ts` via the `internal.stripe.handleWebhook` action.

## Stripe Billing Portal (team seats)

The dashboard “Manage in Stripe” button uses Stripe Billing Portal for the team customer. Ensure:

- Billing Portal is enabled in Stripe
- The portal configuration allows managing the team subscription (at minimum, cancellation)


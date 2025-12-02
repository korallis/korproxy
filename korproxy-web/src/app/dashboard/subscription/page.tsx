"use client";

import { useAuth } from "@/providers/AuthProvider";
import { CreditCard, Calendar, CheckCircle, AlertCircle, Crown } from "lucide-react";

export default function SubscriptionPage() {
  const { user, createCheckoutSession, createPortalSession } = useAuth();

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    const result = await createCheckoutSession(
      plan,
      `${window.location.origin}/dashboard?success=true`,
      `${window.location.origin}/dashboard/subscription`
    );
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const handleManageSubscription = async () => {
    const result = await createPortalSession(
      `${window.location.origin}/dashboard/subscription`
    );
    if (result.url) {
      window.location.href = result.url;
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusBadge = () => {
    switch (user?.subscriptionStatus) {
      case "lifetime":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
            <Crown size={14} />
            Lifetime
          </span>
        );
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)] text-sm font-medium">
            <CheckCircle size={14} />
            Active
          </span>
        );
      case "trialing":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)] text-sm font-medium">
            <Calendar size={14} />
            Trial
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)] text-sm font-medium">
            <AlertCircle size={14} />
            Past Due
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm font-medium">
            No Subscription
          </span>
        );
    }
  };

  const hasActiveSubscription = ["lifetime", "active", "trialing"].includes(
    user?.subscriptionStatus || ""
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Subscription</h1>
        <p className="text-muted-foreground">Manage your KorProxy subscription</p>
      </div>

      {/* Current Status */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {user?.subscriptionPlan && (
                <span className="text-muted-foreground capitalize">
                  {user.subscriptionPlan} Plan
                </span>
              )}
            </div>
            {user?.subscriptionStatus === "trialing" && user?.trialEnd && (
              <p className="text-sm text-muted-foreground/70">
                Trial ends: {formatDate(user.trialEnd)}
              </p>
            )}
            {user?.subscriptionStatus === "active" && user?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground/70">
                Next billing date: {formatDate(user.currentPeriodEnd)}
              </p>
            )}
            {user?.cancelAtPeriodEnd && (
              <p className="text-sm text-[oklch(0.80_0.16_85)]">
                Cancels at end of period
              </p>
            )}
          </div>
          {hasActiveSubscription && user?.subscriptionStatus !== "lifetime" && (
            <button
              onClick={handleManageSubscription}
              className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:bg-muted/50 transition-all"
            >
              Manage Subscription
            </button>
          )}
        </div>
      </div>

      {/* Pricing Cards - Show if no active subscription */}
      {!hasActiveSubscription && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Choose a Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly */}
            <div className="glass-card p-6 hover:border-primary/50 transition-all">
              <h3 className="text-xl font-semibold mb-2">Monthly</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">£14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  All AI providers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  Unlimited requests
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  7-day free trial
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe("monthly")}
                className="w-full py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-all"
              >
                Start Free Trial
              </button>
            </div>

            {/* Yearly */}
            <div className="glass-card p-6 border-primary/30 shadow-glow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                Save 33%
              </div>
              <h3 className="text-xl font-semibold mb-2">Yearly</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">£120</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  All AI providers
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  Unlimited requests
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-primary" />
                  7-day free trial
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe("yearly")}
                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 shadow-glow transition-all"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lifetime Status */}
      {user?.subscriptionStatus === "lifetime" && (
        <div className="glass-card p-6 border-primary/30 shadow-glow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="text-primary" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-primary">Lifetime Access</h2>
          </div>
          <p className="text-muted-foreground">
            You have lifetime access to KorProxy. Thank you for your support!
          </p>
        </div>
      )}
    </div>
  );
}

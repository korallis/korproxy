"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "../../../../convex/_generated/api";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown,
  Loader2,
  ExternalLink,
  ArrowRight,
  Check,
  Receipt,
} from "lucide-react";

interface Entitlements {
  plan: "free" | "pro" | "team";
  isActive: boolean;
  inGracePeriod: boolean;
  graceEndsAt?: number;
  limits: {
    maxProfiles: number;
    maxProviderGroups: number;
    maxDevices: number;
    smartRouting: boolean;
    analyticsRetentionDays: number;
  };
  teamId?: string;
  teamName?: string;
}

const PLAN_DETAILS: Record<string, { name: string; description: string; monthlyPrice: string; yearlyPrice: string }> = {
  free: {
    name: "Free",
    description: "Basic access with limited features",
    monthlyPrice: "£0",
    yearlyPrice: "£0",
  },
  pro: {
    name: "Pro",
    description: "Full access to all KorProxy features",
    monthlyPrice: "£14.99",
    yearlyPrice: "£120",
  },
  team: {
    name: "Team",
    description: "Shared access through your team subscription",
    monthlyPrice: "Contact",
    yearlyPrice: "Contact",
  },
};

const pricingFeatures = [
  "All AI providers supported",
  "Unlimited proxy requests",
  "Priority support",
  "Automatic updates",
  "Up to 10 profiles",
  "Smart routing",
];

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BillingPage() {
  const { user, token, createCheckoutSession, createPortalSession } = useAuth();
  const convex = useConvex();
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
  const [entitlementsLoading, setEntitlementsLoading] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntitlements() {
      if (!token) {
        setEntitlementsLoading(false);
        return;
      }
      try {
        const result = await convex.query(api.entitlements.get, { token });
        setEntitlements(result);
      } catch (err) {
        console.error("Failed to fetch entitlements:", err);
      } finally {
        setEntitlementsLoading(false);
      }
    }
    fetchEntitlements();
  }, [convex, token]);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setError(null);
    setLoadingPlan(plan);
    try {
      const result = await createCheckoutSession(
        plan,
        `${window.location.origin}/dashboard/billing?success=true`,
        `${window.location.origin}/dashboard/billing`
      );
      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to start checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setError(null);
    setLoadingPortal(true);
    try {
      const result = await createPortalSession(`${window.location.origin}/dashboard/billing`);
      if (result.url) {
        window.location.href = result.url;
      } else if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  };

  const plan = entitlements?.plan || "free";
  const planDetails = PLAN_DETAILS[plan] || PLAN_DETAILS.free;
  const subscriptionStatus = user?.subscriptionStatus || "none";
  const billingCycle = user?.subscriptionPlan || null;

  const getStatusBadge = () => {
    const badges: Record<string, { className: string; text: string; icon?: React.ReactNode }> = {
      none: { className: "bg-muted text-muted-foreground", text: "No Subscription" },
      trialing: {
        className: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]",
        text: "Trial",
        icon: <Calendar size={14} />,
      },
      active: {
        className: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]",
        text: "Active",
        icon: <CheckCircle size={14} />,
      },
      past_due: {
        className: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]",
        text: "Past Due",
        icon: <AlertCircle size={14} />,
      },
      canceled: { className: "bg-muted text-muted-foreground", text: "Canceled" },
      expired: { className: "bg-muted text-muted-foreground", text: "Expired" },
      lifetime: {
        className: "bg-primary/20 text-primary",
        text: "Lifetime",
        icon: <Crown size={14} />,
      },
    };
    const badge = badges[subscriptionStatus];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  const hasActiveSubscription = ["lifetime", "active", "trialing"].includes(subscriptionStatus);
  const canManageBilling = ["active", "trialing", "past_due", "canceled"].includes(subscriptionStatus);
  const showUpgradeSection = plan === "free" || subscriptionStatus === "none" || subscriptionStatus === "expired" || subscriptionStatus === "canceled";

  if (entitlementsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-foreground">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing details</p>
      </div>

      {error && (
        <div className="bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-[oklch(0.65_0.24_25)] flex-shrink-0" size={20} />
          <p className="text-[oklch(0.65_0.24_25)]">{error}</p>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Current Plan</h2>
            <p className="text-muted-foreground text-sm">{planDetails.description}</p>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-xl font-semibold">{planDetails.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Billing Cycle</p>
            <p className="text-xl font-semibold capitalize">
              {subscriptionStatus === "lifetime"
                ? "One-time"
                : billingCycle
                ? billingCycle
                : "N/A"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-xl font-semibold">
              {subscriptionStatus === "lifetime"
                ? "Lifetime"
                : billingCycle === "yearly"
                ? planDetails.yearlyPrice + "/year"
                : billingCycle === "monthly"
                ? planDetails.monthlyPrice + "/month"
                : "Free"}
            </p>
          </div>
        </div>

        {subscriptionStatus === "trialing" && user?.trialEnd && (
          <div className="mt-6 p-4 rounded-xl bg-[oklch(0.55_0.15_250/0.1)] border border-[oklch(0.55_0.15_250/0.2)]">
            <div className="flex items-center gap-3">
              <Calendar className="text-[oklch(0.70_0.15_250)]" size={20} />
              <div>
                <p className="font-medium text-[oklch(0.70_0.15_250)]">Trial Period</p>
                <p className="text-sm text-muted-foreground">
                  Your trial ends on {formatDate(user.trialEnd)}
                </p>
              </div>
            </div>
          </div>
        )}

        {subscriptionStatus === "active" && user?.currentPeriodEnd && (
          <div className="mt-6 p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-3">
              <CreditCard className="text-muted-foreground" size={20} />
              <div>
                <p className="font-medium">Next Billing Date</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(user.currentPeriodEnd)}
                  {user.cancelAtPeriodEnd && (
                    <span className="text-[oklch(0.80_0.16_85)] ml-2">• Cancels at end of period</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {subscriptionStatus === "lifetime" && (
          <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <Crown className="text-primary" size={20} />
              <div>
                <p className="font-medium text-primary">Lifetime Access</p>
                <p className="text-sm text-muted-foreground">
                  Thank you for your support! You have permanent access to KorProxy.
                </p>
              </div>
            </div>
          </div>
        )}

        {entitlements?.teamName && (
          <div className="mt-6 p-4 rounded-xl bg-[oklch(0.55_0.15_250/0.1)] border border-[oklch(0.55_0.15_250/0.2)]">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-[oklch(0.70_0.15_250)]" size={20} />
              <div>
                <p className="font-medium text-[oklch(0.70_0.15_250)]">Team Subscription</p>
                <p className="text-sm text-muted-foreground">
                  Your access is provided through <strong>{entitlements.teamName}</strong>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {canManageBilling && subscriptionStatus !== "lifetime" && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Manage Subscription</h2>
          <p className="text-muted-foreground mb-6">
            Update your payment method, change your plan, or view your billing history through the Stripe billing portal.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPortal ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <CreditCard size={20} />
              )}
              Manage Billing
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Receipt className="text-muted-foreground" size={20} />
          <h2 className="text-lg font-semibold">Invoice History</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          View and download your past invoices through the Stripe billing portal.
        </p>
        {canManageBilling ? (
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="flex items-center gap-2 text-primary hover:underline font-medium"
          >
            View Invoices in Stripe Portal
            <ArrowRight size={16} />
          </button>
        ) : (
          <p className="text-sm text-muted-foreground/70">
            No billing history available. Subscribe to a plan to get started.
          </p>
        )}
      </div>

      {showUpgradeSection && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Upgrade Your Plan</h2>
            <p className="text-muted-foreground">
              {subscriptionStatus === "canceled" || subscriptionStatus === "expired"
                ? "Resubscribe to continue using KorProxy with all features."
                : "Unlock all features with a Pro subscription."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 hover:border-primary/50 transition-all">
              <h3 className="text-xl font-semibold mb-2">Monthly</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">£14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe("monthly")}
                disabled={loadingPlan !== null}
                className="w-full py-3 border border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingPlan === "monthly" && <Loader2 size={20} className="animate-spin" />}
                {hasActiveSubscription ? "Switch to Monthly" : "Start Free Trial"}
              </button>
            </div>

            <div className="glass-card p-6 border-primary/30 shadow-glow relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
                Save 33%
              </div>
              <h3 className="text-xl font-semibold mb-2">Yearly</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold">£120</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <ul className="space-y-2 mb-6">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check size={16} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={loadingPlan !== null}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingPlan === "yearly" && <Loader2 size={20} className="animate-spin" />}
                {hasActiveSubscription ? "Switch to Yearly" : "Start Free Trial"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

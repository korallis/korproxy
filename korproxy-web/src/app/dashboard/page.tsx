"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  Check,
  Clock,
  CreditCard,
  AlertCircle,
  Crown,
  Loader2,
} from "lucide-react";
import { DownloadSectionWrapper } from "./DownloadSectionWrapper";

const pricingFeatures = [
  "All AI providers supported",
  "Unlimited proxy requests",
  "Priority support",
  "Automatic updates",
];

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDaysRemaining(timestamp: number | undefined): number {
  if (!timestamp) return 0;
  const now = Date.now();
  const diff = timestamp - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function DashboardPage() {
  const { user, createCheckoutSession, createPortalSession } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<"monthly" | "yearly" | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: "monthly" | "yearly") => {
    setError(null);
    setLoadingPlan(plan);
    try {
      const result = await createCheckoutSession(
        plan,
        `${window.location.origin}/dashboard?success=true`,
        `${window.location.origin}/dashboard?canceled=true`
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
      const result = await createPortalSession(`${window.location.origin}/dashboard`);
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

  const renderStatusBadge = () => {
    const status = user?.subscriptionStatus;
    const badges: Record<string, { className: string; text: string }> = {
      none: { className: "bg-muted text-muted-foreground", text: "No Subscription" },
      trialing: { className: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]", text: "Trial" },
      active: { className: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]", text: "Active" },
      past_due: { className: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]", text: "Past Due" },
      canceled: { className: "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.65_0.24_25)]", text: "Canceled" },
      expired: { className: "bg-muted text-muted-foreground", text: "Expired" },
      lifetime: { className: "bg-primary/20 text-primary", text: "Lifetime" },
    };
    const badge = badges[status || "none"];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const renderContent = () => {
    const status = user?.subscriptionStatus;

    if (status === "lifetime") {
      return (
        <div className="glass-card p-8 border-primary/30 shadow-glow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Crown className="text-primary" size={24} />
            </div>
            <h2 className="text-2xl font-bold">Lifetime Access</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            You have lifetime access to KorProxy. Thank you for your support!
          </p>
        </div>
      );
    }

    if (status === "active") {
      return (
        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Subscription</h2>
              <p className="text-muted-foreground">
                {user?.subscriptionPlan === "yearly" ? "Yearly" : "Monthly"} Plan
              </p>
            </div>
            {renderStatusBadge()}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <CreditCard size={20} />
            <span>Next billing date: {formatDate(user?.currentPeriodEnd)}</span>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={loadingPortal}
            className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingPortal && <Loader2 size={20} className="animate-spin" />}
            Manage Subscription
          </button>
        </div>
      );
    }

    if (status === "trialing") {
      const daysLeft = getDaysRemaining(user?.trialEnd);
      return (
        <div className="space-y-8">
          <div className="glass-card p-8 border-[oklch(0.55_0.15_250/0.3)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.55_0.15_250/0.2)] flex items-center justify-center">
                  <Clock className="text-[oklch(0.70_0.15_250)]" size={20} />
                </div>
                <h2 className="text-2xl font-bold">Free Trial</h2>
              </div>
              {renderStatusBadge()}
            </div>
            <p className="text-muted-foreground mb-2">
              Your trial ends on {formatDate(user?.trialEnd)}
            </p>
            <p className="text-[oklch(0.70_0.15_250)] font-semibold">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining
            </p>
          </div>
          {renderPricingCards()}
        </div>
      );
    }

    if (status === "past_due") {
      return (
        <div className="space-y-8">
          <div className="glass-card p-8 border-[oklch(0.80_0.16_85/0.3)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[oklch(0.80_0.16_85/0.2)] flex items-center justify-center">
                <AlertCircle className="text-[oklch(0.80_0.16_85)]" size={20} />
              </div>
              <h2 className="text-2xl font-bold">Payment Issue</h2>
            </div>
            <p className="text-muted-foreground mb-6">
              There was an issue with your last payment. Please update your payment method.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="px-6 py-3 bg-[oklch(0.80_0.16_85)] hover:bg-[oklch(0.75_0.16_85)] text-background rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loadingPortal && <Loader2 size={20} className="animate-spin" />}
              Update Payment Method
            </button>
          </div>
        </div>
      );
    }

    if (status === "canceled" || status === "expired") {
      return (
        <div className="space-y-8">
          <div className="glass-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <AlertCircle className="text-muted-foreground" size={20} />
              </div>
              <h2 className="text-2xl font-bold">
                {status === "canceled" ? "Subscription Canceled" : "Subscription Expired"}
              </h2>
            </div>
            <p className="text-muted-foreground mb-6">
              Resubscribe to continue using KorProxy with all features.
            </p>
          </div>
          {renderPricingCards()}
        </div>
      );
    }

    // No subscription
    return (
      <div className="space-y-8">
        <div className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Start Your Free Trial</h2>
          <p className="text-muted-foreground mb-2">
            Get full access to KorProxy for 7 days, no credit card required.
          </p>
          <p className="text-muted-foreground/70 text-sm">
            Choose a plan below to begin.
          </p>
        </div>
        {renderPricingCards()}
      </div>
    );
  };

  const renderPricingCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Monthly Plan */}
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
          {user?.subscriptionStatus === "none" ? "Start Free Trial" : "Subscribe Monthly"}
        </button>
      </div>

      {/* Yearly Plan */}
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
          {user?.subscriptionStatus === "none" ? "Start Free Trial" : "Subscribe Yearly"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || user?.email?.split("@")[0] || "User"}
        </p>
      </div>

      {error && (
        <div className="bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-[oklch(0.65_0.24_25)] flex-shrink-0" size={20} />
          <p className="text-[oklch(0.65_0.24_25)]">{error}</p>
        </div>
      )}

      {renderContent()}

      {/* Download Section */}
      <DownloadSectionWrapper 
        hasAccess={["lifetime", "active", "trialing"].includes(user?.subscriptionStatus || "")} 
      />
    </div>
  );
}

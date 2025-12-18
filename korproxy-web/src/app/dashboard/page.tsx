"use client";

import { useState, useEffect } from "react";
import { useConvex } from "convex/react";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import {
  Check,
  Clock,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Crown,
  Loader2,
  Users,
  Layers,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { DownloadSectionWrapper } from "./DownloadSectionWrapper";

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

const PLAN_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
  free: { label: "Free", color: "text-muted-foreground", bgColor: "bg-muted" },
  pro: { label: "Pro", color: "text-primary", bgColor: "bg-primary/20" },
  team: { label: "Team", color: "text-[oklch(0.55_0.15_250)]", bgColor: "bg-[oklch(0.55_0.15_250/0.2)]" },
};

export default function DashboardPage() {
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

  const plan = entitlements?.plan || "free";
  const planDisplay = PLAN_DISPLAY[plan] || PLAN_DISPLAY.free;
  const daysUntilTrialEnd = getDaysRemaining(user?.trialEnd);
  const daysUntilGraceEnd = entitlements?.graceEndsAt ? getDaysRemaining(entitlements.graceEndsAt) : 0;

  const alerts: Array<{ type: "warning" | "error" | "info"; message: string; action?: { label: string; onClick: () => void } }> = [];

  if (user?.subscriptionStatus === "trialing" && daysUntilTrialEnd <= 3 && daysUntilTrialEnd > 0) {
    alerts.push({
      type: "warning",
      message: `Your trial ends in ${daysUntilTrialEnd} day${daysUntilTrialEnd !== 1 ? "s" : ""}. Upgrade to continue using KorProxy.`,
      action: { label: "Upgrade Now", onClick: () => handleSubscribe("yearly") },
    });
  }

  if (user?.subscriptionStatus === "past_due") {
    alerts.push({
      type: "error",
      message: "Your payment is past due. Please update your payment method to avoid service interruption.",
      action: { label: "Update Payment", onClick: handleManageSubscription },
    });
  }

  if (entitlements?.inGracePeriod && daysUntilGraceEnd > 0) {
    alerts.push({
      type: "warning",
      message: `Grace period ends in ${daysUntilGraceEnd} day${daysUntilGraceEnd !== 1 ? "s" : ""}. Update payment to maintain access.`,
      action: { label: "Update Payment", onClick: handleManageSubscription },
    });
  }

  if (plan === "free" && entitlements?.limits) {
    const nearProfileLimit = entitlements.limits.maxProfiles > 0 && entitlements.limits.maxProfiles <= 1;
    if (nearProfileLimit) {
      alerts.push({
        type: "info",
        message: "You've reached the profile limit on the Free plan. Upgrade to add more profiles.",
        action: { label: "Upgrade", onClick: () => handleSubscribe("yearly") },
      });
    }
  }

  const renderPlanBadge = () => (
    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${planDisplay.bgColor} ${planDisplay.color}`}>
      {planDisplay.label}
    </span>
  );

  const renderStatusBadge = () => {
    const status = user?.subscriptionStatus;
    const badges: Record<string, { className: string; text: string; icon?: React.ReactNode }> = {
      none: { className: "bg-muted text-muted-foreground", text: "No Subscription" },
      trialing: { className: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]", text: "Trial", icon: <Clock size={14} /> },
      active: { className: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]", text: "Active", icon: <Check size={14} /> },
      past_due: { className: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]", text: "Past Due", icon: <AlertTriangle size={14} /> },
      canceled: { className: "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.65_0.24_25)]", text: "Canceled" },
      expired: { className: "bg-muted text-muted-foreground", text: "Expired" },
      lifetime: { className: "bg-primary/20 text-primary", text: "Lifetime", icon: <Crown size={14} /> },
    };
    const badge = badges[status || "none"];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
        {badge.icon}
        {badge.text}
      </span>
    );
  };

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

      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 flex items-center justify-between gap-4 ${
                alert.type === "error"
                  ? "bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)]"
                  : alert.type === "warning"
                  ? "bg-[oklch(0.80_0.16_85/0.1)] border border-[oklch(0.80_0.16_85/0.3)]"
                  : "bg-[oklch(0.55_0.15_250/0.1)] border border-[oklch(0.55_0.15_250/0.3)]"
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.type === "error" ? (
                  <AlertCircle className="text-[oklch(0.65_0.24_25)] flex-shrink-0" size={20} />
                ) : alert.type === "warning" ? (
                  <AlertTriangle className="text-[oklch(0.80_0.16_85)] flex-shrink-0" size={20} />
                ) : (
                  <AlertCircle className="text-[oklch(0.70_0.15_250)] flex-shrink-0" size={20} />
                )}
                <p className={
                  alert.type === "error"
                    ? "text-[oklch(0.65_0.24_25)]"
                    : alert.type === "warning"
                    ? "text-[oklch(0.80_0.16_85)]"
                    : "text-[oklch(0.70_0.15_250)]"
                }>
                  {alert.message}
                </p>
              </div>
              {alert.action && (
                <button
                  onClick={alert.action.onClick}
                  disabled={loadingPlan !== null || loadingPortal}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-foreground/10 hover:bg-foreground/20 transition-all whitespace-nowrap"
                >
                  {alert.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Plan Status</h2>
              <p className="text-muted-foreground text-sm">Your current subscription</p>
            </div>
            <div className="flex items-center gap-2">
              {renderPlanBadge()}
              {renderStatusBadge()}
            </div>
          </div>

          {entitlementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <>
              {user?.subscriptionStatus === "lifetime" ? (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Crown className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">Lifetime Access</p>
                    <p className="text-sm text-muted-foreground">Thank you for your support!</p>
                  </div>
                </div>
              ) : user?.subscriptionStatus === "trialing" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[oklch(0.55_0.15_250/0.2)] flex items-center justify-center">
                      <Clock className="text-[oklch(0.70_0.15_250)]" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">Trial Period</p>
                      <p className="text-sm text-muted-foreground">
                        {daysUntilTrialEnd} day{daysUntilTrialEnd !== 1 ? "s" : ""} remaining • Ends {formatDate(user?.trialEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : user?.subscriptionStatus === "active" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[oklch(0.72_0.19_145/0.2)] flex items-center justify-center">
                      <Zap className="text-[oklch(0.72_0.19_145)]" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold">{user?.subscriptionPlan === "yearly" ? "Yearly" : "Monthly"} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        Next billing: {formatDate(user?.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    {user?.subscriptionStatus === "past_due"
                      ? "Please update your payment method to continue using KorProxy."
                      : "Upgrade to unlock all features and support KorProxy development."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {plan === "free" && (
              <button
                onClick={() => handleSubscribe("yearly")}
                disabled={loadingPlan !== null}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-glow disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp size={18} />
                  Upgrade to Pro
                </span>
                {loadingPlan === "yearly" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            )}
            {["active", "trialing", "past_due"].includes(user?.subscriptionStatus || "") && (
              <button
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-medium transition-all disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <CreditCard size={18} />
                  Manage Billing
                </span>
                {loadingPortal ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
              </button>
            )}
            <Link
              href="/dashboard/billing"
              className="w-full flex items-center justify-between px-4 py-3 border border-border rounded-xl font-medium hover:bg-muted/50 transition-all"
            >
              <span className="flex items-center gap-2">
                <CreditCard size={18} />
                View Billing Details
              </span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Profiles</h3>
              <p className="text-sm text-muted-foreground">AI configuration profiles</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-muted-foreground">
              / {entitlements?.limits.maxProfiles === -1 ? "∞" : entitlements?.limits.maxProfiles || 1}
            </span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: "0%" }} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.55_0.15_250/0.2)] flex items-center justify-center">
              <Layers className="text-[oklch(0.70_0.15_250)]" size={20} />
            </div>
            <div>
              <h3 className="font-semibold">Provider Groups</h3>
              <p className="text-sm text-muted-foreground">Connected AI providers</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">0</span>
            <span className="text-muted-foreground">
              / {entitlements?.limits.maxProviderGroups === -1 ? "∞" : entitlements?.limits.maxProviderGroups || 2}
            </span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-[oklch(0.70_0.15_250)] rounded-full" style={{ width: "0%" }} />
          </div>
        </div>
      </div>

      {entitlements?.teamName && (
        <div className="glass-card p-6 border-[oklch(0.55_0.15_250/0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.55_0.15_250/0.2)] flex items-center justify-center">
              <Users className="text-[oklch(0.70_0.15_250)]" size={20} />
            </div>
            <div>
              <p className="font-semibold text-[oklch(0.70_0.15_250)]">Team: {entitlements.teamName}</p>
              <p className="text-sm text-muted-foreground">Your access is provided through team membership</p>
            </div>
          </div>
        </div>
      )}

      <DownloadSectionWrapper
        hasAccess={["lifetime", "active", "trialing"].includes(user?.subscriptionStatus || "")}
      />
    </div>
  );
}

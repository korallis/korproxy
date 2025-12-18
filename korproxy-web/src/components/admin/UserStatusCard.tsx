"use client";

import { User, Mail, Calendar, CreditCard, Shield } from "lucide-react";

interface UserStatusCardProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    subscriptionStatus: string;
    subscriptionPlan?: string;
    currentPeriodEnd?: number;
    trialEnd?: number;
    cancelAtPeriodEnd?: boolean;
    stripeCustomerId?: string;
    createdAt: number;
    updatedAt?: number;
  };
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    none: "bg-muted text-muted-foreground",
    trialing: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]",
    active: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]",
    past_due: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]",
    canceled: "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.65_0.24_25)]",
    expired: "bg-muted text-muted-foreground",
    lifetime: "bg-primary/20 text-primary",
  };
  return classes[status] || "bg-muted text-muted-foreground";
}

export function UserStatusCard({ user }: UserStatusCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{user.name || "No name"}</h3>
            <p className="text-muted-foreground text-sm flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.role === "admin"
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {user.role}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Subscription
          </p>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(
              user.subscriptionStatus
            )}`}
          >
            {user.subscriptionStatus}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Plan
          </p>
          <p className="text-sm capitalize flex items-center gap-1">
            <CreditCard className="w-3 h-3 text-muted-foreground" />
            {user.subscriptionPlan || "None"}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Joined
          </p>
          <p className="text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {formatDate(user.createdAt)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            Period End
          </p>
          <p className="text-sm flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {user.currentPeriodEnd ? formatDate(user.currentPeriodEnd) : "N/A"}
          </p>
        </div>
      </div>

      {user.cancelAtPeriodEnd && (
        <div className="bg-[oklch(0.80_0.16_85/0.1)] border border-[oklch(0.80_0.16_85/0.3)] rounded-lg px-3 py-2">
          <p className="text-sm text-[oklch(0.80_0.16_85)]">
            ⚠️ Subscription will cancel at period end
          </p>
        </div>
      )}

      {user.stripeCustomerId && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Stripe: {user.stripeCustomerId}
        </div>
      )}
    </div>
  );
}

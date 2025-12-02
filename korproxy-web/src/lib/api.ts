import { ConvexReactClient } from "convex/react";
import { api } from "../../../korproxy-backend/convex/_generated/api";

interface AdminMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  expiredUsers: number;
  lifetimeUsers: number;
  monthlyMRR: number;
  annualizedRevenue: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
}

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  currentPeriodEnd?: number;
  createdAt: number;
}

interface SubscriptionEvent {
  id: string;
  userId: string;
  userEmail?: string;
  eventType: string;
  fromStatus?: string;
  toStatus: string;
  plan?: string;
  occurredAt: number;
}

export async function getMetrics(
  convex: ConvexReactClient,
  token: string
): Promise<AdminMetrics | { error: string }> {
  return convex.query(api.admin.getMetrics, { token });
}

export async function listUsers(
  convex: ConvexReactClient,
  token: string,
  limit?: number,
  offset?: number
): Promise<{ users: AdminUser[]; total: number } | { error: string }> {
  return convex.query(api.admin.listUsers, { token, limit, offset });
}

export async function getRecentEvents(
  convex: ConvexReactClient,
  token: string,
  limit?: number
): Promise<{ events: SubscriptionEvent[] } | { error: string }> {
  return convex.query(api.admin.getRecentEvents, { token, limit });
}

export function formatMoney(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

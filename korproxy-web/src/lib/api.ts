import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

// Device types and API functions
export interface Device {
  _id: string;
  _creationTime: number;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: "desktop" | "laptop" | "other";
  platform: "darwin" | "win32" | "linux";
  appVersion: string;
  lastSeenAt: number;
  createdAt: number;
}

export async function listDevices(
  convex: ConvexReactClient,
  token: string
): Promise<Device[] | null> {
  return convex.query(api.devices.listForUser, { token });
}

export async function removeDevice(
  convex: ConvexReactClient,
  token: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  return convex.mutation(api.devices.remove, { token, deviceId });
}

// Invite types and API functions
export interface InviteDetails {
  teamName: string;
  invitedEmail: string;
  role: "admin" | "member";
  status: string;
  expiresAt: number;
  isExpired: boolean;
}

export async function getInviteByToken(
  convex: ConvexReactClient,
  inviteToken: string
): Promise<InviteDetails | null> {
  return convex.query(api.invites.getByToken, { inviteToken });
}

export async function acceptInvite(
  convex: ConvexReactClient,
  token: string,
  inviteToken: string
): Promise<{ success: boolean; teamId?: string; error?: string }> {
  return convex.mutation(api.invites.accept, { token, inviteToken });
}

// Admin Feature Flags & Safe Mode types and API functions
export interface FeatureFlags {
  userId: string;
  flags: Record<string, boolean>;
  safeMode: boolean;
  safeModeProvider: string;
  updatedAt: number;
}

export interface AdminLog {
  id: string;
  userId: string;
  userEmail?: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface AdminUserDetail {
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
}

export async function searchUsers(
  convex: ConvexReactClient,
  token: string,
  query: string,
  limit?: number
): Promise<{ users: { id: string; email: string; name?: string; role: string; subscriptionStatus: string }[] } | { error: string }> {
  return convex.query(api.admin.searchUsers, { token, query, limit });
}

export async function getUserById(
  convex: ConvexReactClient,
  token: string,
  userId: string
): Promise<AdminUserDetail | { error: string } | null> {
  return convex.query(api.admin.getUserById, { token, userId: userId as Id<"users"> });
}

export async function getFeatureFlags(
  convex: ConvexReactClient,
  token: string,
  userId: string
): Promise<FeatureFlags | { error: string } | null> {
  return convex.query(api.admin.getFeatureFlags, { token, userId: userId as Id<"users"> });
}

export async function setFeatureFlag(
  convex: ConvexReactClient,
  token: string,
  userId: string,
  flagName: string,
  value: boolean
): Promise<{ success: boolean } | { error: string }> {
  return convex.mutation(api.admin.setFeatureFlag, { token, userId: userId as Id<"users">, flagName, value });
}

export async function enableSafeMode(
  convex: ConvexReactClient,
  token: string,
  userId: string,
  provider?: string
): Promise<{ success: boolean } | { error: string }> {
  return convex.mutation(api.admin.enableSafeMode, { token, userId: userId as Id<"users">, provider });
}

export async function disableSafeMode(
  convex: ConvexReactClient,
  token: string,
  userId: string
): Promise<{ success: boolean } | { error: string }> {
  return convex.mutation(api.admin.disableSafeMode, { token, userId: userId as Id<"users"> });
}

export async function getAdminLogs(
  convex: ConvexReactClient,
  token: string,
  userId?: string,
  limit?: number
): Promise<{ logs: AdminLog[] } | { error: string }> {
  return convex.query(api.admin.getAdminLogs, { token, userId: userId as Id<"users"> | undefined, limit });
}

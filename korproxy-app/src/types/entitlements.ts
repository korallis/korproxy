import { z } from 'zod'

export type Plan = 'free' | 'pro' | 'team'
export type EntitlementScope = 'personal' | 'team'
export type EntitlementStatus = 'active' | 'trialing' | 'grace' | 'past_due' | 'expired'

export interface PlanLimits {
  maxProfiles: number
  maxProviderGroups: number
  maxDevices: number
  smartRoutingEnabled: boolean
  analyticsRetentionDays: number
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProfiles: 1,
    maxProviderGroups: 2,
    maxDevices: 1,
    smartRoutingEnabled: false,
    analyticsRetentionDays: 7,
  },
  pro: {
    maxProfiles: 10,
    maxProviderGroups: 10,
    maxDevices: 3,
    smartRoutingEnabled: true,
    analyticsRetentionDays: 90,
  },
  team: {
    maxProfiles: Infinity,
    maxProviderGroups: Infinity,
    maxDevices: 5,
    smartRoutingEnabled: true,
    analyticsRetentionDays: 90,
  },
}

export interface Entitlements {
  plan: Plan
  scope: EntitlementScope
  teamId?: string
  status: EntitlementStatus
  limits: PlanLimits
  currentPeriodEnd?: number
  gracePeriodEnd?: number
}

export const EntitlementsSchema = z.object({
  plan: z.enum(['free', 'pro', 'team']),
  scope: z.enum(['personal', 'team']),
  teamId: z.string().optional(),
  status: z.enum(['active', 'trialing', 'grace', 'past_due', 'expired']),
  limits: z.object({
    maxProfiles: z.number(),
    maxProviderGroups: z.number(),
    maxDevices: z.number(),
    smartRoutingEnabled: z.boolean(),
    analyticsRetentionDays: z.number(),
  }),
  currentPeriodEnd: z.number().optional(),
  gracePeriodEnd: z.number().optional(),
})

export const DEFAULT_ENTITLEMENTS: Entitlements = {
  plan: 'free',
  scope: 'personal',
  status: 'active',
  limits: PLAN_LIMITS.free,
}

export type TeamRole = 'owner' | 'admin' | 'member'
export type TeamMemberStatus = 'active' | 'invited' | 'removed'
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked'
export type TeamSubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export interface Team {
  id: string
  name: string
  ownerUserId: string
  subscriptionStatus: TeamSubscriptionStatus
  seatsPurchased: number
  seatsUsed: number
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
  createdAt: number
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: TeamRole
  status: TeamMemberStatus
  joinedAt?: number
  user?: {
    id: string
    email: string
    name?: string
  }
}

export interface TeamInvite {
  id: string
  teamId: string
  invitedEmail: string
  inviterUserId: string
  role: 'admin' | 'member'
  status: InviteStatus
  token: string
  expiresAt: number
  createdAt: number
}

export interface Device {
  id: string
  userId: string
  deviceId: string
  deviceName: string
  deviceType: 'desktop' | 'laptop' | 'other'
  platform: 'darwin' | 'win32' | 'linux'
  appVersion: string
  lastSeenAt: number
  createdAt: number
}

export const GRACE_PERIOD_PAST_DUE_DAYS = 3
export const GRACE_PERIOD_OFFLINE_HOURS = 72

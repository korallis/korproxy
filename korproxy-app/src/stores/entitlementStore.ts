import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { convexClient } from '../lib/convex'
import { api } from '../../../korproxy-backend/convex/_generated/api'
import { DEFAULT_ENTITLEMENTS, PLAN_LIMITS, GRACE_PERIOD_OFFLINE_HOURS } from '../types/entitlements'
import type { Entitlements, Plan, PlanLimits } from '../types/entitlements'

interface ServerEntitlements {
  plan: Plan
  isActive: boolean
  inGracePeriod: boolean
  graceEndsAt?: number
  limits: {
    maxProfiles: number
    maxProviderGroups: number
    maxDevices: number
    smartRouting: boolean
    analyticsRetentionDays: number
  }
  teamId?: string
  teamName?: string
}

function mapServerToLocal(server: ServerEntitlements): Entitlements {
  return {
    plan: server.plan,
    scope: server.teamId ? 'team' : 'personal',
    teamId: server.teamId,
    status: server.inGracePeriod
      ? 'grace'
      : server.isActive
        ? 'active'
        : 'expired',
    limits: {
      maxProfiles: server.limits.maxProfiles === -1 ? Infinity : server.limits.maxProfiles,
      maxProviderGroups: server.limits.maxProviderGroups === -1 ? Infinity : server.limits.maxProviderGroups,
      maxDevices: server.limits.maxDevices,
      smartRoutingEnabled: server.limits.smartRouting,
      analyticsRetentionDays: server.limits.analyticsRetentionDays,
    },
    gracePeriodEnd: server.graceEndsAt,
  }
}

interface EntitlementState {
  entitlements: Entitlements
  lastSynced: number | null
  isOffline: boolean
  offlineGraceUntil: number | null
  syncError: string | null
  isSyncing: boolean
}

interface EntitlementActions {
  syncFromServer: (token: string) => Promise<boolean>
  checkFeature: (feature: keyof PlanLimits) => boolean
  checkLimit: (resource: 'profiles' | 'providerGroups' | 'devices', count: number) => boolean
  setOffline: (isOffline: boolean) => void
  reset: () => void
}

type EntitlementStore = EntitlementState & EntitlementActions

const OFFLINE_GRACE_MS = GRACE_PERIOD_OFFLINE_HOURS * 60 * 60 * 1000

export const useEntitlementStore = create<EntitlementStore>()(
  persist(
    (set, get) => ({
      entitlements: DEFAULT_ENTITLEMENTS,
      lastSynced: null,
      isOffline: false,
      offlineGraceUntil: null,
      syncError: null,
      isSyncing: false,

      syncFromServer: async (token: string) => {
        set({ isSyncing: true, syncError: null })
        try {
          const result = await convexClient.query(api.entitlements.get, { token })
          
          if (result) {
            const entitlements = mapServerToLocal(result as ServerEntitlements)
            set({
              entitlements,
              lastSynced: Date.now(),
              isOffline: false,
              offlineGraceUntil: null,
              isSyncing: false,
            })
            
            if (typeof window !== 'undefined' && window.korproxy?.entitlements) {
              window.korproxy.entitlements.set(entitlements)
            }
            
            return true
          } else {
            set({
              entitlements: DEFAULT_ENTITLEMENTS,
              lastSynced: Date.now(),
              isSyncing: false,
            })
            return true
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync entitlements'
          set({ syncError: errorMessage, isSyncing: false })
          
          const { lastSynced, isOffline } = get()
          if (!isOffline && lastSynced) {
            set({
              isOffline: true,
              offlineGraceUntil: lastSynced + OFFLINE_GRACE_MS,
            })
          }
          
          return false
        }
      },

      checkFeature: (feature: keyof PlanLimits) => {
        const { entitlements, isOffline, offlineGraceUntil } = get()
        
        if (isOffline && offlineGraceUntil && Date.now() > offlineGraceUntil) {
          return PLAN_LIMITS.free[feature] as boolean
        }
        
        const value = entitlements.limits[feature]
        return typeof value === 'boolean' ? value : true
      },

      checkLimit: (resource: 'profiles' | 'providerGroups' | 'devices', count: number) => {
        const { entitlements, isOffline, offlineGraceUntil } = get()
        
        const limitMap: Record<string, keyof PlanLimits> = {
          profiles: 'maxProfiles',
          providerGroups: 'maxProviderGroups',
          devices: 'maxDevices',
        }
        
        const limitKey = limitMap[resource]
        
        if (isOffline && offlineGraceUntil && Date.now() > offlineGraceUntil) {
          const freeLimit = PLAN_LIMITS.free[limitKey] as number
          return count < freeLimit
        }
        
        const limit = entitlements.limits[limitKey] as number
        return limit === Infinity || count < limit
      },

      setOffline: (isOffline: boolean) => {
        const { lastSynced } = get()
        if (isOffline && lastSynced) {
          set({
            isOffline: true,
            offlineGraceUntil: lastSynced + OFFLINE_GRACE_MS,
          })
        } else {
          set({
            isOffline,
            offlineGraceUntil: null,
          })
        }
      },

      reset: () => {
        set({
          entitlements: DEFAULT_ENTITLEMENTS,
          lastSynced: null,
          isOffline: false,
          offlineGraceUntil: null,
          syncError: null,
          isSyncing: false,
        })
        
        if (typeof window !== 'undefined' && window.korproxy?.entitlements) {
          window.korproxy.entitlements.set(DEFAULT_ENTITLEMENTS)
        }
      },
    }),
    {
      name: 'korproxy-entitlement-storage',
      partialize: (state) => ({
        entitlements: state.entitlements,
        lastSynced: state.lastSynced,
        isOffline: state.isOffline,
        offlineGraceUntil: state.offlineGraceUntil,
      }),
    }
  )
)

useEntitlementStore.subscribe((state, prevState) => {
  if (state.entitlements !== prevState.entitlements) {
    if (typeof window !== 'undefined' && window.korproxy?.entitlements) {
      window.korproxy.entitlements.set(state.entitlements)
    }
  }
})

import { useCallback, useEffect } from 'react'
import { useEntitlementStore } from '../stores/entitlementStore'
import { useAuthStore } from '../stores/authStore'
import type { PlanLimits, Plan } from '../types/entitlements'

export function useEntitlements() {
  const {
    entitlements,
    lastSynced,
    isOffline,
    offlineGraceUntil,
    syncError,
    isSyncing,
    syncFromServer,
    checkFeature,
    checkLimit,
  } = useEntitlementStore()

  const { token } = useAuthStore()

  useEffect(() => {
    if (token && !lastSynced) {
      syncFromServer(token)
    }
  }, [token, lastSynced, syncFromServer])

  useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      syncFromServer(token)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [token, syncFromServer])

  const hasFeature = useCallback(
    (feature: keyof PlanLimits) => checkFeature(feature),
    [checkFeature]
  )

  const canAddMore = useCallback(
    (resource: 'profiles' | 'providerGroups' | 'devices', currentCount: number) =>
      checkLimit(resource, currentCount),
    [checkLimit]
  )

  const isProOrTeam = entitlements.plan === 'pro' || entitlements.plan === 'team'

  const isPlan = useCallback(
    (plan: Plan) => entitlements.plan === plan,
    [entitlements.plan]
  )

  const refresh = useCallback(async () => {
    if (token) {
      return syncFromServer(token)
    }
    return false
  }, [token, syncFromServer])

  const checkGracePeriodExpired = useCallback(() => {
    if (!isOffline || offlineGraceUntil === null) return false
    return Date.now() > offlineGraceUntil
  }, [isOffline, offlineGraceUntil])

  return {
    entitlements,
    lastSynced,
    isOffline,
    offlineGraceUntil,
    syncError,
    isSyncing,
    hasFeature,
    canAddMore,
    isProOrTeam,
    isPlan,
    refresh,
    checkGracePeriodExpired,
  }
}

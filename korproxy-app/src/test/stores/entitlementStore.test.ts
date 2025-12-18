import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useEntitlementStore } from '../../stores/entitlementStore'
import { DEFAULT_ENTITLEMENTS, PLAN_LIMITS, GRACE_PERIOD_OFFLINE_HOURS } from '../../types/entitlements'

vi.mock('../../lib/convex', () => ({
  convexClient: {
    query: vi.fn(),
  },
}))

const { convexClient } = await import('../../lib/convex')

describe('entitlementStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useEntitlementStore.setState({
      entitlements: DEFAULT_ENTITLEMENTS,
      lastSynced: null,
      isOffline: false,
      offlineGraceUntil: null,
      syncError: null,
      isSyncing: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should start with default free plan entitlements', () => {
      const state = useEntitlementStore.getState()
      expect(state.entitlements).toEqual(DEFAULT_ENTITLEMENTS)
      expect(state.entitlements.plan).toBe('free')
    })

    it('should have null lastSynced initially', () => {
      const state = useEntitlementStore.getState()
      expect(state.lastSynced).toBeNull()
    })

    it('should not be offline initially', () => {
      const state = useEntitlementStore.getState()
      expect(state.isOffline).toBe(false)
    })
  })

  describe('checkFeature', () => {
    it('should return false for smartRoutingEnabled on free plan', () => {
      const result = useEntitlementStore.getState().checkFeature('smartRoutingEnabled')
      expect(result).toBe(false)
    })

    it('should return true for smartRoutingEnabled on pro plan', () => {
      useEntitlementStore.setState({
        entitlements: {
          ...DEFAULT_ENTITLEMENTS,
          plan: 'pro',
          limits: PLAN_LIMITS.pro,
        },
      })
      const result = useEntitlementStore.getState().checkFeature('smartRoutingEnabled')
      expect(result).toBe(true)
    })

    it('should return true for smartRoutingEnabled on team plan', () => {
      useEntitlementStore.setState({
        entitlements: {
          ...DEFAULT_ENTITLEMENTS,
          plan: 'team',
          limits: PLAN_LIMITS.team,
        },
      })
      const result = useEntitlementStore.getState().checkFeature('smartRoutingEnabled')
      expect(result).toBe(true)
    })

    it('should return true for numeric features (they exist)', () => {
      const result = useEntitlementStore.getState().checkFeature('maxProfiles')
      expect(result).toBe(true)
    })

    describe('offline grace period', () => {
      it('should return free plan features when offline grace period has expired', () => {
        vi.useFakeTimers()
        const now = Date.now()
        vi.setSystemTime(now)

        useEntitlementStore.setState({
          entitlements: {
            ...DEFAULT_ENTITLEMENTS,
            plan: 'pro',
            limits: PLAN_LIMITS.pro,
          },
          isOffline: true,
          offlineGraceUntil: now - 1000,
        })

        const result = useEntitlementStore.getState().checkFeature('smartRoutingEnabled')
        expect(result).toBe(PLAN_LIMITS.free.smartRoutingEnabled)
      })

      it('should return actual features when offline but within grace period', () => {
        vi.useFakeTimers()
        const now = Date.now()
        vi.setSystemTime(now)

        useEntitlementStore.setState({
          entitlements: {
            ...DEFAULT_ENTITLEMENTS,
            plan: 'pro',
            limits: PLAN_LIMITS.pro,
          },
          isOffline: true,
          offlineGraceUntil: now + 1000000,
        })

        const result = useEntitlementStore.getState().checkFeature('smartRoutingEnabled')
        expect(result).toBe(true)
      })
    })
  })

  describe('checkLimit', () => {
    it('should return true when count is below free plan limit for profiles', () => {
      const result = useEntitlementStore.getState().checkLimit('profiles', 0)
      expect(result).toBe(true)
    })

    it('should return false when count equals or exceeds free plan limit for profiles', () => {
      const result = useEntitlementStore.getState().checkLimit('profiles', 1)
      expect(result).toBe(false)
    })

    it('should return true when count is below pro plan limit for profiles', () => {
      useEntitlementStore.setState({
        entitlements: {
          ...DEFAULT_ENTITLEMENTS,
          plan: 'pro',
          limits: PLAN_LIMITS.pro,
        },
      })
      const result = useEntitlementStore.getState().checkLimit('profiles', 5)
      expect(result).toBe(true)
    })

    it('should handle team plan with Infinity limits', () => {
      useEntitlementStore.setState({
        entitlements: {
          ...DEFAULT_ENTITLEMENTS,
          plan: 'team',
          limits: PLAN_LIMITS.team,
        },
      })
      const result = useEntitlementStore.getState().checkLimit('profiles', 1000)
      expect(result).toBe(true)
    })

    it('should check providerGroups limit correctly', () => {
      const result = useEntitlementStore.getState().checkLimit('providerGroups', 1)
      expect(result).toBe(true)
      
      const result2 = useEntitlementStore.getState().checkLimit('providerGroups', 2)
      expect(result2).toBe(false)
    })

    it('should check devices limit correctly', () => {
      const result = useEntitlementStore.getState().checkLimit('devices', 0)
      expect(result).toBe(true)
      
      const result2 = useEntitlementStore.getState().checkLimit('devices', 1)
      expect(result2).toBe(false)
    })

    describe('offline grace period', () => {
      it('should fall back to free limits when offline grace expired', () => {
        vi.useFakeTimers()
        const now = Date.now()
        vi.setSystemTime(now)

        useEntitlementStore.setState({
          entitlements: {
            ...DEFAULT_ENTITLEMENTS,
            plan: 'pro',
            limits: PLAN_LIMITS.pro,
          },
          isOffline: true,
          offlineGraceUntil: now - 1000,
        })

        const result = useEntitlementStore.getState().checkLimit('profiles', 5)
        expect(result).toBe(false)
      })
    })
  })

  describe('syncFromServer', () => {
    it('should update state on successful sync', async () => {
      const mockServerResponse = {
        plan: 'pro' as const,
        isActive: true,
        inGracePeriod: false,
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRouting: true,
          analyticsRetentionDays: 90,
        },
      }

      vi.mocked(convexClient.query).mockResolvedValueOnce(mockServerResponse)

      const result = await useEntitlementStore.getState().syncFromServer('test-token')

      expect(result).toBe(true)
      const state = useEntitlementStore.getState()
      expect(state.entitlements.plan).toBe('pro')
      expect(state.entitlements.limits.maxProfiles).toBe(10)
      expect(state.entitlements.limits.smartRoutingEnabled).toBe(true)
      expect(state.lastSynced).not.toBeNull()
      expect(state.isOffline).toBe(false)
      expect(state.isSyncing).toBe(false)
    })

    it('should set default entitlements when server returns null', async () => {
      vi.mocked(convexClient.query).mockResolvedValueOnce(null)

      const result = await useEntitlementStore.getState().syncFromServer('test-token')

      expect(result).toBe(true)
      const state = useEntitlementStore.getState()
      expect(state.entitlements).toEqual(DEFAULT_ENTITLEMENTS)
    })

    it('should handle team scope when teamId is present', async () => {
      const mockServerResponse = {
        plan: 'team' as const,
        isActive: true,
        inGracePeriod: false,
        teamId: 'team-123',
        teamName: 'Test Team',
        limits: {
          maxProfiles: -1,
          maxProviderGroups: -1,
          maxDevices: 5,
          smartRouting: true,
          analyticsRetentionDays: 90,
        },
      }

      vi.mocked(convexClient.query).mockResolvedValueOnce(mockServerResponse)

      await useEntitlementStore.getState().syncFromServer('test-token')

      const state = useEntitlementStore.getState()
      expect(state.entitlements.scope).toBe('team')
      expect(state.entitlements.teamId).toBe('team-123')
      expect(state.entitlements.limits.maxProfiles).toBe(Infinity)
    })

    it('should handle grace period status', async () => {
      const mockServerResponse = {
        plan: 'pro' as const,
        isActive: false,
        inGracePeriod: true,
        graceEndsAt: Date.now() + 86400000,
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRouting: true,
          analyticsRetentionDays: 90,
        },
      }

      vi.mocked(convexClient.query).mockResolvedValueOnce(mockServerResponse)

      await useEntitlementStore.getState().syncFromServer('test-token')

      const state = useEntitlementStore.getState()
      expect(state.entitlements.status).toBe('grace')
    })

    it('should set sync error and offline state on failure', async () => {
      vi.mocked(convexClient.query).mockRejectedValueOnce(new Error('Network error'))

      useEntitlementStore.setState({ lastSynced: Date.now() })

      const result = await useEntitlementStore.getState().syncFromServer('test-token')

      expect(result).toBe(false)
      const state = useEntitlementStore.getState()
      expect(state.syncError).toBe('Network error')
      expect(state.isOffline).toBe(true)
      expect(state.offlineGraceUntil).not.toBeNull()
    })

    it('should set isSyncing during sync', async () => {
      let syncingDuringRequest = false
      
      vi.mocked(convexClient.query).mockImplementationOnce(async () => {
        syncingDuringRequest = useEntitlementStore.getState().isSyncing
        return null
      })

      await useEntitlementStore.getState().syncFromServer('test-token')

      expect(syncingDuringRequest).toBe(true)
      expect(useEntitlementStore.getState().isSyncing).toBe(false)
    })
  })

  describe('setOffline', () => {
    it('should set offline state with grace period when lastSynced exists', () => {
      const lastSynced = Date.now()
      useEntitlementStore.setState({ lastSynced })

      useEntitlementStore.getState().setOffline(true)

      const state = useEntitlementStore.getState()
      expect(state.isOffline).toBe(true)
      expect(state.offlineGraceUntil).toBe(lastSynced + GRACE_PERIOD_OFFLINE_HOURS * 60 * 60 * 1000)
    })

    it('should clear offline state when set to false', () => {
      useEntitlementStore.setState({
        isOffline: true,
        offlineGraceUntil: Date.now() + 1000000,
      })

      useEntitlementStore.getState().setOffline(false)

      const state = useEntitlementStore.getState()
      expect(state.isOffline).toBe(false)
      expect(state.offlineGraceUntil).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset all state to defaults', () => {
      useEntitlementStore.setState({
        entitlements: {
          ...DEFAULT_ENTITLEMENTS,
          plan: 'pro',
          limits: PLAN_LIMITS.pro,
        },
        lastSynced: Date.now(),
        isOffline: true,
        offlineGraceUntil: Date.now() + 1000000,
        syncError: 'Some error',
        isSyncing: true,
      })

      useEntitlementStore.getState().reset()

      const state = useEntitlementStore.getState()
      expect(state.entitlements).toEqual(DEFAULT_ENTITLEMENTS)
      expect(state.lastSynced).toBeNull()
      expect(state.isOffline).toBe(false)
      expect(state.offlineGraceUntil).toBeNull()
      expect(state.syncError).toBeNull()
      expect(state.isSyncing).toBe(false)
    })
  })
})

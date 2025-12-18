import { describe, it, expect } from 'vitest'
import {
  PLAN_LIMITS,
  DEFAULT_ENTITLEMENTS,
  EntitlementsSchema,
  GRACE_PERIOD_PAST_DUE_DAYS,
  GRACE_PERIOD_OFFLINE_HOURS,
} from '../../types/entitlements'

describe('entitlements types', () => {
  describe('PLAN_LIMITS', () => {
    describe('free plan', () => {
      it('should have correct maxProfiles limit', () => {
        expect(PLAN_LIMITS.free.maxProfiles).toBe(1)
      })

      it('should have correct maxProviderGroups limit', () => {
        expect(PLAN_LIMITS.free.maxProviderGroups).toBe(2)
      })

      it('should have correct maxDevices limit', () => {
        expect(PLAN_LIMITS.free.maxDevices).toBe(1)
      })

      it('should have smartRouting disabled', () => {
        expect(PLAN_LIMITS.free.smartRoutingEnabled).toBe(false)
      })

      it('should have 7 days analytics retention', () => {
        expect(PLAN_LIMITS.free.analyticsRetentionDays).toBe(7)
      })
    })

    describe('pro plan', () => {
      it('should have correct maxProfiles limit', () => {
        expect(PLAN_LIMITS.pro.maxProfiles).toBe(10)
      })

      it('should have correct maxProviderGroups limit', () => {
        expect(PLAN_LIMITS.pro.maxProviderGroups).toBe(10)
      })

      it('should have correct maxDevices limit', () => {
        expect(PLAN_LIMITS.pro.maxDevices).toBe(3)
      })

      it('should have smartRouting enabled', () => {
        expect(PLAN_LIMITS.pro.smartRoutingEnabled).toBe(true)
      })

      it('should have 90 days analytics retention', () => {
        expect(PLAN_LIMITS.pro.analyticsRetentionDays).toBe(90)
      })
    })

    describe('team plan', () => {
      it('should have unlimited maxProfiles', () => {
        expect(PLAN_LIMITS.team.maxProfiles).toBe(Infinity)
      })

      it('should have unlimited maxProviderGroups', () => {
        expect(PLAN_LIMITS.team.maxProviderGroups).toBe(Infinity)
      })

      it('should have correct maxDevices limit', () => {
        expect(PLAN_LIMITS.team.maxDevices).toBe(5)
      })

      it('should have smartRouting enabled', () => {
        expect(PLAN_LIMITS.team.smartRoutingEnabled).toBe(true)
      })

      it('should have 90 days analytics retention', () => {
        expect(PLAN_LIMITS.team.analyticsRetentionDays).toBe(90)
      })
    })

    it('should have all three plan types', () => {
      expect(Object.keys(PLAN_LIMITS)).toEqual(['free', 'pro', 'team'])
    })
  })

  describe('DEFAULT_ENTITLEMENTS', () => {
    it('should have free plan', () => {
      expect(DEFAULT_ENTITLEMENTS.plan).toBe('free')
    })

    it('should have personal scope', () => {
      expect(DEFAULT_ENTITLEMENTS.scope).toBe('personal')
    })

    it('should have active status', () => {
      expect(DEFAULT_ENTITLEMENTS.status).toBe('active')
    })

    it('should have free plan limits', () => {
      expect(DEFAULT_ENTITLEMENTS.limits).toEqual(PLAN_LIMITS.free)
    })

    it('should not have teamId', () => {
      expect(DEFAULT_ENTITLEMENTS.teamId).toBeUndefined()
    })

    it('should not have currentPeriodEnd', () => {
      expect(DEFAULT_ENTITLEMENTS.currentPeriodEnd).toBeUndefined()
    })

    it('should not have gracePeriodEnd', () => {
      expect(DEFAULT_ENTITLEMENTS.gracePeriodEnd).toBeUndefined()
    })
  })

  describe('EntitlementsSchema', () => {
    it('should validate valid entitlements', () => {
      const validEntitlements = {
        plan: 'pro',
        scope: 'personal',
        status: 'active',
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
      }

      const result = EntitlementsSchema.safeParse(validEntitlements)
      expect(result.success).toBe(true)
    })

    it('should validate entitlements with optional fields', () => {
      const entitlementsWithOptionals = {
        plan: 'team',
        scope: 'team',
        teamId: 'team-123',
        status: 'active',
        limits: {
          maxProfiles: 100,
          maxProviderGroups: 100,
          maxDevices: 5,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
        currentPeriodEnd: 1735689600000,
        gracePeriodEnd: 1735776000000,
      }

      const result = EntitlementsSchema.safeParse(entitlementsWithOptionals)
      expect(result.success).toBe(true)
    })

    it('should reject invalid plan type', () => {
      const invalidEntitlements = {
        plan: 'enterprise',
        scope: 'personal',
        status: 'active',
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
      }

      const result = EntitlementsSchema.safeParse(invalidEntitlements)
      expect(result.success).toBe(false)
    })

    it('should reject invalid scope', () => {
      const invalidEntitlements = {
        plan: 'pro',
        scope: 'organization',
        status: 'active',
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
      }

      const result = EntitlementsSchema.safeParse(invalidEntitlements)
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const invalidEntitlements = {
        plan: 'pro',
        scope: 'personal',
        status: 'invalid_status',
        limits: {
          maxProfiles: 10,
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
      }

      const result = EntitlementsSchema.safeParse(invalidEntitlements)
      expect(result.success).toBe(false)
    })

    it('should reject missing required limits', () => {
      const invalidEntitlements = {
        plan: 'pro',
        scope: 'personal',
        status: 'active',
        limits: {
          maxProfiles: 10,
        },
      }

      const result = EntitlementsSchema.safeParse(invalidEntitlements)
      expect(result.success).toBe(false)
    })

    it('should reject invalid limit types', () => {
      const invalidEntitlements = {
        plan: 'pro',
        scope: 'personal',
        status: 'active',
        limits: {
          maxProfiles: 'unlimited',
          maxProviderGroups: 10,
          maxDevices: 3,
          smartRoutingEnabled: true,
          analyticsRetentionDays: 90,
        },
      }

      const result = EntitlementsSchema.safeParse(invalidEntitlements)
      expect(result.success).toBe(false)
    })

    it('should validate all valid status types', () => {
      const statuses = ['active', 'trialing', 'grace', 'past_due', 'expired'] as const

      for (const status of statuses) {
        const entitlements = {
          plan: 'pro',
          scope: 'personal',
          status,
          limits: {
            maxProfiles: 10,
            maxProviderGroups: 10,
            maxDevices: 3,
            smartRoutingEnabled: true,
            analyticsRetentionDays: 90,
          },
        }

        const result = EntitlementsSchema.safeParse(entitlements)
        expect(result.success).toBe(true)
      }
    })

    it('should validate DEFAULT_ENTITLEMENTS', () => {
      const result = EntitlementsSchema.safeParse(DEFAULT_ENTITLEMENTS)
      expect(result.success).toBe(true)
    })
  })

  describe('grace period constants', () => {
    it('should have GRACE_PERIOD_PAST_DUE_DAYS as 3', () => {
      expect(GRACE_PERIOD_PAST_DUE_DAYS).toBe(3)
    })

    it('should have GRACE_PERIOD_OFFLINE_HOURS as 72', () => {
      expect(GRACE_PERIOD_OFFLINE_HOURS).toBe(72)
    })
  })
})

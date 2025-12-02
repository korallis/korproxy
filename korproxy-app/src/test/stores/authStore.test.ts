import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore, hasActiveSubscription } from '../../stores/authStore'

vi.mock('../../lib/convex', () => ({
  convexClient: {
    mutation: vi.fn(),
    query: vi.fn(),
  },
}))

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      subscriptionInfo: null,
      isLoading: false,
      error: null,
    })
  })

  describe('logout', () => {
    it('clears user state on logout', async () => {
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          role: 'user',
          subscriptionStatus: 'active',
        },
        token: 'test-token',
        subscriptionInfo: {
          status: 'active',
          isActive: true,
        },
      })

      await useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.subscriptionInfo).toBeNull()
      expect(state.error).toBeNull()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears the error state', () => {
      useAuthStore.setState({ error: 'Some error' })

      useAuthStore.getState().clearError()

      expect(useAuthStore.getState().error).toBeNull()
    })
  })

  describe('setLoading', () => {
    it('sets loading to true', () => {
      useAuthStore.getState().setLoading(true)

      expect(useAuthStore.getState().isLoading).toBe(true)
    })

    it('sets loading to false', () => {
      useAuthStore.setState({ isLoading: true })
      useAuthStore.getState().setLoading(false)

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})

describe('hasActiveSubscription', () => {
  it('returns false for null subscription info', () => {
    expect(hasActiveSubscription(null)).toBe(false)
  })

  it('returns true when isActive is true', () => {
    expect(
      hasActiveSubscription({
        status: 'active',
        isActive: true,
      })
    ).toBe(true)
  })

  it('returns false when isActive is false', () => {
    expect(
      hasActiveSubscription({
        status: 'expired',
        isActive: false,
      })
    ).toBe(false)
  })

  it('returns true for trial with isActive true', () => {
    expect(
      hasActiveSubscription({
        status: 'trial',
        isActive: true,
        daysLeft: 7,
      })
    ).toBe(true)
  })

  it('returns true for lifetime subscription', () => {
    expect(
      hasActiveSubscription({
        status: 'lifetime',
        isActive: true,
      })
    ).toBe(true)
  })

  it('returns false for canceled subscription', () => {
    expect(
      hasActiveSubscription({
        status: 'canceled',
        isActive: false,
      })
    ).toBe(false)
  })

  it('returns false for no_subscription status', () => {
    expect(
      hasActiveSubscription({
        status: 'no_subscription',
        isActive: false,
      })
    ).toBe(false)
  })
})

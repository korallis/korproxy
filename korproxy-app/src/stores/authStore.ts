import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { convexClient } from '../lib/convex'
import { api } from '../../../korproxy-backend/convex/_generated/api'

type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' | 'lifetime'

interface User {
  id: string
  email: string
  name?: string
  role: 'user' | 'admin'
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan?: 'monthly' | 'yearly'
  trialEnd?: number
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
}

interface SubscriptionInfo {
  status: 'active' | 'trial' | 'expired' | 'no_subscription' | 'past_due' | 'lifetime' | 'canceled'
  plan?: 'monthly' | 'yearly'
  trialEnd?: number
  currentPeriodEnd?: number
  cancelAtPeriodEnd?: boolean
  isActive: boolean
  daysLeft?: number
}

interface AuthState {
  user: User | null
  token: string | null
  subscriptionInfo: SubscriptionInfo | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  checkSubscription: () => Promise<SubscriptionInfo | null>
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      subscriptionInfo: null,
      isLoading: true,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await convexClient.mutation(api.auth.login, { email, password })
          if (result.success && result.token) {
            set({ token: result.token })
            await get().refreshUser()
            return { success: true }
          }
          const error = result.error || 'Login failed'
          set({ error, isLoading: false })
          return { success: false, error }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Login failed'
          set({ error, isLoading: false })
          return { success: false, error }
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null })
        try {
          const result = await convexClient.mutation(api.auth.register, { email, password, name })
          if (result.success && result.token) {
            set({ token: result.token })
            await get().refreshUser()
            return { success: true }
          }
          const error = result.error || 'Registration failed'
          set({ error, isLoading: false })
          return { success: false, error }
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Registration failed'
          set({ error, isLoading: false })
          return { success: false, error }
        }
      },

      logout: async () => {
        const { token } = get()
        if (token) {
          try {
            await convexClient.mutation(api.auth.logout, { token })
          } catch {
            // Ignore errors on logout
          }
        }
        set({ user: null, token: null, subscriptionInfo: null, error: null, isLoading: false })
      },

      refreshUser: async () => {
        const { token } = get()
        if (!token) {
          set({ user: null, subscriptionInfo: null, isLoading: false })
          return
        }

        set({ isLoading: true })
        try {
          const result = await convexClient.query(api.auth.validateToken, { token })
          if (!result.valid) {
            set({ user: null, token: null, subscriptionInfo: null, isLoading: false })
            return
          }

          const userData = await convexClient.query(api.auth.me, { token })
          if (userData) {
            set({ user: userData as User })
            await get().checkSubscription()
          } else {
            set({ user: null, token: null, subscriptionInfo: null })
          }
        } catch {
          set({ user: null, token: null, subscriptionInfo: null })
        } finally {
          set({ isLoading: false })
        }
      },

      checkSubscription: async () => {
        const { token } = get()
        if (!token) return null

        try {
          const status = await convexClient.query(api.subscriptions.getStatus, { token })
          set({ subscriptionInfo: status })
          return status
        } catch {
          return null
        }
      },

      clearError: () => set({ error: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'korproxy-auth-storage',
      partialize: (state) => ({
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.refreshUser()
        } else {
          state?.setLoading(false)
        }
      },
    }
  )
)

export function hasActiveSubscription(info: SubscriptionInfo | null): boolean {
  if (!info) return false
  return info.isActive
}

// Sync subscription status to main process for enforcement
function syncSubscriptionToMain(info: SubscriptionInfo | null): void {
  if (typeof window !== 'undefined' && window.korproxy?.subscription) {
    const isValid = info?.isActive ?? false
    const expiresAt = info?.currentPeriodEnd || info?.trialEnd
    window.korproxy.subscription.setStatus({ isValid, expiresAt })
  }
}

// Subscribe to store changes and sync to main process
useAuthStore.subscribe((state, prevState) => {
  if (state.subscriptionInfo !== prevState.subscriptionInfo) {
    syncSubscriptionToMain(state.subscriptionInfo)
  }
})

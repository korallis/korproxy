import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProxyStore } from '../../hooks/useProxy'
import { useAuthStore } from '../../stores/authStore'
import { mockKorproxyAPI } from '../setup'

describe('useProxyStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useProxyStore.setState({
      running: false,
      port: 1337,
      logs: [],
    })
    useAuthStore.setState({
      user: null,
      token: null,
      subscriptionInfo: null,
      isLoading: false,
      error: null,
    })
  })

  describe('start', () => {
    it('returns error when user is not signed in', async () => {
      const result = await useProxyStore.getState().start()

      expect(result).toEqual({
        success: false,
        error: 'Please sign in to use KorProxy',
        requiresSubscription: true,
      })
      expect(mockKorproxyAPI.proxy.start).not.toHaveBeenCalled()
    })

    it('returns error when subscription is not active', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'expired' },
        subscriptionInfo: { status: 'expired', isActive: false },
      })

      const result = await useProxyStore.getState().start()

      expect(result).toEqual({
        success: false,
        error: 'Active subscription required',
        requiresSubscription: true,
      })
      expect(mockKorproxyAPI.proxy.start).not.toHaveBeenCalled()
    })

    it('calls proxy.start when user has active subscription', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'active' },
        subscriptionInfo: { status: 'active', isActive: true },
      })
      mockKorproxyAPI.proxy.start.mockResolvedValue({ success: true })

      const result = await useProxyStore.getState().start()

      expect(result).toEqual({ success: true })
      expect(mockKorproxyAPI.proxy.start).toHaveBeenCalled()
      expect(useProxyStore.getState().running).toBe(true)
    })

    it('returns error when proxy.start fails', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'active' },
        subscriptionInfo: { status: 'active', isActive: true },
      })
      mockKorproxyAPI.proxy.start.mockResolvedValue({ success: false, error: 'Port in use' })

      const result = await useProxyStore.getState().start()

      expect(result).toEqual({ success: false, error: 'Port in use' })
      expect(useProxyStore.getState().running).toBe(false)
    })

    it('allows start for trial subscription', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'trialing' },
        subscriptionInfo: { status: 'trial', isActive: true, daysLeft: 7 },
      })
      mockKorproxyAPI.proxy.start.mockResolvedValue({ success: true })

      const result = await useProxyStore.getState().start()

      expect(result).toEqual({ success: true })
      expect(mockKorproxyAPI.proxy.start).toHaveBeenCalled()
    })
  })

  describe('stop', () => {
    it('calls proxy.stop and sets running to false', async () => {
      useProxyStore.setState({ running: true })
      mockKorproxyAPI.proxy.stop.mockResolvedValue({ success: true })

      await useProxyStore.getState().stop()

      expect(mockKorproxyAPI.proxy.stop).toHaveBeenCalled()
      expect(useProxyStore.getState().running).toBe(false)
    })
  })

  describe('restart', () => {
    it('returns error when user is not signed in', async () => {
      const result = await useProxyStore.getState().restart()

      expect(result).toEqual({
        success: false,
        error: 'Please sign in to use KorProxy',
        requiresSubscription: true,
      })
    })

    it('returns error when subscription is not active', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'expired' },
        subscriptionInfo: { status: 'expired', isActive: false },
      })

      const result = await useProxyStore.getState().restart()

      expect(result).toEqual({
        success: false,
        error: 'Active subscription required',
        requiresSubscription: true,
      })
    })

    it('calls proxy.restart when user has active subscription', async () => {
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', role: 'user', subscriptionStatus: 'active' },
        subscriptionInfo: { status: 'active', isActive: true },
      })
      mockKorproxyAPI.proxy.restart.mockResolvedValue({ success: true })

      const result = await useProxyStore.getState().restart()

      expect(result).toEqual({ success: true })
      expect(mockKorproxyAPI.proxy.restart).toHaveBeenCalled()
      expect(useProxyStore.getState().running).toBe(true)
    })
  })

  describe('clearLogs', () => {
    it('clears all logs', () => {
      useProxyStore.setState({
        logs: [
          { timestamp: '2024-01-01', level: 'info', message: 'Test log' },
        ],
      })

      useProxyStore.getState().clearLogs()

      expect(useProxyStore.getState().logs).toEqual([])
    })
  })

  describe('addLog', () => {
    it('adds a log entry', () => {
      const log = { timestamp: '2024-01-01', level: 'info' as const, message: 'New log' }

      useProxyStore.getState().addLog(log)

      expect(useProxyStore.getState().logs).toContainEqual(log)
    })

    it('limits logs to 5000 entries', () => {
      const logs = Array.from({ length: 5000 }, (_, i) => ({
        timestamp: `2024-01-01T00:00:${i}`,
        level: 'info' as const,
        message: `Log ${i}`,
      }))
      useProxyStore.setState({ logs })

      useProxyStore.getState().addLog({ timestamp: '2024-01-02', level: 'info', message: 'New log' })

      const state = useProxyStore.getState()
      expect(state.logs).toHaveLength(5000)
      expect(state.logs[state.logs.length - 1].message).toBe('New log')
    })
  })

  describe('setStatus', () => {
    it('updates running and port status', () => {
      useProxyStore.getState().setStatus({ running: true, port: 8080 })

      const state = useProxyStore.getState()
      expect(state.running).toBe(true)
      expect(state.port).toBe(8080)
    })
  })
})

import { useEffect } from 'react'
import { create } from 'zustand'
import { proxyApi } from '../lib/api'
import { useAuthStore, hasActiveSubscription } from '../stores/authStore'
import type { ProxyLog, ProxyStatus, LogData } from '../types/electron'

type StartResult = { success: true } | { success: false; error: string; requiresSubscription?: boolean }

interface ProxyState {
  running: boolean
  port: number
  logs: ProxyLog[]
  start: () => Promise<StartResult>
  stop: () => Promise<void>
  restart: () => Promise<StartResult>
  clearLogs: () => void
  addLog: (log: ProxyLog) => void
  setStatus: (status: ProxyStatus) => void
}

export const useProxyStore = create<ProxyState>((set) => ({
  running: false,
  port: 1337,
  logs: [],

  start: async () => {
    if (!window.korproxy) return { success: false, error: 'Not in Electron environment' }
    
    const authState = useAuthStore.getState()
    const subscriptionInfo = authState.subscriptionInfo

    if (!authState.user) {
      return { success: false, error: 'Please sign in to use KorProxy', requiresSubscription: true }
    }

    if (!hasActiveSubscription(subscriptionInfo)) {
      return { success: false, error: 'Active subscription required', requiresSubscription: true }
    }

    const result = await window.korproxy.proxy.start()
    if (result.success) {
      set({ running: true })
      return { success: true }
    }
    return { success: false, error: result.error || 'Failed to start proxy' }
  },

  stop: async () => {
    if (!window.korproxy) return
    const result = await window.korproxy.proxy.stop()
    if (result.success) {
      set({ running: false })
    }
  },

  restart: async () => {
    if (!window.korproxy) return { success: false, error: 'Not in Electron environment' }

    const authState = useAuthStore.getState()
    const subscriptionInfo = authState.subscriptionInfo

    if (!authState.user) {
      return { success: false, error: 'Please sign in to use KorProxy', requiresSubscription: true }
    }

    if (!hasActiveSubscription(subscriptionInfo)) {
      return { success: false, error: 'Active subscription required', requiresSubscription: true }
    }

    const result = await window.korproxy.proxy.restart()
    if (result.success) {
      set({ running: true })
      return { success: true }
    }
    return { success: false, error: result.error || 'Failed to restart proxy' }
  },

  clearLogs: () => set({ logs: [] }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-4999), log],
    })),

  setStatus: (status) => {
    proxyApi.setPort(status.port)
    set({
      running: status.running,
      port: status.port,
    })
  },
}))

export function useProxy() {
  const store = useProxyStore()

  useEffect(() => {
    if (!window.korproxy) return

    window.korproxy.proxy.getStatus().then(store.setStatus)

    const unsubLog = window.korproxy.proxy.onLog((data: LogData) => {
      const log: ProxyLog = {
        timestamp: data.timestamp || new Date().toISOString(),
        level: data.type === 'stderr' ? 'error' : 'info',
        message: data.message,
      }
      store.addLog(log)
    })
    const unsubStatus = window.korproxy.proxy.onStatusChange(store.setStatus)

    return () => {
      unsubLog()
      unsubStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return store
}

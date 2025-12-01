import { useEffect } from 'react'
import { create } from 'zustand'
import type { ProxyLog, ProxyStatus } from '../types/electron'

interface ProxyState {
  running: boolean
  port: number
  logs: ProxyLog[]
  start: () => Promise<void>
  stop: () => Promise<void>
  restart: () => Promise<void>
  clearLogs: () => void
  addLog: (log: ProxyLog) => void
  setStatus: (status: ProxyStatus) => void
}

export const useProxyStore = create<ProxyState>((set) => ({
  running: false,
  port: 8080,
  logs: [],

  start: async () => {
    if (!window.korproxy) return
    const result = await window.korproxy.proxy.start()
    if (result.success) {
      set({ running: true })
    }
  },

  stop: async () => {
    if (!window.korproxy) return
    const result = await window.korproxy.proxy.stop()
    if (result.success) {
      set({ running: false })
    }
  },

  restart: async () => {
    if (!window.korproxy) return
    const result = await window.korproxy.proxy.restart()
    if (result.success) {
      set({ running: true })
    }
  },

  clearLogs: () => set({ logs: [] }),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs.slice(-999), log],
    })),

  setStatus: (status) =>
    set({
      running: status.running,
      port: status.port,
    }),
}))

export function useProxy() {
  const store = useProxyStore()

  useEffect(() => {
    if (!window.korproxy) return

    window.korproxy.proxy.getStatus().then(store.setStatus)

    const unsubLog = window.korproxy.proxy.onLog(store.addLog)
    const unsubStatus = window.korproxy.proxy.onStatusChange(store.setStatus)

    return () => {
      unsubLog()
      unsubStatus()
    }
  }, [])

  return store
}

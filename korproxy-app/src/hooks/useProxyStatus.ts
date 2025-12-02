import { useEffect } from 'react'
import { create } from 'zustand'

interface ProxyStatusState {
  isRunning: boolean
  isConnecting: boolean
  error: string | null
  version: string | null
  port: number
  setRunning: (running: boolean) => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
  setPort: (port: number) => void
}

export const useProxyStatusStore = create<ProxyStatusState>((set) => ({
  isRunning: false,
  isConnecting: false,
  error: null,
  version: null,
  port: 1337,

  setRunning: (running) => set({ isRunning: running, error: null }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setError: (error) => set({ error, isRunning: false }),
  setPort: (port) => set({ port }),
}))

export function useProxyStatus() {
  const store = useProxyStatusStore()

  useEffect(() => {
    if (!window.korproxy) return

    const initSettings = async () => {
      const settings = await window.korproxy.app.getSettings()
      store.setPort(settings.port)
    }

    const checkStatus = async () => {
      const status = await window.korproxy.proxy.status()
      store.setRunning(status.running)
    }

    initSettings()
    checkStatus()

    // Subscribe to status changes via IPC polling
    const unsubscribe = window.korproxy.proxy.onStatusChange((status) => {
      store.setRunning(status.running)
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    isRunning: store.isRunning,
    isConnecting: store.isConnecting,
    error: store.error,
    version: store.version,
    port: store.port,
  }
}

import { useEffect } from 'react'
import { create } from 'zustand'
import { proxyApi, type ProxyStatus } from '../lib/api'

interface ProxyStatusState {
  isRunning: boolean
  isConnecting: boolean
  error: string | null
  version: string | null
  setStatus: (status: ProxyStatus) => void
  setConnecting: (connecting: boolean) => void
  setError: (error: string | null) => void
}

export const useProxyStatusStore = create<ProxyStatusState>((set) => ({
  isRunning: false,
  isConnecting: true,
  error: null,
  version: null,

  setStatus: (status) =>
    set({
      isRunning: status.running,
      version: status.version || null,
      error: null,
    }),

  setConnecting: (connecting) => set({ isConnecting: connecting }),

  setError: (error) => set({ error, isRunning: false }),
}))

export function useProxyStatus() {
  const store = useProxyStatusStore()

  useEffect(() => {
    let mounted = true
    let intervalId: ReturnType<typeof setInterval>

    const checkStatus = async () => {
      if (!mounted) return
      try {
        const status = await proxyApi.getStatus()
        if (mounted) {
          store.setStatus(status)
          store.setConnecting(false)
        }
      } catch (err) {
        if (mounted) {
          store.setError(err instanceof Error ? err.message : 'Connection failed')
          store.setConnecting(false)
        }
      }
    }

    checkStatus()
    intervalId = setInterval(checkStatus, 5000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])

  return {
    isRunning: store.isRunning,
    isConnecting: store.isConnecting,
    error: store.error,
    version: store.version,
  }
}

import { useState, useEffect } from 'react'
import { useProxyStatus } from './useProxyStatus'
import type { ProxyStats } from '../../electron/common/ipc-types'

export function useProxyStats(pollInterval = 5000) {
  const { isRunning } = useProxyStatus()
  const [stats, setStats] = useState<ProxyStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isRunning) {
      setStats(null)
      return
    }

    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const data = await window.korproxy.proxy.getStats()
        setStats(data)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, pollInterval)
    return () => clearInterval(interval)
  }, [isRunning, pollInterval])

  const todayKey = new Date().toISOString().split('T')[0]
  const requestsToday = stats?.requestsByDay?.[todayKey] || 0

  return {
    stats,
    isLoading,
    requestsToday,
    totalRequests: stats?.totalRequests || 0,
    successCount: stats?.successCount || 0,
    failureCount: stats?.failureCount || 0,
  }
}

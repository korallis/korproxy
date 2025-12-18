import { useState, useEffect, useCallback } from 'react'
import { useProxyStatus } from './useProxyStatus'
import type { MetricsResponse } from '../../electron/common/ipc-types'

export type DateRange = '7d' | '30d' | 'custom'

interface UseMetricsOptions {
  dateRange?: DateRange
  customFrom?: string
  customTo?: string
  pollInterval?: number
}

export function useMetrics(options: UseMetricsOptions = {}) {
  const { dateRange = '7d', customFrom, customTo, pollInterval = 30000 } = options
  const { isRunning, port } = useProxyStatus()
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getDateRange = useCallback(() => {
    const to = new Date()
    let from: Date

    if (dateRange === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }

    if (dateRange === '30d') {
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return {
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    }
  }, [dateRange, customFrom, customTo])

  const fetchMetrics = useCallback(async () => {
    if (!isRunning) {
      setMetrics(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { from, to } = getDateRange()
      const url = `http://localhost:${port}/_korproxy/metrics?from=${from}&to=${to}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`)
      }

      const data: MetricsResponse = await response.json()
      setMetrics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      setMetrics(null)
    } finally {
      setIsLoading(false)
    }
  }, [isRunning, port, getDateRange])

  const clearMetrics = useCallback(async () => {
    if (!isRunning) return false

    try {
      const response = await fetch(`http://localhost:${port}/_korproxy/metrics`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchMetrics()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [isRunning, port, fetchMetrics])

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, pollInterval)
    return () => clearInterval(interval)
  }, [fetchMetrics, pollInterval])

  const successRate = metrics?.summary
    ? metrics.summary.totalRequests > 0
      ? ((metrics.summary.totalRequests - metrics.summary.totalFailures) / metrics.summary.totalRequests) * 100
      : 100
    : 0

  return {
    metrics,
    isLoading,
    error,
    refetch: fetchMetrics,
    clearMetrics,
    successRate,
  }
}

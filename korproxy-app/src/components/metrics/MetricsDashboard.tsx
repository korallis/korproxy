import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  BarChart3,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import type {
  MetricsTimeRange,
  MetricsDashboardResponse,
  MetricsProviderData,
} from '../../../electron/common/ipc-types'

const PROVIDER_COLORS: Record<string, string> = {
  claude: '#F97316',
  codex: '#10B981',
  gemini: '#3B82F6',
  qwen: '#8B5CF6',
  iflow: '#EC4899',
}

const AUTO_REFRESH_INTERVAL = 30000

interface MetricsDashboardProps {
  className?: string
}

export function MetricsDashboard({ className }: MetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<MetricsTimeRange>('7d')
  const [data, setData] = useState<MetricsDashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = useCallback(async (range: MetricsTimeRange) => {
    try {
      setIsLoading(true)
      const result = await window.korproxy.metrics.getSummary(range)
      setData(result)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics(timeRange)

    const interval = setInterval(() => {
      fetchMetrics(timeRange)
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchMetrics, timeRange])

  const handleTimeRangeChange = (range: MetricsTimeRange) => {
    setTimeRange(range)
    fetchMetrics(range)
  }

  const handleRefresh = () => {
    fetchMetrics(timeRange)
  }

  if (isLoading && !data) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Loading metrics...</span>
        </div>
      </div>
    )
  }

  const hasData = data && data.byProvider.length > 0

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Metrics Dashboard</h2>
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-lg transition-colors glass-card',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}

      {!hasData ? (
        <EmptyState />
      ) : (
        <>
          <SummaryCards summary={data.summary} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RequestsByProviderChart providers={data.byProvider} />
            <ErrorRatesChart providers={data.byProvider} />
          </div>
          <LatencyPercentilesTable providers={data.byProvider} />
        </>
      )}
    </div>
  )
}

interface TimeRangeSelectorProps {
  value: MetricsTimeRange
  onChange: (range: MetricsTimeRange) => void
}

function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 glass-card p-1">
      <button
        onClick={() => onChange('1d')}
        className={cn(
          'px-3 py-1.5 text-sm rounded-md transition-colors',
          value === '1d'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        24 Hours
      </button>
      <button
        onClick={() => onChange('7d')}
        className={cn(
          'px-3 py-1.5 text-sm rounded-md transition-colors',
          value === '7d'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        7 Days
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8 text-center"
    >
      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No data available</h3>
      <p className="text-muted-foreground text-sm">
        Start using the proxy to see metrics and analytics.
      </p>
    </motion.div>
  )
}

interface SummaryCardsProps {
  summary: MetricsDashboardResponse['summary']
}

function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Requests',
      value: summary.totalRequests.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Success Rate',
      value: `${summary.successRate.toFixed(1)}%`,
      icon: Activity,
      color: summary.successRate >= 95 ? 'text-green-500' : 'text-yellow-500',
      bgColor: summary.successRate >= 95 ? 'bg-green-500/10' : 'bg-yellow-500/10',
    },
    {
      label: 'Total Failures',
      value: summary.totalFailures.toLocaleString(),
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    {
      label: 'Avg Latency',
      value: `${Math.round(summary.avgLatencyMs)}ms`,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('p-2 rounded-lg', card.bgColor)}>
              <card.icon className={cn('w-4 h-4', card.color)} />
            </div>
          </div>
          <p className="text-2xl font-bold">{card.value}</p>
          <p className="text-sm text-muted-foreground">{card.label}</p>
        </motion.div>
      ))}
    </div>
  )
}

interface RequestsByProviderChartProps {
  providers: MetricsProviderData[]
}

function RequestsByProviderChart({ providers }: RequestsByProviderChartProps) {
  const maxRequests = Math.max(...providers.map((p) => p.requests), 1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <BarChart3 className="w-4 h-4 text-blue-500" />
        </div>
        <div>
          <h3 className="font-semibold">Requests by Provider</h3>
          <p className="text-xs text-muted-foreground">Total requests per AI provider</p>
        </div>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => {
          const percentage = (provider.requests / maxRequests) * 100
          const color = PROVIDER_COLORS[provider.provider] || '#6B7280'
          const displayName =
            provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)

          return (
            <div key={provider.provider} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{displayName}</span>
                <span className="text-muted-foreground">
                  {provider.requests.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

interface ErrorRatesChartProps {
  providers: MetricsProviderData[]
}

function ErrorRatesChart({ providers }: ErrorRatesChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500/10">
          <AlertTriangle className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold">Error Rates</h3>
          <p className="text-xs text-muted-foreground">Failure percentage by provider</p>
        </div>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => {
          const displayName =
            provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)
          const color = provider.errorRate > 5 ? 'text-red-500' : 'text-green-500'

          return (
            <div
              key={provider.provider}
              className="flex justify-between items-center py-2 border-b border-border last:border-0"
            >
              <span>{displayName}</span>
              <div className="flex items-center gap-2">
                <span className={cn('font-mono font-medium', color)}>
                  {provider.errorRate.toFixed(2)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({provider.failures}/{provider.requests})
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

interface LatencyPercentilesTableProps {
  providers: MetricsProviderData[]
}

function LatencyPercentilesTable({ providers }: LatencyPercentilesTableProps) {
  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <Clock className="w-4 h-4 text-purple-500" />
        </div>
        <div>
          <h3 className="font-semibold">Latency Percentiles</h3>
          <p className="text-xs text-muted-foreground">
            Response time distribution by provider
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-sm font-medium text-muted-foreground">
                Provider
              </th>
              <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                P50
              </th>
              <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                P90
              </th>
              <th className="text-right py-2 text-sm font-medium text-muted-foreground">
                P99
              </th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => {
              const displayName =
                provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)
              const color = PROVIDER_COLORS[provider.provider] || '#6B7280'

              return (
                <tr key={provider.provider} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>{displayName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 font-mono text-sm">
                    {formatLatency(provider.p50Ms)}
                  </td>
                  <td className="text-right py-3 font-mono text-sm">
                    {formatLatency(provider.p90Ms)}
                  </td>
                  <td className="text-right py-3 font-mono text-sm">
                    {formatLatency(provider.p99Ms)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default MetricsDashboard

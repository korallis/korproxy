import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Filter,
  Copy,
  Check,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToast } from '../../hooks/useToast'
import type {
  RecentRequest,
  RecentRequestsFilter,
  DiagnosticsProviderState,
  DiagnosticsMetrics,
} from '../../../electron/common/ipc-types'

interface DiagnosticsViewProps {
  config?: Record<string, unknown>
  providers?: DiagnosticsProviderState[]
  metrics?: DiagnosticsMetrics | null
}

type StatusFilter = 'all' | 'success' | 'failure'

export function DiagnosticsView({
  config = {},
  providers = [],
  metrics = null,
}: DiagnosticsViewProps) {
  const { toast } = useToast()
  const [requests, setRequests] = useState<RecentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCopying, setIsCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [correlationIdSearch, setCorrelationIdSearch] = useState('')
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('24h')

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const filter: RecentRequestsFilter = {
        limit: 100,
      }

      if (statusFilter !== 'all') {
        filter.status = statusFilter
      }

      if (correlationIdSearch.trim()) {
        filter.correlationId = correlationIdSearch.trim()
      }

      if (timeRange !== 'all') {
        const hours = { '1h': 1, '6h': 6, '24h': 24 }[timeRange]
        filter.startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
      }

      const result = await window.korproxy.diagnostics.getRecentRequests(filter)
      setRequests(result)
    } catch (error) {
      console.error('Failed to fetch recent requests:', error)
      toast('Failed to load recent requests', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, correlationIdSearch, timeRange, toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleCopyBundle = async () => {
    setIsCopying(true)
    try {
      const result = await window.korproxy.diagnostics.copyBundleToClipboard(
        config,
        providers,
        metrics
      )
      if (result.success) {
        setCopied(true)
        toast('Diagnostic bundle copied to clipboard', 'success')
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast(result.error || 'Failed to copy bundle', 'error')
      }
    } catch {
      toast('Failed to copy diagnostic bundle', 'error')
    } finally {
      setIsCopying(false)
    }
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Diagnostics</h2>
        <button
          onClick={handleCopyBundle}
          disabled={isCopying}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isCopying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? 'Copied!' : 'Copy Diagnostic Bundle'}
        </button>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Status:</span>
            <div className="flex gap-1">
              {(['all', 'success', 'failure'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Time:</span>
            <div className="flex gap-1">
              {(['1h', '6h', '24h', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    timeRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  )}
                >
                  {range === 'all' ? 'All' : range}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by correlation ID..."
                value={correlationIdSearch}
                onChange={(e) => setCorrelationIdSearch(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-lg',
                  'bg-muted border border-border',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  'placeholder:text-muted-foreground/60'
                )}
              />
            </div>
          </div>

          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className={cn(
              'p-2 rounded-lg transition-colors',
              'hover:bg-muted',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium">Recent Requests</h3>
          <p className="text-sm text-muted-foreground">
            {requests.length} request{requests.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Latency
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Correlation ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading requests...</p>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">No requests found</p>
                      <p className="text-xs text-muted-foreground">
                        Try adjusting your filters or time range
                      </p>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <motion.tr
                      key={request.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {request.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                          <span
                            className={cn(
                              'text-sm capitalize',
                              request.status === 'success'
                                ? 'text-green-500'
                                : 'text-destructive'
                            )}
                          >
                            {request.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatTimestamp(request.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize">{request.provider}</td>
                      <td className="px-4 py-3 text-sm font-mono text-xs">
                        {request.model}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {formatLatency(request.latencyMs)}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {request.correlationId.slice(0, 8)}...
                        </code>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {requests.some((r) => r.status === 'failure') && (
        <div className="glass-card p-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Recent Errors
          </h3>
          <div className="space-y-2">
            {requests
              .filter((r) => r.status === 'failure')
              .slice(0, 5)
              .map((request) => (
                <div
                  key={request.id}
                  className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {request.provider} - {request.model}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(request.timestamp)}
                    </span>
                  </div>
                  {request.errorCode && (
                    <p className="text-xs text-destructive mt-1">
                      {request.errorCode}: {request.errorMessage}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

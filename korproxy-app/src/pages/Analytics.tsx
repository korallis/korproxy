import { useState } from 'react'
import { motion } from 'motion/react'
import { Calendar, RefreshCw, Trash2 } from 'lucide-react'
import { useMetrics, type DateRange } from '../hooks/useMetrics'
import { useProxyStatus } from '../hooks/useProxyStatus'
import { useToast } from '../hooks/useToast'
import { SummaryCards } from '../components/analytics/SummaryCards'
import { ProviderChart } from '../components/analytics/ProviderChart'
import { RequestTypeChart } from '../components/analytics/RequestTypeChart'
import { DailyChart } from '../components/analytics/DailyChart'
import { cn } from '../lib/utils'
import * as AlertDialog from '@radix-ui/react-alert-dialog'

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
]

export default function Analytics() {
  const { toast } = useToast()
  const { isRunning } = useProxyStatus()
  const [dateRange, setDateRange] = useState<DateRange>('7d')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const { metrics, isLoading, refetch, clearMetrics, successRate } = useMetrics({ dateRange })

  const handleClearData = async () => {
    const success = await clearMetrics()
    if (success) {
      toast('Analytics data cleared', 'success')
    } else {
      toast('Failed to clear data', 'error')
    }
    setClearDialogOpen(false)
  }

  return (
    <div className="p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 glass-card p-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  dateRange === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => refetch()}
            disabled={isLoading || !isRunning}
            className={cn(
              'p-2 rounded-lg transition-colors glass-card',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </motion.button>
          <AlertDialog.Root open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
            <AlertDialog.Trigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!isRunning}
                className={cn(
                  'p-2 rounded-lg transition-colors glass-card text-red-500 hover:bg-red-500/10',
                  !isRunning && 'opacity-50 cursor-not-allowed'
                )}
                title="Clear Data"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </AlertDialog.Trigger>
            <AlertDialog.Portal>
              <AlertDialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
              <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 glass-card p-6 w-[400px]">
                <AlertDialog.Title className="text-lg font-semibold mb-2">
                  Clear Analytics Data
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm text-muted-foreground mb-4">
                  This will permanently delete all analytics data. This action cannot be undone.
                </AlertDialog.Description>
                <div className="flex justify-end gap-3">
                  <AlertDialog.Cancel asChild>
                    <button className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                      Cancel
                    </button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      onClick={handleClearData}
                      className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    >
                      Clear Data
                    </button>
                  </AlertDialog.Action>
                </div>
              </AlertDialog.Content>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </div>
      </motion.div>

      {!isRunning ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center"
        >
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Proxy Not Running</h3>
          <p className="text-muted-foreground text-sm">
            Start the proxy to view analytics and usage metrics.
          </p>
        </motion.div>
      ) : (
        <>
          <SummaryCards summary={metrics?.summary ?? null} successRate={successRate} isLoading={isLoading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <ProviderChart data={metrics?.byProvider} isLoading={isLoading} />
            <RequestTypeChart data={metrics?.byType} isLoading={isLoading} />
          </div>

          <DailyChart data={metrics?.daily} isLoading={isLoading} />
        </>
      )}
    </div>
  )
}

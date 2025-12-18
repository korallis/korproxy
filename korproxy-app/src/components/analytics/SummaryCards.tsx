import { motion } from 'motion/react'
import { Activity, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { MetricsSummary } from '../../../electron/common/ipc-types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

interface SummaryCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}

function SummaryCard({ title, value, subtitle, icon, color }: SummaryCardProps) {
  return (
    <motion.div variants={itemVariants} className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  )
}

interface SummaryCardsProps {
  summary: MetricsSummary | null
  successRate: number
  isLoading?: boolean
}

export function SummaryCards({ summary, successRate, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} variants={itemVariants} className="glass-card p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-3" />
            <div className="h-8 bg-muted rounded w-3/4" />
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <SummaryCard
        title="Total Requests"
        value={summary?.totalRequests.toLocaleString() ?? 0}
        icon={<Activity className="w-4 h-4 text-blue-500" />}
        color="bg-blue-500/10"
      />
      <SummaryCard
        title="Total Failures"
        value={summary?.totalFailures.toLocaleString() ?? 0}
        icon={<AlertCircle className="w-4 h-4 text-red-500" />}
        color="bg-red-500/10"
      />
      <SummaryCard
        title="Avg Latency"
        value={`${Math.round(summary?.avgLatencyMs ?? 0)}ms`}
        icon={<Clock className="w-4 h-4 text-amber-500" />}
        color="bg-amber-500/10"
      />
      <SummaryCard
        title="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        icon={<CheckCircle className="w-4 h-4 text-green-500" />}
        color="bg-green-500/10"
      />
    </motion.div>
  )
}

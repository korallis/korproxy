import { motion } from 'motion/react'
import { Crown, Clock, AlertTriangle, Sparkles, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

type Status = 'active' | 'trial' | 'expired' | 'no_subscription' | 'past_due' | 'lifetime' | 'canceled'

interface SubscriptionBadgeProps {
  status: Status
  daysLeft?: number
  className?: string
}

const statusConfig: Record<Status, { icon: typeof Crown; label: string; color: string; bgColor: string }> = {
  lifetime: {
    icon: Crown,
    label: 'Lifetime',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  active: {
    icon: Sparkles,
    label: 'Active',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  trial: {
    icon: Clock,
    label: 'Trial',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  past_due: {
    icon: AlertTriangle,
    label: 'Past Due',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  canceled: {
    icon: XCircle,
    label: 'Canceled',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  expired: {
    icon: XCircle,
    label: 'Expired',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  no_subscription: {
    icon: XCircle,
    label: 'No Subscription',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
}

export function SubscriptionBadge({ status, daysLeft, className }: SubscriptionBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
      {daysLeft !== undefined && daysLeft > 0 && (status === 'trial' || status === 'canceled') && (
        <span className="text-muted-foreground">({daysLeft}d left)</span>
      )}
    </motion.div>
  )
}

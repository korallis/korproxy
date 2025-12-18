import { motion } from 'motion/react'
import { Check, Clock, AlertTriangle, XCircle, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AuthStatus = 'loading' | 'connected' | 'expiring' | 'expired' | 'error'

interface AuthStatusBadgeProps {
  status: AuthStatus
  expiresAt?: number
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

const statusConfig: Record<AuthStatus, { 
  icon: typeof Check
  text: string
  className: string
  bgClassName: string
}> = {
  loading: {
    icon: Loader2,
    text: 'Connecting...',
    className: 'text-muted-foreground',
    bgClassName: 'bg-muted',
  },
  connected: {
    icon: Check,
    text: 'Connected',
    className: 'text-green-500',
    bgClassName: 'bg-green-500/10',
  },
  expiring: {
    icon: Clock,
    text: 'Expiring soon',
    className: 'text-yellow-500',
    bgClassName: 'bg-yellow-500/10',
  },
  expired: {
    icon: AlertTriangle,
    text: 'Session expired',
    className: 'text-red-500',
    bgClassName: 'bg-red-500/10',
  },
  error: {
    icon: XCircle,
    text: 'Error',
    className: 'text-red-500',
    bgClassName: 'bg-red-500/10',
  },
}

function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now()
  const remaining = expiresAt - now
  
  if (remaining <= 0) return 'Expired'
  
  const minutes = Math.floor(remaining / 60000)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return '< 1m'
}

export function AuthStatusBadge({ 
  status, 
  expiresAt,
  onRefresh,
  isRefreshing,
  className 
}: AuthStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = isRefreshing ? Loader2 : config.icon

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
          config.bgClassName,
          config.className
        )}
      >
        <Icon 
          className={cn(
            'w-3.5 h-3.5',
            (status === 'loading' || isRefreshing) && 'animate-spin'
          )} 
        />
        <span>
          {status === 'expiring' && expiresAt
            ? `Expires in ${formatTimeRemaining(expiresAt)}`
            : config.text}
        </span>
      </motion.div>

      {onRefresh && (status === 'connected' || status === 'expiring' || status === 'expired') && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            'p-1.5 rounded-lg',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted transition-colors',
            'disabled:opacity-50'
          )}
          title="Refresh token"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
        </motion.button>
      )}
    </div>
  )
}

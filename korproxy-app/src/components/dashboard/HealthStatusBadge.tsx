import { cn } from '@/lib/utils'
import { useHealthStatus } from '@/hooks/useHealthStatus'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { HealthState } from '../../../electron/common/ipc-types'

const STATE_CONFIG: Record<HealthState, { 
  label: string
  color: string
  bgColor: string
  pulseColor: string
}> = {
  stopped: {
    label: 'Stopped',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/20',
    pulseColor: '',
  },
  starting: {
    label: 'Starting',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    pulseColor: 'animate-pulse',
  },
  healthy: {
    label: 'Healthy',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/20',
    pulseColor: '',
  },
  degraded: {
    label: 'Degraded',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/20',
    pulseColor: '',
  },
  unreachable: {
    label: 'Unreachable',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    pulseColor: 'animate-pulse',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
    pulseColor: '',
  },
}

export function HealthStatusBadge() {
  const status = useHealthStatus()
  const config = STATE_CONFIG[status.state]

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
            config.bgColor,
            config.color,
            config.pulseColor
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              config.color.replace('text-', 'bg-')
            )}
          />
          {config.label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        <div className="space-y-1">
          <div>Last check: {formatTime(status.lastCheck)}</div>
          {status.consecutiveFailures > 0 && (
            <div>Consecutive failures: {status.consecutiveFailures}</div>
          )}
          {status.restartAttempts > 0 && (
            <div>Restart attempts: {status.restartAttempts}/3</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

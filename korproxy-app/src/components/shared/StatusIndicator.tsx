import { cn } from '../../lib/utils'

type Status = 'online' | 'offline' | 'connecting'

interface StatusIndicatorProps {
  status: Status
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
}

const statusColors: Record<Status, string> = {
  online: 'bg-green-500',
  offline: 'bg-muted-foreground',
  connecting: 'bg-yellow-500',
}

export function StatusIndicator({ status, size = 'md' }: StatusIndicatorProps) {
  const shouldPulse = status === 'online' || status === 'connecting'

  return (
    <span className="relative inline-flex">
      <span
        className={cn(
          'rounded-full',
          sizeClasses[size],
          statusColors[status],
          shouldPulse && 'animate-pulse'
        )}
      />
      {shouldPulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-75 animate-ping',
            statusColors[status]
          )}
          style={{ animationDuration: '1.5s' }}
        />
      )}
    </span>
  )
}

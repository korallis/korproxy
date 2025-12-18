import { motion } from 'motion/react'
import { AlertTriangle, CreditCard, WifiOff, Sparkles, X } from 'lucide-react'
import { cn } from '../../lib/utils'

export type BannerVariant = 'limit' | 'past_due' | 'offline'

interface UpgradeBannerProps {
  variant: BannerVariant
  limitType?: string
  onUpgrade?: () => void
  onDismiss?: () => void
  className?: string
}

const variantConfig: Record<
  BannerVariant,
  {
    icon: React.ReactNode
    title: string
    description: string
    ctaText: string
    bgClass: string
    borderClass: string
    iconClass: string
  }
> = {
  limit: {
    icon: <Sparkles className="w-4 h-4" />,
    title: "You've hit a limit",
    description: 'Upgrade to Pro for more profiles, provider groups, and smart routing.',
    ctaText: 'Upgrade Now',
    bgClass: 'bg-primary/10',
    borderClass: 'border-primary/30',
    iconClass: 'text-primary',
  },
  past_due: {
    icon: <CreditCard className="w-4 h-4" />,
    title: 'Payment issue',
    description: 'Please update your payment method to continue using Pro features.',
    ctaText: 'Update Payment',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    iconClass: 'text-amber-500',
  },
  offline: {
    icon: <WifiOff className="w-4 h-4" />,
    title: "Can't sync entitlements",
    description: 'Running in offline mode. Some features may be limited after 72 hours.',
    ctaText: 'Retry',
    bgClass: 'bg-muted',
    borderClass: 'border-border',
    iconClass: 'text-muted-foreground',
  },
}

export function UpgradeBanner({
  variant,
  limitType,
  onUpgrade,
  onDismiss,
  className,
}: UpgradeBannerProps) {
  const config = variantConfig[variant]

  const description =
    variant === 'limit' && limitType
      ? `You've reached the maximum ${limitType}. Upgrade to Pro for more.`
      : config.description

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className={cn('shrink-0', config.iconClass)}>{config.icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{config.title}</span>
          {variant === 'past_due' && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              variant === 'limit'
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : variant === 'past_due'
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
            )}
          >
            {config.ctaText}
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-muted-foreground/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

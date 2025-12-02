import { motion } from 'framer-motion'
import { Crown, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UpgradePromptProps {
  reason: 'no_subscription' | 'expired' | 'past_due'
  className?: string
}

const UPGRADE_URL = 'https://korproxy.dev/dashboard/subscription'

const reasonConfig = {
  no_subscription: {
    title: 'Subscription Required',
    description: 'Subscribe to KorProxy to start using the proxy with your AI accounts.',
    icon: Crown,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-500/10',
  },
  expired: {
    title: 'Subscription Expired',
    description: 'Your subscription has expired. Renew to continue using KorProxy.',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-500/10',
  },
  past_due: {
    title: 'Payment Failed',
    description: 'Your payment failed. Please update your payment method to continue.',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    iconBg: 'bg-yellow-500/10',
  },
}

export function UpgradePrompt({ reason, className }: UpgradePromptProps) {
  const config = reasonConfig[reason]
  const Icon = config.icon

  const handleUpgrade = () => {
    if (window.korproxy) {
      window.open(UPGRADE_URL, '_blank')
    } else {
      window.location.href = UPGRADE_URL
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card p-6', className)}
    >
      <div className="flex flex-col items-center text-center">
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', config.iconBg)}>
          <Icon className={cn('w-8 h-8', config.iconColor)} />
        </div>
        <h3 className="text-lg font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          {config.description}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgrade}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'flex items-center gap-2'
          )}
        >
          {reason === 'no_subscription' ? 'Start Free Trial' : 'Manage Subscription'}
          <ExternalLink className="w-4 h-4" />
        </motion.button>
        <p className="text-xs text-muted-foreground mt-4">
          7-day free trial • Cancel anytime
        </p>
      </div>
    </motion.div>
  )
}

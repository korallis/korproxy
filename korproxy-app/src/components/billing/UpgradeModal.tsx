import { motion } from 'motion/react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Check, Sparkles, Users, Zap } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PLAN_LIMITS } from '../../types/entitlements'
import type { Plan } from '../../types/entitlements'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan?: Plan
}

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanInfo {
  name: string
  price: string
  period: string
  description: string
  icon: React.ReactNode
  features: PlanFeature[]
  highlight?: boolean
  checkoutUrl: string
}

const plans: Record<Exclude<Plan, 'free'>, PlanInfo> = {
  pro: {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For individual developers who want more power',
    icon: <Sparkles className="w-5 h-5" />,
    highlight: true,
    checkoutUrl: 'https://korproxy.com/checkout/pro',
    features: [
      { text: `${PLAN_LIMITS.pro.maxProfiles} profiles`, included: true },
      { text: `${PLAN_LIMITS.pro.maxProviderGroups} provider groups`, included: true },
      { text: `${PLAN_LIMITS.pro.maxDevices} devices`, included: true },
      { text: 'Smart routing', included: true },
      { text: `${PLAN_LIMITS.pro.analyticsRetentionDays} days analytics`, included: true },
      { text: 'Priority support', included: true },
    ],
  },
  team: {
    name: 'Team',
    price: '$19',
    period: '/user/month',
    description: 'For teams that need collaboration features',
    icon: <Users className="w-5 h-5" />,
    checkoutUrl: 'https://korproxy.com/checkout/team',
    features: [
      { text: 'Unlimited profiles', included: true },
      { text: 'Unlimited provider groups', included: true },
      { text: `${PLAN_LIMITS.team.maxDevices} devices per user`, included: true },
      { text: 'Smart routing', included: true },
      { text: `${PLAN_LIMITS.team.analyticsRetentionDays} days analytics`, included: true },
      { text: 'Team management', included: true },
      { text: 'Shared configurations', included: true },
      { text: 'Priority support', included: true },
    ],
  },
}

const freePlanFeatures: PlanFeature[] = [
  { text: `${PLAN_LIMITS.free.maxProfiles} profile`, included: true },
  { text: `${PLAN_LIMITS.free.maxProviderGroups} provider groups`, included: true },
  { text: `${PLAN_LIMITS.free.maxDevices} device`, included: true },
  { text: 'Smart routing', included: false },
  { text: `${PLAN_LIMITS.free.analyticsRetentionDays} days analytics`, included: true },
]

export function UpgradeModal({ open, onOpenChange, currentPlan = 'free' }: UpgradeModalProps) {
  const handleUpgrade = (plan: Exclude<Plan, 'free'>) => {
    const checkoutUrl = plans[plan].checkoutUrl
    window.open(checkoutUrl, '_blank')
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-h-[90vh] overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card w-[800px] max-w-[95vw] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  Upgrade Your Plan
                </Dialog.Title>
                <Dialog.Description className="text-sm text-muted-foreground mt-1">
                  Get more features and unlock your full potential
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Free Plan */}
              <div
                className={cn(
                  'rounded-xl p-5 border',
                  currentPlan === 'free'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Free</h3>
                    {currentPlan === 'free' && (
                      <span className="text-xs text-primary">Current plan</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Get started with basic features
                </p>

                <ul className="space-y-2 mb-4">
                  {freePlanFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check
                        className={cn(
                          'w-4 h-4',
                          feature.included ? 'text-primary' : 'text-muted-foreground/30'
                        )}
                      />
                      <span className={cn(!feature.included && 'text-muted-foreground/50 line-through')}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {currentPlan === 'free' && (
                  <button
                    disabled
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium',
                      'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    Current Plan
                  </button>
                )}
              </div>

              {/* Pro Plan */}
              <div
                className={cn(
                  'rounded-xl p-5 border relative',
                  plans.pro.highlight
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30',
                  currentPlan === 'pro' && 'border-primary/50'
                )}
              >
                {plans.pro.highlight && currentPlan !== 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    {plans.pro.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{plans.pro.name}</h3>
                    {currentPlan === 'pro' && (
                      <span className="text-xs text-primary">Current plan</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{plans.pro.price}</span>
                  <span className="text-muted-foreground">{plans.pro.period}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {plans.pro.description}
                </p>

                <ul className="space-y-2 mb-4">
                  {plans.pro.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {currentPlan === 'pro' ? (
                  <button
                    disabled
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium',
                      'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade('pro')}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                    )}
                  >
                    Upgrade to Pro
                  </button>
                )}
              </div>

              {/* Team Plan */}
              <div
                className={cn(
                  'rounded-xl p-5 border',
                  currentPlan === 'team'
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-muted">
                    {plans.team.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{plans.team.name}</h3>
                    {currentPlan === 'team' && (
                      <span className="text-xs text-primary">Current plan</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold">{plans.team.price}</span>
                  <span className="text-muted-foreground">{plans.team.period}</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {plans.team.description}
                </p>

                <ul className="space-y-2 mb-4">
                  {plans.team.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {currentPlan === 'team' ? (
                  <button
                    disabled
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium',
                      'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade('team')}
                    className={cn(
                      'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                      'bg-foreground text-background hover:bg-foreground/90'
                    )}
                  >
                    Upgrade to Team
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-6">
              All plans include a 14-day free trial. Cancel anytime.
            </p>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

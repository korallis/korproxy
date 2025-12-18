import { motion } from 'motion/react'
import { Zap, Shield, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'

const features = [
  {
    icon: Zap,
    title: 'Use Your Subscriptions',
    description: 'Connect Claude Pro, ChatGPT Plus, or Google AI Studio',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Your data stays local - nothing leaves your machine',
  },
  {
    icon: Cpu,
    title: 'Works Everywhere',
    description: 'Compatible with Cursor, Cline, Continue, and more',
  },
]

export function WelcomeStep() {
  const { nextStep } = useOnboardingStore()

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring' as const, stiffness: 300 }}
        className="mb-6"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <span className="text-4xl font-bold text-primary-foreground">K</span>
        </div>
        <h1 id="onboarding-title" className="text-3xl font-bold mb-2">
          Welcome to KorProxy
        </h1>
        <p className="text-muted-foreground text-lg">
          Your personal AI gateway for coding tools
        </p>
      </motion.div>

      <div className="grid gap-4 mb-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl',
              'bg-muted/50 text-left'
            )}
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={nextStep}
        className={cn(
          'w-full py-3 px-6 rounded-xl',
          'bg-primary text-primary-foreground',
          'font-semibold text-lg',
          'hover:bg-primary/90 transition-colors'
        )}
      >
        Get Started
      </motion.button>
    </div>
  )
}

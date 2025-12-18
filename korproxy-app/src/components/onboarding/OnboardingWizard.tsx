import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { OnboardingStep } from '@/types/electron'
import { WelcomeStep } from './steps/WelcomeStep'
import { AcquisitionStep } from './steps/AcquisitionStep'
import { ProvidersStep } from './steps/ProvidersStep'
import { ConnectStep } from './steps/ConnectStep'
import { ToolsStep } from './steps/ToolsStep'
import { TestStep } from './steps/TestStep'
import { DoneStep } from './steps/DoneStep'

const stepComponents: Record<OnboardingStep, React.ComponentType> = {
  [OnboardingStep.WELCOME]: WelcomeStep,
  [OnboardingStep.ACQUISITION]: AcquisitionStep,
  [OnboardingStep.PROVIDERS]: ProvidersStep,
  [OnboardingStep.CONNECT]: ConnectStep,
  [OnboardingStep.TOOLS]: ToolsStep,
  [OnboardingStep.TEST]: TestStep,
  [OnboardingStep.DONE]: DoneStep,
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
}

interface OnboardingWizardProps {
  onClose?: () => void
}

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const { completed, currentStep, complete } = useOnboardingStore()

  const handleSkip = useCallback(() => {
    complete()
    onClose?.()
  }, [complete, onClose])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSkip()
    }
  }, [handleSkip])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Don't render if onboarding is complete
  if (completed) return null

  const StepComponent = stepComponents[currentStep]
  const direction = 1 // Track direction for animation

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
        className={cn(
          'relative z-10 w-full max-w-2xl mx-4',
          'bg-background/95 backdrop-blur-xl rounded-2xl shadow-2xl',
          'border border-border/50',
          'overflow-hidden'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className={cn(
            'absolute top-4 right-4 z-20',
            'p-2 rounded-lg',
            'text-muted-foreground hover:text-foreground',
            'hover:bg-muted transition-colors'
          )}
          aria-label="Skip onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress indicator */}
        <div className="px-8 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of 7
            </span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / 7) * 100}%` }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="relative min-h-[400px] p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

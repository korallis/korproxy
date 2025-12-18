import { motion } from 'motion/react'
import { PartyPopper, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAcquisitionSubmit } from '@/hooks/useAcquisitionSubmit'
import { useCallback } from 'react'

export function DoneStep() {
  const { complete, selectedProviders, selectedTools } = useOnboardingStore()
  const { submitAcquisition } = useAcquisitionSubmit()

  const handleComplete = useCallback(async () => {
    await submitAcquisition()
    complete()
  }, [submitAcquisition, complete])

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
        className="mb-6"
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
          <PartyPopper className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
        <p className="text-muted-foreground text-lg mb-6">
          KorProxy is ready to power your AI coding tools
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-muted/50 rounded-xl p-6 mb-8 text-left"
      >
        <h3 className="font-semibold mb-3">Quick Summary</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            {selectedProviders.length} provider{selectedProviders.length !== 1 ? 's' : ''} selected
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            {selectedTools.length} tool{selectedTools.length !== 1 ? 's' : ''} to configure
          </li>
          <li className="flex items-center gap-2">
            <span className="text-primary">✓</span>
            Proxy running on localhost:1337
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleComplete}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold text-lg',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          <Rocket className="w-5 h-5" />
          Open Dashboard
        </motion.button>
        <p className="text-xs text-muted-foreground">
          You can access setup guides from Settings → Integrations
        </p>
      </motion.div>
    </div>
  )
}

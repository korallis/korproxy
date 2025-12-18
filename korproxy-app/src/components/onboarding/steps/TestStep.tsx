import { useState } from 'react'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useProxyStore } from '@/hooks/useProxy'
import { useAccounts } from '@/hooks/useAccounts'

type TestStatus = 'idle' | 'starting' | 'testing' | 'success' | 'failed'

export function TestStep() {
  const { nextStep, prevStep, selectedProviders } = useOnboardingStore()
  const { start, running } = useProxyStore()
  const { accounts } = useAccounts()
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const connectedProviders = accounts
    .filter((a) => selectedProviders.includes(a.provider))
    .map((a) => a.provider)

  const runTest = async () => {
    setTestStatus('starting')
    setErrorMessage(null)

    try {
      // Start proxy if not running
      if (!running) {
        const result = await start()
        if (!result.success) {
          throw new Error(result.error || 'Failed to start proxy')
        }
      }

      setTestStatus('testing')

      // Test the first connected provider
      if (connectedProviders.length > 0) {
        const providerId = connectedProviders[0]
        const result = await window.korproxy.provider.test(providerId)
        
        if (result.success) {
          setTestStatus('success')
        } else {
          throw new Error(result.errorMessage || 'Test request failed')
        }
      } else {
        // No providers connected, just verify proxy is running
        setTestStatus('success')
      }
    } catch (error) {
      setTestStatus('failed')
      setErrorMessage(error instanceof Error ? error.message : 'Test failed')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Test Your Connection</h2>
        <p className="text-muted-foreground">
          Let's make sure everything is working correctly
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-8 mb-8">
        {testStatus === 'idle' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={runTest}
              className={cn(
                'w-32 h-32 rounded-full',
                'bg-primary text-primary-foreground',
                'flex items-center justify-center',
                'shadow-lg shadow-primary/25',
                'hover:bg-primary/90 transition-colors'
              )}
            >
              <Play className="w-12 h-12 ml-2" />
            </motion.button>
            <p className="mt-4 text-muted-foreground">Click to run test</p>
          </motion.div>
        )}

        {(testStatus === 'starting' || testStatus === 'testing') && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <p className="mt-4 text-muted-foreground">
              {testStatus === 'starting' ? 'Starting proxy...' : 'Running test...'}
            </p>
          </motion.div>
        )}

        {testStatus === 'success' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <p className="mt-4 text-lg font-semibold text-green-500">
              Everything is working!
            </p>
            <p className="text-sm text-muted-foreground">
              Your proxy is ready to use
            </p>
          </motion.div>
        )}

        {testStatus === 'failed' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="w-32 h-32 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <p className="mt-4 text-lg font-semibold text-red-500">
              Test failed
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {errorMessage}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runTest}
              className={cn(
                'py-2 px-4 rounded-lg',
                'bg-muted text-foreground',
                'text-sm font-medium',
                'hover:bg-muted/80 transition-colors'
              )}
            >
              Try Again
            </motion.button>
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={prevStep}
          className={cn(
            'flex items-center gap-2 py-3 px-6 rounded-xl',
            'bg-muted text-muted-foreground',
            'font-medium',
            'hover:bg-muted/80 transition-colors'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextStep}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold',
            'hover:bg-primary/90 transition-colors'
          )}
        >
          {testStatus === 'success' ? 'Continue' : 'Skip Test'}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

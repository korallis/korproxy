import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FlaskConical, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { runProviderSmoketest, type SmoketestResult } from '../../lib/providers/smoketest'
import { useAppStore } from '../../stores/appStore'

interface SmoketestButtonProps {
  providerId: string
  variant?: 'icon' | 'button'
  className?: string
}

export function SmoketestButton({
  providerId,
  variant = 'button',
  className,
}: SmoketestButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SmoketestResult | null>(null)
  const { port } = useAppStore()

  const handleRunTest = async () => {
    setIsRunning(true)
    setResult(null)
    try {
      const testResult = await runProviderSmoketest(providerId, port)
      setResult(testResult)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = () => {
    if (isRunning) {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (result?.success) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    }
    if (result && !result.success) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    return <FlaskConical className="w-4 h-4" />
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={handleRunTest}
        disabled={isRunning}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        title="Test provider connection"
      >
        {getStatusIcon()}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        onClick={handleRunTest}
        disabled={isRunning}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors',
          'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {getStatusIcon()}
        {isRunning ? 'Testing...' : 'Test Connection'}
      </motion.button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'p-3 rounded-lg text-xs font-mono space-y-1',
                result.success
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              )}
            >
              <div className="font-semibold">
                {result.success ? 'Connection Successful' : 'Connection Failed'}
              </div>
              {result.chatTest && (
                <div className="flex items-center gap-2">
                  <span
                    className={
                      result.chatTest.passed ? 'text-green-500' : 'text-red-500'
                    }
                  >
                    {result.chatTest.passed ? '✓' : '✗'}
                  </span>
                  <span>Chat: {result.chatTest.latencyMs}ms</span>
                  {result.chatTest.error && (
                    <span className="text-muted-foreground truncate">
                      {result.chatTest.error}
                    </span>
                  )}
                </div>
              )}
              {result.completionTest && (
                <div className="flex items-center gap-2">
                  <span
                    className={
                      result.completionTest.passed
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {result.completionTest.passed ? '✓' : '✗'}
                  </span>
                  <span>Completion: {result.completionTest.latencyMs}ms</span>
                  {result.completionTest.error && (
                    <span className="text-muted-foreground truncate">
                      {result.completionTest.error}
                    </span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

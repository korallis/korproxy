import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="flex items-center justify-center min-h-[200px] p-6"
    >
      <div
        className={cn(
          'glass-card p-6 max-w-md w-full space-y-4',
          'bg-red-500/5 border-red-500/20'
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25, delay: 0.1 }}
          className="flex items-center justify-center"
        >
          <div className="p-3 rounded-full bg-red-500/10">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h3 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h3>
          <p className="text-sm text-muted-foreground">
            {error.message || 'An unexpected error occurred'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3"
        >
          {resetErrorBoundary && (
            <button
              onClick={resetErrorBoundary}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'font-medium text-sm'
              )}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          <button
            onClick={() => setShowDetails((prev) => !prev)}
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 rounded-lg',
              'bg-muted/50 text-muted-foreground',
              'hover:bg-muted hover:text-foreground transition-colors',
              'text-sm'
            )}
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Details
              </>
            )}
          </button>
        </motion.div>

        <AnimatePresence>
          {showDetails && error.stack && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <pre
                className={cn(
                  'p-3 rounded-lg text-xs overflow-auto max-h-48',
                  'bg-black/20 text-muted-foreground',
                  'border border-border/50',
                  'font-mono leading-relaxed'
                )}
              >
                {error.stack}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

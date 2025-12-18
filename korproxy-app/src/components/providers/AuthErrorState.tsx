import { motion } from 'motion/react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUTH_ERROR_MESSAGES, type AuthErrorCode, type AuthError } from '@/types/electron'

interface AuthErrorStateProps {
  error: AuthError | AuthErrorCode | string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
}

function getErrorInfo(error: AuthError | AuthErrorCode | string): { message: string; action: string; retryable: boolean } {
  if (typeof error === 'string') {
    // Check if it's a known error code
    if (error in AUTH_ERROR_MESSAGES) {
      const info = AUTH_ERROR_MESSAGES[error as AuthErrorCode]
      return { ...info, retryable: error !== 'SCOPE_DENIED' }
    }
    // Unknown error string
    return { message: error, action: 'Try again', retryable: true }
  }
  
  if ('code' in error) {
    // AuthError object
    const info = AUTH_ERROR_MESSAGES[error.code]
    return {
      message: error.message || info.message,
      action: error.suggestedAction || info.action,
      retryable: error.retryable,
    }
  }

  return { message: 'An error occurred', action: 'Try again', retryable: true }
}

export function AuthErrorState({ error, onRetry, isRetrying, className }: AuthErrorStateProps) {
  const { message, action, retryable } = getErrorInfo(error)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl',
        'bg-red-500/10 border border-red-500/20',
        className
      )}
    >
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-500">{message}</p>
        <p className="text-xs text-red-500/70 mt-0.5">{action}</p>
      </div>
      {retryable && onRetry && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          disabled={isRetrying}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'bg-red-500 text-white',
            'text-xs font-medium',
            'hover:bg-red-600 transition-colors',
            'disabled:opacity-50'
          )}
        >
          <RefreshCw className={cn('w-3 h-3', isRetrying && 'animate-spin')} />
          Retry
        </motion.button>
      )}
    </motion.div>
  )
}

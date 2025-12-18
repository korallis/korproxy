import { motion, AnimatePresence } from 'motion/react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useToastStore, type ToastVariant } from '../../hooks/useToast'
import { cn } from '../../lib/utils'

const variantConfig: Record<
  ToastVariant,
  { icon: typeof CheckCircle; className: string }
> = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-500/10 border-green-500/20 text-green-400',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-500/10 border-red-500/20 text-red-400',
  },
  info: {
    icon: Info,
    className: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const config = variantConfig[toast.variant]
          const Icon = config.icon

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg min-w-[280px] max-w-[400px]',
                config.className
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <p className="flex-1 text-sm font-medium text-foreground">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

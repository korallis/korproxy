import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProviderIcon } from '@/components/icons/ProviderIcons'
import { cn } from '@/lib/utils'
import type { Provider } from '@/types/electron'

interface OAuthModalProps {
  provider: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type AuthState = 'idle' | 'loading' | 'success' | 'error'

const providerDisplayNames: Record<string, string> = {
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  openai: 'OpenAI',
  codex: 'OpenAI Codex',
  qwen: 'Qwen',
  iflow: 'iFlow',
}

const providerColors: Record<string, string> = {
  gemini: 'from-blue-500 to-purple-500',
  claude: 'from-orange-500 to-red-400',
  openai: 'from-green-500 to-emerald-400',
  codex: 'from-green-500 to-emerald-400',
  qwen: 'from-purple-500 to-violet-400',
  iflow: 'from-gray-500 to-gray-400',
}

export const OAuthModal: React.FC<OAuthModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [authState, setAuthState] = React.useState<AuthState>('idle')
  const [errorMessage, setErrorMessage] = React.useState<string>('')

  const displayName = providerDisplayNames[provider.toLowerCase()] || provider
  const gradientClass = providerColors[provider.toLowerCase()] || 'from-gray-500 to-gray-400'

  const handleStartOAuth = async () => {
    setAuthState('loading')
    setErrorMessage('')

    try {
      if (!window.korproxy?.auth) {
        throw new Error('App is still initializing. Please try again.')
      }
      
      const result = await window.korproxy.auth.startOAuth(provider.toLowerCase() as Provider)
      
      if (result.success) {
        setAuthState('success')
        setTimeout(() => {
          onSuccess()
          onClose()
          setAuthState('idle')
        }, 1500)
      } else {
        setAuthState('error')
        setErrorMessage(result.error || 'Authentication failed')
      }
    } catch (error) {
      setAuthState('error')
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    }
  }

  const handleRetry = () => {
    setAuthState('idle')
    setErrorMessage('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && authState !== 'loading') {
      onClose()
      setAuthState('idle')
      setErrorMessage('')
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
                exit={{ opacity: 0, scale: 0.95, y: '-48%', x: '-50%' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                  <div className={cn('h-1.5 bg-gradient-to-r', gradientClass)} />
                  
                  <div className="p-6">
                    <Dialog.Close asChild>
                      <button
                        className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        aria-label="Close"
                        disabled={authState === 'loading'}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>

                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        className={cn(
                          'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
                          'bg-gradient-to-br shadow-lg',
                          gradientClass
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ProviderIcon provider={provider} className="w-8 h-8 text-white" />
                      </motion.div>

                      <Dialog.Title className="text-xl font-semibold mb-2">
                        Connect {displayName}
                      </Dialog.Title>
                      
                      <Dialog.Description className="text-sm text-muted-foreground mb-6">
                        Sign in to link your {displayName} account with KorProxy
                      </Dialog.Description>

                      <AnimatePresence mode="wait">
                        {authState === 'idle' && (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="w-full"
                          >
                            <Button
                              onClick={handleStartOAuth}
                              className={cn(
                                'w-full h-11 bg-gradient-to-r text-white font-medium',
                                gradientClass
                              )}
                            >
                              Sign in with {displayName}
                            </Button>
                          </motion.div>
                        )}

                        {authState === 'loading' && (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Loader2 className="w-8 h-8 text-muted-foreground" />
                            </motion.div>
                            <p className="text-sm text-muted-foreground">
                              Authenticating with {displayName}...
                            </p>
                          </motion.div>
                        )}

                        {authState === 'success' && (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center gap-3"
                          >
                            <motion.div
                              className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                              >
                                <Check className="w-6 h-6 text-green-500" />
                              </motion.div>
                            </motion.div>
                            <p className="text-sm font-medium text-green-500">
                              Successfully connected!
                            </p>
                          </motion.div>
                        )}

                        {authState === 'error' && (
                          <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-3 w-full"
                          >
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                              <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="text-sm text-red-500 text-center">
                              {errorMessage}
                            </p>
                            <Button
                              onClick={handleRetry}
                              variant="outline"
                              className="w-full"
                            >
                              Try Again
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export default OAuthModal

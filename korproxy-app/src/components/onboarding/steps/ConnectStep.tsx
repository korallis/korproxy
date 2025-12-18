import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useAccounts } from '@/hooks/useAccounts'
import type { Provider } from '@/types/electron'

const providerNames: Record<Provider, string> = {
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  codex: 'OpenAI Codex',
  qwen: 'Qwen',
  iflow: 'iFlow',
}

const providerColors: Record<Provider, string> = {
  gemini: 'from-blue-500 to-cyan-500',
  claude: 'from-orange-500 to-amber-500',
  codex: 'from-emerald-500 to-green-500',
  qwen: 'from-purple-500 to-violet-500',
  iflow: 'from-pink-500 to-rose-500',
}

export function ConnectStep() {
  const { selectedProviders, nextStep, prevStep } = useOnboardingStore()
  const { accounts, refetch } = useAccounts()
  const [connectingProvider, setConnectingProvider] = useState<Provider | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connectedProviders = new Set(accounts.map((a) => a.provider))
  const allConnected = selectedProviders.every((p) => connectedProviders.has(p))

  const handleConnect = async (provider: Provider) => {
    setConnectingProvider(provider)
    setConnectError(null)
    try {
      const result = await window.korproxy.auth.startOAuth(provider)
      if (!result.success) {
        setConnectError(result.error || 'Connection failed')
      } else {
        await refetch()
      }
    } catch (error) {
      setConnectError(error instanceof Error ? error.message : 'Connection failed')
    } finally {
      setConnectingProvider(null)
    }
  }

  const isConnecting = connectingProvider !== null

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Connect Your Accounts</h2>
        <p className="text-muted-foreground">
          Sign in to each provider to authorize KorProxy
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {selectedProviders.map((provider, index) => {
          const isConnected = connectedProviders.has(provider)
          const isCurrentlyConnecting = connectingProvider === provider
          
          return (
            <motion.div
              key={provider}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border',
                isConnected ? 'border-green-500/50 bg-green-500/5' : 'border-border'
              )}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold',
                  providerColors[provider]
                )}
              >
                {providerNames[provider][0]}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{providerNames[provider]}</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
              {isConnected ? (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleConnect(provider)}
                  disabled={isConnecting}
                  className={cn(
                    'py-2 px-4 rounded-lg',
                    'bg-primary text-primary-foreground',
                    'text-sm font-medium',
                    'hover:bg-primary/90 transition-colors',
                    'disabled:opacity-50'
                  )}
                >
                  {isCurrentlyConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Connect'
                  )}
                </motion.button>
              )}
            </motion.div>
          )
        })}
      </div>

      {connectError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-500/10 text-red-500"
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{connectError}</span>
        </motion.div>
      )}

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
          disabled={!allConnected && connectedProviders.size === 0}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl',
            'bg-primary text-primary-foreground',
            'font-semibold',
            'hover:bg-primary/90 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {allConnected ? 'Continue' : 'Skip for now'}
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

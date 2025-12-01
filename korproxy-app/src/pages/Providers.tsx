import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ExternalLink } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { proxyApi } from '../lib/api'
import { ProviderCardSkeleton } from '../components/shared/LoadingSkeleton'
import * as Dialog from '@radix-ui/react-dialog'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

interface Provider {
  id: string
  name: string
  icon: string
  color: string
  description: string
  oauthSupported: boolean
}

const providers: Provider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✦',
    color: 'from-blue-500 to-cyan-500',
    description: 'Gemini Pro & Ultra models',
    oauthSupported: true,
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: '◈',
    color: 'from-orange-500 to-amber-500',
    description: 'Claude 3.5 Sonnet & Opus',
    oauthSupported: true,
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    icon: '◎',
    color: 'from-emerald-500 to-green-500',
    description: 'GPT-4 & Codex models',
    oauthSupported: true,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: '◉',
    color: 'from-purple-500 to-violet-500',
    description: 'Qwen 2.5 Coder models',
    oauthSupported: true,
  },
  {
    id: 'iflow',
    name: 'iFlow',
    icon: '◆',
    color: 'from-pink-500 to-rose-500',
    description: 'iFlow AI gateway',
    oauthSupported: true,
  },
]

interface OAuthModalProps {
  provider: Provider | null
  open: boolean
  onClose: () => void
}

function OAuthModal({ provider, open, onClose }: OAuthModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!provider) return
    setIsLoading(true)
    setError(null)
    try {
      await proxyApi.startOAuth(provider.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start OAuth')
    } finally {
      setIsLoading(false)
    }
  }

  if (!provider) return null

  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border rounded-xl p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-semibold mb-2">
            Connect {provider.name}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-muted-foreground mb-6">
            You will be redirected to sign in with your {provider.name} account.
            Make sure the proxy server is running.
          </Dialog.Description>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isLoading ? 'Connecting...' : 'Connect'}
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default function Providers() {
  const { accounts, isLoading } = useAccounts()
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const accountsByProvider = accounts.reduce(
    (acc, account) => {
      const provider = account.provider?.toLowerCase() || account.type?.toLowerCase() || 'unknown'
      acc[provider] = (acc[provider] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const handleConnect = (provider: Provider) => {
    setSelectedProvider(provider)
    setModalOpen(true)
  }

  const handleManage = (provider: Provider) => {
    window.location.href = `/accounts?provider=${provider.id}`
  }

  return (
    <div className="p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-2">Providers</h1>
        <p className="text-muted-foreground mb-6">
          Connect and manage your AI provider accounts
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))
          : providers.map((provider) => {
              const accountCount = accountsByProvider[provider.id] || 0
              const connected = accountCount > 0

              return (
                <motion.div
                  key={provider.id}
                  variants={itemVariants}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl text-white',
                          provider.color
                        )}
                      >
                        {provider.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                          connected
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {connected ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        {connected ? 'Connected' : 'Disconnected'}
                      </div>
                      {connected && (
                        <span className="text-xs text-muted-foreground">
                          {accountCount} account{accountCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        connected ? handleManage(provider) : handleConnect(provider)
                      }
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                        connected
                          ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                      )}
                    >
                      {connected ? (
                        'Manage'
                      ) : (
                        <>
                          Connect
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
      </motion.div>

      <OAuthModal
        provider={selectedProvider}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedProvider(null)
        }}
      />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { RefreshCw, Trash2, User, Clock, AlertCircle, KeyRound } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAccounts } from '../hooks/useAccounts'
import { AccountListSkeleton } from '../components/shared/LoadingSkeleton'
import { OAuthModal } from '../components/auth/OAuthModal'
import type { Account, Provider } from '@/types/electron'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 },
  },
}

const providerColors: Record<string, string> = {
  gemini: 'from-blue-500 to-cyan-500',
  claude: 'from-orange-500 to-amber-500',
  codex: 'from-emerald-500 to-green-500',
  openai: 'from-emerald-500 to-green-500',
  qwen: 'from-purple-500 to-violet-500',
  iflow: 'from-pink-500 to-rose-500',
}

const providerNames: Record<string, string> = {
  gemini: 'Google Gemini',
  claude: 'Anthropic Claude',
  codex: 'OpenAI Codex',
  openai: 'OpenAI',
  qwen: 'Qwen',
  iflow: 'iFlow',
}

function getProviderColor(provider: string): string {
  return providerColors[provider.toLowerCase()] || 'from-gray-500 to-gray-600'
}

function getProviderName(provider: string): string {
  return providerNames[provider.toLowerCase()] || provider
}

function StatusBadge({ status, disabled, expiredAt }: { status?: string; disabled?: boolean; expiredAt?: string }) {
  const isExpired = expiredAt ? new Date(expiredAt) < new Date() : false
  const isActive = (status === 'active' || status === 'ready') && !isExpired
  const isDisabled = disabled || status === 'disabled'
  const isError = status === 'error' || status === 'expired' || isExpired

  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
        isActive && !isDisabled && 'bg-green-500/10 text-green-500',
        isDisabled && 'bg-muted text-muted-foreground',
        isError && 'bg-red-500/10 text-red-500',
        !isActive && !isDisabled && !isError && 'bg-yellow-500/10 text-yellow-500'
      )}
    >
      {isDisabled ? 'Disabled' : isExpired ? 'Expired' : isError ? 'Error' : isActive ? 'Active' : status || 'Unknown'}
    </span>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <User className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
        Connect your AI provider accounts to start using the proxy
      </p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/providers')}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
      >
        Connect Account
      </motion.button>
    </motion.div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card border-red-500/20 p-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Failed to load accounts</h3>
      <p className="text-muted-foreground mb-4 max-w-sm mx-auto">{error}</p>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onRetry}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
      >
        Retry
      </motion.button>
    </motion.div>
  )
}

export default function Accounts() {
  const navigate = useNavigate()
  const { accounts, isLoading, error, refetch, deleteAccount, isDeleting } = useAccounts()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reAuthProvider, setReAuthProvider] = useState<Provider | null>(null)

  const isTokenExpired = (expiredAt?: string) => {
    if (!expiredAt) return false
    return new Date(expiredAt) < new Date()
  }

  const handleReAuth = (provider: Provider) => {
    setReAuthProvider(provider)
  }

  const handleReAuthSuccess = () => {
    refetch()
  }

  const handleReAuthClose = () => {
    setReAuthProvider(null)
  }

  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      const provider = account.provider?.toLowerCase() || 'unknown'
      if (!acc[provider]) {
        acc[provider] = []
      }
      acc[provider].push(account)
      return acc
    },
    {} as Record<string, Account[]>
  )

  const handleDelete = async (account: Account) => {
    if (!account.id) return
    setDeletingId(account.id)
    try {
      await deleteAccount(account.id)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const hasAccounts = accounts.length > 0

  return (
    <div className="p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold mb-1">Accounts</h1>
          <p className="text-muted-foreground">
            {hasAccounts
              ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''} connected`
              : 'Manage your connected accounts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </motion.button>
          {hasAccounts && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/providers')}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium"
            >
              Add Account
            </motion.button>
          )}
        </div>
      </motion.div>

      {isLoading && !accounts.length ? (
        <div className="space-y-6">
          <AccountListSkeleton />
          <AccountListSkeleton />
        </div>
      ) : error ? (
        <ErrorState error={error.message} onRetry={() => refetch()} />
      ) : !hasAccounts ? (
        <EmptyState />
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedAccounts).map(([provider, providerAccounts]) => (
              <motion.div
                key={provider}
                variants={itemVariants}
                layout
                className="glass-card overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-border bg-muted/30">
                  <h2 className="font-semibold text-sm">{getProviderName(provider)}</h2>
                </div>
                <div className="divide-y divide-border">
                  {providerAccounts.map((account) => (
                    <motion.div
                      key={account.id}
                      variants={itemVariants}
                      layout
                      className="px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-medium',
                            getProviderColor(provider)
                          )}
                        >
                          {(account.email || account.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {account.email || account.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <StatusBadge
                              status={account.enabled ? 'active' : 'disabled'}
                              disabled={!account.enabled}
                              expiredAt={account.expiredAt}
                            />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(account.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isTokenExpired(account.expiredAt) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReAuth(account.provider)}
                            className="px-3 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 text-xs font-medium flex items-center gap-1.5 transition-colors"
                            title="Re-authenticate"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Re-auth
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(account)}
                          disabled={isDeleting && deletingId === account.id}
                          className={cn(
                            'p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors',
                            isDeleting && deletingId === account.id && 'opacity-50'
                          )}
                          title="Remove account"
                        >
                          {isDeleting && deletingId === account.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {reAuthProvider && (
        <OAuthModal
          provider={reAuthProvider}
          isOpen={true}
          onClose={handleReAuthClose}
          onSuccess={handleReAuthSuccess}
        />
      )}
    </div>
  )
}

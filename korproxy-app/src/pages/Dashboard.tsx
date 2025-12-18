import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Activity, Users, Zap, AlertCircle, Plus, Power, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProxyStatus } from '../hooks/useProxyStatus'
import { useAccounts } from '../hooks/useAccounts'
import { useProxy } from '../hooks/useProxy'
import { useProxyStats } from '../hooks/useProxyStats'
import { useAuthStore, hasActiveSubscription } from '../stores/authStore'
import { CardSkeleton } from '../components/shared/LoadingSkeleton'
import { UpgradePrompt } from '../components/auth/UpgradePrompt'
import { AuthModal } from '../components/auth/AuthModal'
import { UsageChart } from '../components/dashboard/UsageChart'
import { HealthStatusBadge } from '../components/dashboard/HealthStatusBadge'
import { cn } from '../lib/utils'
import { useToast } from '../hooks/useToast'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

interface AnimatedNumberProps {
  value: number
  className?: string
}

function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      {value}
    </motion.span>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: string
  loading?: boolean
}

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  if (loading) {
    return <CardSkeleton />
  }

  return (
    <motion.div
      variants={itemVariants}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={cn('p-2 rounded-lg', color)}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">
        <AnimatedNumber value={value} />
      </p>
    </motion.div>
  )
}

const providers = [
  { id: 'gemini', name: 'Gemini', icon: '✦', color: 'from-blue-500 to-cyan-500' },
  { id: 'claude', name: 'Claude', icon: '◈', color: 'from-orange-500 to-amber-500' },
  { id: 'codex', name: 'Codex', icon: '◎', color: 'from-emerald-500 to-green-500' },
  { id: 'qwen', name: 'Qwen', icon: '◉', color: 'from-purple-500 to-violet-500' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { isRunning, isConnecting, error, port } = useProxyStatus()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { start, stop, running } = useProxy()
  const { user, subscriptionInfo, isLoading: authLoading } = useAuthStore()
  const { requestsToday, failureCount } = useProxyStats()

  const isSubscribed = hasActiveSubscription(subscriptionInfo)

  const accountsByProvider = accounts.reduce(
    (acc, account) => {
      const provider = account.provider?.toLowerCase() || 'unknown'
      acc[provider] = (acc[provider] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalAccounts = accounts.length
  const activeProviders = Object.keys(accountsByProvider).length

  const handleToggleProxy = async () => {
    if (running) {
      await stop()
    } else {
      const result = await start()
      if (!result.success) {
        if (result.requiresSubscription) {
          if (!user) {
            setAuthModalOpen(true)
          }
        } else {
          toast(result.error, 'error')
        }
      }
    }
  }

  return (
    <div className="p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </motion.div>

      {/* Proxy Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                isConnecting
                  ? 'bg-yellow-500/10'
                  : isRunning
                    ? 'bg-green-500/10'
                    : 'bg-red-500/10'
              )}
            >
              {isConnecting ? (
                <RefreshCw className="w-6 h-6 text-yellow-500 animate-spin" />
              ) : (
                <Power
                  className={cn(
                    'w-6 h-6',
                    isRunning ? 'text-green-500' : 'text-red-500'
                  )}
                />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Proxy Status</h3>
                <HealthStatusBadge />
              </div>
              <p className="text-sm text-muted-foreground">
                {isConnecting
                  ? 'Connecting...'
                  : isRunning
                    ? `Running on localhost:${port}`
                    : error || 'Stopped'}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleToggleProxy}
            disabled={isConnecting}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              running
                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
              isConnecting && 'opacity-50 cursor-not-allowed'
            )}
          >
            {running ? 'Stop' : 'Start'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <StatCard
          title="Total Accounts"
          value={totalAccounts}
          icon={<Users className="w-4 h-4 text-blue-500" />}
          color="bg-blue-500/10"
          loading={accountsLoading}
        />
        <StatCard
          title="Active Providers"
          value={activeProviders}
          icon={<Zap className="w-4 h-4 text-amber-500" />}
          color="bg-amber-500/10"
          loading={accountsLoading}
        />
        <StatCard
          title="Requests Today"
          value={requestsToday}
          icon={<Activity className="w-4 h-4 text-green-500" />}
          color="bg-green-500/10"
          loading={false}
        />
        <StatCard
          title="Errors"
          value={failureCount}
          icon={<AlertCircle className="w-4 h-4 text-red-500" />}
          color="bg-red-500/10"
          loading={false}
        />
      </motion.div>

      {/* Usage Chart */}
      <UsageChart />

      {/* Provider Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-semibold mb-4">Provider Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {providers.map((provider) => {
              const count = accountsByProvider[provider.id] || 0
              return (
                <motion.div
                  key={provider.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm',
                        provider.color
                      )}
                    >
                      {provider.icon}
                    </div>
                    <span className="font-medium text-sm">{provider.name}</span>
                  </div>
                  <p className="text-2xl font-bold">
                    <AnimatedNumber value={count} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {count === 1 ? 'account' : 'accounts'}
                  </p>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Quick Connect */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-semibold mb-4">Quick Connect</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <motion.button
              key={provider.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/providers')}
              className="glass-card p-4 flex items-center gap-3 hover:border-primary/50 transition-colors"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white',
                  provider.color
                )}
              >
                {provider.icon}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{provider.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add account
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Subscription Upgrade Prompt */}
      {!authLoading && user && !isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <UpgradePrompt 
            reason={
              subscriptionInfo?.status === 'expired' ? 'expired' :
              subscriptionInfo?.status === 'past_due' ? 'past_due' :
              'no_subscription'
            }
          />
        </motion.div>
      )}

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  )
}

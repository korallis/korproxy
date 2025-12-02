import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAccounts } from '../hooks/useAccounts'
import { ProviderCard, providerConfigs } from '../components/auth/ProviderCard'
import { OAuthModal } from '../components/auth/OAuthModal'
import { ProviderCardSkeleton } from '../components/shared/LoadingSkeleton'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

export default function Providers() {
  const { accounts, isLoading, refetch } = useAccounts()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const accountsByProvider = accounts.reduce(
    (acc, account) => {
      const provider = account.provider?.toLowerCase() || 'unknown'
      if (!acc[provider]) {
        acc[provider] = []
      }
      acc[provider].push({
        id: account.id,
        name: account.name || account.email || 'Unknown',
        provider: provider,
        enabled: account.enabled,
      })
      return acc
    },
    {} as Record<string, { id: string; name: string; provider: string; enabled: boolean }[]>
  )

  const handleConnect = useCallback((providerId: string) => {
    setSelectedProvider(providerId)
    setModalOpen(true)
  }, [])

  const handleManage = useCallback((providerId: string) => {
    navigate(`/accounts?provider=${providerId}`)
  }, [navigate])

  const handleOAuthSuccess = useCallback(() => {
    refetch()
  }, [refetch])

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedProvider(null)
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
          : providerConfigs.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                accounts={accountsByProvider[provider.id] || []}
                onConnect={() => handleConnect(provider.id)}
                onManage={() => handleManage(provider.id)}
              />
            ))}
      </motion.div>

      {selectedProvider && (
        <OAuthModal
          provider={selectedProvider}
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSuccess={handleOAuthSuccess}
        />
      )}
    </div>
  )
}

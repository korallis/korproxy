import * as React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProviderIcon } from '@/components/icons/ProviderIcons'
import { ProviderTestButton } from '@/components/providers/ProviderTestButton'

export interface ProviderConfig {
  id: string
  name: string
  displayName: string
  color: string
  gradientFrom: string
  gradientTo: string
  glowColor: string
}

export interface Account {
  id: string
  name: string
  provider: string
  enabled: boolean
}

interface ProviderCardProps {
  provider: ProviderConfig
  accounts: Account[]
  onConnect: () => void
  onManage: () => void
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  accounts,
  onConnect,
  onManage,
}) => {
  const isConnected = accounts.length > 0
  const enabledAccounts = accounts.filter((a) => a.enabled)

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'absolute -inset-0.5 rounded-2xl opacity-0 blur-xl transition-opacity duration-500',
          'group-hover:opacity-50',
          provider.glowColor
        )}
      />
      
      <div
        className={cn(
          'relative rounded-xl border border-border/50 overflow-hidden',
          'bg-gradient-to-br from-card/80 to-card/40',
          'backdrop-blur-xl shadow-lg',
          'transition-all duration-300'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 opacity-5 bg-gradient-to-br',
            `from-${provider.gradientFrom} to-${provider.gradientTo}`
          )}
          style={{
            background: `linear-gradient(135deg, ${provider.gradientFrom}15, ${provider.gradientTo}05)`,
          }}
        />

        <div className="relative p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  'shadow-lg'
                )}
                style={{
                  background: `linear-gradient(135deg, ${provider.gradientFrom}, ${provider.gradientTo})`,
                }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ProviderIcon provider={provider.id} className="w-6 h-6 text-white" />
              </motion.div>
              
              <div>
                <h3 className="font-semibold text-foreground">
                  {provider.displayName}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isConnected ? 'bg-green-500' : 'bg-muted-foreground/50'
                      )}
                      animate={isConnected ? {
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.7, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isConnected && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs font-medium',
                  'bg-background/50 backdrop-blur-sm'
                )}
              >
                {enabledAccounts.length}/{accounts.length} active
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <Button
                onClick={onManage}
                variant="outline"
                className={cn(
                  'flex-1 h-9',
                  'border-border/50 hover:border-border',
                  'bg-background/50 hover:bg-background/80',
                  'backdrop-blur-sm'
                )}
              >
                Manage Accounts
              </Button>
            ) : (
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={onConnect}
                  className={cn('w-full h-9 text-white font-medium')}
                  style={{
                    background: `linear-gradient(135deg, ${provider.gradientFrom}, ${provider.gradientTo})`,
                  }}
                >
                  Connect
                </Button>
              </motion.div>
            )}
          </div>

          {isConnected && (
            <div className="mt-3 pt-3 border-t border-border/30">
              <ProviderTestButton providerId={provider.id} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export const providerConfigs: ProviderConfig[] = [
  {
    id: 'gemini',
    name: 'gemini',
    displayName: 'Google Gemini',
    color: '#4285F4',
    gradientFrom: '#4285F4',
    gradientTo: '#9B72CB',
    glowColor: 'bg-blue-500',
  },
  {
    id: 'claude',
    name: 'claude',
    displayName: 'Anthropic Claude',
    color: '#D97757',
    gradientFrom: '#D97757',
    gradientTo: '#CC785C',
    glowColor: 'bg-orange-500',
  },
  {
    id: 'codex',
    name: 'codex',
    displayName: 'OpenAI',
    color: '#10A37F',
    gradientFrom: '#10A37F',
    gradientTo: '#059669',
    glowColor: 'bg-green-500',
  },
  {
    id: 'qwen',
    name: 'qwen',
    displayName: 'Qwen',
    color: '#7C3AED',
    gradientFrom: '#7C3AED',
    gradientTo: '#A855F7',
    glowColor: 'bg-purple-500',
  },
  {
    id: 'iflow',
    name: 'iflow',
    displayName: 'iFlow',
    color: '#6B7280',
    gradientFrom: '#6B7280',
    gradientTo: '#9CA3AF',
    glowColor: 'bg-gray-500',
  },
]

export default ProviderCard

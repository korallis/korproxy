import { useState } from 'react'
import { motion } from 'motion/react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { User, LogOut, CreditCard, ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { SubscriptionBadge } from './SubscriptionBadge'
import { AuthModal } from './AuthModal'

const DASHBOARD_URL = 'https://korproxy.dev/dashboard'

export function UserMenu() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { user, subscriptionInfo, logout, isLoading } = useAuthStore()

  const handleOpenDashboard = () => {
    window.open(DASHBOARD_URL, '_blank')
  }

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-24 mb-1" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setAuthModalOpen(true)}
          className={cn(
            'w-full px-3 py-2.5 rounded-lg font-medium transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'flex items-center justify-center gap-2'
          )}
        >
          <User className="w-4 h-4" />
          Sign In
        </motion.button>
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    )
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={cn(
            'w-full px-3 py-2 rounded-lg transition-colors',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring',
            'flex items-center gap-3'
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[220px] bg-card border border-border rounded-lg shadow-lg p-1 z-50"
            sideOffset={8}
            align="end"
          >
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium">{user.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {subscriptionInfo && (
                <div className="mt-2">
                  <SubscriptionBadge 
                    status={subscriptionInfo.status} 
                    daysLeft={subscriptionInfo.daysLeft}
                  />
                </div>
              )}
            </div>

            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer',
                'text-sm hover:bg-muted focus:bg-muted focus:outline-none'
              )}
              onClick={handleOpenDashboard}
            >
              <CreditCard className="w-4 h-4" />
              <span className="flex-1">Manage Subscription</span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-border my-1" />

            <DropdownMenu.Item
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer',
                'text-sm text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none'
              )}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}

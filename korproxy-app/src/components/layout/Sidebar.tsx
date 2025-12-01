import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Plug,
  Users,
  ScrollText,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useProxyStore } from '../../hooks/useProxy'
import { StatusIndicator } from '../shared/StatusIndicator'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/providers', icon: Plug, label: 'Providers' },
  { to: '/accounts', icon: Users, label: 'Accounts' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const { running, port, logs } = useProxyStore()

  const requestCount = logs.length

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg">KorProxy</h1>
            <p className="text-xs text-muted-foreground">AI Gateway</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-primary rounded-lg"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="relative z-10 font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <motion.div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            running ? 'bg-green-500/10' : 'bg-muted'
          )}
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <StatusIndicator status={running ? 'online' : 'offline'} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {running ? 'Running' : 'Stopped'}
            </p>
            {running && (
              <p className="text-xs text-muted-foreground">
                Port {port}
                {requestCount > 0 && ` • ${requestCount} requests`}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </aside>
  )
}

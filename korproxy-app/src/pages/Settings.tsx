import { motion } from 'framer-motion'
import { Moon, Sun, Github, ExternalLink, RefreshCw, Heart } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { cn } from '../lib/utils'
import { useAppStore } from '../stores/appStore'
import { useProxyStore } from '../hooks/useProxy'
import { useToast } from '../hooks/useToast'
import { StatusIndicator } from '../components/shared/StatusIndicator'

function SettingRow({
  label,
  description,
  disabled,
  children,
}: {
  label: string
  description?: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-4',
        disabled && 'opacity-50'
      )}
    >
      <div>
        <p className="font-medium">{label}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

function SwitchControl({
  checked,
  onCheckedChange,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'w-11 h-6 rounded-full relative transition-colors',
        'bg-muted data-[state=checked]:bg-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <Switch.Thumb
        className={cn(
          'block w-5 h-5 bg-white rounded-full shadow-sm transition-transform',
          'translate-x-0.5 data-[state=checked]:translate-x-[22px]'
        )}
      />
    </Switch.Root>
  )
}

export default function Settings() {
  const { toast } = useToast()
  const {
    theme,
    setTheme,
    minimizeToTray,
    setMinimizeToTray,
    port,
    setPort,
    proxyAutoStart,
    setProxyAutoStart,
  } = useAppStore()
  const { running } = useProxyStore()

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme)
    toast(`Theme changed to ${newTheme} mode`, 'success')
  }

  const handleMinimizeToTrayChange = (value: boolean) => {
    setMinimizeToTray(value)
    toast(
      value ? 'Will minimize to tray when closed' : 'Will exit when closed',
      'success'
    )
  }

  const handlePortChange = (value: string) => {
    const portNum = parseInt(value, 10)
    if (!isNaN(portNum) && portNum >= 1 && portNum <= 65535) {
      setPort(portNum)
    }
  }

  const handlePortBlur = () => {
    toast(`Proxy port set to ${port}`, 'success')
  }

  const handleAutoStartChange = (value: boolean) => {
    setProxyAutoStart(value)
    toast(
      value ? 'Proxy will start automatically' : 'Proxy will start manually',
      'success'
    )
  }

  return (
    <div className="p-6 pt-12">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Tabs.Root defaultValue="general">
          <Tabs.List className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
            {[
              { value: 'general', label: 'General' },
              { value: 'proxy', label: 'Proxy' },
              { value: 'about', label: 'About' },
            ].map((tab) => (
              <Tabs.Trigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                  'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
                )}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="general">
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <div className="p-5">
                <h3 className="font-semibold mb-1">Appearance</h3>
                <p className="text-sm text-muted-foreground">
                  Customize how KorProxy looks
                </p>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Theme"
                  description="Switch between dark and light mode"
                >
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleThemeChange('light')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        theme === 'light'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Sun className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleThemeChange('dark')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        theme === 'dark'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Moon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </SettingRow>
              </div>
              <div className="p-5">
                <h3 className="font-semibold mb-1">Behavior</h3>
                <p className="text-sm text-muted-foreground">
                  Control how the app behaves
                </p>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Start on boot"
                  description="Launch KorProxy when your computer starts (Coming soon)"
                  disabled
                >
                  <SwitchControl
                    checked={false}
                    onCheckedChange={() => {}}
                    disabled
                  />
                </SettingRow>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Minimize to tray"
                  description="Keep running in the system tray when closed"
                >
                  <SwitchControl
                    checked={minimizeToTray}
                    onCheckedChange={handleMinimizeToTrayChange}
                  />
                </SettingRow>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="proxy">
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <div className="p-5">
                <h3 className="font-semibold mb-1">Proxy Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure proxy server settings
                </p>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Proxy Status"
                  description="Current proxy server status"
                >
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={running ? 'online' : 'offline'} />
                    <span
                      className={cn(
                        'text-sm font-medium',
                        running ? 'text-green-400' : 'text-muted-foreground'
                      )}
                    >
                      {running ? 'Running' : 'Stopped'}
                    </span>
                  </div>
                </SettingRow>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Proxy Port"
                  description="The port the proxy server listens on"
                >
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => handlePortChange(e.target.value)}
                    onBlur={handlePortBlur}
                    min={1}
                    max={65535}
                    className={cn(
                      'w-24 px-3 py-2 rounded-lg text-sm font-mono',
                      'bg-muted border border-border',
                      'focus:outline-none focus:ring-2 focus:ring-ring'
                    )}
                    placeholder="1337"
                  />
                </SettingRow>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Auto-start proxy"
                  description="Start the proxy server when the app launches"
                >
                  <SwitchControl
                    checked={proxyAutoStart}
                    onCheckedChange={handleAutoStartChange}
                  />
                </SettingRow>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="about">
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              <div className="p-5">
                <h3 className="font-semibold mb-1">About KorProxy</h3>
                <p className="text-sm text-muted-foreground">
                  Version information and links
                </p>
              </div>
              <div className="px-5">
                <SettingRow label="Version">
                  <span className="text-sm text-muted-foreground font-mono">
                    v1.0.0
                  </span>
                </SettingRow>
              </div>
              <div className="px-5 py-4 flex flex-wrap gap-3">
                <motion.a
                  href="https://github.com/korproxy/korproxy"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </motion.a>
                <motion.a
                  href="https://korproxy.dev/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Documentation
                </motion.a>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toast('Already on the latest version!', 'info')}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Check for Updates
                </motion.button>
              </div>
              <div className="p-5">
                <h3 className="font-semibold mb-3">Credits</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="flex items-center gap-2">
                    Made with <Heart className="w-4 h-4 text-red-500" /> by the
                    KorProxy team
                  </p>
                  <p>
                    Built with React, TypeScript, Electron, and Tailwind CSS
                  </p>
                  <p className="text-xs">
                    © 2024 KorProxy. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </motion.div>
    </div>
  )
}

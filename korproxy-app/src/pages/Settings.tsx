import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, ExternalLink, RefreshCw, Heart, Download, Check, AlertCircle } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Switch from '@radix-ui/react-switch'
import { cn } from '../lib/utils'
import { useAppStore } from '../stores/appStore'
import { useProxyStore } from '../hooks/useProxy'
import { useToast } from '../hooks/useToast'
import { StatusIndicator } from '../components/shared/StatusIndicator'
import { ThemeToggle } from '../components/shared/ThemeToggle'
import { ConfigEditor } from '../components/settings/ConfigEditor'
import { IntegrationsSetup } from '../components/settings/IntegrationsSetup'
import type { UpdateStatus } from '../types/electron'

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
    minimizeToTray,
    setMinimizeToTray,
    port,
    setPort,
    proxyAutoStart,
    setProxyAutoStart,
    initFromMain,
  } = useAppStore()
  const { running } = useProxyStore()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ status: 'not-available' })
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('...')

  useEffect(() => {
    initFromMain()
    if (window.korproxy?.app?.getVersion) {
      window.korproxy.app.getVersion().then(setAppVersion)
    }
  }, [initFromMain])

  useEffect(() => {
    if (!window.korproxy?.updater) return
    
    window.korproxy.updater.getStatus().then(setUpdateStatus)
    const unsubscribe = window.korproxy.updater.onStatus(setUpdateStatus)
    
    return unsubscribe
  }, [])

  const handleCheckForUpdates = async () => {
    if (!window.korproxy?.updater) {
      toast('Auto-updater not available in development mode', 'info')
      return
    }
    
    setIsCheckingUpdate(true)
    try {
      const status = await window.korproxy.updater.check()
      if (status.status === 'not-available') {
        toast('You are on the latest version!', 'success')
      } else if (status.status === 'available') {
        toast(`Version ${status.version} is available!`, 'info')
      } else if (status.status === 'error') {
        toast(status.error || 'Failed to check for updates', 'error')
      }
    } catch {
      toast('Failed to check for updates', 'error')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const handleDownloadUpdate = async () => {
    if (!window.korproxy?.updater) return
    await window.korproxy.updater.download()
  }

  const handleInstallUpdate = async () => {
    if (!window.korproxy?.updater) return
    await window.korproxy.updater.install()
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
              { value: 'integrations', label: 'Integrations' },
              { value: 'config', label: 'Config' },
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
            <div className="glass-card divide-y divide-border/50">
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
                  <ThemeToggle showSystemOption />
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
            <div className="glass-card divide-y divide-border/50">
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

          <Tabs.Content value="integrations">
            <IntegrationsSetup />
          </Tabs.Content>

          <Tabs.Content value="config">
            <ConfigEditor />
          </Tabs.Content>

          <Tabs.Content value="about">
            <div className="glass-card divide-y divide-border/50">
              <div className="p-5">
                <h3 className="font-semibold mb-1">About KorProxy</h3>
                <p className="text-sm text-muted-foreground">
                  Version information and links
                </p>
              </div>
              <div className="px-5">
                <SettingRow label="Version">
                  <span className="text-sm text-muted-foreground font-mono">
                    v{appVersion}
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
                <AnimatePresence mode="wait">
                  {updateStatus.status === 'available' ? (
                    <motion.button
                      key="download"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDownloadUpdate}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download v{updateStatus.version}
                    </motion.button>
                  ) : updateStatus.status === 'downloading' ? (
                    <motion.div
                      key="downloading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Downloading... {updateStatus.progress}%
                    </motion.div>
                  ) : updateStatus.status === 'downloaded' ? (
                    <motion.button
                      key="install"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInstallUpdate}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Install & Restart
                    </motion.button>
                  ) : updateStatus.status === 'error' ? (
                    <motion.button
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckForUpdates}
                      className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Retry Check
                    </motion.button>
                  ) : (
                    <motion.button
                      key="check"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckForUpdates}
                      disabled={isCheckingUpdate || updateStatus.status === 'checking'}
                      className={cn(
                        'px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-2',
                        (isCheckingUpdate || updateStatus.status === 'checking') && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <RefreshCw className={cn('w-4 h-4', (isCheckingUpdate || updateStatus.status === 'checking') && 'animate-spin')} />
                      {isCheckingUpdate || updateStatus.status === 'checking' ? 'Checking...' : 'Check for Updates'}
                    </motion.button>
                  )}
                </AnimatePresence>
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

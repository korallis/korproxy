import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Save, RefreshCw, AlertCircle, Check, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export function ConfigEditor() {
  const { toast } = useToast()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const hasChanges = content !== originalContent

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await window.korproxy.config.get()
      if (result.success) {
        const configContent = result.content || getDefaultConfig()
        setContent(configContent)
        setOriginalContent(configContent)
      } else {
        setError(result.error || 'Failed to load config')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load config')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const result = await window.korproxy.config.set(content)
      if (result.success) {
        setOriginalContent(content)
        setSaveSuccess(true)
        toast('Configuration saved successfully', 'success')
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        toast(result.error || 'Failed to save config', 'error')
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to save config', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setContent(originalContent)
  }

  if (isLoading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
          <div className="h-5 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Configuration File</h3>
              <p className="text-sm text-muted-foreground">
                Edit the proxy server YAML configuration
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {hasChanges && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full"
                >
                  Unsaved changes
                </motion.span>
              )}
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadConfig}
              disabled={isLoading}
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors"
              title="Reload config"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </motion.button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-6">
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-500">Failed to load configuration</p>
              <p className="text-xs text-red-400 mt-1">{error}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={loadConfig}
              className="ml-auto px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </motion.button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={cn(
                'w-full h-80 p-4 rounded-lg font-mono text-sm resize-none',
                'bg-background border border-border/50 text-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                'placeholder:text-muted-foreground'
              )}
              placeholder="# Enter your YAML configuration here..."
              spellCheck={false}
            />
          </div>

          <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Changes require proxy restart to take effect
            </p>
            <div className="flex items-center gap-2">
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  hasChanges
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
              </motion.button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getDefaultConfig(): string {
  return `# KorProxy Configuration
# Documentation: https://korproxy.dev/docs/config

server:
  port: 1337
  host: "127.0.0.1"

providers:
  gemini:
    enabled: true
    load_balance: round_robin
  claude:
    enabled: true
    load_balance: round_robin
  codex:
    enabled: true
    load_balance: round_robin
  qwen:
    enabled: false
  iflow:
    enabled: false

logging:
  level: info
  format: json

rate_limiting:
  enabled: true
  requests_per_minute: 60
`
}

export default ConfigEditor

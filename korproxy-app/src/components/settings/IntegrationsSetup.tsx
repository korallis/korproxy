import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  RefreshCw,
  AlertCircle,
  Terminal,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'
import { useAppStore } from '@/stores/appStore'
import type { FactoryCustomModel, IntegrationStatus } from '@/types/electron'

interface ModelOption {
  id: string
  displayName: string
  model: string
  provider: 'anthropic' | 'openai' | 'generic-chat-completion-api'
  maxTokens: number
  category: 'claude' | 'codex' | 'gemini'
}

const AVAILABLE_MODELS: ModelOption[] = [
  // Claude models
  {
    id: 'claude-opus',
    displayName: 'Claude Opus 4.5',
    model: 'claude-opus-4-5-20251101',
    provider: 'anthropic',
    maxTokens: 64000,
    category: 'claude',
  },
  {
    id: 'claude-sonnet',
    displayName: 'Claude Sonnet 4.5',
    model: 'claude-sonnet-4-5-20250929',
    provider: 'anthropic',
    maxTokens: 64000,
    category: 'claude',
  },
  {
    id: 'claude-haiku',
    displayName: 'Claude Haiku 4.5',
    model: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    maxTokens: 64000,
    category: 'claude',
  },
  // Codex models
  {
    id: 'gpt-5-codex-max',
    displayName: 'GPT-5.1 Codex Max',
    model: 'gpt-5.1-codex-max',
    provider: 'openai',
    maxTokens: 128000,
    category: 'codex',
  },
  {
    id: 'gpt-5-codex',
    displayName: 'GPT-5.1 Codex',
    model: 'gpt-5.1-codex',
    provider: 'openai',
    maxTokens: 128000,
    category: 'codex',
  },
  {
    id: 'gpt-5-codex-mini',
    displayName: 'GPT-5.1 Codex Mini',
    model: 'gpt-5.1-codex-mini',
    provider: 'openai',
    maxTokens: 128000,
    category: 'codex',
  },
  // Gemini models
  {
    id: 'gemini-3-pro-image',
    displayName: 'Gemini 3 Pro (Image)',
    model: 'gemini-3-pro-image-preview',
    provider: 'generic-chat-completion-api',
    maxTokens: 32000,
    category: 'gemini',
  },
  {
    id: 'gemini-3-pro',
    displayName: 'Gemini 3 Pro Preview',
    model: 'gemini-3-pro-preview',
    provider: 'generic-chat-completion-api',
    maxTokens: 32000,
    category: 'gemini',
  },
  {
    id: 'gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    model: 'gemini-2.5-pro',
    provider: 'generic-chat-completion-api',
    maxTokens: 32000,
    category: 'gemini',
  },
]

const AMP_PROVIDER_INFO = [
  { mode: 'Smart mode', provider: 'Claude', model: 'Claude Opus 4.5' },
  { mode: 'Rush mode', provider: 'Claude', model: 'Claude Haiku 4.5' },
  { mode: 'Oracle subagent', provider: 'OpenAI', model: 'GPT-5.1 (medium reasoning)' },
  { mode: 'Librarian', provider: 'Claude', model: 'Claude Sonnet 4.5' },
  { mode: 'Search subagent', provider: 'Claude', model: 'Claude Haiku 4.5' },
  { mode: 'Review feature', provider: 'Gemini', model: 'Gemini 2.5 Flash-Lite' },
]

export function IntegrationsSetup() {
  const { toast } = useToast()
  const { port } = useAppStore()

  // Factory state
  const [factoryStatus, setFactoryStatus] = useState<IntegrationStatus | null>(null)
  const [factoryLoading, setFactoryLoading] = useState(true)
  const [factorySaving, setFactorySaving] = useState(false)
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set())
  const [factoryExpanded, setFactoryExpanded] = useState(true)

  // Amp state
  const [ampStatus, setAmpStatus] = useState<IntegrationStatus | null>(null)
  const [ampLoading, setAmpLoading] = useState(true)
  const [ampSaving, setAmpSaving] = useState(false)
  const [ampExpanded, setAmpExpanded] = useState(true)

  const loadFactoryStatus = useCallback(async () => {
    setFactoryLoading(true)
    try {
      const result = await window.korproxy.integrations.factory.get()
      if (result.success && result.status) {
        setFactoryStatus(result.status)
        // Pre-select models that are already configured
        if (result.status.models) {
          const existingIds = new Set(
            AVAILABLE_MODELS.filter((m) => result.status?.models?.includes(m.model)).map((m) => m.id)
          )
          setSelectedModels(existingIds)
        }
      }
    } catch (err) {
      toast('Failed to load Factory status', 'error')
    } finally {
      setFactoryLoading(false)
    }
  }, [toast])

  const loadAmpStatus = useCallback(async () => {
    setAmpLoading(true)
    try {
      const result = await window.korproxy.integrations.amp.get()
      if (result.success && result.status) {
        setAmpStatus(result.status)
      }
    } catch (err) {
      toast('Failed to load Amp status', 'error')
    } finally {
      setAmpLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadFactoryStatus()
    loadAmpStatus()
  }, [loadFactoryStatus, loadAmpStatus])

  const handleFactoryConfigure = async () => {
    if (selectedModels.size === 0) {
      toast('Please select at least one model', 'error')
      return
    }

    setFactorySaving(true)
    try {
      const models: FactoryCustomModel[] = AVAILABLE_MODELS.filter((m) => selectedModels.has(m.id)).map((m) => {
        // Factory CLI constructs API paths differently per provider:
        // - anthropic: calls {base_url}/v1/messages -> use base without /v1
        // - openai: calls {base_url}/responses -> use base with /v1
        // - generic-chat-completion-api: calls {base_url}/chat/completions -> use base with /v1
        const baseUrl = m.provider === 'anthropic'
          ? `http://localhost:${port}`
          : `http://localhost:${port}/v1`

        return {
          model_display_name: `${m.displayName} [KorProxy]`,
          model: m.model,
          base_url: baseUrl,
          api_key: 'korproxy',
          provider: m.provider,
          max_tokens: m.maxTokens,
        }
      })

      const result = await window.korproxy.integrations.factory.set(models)
      if (result.success) {
        toast('Factory Droid CLI configured successfully!', 'success')
        await loadFactoryStatus()
      } else {
        toast(result.error || 'Failed to configure', 'error')
      }
    } catch (err) {
      toast('Failed to configure Factory', 'error')
    } finally {
      setFactorySaving(false)
    }
  }

  const handleAmpConfigure = async () => {
    setAmpSaving(true)
    try {
      const result = await window.korproxy.integrations.amp.set(port)
      if (result.success) {
        toast('Amp CLI configured successfully!', 'success')
        await loadAmpStatus()
      } else {
        toast(result.error || 'Failed to configure', 'error')
      }
    } catch (err) {
      toast('Failed to configure Amp', 'error')
    } finally {
      setAmpSaving(false)
    }
  }

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAllInCategory = (category: 'claude' | 'codex' | 'gemini') => {
    setSelectedModels((prev) => {
      const next = new Set(prev)
      AVAILABLE_MODELS.filter((m) => m.category === category).forEach((m) => next.add(m.id))
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Factory Droid CLI */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setFactoryExpanded(!factoryExpanded)}
          className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Factory Droid CLI</h3>
              <p className="text-sm text-muted-foreground">Configure KorProxy models for Factory CLI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {factoryStatus?.configured && (
              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Configured
              </span>
            )}
            {factoryExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        <AnimatePresence>
          {factoryExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-border/50">
                {factoryLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mt-4 mb-4">
                      Select models to add to Factory&apos;s custom_models in{' '}
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs">~/.factory/config.json</code>
                    </p>

                    {/* Model categories */}
                    {(['claude', 'codex', 'gemini'] as const).map((category) => (
                      <div key={category} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium capitalize">{category} Models</h4>
                          <button
                            onClick={() => selectAllInCategory(category)}
                            className="text-xs text-primary hover:underline"
                          >
                            Select all
                          </button>
                        </div>
                        <div className="space-y-2">
                          {AVAILABLE_MODELS.filter((m) => m.category === category).map((model) => (
                            <label
                              key={model.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                                selectedModels.has(model.id)
                                  ? 'border-primary/50 bg-primary/5'
                                  : 'border-border hover:border-border/80 bg-muted/30'
                              )}
                            >
                              <div
                                onClick={() => toggleModel(model.id)}
                                className={cn(
                                  'w-5 h-5 rounded border flex items-center justify-center shrink-0',
                                  selectedModels.has(model.id)
                                    ? 'bg-primary border-primary'
                                    : 'border-muted-foreground/50'
                                )}
                              >
                                {selectedModels.has(model.id) && (
                                  <Check className="w-3 h-3 text-primary-foreground" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{model.displayName}</p>
                                <p className="text-xs text-muted-foreground font-mono">{model.model}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} selected
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleFactoryConfigure}
                        disabled={factorySaving || selectedModels.size === 0}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                          selectedModels.size > 0
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                        )}
                      >
                        {factorySaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        {factorySaving ? 'Configuring...' : 'Configure Factory Droid'}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Amp CLI */}
      <div className="glass-card overflow-hidden">
        <button
          onClick={() => setAmpExpanded(!ampExpanded)}
          className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Amp CLI & VS Code Extension</h3>
              <p className="text-sm text-muted-foreground">Route Amp requests through KorProxy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {ampStatus?.configured && (
              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                Configured
              </span>
            )}
            {ampExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        <AnimatePresence>
          {ampExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-border/50">
                {ampLoading ? (
                  <div className="py-8 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mt-4 mb-4">
                      Sets <code className="px-1.5 py-0.5 bg-muted rounded text-xs">amp.url</code> to{' '}
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs">http://localhost:{port}</code> in{' '}
                      <code className="px-1.5 py-0.5 bg-muted rounded text-xs">~/.config/amp/settings.json</code>
                    </p>

                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium mb-3">Amp uses different providers for different modes:</h4>
                      <div className="space-y-2">
                        {AMP_PROVIDER_INFO.map((info, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{info.mode}</span>
                            <span className="font-mono text-xs">{info.provider} ({info.model})</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Authenticated providers use your OAuth subscription. Others fallback to ampcode.com.
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <a
                        href="https://ampcode.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        Learn more about Amp
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAmpConfigure}
                        disabled={ampSaving}
                        className={cn(
                          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                          'bg-primary hover:bg-primary/90 text-primary-foreground'
                        )}
                      >
                        {ampSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {ampSaving ? 'Configuring...' : 'Configure Amp CLI'}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info note */}
      <div className="p-4 bg-muted/30 border border-border/50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Note</p>
            <p>
              These configurations write to external config files on your system. Make sure KorProxy is running
              and the relevant providers are authenticated before using these tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntegrationsSetup

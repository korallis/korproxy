import { describe, it, expect } from 'vitest'

interface ModelDefinition {
  id: string
  name: string
  provider: string
  contextWindow?: number
  supportsThinking?: boolean
}

interface ProviderDefinition {
  id: string
  name: string
  authType: 'oauth' | 'apikey'
  models: ModelDefinition[]
}

const PROVIDERS: ProviderDefinition[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    authType: 'oauth',
    models: [
      { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', provider: 'anthropic', supportsThinking: true },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic', supportsThinking: true },
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic', supportsThinking: false },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    authType: 'oauth',
    models: [
      { id: 'gpt-5.1-codex-max', name: 'GPT 5.1 Codex Max', provider: 'openai', supportsThinking: true },
      { id: 'gpt-5.1-codex', name: 'GPT 5.1 Codex', provider: 'openai', supportsThinking: true },
      { id: 'gpt-5.1-codex-mini', name: 'GPT 5.1 Codex Mini', provider: 'openai', supportsThinking: true },
    ],
  },
  {
    id: 'google',
    name: 'Google AI',
    authType: 'oauth',
    models: [
      { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'google', supportsThinking: true },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', supportsThinking: true },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', supportsThinking: true },
    ],
  },
]

function getProvider(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

function getAllProviders(): ProviderDefinition[] {
  return PROVIDERS
}

function getModelsForProvider(providerId: string): ModelDefinition[] {
  const provider = getProvider(providerId)
  return provider?.models ?? []
}

function getModelById(modelId: string): ModelDefinition | undefined {
  for (const provider of PROVIDERS) {
    const model = provider.models.find((m) => m.id === modelId)
    if (model) return model
  }
  return undefined
}

describe('Provider Registry', () => {
  describe('getProvider', () => {
    it('should return correct provider for anthropic', () => {
      const provider = getProvider('anthropic')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('Anthropic')
      expect(provider?.authType).toBe('oauth')
    })

    it('should return correct provider for openai', () => {
      const provider = getProvider('openai')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('OpenAI')
    })

    it('should return correct provider for google', () => {
      const provider = getProvider('google')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('Google AI')
    })

    it('should return undefined for unknown provider', () => {
      const provider = getProvider('unknown-provider')
      expect(provider).toBeUndefined()
    })

    it('should be case sensitive', () => {
      const provider = getProvider('Anthropic')
      expect(provider).toBeUndefined()
    })
  })

  describe('getAllProviders', () => {
    it('should return all providers', () => {
      const providers = getAllProviders()
      expect(providers.length).toBe(3)
    })

    it('should include anthropic, openai, and google', () => {
      const providers = getAllProviders()
      const ids = providers.map((p) => p.id)
      expect(ids).toContain('anthropic')
      expect(ids).toContain('openai')
      expect(ids).toContain('google')
    })

    it('should return providers with required fields', () => {
      const providers = getAllProviders()
      for (const provider of providers) {
        expect(provider.id).toBeDefined()
        expect(provider.name).toBeDefined()
        expect(provider.authType).toBeDefined()
        expect(provider.models).toBeDefined()
        expect(Array.isArray(provider.models)).toBe(true)
      }
    })
  })

  describe('getModelsForProvider', () => {
    it('should return models for anthropic', () => {
      const models = getModelsForProvider('anthropic')
      expect(models.length).toBeGreaterThan(0)
      expect(models.some((m) => m.id.includes('claude'))).toBe(true)
    })

    it('should return models for openai', () => {
      const models = getModelsForProvider('openai')
      expect(models.length).toBeGreaterThan(0)
      expect(models.some((m) => m.id.includes('gpt'))).toBe(true)
    })

    it('should return models for google', () => {
      const models = getModelsForProvider('google')
      expect(models.length).toBeGreaterThan(0)
      expect(models.some((m) => m.id.includes('gemini'))).toBe(true)
    })

    it('should return empty array for unknown provider', () => {
      const models = getModelsForProvider('unknown')
      expect(models).toEqual([])
    })

    it('should return models with correct provider reference', () => {
      const models = getModelsForProvider('anthropic')
      for (const model of models) {
        expect(model.provider).toBe('anthropic')
      }
    })
  })

  describe('getModelById', () => {
    it('should find claude opus model', () => {
      const model = getModelById('claude-opus-4-5-20251101')
      expect(model).toBeDefined()
      expect(model?.name).toBe('Claude Opus 4.5')
      expect(model?.provider).toBe('anthropic')
    })

    it('should find gpt model', () => {
      const model = getModelById('gpt-5.1-codex')
      expect(model).toBeDefined()
      expect(model?.provider).toBe('openai')
    })

    it('should find gemini model', () => {
      const model = getModelById('gemini-2.5-pro')
      expect(model).toBeDefined()
      expect(model?.provider).toBe('google')
    })

    it('should return undefined for unknown model', () => {
      const model = getModelById('unknown-model-id')
      expect(model).toBeUndefined()
    })
  })

  describe('Model thinking support', () => {
    it('claude opus should support thinking', () => {
      const model = getModelById('claude-opus-4-5-20251101')
      expect(model?.supportsThinking).toBe(true)
    })

    it('claude haiku should not support thinking', () => {
      const model = getModelById('claude-haiku-4-5-20251001')
      expect(model?.supportsThinking).toBe(false)
    })

    it('gemini pro should support thinking', () => {
      const model = getModelById('gemini-2.5-pro')
      expect(model?.supportsThinking).toBe(true)
    })
  })
})

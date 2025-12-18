export interface ModelDescriptor {
  id: string
  name: string
  description?: string
  thinkingSupport?: {
    min: number
    max: number
  }
  reasoningLevels?: string[]
}

export interface ProviderDescriptor {
  id: string
  name: string
  icon: string
  authType: 'oauth' | 'apiKey'
  color: string
  gradientFrom: string
  gradientTo: string
  description: string
  models: ModelDescriptor[]
  endpoints: {
    completion: string
    chat: string
  }
}

export const PROVIDER_REGISTRY: ProviderDescriptor[] = [
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Bot',
    authType: 'oauth',
    color: '#F97316',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
    description: 'Claude Pro subscription',
    models: [
      {
        id: 'claude-opus-4-5-20251101',
        name: 'Claude Opus 4.5',
        description: 'Premium model combining maximum intelligence with practical performance',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        description: 'Balanced model with excellent coding capabilities',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        description: 'Fastest Claude model for quick tasks',
      },
      {
        id: 'claude-opus-4-1-20250805',
        name: 'Claude 4.1 Opus',
        description: 'Previous generation Opus model',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude 4 Opus',
        description: 'Claude 4 flagship model',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude 4 Sonnet',
        description: 'Claude 4 balanced model',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        description: 'Claude 3.7 generation Sonnet',
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Claude 3.5 generation Haiku',
      },
    ],
    endpoints: { completion: '/v1/completions', chat: '/v1/messages' },
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    icon: 'Brain',
    authType: 'oauth',
    color: '#10B981',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-green-500',
    description: 'ChatGPT Plus subscription',
    models: [
      {
        id: 'gpt-5.1-codex-max',
        name: 'GPT 5.1 Codex Max',
        description: 'Most powerful Codex model for complex agentic tasks',
        reasoningLevels: ['low', 'medium', 'high', 'xhigh'],
      },
      {
        id: 'gpt-5.1-codex',
        name: 'GPT 5.1 Codex',
        description: 'Latest Codex model for coding tasks',
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5.1-codex-mini',
        name: 'GPT 5.1 Codex Mini',
        description: 'Smaller, faster version of Codex',
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5.1',
        name: 'GPT 5.1',
        description: 'Latest GPT model for general tasks',
      },
      {
        id: 'gpt-5.2',
        name: 'GPT 5.2',
        description: 'Next generation GPT model',
      },
      {
        id: 'gpt-5-codex',
        name: 'GPT 5 Codex',
        description: 'GPT 5 optimized for code',
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5',
        name: 'GPT 5',
        description: 'GPT 5 base model',
        reasoningLevels: ['minimal', 'low', 'medium', 'high'],
      },
    ],
    endpoints: { completion: '/v1/completions', chat: '/v1/chat/completions' },
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'Sparkles',
    authType: 'oauth',
    color: '#3B82F6',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    description: 'Google AI Studio subscription',
    models: [
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro Preview',
        description: 'Next-generation flagship model with advanced reasoning',
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini 3 Pro Image Preview',
        description: 'Gemini 3 Pro with image generation capabilities',
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Stable flagship model for complex tasks',
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient mid-size model',
        thinkingSupport: { min: 0, max: 24576 },
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Smallest and most cost effective model',
        thinkingSupport: { min: 0, max: 24576 },
      },
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        description: 'State-of-the-art image generation and editing',
      },
      {
        id: 'gemini-pro-latest',
        name: 'Gemini Pro Latest',
        description: 'Always points to latest Pro release',
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        description: 'Always points to latest Flash release',
        thinkingSupport: { min: 0, max: 24576 },
      },
    ],
    endpoints: { completion: '/v1/completions', chat: '/v1/chat/completions' },
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: 'Cpu',
    authType: 'apiKey',
    color: '#8B5CF6',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-500',
    description: 'Alibaba Qwen API',
    models: [
      {
        id: 'qwen3-coder-plus',
        name: 'Qwen3 Coder Plus',
        description: 'Advanced code generation and understanding model',
      },
      {
        id: 'qwen3-coder-flash',
        name: 'Qwen3 Coder Flash',
        description: 'Fast code generation model',
      },
      {
        id: 'vision-model',
        name: 'Qwen3 Vision Model',
        description: 'Multimodal vision model',
      },
    ],
    endpoints: { completion: '/v1/completions', chat: '/v1/chat/completions' },
  },
  {
    id: 'iflow',
    name: 'iFlow',
    icon: 'Globe',
    authType: 'apiKey',
    color: '#EC4899',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-rose-500',
    description: 'iFlow AI subscription',
    models: [
      {
        id: 'tstars2.0',
        name: 'TStars 2.0',
        description: 'iFlow TStars multimodal assistant',
      },
      {
        id: 'qwen3-coder-plus',
        name: 'Qwen3 Coder Plus',
        description: 'Qwen3 Coder Plus via iFlow',
      },
      {
        id: 'qwen3-coder',
        name: 'Qwen3 Coder 480B',
        description: 'Qwen3 Coder 480B A35B',
      },
      {
        id: 'qwen3-max',
        name: 'Qwen3 Max',
        description: 'Qwen3 flagship model',
      },
      {
        id: 'qwen3-vl-plus',
        name: 'Qwen3 VL Plus',
        description: 'Qwen3 multimodal vision-language',
      },
      {
        id: 'kimi-k2',
        name: 'Kimi K2',
        description: 'Moonshot Kimi K2 general model',
      },
      {
        id: 'kimi-k2-thinking',
        name: 'Kimi K2 Thinking',
        description: 'Moonshot Kimi K2 with extended thinking',
      },
      {
        id: 'glm-4.6',
        name: 'GLM 4.6',
        description: 'Zhipu GLM 4.6 general model',
      },
      {
        id: 'deepseek-v3.2',
        name: 'DeepSeek V3.2',
        description: 'DeepSeek V3.2 experimental',
      },
      {
        id: 'deepseek-v3.1',
        name: 'DeepSeek V3.1 Terminus',
        description: 'DeepSeek V3.1 Terminus',
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        description: 'DeepSeek reasoning model R1',
      },
      {
        id: 'deepseek-v3',
        name: 'DeepSeek V3 671B',
        description: 'DeepSeek V3 large model',
      },
      {
        id: 'minimax-m2',
        name: 'MiniMax M2',
        description: 'MiniMax M2 model',
      },
    ],
    endpoints: { completion: '/v1/completions', chat: '/v1/chat/completions' },
  },
]

export function getProvider(id: string): ProviderDescriptor | undefined {
  return PROVIDER_REGISTRY.find((p) => p.id === id)
}

export function getAllProviders(): ProviderDescriptor[] {
  return PROVIDER_REGISTRY
}

export function getModelsForProvider(providerId: string): ModelDescriptor[] {
  const provider = getProvider(providerId)
  return provider?.models ?? []
}

export function getAllModels(): (ModelDescriptor & { providerId: string })[] {
  return PROVIDER_REGISTRY.flatMap((provider) =>
    provider.models.map((model) => ({
      ...model,
      providerId: provider.id,
    }))
  )
}

export function getProviderColors(): Record<string, string> {
  return PROVIDER_REGISTRY.reduce(
    (acc, provider) => {
      acc[provider.id] = provider.color
      return acc
    },
    {} as Record<string, string>
  )
}

export function getProviderGradients(): Record<string, string> {
  return PROVIDER_REGISTRY.reduce(
    (acc, provider) => {
      acc[provider.id] = `${provider.gradientFrom} ${provider.gradientTo}`
      return acc
    },
    {} as Record<string, string>
  )
}

export function getProviderDisplayNames(): Record<string, string> {
  return PROVIDER_REGISTRY.reduce(
    (acc, provider) => {
      acc[provider.id] = provider.name
      return acc
    },
    {} as Record<string, string>
  )
}

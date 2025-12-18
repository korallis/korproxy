export interface ModelDescriptor {
  id: string
  name: string
  description?: string
  features: string[]
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
  bgColor: string
  authCommand: string
  models: ModelDescriptor[]
}

export const PROVIDER_REGISTRY: ProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: 'Sparkles',
    authType: 'oauth',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    authCommand: 'korproxy auth gemini',
    models: [
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro Preview',
        description: 'Next-generation flagship model with advanced reasoning',
        features: ['1M+ context', 'Thinking support', 'Multimodal'],
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini 3 Pro Image Preview',
        description: 'Gemini 3 Pro with image generation capabilities',
        features: ['1M+ context', 'Image generation', 'Multimodal'],
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Stable flagship model for complex tasks',
        features: ['1M context', 'Thinking support', 'Best for complex tasks'],
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast and efficient mid-size model',
        features: ['1M context', 'Fast responses', 'Cost-effective'],
        thinkingSupport: { min: 0, max: 24576 },
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Smallest and most cost effective model',
        features: ['1M context', 'Ultra-fast', 'Best value'],
        thinkingSupport: { min: 0, max: 24576 },
      },
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        description: 'State-of-the-art image generation and editing',
        features: ['Image generation', 'Image editing', 'Multimodal'],
      },
      {
        id: 'gemini-pro-latest',
        name: 'Gemini Pro Latest',
        description: 'Always points to latest Pro release',
        features: ['Auto-updated', '1M context', 'Thinking support'],
        thinkingSupport: { min: 128, max: 32768 },
      },
      {
        id: 'gemini-flash-latest',
        name: 'Gemini Flash Latest',
        description: 'Always points to latest Flash release',
        features: ['Auto-updated', 'Fast', 'Cost-effective'],
        thinkingSupport: { min: 0, max: 24576 },
      },
    ],
  },
  {
    id: 'claude',
    name: 'Anthropic Claude',
    icon: 'Bot',
    authType: 'oauth',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    authCommand: 'korproxy auth claude',
    models: [
      {
        id: 'claude-opus-4-5-20251101',
        name: 'Claude 4.5 Opus',
        description: 'Premium model combining maximum intelligence with practical performance',
        features: ['200K context', '64K output', 'Thinking: 1024-100000'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude 4.5 Sonnet',
        description: 'Balanced model with excellent coding capabilities',
        features: ['200K context', '64K output', 'Thinking: 1024-100000'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude 4.5 Haiku',
        description: 'Fastest Claude model for quick tasks',
        features: ['200K context', '64K output', 'No thinking'],
      },
      {
        id: 'claude-opus-4-1-20250805',
        name: 'Claude 4.1 Opus',
        description: 'Previous generation Opus model',
        features: ['200K context', '32K output', 'Thinking support'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude 4 Opus',
        description: 'Claude 4 flagship model',
        features: ['200K context', '32K output', 'Thinking support'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude 4 Sonnet',
        description: 'Claude 4 balanced model',
        features: ['200K context', '64K output', 'Thinking support'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        description: 'Claude 3.7 generation Sonnet',
        features: ['128K context', '8K output', 'Thinking support'],
        thinkingSupport: { min: 1024, max: 100000 },
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        description: 'Claude 3.5 generation Haiku',
        features: ['128K context', '8K output', 'No thinking'],
      },
    ],
  },
  {
    id: 'codex',
    name: 'OpenAI Codex',
    icon: 'Brain',
    authType: 'oauth',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    authCommand: 'korproxy auth codex',
    models: [
      {
        id: 'gpt-5.1-codex-max',
        name: 'GPT 5.1 Codex Max',
        description: 'Most powerful Codex model for complex agentic tasks',
        features: ['400K context', '128K output', 'Levels: low, medium, high, xhigh'],
        reasoningLevels: ['low', 'medium', 'high', 'xhigh'],
      },
      {
        id: 'gpt-5.1-codex',
        name: 'GPT 5.1 Codex',
        description: 'Latest Codex model for coding tasks',
        features: ['400K context', '128K output', 'Levels: low, medium, high'],
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5.1-codex-mini',
        name: 'GPT 5.1 Codex Mini',
        description: 'Smaller, faster version of Codex',
        features: ['400K context', 'Cost-effective', 'Levels: low, medium, high'],
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5.1',
        name: 'GPT 5.1',
        description: 'Latest GPT model for general tasks',
        features: ['400K context', '128K output', 'Multimodal'],
      },
      {
        id: 'gpt-5.2',
        name: 'GPT 5.2',
        description: 'Next generation GPT model',
        features: ['400K context', '128K output', 'Latest'],
      },
      {
        id: 'gpt-5-codex',
        name: 'GPT 5 Codex',
        description: 'GPT 5 optimized for code',
        features: ['400K context', 'Code-focused', 'Levels: low, medium, high'],
        reasoningLevels: ['low', 'medium', 'high'],
      },
      {
        id: 'gpt-5',
        name: 'GPT 5',
        description: 'GPT 5 base model',
        features: ['400K context', '128K output', 'Levels: minimal, low, medium, high'],
        reasoningLevels: ['minimal', 'low', 'medium', 'high'],
      },
    ],
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: 'Cpu',
    authType: 'apiKey',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    authCommand: 'korproxy auth qwen',
    models: [
      {
        id: 'qwen3-coder-plus',
        name: 'Qwen3 Coder Plus',
        description: 'Advanced code generation and understanding model',
        features: ['32K context', '8K output', 'Multi-language'],
      },
      {
        id: 'qwen3-coder-flash',
        name: 'Qwen3 Coder Flash',
        description: 'Fast code generation model',
        features: ['8K context', 'Fast', 'Cost-effective'],
      },
      {
        id: 'vision-model',
        name: 'Qwen3 Vision Model',
        description: 'Multimodal vision model',
        features: ['32K context', 'Vision', 'Multimodal'],
      },
    ],
  },
  {
    id: 'iflow',
    name: 'iFlow',
    icon: 'Globe',
    authType: 'apiKey',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    authCommand: 'korproxy auth iflow',
    models: [
      {
        id: 'tstars2.0',
        name: 'TStars 2.0',
        description: 'iFlow TStars multimodal assistant',
        features: ['Multimodal', 'Assistant', 'General'],
      },
      {
        id: 'qwen3-coder-plus',
        name: 'Qwen3 Coder Plus',
        description: 'Qwen3 Coder Plus via iFlow',
        features: ['Code generation', 'Multi-language', 'Fast'],
      },
      {
        id: 'qwen3-coder',
        name: 'Qwen3 Coder 480B',
        description: 'Qwen3 Coder 480B A35B',
        features: ['Large model', 'Code-focused', 'Powerful'],
      },
      {
        id: 'qwen3-max',
        name: 'Qwen3 Max',
        description: 'Qwen3 flagship model',
        features: ['Flagship', 'General purpose', 'Powerful'],
      },
      {
        id: 'qwen3-vl-plus',
        name: 'Qwen3 VL Plus',
        description: 'Qwen3 multimodal vision-language',
        features: ['Vision', 'Multimodal', 'Analysis'],
      },
      {
        id: 'kimi-k2',
        name: 'Kimi K2',
        description: 'Moonshot Kimi K2 general model',
        features: ['General purpose', 'Fast', 'Efficient'],
      },
      {
        id: 'kimi-k2-thinking',
        name: 'Kimi K2 Thinking',
        description: 'Moonshot Kimi K2 with extended thinking',
        features: ['Extended thinking', 'Reasoning', 'Analysis'],
      },
      {
        id: 'glm-4.6',
        name: 'GLM 4.6',
        description: 'Zhipu GLM 4.6 general model',
        features: ['General purpose', 'Chinese', 'Fast'],
      },
      {
        id: 'deepseek-v3.2',
        name: 'DeepSeek V3.2',
        description: 'DeepSeek V3.2 experimental',
        features: ['Experimental', 'Powerful', 'Reasoning'],
      },
      {
        id: 'deepseek-v3.1',
        name: 'DeepSeek V3.1 Terminus',
        description: 'DeepSeek V3.1 Terminus',
        features: ['Stable', 'General purpose', 'Fast'],
      },
      {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        description: 'DeepSeek reasoning model R1',
        features: ['Reasoning', 'Analysis', 'Problem-solving'],
      },
      {
        id: 'deepseek-v3',
        name: 'DeepSeek V3 671B',
        description: 'DeepSeek V3 large model',
        features: ['671B parameters', 'Powerful', 'General'],
      },
      {
        id: 'minimax-m2',
        name: 'MiniMax M2',
        description: 'MiniMax M2 model',
        features: ['General purpose', 'Fast', 'Efficient'],
      },
    ],
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

export function getTotalModelCount(): number {
  return PROVIDER_REGISTRY.reduce((acc, provider) => acc + provider.models.length, 0)
}

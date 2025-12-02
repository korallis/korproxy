"use client";

import { Cpu, Sparkles, Bot, Brain, Zap, Globe, Copy, Check, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelInfo {
  id: string;
  displayName: string;
  description: string;
  features: string[];
}

const geminiModels: ModelInfo[] = [
  {
    id: "gemini-3-pro-preview",
    displayName: "Gemini 3 Pro Preview",
    description: "Next-generation flagship model with advanced reasoning",
    features: ["1M+ context", "Thinking support", "Multimodal"],
  },
  {
    id: "gemini-3-pro-image-preview",
    displayName: "Gemini 3 Pro Image Preview",
    description: "Gemini 3 Pro with image generation capabilities",
    features: ["1M+ context", "Image generation", "Multimodal"],
  },
  {
    id: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    description: "Stable flagship model for complex tasks",
    features: ["1M context", "Thinking support", "Best for complex tasks"],
  },
  {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    description: "Fast and efficient mid-size model",
    features: ["1M context", "Fast responses", "Cost-effective"],
  },
  {
    id: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    description: "Smallest and most cost effective model",
    features: ["1M context", "Ultra-fast", "Best value"],
  },
  {
    id: "gemini-2.5-flash-image",
    displayName: "Gemini 2.5 Flash Image",
    description: "State-of-the-art image generation and editing",
    features: ["Image generation", "Image editing", "Multimodal"],
  },
  {
    id: "gemini-pro-latest",
    displayName: "Gemini Pro Latest",
    description: "Always points to latest Pro release",
    features: ["Auto-updated", "1M context", "Thinking support"],
  },
  {
    id: "gemini-flash-latest",
    displayName: "Gemini Flash Latest",
    description: "Always points to latest Flash release",
    features: ["Auto-updated", "Fast", "Cost-effective"],
  },
];

const claudeModels: ModelInfo[] = [
  {
    id: "claude-opus-4-5-thinking",
    displayName: "Claude 4.5 Opus Thinking",
    description: "Premium model with extended thinking for complex reasoning",
    features: ["200K context", "Extended thinking", "Best reasoning"],
  },
  {
    id: "claude-opus-4-5-thinking-high",
    displayName: "Claude 4.5 Opus Thinking High",
    description: "Opus with high thinking budget",
    features: ["200K context", "High thinking", "Deep analysis"],
  },
  {
    id: "claude-opus-4-5-thinking-medium",
    displayName: "Claude 4.5 Opus Thinking Medium",
    description: "Opus with medium thinking budget",
    features: ["200K context", "Medium thinking", "Balanced"],
  },
  {
    id: "claude-opus-4-5-thinking-low",
    displayName: "Claude 4.5 Opus Thinking Low",
    description: "Opus with low thinking budget for faster responses",
    features: ["200K context", "Low thinking", "Faster"],
  },
  {
    id: "claude-opus-4-5-20251101",
    displayName: "Claude 4.5 Opus",
    description: "Premium model combining maximum intelligence with practical performance",
    features: ["200K context", "64K output", "Best for complex tasks"],
  },
  {
    id: "claude-sonnet-4-5-thinking",
    displayName: "Claude 4.5 Sonnet Thinking",
    description: "Balanced model with extended thinking capabilities",
    features: ["200K context", "Extended thinking", "Best for coding"],
  },
  {
    id: "claude-sonnet-4-5-20250929",
    displayName: "Claude 4.5 Sonnet",
    description: "Balanced model with excellent coding capabilities",
    features: ["200K context", "64K output", "Fast responses"],
  },
  {
    id: "claude-haiku-4-5-20251001",
    displayName: "Claude 4.5 Haiku",
    description: "Fastest Claude model for quick tasks",
    features: ["200K context", "Ultra-fast", "Cost-effective"],
  },
  {
    id: "claude-opus-4-1-20250805",
    displayName: "Claude 4.1 Opus",
    description: "Previous generation Opus model",
    features: ["200K context", "32K output", "Stable"],
  },
  {
    id: "claude-opus-4-20250514",
    displayName: "Claude 4 Opus",
    description: "Claude 4 flagship model",
    features: ["200K context", "32K output", "Proven"],
  },
  {
    id: "claude-sonnet-4-20250514",
    displayName: "Claude 4 Sonnet",
    description: "Claude 4 balanced model",
    features: ["200K context", "64K output", "Efficient"],
  },
  {
    id: "claude-3-7-sonnet-20250219",
    displayName: "Claude 3.7 Sonnet",
    description: "Claude 3.7 generation Sonnet",
    features: ["128K context", "8K output", "Legacy"],
  },
  {
    id: "claude-3-5-haiku-20241022",
    displayName: "Claude 3.5 Haiku",
    description: "Claude 3.5 generation Haiku",
    features: ["128K context", "8K output", "Legacy"],
  },
];

const codexModels: ModelInfo[] = [
  {
    id: "gpt-5.1-codex-max",
    displayName: "GPT 5.1 Codex Max",
    description: "Most powerful Codex model for complex agentic tasks",
    features: ["400K context", "128K output", "Max reasoning"],
  },
  {
    id: "gpt-5.1-codex-max-xhigh",
    displayName: "GPT 5.1 Codex Max XHigh",
    description: "Codex Max with extra high reasoning",
    features: ["400K context", "XHigh reasoning", "Premium"],
  },
  {
    id: "gpt-5.1-codex-max-high",
    displayName: "GPT 5.1 Codex Max High",
    description: "Codex Max with high reasoning",
    features: ["400K context", "High reasoning", "Complex tasks"],
  },
  {
    id: "gpt-5.1-codex-max-medium",
    displayName: "GPT 5.1 Codex Max Medium",
    description: "Codex Max with medium reasoning",
    features: ["400K context", "Medium reasoning", "Balanced"],
  },
  {
    id: "gpt-5.1-codex-max-low",
    displayName: "GPT 5.1 Codex Max Low",
    description: "Codex Max with low reasoning for speed",
    features: ["400K context", "Low reasoning", "Faster"],
  },
  {
    id: "gpt-5.1-codex",
    displayName: "GPT 5.1 Codex",
    description: "Latest Codex model for coding tasks",
    features: ["400K context", "128K output", "Function calling"],
  },
  {
    id: "gpt-5.1-codex-high",
    displayName: "GPT 5.1 Codex High",
    description: "GPT 5.1 Codex with high reasoning",
    features: ["400K context", "High reasoning", "Complex coding"],
  },
  {
    id: "gpt-5.1-codex-medium",
    displayName: "GPT 5.1 Codex Medium",
    description: "GPT 5.1 Codex with medium reasoning",
    features: ["400K context", "Medium reasoning", "Balanced"],
  },
  {
    id: "gpt-5.1-codex-low",
    displayName: "GPT 5.1 Codex Low",
    description: "GPT 5.1 Codex with low reasoning",
    features: ["400K context", "Low reasoning", "Fast"],
  },
  {
    id: "gpt-5.1-codex-mini",
    displayName: "GPT 5.1 Codex Mini",
    description: "Smaller, faster version of Codex",
    features: ["400K context", "Cost-effective", "Fast"],
  },
  {
    id: "gpt-5.1-codex-mini-high",
    displayName: "GPT 5.1 Codex Mini High",
    description: "Codex Mini with high reasoning",
    features: ["400K context", "High reasoning", "Efficient"],
  },
  {
    id: "gpt-5.1-codex-mini-medium",
    displayName: "GPT 5.1 Codex Mini Medium",
    description: "Codex Mini with medium reasoning",
    features: ["400K context", "Medium reasoning", "Balanced"],
  },
  {
    id: "gpt-5.1",
    displayName: "GPT 5.1",
    description: "Latest GPT model for general tasks",
    features: ["400K context", "128K output", "Multimodal"],
  },
  {
    id: "gpt-5.1-high",
    displayName: "GPT 5.1 High",
    description: "GPT 5.1 with high reasoning",
    features: ["400K context", "High reasoning", "Complex tasks"],
  },
  {
    id: "gpt-5.1-medium",
    displayName: "GPT 5.1 Medium",
    description: "GPT 5.1 with medium reasoning",
    features: ["400K context", "Medium reasoning", "Balanced"],
  },
  {
    id: "gpt-5.1-low",
    displayName: "GPT 5.1 Low",
    description: "GPT 5.1 with low reasoning",
    features: ["400K context", "Low reasoning", "Fast"],
  },
  {
    id: "gpt-5",
    displayName: "GPT 5",
    description: "GPT 5 base model",
    features: ["400K context", "128K output", "Stable"],
  },
  {
    id: "gpt-5-codex",
    displayName: "GPT 5 Codex",
    description: "GPT 5 optimized for code",
    features: ["400K context", "Code-focused", "Function calling"],
  },
];

const qwenModels: ModelInfo[] = [
  {
    id: "qwen3-coder-plus",
    displayName: "Qwen3 Coder Plus",
    description: "Advanced code generation and understanding model",
    features: ["32K context", "8K output", "Multi-language"],
  },
  {
    id: "qwen3-coder-flash",
    displayName: "Qwen3 Coder Flash",
    description: "Fast code generation model",
    features: ["8K context", "Fast", "Cost-effective"],
  },
  {
    id: "vision-model",
    displayName: "Qwen3 Vision Model",
    description: "Multimodal vision model",
    features: ["32K context", "Vision", "Multimodal"],
  },
];

const iflowModels: ModelInfo[] = [
  {
    id: "tstars2.0",
    displayName: "TStars 2.0",
    description: "iFlow TStars multimodal assistant",
    features: ["Multimodal", "Assistant", "General"],
  },
  {
    id: "qwen3-coder-plus",
    displayName: "Qwen3 Coder Plus",
    description: "Qwen3 Coder Plus via iFlow",
    features: ["Code generation", "Multi-language", "Fast"],
  },
  {
    id: "qwen3-coder",
    displayName: "Qwen3 Coder 480B",
    description: "Qwen3 Coder 480B A35B",
    features: ["Large model", "Code-focused", "Powerful"],
  },
  {
    id: "qwen3-max",
    displayName: "Qwen3 Max",
    description: "Qwen3 flagship model",
    features: ["Flagship", "General purpose", "Powerful"],
  },
  {
    id: "qwen3-vl-plus",
    displayName: "Qwen3 VL Plus",
    description: "Qwen3 multimodal vision-language",
    features: ["Vision", "Multimodal", "Analysis"],
  },
  {
    id: "kimi-k2",
    displayName: "Kimi K2",
    description: "Moonshot Kimi K2 general model",
    features: ["General purpose", "Fast", "Efficient"],
  },
  {
    id: "kimi-k2-thinking",
    displayName: "Kimi K2 Thinking",
    description: "Moonshot Kimi K2 with extended thinking",
    features: ["Extended thinking", "Reasoning", "Analysis"],
  },
  {
    id: "glm-4.6",
    displayName: "GLM 4.6",
    description: "Zhipu GLM 4.6 general model",
    features: ["General purpose", "Chinese", "Fast"],
  },
  {
    id: "deepseek-v3.2",
    displayName: "DeepSeek V3.2",
    description: "DeepSeek V3.2 experimental",
    features: ["Experimental", "Powerful", "Reasoning"],
  },
  {
    id: "deepseek-v3.1",
    displayName: "DeepSeek V3.1 Terminus",
    description: "DeepSeek V3.1 Terminus",
    features: ["Stable", "General purpose", "Fast"],
  },
  {
    id: "deepseek-r1",
    displayName: "DeepSeek R1",
    description: "DeepSeek reasoning model R1",
    features: ["Reasoning", "Analysis", "Problem-solving"],
  },
  {
    id: "deepseek-v3",
    displayName: "DeepSeek V3 671B",
    description: "DeepSeek V3 large model",
    features: ["671B parameters", "Powerful", "General"],
  },
  {
    id: "minimax-m2",
    displayName: "MiniMax M2",
    description: "MiniMax M2 model",
    features: ["General purpose", "Fast", "Efficient"],
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 hover:bg-muted rounded transition-colors"
      title="Copy model ID"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function ModelCard({ model }: { model: ModelInfo }) {
  return (
    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{model.displayName}</h4>
          <div className="flex items-center gap-1 mt-1">
            <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
              {model.id}
            </code>
            <CopyButton text={model.id} />
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {model.features.map((feature) => (
          <span
            key={feature}
            className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProviderSection({
  title,
  icon: Icon,
  iconColor,
  bgColor,
  models,
  authCommand,
}: {
  title: string;
  icon: typeof Sparkles;
  iconColor: string;
  bgColor: string;
  models: ModelInfo[];
  authCommand: string;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">
            Auth: <code className="px-1.5 py-0.5 bg-card rounded">{authCommand}</code>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </section>
  );
}

const providers = [
  { id: "all", name: "All", icon: Cpu, color: "text-primary", bgColor: "bg-primary/10" },
  { id: "gemini", name: "Gemini", icon: Sparkles, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { id: "claude", name: "Claude", icon: Bot, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { id: "codex", name: "Codex", icon: Brain, color: "text-green-500", bgColor: "bg-green-500/10" },
  { id: "qwen", name: "Qwen", icon: Cpu, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { id: "iflow", name: "iFlow", icon: Globe, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
];

const allModels = [
  ...geminiModels.map(m => ({ ...m, provider: "gemini" })),
  ...claudeModels.map(m => ({ ...m, provider: "claude" })),
  ...codexModels.map(m => ({ ...m, provider: "codex" })),
  ...qwenModels.map(m => ({ ...m, provider: "qwen" })),
  ...iflowModels.map(m => ({ ...m, provider: "iflow" })),
];

export default function ModelsGuidePage() {
  const [activeProvider, setActiveProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModels = useMemo(() => {
    return allModels.filter(model => {
      const matchesProvider = activeProvider === "all" || model.provider === activeProvider;
      const matchesSearch = searchQuery === "" || 
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesProvider && matchesSearch;
    });
  }, [activeProvider, searchQuery]);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Cpu size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Supported Models</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          KorProxy supports all CLIProxyAPI models. Click the copy button to copy model IDs for use in Cline, Cursor, Windsurf, or any OpenAI-compatible tool.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Provider Tabs */}
        <div className="flex flex-wrap gap-2">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isActive = activeProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setActiveProvider(provider.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? `${provider.bgColor} ${provider.color}`
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {provider.name}
                {provider.id !== "all" && (
                  <span className="text-xs opacity-70">
                    ({allModels.filter(m => m.provider === provider.id).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredModels.length} of {allModels.length} models
        </p>
      </div>

      {/* How It Works */}
      <section className="mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">How to Use Model IDs</h2>
          <div className="space-y-3 text-muted-foreground text-sm">
            <p>
              Copy any model ID and use it in your AI coding tool&apos;s configuration. For example, in Cline or Cursor settings:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-xs">
              <div className="text-muted-foreground mb-1"># Example configuration</div>
              <div><span className="text-blue-400">model:</span> <span className="text-green-400">claude-sonnet-4-5-20250929</span></div>
              <div><span className="text-blue-400">baseUrl:</span> <span className="text-green-400">http://localhost:1337/v1</span></div>
            </div>
            <div className="flex items-start gap-2 mt-4">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Thinking Models:</strong> Models ending in &quot;-thinking&quot; or with reasoning levels (high/medium/low) provide extended reasoning capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtered Models Grid */}
      <section className="mb-8">
        <AnimatePresence mode="popLayout">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            layout
          >
            {filteredModels.map((model) => (
              <motion.div
                key={model.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ModelCard model={model} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        {filteredModels.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No models found matching your search.</p>
          </div>
        )}
      </section>

      {/* API Compatibility */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">API Endpoints</h2>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm mb-4">
            KorProxy runs on <code className="bg-muted px-1.5 py-0.5 rounded">http://localhost:1337</code> and provides these endpoints:
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded">OpenAI</span>
              <code className="text-muted-foreground">/v1/chat/completions</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded">OpenAI</span>
              <code className="text-muted-foreground">/v1/responses</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded">Claude</span>
              <code className="text-muted-foreground">/v1/messages</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded">Gemini</span>
              <code className="text-muted-foreground">/v1beta/models/:generateContent</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">Models</span>
              <code className="text-muted-foreground">/v1/models</code>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Account Support */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Multi-Account Load Balancing</h2>
        <p className="text-muted-foreground text-sm mb-4">
          KorProxy supports multiple accounts per provider with round-robin load balancing.
          Add multiple accounts to distribute requests and avoid rate limits.
        </p>
      </section>
    </div>
  );
}

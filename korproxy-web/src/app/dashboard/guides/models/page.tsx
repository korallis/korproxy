import { Cpu, Sparkles, Bot, Brain, Zap, Globe } from "lucide-react";

interface ModelInfo {
  name: string;
  provider: string;
  description: string;
  features: string[];
}

const geminiModels: ModelInfo[] = [
  {
    name: "Gemini 3 Pro Preview",
    provider: "Google",
    description: "Latest flagship model with advanced reasoning and coding capabilities",
    features: ["Multimodal", "1M+ context", "Advanced reasoning"],
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Powerful model optimized for complex tasks and long context",
    features: ["Multimodal", "1M context", "Best for complex tasks"],
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "Google",
    description: "Fast and efficient model for quick responses",
    features: ["Multimodal", "Fast responses", "Cost-effective"],
  },
];

const claudeModels: ModelInfo[] = [
  {
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    description: "Premium model with maximum intelligence - used by Amp Smart mode",
    features: ["200K context", "Advanced reasoning", "Best for complex tasks"],
  },
  {
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Balanced model with excellent coding and agentic capabilities",
    features: ["200K context", "Best for coding", "Fast responses"],
  },
  {
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    description: "Fastest Claude model for quick tasks - used by Amp Rush mode",
    features: ["200K context", "Ultra-fast", "Cost-effective"],
  },
];

const openaiModels: ModelInfo[] = [
  {
    name: "GPT-5",
    provider: "OpenAI",
    description: "Latest GPT model with enhanced capabilities",
    features: ["Advanced reasoning", "Multimodal", "Function calling"],
  },
  {
    name: "GPT-5 Codex",
    provider: "OpenAI",
    description: "Optimized for code generation and analysis",
    features: ["Code-focused", "Multi-language", "Function calling"],
  },
  {
    name: "GPT-5 Medium Reasoning",
    provider: "OpenAI",
    description: "Specialized model for complex reasoning tasks",
    features: ["Deep reasoning", "Problem solving", "Analysis"],
  },
];

const qwenModels: ModelInfo[] = [
  {
    name: "Qwen Code",
    provider: "Alibaba",
    description: "Specialized coding model from Alibaba Cloud",
    features: ["Code-focused", "Multi-language", "Fast"],
  },
];

const iflowModels: ModelInfo[] = [
  {
    name: "iFlow Models",
    provider: "iFlow",
    description: "Access to iFlow AI platform models",
    features: ["Multi-provider", "Flexible", "API compatible"],
  },
];

function ModelCard({ model }: { model: ModelInfo }) {
  return (
    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-foreground">{model.name}</h4>
          <p className="text-xs text-muted-foreground">{model.provider}</p>
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
  models,
  authCommand,
}: {
  title: string;
  icon: typeof Sparkles;
  iconColor: string;
  models: ModelInfo[];
  authCommand: string;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-${iconColor}/10`}>
          <Icon className={`w-5 h-5 text-${iconColor}`} />
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
          <ModelCard key={model.name} model={model} />
        ))}
      </div>
    </section>
  );
}

export default function ModelsGuidePage() {
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
          KorProxy supports a wide range of AI models from multiple providers through OAuth authentication
        </p>
      </div>

      {/* How It Works */}
      <section className="mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">How Model Access Works</h2>
          <div className="space-y-3 text-muted-foreground text-sm">
            <p>
              KorProxy uses OAuth authentication to connect to your existing AI subscriptions.
              This means you can use the models included in subscriptions you already pay for
              (like ChatGPT Plus, Claude Pro, or Google AI) without needing separate API keys.
            </p>
            <div className="flex items-start gap-2 mt-4">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Local Authentication:</strong> Models you&apos;ve authenticated
                use your OAuth subscription directly—no additional API costs.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Globe className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Fallback Routing:</strong> Models not authenticated locally
                can fall back to upstream providers (may require credits or separate API access).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Provider Sections */}
      <ProviderSection
        title="Google Gemini"
        icon={Sparkles}
        iconColor="blue-500"
        models={geminiModels}
        authCommand="Login via KorProxy → Providers → Google"
      />

      <ProviderSection
        title="Anthropic Claude"
        icon={Bot}
        iconColor="orange-500"
        models={claudeModels}
        authCommand="Login via KorProxy → Providers → Claude"
      />

      <ProviderSection
        title="OpenAI / Codex"
        icon={Brain}
        iconColor="green-500"
        models={openaiModels}
        authCommand="Login via KorProxy → Providers → Codex"
      />

      <ProviderSection
        title="Qwen"
        icon={Cpu}
        iconColor="purple-500"
        models={qwenModels}
        authCommand="Login via KorProxy → Providers → Qwen"
      />

      <ProviderSection
        title="iFlow"
        icon={Globe}
        iconColor="cyan-500"
        models={iflowModels}
        authCommand="Login via KorProxy → Providers → iFlow"
      />

      {/* API Compatibility */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">API Compatibility</h2>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm mb-4">
            KorProxy provides API endpoints compatible with popular formats:
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded">OpenAI</span>
              <code className="text-muted-foreground">/v1/chat/completions</code>
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
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">Amp</span>
              <code className="text-muted-foreground">/api/provider/&#123;provider&#125;/v1/...</code>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Account Support */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Multi-Account Load Balancing</h2>
        <p className="text-muted-foreground text-sm mb-4">
          KorProxy supports multiple accounts per provider with round-robin load balancing.
          Add multiple accounts to distribute requests and avoid rate limits:
        </p>
        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1 ml-2">
          <li>Gemini: Multiple Google accounts</li>
          <li>Claude: Multiple Anthropic accounts</li>
          <li>Codex: Multiple OpenAI accounts</li>
          <li>Qwen: Multiple Alibaba Cloud accounts</li>
          <li>iFlow: Multiple iFlow accounts</li>
        </ul>
      </section>
    </div>
  );
}

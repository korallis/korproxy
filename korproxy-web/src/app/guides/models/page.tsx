"use client";

import { Cpu, Sparkles, Bot, Brain, Zap, Globe, Copy, Check, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PROVIDER_REGISTRY,
  getAllModels,
  getTotalModelCount,
  type ModelDescriptor,
} from "@/lib/providers/registry";

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

function ModelCard({ model }: { model: ModelDescriptor }) {
  return (
    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{model.name}</h4>
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

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Bot,
  Brain,
  Cpu,
  Globe,
};

const providers = [
  { id: "all", name: "All", icon: Cpu, color: "text-primary", bgColor: "bg-primary/10" },
  ...PROVIDER_REGISTRY.map((p) => ({
    id: p.id,
    name: p.name.split(" ").pop() || p.name,
    icon: iconMap[p.icon] || Cpu,
    color: p.color,
    bgColor: p.bgColor,
  })),
];

const allModels = getAllModels().map((m) => ({
  ...m,
  provider: m.providerId,
}));

export default function ModelsGuidePage() {
  const [activeProvider, setActiveProvider] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredModels = useMemo(() => {
    return allModels.filter((model) => {
      const matchesProvider =
        activeProvider === "all" || model.provider === activeProvider;
      const matchesSearch =
        searchQuery === "" ||
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (model.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      return matchesProvider && matchesSearch;
    });
  }, [activeProvider, searchQuery]);

  const totalModels = getTotalModelCount();

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
          KorProxy supports all CLIProxyAPI models. Click the copy button to copy
          model IDs for use in Cline, Cursor, Windsurf, or any OpenAI-compatible
          tool.
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
            const modelCount =
              provider.id === "all"
                ? totalModels
                : PROVIDER_REGISTRY.find((p) => p.id === provider.id)?.models.length ?? 0;
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
                  <span className="text-xs opacity-70">({modelCount})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredModels.length} of {totalModels} models
        </p>
      </div>

      {/* How It Works */}
      <section className="mb-8">
        <div className="bg-card border border-border rounded-lg p-5">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            How to Use Model IDs
          </h2>
          <div className="space-y-3 text-muted-foreground text-sm">
            <p>
              Copy any model ID and use it in your AI coding tool&apos;s
              configuration. For example, in Cline or Cursor settings:
            </p>
            <div className="bg-muted p-3 rounded-lg font-mono text-xs">
              <div className="text-muted-foreground mb-1">
                # Example configurations
              </div>
              <div>
                <span className="text-blue-400">model:</span>{" "}
                <span className="text-green-400">claude-opus-4-5-20251101</span>
              </div>
              <div>
                <span className="text-blue-400">model:</span>{" "}
                <span className="text-green-400">gpt-5.1-codex-max</span>
              </div>
              <div>
                <span className="text-blue-400">model:</span>{" "}
                <span className="text-green-400">gemini-2.5-pro</span>
              </div>
              <div className="mt-2">
                <span className="text-blue-400">baseUrl:</span>{" "}
                <span className="text-green-400">http://localhost:1337/v1</span>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-4">
              <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Thinking/Reasoning:</strong>{" "}
                For OpenAI Codex models, append reasoning level in parentheses:{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                  gpt-5.1-codex-max(high)
                </code>
                . Claude models have built-in thinking budgets. Gemini models use{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                  thinkingBudget
                </code>{" "}
                parameter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtered Models Grid */}
      <section className="mb-8">
        <AnimatePresence mode="popLayout">
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" layout>
            {filteredModels.map((model) => (
              <motion.div
                key={`${model.provider}-${model.id}`}
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
        <h2 className="text-xl font-semibold text-foreground mb-4">
          API Endpoints
        </h2>
        <div className="bg-card border border-border rounded-lg p-5">
          <p className="text-muted-foreground text-sm mb-4">
            KorProxy runs on{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded">
              http://localhost:1337
            </code>{" "}
            and provides these endpoints:
          </p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded">
                OpenAI
              </span>
              <code className="text-muted-foreground">/v1/chat/completions</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded">
                OpenAI
              </span>
              <code className="text-muted-foreground">/v1/responses</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded">
                Claude
              </span>
              <code className="text-muted-foreground">/v1/messages</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded">
                Gemini
              </span>
              <code className="text-muted-foreground">
                /v1beta/models/:generateContent
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                Models
              </span>
              <code className="text-muted-foreground">/v1/models</code>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Account Support */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Multi-Account Load Balancing
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          KorProxy supports multiple accounts per provider with round-robin load
          balancing. Add multiple accounts to distribute requests and avoid rate
          limits.
        </p>
      </section>
    </div>
  );
}

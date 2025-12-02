import { Terminal, CheckCircle, AlertCircle, Zap, Settings, FileJson } from "lucide-react";

export default function DroidGuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Terminal size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Factory Droid CLI Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Factory&apos;s Droid CLI to use your AI subscriptions through KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
        <div className="text-muted-foreground space-y-2">
          <p>
            Factory&apos;s Droid is a powerful AI coding assistant that enables end-to-end feature 
            development directly from your terminal. It integrates with your codebase, engineering 
            systems, and workflows.
          </p>
          <p>
            Using KorProxy with Droid&apos;s BYOK (Bring Your Own Key) feature, you can route AI 
            requests through your authenticated OAuth accounts instead of using direct API keys—maximizing 
            the value of subscriptions you already pay for.
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Prerequisites</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>KorProxy app installed and running on port 1337</span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>
              Factory Droid CLI installed (<code className="px-1.5 py-0.5 bg-card rounded text-sm">npm install -g @anthropic/factory</code> or via the Factory website)
            </span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>At least one provider authenticated in KorProxy (Gemini, Claude, or Codex)</span>
          </li>
        </ul>
      </section>

      {/* Configuration */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        
        <div className="space-y-6">
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold">1</div>
              <h3 className="font-semibold text-foreground">Create or edit config.json</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Edit <code className="px-1.5 py-0.5 bg-card rounded text-sm">~/.factory/config.json</code> to add custom models pointing to KorProxy:
            </p>
          </div>

          {/* Claude Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} className="text-orange-500" />
              <h3 className="font-semibold text-foreground">For Claude Models (Anthropic)</h3>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`{
  "custom_models": [
    {
      "model_display_name": "Claude Opus 4.5 [KorProxy]",
      "model": "claude-opus-4-5-20251101",
      "base_url": "http://localhost:1337",
      "api_key": "not-needed",
      "provider": "anthropic",
      "max_tokens": 8192
    },
    {
      "model_display_name": "Claude Sonnet 4.5 [KorProxy]",
      "model": "claude-sonnet-4-5-20250929",
      "base_url": "http://localhost:1337",
      "api_key": "not-needed",
      "provider": "anthropic",
      "max_tokens": 8192
    }
  ]
}`}</pre>
            </div>
          </div>

          {/* OpenAI Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} className="text-green-500" />
              <h3 className="font-semibold text-foreground">For OpenAI/Codex Models</h3>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`{
  "custom_models": [
    {
      "model_display_name": "GPT-5 Codex [KorProxy]",
      "model": "gpt-5-codex",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "openai",
      "max_tokens": 16384
    },
    {
      "model_display_name": "GPT-5 [KorProxy]",
      "model": "gpt-5",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "openai",
      "max_tokens": 16384
    }
  ]
}`}</pre>
            </div>
          </div>

          {/* Gemini Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} className="text-blue-500" />
              <h3 className="font-semibold text-foreground">For Gemini Models</h3>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`{
  "custom_models": [
    {
      "model_display_name": "Gemini 3 Pro [KorProxy]",
      "model": "gemini-3-pro-preview",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    },
    {
      "model_display_name": "Gemini 2.5 Pro [KorProxy]",
      "model": "gemini-2.5-pro",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    }
  ]
}`}</pre>
            </div>
          </div>

          {/* Combined Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileJson size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Complete Example (All Providers)</h3>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto max-h-96">
              <pre className="text-foreground">{`{
  "custom_models": [
    {
      "model_display_name": "Claude Opus 4.5 [KorProxy]",
      "model": "claude-opus-4-5-20251101",
      "base_url": "http://localhost:1337",
      "api_key": "not-needed",
      "provider": "anthropic",
      "max_tokens": 8192
    },
    {
      "model_display_name": "GPT-5 Codex [KorProxy]",
      "model": "gpt-5-codex",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "openai",
      "max_tokens": 16384
    },
    {
      "model_display_name": "Gemini 3 Pro [KorProxy]",
      "model": "gemini-3-pro-preview",
      "base_url": "http://localhost:1337/v1",
      "api_key": "not-needed",
      "provider": "generic-chat-completion-api",
      "max_tokens": 8192
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Using Custom Models</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            After saving your configuration, your KorProxy models will appear in Droid:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 ml-2">
            <li>Start Droid CLI: <code className="px-1.5 py-0.5 bg-card rounded text-sm">droid</code></li>
            <li>Use the <code className="px-1.5 py-0.5 bg-card rounded text-sm">/model</code> command</li>
            <li>Look for your models in the &quot;Custom models&quot; section</li>
            <li>Select a KorProxy model to start using your OAuth subscription</li>
          </ol>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">How It Works</h2>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">No API Keys Needed:</strong> KorProxy handles authentication 
              using your OAuth sessions, so you can set <code className="px-1 py-0.5 bg-muted rounded text-xs">api_key</code> to any non-empty value
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Local Processing:</strong> All requests are routed through 
              localhost:1337, keeping your data private and using your subscription quotas
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Multi-Account Support:</strong> KorProxy load-balances 
              across multiple authenticated accounts to avoid rate limits
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Cost Savings:</strong> Use the AI models included in 
              your ChatGPT Plus, Claude Pro, or Google subscriptions instead of paying for API credits
            </p>
          </div>
        </div>
      </section>

      {/* Provider Configuration */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Provider Settings</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 font-semibold text-foreground">Provider</th>
                <th className="text-left py-2 pr-4 font-semibold text-foreground">base_url</th>
                <th className="text-left py-2 font-semibold text-foreground">provider type</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">Claude (Anthropic)</td>
                <td className="py-2 pr-4 font-mono text-xs">http://localhost:1337</td>
                <td className="py-2 font-mono text-xs">anthropic</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2 pr-4">OpenAI / Codex</td>
                <td className="py-2 pr-4 font-mono text-xs">http://localhost:1337/v1</td>
                <td className="py-2 font-mono text-xs">openai</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Gemini / Other</td>
                <td className="py-2 pr-4 font-mono text-xs">http://localhost:1337/v1</td>
                <td className="py-2 font-mono text-xs">generic-chat-completion-api</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Model not appearing in /model selector</p>
              <p className="text-muted-foreground text-sm">Check JSON syntax in ~/.factory/config.json and restart Droid</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;Connection refused&quot; error</p>
              <p className="text-muted-foreground text-sm">Ensure KorProxy is running on port 1337</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;401 Unauthorized&quot; or auth errors</p>
              <p className="text-muted-foreground text-sm">Re-authenticate the provider in KorProxy (Providers tab)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;Invalid provider&quot; error</p>
              <p className="text-muted-foreground text-sm">Provider must be exactly: anthropic, openai, or generic-chat-completion-api</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Terminal size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Check cost and usage</p>
              <p className="text-muted-foreground text-sm mb-2">Use the /cost command in Droid to view cost breakdowns:</p>
              <div className="bg-card border border-border rounded-lg p-3 font-mono text-sm">
                <pre className="text-foreground">/cost</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Resources</h2>
        <div className="space-y-2 text-sm">
          <a 
            href="https://docs.factory.ai/cli/byok/overview" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            Factory BYOK Documentation →
          </a>
          <a 
            href="https://docs.factory.ai/cli/getting-started/quickstart" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary hover:underline"
          >
            Factory CLI Quickstart →
          </a>
        </div>
      </section>
    </div>
  );
}

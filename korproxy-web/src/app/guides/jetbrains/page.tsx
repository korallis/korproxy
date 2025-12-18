import { Laptop, Settings, FileJson, Key, Layers, AlertCircle, CheckCircle2, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JetBrains IDE Setup Guide | KorProxy",
  description: "Configure IntelliJ IDEA, PyCharm, WebStorm, and other JetBrains IDEs to use KorProxy with the Continue plugin",
  openGraph: {
    title: "JetBrains IDE Setup Guide | KorProxy",
    description: "Configure IntelliJ IDEA, PyCharm, WebStorm, and other JetBrains IDEs to use KorProxy with the Continue plugin",
  },
};

export default function JetBrainsGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Laptop size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">JetBrains IDE Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure IntelliJ IDEA, PyCharm, WebStorm, or any JetBrains IDE to use KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
          Overview
        </h2>
        <div className="p-6 bg-card border border-border rounded-lg space-y-3">
          <p className="text-foreground">
            <strong>JetBrains IDEs</strong> (IntelliJ IDEA, PyCharm, WebStorm, GoLand, etc.) can integrate AI assistants through the Continue plugin.
          </p>
          <p className="text-muted-foreground">
            KorProxy lets you use your own AI subscriptions (Claude Pro, ChatGPT Plus, Google AI) instead of paying for additional API credits. The Continue plugin connects to KorProxy&apos;s OpenAI-compatible endpoint.
          </p>
          <p className="text-muted-foreground">
            This guide covers setup via Continue. For general Continue configuration, see the{" "}
            <Link href="/guides/continue" className="text-primary hover:underline">Continue guide</Link>.
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
          Prerequisites
        </h2>
        <div className="p-6 bg-card border border-border rounded-lg">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">KorProxy app installed and running</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">JetBrains IDE installed (IntelliJ, PyCharm, WebStorm, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">At least one provider authenticated in KorProxy</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Configuration Steps */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
          Configuration Steps
        </h2>
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Settings size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 1: Install Continue Plugin</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Open <span className="text-foreground">Settings → Plugins</span></li>
              <li>Search for <span className="text-foreground">&quot;Continue&quot;</span> in the Marketplace</li>
              <li>Click <span className="text-foreground">Install</span> and restart the IDE</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileJson size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 2: Configure Continue</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Edit the Continue configuration file at <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.continue/config.json</code>:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "models": [
    {
      "title": "Claude via KorProxy",
      "provider": "openai",
      "model": "claude-sonnet-4-5-20250929",
      "apiBase": "http://localhost:1337/v1",
      "apiKey": "korproxy"
    }
  ]
}`}</code>
            </pre>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Key size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 3: API Key</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>The <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">apiKey</code> can be any string (e.g., <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">korproxy</code>)</li>
              <li>KorProxy handles authentication via OAuth—the API key is just a placeholder</li>
            </ul>
          </div>

          {/* Alternative */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Globe size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Alternative: HTTP Proxy Settings</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              For tools that don&apos;t support custom base URLs, you can configure the IDE&apos;s HTTP proxy:
            </p>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Go to <span className="text-foreground">Settings → Appearance & Behavior → System Settings → HTTP Proxy</span></li>
              <li>Select <span className="text-foreground">Manual proxy configuration</span></li>
              <li>Set HTTP proxy to <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">localhost</code> port <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">1337</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Selecting Models */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
          Selecting Models
        </h2>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Layers size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Available Models</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Use model names directly—KorProxy routes requests to the appropriate provider. See the{" "}
            <Link href="/guides/models" className="text-primary hover:underline">full model list</Link>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-sonnet-4-5-20250929</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic (balanced)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gpt-5.1-codex</code>
              <p className="text-xs text-muted-foreground mt-1">OpenAI (standard)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gemini-2.5-pro</code>
              <p className="text-xs text-muted-foreground mt-1">Google (flagship)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-haiku-4-5-20251001</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic (fast)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
          Troubleshooting
        </h2>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={20} className="text-warning" />
            <h3 className="font-semibold text-foreground">Common Issues</h3>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">1</span>
              <div>
                <p className="text-foreground font-medium">Connection refused</p>
                <p className="text-muted-foreground text-sm">Check that KorProxy is running—look for the status indicator in the menu bar</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-foreground font-medium">Authentication errors</p>
                <p className="text-muted-foreground text-sm">Verify the provider is authenticated in KorProxy for the model you&apos;re using</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-foreground font-medium">Continue plugin not loading</p>
                <p className="text-muted-foreground text-sm">Ensure you&apos;re using a compatible JetBrains IDE version and restart after installation</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <div>
                <p className="text-foreground font-medium">Config file not found</p>
                <p className="text-muted-foreground text-sm">Open Continue once to generate the default config, then edit <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.continue/config.json</code></p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mb-8">
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <ArrowRight size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Next Steps</h3>
          </div>
          <ul className="space-y-2 text-muted-foreground ml-8">
            <li>
              <Link href="/guides/continue" className="text-primary hover:underline">Continue Guide</Link> — Advanced Continue configuration options
            </li>
            <li>
              <Link href="/guides/models" className="text-primary hover:underline">Supported Models</Link> — Full list of available models
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

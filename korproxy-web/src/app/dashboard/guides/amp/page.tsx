import { Terminal, CheckCircle, AlertCircle, Zap, Settings } from "lucide-react";

export default function AmpGuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Terminal size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Amp CLI Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Amp CLI to use your own AI subscriptions through KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
        <div className="text-muted-foreground space-y-2">
          <p>
            Amp CLI is a powerful AI coding assistant from Sourcegraph that helps you write, 
            understand, and modify code directly from your terminal.
          </p>
          <p>
            KorProxy lets you use your own AI subscriptions (Gemini, Claude, OpenAI) with Amp, 
            maximizing the value of subscriptions you already pay for.
          </p>
          <p>
            This setup works with both Amp CLI and Amp IDE extensions.
          </p>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Prerequisites</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>KorProxy app installed and running</span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>
              Amp CLI installed (<code className="px-1.5 py-0.5 bg-card rounded text-sm">npm install -g @anthropic/amp</code> or via Homebrew)
            </span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>At least one provider authenticated in KorProxy (Gemini, Claude, or Codex)</span>
          </li>
        </ul>
      </section>

      {/* Configuration Steps */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration Steps</h2>
        
        <div className="space-y-6">
          {/* Option A */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Option A: Settings File (Recommended)</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Edit <code className="px-1.5 py-0.5 bg-card rounded text-sm">~/.config/amp/settings.json</code>:
            </p>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`{
  "amp.url": "http://localhost:1337"
}`}</pre>
            </div>
          </div>

          {/* Option B */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Terminal size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Option B: Environment Variable</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Add to your shell profile (<code className="px-1.5 py-0.5 bg-card rounded text-sm">.bashrc</code>, <code className="px-1.5 py-0.5 bg-card rounded text-sm">.zshrc</code>, etc.):
            </p>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">export AMP_URL=http://localhost:1337</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Login */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Login Through Proxy</h2>
        <p className="text-muted-foreground mb-3">
          After configuring the proxy URL, authenticate with Amp:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-foreground">amp login</pre>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          This authenticates with Amp&apos;s servers through KorProxy.
        </p>
      </section>

      {/* Usage */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Usage</h2>
        <p className="text-muted-foreground mb-3">
          Start using Amp with your proxied AI providers:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-foreground">amp &quot;Write a hello world in Python&quot;</pre>
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">How It Works</h2>
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-primary mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Requests for models you&apos;ve authenticated (Gemini, Claude, Codex) use your OAuth subscriptions
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Requests for other models fallback to Amp&apos;s servers (may use Amp credits)
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              Authenticate all providers you have subscriptions for to maximize value
            </p>
          </div>
        </div>
      </section>

      {/* Amp Models */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Models Used by Amp</h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-4">
            Amp uses different models for different modes and features. Authenticate these providers to maximize your subscription value:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Smart Mode</p>
              <p className="text-muted-foreground text-xs">Claude Opus 4.5</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Rush Mode</p>
              <p className="text-muted-foreground text-xs">Claude Haiku 4.5</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Oracle Subagent</p>
              <p className="text-muted-foreground text-xs">GPT-5.1</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Review Feature</p>
              <p className="text-muted-foreground text-xs">Gemini 2.5 Flash-Lite</p>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;401 Unauthorized&quot;</p>
              <p className="text-muted-foreground text-sm">Re-authenticate the provider in KorProxy</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;Connection refused&quot;</p>
              <p className="text-muted-foreground text-sm">Make sure KorProxy is running on port 1337</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Terminal size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Verify configuration</p>
              <div className="bg-card border border-border rounded-lg p-3 font-mono text-sm mt-2">
                <pre className="text-foreground">amp config get amp.url</pre>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

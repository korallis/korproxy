import { Terminal, CheckCircle, AlertCircle, Zap, Settings, Info, ExternalLink } from "lucide-react";

export default function AmpGuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Terminal size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Amp CLI Setup Guide [KorProxy]</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Amp CLI and Amp VS Code extension to use your own AI subscriptions through KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
        <div className="text-muted-foreground space-y-2">
          <p>
            Amp CLI is a powerful AI coding assistant from Sourcegraph that helps you write, 
            understand, and modify code directly from your terminal or IDE.
          </p>
          <p>
            KorProxy integrates with Amp by acting as a proxy that routes provider requests through your 
            OAuth-authenticated subscriptions (Google, ChatGPT Plus/Pro, Claude Pro/Max) while forwarding 
            management requests to Amp&apos;s control plane.
          </p>
          <p>
            This setup works with both Amp CLI and Amp IDE extensions (VS Code, Cursor, Windsurf, etc.).
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
              Amp CLI installed (<code className="px-1.5 py-0.5 bg-card rounded text-sm">brew install amp</code> or via npm)
            </span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>An Amp account (free tier available at ampcode.com)</span>
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
          After configuring the proxy URL, authenticate with your Amp account:
        </p>
        <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-foreground">amp login</pre>
        </div>
        <p className="text-muted-foreground mt-3 text-sm">
          This authenticates with Amp&apos;s servers through KorProxy. Management requests (login, threads, user data) 
          are proxied to ampcode.com while provider requests use your OAuth subscriptions.
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
              <strong className="text-foreground">Provider authenticated:</strong> Requests use your OAuth subscription 
              (ChatGPT Plus/Pro, Claude Pro/Max, Google account) - no Amp credits consumed
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Zap size={18} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Provider NOT authenticated:</strong> Requests automatically forward to 
              ampcode.com and use your Amp credits
            </p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Recommendation:</strong> Authenticate all providers you have subscriptions 
              for to maximize value and minimize Amp credit usage
            </p>
          </div>
        </div>
      </section>

      {/* Which Providers to Authenticate */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Which Providers to Authenticate</h2>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-4">
            Amp uses different models for various agent modes and subagents. Authenticate the providers 
            you have subscriptions for:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Smart Mode</p>
              <p className="text-muted-foreground text-xs">Google/Gemini (Gemini 3 Pro)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Rush Mode</p>
              <p className="text-muted-foreground text-xs">Anthropic/Claude (Claude Haiku 4.5)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Oracle Subagent</p>
              <p className="text-muted-foreground text-xs">OpenAI/GPT (GPT-5 medium reasoning)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Librarian Subagent</p>
              <p className="text-muted-foreground text-xs">Anthropic/Claude (Claude Sonnet 4.5)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Search Subagent</p>
              <p className="text-muted-foreground text-xs">Anthropic/Claude (Claude Haiku 4.5)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Review Feature</p>
              <p className="text-muted-foreground text-xs">Google/Gemini (Gemini 2.5 Flash-Lite)</p>
            </div>
          </div>
          <a 
            href="https://ampcode.com/models" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4"
          >
            See current Amp models
            <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* IDE Extension */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Amp IDE Extension</h2>
        <div className="text-muted-foreground space-y-3">
          <p>
            The proxy also works with Amp IDE extensions for VS Code, Cursor, Windsurf, and other editors:
          </p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Open Amp extension settings in your IDE</li>
            <li>Set <strong className="text-foreground">Amp URL</strong> to <code className="px-1.5 py-0.5 bg-card rounded text-sm">http://localhost:1337</code></li>
            <li>Login with your Amp account</li>
            <li>Start using Amp in your IDE</li>
          </ol>
          <p className="text-sm">
            Both CLI and IDE can use the proxy simultaneously.
          </p>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Troubleshooting</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;401 Unauthorized&quot; or &quot;403 Forbidden&quot;</p>
              <p className="text-muted-foreground text-sm">Re-authenticate the provider in KorProxy for the model being used</p>
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
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Models not using proxy</p>
              <p className="text-muted-foreground text-sm">Verify the Amp URL setting or AMP_URL environment variable is set correctly</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Terminal size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Verify configuration</p>
              <div className="bg-card border border-border rounded-lg p-3 font-mono text-sm mt-2">
                <pre className="text-foreground">{`# Check Amp URL setting
amp config get amp.url

# Or check environment variable
echo $AMP_URL`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Note about BYOK */}
      <section className="mb-8">
        <div className="p-4 bg-card border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">Note: This is Different from BYOK</p>
              <p className="text-muted-foreground text-sm">
                While Amp removed their &quot;Isolated Mode&quot; (BYOK) feature in May 2025, KorProxy works differently. 
                It acts as a proxy server that routes Amp&apos;s provider requests through your OAuth-authenticated 
                subscriptions, while still using Amp&apos;s control plane for account management and threads. 
                You still need an Amp account, but provider calls use your own subscriptions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

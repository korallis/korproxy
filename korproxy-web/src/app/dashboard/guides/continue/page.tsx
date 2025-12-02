import { Puzzle, CheckCircle, AlertCircle, Settings, Layers, FileCode } from "lucide-react";

export default function ContinueGuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Puzzle size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Continue Extension Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Continue to use your AI subscriptions through KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-3">Overview</h2>
        <div className="text-muted-foreground space-y-2">
          <p>
            Continue is an open-source AI code assistant extension for VS Code and JetBrains IDEs.
          </p>
          <p>
            KorProxy lets you use your own AI subscriptions (Gemini, Claude, OpenAI) with Continue, 
            giving you full control over which models you use and their costs.
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
            <span>Continue extension installed in VS Code or JetBrains</span>
          </li>
          <li className="flex items-start gap-2 text-muted-foreground">
            <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
            <span>At least one provider authenticated in KorProxy (Gemini, Claude, or OpenAI)</span>
          </li>
        </ul>
      </section>

      {/* Configuration */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileCode size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Edit Continue Config</h3>
            </div>
            <p className="text-muted-foreground mb-3">
              Edit <code className="px-1.5 py-0.5 bg-card rounded text-sm">~/.continue/config.json</code> to add KorProxy models:
            </p>
            <div className="bg-card border border-border rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`{
  "models": [
    {
      "title": "Claude Opus 4.5 Thinking High via KorProxy",
      "provider": "openai",
      "model": "claude-opus-4-5-thinking-high",
      "apiBase": "http://localhost:1337/v1",
      "apiKey": "korproxy"
    },
    {
      "title": "Claude Sonnet 4.5 Thinking via KorProxy",
      "provider": "openai",
      "model": "claude-sonnet-4-5-thinking",
      "apiBase": "http://localhost:1337/v1",
      "apiKey": "korproxy"
    },
    {
      "title": "GPT 5.1 Codex Max XHigh via KorProxy",
      "provider": "openai",
      "model": "gpt-5.1-codex-max-xhigh",
      "apiBase": "http://localhost:1337/v1",
      "apiKey": "korproxy"
    },
    {
      "title": "Gemini 3 Pro Image via KorProxy",
      "provider": "openai",
      "model": "gemini-3-pro-image-preview",
      "apiBase": "http://localhost:1337/v1",
      "apiKey": "korproxy"
    }
  ]
}`}</pre>
            </div>
          </div>

          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={18} className="text-accent" />
              <h4 className="font-semibold text-foreground">Config Location</h4>
            </div>
            <ul className="text-muted-foreground text-sm space-y-1 ml-6">
              <li><strong>macOS/Linux:</strong> <code className="px-1.5 py-0.5 bg-card rounded text-xs">~/.continue/config.json</code></li>
              <li><strong>Windows:</strong> <code className="px-1.5 py-0.5 bg-card rounded text-xs">%USERPROFILE%\.continue\config.json</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Model Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Available Models</h2>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Layers size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Supported Models</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Use these model names in your config—KorProxy routes requests to the appropriate provider:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">claude-opus-4-5-thinking-high</code>
              <p className="text-xs text-muted-foreground mt-1">Claude Opus 4.5 with high thinking</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">claude-sonnet-4-5-thinking</code>
              <p className="text-xs text-muted-foreground mt-1">Claude Sonnet 4.5 with thinking</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">claude-haiku-4-5-20251001</code>
              <p className="text-xs text-muted-foreground mt-1">Claude Haiku 4.5 (fast)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">gpt-5.1-codex-max-xhigh</code>
              <p className="text-xs text-muted-foreground mt-1">GPT 5.1 Codex Max (premium)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">gpt-5.1-codex-high</code>
              <p className="text-xs text-muted-foreground mt-1">GPT 5.1 Codex High</p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <code className="font-mono text-sm text-foreground">gemini-3-pro-image-preview</code>
              <p className="text-xs text-muted-foreground mt-1">Gemini 3 Pro with image gen</p>
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
              <p className="font-medium text-foreground">&quot;Connection refused&quot; or timeout</p>
              <p className="text-muted-foreground text-sm">Make sure KorProxy is running on port 1337. Check the menu bar icon.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">&quot;401 Unauthorized&quot;</p>
              <p className="text-muted-foreground text-sm">
                Re-authenticate the provider in KorProxy for the model you&apos;re trying to use.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">Model not appearing in Continue</p>
              <p className="text-muted-foreground text-sm">
                Reload VS Code window after editing config.json. Use <kbd className="px-1.5 py-0.5 bg-card rounded text-xs">Cmd/Ctrl + Shift + P</kbd> → &quot;Developer: Reload Window&quot;.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground">JSON syntax error</p>
              <p className="text-muted-foreground text-sm">
                Ensure your config.json is valid JSON. Check for missing commas or brackets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { MousePointer, Settings, Link2, Key, Layers, AlertCircle, CheckCircle2, Terminal } from "lucide-react";

export default function CursorGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <MousePointer size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cursor Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Cursor IDE to use your own AI subscriptions through KorProxy
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
            <strong>Cursor</strong> is an AI-powered code editor built on VS Code, designed for pair programming with AI.
          </p>
          <p className="text-muted-foreground">
            KorProxy lets you use your own AI subscriptions (OpenAI, Anthropic, Google) instead of Cursor&apos;s built-in models. This gives you more control over costs and access to the latest models.
          </p>
          <p className="text-muted-foreground">
            Cursor works with OpenAI-compatible endpoints, which KorProxy provides at <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">localhost:1337/v1</code>.
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
              <span className="text-foreground">Cursor IDE installed</span>
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
              <h3 className="font-semibold text-foreground">Step 1: Open Cursor Settings</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Press <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Cmd/Ctrl + ,</kbd> to open settings</li>
              <li>Or go to <span className="text-foreground">Cursor → Settings → Cursor Settings</span></li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Link2 size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 2: Configure OpenAI Base URL</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Navigate to the <span className="text-foreground">&quot;Models&quot;</span> section</li>
              <li>Find <span className="text-foreground">&quot;OpenAI API Base&quot;</span> or similar setting</li>
              <li>Set the value to:</li>
            </ul>
            <div className="mt-3 ml-8">
              <code className="block p-3 bg-muted rounded-lg font-mono text-sm text-foreground">
                http://localhost:1337/v1
              </code>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Key size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 3: Set API Key</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>You can use any string as the API key (e.g., <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">korproxy</code>)</li>
              <li>KorProxy handles authentication via OAuth—the API key is just a placeholder</li>
            </ul>
          </div>

          {/* Alternative */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Terminal size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Alternative: Environment Variables</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              You can also configure Cursor using environment variables:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`export OPENAI_API_BASE=http://localhost:1337/v1
export OPENAI_API_KEY=korproxy`}</code>
            </pre>
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
            Use model names directly—KorProxy routes requests to the appropriate provider based on the model name:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-opus-4-5-20251101</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic (premium)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-sonnet-4-5-20250929</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic (balanced)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gpt-5.1-codex-max</code>
              <p className="text-xs text-muted-foreground mt-1">OpenAI (max reasoning)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gemini-2.5-pro</code>
              <p className="text-xs text-muted-foreground mt-1">Google (flagship)</p>
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
                <p className="text-foreground font-medium">Settings not applied</p>
                <p className="text-muted-foreground text-sm">Try restarting Cursor after changing the API base URL settings</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

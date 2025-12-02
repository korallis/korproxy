import { Wind, Settings, Link2, Key, Layers, AlertCircle, CheckCircle2, Terminal } from "lucide-react";

export default function WindsurfGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Wind size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Windsurf Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Windsurf IDE to use your own AI subscriptions through KorProxy
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
            <strong>Windsurf</strong> is an AI-native code editor by Codeium, designed for seamless AI-assisted development.
          </p>
          <p className="text-muted-foreground">
            KorProxy lets you use your own AI subscriptions (OpenAI, Anthropic, Google) with Windsurf. This gives you more control over costs and access to the latest models.
          </p>
          <p className="text-muted-foreground">
            Configure Windsurf via settings or environment variables to point to KorProxy at <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">localhost:1337/v1</code>.
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
              <span className="text-foreground">Windsurf IDE installed</span>
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
              <h3 className="font-semibold text-foreground">Step 1: Open Windsurf Settings</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Press <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Cmd/Ctrl + ,</kbd> to open settings</li>
              <li>Search for <span className="text-foreground">&quot;AI&quot;</span> or <span className="text-foreground">&quot;Model&quot;</span> settings</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Link2 size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Step 2: Configure Custom Endpoint</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Look for <span className="text-foreground">OpenAI/API configuration</span> section</li>
              <li>Set <span className="text-foreground">API Base URL</span> to:</li>
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
              <li>Set API Key to any string (e.g., <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">korproxy</code>)</li>
              <li>KorProxy handles authentication via OAuth—the API key is just a placeholder</li>
            </ul>
          </div>

          {/* Environment Variables */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Terminal size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Recommended: Environment Variables</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Add to your shell profile (<code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.zshrc</code> or <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.bashrc</code>):
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`export OPENAI_API_BASE=http://localhost:1337/v1
export OPENAI_API_KEY=korproxy`}</code>
            </pre>
            <p className="text-muted-foreground mt-3 ml-8 text-sm">
              Then restart Windsurf for changes to take effect.
            </p>
          </div>
        </div>
      </section>

      {/* Model Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
          Model Selection
        </h2>
        <div className="p-6 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Layers size={20} className="text-primary" />
            <h3 className="font-semibold text-foreground">Supported Models</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Use model names directly—KorProxy automatically routes requests to the correct provider:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gemini-3-pro-preview</code>
              <p className="text-xs text-muted-foreground mt-1">Google</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-sonnet-4-5-20250929</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">gpt-5-codex</code>
              <p className="text-xs text-muted-foreground mt-1">OpenAI</p>
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
                <p className="text-foreground font-medium">Settings not applied</p>
                <p className="text-muted-foreground text-sm">Restart Windsurf after making configuration changes</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-foreground font-medium">Connection refused</p>
                <p className="text-muted-foreground text-sm">Check that KorProxy is running on port 1337—look for the status indicator in the menu bar</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-foreground font-medium">Authentication errors</p>
                <p className="text-muted-foreground text-sm">Verify the provider is authenticated in KorProxy app for the model you&apos;re using</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

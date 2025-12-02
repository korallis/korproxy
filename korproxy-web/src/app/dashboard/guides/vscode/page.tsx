import { Code2, CheckCircle2, Terminal, Settings, Puzzle, AlertCircle } from "lucide-react";

export default function VSCodeGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Code2 size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">VS Code Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure VS Code AI extensions to use KorProxy
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
            <strong>VS Code</strong> supports various AI extensions that can use KorProxy as their backend.
          </p>
          <p className="text-muted-foreground">
            Works with GitHub Copilot alternatives and custom AI extensions like Continue, Cody, and others.
          </p>
          <p className="text-muted-foreground">
            Configure via <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">settings.json</code> or environment variables.
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
              <span className="text-foreground">VS Code installed</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">AI extension installed (Continue, Cody, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">At least one provider authenticated in KorProxy</span>
            </li>
          </ul>
        </div>
      </section>

      {/* General Configuration */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">3</span>
          General Configuration
        </h2>
        <div className="space-y-4">
          {/* Environment Variables */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Terminal size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Environment Variables</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Add to your shell profile (<code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.zshrc</code> or <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.bashrc</code>):
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`export OPENAI_API_BASE=http://localhost:1337/v1
export OPENAI_API_KEY=korproxy`}</code>
            </pre>
          </div>

          {/* VS Code Settings */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Settings size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">VS Code Settings (settings.json)</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Press <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Cmd/Ctrl + ,</kbd> → Open Settings (JSON):
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "http.proxy": "",
  "openai.apiBase": "http://localhost:1337/v1"
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Extension-Specific Setup */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
          Extension-Specific Setup
        </h2>
        <div className="space-y-4">
          {/* Continue Extension */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Puzzle size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Continue Extension</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Edit <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">~/.continue/config.json</code>:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "models": [{
    "title": "KorProxy",
    "provider": "openai",
    "model": "gemini-3-pro-preview",
    "apiBase": "http://localhost:1337/v1",
    "apiKey": "korproxy"
  }]
}`}</code>
            </pre>
          </div>

          {/* Other Extensions */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Puzzle size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Other OpenAI-Compatible Extensions</h3>
            </div>
            <ul className="space-y-2 text-muted-foreground ml-8">
              <li>Look for <span className="text-foreground">&quot;API Base URL&quot;</span> or <span className="text-foreground">&quot;Base URL&quot;</span> setting</li>
              <li>Set to: <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">http://localhost:1337/v1</code></li>
              <li>Use any API key (e.g., <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">korproxy</code>)</li>
            </ul>
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
                <p className="text-muted-foreground text-sm">Reload VS Code window after changes: <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">Cmd/Ctrl + Shift + P</kbd> → &quot;Reload Window&quot;</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">2</span>
              <div>
                <p className="text-foreground font-medium">Extension errors</p>
                <p className="text-muted-foreground text-sm">Check the extension&apos;s output panel for detailed error messages</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">3</span>
              <div>
                <p className="text-foreground font-medium">Connection refused</p>
                <p className="text-muted-foreground text-sm">Verify KorProxy is running—look for the status indicator in the menu bar</p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

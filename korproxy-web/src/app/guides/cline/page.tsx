import { Code, Settings, Plug, Terminal, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ClineGuidePage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Code size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cline Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Cline to use your AI subscriptions through KorProxy
        </p>
      </div>

      {/* Overview */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
          Overview
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
              <span>Cline is an autonomous AI coding agent for VS Code</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
              <span>KorProxy enables using your own subscriptions with Cline</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
              <span>Supports multiple AI providers (Claude, GPT, Gemini, and more)</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
          Prerequisites
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <span>KorProxy app installed and running</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <span>VS Code with Cline extension installed</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <span>Provider authenticated in KorProxy</span>
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
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Settings size={18} className="text-primary" />
              Step 1: Open Cline Settings
            </h3>
            <ul className="space-y-2 text-muted-foreground ml-6">
              <li>• Click the Cline icon in VS Code sidebar</li>
              <li>• Click the gear icon to open settings</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Plug size={18} className="text-primary" />
              Step 2: Configure API Provider
            </h3>
            <ul className="space-y-2 text-muted-foreground ml-6 mb-4">
              <li>• Select <strong className="text-foreground">&quot;OpenAI Compatible&quot;</strong> as the provider</li>
              <li>• Set Base URL: <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">http://localhost:1337/v1</code></li>
              <li>• Set API Key: <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">korproxy</code> (any string works)</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Code size={18} className="text-primary" />
              Step 3: Select Model
            </h3>
            <p className="text-muted-foreground mb-3 ml-6">Enter a model name - KorProxy routes based on the model name:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6">
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">claude-opus-4-5-20251101</code>
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">claude-sonnet-4-5-20250929</code>
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">claude-haiku-4-5-20251001</code>
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">gpt-5.1-codex-max</code>
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">gpt-5.1-codex</code>
              <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">gemini-2.5-pro</code>
            </div>
          </div>

          {/* Anthropic Direct */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">For Anthropic/Claude directly:</h3>
            <ul className="space-y-2 text-muted-foreground ml-6">
              <li>• Select <strong className="text-foreground">&quot;Anthropic&quot;</strong> as provider</li>
              <li>• Set Base URL: <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">http://localhost:1337</code></li>
              <li>• API Key: <code className="px-2 py-1 bg-muted rounded text-sm text-foreground">korproxy</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Environment Variables */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">4</span>
          Environment Variables (Alternative)
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Terminal size={18} className="text-primary" />
            <span className="text-sm text-muted-foreground">Add to your shell profile:</span>
          </div>
          <pre className="bg-muted rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-foreground">{`export OPENAI_BASE_URL=http://localhost:1337/v1
export OPENAI_API_KEY=korproxy`}</code>
          </pre>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">5</span>
          Troubleshooting
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">&quot;Invalid API key&quot;</p>
                <p className="text-sm text-muted-foreground">Any key works - check base URL is correct</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">&quot;Model not found&quot;</p>
                <p className="text-sm text-muted-foreground">Verify provider is authenticated in KorProxy</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Connection errors</p>
                <p className="text-sm text-muted-foreground">Check VS Code Developer Tools (Help → Toggle Developer Tools) for detailed errors</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

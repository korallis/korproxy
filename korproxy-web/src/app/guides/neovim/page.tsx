import { Terminal, Settings, FileCode, Key, Layers, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NeoVim Setup Guide | KorProxy",
  description: "Configure NeoVim AI plugins like avante.nvim and ChatGPT.nvim to use KorProxy with your AI subscriptions",
  openGraph: {
    title: "NeoVim Setup Guide | KorProxy",
    description: "Configure NeoVim AI plugins like avante.nvim and ChatGPT.nvim to use KorProxy with your AI subscriptions",
  },
};

export default function NeoVimGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <Terminal size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">NeoVim Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure NeoVim AI plugins to use your own AI subscriptions through KorProxy
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
            <strong>NeoVim</strong> has a rich ecosystem of AI-powered plugins for code completion, chat, and refactoring.
          </p>
          <p className="text-muted-foreground">
            KorProxy provides an OpenAI-compatible endpoint at <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">localhost:1337/v1</code> that works with popular plugins like avante.nvim, ChatGPT.nvim, and others.
          </p>
          <p className="text-muted-foreground">
            This guide covers configuration for the most popular NeoVim AI plugins using Lua.
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
              <span className="text-foreground">NeoVim 0.8+ installed</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">A plugin manager (lazy.nvim, packer.nvim, etc.)</span>
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
          Plugin Configurations
        </h2>
        <div className="space-y-4">
          {/* avante.nvim */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileCode size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">avante.nvim</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              A powerful AI assistant plugin with chat and code actions. Add to your lazy.nvim config:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "yetone/avante.nvim",
  event = "VeryLazy",
  opts = {
    provider = "openai",
    openai = {
      endpoint = "http://localhost:1337/v1",
      model = "claude-sonnet-4-5-20250929",
      api_key_name = "cmd:echo korproxy",
    },
  },
}`}</code>
            </pre>
          </div>

          {/* ChatGPT.nvim */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileCode size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">ChatGPT.nvim</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Interactive ChatGPT interface for NeoVim:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "jackMort/ChatGPT.nvim",
  event = "VeryLazy",
  config = function()
    require("chatgpt").setup({
      api_host_cmd = "echo http://localhost:1337",
      api_key_cmd = "echo korproxy",
      openai_params = {
        model = "gpt-5.1-codex",
      },
    })
  end,
  dependencies = {
    "MunifTanjim/nui.nvim",
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim",
  },
}`}</code>
            </pre>
          </div>

          {/* codecompanion.nvim */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <FileCode size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">codecompanion.nvim</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              AI-powered coding companion with inline and chat modes:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`{
  "olimorris/codecompanion.nvim",
  config = function()
    require("codecompanion").setup({
      adapters = {
        korproxy = function()
          return require("codecompanion.adapters").extend("openai", {
            url = "http://localhost:1337/v1/chat/completions",
            env = {
              api_key = "korproxy",
            },
            schema = {
              model = {
                default = "claude-sonnet-4-5-20250929",
              },
            },
          })
        end,
      },
      strategies = {
        chat = { adapter = "korproxy" },
        inline = { adapter = "korproxy" },
      },
    })
  end,
}`}</code>
            </pre>
          </div>

          {/* Environment Variables */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Key size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Alternative: Environment Variables</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Many plugins also respect standard environment variables. Add to your shell config:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`# ~/.zshrc or ~/.bashrc
export OPENAI_API_BASE="http://localhost:1337/v1"
export OPENAI_API_KEY="korproxy"`}</code>
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
            Use any supported model name—KorProxy routes to the appropriate provider. See the{" "}
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
              <code className="font-mono text-sm text-foreground">gemini-2.5-flash</code>
              <p className="text-xs text-muted-foreground mt-1">Google (fast)</p>
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
                <p className="text-foreground font-medium">Plugin not finding endpoint</p>
                <p className="text-muted-foreground text-sm">Some plugins require restart after config changes. Run <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">:Lazy sync</code> or restart NeoVim</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <div>
                <p className="text-foreground font-medium">curl/HTTP errors</p>
                <p className="text-muted-foreground text-sm">Ensure <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">curl</code> is installed and accessible. Test with <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">curl http://localhost:1337/health</code></p>
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
              <Link href="/guides/models" className="text-primary hover:underline">Supported Models</Link> — Full list of available models and capabilities
            </li>
            <li>
              <Link href="/guides/troubleshooting" className="text-primary hover:underline">Troubleshooting</Link> — Common issues and solutions
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

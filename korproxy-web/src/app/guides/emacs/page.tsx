import { FileCode, Settings, Package, Key, Layers, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emacs Setup Guide | KorProxy",
  description: "Configure Emacs AI packages like gptel, chatgpt-shell, and org-ai to use KorProxy with your AI subscriptions",
  openGraph: {
    title: "Emacs Setup Guide | KorProxy",
    description: "Configure Emacs AI packages like gptel, chatgpt-shell, and org-ai to use KorProxy with your AI subscriptions",
  },
};

export default function EmacsGuidePage() {
  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <FileCode size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Emacs Setup Guide</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Configure Emacs AI packages to use your own AI subscriptions through KorProxy
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
            <strong>Emacs</strong> has several excellent packages for AI-assisted coding and writing, including gptel, chatgpt-shell, and org-ai.
          </p>
          <p className="text-muted-foreground">
            KorProxy provides an OpenAI-compatible endpoint at <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">localhost:1337/v1</code> that these packages can use with minimal configuration.
          </p>
          <p className="text-muted-foreground">
            This guide covers Elisp configuration for the most popular Emacs AI packages.
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
              <span className="text-foreground">Emacs 28+ installed (29+ recommended)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 size={20} className="text-success mt-0.5 shrink-0" />
              <span className="text-foreground">Package manager configured (use-package, straight.el, etc.)</span>
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
          Package Configurations
        </h2>
        <div className="space-y-4">
          {/* gptel */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Package size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">gptel</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              A versatile LLM client for Emacs with streaming support. Add to your config:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`(use-package gptel
  :config
  ;; Define KorProxy as a custom backend
  (setq gptel-backend
        (gptel-make-openai "KorProxy"
          :host "localhost:1337"
          :protocol "http"
          :key "korproxy"
          :models '("claude-sonnet-4-5-20250929"
                    "gpt-5.1-codex"
                    "gemini-2.5-pro")))
  
  ;; Set default model
  (setq gptel-model "claude-sonnet-4-5-20250929"))`}</code>
            </pre>
          </div>

          {/* chatgpt-shell */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Package size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">chatgpt-shell</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Interactive shell for ChatGPT conversations:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`(use-package chatgpt-shell
  :custom
  (chatgpt-shell-api-url-base "http://localhost:1337")
  (chatgpt-shell-openai-key "korproxy")
  (chatgpt-shell-model-version "gpt-5.1-codex"))`}</code>
            </pre>
          </div>

          {/* org-ai */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Package size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">org-ai</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              AI integration for Org-mode documents:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`(use-package org-ai
  :after org
  :custom
  (org-ai-openai-api-token "korproxy")
  :config
  ;; Override the API URL
  (setq org-ai-openai-chat-endpoint
        "http://localhost:1337/v1/chat/completions")
  (setq org-ai-default-chat-model "claude-sonnet-4-5-20250929"))`}</code>
            </pre>
          </div>

          {/* ellama */}
          <div className="p-6 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Package size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">ellama</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              LLM tool with chat and code assistance. Configure for OpenAI-compatible API:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`(use-package ellama
  :init
  (require 'llm-openai)
  (setopt ellama-provider
          (make-llm-openai-compatible
           :url "http://localhost:1337/v1"
           :key "korproxy"
           :chat-model "claude-sonnet-4-5-20250929")))`}</code>
            </pre>
          </div>

          {/* Environment Variables */}
          <div className="p-6 bg-secondary/50 border border-border rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Key size={20} className="text-accent" />
              <h3 className="font-semibold text-foreground">Alternative: Environment Variables</h3>
            </div>
            <p className="text-muted-foreground mb-3 ml-8">
              Some packages respect standard environment variables. Add to your shell config:
            </p>
            <pre className="p-4 bg-muted rounded-lg font-mono text-sm overflow-x-auto">
              <code className="text-foreground">{`# ~/.zshrc or ~/.bashrc
export OPENAI_API_BASE="http://localhost:1337/v1"
export OPENAI_API_KEY="korproxy"

# Or set in Emacs early-init.el
(setenv "OPENAI_API_BASE" "http://localhost:1337/v1")
(setenv "OPENAI_API_KEY" "korproxy")`}</code>
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
              <code className="font-mono text-sm text-foreground">gemini-2.5-pro</code>
              <p className="text-xs text-muted-foreground mt-1">Google (flagship)</p>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <code className="font-mono text-sm text-foreground">claude-opus-4-5-20251101</code>
              <p className="text-xs text-muted-foreground mt-1">Anthropic (premium)</p>
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
                <p className="text-foreground font-medium">Package not loading config</p>
                <p className="text-muted-foreground text-sm">Ensure <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">:config</code> runs after package load. Try <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">M-x eval-buffer</code> after changes</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">4</span>
              <div>
                <p className="text-foreground font-medium">SSL/TLS errors</p>
                <p className="text-muted-foreground text-sm">KorProxy uses HTTP locally. Ensure you&apos;re using <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">http://</code> not <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">https://</code></p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-warning/10 text-warning flex items-center justify-center text-xs font-bold shrink-0">5</span>
              <div>
                <p className="text-foreground font-medium">Missing dependencies</p>
                <p className="text-muted-foreground text-sm">Some packages need <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">curl</code> or <code className="px-2 py-0.5 bg-muted rounded text-sm font-mono">plz.el</code>. Check package requirements</p>
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

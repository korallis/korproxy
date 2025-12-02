"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Terminal } from "lucide-react";

const configCode = `# Configure your AI coding tool
# (Cursor, Cline, Windsurf, Continue, etc.)

Base URL: http://localhost:1337/v1
API Key: korproxy
Model: claude-sonnet-4-5-20250929`;

const jsonConfig = `{
  "apiBase": "http://localhost:1337/v1",
  "apiKey": "korproxy",
  "model": "claude-sonnet-4-5-20250929"
}`;

export function QuickStart() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Start</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Configure in Seconds
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Just point your tool to the local proxy. That&apos;s it.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Text Config */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">Settings</span>
              <button
                onClick={() => copyToClipboard(configCode, "config")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {copied === "config" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">
                {configCode.split("\n").map((line, i) => (
                  <div key={i} className={line.startsWith("#") ? "text-muted-foreground/60" : ""}>
                    {line.includes(":") && !line.startsWith("#") ? (
                      <>
                        <span className="text-primary">{line.split(":")[0]}:</span>
                        <span className="text-foreground">{line.split(":").slice(1).join(":")}</span>
                      </>
                    ) : (
                      line
                    )}
                  </div>
                ))}
              </code>
            </pre>
          </div>

          {/* JSON Config */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground">JSON Config</span>
              <button
                onClick={() => copyToClipboard(jsonConfig, "json")}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                {copied === "json" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">
                {jsonConfig.split("\n").map((line, i) => (
                  <div key={i}>
                    {line.includes(":") ? (
                      <>
                        <span className="text-primary">{line.split(":")[0]}:</span>
                        <span className="text-foreground">{line.split(":").slice(1).join(":")}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/60">{line}</span>
                    )}
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Works with Cursor, Cline, Windsurf, Continue, Aider, and any OpenAI-compatible tool
        </motion.p>
      </div>
    </section>
  );
}

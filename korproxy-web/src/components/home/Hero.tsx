"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Play, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-[var(--glow-primary)] rounded-full blur-3xl -z-10 opacity-30" />
      <div className="absolute top-60 right-1/4 w-96 h-96 bg-[oklch(0.55_0.20_180/0.3)] rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">No API keys required</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Use Claude, Gemini & GPT with</span>
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.70_0.20_180)] bg-clip-text text-transparent">
              ANY Coding Tool
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Turn your existing AI subscriptions into a local OpenAI-compatible API.
            <br className="hidden sm:block" />
            Works with Cursor, Windsurf, Cline, and more.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-glow-lg hover:shadow-[0_0_40px_var(--glow-primary)] group"
            >
              Start 7-Day Free Trial
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold text-lg hover:bg-card hover:border-primary/50 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              See How It Works
            </a>
          </div>
        </motion.div>

        {/* App Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="glass-card p-2 shadow-glow-lg">
            {/* Mock window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground ml-2">KorProxy</span>
            </div>
            
            {/* App screenshot placeholder */}
            <div className="aspect-[16/10] bg-gradient-to-br from-background via-card to-background rounded-b-xl flex items-center justify-center relative overflow-hidden">
              {/* Simulated dashboard UI */}
              <div className="absolute inset-0 p-6">
                {/* Sidebar simulation */}
                <div className="absolute left-0 top-0 bottom-0 w-48 bg-card/50 border-r border-border/30 p-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center">
                      <span className="text-primary text-sm">⚡</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">KorProxy</div>
                      <div className="text-xs text-muted-foreground">AI Gateway</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {["Dashboard", "Providers", "Accounts", "Logs", "Settings"].map((item, i) => (
                      <div
                        key={item}
                        className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Main content simulation */}
                <div className="ml-52 space-y-4">
                  <div className="text-lg font-semibold">Dashboard</div>
                  
                  {/* Status card */}
                  <div className="glass-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <span className="text-green-500">⚡</span>
                      </div>
                      <div>
                        <div className="font-medium">Proxy Status</div>
                        <div className="text-sm text-muted-foreground">Running on localhost:1337</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-green-500/10 text-green-500 text-sm">Stop</div>
                  </div>
                  
                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Accounts", value: "5", color: "blue" },
                      { label: "Providers", value: "4", color: "amber" },
                      { label: "Requests", value: "127", color: "green" },
                      { label: "Errors", value: "0", color: "red" },
                    ].map((stat) => (
                      <div key={stat.label} className="glass-card p-3">
                        <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                        <div className="text-xl font-bold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Provider icons */}
                  <div className="flex gap-2">
                    {[
                      { icon: "✦", color: "from-blue-500 to-cyan-500" },
                      { icon: "◈", color: "from-orange-500 to-amber-500" },
                      { icon: "◎", color: "from-emerald-500 to-green-500" },
                      { icon: "◉", color: "from-purple-500 to-violet-500" },
                    ].map((p, i) => (
                      <div key={i} className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-white shadow-lg`}>
                        {p.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="absolute -left-4 top-1/3 glass-card px-3 py-2 shadow-glow hidden lg:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">◈</div>
              <div>
                <div className="text-xs font-medium">Claude Pro</div>
                <div className="text-xs text-green-500">Connected</div>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="absolute -right-4 top-1/2 glass-card px-3 py-2 shadow-glow hidden lg:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">✦</div>
              <div>
                <div className="text-xs font-medium">Gemini Advanced</div>
                <div className="text-xs text-green-500">Connected</div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Trusted by developers worldwide</p>
          <div className="flex items-center justify-center gap-8 text-muted-foreground/60">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-xs">Active Users</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">50+</div>
              <div className="text-xs">AI Models</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div className="text-xs">Uptime</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

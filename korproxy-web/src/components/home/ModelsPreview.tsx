"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const providers = [
  {
    name: "Claude",
    icon: "◈",
    color: "from-orange-500 to-amber-500",
    models: ["Opus 4", "Sonnet 4.5", "Haiku 4.5", "Thinking"],
  },
  {
    name: "Gemini",
    icon: "✦",
    color: "from-blue-500 to-cyan-500",
    models: ["2.5 Pro", "2.5 Flash", "Flash Lite", "Pro Preview"],
  },
  {
    name: "Codex",
    icon: "◎",
    color: "from-emerald-500 to-green-500",
    models: ["Codex Max", "Codex Mini", "GPT 4.1", "Reasoning"],
  },
  {
    name: "Qwen",
    icon: "◉",
    color: "from-purple-500 to-violet-500",
    models: ["Coder Plus", "QwQ 32B", "2.5 Max", "VL Max"],
  },
  {
    name: "iFlow",
    icon: "◆",
    color: "from-cyan-500 to-teal-500",
    models: ["DeepSeek V3", "Kimi K2", "GLM 4.6", "Doubao"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function ModelsPreview() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            50+ Models Available
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Access through your existing subscriptions — no API keys or credits required
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {providers.map((provider) => (
            <motion.div
              key={provider.name}
              variants={itemVariants}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.color} flex items-center justify-center text-white text-lg shadow-lg`}>
                  {provider.icon}
                </div>
                <span className="font-semibold text-foreground">{provider.name}</span>
              </div>
              <ul className="space-y-2">
                {provider.models.map((model) => (
                  <li key={model} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary/50" />
                    {model}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <Link
            href="/dashboard/guides/models"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
          >
            View All Models
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

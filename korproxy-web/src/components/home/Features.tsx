"use client";

import { motion } from "framer-motion";
import { Layers, MonitorSmartphone, Zap, Shield, Wallet, RefreshCw } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Use Your Subscriptions",
    description: "Already paying for Claude Pro or ChatGPT Plus? Use those same accounts in any coding tool.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Layers,
    title: "Multi-Provider Support",
    description: "Claude, Gemini, Codex, Qwen, and iFlow — all through one unified OpenAI-compatible API.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: MonitorSmartphone,
    title: "Works Everywhere",
    description: "Cursor, Windsurf, Cline, Continue, Aider — any tool that supports OpenAI API works.",
    color: "from-purple-500 to-violet-600",
  },
  {
    icon: Zap,
    title: "2-Minute Setup",
    description: "Download, login with OAuth, point your tool to localhost:1337. That's it.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "100% Local & Private",
    description: "Runs on your machine. Your code and credentials never leave your computer.",
    color: "from-red-500 to-rose-600",
  },
  {
    icon: RefreshCw,
    title: "Auto Load Balancing",
    description: "Add multiple accounts per provider. KorProxy rotates between them automatically.",
    color: "from-cyan-500 to-teal-600",
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

export function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            KorProxy bridges your AI subscriptions and your favorite coding tools
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="glass-card p-6 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

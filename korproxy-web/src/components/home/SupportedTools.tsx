"use client";

import { motion } from "framer-motion";

const tools = [
  { name: "Cursor", icon: "⌘", color: "from-violet-500 to-purple-600" },
  { name: "Windsurf", icon: "🏄", color: "from-cyan-500 to-blue-600" },
  { name: "Cline", icon: "◈", color: "from-green-500 to-emerald-600" },
  { name: "Continue", icon: "▶", color: "from-orange-500 to-red-600" },
  { name: "Aider", icon: "🤖", color: "from-pink-500 to-rose-600" },
  { name: "VSCode", icon: "📝", color: "from-blue-500 to-indigo-600" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function SupportedTools() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Works With Your Favorite Tools
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Any tool that supports OpenAI-compatible APIs works with KorProxy
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4"
        >
          {tools.map((tool) => (
            <motion.div
              key={tool.name}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -4 }}
              className="glass-card p-4 flex flex-col items-center gap-3 cursor-default"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-xl shadow-lg`}>
                {tool.icon}
              </div>
              <span className="text-sm font-medium text-foreground">{tool.name}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground text-sm">
            <span>+</span>
            <span>Any OpenAI-compatible tool or library</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

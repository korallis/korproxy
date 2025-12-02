"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How is this different from OpenRouter or LiteLLM?",
    answer: "KorProxy uses your EXISTING subscriptions via OAuth — no API credits to buy. If you have Claude Pro, ChatGPT Plus, or Gemini Advanced, you already have access. We don't charge per token; you just pay for the app.",
  },
  {
    question: "Do I need API keys?",
    answer: "No! KorProxy uses OAuth authentication. Just sign in with your existing accounts (Google for Gemini, Anthropic for Claude, etc.). Your browser-based subscriptions become a local API.",
  },
  {
    question: "What's included in the subscription?",
    answer: "The KorProxy desktop app and unlimited proxy requests. AI usage comes from your existing subscriptions. We provide the bridge — you bring your own AI accounts.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. KorProxy runs 100% locally on your machine. Your credentials and API requests never touch our servers. We can't see your code or conversations.",
  },
  {
    question: "What happens if I cancel?",
    answer: "You keep access until your billing period ends. No questions asked, cancel anytime from your dashboard. Your AI subscriptions remain unaffected.",
  },
  {
    question: "Which AI providers are supported?",
    answer: "Claude (Anthropic), Gemini (Google), ChatGPT/Codex (OpenAI), Qwen (Alibaba), and iFlow (aggregator for DeepSeek, Kimi, GLM, and more). We're adding new providers regularly.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about KorProxy
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-medium text-foreground pr-4">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-4 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

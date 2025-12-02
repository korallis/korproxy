"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Info } from "lucide-react";

const features = [
  "All AI providers supported",
  "Unlimited proxy requests",
  "All coding tools compatible",
  "Auto-updates included",
  "Priority support",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Use your existing AI subscriptions everywhere. Start with a 7-day free trial.
          </p>
        </motion.div>

        {/* Value clarification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-card p-4 mb-8 max-w-2xl mx-auto"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-foreground">You&apos;re NOT paying for AI usage!</span>
              <span className="text-muted-foreground">
                {" "}KorProxy is a desktop app that connects to YOUR existing Claude Pro, ChatGPT Plus, or Gemini accounts. The subscription is for the proxy software only.
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-semibold text-foreground mb-2">Monthly</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">£14.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="block w-full py-3 text-center border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-all"
            >
              Start Free Trial
            </Link>
          </motion.div>

          {/* Yearly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="glass-card p-8 relative border-primary/50 shadow-glow-lg"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-[oklch(0.70_0.20_180)] rounded-full text-sm font-semibold text-primary-foreground">
              Save 33%
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Yearly</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">£120</span>
              <span className="text-muted-foreground">/year</span>
              <div className="text-sm text-muted-foreground mt-1">£10/month, billed annually</div>
            </div>
            <ul className="space-y-3 mb-8">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium">2 months free</span>
              </li>
            </ul>
            <Link
              href="/register"
              className="block w-full py-3 text-center bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-glow"
            >
              Start Free Trial
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          No credit card required for trial • Cancel anytime
        </motion.p>
      </div>
    </section>
  );
}

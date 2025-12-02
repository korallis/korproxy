import Link from "next/link";
import {
  Layers,
  MonitorSmartphone,
  Zap,
  Shield,
  Check,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const features = [
  {
    icon: Layers,
    title: "Multi-Provider Support",
    description:
      "Use Claude, Gemini, Codex, Qwen, and more providers through a single unified proxy.",
  },
  {
    icon: MonitorSmartphone,
    title: "One Proxy, All Tools",
    description:
      "Works seamlessly with Cursor, Windsurf, Cline, and other AI-powered code editors.",
  },
  {
    icon: Zap,
    title: "Easy Setup",
    description:
      "Authenticate once with your existing subscriptions and use them everywhere instantly.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your API keys stay local on your machine. We never store or have access to your credentials.",
  },
];

const pricingFeatures = [
  "All AI providers supported",
  "Unlimited proxy requests",
  "Priority support",
  "Automatic updates",
  "7-day free trial",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-[oklch(0.70_0.20_180)] bg-clip-text text-transparent">
            Use Your AI Subscriptions Everywhere
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            KorProxy lets you use your existing Claude, Gemini, and OpenAI
            accounts with any AI coding tool
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-glow"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border border-border text-foreground rounded-lg font-semibold text-lg hover:bg-card transition-all"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-[var(--glow-primary)] rounded-full blur-3xl -z-10 opacity-30" />
        <div className="absolute top-60 right-1/4 w-96 h-96 bg-[oklch(0.55_0.20_180/0.3)] rounded-full blur-3xl -z-10" />
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              KorProxy bridges the gap between your AI subscriptions and your
              favorite coding tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-[oklch(0.70_0.20_180)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon size={24} className="text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground text-lg">
              Start with a 7-day free trial. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Monthly Plan */}
            <div className="p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all">
              <h3 className="text-xl font-semibold text-foreground mb-2">Monthly</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">£14.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check size={20} className="text-primary flex-shrink-0" />
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
            </div>

            {/* Yearly Plan */}
            <div className="p-8 rounded-2xl bg-card border border-primary/50 relative shadow-[0_0_30px_var(--glow-primary)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-[oklch(0.70_0.20_180)] rounded-full text-sm font-semibold text-primary-foreground">
                Save 33%
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Yearly</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">£120</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <ul className="space-y-3 mb-8">
                {pricingFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check size={20} className="text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block w-full py-3 text-center bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-glow"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

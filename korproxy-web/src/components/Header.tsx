"use client";

import Link from "next/link";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold">KorProxy</span>
              <p className="text-xs text-muted-foreground">AI Gateway</p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </a>
            <Link
              href="/guides"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Guides
            </Link>
            <Link
              href="/roadmap"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Roadmap
            </Link>
            <Link
              href="/changelog"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Changelog
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 border border-border text-foreground hover:bg-card rounded-lg font-medium transition-all duration-200"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <Link
                href="/guides"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Guides
              </Link>
              <Link
                href="/roadmap"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Roadmap
              </Link>
              <Link
                href="/changelog"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Changelog
              </Link>
              <hr className="border-border" />
              <Link
                href="/login"
                className="px-4 py-2 border border-border text-foreground hover:bg-card rounded-lg font-medium text-center transition-all duration-200"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-center shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

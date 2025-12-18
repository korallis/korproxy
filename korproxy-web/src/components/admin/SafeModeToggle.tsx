"use client";

import { useState } from "react";
import { Shield, Loader2 } from "lucide-react";

interface SafeModeToggleProps {
  safeMode: boolean;
  safeModeProvider: string;
  onEnable: (provider?: string) => Promise<void>;
  onDisable: () => Promise<void>;
  isLoading?: boolean;
}

const SAFE_MODE_PROVIDERS = [
  { value: "claude-haiku", label: "Claude Haiku (Default)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

export function SafeModeToggle({
  safeMode,
  safeModeProvider,
  onEnable,
  onDisable,
  isLoading,
}: SafeModeToggleProps) {
  const [selectedProvider, setSelectedProvider] = useState(safeModeProvider);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      if (safeMode) {
        await onDisable();
      } else {
        await onEnable(selectedProvider);
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleProviderChange = async (provider: string) => {
    setSelectedProvider(provider);
    if (safeMode) {
      setIsPending(true);
      try {
        await onEnable(provider);
      } finally {
        setIsPending(false);
      }
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Safe Mode</h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Enable Safe Mode</p>
            <p className="text-sm text-muted-foreground">
              Forces fallback to a stable, low-cost provider
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isLoading || isPending}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              safeMode ? "bg-[oklch(0.80_0.16_85)]" : "bg-muted"
            } ${isPending ? "opacity-50" : ""}`}
          >
            {isPending ? (
              <Loader2 className="absolute top-1 left-2.5 w-4 h-4 animate-spin" />
            ) : (
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  safeMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            )}
          </button>
        </div>

        {safeMode && (
          <div
            className="bg-[oklch(0.80_0.16_85/0.1)] border border-[oklch(0.80_0.16_85/0.3)] rounded-lg px-3 py-2"
          >
            <p className="text-sm text-[oklch(0.80_0.16_85)]">
              ⚠️ Safe mode is active - all requests will use fallback provider
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Fallback Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            disabled={isLoading || isPending}
            className="w-full px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            {SAFE_MODE_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

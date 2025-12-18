"use client";

import { useState } from "react";
import { Flag, Plus, X, Loader2 } from "lucide-react";

interface FeatureFlagsEditorProps {
  flags: Record<string, boolean>;
  onSetFlag: (flagName: string, value: boolean) => Promise<void>;
  isLoading?: boolean;
}

const COMMON_FLAGS = [
  { name: "beta_features", label: "Beta Features" },
  { name: "advanced_routing", label: "Advanced Routing" },
  { name: "debug_mode", label: "Debug Mode" },
  { name: "priority_support", label: "Priority Support" },
];

export function FeatureFlagsEditor({
  flags,
  onSetFlag,
  isLoading,
}: FeatureFlagsEditorProps) {
  const [newFlagName, setNewFlagName] = useState("");
  const [pendingFlag, setPendingFlag] = useState<string | null>(null);

  const handleToggle = async (flagName: string, currentValue: boolean) => {
    setPendingFlag(flagName);
    try {
      await onSetFlag(flagName, !currentValue);
    } finally {
      setPendingFlag(null);
    }
  };

  const handleAddFlag = async () => {
    const name = newFlagName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!name) return;

    setPendingFlag(name);
    try {
      await onSetFlag(name, true);
      setNewFlagName("");
    } finally {
      setPendingFlag(null);
    }
  };

  const allFlags = { ...flags };
  COMMON_FLAGS.forEach((f) => {
    if (!(f.name in allFlags)) {
      allFlags[f.name] = false;
    }
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Flag className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Feature Flags</h3>
      </div>

      <div className="p-4 space-y-3">
        {Object.entries(allFlags).map(([name, value]) => {
          const commonFlag = COMMON_FLAGS.find((f) => f.name === name);
          const label = commonFlag?.label || name.replace(/_/g, " ");
          const isPending = pendingFlag === name;

          return (
            <div
              key={name}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
            >
              <span className="text-sm capitalize">{label}</span>
              <button
                onClick={() => handleToggle(name, value)}
                disabled={isLoading || isPending}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  value ? "bg-primary" : "bg-muted"
                } ${isPending ? "opacity-50" : ""}`}
              >
                {isPending ? (
                  <Loader2 className="absolute top-1 left-2.5 w-4 h-4 animate-spin text-primary-foreground" />
                ) : (
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                )}
              </button>
            </div>
          );
        })}

        <div className="pt-3 border-t border-border flex gap-2">
          <input
            type="text"
            placeholder="Custom flag name..."
            value={newFlagName}
            onChange={(e) => setNewFlagName(e.target.value)}
            className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleAddFlag()}
          />
          <button
            onClick={handleAddFlag}
            disabled={!newFlagName.trim() || isLoading}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

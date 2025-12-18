"use client";

import { useState, useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { X, Loader2, Users } from "lucide-react";

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const { token } = useAuth();
  const convex = useConvex();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await convex.mutation(api.teams.create, {
        token,
        name: name.trim(),
      });

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || "Failed to create team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative glass-card w-full max-w-md p-6 m-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Create Team</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="team-name"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Team Name
            </label>
            <input
              ref={inputRef}
              id="team-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              maxLength={100}
              required
            />
            <p className="mt-2 text-xs text-muted-foreground">
              You&apos;ll be the owner of this team with full admin rights.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-lg">
              <p className="text-sm text-[oklch(0.65_0.24_25)]">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              Create Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

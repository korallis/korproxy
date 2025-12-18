"use client";

import { useState, useEffect, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "@/providers/AuthProvider";
import { X, Loader2, UserPlus, AlertTriangle, Check, Copy } from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamId: Id<"teams">;
  seatsAvailable: number;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  teamId,
  seatsAvailable,
}: InviteMemberModalProps) {
  const { token } = useAuth();
  const convex = useConvex();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setRole("member");
      setError(null);
      setInviteLink(null);
      setCopied(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email.trim()) return;

    if (seatsAvailable <= 0) {
      setError("No seats available. Please purchase more seats first.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await convex.mutation(api.invites.create, {
        token,
        teamId,
        email: email.trim().toLowerCase(),
        role,
      });

      if (result.success && result.inviteToken) {
        const link = `${window.location.origin}/invite/${result.inviteToken}`;
        setInviteLink(link);
      } else {
        setError(result.error || "Failed to create invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const handleDone = () => {
    onSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={inviteLink ? handleDone : onClose}
      />
      <div className="relative glass-card w-full max-w-md p-6 m-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">
              {inviteLink ? "Invite Created!" : "Invite Member"}
            </h2>
          </div>
          <button
            onClick={inviteLink ? handleDone : onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {inviteLink ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Share this link with <span className="text-foreground font-medium">{email}</span> to invite them to your team.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 bg-muted/50 border border-border/50 rounded-xl text-sm font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link expires in 7 days. The invitee must use the same email address to accept.
            </p>
            <button
              onClick={handleDone}
              className="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {seatsAvailable <= 0 && (
              <div className="mb-4 p-3 bg-[oklch(0.80_0.16_85/0.1)] border border-[oklch(0.80_0.16_85/0.3)] rounded-lg flex items-start gap-2">
                <AlertTriangle size={18} className="text-[oklch(0.80_0.16_85)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[oklch(0.80_0.16_85)]">No seats available</p>
                  <p className="text-xs text-[oklch(0.80_0.16_85/0.8)]">
                    Purchase additional seats to invite more members.
                  </p>
                </div>
              </div>
            )}

            {seatsAvailable > 0 && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{seatsAvailable}</span> seat{seatsAvailable !== 1 ? "s" : ""} available
                </p>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="invite-email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email Address
              </label>
              <input
                ref={inputRef}
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                required
                disabled={seatsAvailable <= 0}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("member")}
                  disabled={seatsAvailable <= 0}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    role === "member"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-border text-muted-foreground"
                  } disabled:opacity-50`}
                >
                  <p className="font-medium">Member</p>
                  <p className="text-xs opacity-70">Can use team features</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  disabled={seatsAvailable <= 0}
                  className={`px-4 py-3 rounded-xl border transition-all ${
                    role === "admin"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:border-border text-muted-foreground"
                  } disabled:opacity-50`}
                >
                  <p className="font-medium">Admin</p>
                  <p className="text-xs opacity-70">Can manage members</p>
                </button>
              </div>
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
                disabled={isLoading || !email.trim() || seatsAvailable <= 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 size={18} className="animate-spin" />}
                Send Invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

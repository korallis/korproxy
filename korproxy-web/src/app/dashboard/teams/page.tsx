"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConvex } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import {
  Users,
  Plus,
  Crown,
  Shield,
  User,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { CreateTeamModal } from "./CreateTeamModal";

interface Team {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
  memberCount: number;
  subscriptionStatus: string;
}

const roleConfig = {
  owner: { icon: Crown, label: "Owner", color: "text-primary" },
  admin: { icon: Shield, label: "Admin", color: "text-blue-400" },
  member: { icon: User, label: "Member", color: "text-muted-foreground" },
};

export default function TeamsPage() {
  const { token } = useAuth();
  const convex = useConvex();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTeams = async () => {
    if (!token) return;
    try {
      const result = await convex.query(api.teams.listForUser, { token });
      setTeams(result as Team[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [token, convex]);

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    fetchTeams();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-foreground">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-glow"
        >
          <Plus size={20} />
          Create Team
        </button>
      </div>

      {error && (
        <div className="bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-[oklch(0.65_0.24_25)] flex-shrink-0" size={20} />
          <p className="text-[oklch(0.65_0.24_25)]">{error}</p>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No teams yet</h2>
          <p className="text-muted-foreground mb-6">
            Create a team to collaborate with others and share your AI subscriptions.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
          >
            <Plus size={20} />
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => {
            const RoleIcon = roleConfig[team.role].icon;
            return (
              <Link
                key={team.id}
                href={`/dashboard/teams/${team.id}`}
                className="glass-card p-6 hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {team.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`flex items-center gap-1.5 text-sm ${roleConfig[team.role].color}`}>
                          <RoleIcon size={14} />
                          {roleConfig[team.role].label}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={team.subscriptionStatus} />
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleTeamCreated}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const badges: Record<string, { className: string; text: string }> = {
    none: { className: "bg-muted text-muted-foreground", text: "No Plan" },
    trialing: { className: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]", text: "Trial" },
    active: { className: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]", text: "Active" },
    past_due: { className: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]", text: "Past Due" },
    canceled: { className: "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.65_0.24_25)]", text: "Canceled" },
  };
  const badge = badges[status] || badges.none;
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
      {badge.text}
    </span>
  );
}

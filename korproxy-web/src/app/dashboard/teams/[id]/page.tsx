"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useConvex } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useAuth } from "@/providers/AuthProvider";
import {
  Users,
  Mail,
  Settings,
  Crown,
  Shield,
  User,
  Loader2,
  AlertCircle,
  ChevronLeft,
  UserPlus,
  MoreVertical,
  Trash2,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { InviteMemberModal } from "../InviteMemberModal";

interface Team {
  id: Id<"teams">;
  name: string;
  ownerUserId: Id<"users">;
  subscriptionStatus: string;
  seatsPurchased: number;
  seatsUsed: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  createdAt: number;
  memberCount: number;
  userRole: "owner" | "admin" | "member";
}

interface Member {
  memberId: Id<"teamMembers">;
  userId: Id<"users">;
  email: string;
  name?: string;
  role: "owner" | "admin" | "member";
  status: string;
  joinedAt?: number;
}

interface Invite {
  id: Id<"teamInvites">;
  email: string;
  role: "admin" | "member";
  status: string;
  inviterEmail: string;
  expiresAt: number;
  createdAt: number;
}

type TabType = "members" | "invites" | "settings";

const roleConfig = {
  owner: { icon: Crown, label: "Owner", color: "text-primary", bgColor: "bg-primary/10" },
  admin: { icon: Shield, label: "Admin", color: "text-blue-400", bgColor: "bg-blue-400/10" },
  member: { icon: User, label: "Member", color: "text-muted-foreground", bgColor: "bg-muted/50" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseUrlOrError(result: unknown): { url: string } | { error: string } {
  if (isRecord(result)) {
    const url = result.url;
    if (typeof url === "string" && url.trim().length > 0) {
      return { url };
    }
    const error = result.error;
    if (typeof error === "string" && error.trim().length > 0) {
      return { error };
    }
  }
  return { error: "Unexpected response from server" };
}

function parseSuccessOrError(result: unknown): { success: boolean } | { error: string } {
  if (isRecord(result)) {
    const success = result.success;
    if (typeof success === "boolean") {
      return { success };
    }
    const error = result.error;
    if (typeof error === "string" && error.trim().length > 0) {
      return { error };
    }
  }
  return { error: "Unexpected response from server" };
}

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, user } = useAuth();
  const convex = useConvex();
  
  const teamId = params.id as string;
  const stripeReturn = searchParams.get("stripe");
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeamData = async () => {
    if (!token || !teamId) return;
    
    try {
      const [teamData, membersData, invitesData] = await Promise.all([
        convex.query(api.teams.get, { token, teamId: teamId as Id<"teams"> }),
        convex.query(api.teams.listMembers, { token, teamId: teamId as Id<"teams"> }),
        convex.query(api.invites.listForTeam, { token, teamId: teamId as Id<"teams"> }),
      ]);
      
      if (!teamData) {
        setError("Team not found or you don't have access");
        return;
      }
      
      setTeam(teamData as Team);
      setMembers(membersData as Member[]);
      setInvites(invitesData as Invite[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [token, teamId, convex]);

  useEffect(() => {
    if (stripeReturn !== "success") return;
    const timer = window.setTimeout(() => {
      fetchTeamData();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [stripeReturn]);

  const handleUpdateRole = async (memberId: Id<"teamMembers">, newRole: "admin" | "member") => {
    if (!token) return;
    setActionLoading(memberId);
    
    try {
      const result = await convex.mutation(api.members.updateRole, {
        token,
        memberId,
        role: newRole,
      });
      
      if (result.success) {
        fetchTeamData();
      } else {
        setError(result.error || "Failed to update role");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: Id<"teamMembers">, isSelfRemove: boolean) => {
    const confirmText = isSelfRemove
      ? "Are you sure you want to leave this team?"
      : "Are you sure you want to remove this member?";
    if (!token || !confirm(confirmText)) return;
    setActionLoading(memberId);
    
    try {
      const result = await convex.mutation(api.members.remove, {
        token,
        memberId,
      });
      
      if (result.success) {
        fetchTeamData();
      } else {
        setError(result.error || "Failed to remove member");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpsertDiscountedSeats = async (discountedSeats: number): Promise<void> => {
    if (!token || !team) return;
    if (team.userRole !== "owner") return;

    if (!Number.isInteger(discountedSeats)) {
      setError("Seat count must be a whole number");
      return;
    }

    if (discountedSeats < 5) {
      setError("Minimum discounted seats is 5");
      return;
    }

    if (discountedSeats + 1 < team.seatsUsed) {
      setError(`Cannot reduce total seats below seats in use (${team.seatsUsed})`);
      return;
    }

    const hasSeatSubscription = team.subscriptionStatus !== "none" && team.subscriptionStatus !== "expired";

    setActionLoading("seats-billing");
    setError(null);
    try {
      if (!hasSeatSubscription) {
        const successUrl = new URL(window.location.href);
        successUrl.searchParams.set("stripe", "success");

        const cancelUrl = new URL(window.location.href);
        cancelUrl.searchParams.set("stripe", "cancel");

        const result: unknown = await convex.action(api.stripe.createTeamCheckoutSession, {
          token,
          teamId: team.id,
          seats: discountedSeats,
          successUrl: successUrl.toString(),
          cancelUrl: cancelUrl.toString(),
        });

        const parsed = parseUrlOrError(result);
        if ("error" in parsed) {
          setError(parsed.error);
          return;
        }

        window.location.assign(parsed.url);
        return;
      }

      const result: unknown = await convex.action(api.stripe.updateTeamSeats, {
        token,
        teamId: team.id,
        newSeatCount: discountedSeats,
      });

      const parsed = parseSuccessOrError(result);
      if ("error" in parsed) {
        setError(parsed.error);
        return;
      }

      if (!parsed.success) {
        setError("Failed to update seats");
        return;
      }

      await fetchTeamData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update seats");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageSeatsInStripe = async (): Promise<void> => {
    if (!token || !team) return;
    if (team.userRole !== "owner") return;

    setActionLoading("seats-portal");
    setError(null);
    try {
      const result: unknown = await convex.action(api.stripe.createTeamPortalSession, {
        token,
        teamId: team.id,
        returnUrl: window.location.href,
      });

      const parsed = parseUrlOrError(result);
      if ("error" in parsed) {
        setError(parsed.error);
        return;
      }

      window.location.assign(parsed.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open Stripe portal");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeInvite = async (inviteId: Id<"teamInvites">) => {
    if (!token) return;
    setActionLoading(inviteId);
    
    try {
      const result = await convex.mutation(api.invites.revoke, {
        token,
        inviteId,
      });
      
      if (result.success) {
        fetchTeamData();
      } else {
        setError(result.error || "Failed to revoke invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvite = async (inviteId: Id<"teamInvites">) => {
    if (!token) return;
    setActionLoading(inviteId);
    
    try {
      const result = await convex.mutation(api.invites.resend, {
        token,
        inviteId,
      });
      
      if (result.success) {
        fetchTeamData();
      } else {
        setError(result.error || "Failed to resend invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTeam = async () => {
    if (!token || !team) return;
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    
    setActionLoading("delete");
    try {
      const result = await convex.mutation(api.teams.deleteTeam, {
        token,
        teamId: team.id,
      });
      
      if (result.success) {
        router.push("/dashboard/teams");
      } else {
        setError(result.error || "Failed to delete team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete team");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateTeamName = async (newName: string) => {
    if (!token || !team) return;
    
    try {
      const result = await convex.mutation(api.teams.update, {
        token,
        teamId: team.id,
        updates: { name: newName },
      });
      
      if (result.success) {
        fetchTeamData();
      } else {
        setError(result.error || "Failed to update team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update team");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="space-y-8">
        <Link href="/dashboard/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={20} />
          Back to Teams
        </Link>
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[oklch(0.65_0.24_25)] mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!team) return null;

  const isOwner = team.userRole === "owner";
  const canAccessSettings = team.userRole === "owner" || team.userRole === "admin";

  return (
    <div className="space-y-8">
      <Link href="/dashboard/teams" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft size={20} />
        Back to Teams
      </Link>

      {/* Team Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <StatusBadge status={team.subscriptionStatus} />
                <span className="text-muted-foreground text-sm">
                  {team.seatsUsed} of {team.seatsPurchased} seats used
                </span>
              </div>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all"
            >
              <UserPlus size={18} />
              Invite Member
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-[oklch(0.65_0.24_25)] shrink-0" size={20} />
          <p className="text-[oklch(0.65_0.24_25)]">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-[oklch(0.65_0.24_25)] hover:text-[oklch(0.55_0.24_25)]">
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border/50 pb-px">
        {[
          { id: "members" as const, label: "Members", icon: Users },
          ...(isOwner ? [{ id: "invites" as const, label: "Invites", icon: Mail, badge: invites.length || undefined }] : []),
          ...(canAccessSettings ? [{ id: "settings" as const, label: "Settings", icon: Settings }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.badge && (
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "members" && (
        <MembersTab
          members={members}
          currentUserRole={team.userRole}
          currentUserId={user?.id ?? null}
          actionLoading={actionLoading}
          onUpdateRole={handleUpdateRole}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {activeTab === "invites" && isOwner && (
        <InvitesTab
          invites={invites}
          canManage={isOwner}
          actionLoading={actionLoading}
          onRevoke={handleRevokeInvite}
          onResend={handleResendInvite}
        />
      )}

      {activeTab === "settings" && canAccessSettings && (
        <SettingsTab
          key={`${String(team.id)}:${team.name}:${team.seatsPurchased}:${team.seatsUsed}:${team.subscriptionStatus}`}
          team={team}
          isOwner={isOwner}
          actionLoading={actionLoading}
          onUpdateName={handleUpdateTeamName}
          onSubmitDiscountedSeats={handleUpsertDiscountedSeats}
          onManageSeatsInStripe={handleManageSeatsInStripe}
          onDelete={handleDeleteTeam}
        />
      )}

      <InviteMemberModal
        isOpen={showInviteModal && isOwner}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          setShowInviteModal(false);
          fetchTeamData();
        }}
        teamId={team.id}
        seatsAvailable={Math.max(0, team.seatsPurchased - team.seatsUsed)}
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

function MembersTab({
  members,
  currentUserRole,
  currentUserId,
  actionLoading,
  onUpdateRole,
  onRemoveMember,
}: {
  members: Member[];
  currentUserRole: "owner" | "admin" | "member";
  currentUserId: string | null;
  actionLoading: string | null;
  onUpdateRole: (memberId: Id<"teamMembers">, role: "admin" | "member") => void;
  onRemoveMember: (memberId: Id<"teamMembers">, isSelfRemove: boolean) => void;
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const canManageRoles = currentUserRole === "owner";
  const canManageMembers = currentUserRole === "owner";

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const RoleIcon = roleConfig[member.role].icon;
        const isCurrentUser = currentUserId !== null && String(member.userId) === currentUserId;
        const canManageThis =
          (canManageMembers && member.role !== "owner" && !isCurrentUser) ||
          (isCurrentUser && member.role !== "owner");
        
        return (
          <div key={member.memberId} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full ${roleConfig[member.role].bgColor} flex items-center justify-center`}>
                <User className={`w-5 h-5 ${roleConfig[member.role].color}`} />
              </div>
              <div>
                <p className="font-medium">{member.name || member.email}</p>
                {member.name && <p className="text-sm text-muted-foreground">{member.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${roleConfig[member.role].bgColor} ${roleConfig[member.role].color}`}>
                <RoleIcon size={12} />
                {roleConfig[member.role].label}
              </span>
              {canManageThis && (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === member.memberId ? null : member.memberId)}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                    disabled={actionLoading === member.memberId}
                  >
                    {actionLoading === member.memberId ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <MoreVertical size={18} className="text-muted-foreground" />
                    )}
                  </button>
                  {menuOpen === member.memberId && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                        {canManageRoles && !isCurrentUser && member.role === "member" && (
                          <button
                            onClick={() => {
                              onUpdateRole(member.memberId, "admin");
                              setMenuOpen(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                          >
                            <Shield size={16} />
                            Promote to Admin
                          </button>
                        )}
                        {canManageRoles && !isCurrentUser && member.role === "admin" && (
                          <button
                            onClick={() => {
                              onUpdateRole(member.memberId, "member");
                              setMenuOpen(null);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                          >
                            <User size={16} />
                            Demote to Member
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onRemoveMember(member.memberId, isCurrentUser);
                            setMenuOpen(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-[oklch(0.65_0.24_25/0.1)] text-[oklch(0.65_0.24_25)] flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          {isCurrentUser ? "Leave team" : "Remove"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvitesTab({
  invites,
  canManage,
  actionLoading,
  onRevoke,
  onResend,
}: {
  invites: Invite[];
  canManage: boolean;
  actionLoading: string | null;
  onRevoke: (inviteId: Id<"teamInvites">) => void;
  onResend: (inviteId: Id<"teamInvites">) => void;
}) {
  // Capture timestamp on mount - stable value for expiration calculations
  const [now] = useState(() => Date.now());

  if (invites.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No pending invites</h3>
        <p className="text-muted-foreground">
          Invite team members to collaborate with you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => {
        const isExpired = invite.expiresAt < now;
        const expiresIn = Math.ceil((invite.expiresAt - now) / (1000 * 60 * 60 * 24));
        
        return (
          <div key={invite.id} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{invite.email}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded text-xs ${roleConfig[invite.role].bgColor} ${roleConfig[invite.role].color}`}>
                    {roleConfig[invite.role].label}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {isExpired ? "Expired" : `Expires in ${expiresIn} day${expiresIn !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onResend(invite.id)}
                  disabled={actionLoading === invite.id}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  title="Resend invite"
                >
                  {actionLoading === invite.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} className="text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => onRevoke(invite.id)}
                  disabled={actionLoading === invite.id}
                  className="p-2 hover:bg-[oklch(0.65_0.24_25/0.1)] rounded-lg transition-colors"
                  title="Revoke invite"
                >
                  <XCircle size={18} className="text-[oklch(0.65_0.24_25)]" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SettingsTab({
  team,
  isOwner,
  actionLoading,
  onUpdateName,
  onSubmitDiscountedSeats,
  onManageSeatsInStripe,
  onDelete,
}: {
  team: Team;
  isOwner: boolean;
  actionLoading: string | null;
  onUpdateName: (name: string) => void;
  onSubmitDiscountedSeats: (discountedSeats: number) => Promise<void>;
  onManageSeatsInStripe: () => Promise<void>;
  onDelete: () => void;
}) {
  const [name, setName] = useState(team.name);
  const [isEditing, setIsEditing] = useState(false);
  const [discountedSeatsInput, setDiscountedSeatsInput] = useState<string>(() => {
    const currentDiscounted = Math.max(0, team.seatsPurchased - 1);
    return String(Math.max(5, currentDiscounted));
  });

  const handleSaveName = () => {
    if (name.trim() && name !== team.name) {
      onUpdateName(name.trim());
    }
    setIsEditing(false);
  };

  const hasSeatSubscription = team.subscriptionStatus !== "none" && team.subscriptionStatus !== "expired";
  const currentDiscountedSeats = Math.max(0, team.seatsPurchased - 1);
  const parsedDesiredDiscountedSeats =
    discountedSeatsInput.trim().length > 0 ? Number.parseInt(discountedSeatsInput, 10) : null;
  const desiredDiscountedSeats =
    parsedDesiredDiscountedSeats !== null && Number.isFinite(parsedDesiredDiscountedSeats)
      ? parsedDesiredDiscountedSeats
      : null;
  const minDiscountedSeatsForUsage = Math.max(5, team.seatsUsed - 1);
  const canSubmitSeats = desiredDiscountedSeats !== null && desiredDiscountedSeats >= minDiscountedSeatsForUsage;
  const desiredTotalSeats = desiredDiscountedSeats !== null ? desiredDiscountedSeats + 1 : null;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Team Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Team Name
            </label>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={100}
                />
                <button
                  onClick={handleSaveName}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setName(team.name);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-muted rounded-xl font-medium hover:bg-muted/80"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-foreground">{team.name}</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-2">Seats</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Discounted seats are billed at £5.00 per seat per month. Minimum purchase is 5 discounted seats (6 total including you).
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current usage</span>
              <span className="text-sm font-medium">
                {team.seatsUsed} / {team.seatsPurchased} total seats used
              </span>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Discounted seats (billed)
              </label>
              <input
                type="number"
                min={minDiscountedSeatsForUsage}
                step={1}
                inputMode="numeric"
                value={discountedSeatsInput}
                onChange={(e) => setDiscountedSeatsInput(e.target.value)}
                className="w-full px-4 py-2 bg-muted/50 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Minimum discounted seats right now:</span>
                <span className="font-medium text-foreground">{minDiscountedSeatsForUsage}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Total seats (including you):</span>
                <span className="font-medium text-foreground">
                  {desiredTotalSeats ?? "--"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Currently billed discounted seats:</span>
                <span className="font-medium text-foreground">{currentDiscountedSeats}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (desiredDiscountedSeats === null) return;
                  await onSubmitDiscountedSeats(desiredDiscountedSeats);
                }}
                disabled={!canSubmitSeats || actionLoading === "seats-billing"}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {actionLoading === "seats-billing" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {hasSeatSubscription ? "Update Seats" : "Purchase Seats"}
              </button>

              {hasSeatSubscription && (
                <button
                  onClick={onManageSeatsInStripe}
                  disabled={actionLoading === "seats-portal"}
                  className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl font-medium hover:bg-muted/80 transition-all disabled:opacity-50"
                >
                  {actionLoading === "seats-portal" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  Manage in Stripe
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {isOwner && (
        <div className="glass-card p-6 border-[oklch(0.65_0.24_25/0.3)]">
          <h3 className="text-lg font-semibold mb-2 text-[oklch(0.65_0.24_25)]">Danger Zone</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete a team, there is no going back. Please be certain.
          </p>
          <button
            onClick={onDelete}
            disabled={actionLoading === "delete"}
            className="flex items-center gap-2 px-4 py-2 bg-[oklch(0.65_0.24_25)] text-white rounded-xl font-medium hover:bg-[oklch(0.55_0.24_25)] transition-all disabled:opacity-50"
          >
            {actionLoading === "delete" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Trash2 size={18} />
            )}
            Delete Team
          </button>
        </div>
      )}
    </div>
  );
}

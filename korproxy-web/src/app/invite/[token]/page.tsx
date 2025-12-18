"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useConvex } from "convex/react";
import { useAuth } from "@/providers/AuthProvider";
import { getInviteByToken, acceptInvite, InviteDetails } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Users,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  UserPlus,
} from "lucide-react";

type InviteState =
  | "loading"
  | "valid"
  | "expired"
  | "accepted"
  | "revoked"
  | "invalid";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const convex = useConvex();
  const { user, token, isLoading: authLoading } = useAuth();
  const inviteToken = params.token as string;

  const [inviteState, setInviteState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      if (!inviteToken) {
        setInviteState("invalid");
        return;
      }

      try {
        const result = await getInviteByToken(convex, inviteToken);
        if (!result) {
          setInviteState("invalid");
          return;
        }

        setInvite(result);

        if (result.status === "accepted") {
          setInviteState("accepted");
        } else if (result.status === "revoked") {
          setInviteState("revoked");
        } else if (result.isExpired || result.status === "expired") {
          setInviteState("expired");
        } else {
          setInviteState("valid");
        }
      } catch (err) {
        console.error("Failed to fetch invite:", err);
        setInviteState("invalid");
      }
    }

    fetchInvite();
  }, [convex, inviteToken]);

  const handleAccept = async () => {
    if (!token || !inviteToken) return;

    setAccepting(true);
    setError(null);

    try {
      const result = await acceptInvite(convex, token, inviteToken);
      if (result.success) {
        router.push("/dashboard/teams");
      } else {
        setError(result.error || "Failed to accept invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  const isAuthenticated = !authLoading && !!user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 rounded-lg">
            {inviteState === "loading" || authLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading invite...</p>
              </div>
            ) : inviteState === "invalid" ? (
              <InvalidInvite />
            ) : inviteState === "expired" ? (
              <ExpiredInvite teamName={invite?.teamName} />
            ) : inviteState === "accepted" ? (
              <AlreadyAccepted teamName={invite?.teamName} />
            ) : inviteState === "revoked" ? (
              <RevokedInvite teamName={invite?.teamName} />
            ) : invite ? (
              <ValidInvite
                invite={invite}
                isAuthenticated={isAuthenticated}
                userEmail={user?.email}
                accepting={accepting}
                error={error}
                onAccept={handleAccept}
                inviteToken={inviteToken}
              />
            ) : null}
          </div>
        </div>

        <div className="absolute top-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-60 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      </main>

      <Footer />
    </div>
  );
}

function InvalidInvite() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Invalid Invite Link</h1>
      <p className="text-muted-foreground mb-6">
        This invite link is not valid. It may have been deleted or the link is incorrect.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all"
      >
        Go Home
      </Link>
    </div>
  );
}

function ExpiredInvite({ teamName }: { teamName?: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-yellow-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Invite Expired</h1>
      <p className="text-muted-foreground mb-6">
        This invite to join{" "}
        <span className="font-semibold text-foreground">{teamName || "the team"}</span>{" "}
        has expired. Please ask the team admin to send a new invite.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all"
      >
        Go Home
      </Link>
    </div>
  );
}

function AlreadyAccepted({ teamName }: { teamName?: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Already Joined</h1>
      <p className="text-muted-foreground mb-6">
        You&apos;ve already joined{" "}
        <span className="font-semibold text-foreground">{teamName || "this team"}</span>.
      </p>
      <Link
        href="/dashboard/teams"
        className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all"
      >
        Go to Teams
      </Link>
    </div>
  );
}

function RevokedInvite({ teamName }: { teamName?: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Invite Revoked</h1>
      <p className="text-muted-foreground mb-6">
        This invite to join{" "}
        <span className="font-semibold text-foreground">{teamName || "the team"}</span>{" "}
        has been revoked by the team admin.
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-all"
      >
        Go Home
      </Link>
    </div>
  );
}

function ValidInvite({
  invite,
  isAuthenticated,
  userEmail,
  accepting,
  error,
  onAccept,
  inviteToken,
}: {
  invite: InviteDetails;
  isAuthenticated: boolean;
  userEmail?: string;
  accepting: boolean;
  error: string | null;
  onAccept: () => void;
  inviteToken: string;
}) {
  const emailMismatch = isAuthenticated && userEmail && userEmail !== invite.invitedEmail;

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <UserPlus className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
      <p className="text-muted-foreground mb-6">
        You&apos;ve been invited to join a team on KorProxy
      </p>

      <div className="bg-muted/30 rounded-xl p-6 mb-6 text-left space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Team</p>
            <p className="font-semibold">{invite.teamName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Mail size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Invited Email</p>
            <p className="font-semibold">{invite.invitedEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <Shield size={20} className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-semibold capitalize">{invite.role}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
          {error}
        </div>
      )}

      {emailMismatch && (
        <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 text-sm">
          This invite was sent to{" "}
          <span className="font-semibold">{invite.invitedEmail}</span>. You&apos;re
          logged in as <span className="font-semibold">{userEmail}</span>.
        </div>
      )}

      {isAuthenticated ? (
        <button
          onClick={onAccept}
          disabled={accepting}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Accept Invite
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <Link
            href={`/login?redirect=/invite/${inviteToken}`}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            Login to Accept
          </Link>
          <Link
            href={`/register?redirect=/invite/${inviteToken}`}
            className="w-full py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-muted/50 transition-all flex items-center justify-center gap-2"
          >
            Register to Accept
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvex } from "convex/react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getMetrics,
  listUsers,
  getRecentEvents,
  formatMoney,
  searchUsers,
  getUserById,
  getFeatureFlags,
  setFeatureFlag,
  enableSafeMode,
  disableSafeMode,
  getAdminLogs,
  AdminUserDetail,
  FeatureFlags,
  AdminLog,
} from "@/lib/api";
import {
  UserStatusCard,
  FeatureFlagsEditor,
  SafeModeToggle,
  AdminLogsTable,
} from "@/components/admin";
import {
  Users,
  CreditCard,
  Clock,
  PoundSterling,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";

interface Metrics {
  totalUsers: number;
  activeSubscriptions: number;
  trialUsers: number;
  expiredUsers: number;
  lifetimeUsers: number;
  monthlyMRR: number;
  annualizedRevenue: number;
  monthlySubscribers: number;
  yearlySubscribers: number;
}

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  subscriptionStatus: string;
  subscriptionPlan?: string;
  currentPeriodEnd?: number;
  createdAt: number;
}

interface SubscriptionEvent {
  id: string;
  userId: string;
  userEmail?: string;
  eventType: string;
  fromStatus?: string;
  toStatus: string;
  plan?: string;
  occurredAt: number;
}

const USERS_PER_PAGE = 10;

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    none: "bg-muted text-muted-foreground",
    trialing: "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]",
    active: "bg-[oklch(0.72_0.19_145/0.2)] text-[oklch(0.72_0.19_145)]",
    past_due: "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]",
    canceled: "bg-[oklch(0.65_0.24_25/0.2)] text-[oklch(0.65_0.24_25)]",
    expired: "bg-muted text-muted-foreground",
    lifetime: "bg-primary/20 text-primary",
  };
  return classes[status] || "bg-muted text-muted-foreground";
}

export default function AdminPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const convex = useConvex();

  // Dashboard state
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [events, setEvents] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // User management state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AdminUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [userFlags, setUserFlags] = useState<FeatureFlags | null>(null);
  const [userLogs, setUserLogs] = useState<AdminLog[]>([]);
  const [allLogs, setAllLogs] = useState<AdminLog[]>([]);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchData() {
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        const [metricsResult, usersResult, eventsResult, logsResult] = await Promise.all([
          getMetrics(convex, token),
          listUsers(convex, token, USERS_PER_PAGE, page * USERS_PER_PAGE),
          getRecentEvents(convex, token, 10),
          getAdminLogs(convex, token, undefined, 20),
        ]);

        if ("error" in metricsResult) {
          setError(metricsResult.error);
          return;
        }
        if ("error" in usersResult) {
          setError(usersResult.error);
          return;
        }
        if ("error" in eventsResult) {
          setError(eventsResult.error);
          return;
        }

        setMetrics(metricsResult);
        setUsers(usersResult.users);
        setTotalUsers(usersResult.total);
        setEvents(eventsResult.events);

        if (!("error" in logsResult)) {
          setAllLogs(logsResult.logs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "admin" && token) {
      fetchData();
    }
  }, [convex, token, user, page]);

  // Search users
  useEffect(() => {
    async function search() {
      if (!token || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await searchUsers(convex, token, searchQuery);
        if (!("error" in result)) {
          setSearchResults(result.users as AdminUser[]);
        }
      } finally {
        setIsSearching(false);
      }
    }

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [convex, token, searchQuery]);

  // Load selected user details
  const loadUserDetails = useCallback(async (userId: string) => {
    if (!token) return;

    setLoadingUser(true);
    setSelectedUserId(userId);

    try {
      const [userResult, flagsResult, logsResult] = await Promise.all([
        getUserById(convex, token, userId),
        getFeatureFlags(convex, token, userId),
        getAdminLogs(convex, token, userId, 20),
      ]);

      if (userResult && !("error" in userResult)) {
        setSelectedUser(userResult);
      }

      if (flagsResult && !("error" in flagsResult)) {
        setUserFlags(flagsResult);
      } else {
        setUserFlags(null);
      }

      if (!("error" in logsResult)) {
        setUserLogs(logsResult.logs);
      }
    } finally {
      setLoadingUser(false);
    }
  }, [convex, token]);

  const handleSetFlag = async (flagName: string, value: boolean) => {
    if (!token || !selectedUserId) return;

    const result = await setFeatureFlag(convex, token, selectedUserId, flagName, value);
    if (!("error" in result)) {
      // Reload user flags
      const flagsResult = await getFeatureFlags(convex, token, selectedUserId);
      if (flagsResult && !("error" in flagsResult)) {
        setUserFlags(flagsResult);
      }
      // Reload logs
      const logsResult = await getAdminLogs(convex, token, selectedUserId, 20);
      if (!("error" in logsResult)) {
        setUserLogs(logsResult.logs);
      }
    }
  };

  const handleEnableSafeMode = async (provider?: string) => {
    if (!token || !selectedUserId) return;

    const result = await enableSafeMode(convex, token, selectedUserId, provider);
    if (!("error" in result)) {
      const flagsResult = await getFeatureFlags(convex, token, selectedUserId);
      if (flagsResult && !("error" in flagsResult)) {
        setUserFlags(flagsResult);
      }
      const logsResult = await getAdminLogs(convex, token, selectedUserId, 20);
      if (!("error" in logsResult)) {
        setUserLogs(logsResult.logs);
      }
    }
  };

  const handleDisableSafeMode = async () => {
    if (!token || !selectedUserId) return;

    const result = await disableSafeMode(convex, token, selectedUserId);
    if (!("error" in result)) {
      const flagsResult = await getFeatureFlags(convex, token, selectedUserId);
      if (flagsResult && !("error" in flagsResult)) {
        setUserFlags(flagsResult);
      }
      const logsResult = await getAdminLogs(convex, token, selectedUserId, 20);
      if (!("error" in logsResult)) {
        setUserLogs(logsResult.logs);
      }
    }
  };

  const clearUserSelection = () => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setUserFlags(null);
    setUserLogs([]);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);

  // User detail view
  if (selectedUserId && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={clearUserSelection}
            className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">{selectedUser.email}</p>
          </div>
        </div>

        {loadingUser ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <UserStatusCard user={selectedUser} />
              <SafeModeToggle
                safeMode={userFlags?.safeMode ?? false}
                safeModeProvider={userFlags?.safeModeProvider ?? "claude-haiku"}
                onEnable={handleEnableSafeMode}
                onDisable={handleDisableSafeMode}
              />
            </div>
            <div className="space-y-6">
              <FeatureFlagsEditor
                flags={userFlags?.flags ?? {}}
                onSetFlag={handleSetFlag}
              />
            </div>
            <div className="lg:col-span-2">
              <AdminLogsTable logs={userLogs} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main dashboard view
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Monitor users, subscriptions, and revenue</p>
      </div>

      {/* User Search */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {searchQuery.length >= 2 && (
          <div className="mt-2 border border-border rounded-lg divide-y divide-border max-h-64 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="animate-spin inline-block mr-2" size={16} />
                Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No users found
              </div>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => loadUserDetails(u.id)}
                  className="w-full p-3 text-left hover:bg-muted/50 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{u.email}</p>
                    <p className="text-sm text-muted-foreground">{u.name || "No name"}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(
                      u.subscriptionStatus
                    )}`}
                  >
                    {u.subscriptionStatus}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[oklch(0.65_0.24_25/0.1)] border border-[oklch(0.65_0.24_25/0.3)] rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-[oklch(0.65_0.24_25)] flex-shrink-0" size={20} />
          <p className="text-[oklch(0.65_0.24_25)]">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              icon={Users}
              label="Total Users"
              value={metrics?.totalUsers ?? 0}
            />
            <MetricCard
              icon={CreditCard}
              label="Active Subscribers"
              value={metrics?.activeSubscriptions ?? 0}
            />
            <MetricCard
              icon={Clock}
              label="Trial Users"
              value={metrics?.trialUsers ?? 0}
            />
            <MetricCard
              icon={PoundSterling}
              label="MRR"
              value={formatMoney(metrics?.monthlyMRR ?? 0)}
              isMoney
            />
            <MetricCard
              icon={TrendingUp}
              label="ARR"
              value={formatMoney(metrics?.annualizedRevenue ?? 0)}
              isMoney
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Monthly Subscribers</p>
              <p className="text-xl font-bold">{metrics?.monthlySubscribers ?? 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Yearly Subscribers</p>
              <p className="text-xl font-bold">{metrics?.yearlySubscribers ?? 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Lifetime Users</p>
              <p className="text-xl font-bold">{metrics?.lifetimeUsers ?? 0}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-muted-foreground text-sm">Expired/Churned</p>
              <p className="text-xl font-bold">{metrics?.expiredUsers ?? 0}</p>
            </div>
          </div>

          {/* Admin Actions Log */}
          {allLogs.length > 0 && <AdminLogsTable logs={allLogs} />}

          {/* Recent Events */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold">Recent Subscription Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Event</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status Change</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Plan</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-muted-foreground">
                        No recent events
                      </td>
                    </tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event.id} className="hover:bg-muted/50">
                        <td className="p-4 text-sm">{event.userEmail || "Unknown"}</td>
                        <td className="p-4 text-sm capitalize">
                          {event.eventType.replace(/_/g, " ")}
                        </td>
                        <td className="p-4 text-sm">
                          {event.fromStatus && (
                            <>
                              <span className="text-muted-foreground">{event.fromStatus}</span>
                              <span className="text-muted-foreground/50 mx-2">→</span>
                            </>
                          )}
                          <span className="text-primary">{event.toStatus}</span>
                        </td>
                        <td className="p-4 text-sm capitalize">
                          {event.plan || "-"}
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {formatDate(event.occurredAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Users List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Users</h2>
              <span className="text-muted-foreground text-sm">{totalUsers} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Role</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Plan</th>
                    <th className="text-left p-4 text-muted-foreground font-medium">Joined</th>
                    <th className="text-left p-4 text-muted-foreground font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50">
                      <td className="p-4 text-sm">{u.email}</td>
                      <td className="p-4 text-sm">{u.name || "-"}</td>
                      <td className="p-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(
                            u.subscriptionStatus
                          )}`}
                        >
                          {u.subscriptionStatus}
                        </span>
                      </td>
                      <td className="p-4 text-sm capitalize">
                        {u.subscriptionPlan || "-"}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => loadUserDetails(u.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-2 bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="p-2 bg-muted hover:bg-muted/80 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  isMoney = false,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  isMoney?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Icon size={20} className="text-primary" />
        </div>
        <span className="text-muted-foreground text-sm">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${isMoney ? "text-[oklch(0.72_0.19_145)]" : ""}`}>
        {value}
      </p>
    </div>
  );
}

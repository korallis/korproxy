"use client";

import { History } from "lucide-react";

interface AdminLog {
  id: string;
  userId: string;
  userEmail?: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  details: string;
  timestamp: number;
}

interface AdminLogsTableProps {
  logs: AdminLog[];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getActionBadgeClass(action: string): string {
  if (action.includes("safe_mode")) {
    return "bg-[oklch(0.80_0.16_85/0.2)] text-[oklch(0.80_0.16_85)]";
  }
  if (action.includes("flag")) {
    return "bg-[oklch(0.55_0.15_250/0.2)] text-[oklch(0.70_0.15_250)]";
  }
  return "bg-muted text-muted-foreground";
}

export function AdminLogsTable({ logs }: AdminLogsTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        <h3 className="font-bold">Recent Admin Actions</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                Time
              </th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                Admin
              </th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                Target User
              </th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                Action
              </th>
              <th className="text-left p-4 text-muted-foreground font-medium text-sm">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-muted-foreground"
                >
                  No admin actions recorded
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50">
                  <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="p-4 text-sm">
                    {log.adminEmail || "Unknown"}
                  </td>
                  <td className="p-4 text-sm">
                    {log.userEmail || "Unknown"}
                  </td>
                  <td className="p-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeClass(
                        log.action
                      )}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

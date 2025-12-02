"use client";

import { useAuth } from "@/providers/AuthProvider";
import { User, Mail, Shield } from "lucide-react";

export default function AccountPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">Account</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Profile Info */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-6">Profile Information</h2>

        <div className="space-y-6">
          {/* Name */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-primary" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Name
              </label>
              <p className="text-lg">{user?.name || "Not set"}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Mail size={20} className="text-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <p className="text-lg">{user?.email}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Shield size={20} className="text-green-500" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Account Type
              </label>
              <p className="text-lg capitalize">{user?.role || "user"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account ID */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-4">Account ID</h2>
        <p className="text-muted-foreground text-sm mb-2">
          Your unique account identifier for support purposes
        </p>
        <code className="block bg-muted/50 px-4 py-3 rounded-lg text-sm text-muted-foreground font-mono">
          {user?.id || "N/A"}
        </code>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useConvex } from "convex/react";
import { useAuth } from "@/providers/AuthProvider";
import { listDevices, removeDevice, Device } from "@/lib/api";
import {
  User,
  Mail,
  Shield,
  Monitor,
  Laptop,
  Clock,
  LogOut,
  Loader2,
  Apple,
  MonitorSmartphone,
  Lock,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";

function formatLastSeen(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "darwin":
      return <Apple size={16} className="text-muted-foreground" />;
    case "win32":
      return <Monitor size={16} className="text-muted-foreground" />;
    case "linux":
      return <MonitorSmartphone size={16} className="text-muted-foreground" />;
    default:
      return <Monitor size={16} className="text-muted-foreground" />;
  }
}

function getPlatformLabel(platform: string) {
  switch (platform) {
    case "darwin":
      return "macOS";
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return platform;
  }
}

function getDeviceIcon(deviceType: string) {
  switch (deviceType) {
    case "laptop":
      return <Laptop size={20} className="text-primary" />;
    default:
      return <Monitor size={20} className="text-primary" />;
  }
}

export default function AccountPage() {
  const { user, token, changePassword } = useAuth();
  const convex = useConvex();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await listDevices(convex, token);
      if (result) {
        setDevices(result);
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoading(false);
    }
  }, [convex, token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleRemoveDevice = async (deviceId: string) => {
    if (!token) return;
    setRemovingDevice(deviceId);
    try {
      const result = await removeDevice(convex, token, deviceId);
      if (result.success) {
        setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      }
    } catch (error) {
      console.error("Failed to remove device:", error);
    } finally {
      setRemovingDevice(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setPasswordSuccess("Password updated successfully. Other devices have been signed out.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

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

      {/* Security - Password Change */}
      <div className="glass-card p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Lock size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update your password to keep your account secure
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                placeholder="Enter current password"
                disabled={isChangingPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                placeholder="Enter new password"
                disabled={isChangingPassword}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
                placeholder="Confirm new password"
                disabled={isChangingPassword}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {passwordError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{passwordError}</p>
            </div>
          )}

          {/* Success Message */}
          {passwordSuccess && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
              <Check size={16} className="text-green-400" />
              <p className="text-sm text-green-400">{passwordSuccess}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>

      {/* Devices */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-6">Registered Devices</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Devices running KorProxy desktop app linked to your account
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No devices registered</p>
            <p className="text-sm mt-1">
              Download KorProxy and sign in to register a device
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{device.deviceName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        {getPlatformIcon(device.platform)}
                        {getPlatformLabel(device.platform)}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatLastSeen(device.lastSeenAt)}
                      </span>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-xs">v{device.appVersion}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveDevice(device.deviceId)}
                  disabled={removingDevice === device.deviceId}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                >
                  {removingDevice === device.deviceId ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <LogOut size={16} />
                  )}
                  Sign Out
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preferences (placeholder) */}
      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <p className="text-muted-foreground text-sm">
          Preference settings coming soon.
        </p>
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

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
  const { user, token } = useAuth();
  const convex = useConvex();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);

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

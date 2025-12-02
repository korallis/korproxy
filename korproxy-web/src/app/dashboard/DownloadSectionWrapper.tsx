"use client";

import { useEffect, useState } from "react";
import { Download, Lock, Loader2 } from "lucide-react";
import { type ReleaseInfo } from "@/lib/github";

interface DownloadSectionWrapperProps {
  hasAccess: boolean;
}

export function DownloadSectionWrapper({ hasAccess }: DownloadSectionWrapperProps) {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelease() {
      try {
        const response = await fetch("/api/releases/latest");
        if (response.ok) {
          const data = await response.json();
          setRelease(data);
        }
      } catch (error) {
        console.error("Failed to fetch release:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRelease();
  }, []);

  if (!hasAccess) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 opacity-75">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="text-muted-foreground" size={24} />
          <h2 className="text-2xl font-bold text-muted-foreground">Download KorProxy</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Subscribe to download and use the KorProxy desktop app.
        </p>
        <div className="flex flex-wrap gap-4">
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Lock size={20} />
            macOS (Apple Silicon)
          </span>
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Lock size={20} />
            macOS (Intel)
          </span>
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Lock size={20} />
            Windows
          </span>
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Lock size={20} />
            Linux
          </span>
        </div>
      </div>
    );
  }

  const version = release?.tag_name || "v1.0.0";

  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <Download className="text-primary" size={24} />
        <h2 className="text-2xl font-bold">Download KorProxy</h2>
        {loading ? (
          <Loader2 size={16} className="animate-spin text-muted-foreground" />
        ) : release && (
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
            {version}
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-6">
        Get the KorProxy desktop app to start using your AI subscriptions with any coding tool.
      </p>
      <div className="flex flex-wrap gap-4">
        {release?.assets.macArm64 ? (
          <a
            href={release.assets.macArm64.browser_download_url}
            className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Download size={20} />
            macOS (Apple Silicon)
          </a>
        ) : (
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Download size={20} />
            macOS (Apple Silicon)
          </span>
        )}
        
        {release?.assets.macX64 ? (
          <a
            href={release.assets.macX64.browser_download_url}
            className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Download size={20} />
            macOS (Intel)
          </a>
        ) : (
          <span className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60">
            <Download size={20} />
            macOS (Intel)
          </span>
        )}
        
        {release?.assets.windows ? (
          <a
            href={release.assets.windows.browser_download_url}
            className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Windows
          </a>
        ) : (
          <span
            className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60"
            title="Coming soon"
          >
            <Download size={20} />
            Windows (Coming Soon)
          </span>
        )}
        
        {release?.assets.linuxAppImage ? (
          <a
            href={release.assets.linuxAppImage.browser_download_url}
            className="px-6 py-3 bg-muted hover:bg-muted/80 rounded-xl font-semibold transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Linux
          </a>
        ) : (
          <span
            className="px-6 py-3 bg-muted/50 rounded-xl font-semibold flex items-center gap-2 cursor-not-allowed opacity-60"
            title="Coming soon"
          >
            <Download size={20} />
            Linux (Coming Soon)
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        <a href="https://github.com/korallis/korproxy/releases" className="hover:underline" target="_blank" rel="noopener noreferrer">
          View all releases →
        </a>
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isGuideDetail = pathname !== "/dashboard/guides";

  return (
    <div>
      {isGuideDetail && (
        <Link
          href="/dashboard/guides"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to guides</span>
        </Link>
      )}
      {children}
    </div>
  );
}

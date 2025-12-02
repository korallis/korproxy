"use client";

import { ConvexProvider as ConvexReactProvider } from "convex/react";
import { convex } from "@/lib/convex";

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return <ConvexReactProvider client={convex}>{children}</ConvexReactProvider>;
}

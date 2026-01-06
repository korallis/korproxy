"use client";

import { useMemo } from "react";
import { ConvexProvider as ConvexReactProvider } from "convex/react";
import { getConvexClient } from "@/lib/convex";

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  const client = useMemo(() => getConvexClient(), []);
  return <ConvexReactProvider client={client}>{children}</ConvexReactProvider>;
}

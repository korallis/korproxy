"use client";

import { ConvexProvider } from "./ConvexProvider";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
      <AuthProvider>{children}</AuthProvider>
    </ConvexProvider>
  );
}

export { useAuth } from "./AuthProvider";

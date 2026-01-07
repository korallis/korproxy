"use client";

import { ConvexReactClient } from "convex/react";

let cachedClient: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (cachedClient) {
    return cachedClient;
  }

  const defaultConvexUrl = "https://content-pig-658.convex.cloud";
  const envConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const convexUrl =
    typeof envConvexUrl === "string" && envConvexUrl.trim().length > 0
      ? envConvexUrl
      : defaultConvexUrl;

  cachedClient = new ConvexReactClient(convexUrl);
  return cachedClient;
}

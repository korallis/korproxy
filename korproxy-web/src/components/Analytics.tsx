"use client";

import Script from "next/script";

export function Analytics() {
  const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* 
        Placeholder for Plausible Analytics
        Add your Plausible script here when ready:
        
        <Script
          defer
          data-domain="korproxy.com"
          src="https://plausible.io/js/script.js"
        />
        
        Or for Umami:
        
        <Script
          defer
          src="https://your-umami-instance.com/script.js"
          data-website-id="your-website-id"
        />
      */}
    </>
  );
}

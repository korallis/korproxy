import type { Metadata } from "next";
import { AlertCircle, CheckCircle2, XCircle, HelpCircle, Terminal, RefreshCw, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "Troubleshooting | KorProxy",
  description: "Common issues and solutions for KorProxy",
  openGraph: {
    title: "Troubleshooting | KorProxy",
    description: "Common issues and solutions for KorProxy",
  },
};

const commonIssues = [
  {
    title: "Connection refused (ECONNREFUSED)",
    description: "The proxy server is not running or not reachable.",
    solutions: [
      "Make sure KorProxy app is running",
      "Check if the proxy is started (green status in dashboard)",
      "Verify port 1337 is not blocked by firewall",
      "Try restarting the proxy from the dashboard",
    ],
  },
  {
    title: "Invalid API key",
    description: "The API key validation failed.",
    solutions: [
      "You can use any string as the API key (e.g., 'korproxy')",
      "Verify the base URL is correct (http://localhost:1337)",
      "Check that you're using the right endpoint format",
    ],
  },
  {
    title: "Model not found",
    description: "The specified model is not available.",
    solutions: [
      "Verify the provider is authenticated in KorProxy",
      "Check the model name spelling (case-sensitive)",
      "Ensure your subscription supports the requested model",
      "See the Models guide for available model names",
    ],
  },
  {
    title: "Session expired / Token expired",
    description: "Your authentication has expired.",
    solutions: [
      "Re-authenticate the provider in KorProxy",
      "Click the refresh button on the provider card",
      "Some providers require periodic re-authentication",
    ],
  },
  {
    title: "Rate limited / Quota exceeded",
    description: "You've hit the provider's rate limits.",
    solutions: [
      "Wait a few minutes before retrying",
      "Check your subscription tier's limits",
      "Consider using a different provider temporarily",
    ],
  },
  {
    title: "Network error / Timeout",
    description: "The request failed due to network issues.",
    solutions: [
      "Check your internet connection",
      "Verify the provider's API is not experiencing downtime",
      "Try a smaller request or different model",
      "Check KorProxy logs for detailed error messages",
    ],
  },
];

const healthStates = [
  {
    state: "Healthy",
    icon: CheckCircle2,
    color: "text-green-500",
    description: "Proxy is running and responding to requests.",
  },
  {
    state: "Degraded",
    icon: AlertCircle,
    color: "text-yellow-500",
    description: "Proxy is running but experiencing issues. Check logs for details.",
  },
  {
    state: "Unreachable",
    icon: Wifi,
    color: "text-orange-500",
    description: "Proxy is not responding. It may be starting up or crashed.",
  },
  {
    state: "Failed",
    icon: XCircle,
    color: "text-red-500",
    description: "Proxy failed to start. Check logs or restart the app.",
  },
  {
    state: "Stopped",
    icon: HelpCircle,
    color: "text-muted-foreground",
    description: "Proxy is not running. Click Start to begin.",
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            <HelpCircle size={28} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Troubleshooting</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Common issues and their solutions when using KorProxy
        </p>
      </div>

      {/* Quick Fixes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <RefreshCw size={20} className="text-primary" />
          Quick Fixes
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">Try these steps first:</p>
          <ol className="space-y-3 text-muted-foreground list-decimal list-inside">
            <li>Restart the proxy (Dashboard → Stop → Start)</li>
            <li>Re-authenticate your provider (Providers → Reconnect)</li>
            <li>Check the Logs page for specific error messages</li>
            <li>Ensure KorProxy is the latest version</li>
          </ol>
        </div>
      </section>

      {/* Common Issues */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-primary" />
          Common Issues
        </h2>
        <div className="space-y-4">
          {commonIssues.map((issue, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">{issue.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>
              <ul className="space-y-2">
                {issue.solutions.map((solution, sIndex) => (
                  <li key={sIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                    <span>{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Health States */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Terminal size={20} className="text-primary" />
          Health States Explained
        </h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground mb-4">
            The dashboard shows the proxy health status:
          </p>
          <div className="space-y-4">
            {healthStates.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon size={20} className={`${item.color} mt-0.5 shrink-0`} />
                <div>
                  <p className="font-medium text-foreground">{item.state}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Help */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Still Need Help?</h2>
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
          <p className="text-muted-foreground mb-4">
            If you&apos;re still experiencing issues:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Export your logs (Logs → Export) for debugging
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Check our GitHub Issues for known problems
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Open a new issue with your logs and error details
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

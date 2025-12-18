import { getRoadmapContent } from "@/lib/roadmap";
import {
  Map,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Product Roadmap | KorProxy",
  description:
    "See what we're building next. Our product roadmap shows planned features, current development status, and our vision for KorProxy.",
};

function StatusBadge({ status }: { status: "planned" | "in-progress" | "done" }) {
  const config = {
    planned: {
      label: "Planned",
      className: "bg-muted text-muted-foreground",
      icon: Circle,
    },
    "in-progress": {
      label: "In Progress",
      className: "bg-blue-500/20 text-blue-400",
      icon: Clock,
    },
    done: {
      label: "Done",
      className: "bg-green-500/20 text-green-400",
      icon: CheckCircle2,
    },
  };

  const { label, className, icon: Icon } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

export default async function RoadmapPage() {
  const roadmap = await getRoadmapContent();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Map size={28} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Product Roadmap</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Our vision for KorProxy and what we&apos;re building next
          </p>
        </div>

        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Vision
          </h2>
          <p className="text-muted-foreground">{roadmap.vision}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="glass-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Version:</span>{" "}
            <span className="text-foreground font-medium">
              {roadmap.currentState.version}
            </span>
          </div>
          <div className="glass-card px-4 py-2 text-sm">
            <span className="text-muted-foreground">Status:</span>{" "}
            <span className="text-foreground font-medium">
              {roadmap.currentState.status}
            </span>
          </div>
          <Link
            href="https://github.com/korallis/korproxy/milestones"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card px-4 py-2 text-sm flex items-center gap-2 hover:border-primary/50 transition-colors"
          >
            <span className="text-muted-foreground">GitHub Milestones</span>
            <ExternalLink size={14} className="text-primary" />
          </Link>
        </div>

        <div className="space-y-6 mb-12">
          {roadmap.phases.map((phase, index) => (
            <div key={phase.id} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-semibold text-foreground">
                      {phase.title}
                    </h3>
                    <StatusBadge status={phase.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Target: {phase.target}
                  </p>
                </div>
                <div className="text-3xl font-bold text-primary/20">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>

              <p className="text-muted-foreground mb-4">{phase.goal}</p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Features</h4>
                <ul className="grid gap-2">
                  {phase.features.map((feature) => (
                    <li
                      key={feature.spec}
                      className="flex items-start gap-2 text-sm"
                    >
                      {feature.completed ? (
                        <CheckCircle2
                          size={16}
                          className="text-green-400 mt-0.5 shrink-0"
                        />
                      ) : (
                        <Circle
                          size={16}
                          className="text-muted-foreground mt-0.5 shrink-0"
                        />
                      )}
                      <span
                        className={
                          feature.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }
                      >
                        {feature.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {phase.successCriteria.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    Success Criteria
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {phase.successCriteria.map((criteria, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {roadmap.metrics.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              Success Metrics
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Metric
                    </th>
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                      Target
                    </th>
                    <th className="text-left py-2 text-muted-foreground font-medium">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roadmap.metrics.map((metric, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 text-foreground">{metric.metric}</td>
                      <td className="py-2 pr-4 text-primary font-medium">
                        {metric.target}
                      </td>
                      <td className="py-2">
                        <span className="px-2 py-0.5 bg-muted rounded text-muted-foreground text-xs">
                          {metric.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

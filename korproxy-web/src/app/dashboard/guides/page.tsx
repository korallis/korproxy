import Link from "next/link";
import {
  Terminal,
  MousePointer,
  Code,
  Wind,
  FileCode,
  ArrowRight,
  Cpu,
  Bot,
} from "lucide-react";

const guides = [
  {
    href: "/dashboard/guides/models",
    name: "Supported Models",
    description: "View all AI models available through KorProxy across providers",
    icon: Cpu,
    featured: true,
  },
  {
    href: "/dashboard/guides/amp",
    name: "Amp CLI",
    description: "Configure Amp's command-line interface for AI-assisted development",
    icon: Terminal,
  },
  {
    href: "/dashboard/guides/droid",
    name: "Factory Droid",
    description: "Set up Factory's Droid CLI with KorProxy using BYOK configuration",
    icon: Bot,
  },
  {
    href: "/dashboard/guides/cursor",
    name: "Cursor",
    description: "Set up Cursor editor to use KorProxy for AI requests",
    icon: MousePointer,
  },
  {
    href: "/dashboard/guides/cline",
    name: "Cline",
    description: "Integrate KorProxy with the Cline VS Code extension",
    icon: Code,
  },
  {
    href: "/dashboard/guides/windsurf",
    name: "Windsurf",
    description: "Configure Windsurf IDE to route through KorProxy",
    icon: Wind,
  },
  {
    href: "/dashboard/guides/vscode",
    name: "VS Code",
    description: "Use KorProxy with VS Code's built-in AI features",
    icon: FileCode,
  },
  {
    href: "/dashboard/guides/continue",
    name: "Continue",
    description: "Configure the Continue extension for VS Code and JetBrains",
    icon: ArrowRight,
  },
];

export default function GuidesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Setup Guides</h1>
        <p className="text-muted-foreground">
          Learn how to configure your favorite AI coding tools to work with KorProxy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className={`group p-6 bg-card border rounded-lg hover:border-primary/50 hover:bg-card/80 transition-all ${
              'featured' in guide && guide.featured
                ? "border-primary/30 md:col-span-2"
                : "border-border"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg group-hover:bg-primary/20 transition-colors ${
                'featured' in guide && guide.featured
                  ? "bg-primary/20 text-primary"
                  : "bg-primary/10 text-primary"
              }`}>
                <guide.icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {guide.name}
                  </h3>
                  {'featured' in guide && guide.featured && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      Reference
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {guide.description}
                </p>
              </div>
              <ArrowRight
                size={20}
                className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

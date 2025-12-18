import { getChangelog } from "@/lib/content";
import { History, Calendar, Tag } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";

export const metadata = {
  title: "Changelog | KorProxy",
  description:
    "See what's new in KorProxy. Release notes, new features, improvements, and bug fixes.",
};

export default function ChangelogPage() {
  const entries = getChangelog();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <History size={28} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Changelog</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            New features, improvements, and updates to KorProxy
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <History
              size={48}
              className="mx-auto text-muted-foreground/50 mb-4"
            />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No releases yet
            </h2>
            <p className="text-muted-foreground">
              Check back soon for release notes and updates.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {entries.map((entry) => (
              <article key={entry.slug} className="glass-card p-6">
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-primary" />
                    <span className="text-xl font-bold text-foreground">
                      v{entry.frontmatter.title || entry.slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    {new Date(entry.frontmatter.date).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                </div>
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-h2:text-lg prose-h2:mt-0 prose-h3:text-base prose-ul:my-2">
                  <MDXRemote source={entry.content} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

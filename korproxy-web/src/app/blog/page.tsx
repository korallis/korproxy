import Link from "next/link";
import { getAllPosts } from "@/lib/content";
import { Calendar, Clock, User, ArrowRight, FileText } from "lucide-react";

export const metadata = {
  title: "Blog | KorProxy",
  description: "Updates, guides, and insights about KorProxy and AI coding tools",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <FileText size={28} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Blog</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Updates, guides, and insights about KorProxy and AI coding tools
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No posts yet</h2>
            <p className="text-muted-foreground">
              Check back soon for updates and articles.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group glass-card p-6 block hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {post.frontmatter.title}
                    </h2>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {post.frontmatter.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User size={14} />
                        {post.frontmatter.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {post.readingTime}
                      </span>
                    </div>
                  </div>
                  <ArrowRight
                    size={20}
                    className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1 shrink-0"
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

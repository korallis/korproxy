import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-500 rounded-md" />
            <span className="text-muted-foreground">
              © {new Date().getFullYear()} KorProxy. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

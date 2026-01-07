"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const requestReset = useMutation(api.passwordReset.requestReset);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await requestReset({ email });

      if (result.success) {
        setIsSuccess(true);
        // For testing - in production, remove this and send email instead
        if (result.token) {
          setResetToken(result.token);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 rounded-lg">
            {!isSuccess ? (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>

                <h1 className="text-2xl font-bold mb-2 text-foreground">Reset Password</h1>
                <p className="text-muted-foreground mb-8">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {error && (
                  <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2 text-foreground">Check Your Email</h1>
                <p className="text-muted-foreground mb-6">
                  If an account exists with <span className="text-foreground font-medium">{email}</span>,
                  you&apos;ll receive a password reset link shortly.
                </p>

                {/* For testing - show reset link directly */}
                {resetToken && (
                  <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/50">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Testing mode:</strong> Use this link to reset your password:
                    </p>
                    <Link
                      href={`/reset-password?token=${resetToken}`}
                      className="text-primary hover:text-primary/80 text-sm break-all"
                    >
                      Reset Password →
                    </Link>
                  </div>
                )}

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-40 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-60 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      </main>

      <Footer />
    </div>
  );
}

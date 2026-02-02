"use client";

import { useState } from "react";
import Link from "next/link";
import { env } from "@/lib/env";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      // Supabase Auth: signInWithOtp({ email }) when Supabase is configured
      if (!env.NEXT_PUBLIC_SUPABASE_URL) {
        setMessage("Sign-in is not configured yet. Use Create deck without an account for now.");
        return;
      }
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMessage("Check your email for the sign-in link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-deck-ink">Sign in</h1>
        <p className="mt-1 text-sm text-deck-muted">
          We’ll send you a magic link. Use Supabase Auth (email) when configured.
        </p>
        <form onSubmit={handleSubmit} className="mt-6">
          <label className="block text-sm font-medium text-deck-ink">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-deck-accent"
          />
          {message && (
            <p className="mt-3 text-sm text-deck-muted">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-deck-accent text-white py-3 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>
        </form>
        <Link href="/" className="mt-4 block text-center text-sm text-deck-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

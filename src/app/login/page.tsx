"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setState("sending");
    setErrorMsg("");

    const supabase = createSupabaseBrowser();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setState("error");
      setErrorMsg(error.message);
    } else {
      setState("sent");
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px]">
          {state === "sent" ? (
            <div className="text-center animate-[fadeInUp_0.4s_ease]">
              <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-3xl mx-auto mb-5">
                ✉️
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Check your email
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed mb-4">
                We sent a magic link to{" "}
                <span className="font-mono text-accent font-medium">
                  {email}
                </span>
              </p>
              <p className="text-xs text-text-muted">
                Click the link in the email to sign in. Check spam if you
                don&apos;t see it.
              </p>
              <button
                className="mt-6 font-mono text-xs text-text-muted hover:text-accent transition-colors cursor-pointer"
                onClick={() => {
                  setState("idle");
                  setEmail("");
                }}
              >
                Try a different email →
              </button>
            </div>
          ) : (
            <div className="animate-[fadeInUp_0.4s_ease]">
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Sign in to Melbo
              </h1>
              <p className="text-sm text-text-muted mb-8">
                We&apos;ll send you a magic link — no password needed.
              </p>

              <form onSubmit={handleLogin}>
                <div className="mb-4">
                  <label className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full font-mono text-sm font-medium text-text bg-surface border border-border rounded-xl py-3.5 px-4 outline-none transition-all focus:border-accent focus:shadow-[0_0_0_4px_var(--color-accent-glow)] placeholder:text-text-muted placeholder:opacity-50"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                {state === "error" && (
                  <p className="font-mono text-xs text-accent-deep mb-4 font-medium">
                    {errorMsg || "Something went wrong. Try again."}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full font-sans text-sm font-semibold py-3.5 px-6 bg-accent text-white rounded-xl cursor-pointer transition-all hover:bg-accent-deep hover:shadow-[0_4px_20px_rgba(232,115,74,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={state === "sending" || !email.includes("@")}
                >
                  {state === "sending" ? "Sending magic link..." : "Send magic link"}
                </button>
              </form>

              <p className="text-center text-xs text-text-muted mt-6">
                Don&apos;t have a Melbo yet?{" "}
                <a href="/" className="text-accent hover:underline">
                  Claim your username
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const supabase = createSupabaseBrowser();

      // With implicit flow, Supabase redirects with hash fragment:
      // /auth/callback#access_token=...&refresh_token=...&token_type=bearer
      // The Supabase client automatically detects and processes the hash.
      // We just need to check if a session was established.

      // Give the Supabase client a moment to process the hash fragment
      // The onAuthStateChange listener in createBrowserClient handles this
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/edit");
        return;
      }

      // If no session yet, the hash might still be processing.
      // Listen for auth state change with a timeout.
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session) {
            subscription.unsubscribe();
            router.replace("/edit");
          }
        }
      );

      // Timeout after 8 seconds
      setTimeout(() => {
        subscription.unsubscribe();
        // One final check
        supabase.auth.getSession().then(({ data: { session: finalSession } }) => {
          if (finalSession) {
            router.replace("/edit");
          } else {
            setStatus("error");
            setErrorMsg(
              error?.message ||
                "Could not complete sign-in. Please try again from the login page."
            );
          }
        });
      }, 8000);
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <nav className="px-6 py-4 flex justify-between items-center border-b border-border">
        <a href="/" className="text-lg font-bold tracking-tight text-text">
          melbo<span className="text-accent">.</span>
        </a>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[400px] text-center">
          {status === "processing" ? (
            <div className="animate-[fadeInUp_0.4s_ease]">
              <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-3xl mx-auto mb-5">
                🔐
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Signing you in...
              </h1>
              <p className="text-sm text-text-muted">
                Verifying your email. This will only take a moment.
              </p>
              <div className="mt-6 flex justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <div className="animate-[fadeInUp_0.4s_ease]">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-3xl mx-auto mb-5">
                ⚠️
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-text-muted mb-4">{errorMsg}</p>
              <a
                href="/login"
                className="inline-block font-sans text-sm font-semibold py-3 px-6 bg-accent text-white rounded-xl transition-all hover:bg-accent-deep"
              >
                Back to login
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/auth/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function completeOAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const oauthError = params.get("error");
      const errorDescription = params.get("error_description");

      if (oauthError) {
        if (!cancelled) setError(errorDescription ?? oauthError);
        return;
      }

      if (!code) {
        await navigate({ to: "/login" });
        return;
      }

      try {
        const supabase = await getSupabaseBrowserClient();
        if (!supabase) throw new Error("Authentication is not configured");

        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw new Error(exchangeError.message);

        if (!cancelled) {
          await navigate({ to: "/" });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not complete Google sign-in.");
        }
      }
    }

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="paper w-full max-w-md rounded-[1.75rem] p-8 text-center shadow-border">
          <h1 className="font-display text-2xl text-foreground">Sign-in could not be completed</h1>
          <p className="mt-3 text-sm text-muted">{error}</p>
          <button
            type="button"
            className="mt-6 underline underline-offset-4"
            onClick={() => void navigate({ to: "/login" })}
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <p className="text-sm text-muted">Finishing your sign-in…</p>
    </main>
  );
}

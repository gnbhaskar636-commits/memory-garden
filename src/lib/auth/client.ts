import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./public-config";

/**
 * Supabase client for this React SPA (browser-side).
 *
 * OAuth uses an explicit PKCE callback route. We deliberately disable
 * automatic URL detection here so the OAuth code is exchanged exactly once
 * by `/auth/callback`, rather than once by the browser client and once by a
 * server-side callback.
 */
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  clientPromise ??= getSupabasePublicConfig().then((config) =>
    config
      ? createBrowserClient(config.url, config.anonKey, {
          auth: {
            detectSessionInUrl: false,
          },
        })
      : null,
  );
  return clientPromise;
}

export const authEnabled = true;

function getOAuthCallbackUrl(): string {
  // Production must never fall back to the Vite dev origin. Local development
  // still uses the local origin so developers can run the same callback route.
  if (typeof window !== "undefined" && window.location.hostname === "memory-garden-theta.vercel.app") {
    return "https://memory-garden-theta.vercel.app/auth/callback";
  }
  if (typeof window !== "undefined" && window.location.hostname.endsWith(".vercel.app")) {
    return `${window.location.origin}/auth/callback`;
  }
  return typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : "https://memory-garden-theta.vercel.app/auth/callback";
}

export async function signUpEmail(email: string, password: string, name: string): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-up is not configured");
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
}

export async function signInEmail(email: string, password: string): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-in is not configured");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

/** Redirects to Google's consent screen via Supabase's built-in Google provider. */
export async function signInGoogle(): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-in is not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthCallbackUrl(),
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOut(redirectTo = "/"): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  }
  window.location.href = redirectTo;
}

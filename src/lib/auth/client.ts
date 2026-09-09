import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./public-config";

/**
 * Supabase client for this React SPA (browser-side).
 *
 * Talks straight to Supabase's hosted Auth (no same-origin `/api/auth/*`
 * anymore — that only existed because the old setup ran its own auth
 * server). Config is fetched once from `getSupabasePublicConfig()` and the
 * resulting client is memoized for the life of the tab; `null` means
 * Supabase isn't configured (no `SUPABASE_URL/SUPABASE_ANON_KEY`).
 */
let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  clientPromise ??= getSupabasePublicConfig().then((config) =>
    config ? createBrowserClient(config.url, config.anonKey) : null,
  );
  return clientPromise;
}

/** True when this app offers sign-in UI at all (as opposed to being a no-auth app). */
export const authEnabled = true;

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
export async function signInGoogle(callbackURL = "/"): Promise<void> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) throw new Error("Sign-in is not configured");
  const redirectTo = new URL(callbackURL, window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
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

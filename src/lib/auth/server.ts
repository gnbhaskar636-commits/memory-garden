/**
 * Supabase server-side auth config (server-only).
 *
 * Supabase Auth is the real authentication provider. The server client uses
 * the project's public client key (legacy anon key or the newer publishable
 * key) and the visitor's request cookies. The service-role key remains
 * server-only and is never exposed to the browser.
 */
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { loadServerEnv } from "@/lib/env.server";

loadServerEnv();

const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

function requiredEnv(key: string): string {
  const value = env(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const supabaseClientKey = (): string | undefined =>
  env("SUPABASE_ANON_KEY") ?? env("SUPABASE_PUBLISHABLE_KEY");

export const authConfigured = Boolean(env("SUPABASE_URL") && supabaseClientKey());

export function createSupabaseServerClient() {
  const url = requiredEnv("SUPABASE_URL");
  const key = supabaseClientKey();
  if (!key) {
    throw new Error(
      "Missing required environment variable: SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        const cookies = getCookies();
        return Object.entries(cookies).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          setCookie(name, value, options as CookieOptions);
        }
      },
    },
  });
}

/** Exchange the OAuth authorization code exactly once on the server callback. */
export async function exchangeOAuthCode(code: string): Promise<void> {
  if (!authConfigured) throw new Error("Authentication is not configured");
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw new Error(error.message);
}

export function createSupabaseAdminClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

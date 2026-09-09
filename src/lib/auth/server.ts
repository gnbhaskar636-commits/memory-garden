/**
 * Supabase server-side auth config (server-only).
 *
 * Auth is now Supabase's hosted Auth service, not something this app hosts
 * itself. There are two server clients:
 *   - `createSupabaseServerClient()` — request-scoped, reads/writes the
 *     visitor's own session cookies. Use this to resolve "who is signed
 *     in?" (see `verify.server.ts`).
 *   - `createSupabaseAdminClient()` — uses `SUPABASE_SERVICE_ROLE_KEY`,
 *     bypasses Row Level Security. Not used by any request path today; it
 *     exists for future admin/background jobs that must act across users.
 *     NEVER send this client's key to the browser.
 *
 * NEVER import this from client code. The client uses `@/lib/auth/client`;
 * components read the user via `@/lib/auth/use-current-user`; server
 * functions get a verified id via `@/lib/auth/middleware`.
 */
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { loadServerEnv } from "@/lib/env.server";

loadServerEnv();

/** Read an env var, treating empty/whitespace as unset. */
const env = (key: string): string | undefined => {
  const value = process.env[key]?.trim();
  return value ? value : undefined;
};

function requiredEnv(key: string): string {
  const value = env(key);
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

/** True when Supabase Auth is reachable (a project's URL + anon key are set). */
export const authConfigured = Boolean(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY"));

/**
 * Request-scoped Supabase client that reads the visitor's session from
 * cookies and can refresh/rewrite them on the response — the standard
 * `@supabase/ssr` pattern for a server framework. Cookie plumbing goes
 * through TanStack Start's own request/response helpers, same as this app's
 * previous Better Auth cookie bridge.
 */
export function createSupabaseServerClient() {
  return createServerClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_ANON_KEY"), {
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

/**
 * Privileged client using `SUPABASE_SERVICE_ROLE_KEY` — bypasses Row Level
 * Security entirely. No request path uses this today; kept as the single,
 * documented place to reach for one later instead of ad-hoc service-role
 * usage scattered through the codebase.
 */
export function createSupabaseAdminClient() {
  return createClient(requiredEnv("SUPABASE_URL"), requiredEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

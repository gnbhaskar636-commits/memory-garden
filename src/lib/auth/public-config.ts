/**
 * Public Supabase config, handed to the browser over a server function.
 *
 * `SUPABASE_URL` and `SUPABASE_ANON_KEY` are safe to ship to the browser —
 * that's how every Supabase client-side quick-start works, protected by Row
 * Level Security rather than secrecy. Routing them through a server
 * function (instead of a `VITE_`-prefixed env var) means this file can live
 * anywhere in the import graph without a bundler config change, and
 * `SUPABASE_SERVICE_ROLE_KEY` (server-only, see `./server.ts`) is never at
 * risk of being swept up by a broad env-prefix rule.
 */
import { createServerFn } from "@tanstack/react-start";
import { authConfigured } from "./server";

export type SupabasePublicConfig = { url: string; anonKey: string };

export const getSupabasePublicConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupabasePublicConfig | null> => {
    if (!authConfigured) return null;
    return {
      url: process.env.SUPABASE_URL!.trim(),
      anonKey: process.env.SUPABASE_ANON_KEY!.trim(),
    };
  },
);

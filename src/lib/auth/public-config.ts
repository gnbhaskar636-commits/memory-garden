/**
 * Public Supabase config, handed to the browser over a server function.
 *
 * The browser may safely receive the Supabase project URL plus its public
 * client key. Support both the legacy anon key and the current publishable
 * key so Vercel/Supabase projects using either naming convention work.
 * The service-role key is never returned here.
 */
import { createServerFn } from "@tanstack/react-start";
import { authConfigured } from "./server";

export type SupabasePublicConfig = { url: string; anonKey: string };

export const getSupabasePublicConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<SupabasePublicConfig | null> => {
    if (!authConfigured) return null;

    const url = process.env.SUPABASE_URL?.trim();
    const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim();
    const clientKey = anonKey || publishableKey;

    if (!url || !clientKey) return null;

    return { url, anonKey: clientKey };
  },
);

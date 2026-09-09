import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./client";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

/**
 * Stable fallback user, used ONLY when Supabase isn't configured (no
 * `SUPABASE_URL`/`SUPABASE_ANON_KEY`). Its id matches `DEV_USER_ID` in
 * `verify.server.ts` — see the comment there about the `auth.users` foreign
 * key this id does NOT satisfy on a real Supabase database.
 */
export const DEV_USER: AppUser = {
  id: "00000000-0000-0000-0000-000000000000",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

/** `useCurrentUserState()` result: the user plus the session-loading flag. */
export type CurrentUserState = {
  /** The user — `null` BOTH while the session loads and when signed out. */
  user: AppUser | null;
  /** True while the session is still resolving — don't treat `user: null` as signed out yet. */
  isPending: boolean;
};

function toAppUser(user: User | null | undefined): AppUser | null {
  if (!user) return null;
  const name = typeof user.user_metadata?.name === "string" ? user.user_metadata.name : null;
  const avatar =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  return {
    id: user.id,
    displayName: name,
    primaryEmail: user.email ?? null,
    profileImageUrl: avatar,
    isDevFallback: false,
  };
}

/**
 * Current user + loading state.
 *   - Supabase configured -> the real signed-in user; `user` is `null` while
 *     the session resolves (`isPending: true`) and when signed out
 *     (`isPending: false`). Backed by `supabase.auth.getSession()` +
 *     `onAuthStateChange` (same-origin cookies via `@supabase/ssr`).
 *   - Not configured -> `DEV_USER`, never pending, once resolved.
 *
 * Protect a route by waiting out `isPending` before acting on `user` —
 * redirecting on `user: null` alone bounces signed-in visitors to sign-in on
 * every hard reload:
 *
 *   import { RedirectToSignIn } from "@/lib/auth/gates";
 *   const { user, isPending } = useCurrentUserState();
 *   if (isPending) return null;              // still resolving — don't redirect yet
 *   if (!user) return <RedirectToSignIn />;  // definitely signed out
 */
export function useCurrentUserState(): CurrentUserState {
  const [state, setState] = useState<CurrentUserState>({ user: null, isPending: true });

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void getSupabaseBrowserClient().then((supabase) => {
      if (cancelled) return;
      if (!supabase) {
        setState({ user: DEV_USER, isPending: false });
        return;
      }
      void supabase.auth.getSession().then(({ data }) => {
        if (!cancelled) setState({ user: toAppUser(data.session?.user), isPending: false });
      });
      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setState({ user: toAppUser(session?.user), isPending: false });
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}

/**
 * Convenience view of `useCurrentUserState().user` for display (e.g.
 * `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
 * for redirects/guards use `useCurrentUserState()` and check `isPending`.
 */
export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}

import type { ReactNode } from "react";

/**
 * App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
 *
 *   <AuthProvider><Outlet /></AuthProvider>
 *
 * The Supabase browser client (`@/lib/auth/client`) needs NO context
 * provider — `useCurrentUserState()` manages its own subscription — so this
 * is a passthrough today. It's kept as the single, stable mount point for
 * any future client-side providers (e.g. a toast or theme provider) without
 * churning the root shell.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

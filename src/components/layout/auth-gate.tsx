import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { GardenProvider } from "@/components/layout/garden-provider";
import { RedirectToSignIn, SIGN_IN_PATH } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/**
 * Mounted once in `__root.tsx`, wrapping every route.
 *
 * `/login` renders standalone (no header, no `GardenProvider` — it doesn't
 * need the garden's data at all, so it shouldn't call `hydrate()`).
 * Every other route waits out the session, then either bounces to `/login`
 * or mounts `GardenProvider` (which hydrates memories/settings — see
 * `garden-provider.tsx`) inside the app chrome. `GardenProvider` living
 * *inside* this gate, rather than always-on in `__root.tsx`, is what stops
 * `hydrate()` firing before we know there's a session to hydrate for.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { user, isPending } = useCurrentUserState();

  if (pathname === SIGN_IN_PATH) return <>{children}</>;

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <p className="font-hand text-xl text-muted">Nurturing your garden…</p>
      </div>
    );
  }

  if (!user) return <RedirectToSignIn />;

  return (
    <GardenProvider>
      <AppShell>{children}</AppShell>
    </GardenProvider>
  );
}

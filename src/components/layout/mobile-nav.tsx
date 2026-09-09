import { Link, useRouterState } from "@tanstack/react-router";
import { Flower2, Globe2, MessageCircle, Settings, Sparkles, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "Garden", icon: Sprout, exact: true },
  { to: "/world", label: "World", icon: Globe2, exact: false },
  { to: "/memories", label: "Memories", icon: Flower2, exact: false },
  { to: "/chat", label: "Talk", icon: MessageCircle, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                  active && "text-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "text-primary")} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

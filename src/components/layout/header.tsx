import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Moon, Search, Sun } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/layout/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMemoryStore } from "@/lib/memories/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Garden", exact: true },
  { to: "/world", label: "World", exact: false },
  { to: "/memories", label: "Memories", exact: false },
  { to: "/reflection", label: "Reflect", exact: false },
  { to: "/chat", label: "Talk", exact: false },
  { to: "/settings", label: "Settings", exact: false },
] as const;

export function Header() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const displayName = useMemoryStore((state) => state.settings.displayName);
  const theme = useMemoryStore((state) => state.settings.theme);
  const updateSettings = useMemoryStore((state) => state.updateSettings);
  const [query, setQuery] = useState("");

  const initial = displayName.trim().charAt(0).toUpperCase() || "A";
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    void navigate({ to: "/memories", search: { q: query.trim() || undefined } });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm text-muted transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                  active && "bg-primary/20 text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form onSubmit={onSearch} className="ml-auto hidden min-w-0 max-w-xs flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Search memories</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the garden"
              className="h-10 pl-9"
            />
          </label>
        </form>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden"
          aria-label="Search memories"
          onClick={() => navigate({ to: "/memories" })}
        >
          <Search className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isDark ? "Switch to a sunlit garden" : "Switch to an evening garden"}
          onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Link
          to="/settings"
          aria-label="Open settings"
          className="rounded-full focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
        >
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}

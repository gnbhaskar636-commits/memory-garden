import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
        className,
      )}
    >
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/30 text-moss">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
          <path d="M16 28 C16 20 16 14 16 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16 16 C9 14 7 8 11 5 C13 10 14.5 13 16 16 Z" fill="#91A889" />
          <path d="M16 15 C23 12 26 7 22 4 C20 9 18 12 16 15 Z" fill="#E7A77E" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg text-foreground">Memory Garden</span>
        <span className="hidden font-hand text-sm text-muted sm:block">plant a moment</span>
      </span>
    </Link>
  );
}

import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-accent" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.75} />
      </span>
      <h1 className="font-display text-2xl text-foreground">This path grew wild</h1>
      <p className="max-w-md text-sm break-words text-muted">
        {error.message || "Something unexpected happened in the garden."}
      </p>
    </main>
  );
}

import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { MoodTag } from "@/components/memory/mood-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  composeReflection,
  computeMonthStats,
  trendLabel,
} from "@/lib/memories/reflection";
import type { Memory } from "@/lib/memories/types";
import { cn } from "@/lib/utils";

export function MonthlyCard({
  memories,
  year,
  monthIndex,
}: {
  memories: Memory[];
  year: number;
  monthIndex: number;
}) {
  const stats = computeMonthStats(memories);
  const reflection = composeReflection(memories, year, monthIndex);
  const label = format(new Date(year, monthIndex, 1), "MMMM yyyy");

  return (
    <Card>
      <CardContent className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="font-hand text-lg text-accent">a quiet looking-back</p>
          <h2 className="font-display text-2xl">{label}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{reflection}</p>
          <dl className="mt-5 flex flex-wrap gap-4 text-sm">
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Moments</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">{stats.count}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Mood</dt>
              <dd className="mt-1">
                {stats.dominantMood ? <MoodTag mood={stats.dominantMood} /> : "Still forming"}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Trend</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    stats.trend === "improving" && "bg-primary/25",
                    stats.trend === "stable" && "bg-muted/60",
                    stats.trend === "challenging" && "bg-lavender/50",
                    stats.trend === "mixed" && "bg-accent/30",
                  )}
                >
                  {trendLabel(stats.trend)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">Places</dt>
              <dd className="mt-1 text-foreground">
                {stats.favoritePlaces.length ? stats.favoritePlaces.join(" · ") : "Close to home"}
              </dd>
            </div>
          </dl>
        </div>
        <Button asChild variant="secondary">
          <Link to="/reflection">Open the month</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

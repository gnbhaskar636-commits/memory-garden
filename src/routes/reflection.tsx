import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { TimeMachineCard } from "@/components/memory/time-machine-card";
import { EmptyGarden } from "@/components/garden/empty-garden";
import { MemoryCard } from "@/components/memory/memory-card";
import { MoodTag } from "@/components/memory/mood-tag";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  availableMonths,
  composeGardenInsight,
  composeReflection,
  computeMonthStats,
  memoriesInMonth,
  trendLabel,
} from "@/lib/memories/reflection";
import { useMemoryStore } from "@/lib/memories/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reflection")({
  component: ReflectionPage,
});

function ReflectionPage() {
  const memories = useMemoryStore((state) => state.memories);
  const hydrated = useMemoryStore((state) => state.hydrated);
  const months = useMemo(() => availableMonths(memories), [memories]);
  const [selected, setSelected] = useState(
    () => months[0] ?? { year: new Date().getFullYear(), monthIndex: new Date().getMonth() },
  );

  const monthMemories = memoriesInMonth(memories, selected.year, selected.monthIndex);
  const stats = useMemo(() => computeMonthStats(monthMemories), [monthMemories]);
  const reflection = composeReflection(monthMemories, selected.year, selected.monthIndex);
  const insight = composeGardenInsight(monthMemories, selected.year, selected.monthIndex);
  const favorites = monthMemories.filter((memory) => memory.favorite);
  const monthLabel = format(new Date(selected.year, selected.monthIndex, 1), "MMMM yyyy");

  if (!hydrated) {
    return <p className="font-hand text-xl text-muted">Nurturing your garden…</p>;
  }

  return (
    <div className="grid gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-hand text-lg text-accent">the month, gathered</p>
          <h1 className="font-display text-4xl">Monthly reflection</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            A quiet looking-back: how many moments, the weather of feeling, the themes that kept returning, and what the garden noticed.
          </p>
        </div>
        <label className="grid gap-1.5 text-sm">
          Month
          <select
            className="h-11 rounded-xl border border-border bg-surface px-3 shadow-border focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            value={`${selected.year}-${selected.monthIndex}`}
            onChange={(event) => {
              const [year, monthIndex] = event.target.value.split("-").map(Number);
              setSelected({ year, monthIndex });
            }}
          >
            {months.map((month) => (
              <option key={`${month.year}-${month.monthIndex}`} value={`${month.year}-${month.monthIndex}`}>
                {format(new Date(month.year, month.monthIndex, 1), "MMMM yyyy")}
              </option>
            ))}
          </select>
        </label>
      </header>

      <TimeMachineCard />

      {memories.length === 0 ? (
        <EmptyGarden
          title="There is nothing to reflect on yet."
          prompt="Plant a moment, then return when the month has a shape."
        />
      ) : (
        <>
          {/* Summary card */}
          <Card>
            <CardContent className="grid gap-6">
              <div>
                <p className="font-hand text-lg text-accent">🌿 Your monthly reflection</p>
                <h2 className="font-display text-2xl">{monthLabel}</h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed">{reflection}</p>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Memories" value={String(stats.count)} />
                <div>
                  <dt className="text-xs tracking-wide text-muted uppercase">Dominant mood</dt>
                  <dd className="mt-2">
                    {stats.dominantMood ? <MoodTag mood={stats.dominantMood} /> : "Still forming"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-wide text-muted uppercase">Dominant emotion</dt>
                  <dd className="mt-2 font-medium">
                    {stats.dominantEmotion ?? "Still forming"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-wide text-muted uppercase">Emotional trend</dt>
                  <dd className="mt-2">
                    <TrendBadge trend={stats.trend} />
                  </dd>
                </div>
              </dl>

              {/* Themes + balance */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Common themes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stats.commonThemes.length > 0 ? (
                      stats.commonThemes.map((theme) => (
                        <Badge key={theme} variant="muted" className="capitalize">
                          {theme}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted">Themes will appear after analysis</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Emotional balance</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    <span className="text-foreground">
                      <span className="font-display text-lg tabular-nums">{stats.positiveCount}</span>{" "}
                      positive
                    </span>
                    <span className="text-muted">·</span>
                    <span className="text-foreground">
                      <span className="font-display text-lg tabular-nums">{stats.difficultCount}</span>{" "}
                      difficult
                    </span>
                    {stats.neutralCount > 0 ? (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-foreground">
                          <span className="font-display text-lg tabular-nums">{stats.neutralCount}</span>{" "}
                          neutral
                        </span>
                      </>
                    ) : null}
                  </div>
                  {stats.averageIntensity != null ? (
                    <p className="mt-1 text-xs text-muted">
                      Avg intensity {stats.averageIntensity}/10
                    </p>
                  ) : null}
                </div>
              </div>

              {stats.favoritePlaces.length > 0 ? (
                <div>
                  <p className="text-xs tracking-wide text-muted uppercase">Places you returned to</p>
                  <p className="mt-1 text-sm">{stats.favoritePlaces.join(" · ")}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Garden Insight */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="grid gap-3">
              <p className="font-hand text-lg text-accent">🤖 Garden insight</p>
              <p className="max-w-2xl text-base leading-relaxed">{insight}</p>
            </CardContent>
          </Card>

          {favorites.length > 0 ? (
            <section className="grid gap-4">
              <h2 className="font-display text-2xl">Held close</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-4">
            <h2 className="font-display text-2xl">Everything this month</h2>
            {monthMemories.length === 0 ? (
              <p className="text-sm text-muted">This month is still an open bed.</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {monthMemories.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-display text-3xl tabular-nums">{value}</dd>
    </div>
  );
}

function TrendBadge({ trend }: { trend: ReturnType<typeof computeMonthStats>["trend"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium",
        trend === "improving" && "bg-primary/25 text-foreground",
        trend === "stable" && "bg-muted/60 text-foreground",
        trend === "challenging" && "bg-lavender/50 text-foreground",
        trend === "mixed" && "bg-accent/30 text-foreground",
      )}
    >
      {trend === "improving" ? "📈 " : trend === "challenging" ? "📉 " : trend === "mixed" ? "〰️ " : "➡️ "}
      {trendLabel(trend)}
    </span>
  );
}

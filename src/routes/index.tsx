import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, Plus } from "lucide-react";
import { GardenView } from "@/components/garden-3d/garden-view";
import { MemoryCard } from "@/components/memory/memory-card";
import { TimeMachineCard } from "@/components/memory/time-machine-card";
import { MonthlyCard } from "@/components/reflection/monthly-card";
import { Button } from "@/components/ui/button";
import { availableMonths, memoriesInMonth } from "@/lib/memories/reflection";
import { pickWanderMemory, useMemoryStore } from "@/lib/memories/store";
import { useGardenUi } from "@/lib/memories/ui";
import { greetingWord } from "@/lib/motion";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hydrated = useMemoryStore((state) => state.hydrated);
  const memories = useMemoryStore((state) => state.memories);
  const displayName = useMemoryStore((state) => state.settings.displayName);
  const openPlant = useGardenUi((state) => state.openPlant);
  const openWander = useGardenUi((state) => state.openWander);

  const now = new Date();
  const months = availableMonths(memories);
  const focus = months[0] ?? { year: now.getFullYear(), monthIndex: now.getMonth() };
  const monthMemories = memoriesInMonth(memories, focus.year, focus.monthIndex);
  const recent = [...memories].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  function wander() {
    const next = pickWanderMemory();
    if (!next) {
      toast("The garden is still quiet");
      return;
    }
    openWander(next.id);
  }

  if (!hydrated) {
    return <LoadingGarden />;
  }

  return (
    <div className="grid gap-10">
      <section className="anim-fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="font-hand text-xl text-accent">welcome back</p>
          <h1 className="mt-1 font-display text-4xl text-foreground sm:text-5xl">
            {greetingWord()}, {displayName || "gardener"}
          </h1>
          <p className="mt-3 text-muted">What small thing would you like to keep?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" onClick={() => openPlant()}>
            <Plus className="size-4" />
            Plant a moment
          </Button>
          <Button size="lg" variant="secondary" onClick={wander}>
            <Compass className="size-4" />
            Wander through your memories
          </Button>
        </div>
      </section>

      <GardenView memories={memories} />

      <div className="flex justify-center">
        <Button asChild variant="secondary" className="rounded-full">
          <Link to="/world">Enter 3D Memory World</Link>
        </Button>
      </div>

      <TimeMachineCard />

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-hand text-lg text-accent">lately</p>
            <h2 className="font-display text-2xl">Recent moments</h2>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">Nothing planted yet. The soil is ready.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((memory) => (
              <MemoryCard key={memory.id} memory={memory} />
            ))}
          </div>
        )}
      </section>

      <MonthlyCard
        memories={monthMemories}
        year={focus.year}
        monthIndex={focus.monthIndex}
      />
    </div>
  );
}

function LoadingGarden() {
  return (
    <div className="grid gap-6" aria-live="polite">
      <p className="font-hand text-xl text-muted">Nurturing your garden…</p>
      <div className="h-80 rounded-[2rem] bg-primary/15" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-48 rounded-[1.75rem] bg-surface shadow-border" />
        <div className="h-48 rounded-[1.75rem] bg-surface shadow-border" />
        <div className="h-48 rounded-[1.75rem] bg-surface shadow-border" />
      </div>
    </div>
  );
}

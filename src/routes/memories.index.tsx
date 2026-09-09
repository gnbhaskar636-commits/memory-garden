import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { EmptyGarden } from "@/components/garden/empty-garden";
import { MemoryCard } from "@/components/memory/memory-card";
import { MoodTag } from "@/components/memory/mood-tag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMemoryStore } from "@/lib/memories/store";
import { MOODS, type Memory, type Mood } from "@/lib/memories/types";
import { cn } from "@/lib/utils";

type MemoriesSearch = {
  q?: string;
  mood?: Mood;
  favorite?: boolean;
  location?: string;
  from?: string;
  to?: string;
};

export const Route = createFileRoute("/memories/")({
  validateSearch: (search: Record<string, unknown>): MemoriesSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    mood: isMood(search.mood) ? search.mood : undefined,
    favorite: search.favorite === true || search.favorite === "1" || search.favorite === "true",
    location: typeof search.location === "string" ? search.location : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
  }),
  component: MemoriesPage,
});

function isMood(value: unknown): value is Mood {
  return typeof value === "string" && (MOODS as readonly string[]).includes(value);
}

function MemoriesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/memories/" });
  const memories = useMemoryStore((state) => state.memories);
  const hydrated = useMemoryStore((state) => state.hydrated);
  const hideLocations = useMemoryStore((state) => state.settings.hideLocations);

  const locations = [...new Set(memories.map((memory) => memory.location).filter(Boolean))].sort();

  const filtered = memories
    .filter((memory) => {
      const haystack = `${memory.title} ${memory.description} ${memory.location} ${memory.mood}`.toLowerCase();
      if (search.q && !haystack.includes(search.q.toLowerCase())) return false;
      if (search.mood && memory.mood !== search.mood) return false;
      if (search.favorite && !memory.favorite) return false;
      if (search.location && memory.location !== search.location) return false;
      if (search.from && memory.date < search.from) return false;
      if (search.to && memory.date > search.to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const groups = groupByMonth(filtered);

  function patch(next: Partial<MemoriesSearch>) {
    void navigate({
      search: (prev) => {
        const merged = { ...prev, ...next };
        return Object.fromEntries(
          Object.entries(merged).filter(([, value]) => value !== undefined && value !== "" && value !== false),
        ) as MemoriesSearch;
      },
    });
  }

  if (!hydrated) {
    return <p className="font-hand text-xl text-muted">Nurturing your garden…</p>;
  }

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-hand text-lg text-accent">a longer looking</p>
        <h1 className="font-display text-4xl">All memories</h1>
        <p className="mt-2 text-sm text-muted">Search, filter, and wander the timeline at your own pace.</p>
      </header>

      <section className="paper grid gap-4 rounded-[1.75rem] p-4 shadow-border sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1.5 lg:col-span-2">
            <Label htmlFor="filter-q">Search</Label>
            <Input
              id="filter-q"
              value={search.q ?? ""}
              placeholder="A word, a place, a feeling"
              onChange={(event) => patch({ q: event.target.value || undefined })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-from">From</Label>
            <Input
              id="filter-from"
              type="date"
              value={search.from ?? ""}
              onChange={(event) => patch({ from: event.target.value || undefined })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="filter-to">Until</Label>
            <Input
              id="filter-to"
              type="date"
              value={search.to ?? ""}
              onChange={(event) => patch({ to: event.target.value || undefined })}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => patch({ mood: undefined })}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              !search.mood ? "bg-moss text-cream" : "bg-background text-muted shadow-border",
            )}
          >
            Every mood
          </button>
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              onClick={() => patch({ mood: search.mood === mood ? undefined : mood })}
              className={cn(
                "rounded-full focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                search.mood === mood && "ring-2 ring-moss/40 ring-offset-2 ring-offset-surface",
              )}
            >
              <MoodTag mood={mood} />
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={Boolean(search.favorite)}
              onCheckedChange={(checked) => patch({ favorite: checked || undefined })}
            />
            Favorites only
          </label>
          {!hideLocations && locations.length > 0 ? (
            <label className="flex items-center gap-2 text-sm">
              Place
              <select
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm shadow-border focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                value={search.location ?? ""}
                onChange={(event) => patch({ location: event.target.value || undefined })}
              >
                <option value="">Anywhere</option>
                {locations.map((place) => (
                  <option key={place} value={place}>
                    {place}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>
            Clear filters
          </Button>
        </div>
      </section>

      {memories.length === 0 ? (
        <EmptyGarden />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">Nothing in the garden matches that looking. Try a softer filter.</p>
      ) : (
        <div className="grid gap-10">
          {groups.map((group) => (
            <section key={group.label} className="grid gap-4">
              <h2 className="font-display text-2xl">{group.label}</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((memory) => (
                  <MemoryCard key={memory.id} memory={memory} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByMonth(memories: Memory[]) {
  const map = new Map<string, Memory[]>();
  for (const memory of memories) {
    const label = format(parseISO(memory.date), "MMMM yyyy");
    const list = map.get(label) ?? [];
    list.push(memory);
    map.set(label, list);
  }
  return [...map.entries()].map(([label, items]) => ({ label, items }));
}

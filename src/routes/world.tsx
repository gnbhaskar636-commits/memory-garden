import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { MemoryWorld } from "@/components/memory-world";
import { Button } from "@/components/ui/button";
import { useMemoryStore } from "@/lib/memories/store";
import type { Memory } from "@/lib/memories/types";
import type { MemoryWorldMemory } from "@/lib/world/world-types";

export const Route = createFileRoute("/world")({
  component: WorldPage,
});

/**
 * Walkable 3D Memory World — same Zustand memories as the rest of the app.
 * Click a plant → existing /memories/$id detail (no duplicate detail system).
 */
function WorldPage() {
  const navigate = useNavigate();
  const memories = useMemoryStore((s) => s.memories);
  const reducedMotion = useMemoryStore((s) => s.settings.reducedMotion);
  const hydrated = useMemoryStore((s) => s.hydrated);
  const [entered, setEntered] = useState(false);

  const worldMemories: MemoryWorldMemory[] = memories.map(toWorldMemory);

  const onSelect = useCallback(
    (m: MemoryWorldMemory) => {
      void navigate({ to: "/memories/$id", params: { id: m.id } });
    },
    [navigate],
  );

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted">
        Growing your garden…
      </div>
    );
  }

  if (!entered) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-hand text-2xl text-accent">Memory World</p>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">
          Your memories have grown into a place.
        </h1>
        <p className="text-muted">
          Walk through Home Garden, Happy Meadow, Growth Forest, and Reflection Lake. Every plant is
          a moment you kept.
        </p>
        <Button type="button" size="lg" className="mt-2 rounded-full px-8" onClick={() => setEntered(true)}>
          Enter my world
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="text-muted"
          onClick={() => void navigate({ to: "/" })}
        >
          Back to 2D garden
        </Button>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mb-8 sm:-mx-6 lg:-mx-8" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <MemoryWorld
        memories={worldMemories}
        onMemorySelect={onSelect}
        reducedMotion={reducedMotion}
        className="min-h-[calc(100vh-5rem)]"
      />
    </div>
  );
}

/** Memory (app) → MemoryWorldMemory (world API). Same ids; parent remains source of truth. */
function toWorldMemory(m: Memory): MemoryWorldMemory {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    date: m.date,
    mood: m.mood,
    primaryEmotion: m.primaryEmotion ?? undefined,
    secondaryEmotion: m.secondaryEmotion ?? undefined,
    sentiment: m.sentiment ?? undefined,
    emotionIntensity: m.emotionIntensity ?? undefined,
    tags: m.tags,
    favorite: m.favorite,
    markerKind: m.markerKind,
    photo: m.photo,
    worldPosition: m.worldPosition,
  };
}

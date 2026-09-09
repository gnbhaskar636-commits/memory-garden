import { useEffect, useRef, useState } from "react";
import type { MemoryWorldMemory } from "@/lib/world/world-types";

/**
 * Snapshot IDs once (StrictMode-safe via module-level first-run guard per component instance).
 * IDs present in the initial snapshot never grow.
 * Only IDs that appear later are marked new until completeGrowth is called.
 */
export function useNewMemoryIds(memories: MemoryWorldMemory[]): {
  newIds: Set<string>;
  completeGrowth: (id: string) => void;
} {
  const baseline = useRef<Set<string> | null>(null);
  const bootstrapped = useRef(false);
  const [newIds, setNewIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    // First commit: establish baseline from current props. Never mark these as new.
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      baseline.current = new Set(memories.map((m) => m.id));
      return;
    }
    const known = baseline.current!;
    const added: string[] = [];
    for (const m of memories) {
      if (!known.has(m.id)) {
        added.push(m.id);
        known.add(m.id);
      }
    }
    // Removed IDs stay in known so re-adding the same id later won't re-grow
    // (intentional: same id = same memory). Brand-new ids always grow.
    if (added.length === 0) return;
    setNewIds((prev) => {
      const next = new Set(prev);
      for (const id of added) next.add(id);
      return next;
    });
  }, [memories]);

  function completeGrowth(id: string) {
    setNewIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return { newIds, completeGrowth };
}

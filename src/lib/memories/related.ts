import type { Memory } from "./types";

export function relatedMemories(current: Memory, all: Memory[], limit = 3): Memory[] {
  return all
    .filter((memory) => memory.id !== current.id)
    .map((memory) => {
      let score = 0;
      if (memory.mood === current.mood) score += 3;
      if (memory.location && memory.location === current.location) score += 3;
      if (memory.favorite) score += 1;
      return { memory, score };
    })
    .sort((a, b) => b.score - a.score || b.memory.date.localeCompare(a.memory.date))
    .slice(0, limit)
    .map((entry) => entry.memory);
}

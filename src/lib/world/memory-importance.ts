import type { MemoryWorldMemory } from "./world-types";

/** Deterministic importance 1–10 */
export function calculateMemoryImportance(memory: MemoryWorldMemory): number {
  let score = 4;
  const intensity = memory.emotionIntensity;
  if (typeof intensity === "number" && Number.isFinite(intensity)) {
    score += (Math.max(1, Math.min(10, intensity)) - 5) * 0.45;
  }
  if (memory.favorite) score += 2.2;
  const tags = (memory.tags ?? []).map((t) => t.toLowerCase());
  if (tags.some((t) => /achiev|milestone|hackathon|win/.test(t))) score += 1.8;
  if (tags.some((t) => /growth|learn/.test(t))) score += 0.8;
  const emotion = (memory.primaryEmotion ?? "").toLowerCase();
  if (/proud|accomplished|ecstatic|overwhelmed/.test(emotion)) score += 1;
  if (memory.sentiment === "negative") score += 0.4; // still meaningful
  return Math.max(1, Math.min(10, Math.round(score)));
}

export function importanceToScale(importance: number): number {
  if (importance <= 3) return 0.55 + importance * 0.08;
  if (importance <= 6) return 0.85 + (importance - 3) * 0.1;
  if (importance <= 8) return 1.2 + (importance - 6) * 0.15;
  return 1.55 + (importance - 8) * 0.2;
}

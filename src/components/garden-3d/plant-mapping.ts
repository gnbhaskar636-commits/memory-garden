import type { Memory, MarkerKind, Mood, Sentiment } from "@/lib/memories/types";

export type PlantVisualKind = "flower" | "tree" | "sprout" | "stone" | "droop";

export interface PlantConfig {
  kind: PlantVisualKind;
  scale: number;
  /** Hex-ish palette keys resolved in mesh components */
  palette: "warm" | "cool" | "soft" | "bright" | "muted" | "deep";
  sway: number; // 0–1 animation strength
}

/**
 * Map existing memory fields → 3D plant configuration.
 * Prefers markerKind, then mood/sentiment for emotional nuance.
 */
export function plantConfigForMemory(memory: Memory): PlantConfig {
  const intensity = memory.emotionIntensity ?? 5;
  const sentiment: Sentiment | null = memory.sentiment;
  const mood: Mood = memory.mood;
  const marker: MarkerKind = memory.markerKind;

  let kind: PlantVisualKind = "flower";
  let palette: PlantConfig["palette"] = "soft";
  let sway = 0.45;

  // Primary: markerKind already chosen by the app
  // MarkerKind is flower | leaf | stone | sprout (no "tree" in domain types).
  // Visual "tree" is a 3D plant kind derived from leaf + mood / achievements.
  if (marker === "leaf") {
    kind = mood === "peaceful" || mood === "thoughtful" ? "tree" : "sprout";
    palette = "cool";
  } else if (marker === "stone") {
    kind = "stone";
    palette = "muted";
    sway = 0.1;
  } else if (marker === "sprout") {
    kind = "sprout";
    palette = "bright";
    sway = 0.6;
  } else {
    kind = "flower";
    palette = "warm";
  }

  // Emotional overrides
  if (sentiment === "negative" || mood === "thoughtful") {
    if (intensity >= 7) {
      kind = "droop";
      palette = "deep";
      sway = 0.25;
    } else if (marker === "stone" || kind === "stone") {
      kind = "stone";
      palette = "muted";
    }
  }

  if (mood === "peaceful") {
    kind = kind === "flower" ? "tree" : kind;
    palette = "cool";
    sway = 0.3;
  }

  if (mood === "excited" || mood === "joyful") {
    kind = "flower";
    palette = "bright";
    sway = 0.7;
  }

  if (mood === "grateful" || mood === "loved") {
    kind = "flower";
    palette = "warm";
  }

  // Achievements / high intensity favorites → larger tree presence
  const achievementTags = memory.tags.some((t) =>
    /achiev|milestone|hackathon|win|success|growth/.test(t),
  );
  if ((achievementTags || (memory.favorite && intensity >= 8)) && sentiment !== "negative") {
    kind = "tree";
    palette = palette === "deep" ? "cool" : palette;
  }

  return { kind, scale: 1, palette, sway };
}

export const PALETTE_COLORS: Record<
  PlantConfig["palette"],
  { petal: string; stem: string; accent: string; leaf: string }
> = {
  warm: { petal: "#e8a87c", stem: "#4a6741", accent: "#d4a017", leaf: "#6b8f5e" },
  cool: { petal: "#a8c5b8", stem: "#3d5c4a", accent: "#7f9f8e", leaf: "#5a7d6a" },
  soft: { petal: "#f0c4d8", stem: "#5a7a5a", accent: "#e8b4bc", leaf: "#7a9a7a" },
  bright: { petal: "#f5d76e", stem: "#5b7c3e", accent: "#f39c12", leaf: "#82a85a" },
  muted: { petal: "#b0a99f", stem: "#5c564c", accent: "#8a8278", leaf: "#7a7468" },
  deep: { petal: "#8b6b7a", stem: "#3a3a32", accent: "#6a4a5a", leaf: "#4a5240" },
};

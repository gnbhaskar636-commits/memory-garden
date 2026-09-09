import type { MarkerKind, Mood, Sentiment } from "./types";

export const MOOD_LABEL: Record<Mood, string> = {
  joyful: "Joyful",
  peaceful: "Peaceful",
  grateful: "Grateful",
  excited: "Excited",
  nostalgic: "Nostalgic",
  loved: "Loved",
  thoughtful: "Thoughtful",
};

export const MOOD_MARKER: Record<Mood, MarkerKind> = {
  joyful: "flower",
  peaceful: "leaf",
  grateful: "flower",
  excited: "sprout",
  nostalgic: "stone",
  loved: "flower",
  thoughtful: "leaf",
};

export const MOOD_CLASS: Record<Mood, string> = {
  joyful: "bg-highlight/70 text-foreground",
  peaceful: "bg-primary/30 text-foreground",
  grateful: "bg-accent/35 text-foreground",
  excited: "bg-accent/50 text-foreground",
  nostalgic: "bg-lavender/50 text-foreground",
  loved: "bg-accent/40 text-foreground",
  thoughtful: "bg-primary/20 text-foreground",
};

/** Baseline sentiment per mood — the rule-based analysis fallback's starting point. */
export const MOOD_SENTIMENT: Record<Mood, Sentiment> = {
  joyful: "positive",
  peaceful: "positive",
  grateful: "positive",
  excited: "positive",
  nostalgic: "neutral",
  loved: "positive",
  thoughtful: "neutral",
};

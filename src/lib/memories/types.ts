export const MOODS = [
  "joyful",
  "peaceful",
  "grateful",
  "excited",
  "nostalgic",
  "loved",
  "thoughtful",
] as const;

export type Mood = (typeof MOODS)[number];

export const MARKER_KINDS = ["flower", "leaf", "stone", "sprout"] as const;
export type MarkerKind = (typeof MARKER_KINDS)[number];

export type ThemePreference = "light" | "dark" | "system";

export type Sentiment = "positive" | "neutral" | "negative";

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: string;
  mood: Mood;
  location: string;
  photo: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  markerKind: MarkerKind;
  tags: string[];
  /** 1–10, user-set or AI-suggested. `null` until set. */
  emotionIntensity: number | null;
  /** Set once `aiAnalyzed` is true — see src/lib/ai/analyze.server.ts. */
  primaryEmotion: string | null;
  secondaryEmotion: string | null;
  sentiment: Sentiment | null;
  /** True once AI analysis has run at least once (even if it fell back to rules). */
  aiAnalyzed: boolean;
  worldPosition: { x: number; z: number };
}

export interface GardenSettings {
  theme: ThemePreference;
  reducedMotion: boolean;
  displayName: string;
  hideLocations: boolean;
}

export interface MemoryDraft {
  title: string;
  description: string;
  date: string;
  mood: Mood;
  location: string;
  photo: string | null;
  favorite: boolean;
  markerKind?: MarkerKind;
  tags: string[];
  emotionIntensity: number | null;
  primaryEmotion: string | null;
  secondaryEmotion: string | null;
  sentiment: Sentiment | null;
  aiAnalyzed: boolean;
}

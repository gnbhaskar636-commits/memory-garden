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
  /** Short-lived signed URL for the private Storage object, or null. */
  photo: string | null;
  /** Stable private Storage object path used to keep the photo attached to the memory. */
  photoPath: string | null;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  markerKind: MarkerKind;
  tags: string[];
  emotionIntensity: number | null;
  primaryEmotion: string | null;
  secondaryEmotion: string | null;
  sentiment: Sentiment | null;
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
  photoPath: string | null;
  favorite: boolean;
  markerKind?: MarkerKind;
  tags: string[];
  emotionIntensity: number | null;
  primaryEmotion: string | null;
  secondaryEmotion: string | null;
  sentiment: Sentiment | null;
  aiAnalyzed: boolean;
}

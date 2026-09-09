import { format, parseISO } from "date-fns";
import { MOOD_LABEL, MOOD_SENTIMENT } from "./mood";
import type { Memory, Mood, Sentiment } from "./types";

export function memoriesInMonth(memories: Memory[], year: number, monthIndex: number) {
  return memories.filter((memory) => {
    const date = parseISO(memory.date);
    return date.getFullYear() === year && date.getMonth() === monthIndex;
  });
}

export function mostCommonMood(memories: Memory[]): Mood | null {
  if (memories.length === 0) return null;
  const counts = new Map<Mood, number>();
  for (const memory of memories) {
    counts.set(memory.mood, (counts.get(memory.mood) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function favoritePlaces(memories: Memory[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    const place = memory.location.trim();
    if (!place) continue;
    counts.set(place, (counts.get(place) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([place]) => place);
}

const MOOD_LINE: Record<Mood, string> = {
  joyful: "Joy kept arriving in small, bright pieces.",
  peaceful: "The month asked for quiet, and you answered it.",
  grateful: "Gratitude was the weather of your days.",
  excited: "Something new kept tapping on the glass.",
  nostalgic: "Old light found its way back to you.",
  loved: "You were held, in ways both spoken and not.",
  thoughtful: "You stayed with the questions instead of rushing past them.",
};

export function composeReflection(memories: Memory[], year: number, monthIndex: number): string {
  const monthLabel = format(new Date(year, monthIndex, 1), "MMMM");
  if (memories.length === 0) {
    return `${monthLabel} is still an open bed. Plant a moment whenever one arrives.`;
  }

  const mood = mostCommonMood(memories);
  const places = favoritePlaces(memories);
  const favorites = memories.filter((memory) => memory.favorite);
  const centerpiece = favorites[0] ?? memories[0];

  const countLine =
    memories.length === 1
      ? `${monthLabel} held one moment worth keeping.`
      : `${monthLabel} gathered ${memories.length} moments in the garden.`;

  const moodLine = mood ? MOOD_LINE[mood] : "";
  const placeLine =
    places.length === 0
      ? ""
      : places.length === 1
        ? `You returned to ${places[0]}.`
        : `You wandered through ${places.slice(0, -1).join(", ")} and ${places.at(-1)}.`;
  const favoriteLine = centerpiece
    ? `"${centerpiece.title}" still sits at the center, ${MOOD_LABEL[centerpiece.mood].toLowerCase()} and unhurried.`
    : "";

  return [countLine, moodLine, placeLine, favoriteLine].filter(Boolean).join(" ");
}

export function availableMonths(memories: Memory[]): Array<{ year: number; monthIndex: number }> {
  const seen = new Set<string>();
  const months: Array<{ year: number; monthIndex: number }> = [];
  const sorted = [...memories].sort((a, b) => b.date.localeCompare(a.date));
  for (const memory of sorted) {
    const date = parseISO(memory.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    months.push({ year: date.getFullYear(), monthIndex: date.getMonth() });
  }
  if (months.length === 0) {
    const now = new Date();
    months.push({ year: now.getFullYear(), monthIndex: now.getMonth() });
  }
  return months;
}

// ---------------------------------------------------------------------------
// Rich monthly stats — all computed from existing memory fields (no AI calls).
// ---------------------------------------------------------------------------

export type EmotionalTrend = "improving" | "stable" | "challenging" | "mixed";

export interface MonthStats {
  count: number;
  dominantMood: Mood | null;
  dominantEmotion: string | null;
  commonThemes: string[];
  favoritePlaces: string[];
  positiveCount: number;
  difficultCount: number;
  neutralCount: number;
  averageIntensity: number | null;
  trend: EmotionalTrend;
  favoritesCount: number;
}

function sentimentOf(memory: Memory): Sentiment {
  if (memory.sentiment) return memory.sentiment;
  return MOOD_SENTIMENT[memory.mood];
}

function intensityOf(memory: Memory): number {
  if (typeof memory.emotionIntensity === "number") return memory.emotionIntensity;
  return 5;
}

export function mostCommonEmotion(memories: Memory[]): string | null {
  if (memories.length === 0) return null;
  const counts = new Map<string, number>();
  for (const memory of memories) {
    const emotion = memory.primaryEmotion?.trim();
    if (!emotion) continue;
    counts.set(emotion, (counts.get(emotion) ?? 0) + 1);
  }
  if (counts.size === 0) {
    const mood = mostCommonMood(memories);
    return mood ? MOOD_LABEL[mood] : null;
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

export function commonThemes(memories: Memory[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const memory of memories) {
    for (const tag of memory.tags) {
      const t = tag.trim().toLowerCase();
      if (!t) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/** Compare first-half vs second-half of the month by average intensity + sentiment. */
export function emotionalTrend(memories: Memory[]): EmotionalTrend {
  if (memories.length < 2) return "stable";

  const sorted = [...memories].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.ceil(sorted.length / 2);
  const early = sorted.slice(0, mid);
  const late = sorted.slice(mid);

  const score = (list: Memory[]) => {
    let total = 0;
    for (const m of list) {
      const s = sentimentOf(m);
      const sentimentScore = s === "positive" ? 1 : s === "negative" ? -1 : 0;
      total += sentimentScore * (intensityOf(m) / 5);
    }
    return total / list.length;
  };

  const earlyScore = score(early);
  const lateScore = score(late);
  const delta = lateScore - earlyScore;

  if (Math.abs(delta) < 0.25) {
    const positives = memories.filter((m) => sentimentOf(m) === "positive").length;
    const negatives = memories.filter((m) => sentimentOf(m) === "negative").length;
    if (positives > 0 && negatives > 0 && Math.abs(positives - negatives) <= 1) {
      return "mixed";
    }
    return "stable";
  }
  if (delta > 0) return "improving";
  return "challenging";
}

export function computeMonthStats(memories: Memory[]): MonthStats {
  let positiveCount = 0;
  let difficultCount = 0;
  let neutralCount = 0;
  let intensitySum = 0;
  let intensityN = 0;

  for (const memory of memories) {
    const s = sentimentOf(memory);
    if (s === "positive") positiveCount += 1;
    else if (s === "negative") difficultCount += 1;
    else neutralCount += 1;

    if (typeof memory.emotionIntensity === "number") {
      intensitySum += memory.emotionIntensity;
      intensityN += 1;
    }
  }

  return {
    count: memories.length,
    dominantMood: mostCommonMood(memories),
    dominantEmotion: mostCommonEmotion(memories),
    commonThemes: commonThemes(memories, 5),
    favoritePlaces: favoritePlaces(memories, 4),
    positiveCount,
    difficultCount,
    neutralCount,
    averageIntensity: intensityN > 0 ? Math.round((intensitySum / intensityN) * 10) / 10 : null,
    trend: emotionalTrend(memories),
    favoritesCount: memories.filter((m) => m.favorite).length,
  };
}

const TREND_LABEL: Record<EmotionalTrend, string> = {
  improving: "Improving",
  stable: "Stable",
  challenging: "Challenging",
  mixed: "Mixed",
};

export function trendLabel(trend: EmotionalTrend): string {
  return TREND_LABEL[trend];
}

/**
 * Local, deterministic Garden Insight — no network / API call.
 * Uses existing analysis fields + stats so demos and offline use always work.
 */
export function composeGardenInsight(
  memories: Memory[],
  year: number,
  monthIndex: number,
): string {
  const monthLabel = format(new Date(year, monthIndex, 1), "MMMM");
  if (memories.length === 0) {
    return `${monthLabel} is waiting for its first seeds. Plant a moment and the garden will begin to speak.`;
  }

  const stats = computeMonthStats(memories);
  const parts: string[] = [];

  if (stats.trend === "improving") {
    parts.push(
      `Your memories suggest the second half of ${monthLabel} felt lighter than the first — confidence and warmth grew as the days passed.`,
    );
  } else if (stats.trend === "challenging") {
    parts.push(
      `${monthLabel} asked more of you toward the end. The difficult moments are part of the garden too; they make the brighter ones clearer.`,
    );
  } else if (stats.trend === "mixed") {
    parts.push(
      `${monthLabel} held both brightness and weight. That mix is honest — growth rarely moves in a straight line.`,
    );
  } else {
    parts.push(
      `${monthLabel} held a steady emotional weather. You kept showing up, and the garden remembers that consistency.`,
    );
  }

  if (stats.dominantEmotion) {
    parts.push(`The emotion that surfaced most often was ${stats.dominantEmotion}.`);
  }

  if (stats.commonThemes.length > 0) {
    const themes =
      stats.commonThemes.length === 1
        ? stats.commonThemes[0]
        : `${stats.commonThemes.slice(0, -1).join(", ")} and ${stats.commonThemes.at(-1)}`;
    parts.push(`Recurring themes: ${themes}.`);
  }

  if (stats.positiveCount > stats.difficultCount && stats.positiveCount > 0) {
    parts.push(
      `${stats.positiveCount} of ${stats.count} moments leaned positive — the garden is leaning toward light.`,
    );
  } else if (stats.difficultCount > stats.positiveCount && stats.difficultCount > 0) {
    parts.push(
      `${stats.difficultCount} moments carried weight. Naming them is already a form of care.`,
    );
  }

  return parts.join(" ");
}

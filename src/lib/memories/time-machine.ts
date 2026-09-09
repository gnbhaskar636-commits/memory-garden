import { differenceInCalendarDays, format, parseISO, subYears } from "date-fns";
import type { Memory } from "./types";

export type TimeMachineKind =
  | "same-day-last-year"
  | "same-month-last-year"
  | "favorite-old"
  | "old-memory";

export interface TimeMachinePick {
  memory: Memory;
  kind: TimeMachineKind;
  /** Human label e.g. "ONE YEAR AGO", "SAME MONTH LAST YEAR" */
  headline: string;
  /** e.g. "365 days ago" */
  agoLabel: string;
}

function dayKey(isoDate: string): string {
  // YYYY-MM-DD
  return isoDate.slice(0, 10);
}

function monthKey(isoDate: string): string {
  // YYYY-MM
  return isoDate.slice(0, 7);
}

function daysAgo(isoDate: string, today = new Date()): number {
  return Math.max(0, differenceInCalendarDays(today, parseISO(isoDate)));
}

function formatAgo(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? "About 1 month ago" : `About ${months} months ago`;
  }
  const years = Math.floor(days / 365);
  const rem = days % 365;
  if (years === 1 && rem < 30) return "About 1 year ago";
  if (years === 1) return "Over a year ago";
  return `About ${years} years ago`;
}

/**
 * Stable pseudo-random index from a string + day salt so the pick
 * doesn't jump on every refresh within the same calendar day.
 */
function stableIndex(seed: string, modulo: number): number {
  if (modulo <= 0) return 0;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % modulo;
}

/**
 * Pick an old memory for the Time Machine.
 * Priority:
 * 1. Same calendar day, previous year(s)
 * 2. Same month, previous year(s)
 * 3. Older favorite
 * 4. Any meaningfully old memory (≥ 30 days)
 */
export function pickTimeMachineMemory(
  memories: Memory[],
  today = new Date(),
): TimeMachinePick | null {
  if (memories.length === 0) return null;

  const todayKey = format(today, "yyyy-MM-dd");
  const todayMonth = format(today, "MM-dd"); // month-day for cross-year match
  const todayYm = format(today, "yyyy-MM");
  const daySalt = todayKey;

  // Exclude very recent memories from "old" pools (keep same-day/month last year intact).
  const olderThanMonth = memories.filter((m) => daysAgo(m.date, today) >= 30);

  // 1) Same day previous year(s)
  const sameDay = memories.filter((m) => {
    const d = parseISO(m.date);
    const md = format(d, "MM-dd");
    return md === todayMonth && format(d, "yyyy-MM-dd") !== todayKey;
  });
  if (sameDay.length > 0) {
    const idx = stableIndex(`same-day:${daySalt}`, sameDay.length);
    const memory = sameDay[idx]!;
    const days = daysAgo(memory.date, today);
    return {
      memory,
      kind: "same-day-last-year",
      headline: days >= 360 && days <= 370 ? "ONE YEAR AGO" : "ON THIS DAY",
      agoLabel: formatAgo(days),
    };
  }

  // 2) Same month previous year(s)
  const thisMonthNum = today.getMonth();
  const sameMonthPrev = olderThanMonth.filter((m) => {
    const d = parseISO(m.date);
    return d.getMonth() === thisMonthNum && format(d, "yyyy-MM") !== todayYm;
  });
  if (sameMonthPrev.length > 0) {
    const idx = stableIndex(`same-month:${daySalt}`, sameMonthPrev.length);
    const memory = sameMonthPrev[idx]!;
    return {
      memory,
      kind: "same-month-last-year",
      headline: "SAME MONTH, ANOTHER YEAR",
      agoLabel: formatAgo(daysAgo(memory.date, today)),
    };
  }

  // 3) Old favorites
  const oldFavorites = olderThanMonth.filter((m) => m.favorite);
  if (oldFavorites.length > 0) {
    const idx = stableIndex(`fav:${daySalt}`, oldFavorites.length);
    const memory = oldFavorites[idx]!;
    return {
      memory,
      kind: "favorite-old",
      headline: "A FAVORITE FROM BEFORE",
      agoLabel: formatAgo(daysAgo(memory.date, today)),
    };
  }

  // 4) Any old memory
  if (olderThanMonth.length > 0) {
    const idx = stableIndex(`old:${daySalt}`, olderThanMonth.length);
    const memory = olderThanMonth[idx]!;
    return {
      memory,
      kind: "old-memory",
      headline: "FROM THE ARCHIVE",
      agoLabel: formatAgo(daysAgo(memory.date, today)),
    };
  }

  // Fallback: oldest memory overall if nothing is ≥30 days
  const sorted = [...memories].sort((a, b) => a.date.localeCompare(b.date));
  const memory = sorted[0]!;
  if (dayKey(memory.date) === todayKey && memories.length === 1) {
    // Only today's memory — Time Machine has nothing meaningful yet
    return null;
  }
  return {
    memory,
    kind: "old-memory",
    headline: "LOOKING BACK",
    agoLabel: formatAgo(daysAgo(memory.date, today)),
  };
}

/** Convenience: one-year-ago date string for display helpers. */
export function oneYearAgoLabel(today = new Date()): string {
  return format(subYears(today, 1), "MMMM d, yyyy");
}

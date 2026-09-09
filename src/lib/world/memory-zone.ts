import type { MemoryWorldMemory, WorldZoneId } from "./world-types";

function textBlob(m: MemoryWorldMemory): string {
  return [
    m.mood,
    m.primaryEmotion,
    m.secondaryEmotion,
    m.sentiment,
    ...(m.tags ?? []),
    m.title,
    m.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Priority:
 * 1. Growth / achievement tags → forest
 * 2. Happy / positive → meadow
 * 3. Peaceful / reflective → lake
 * 4. Default → home
 */
export function getMemoryZone(memory: MemoryWorldMemory): WorldZoneId {
  const blob = textBlob(memory);
  const tags = (memory.tags ?? []).map((t) => t.toLowerCase());
  const mood = (memory.mood ?? "").toLowerCase();
  const sentiment = (memory.sentiment ?? "").toLowerCase();

  const growthHints =
    /achiev|milestone|hackathon|growth|learn|success|progress|win|project/.test(blob) ||
    tags.some((t) => /achiev|milestone|growth|hackathon|learn/.test(t));
  if (growthHints) return "forest";

  const happyHints =
    sentiment === "positive" ||
    /joy|happy|excit|grateful|loved|celebrat|fun|bright/.test(blob) ||
    /joyful|excited|grateful|loved/.test(mood);
  if (happyHints) return "meadow";

  const calmHints =
    /peace|calm|reflect|thoughtful|nostalgic|quiet|meditat|still/.test(blob) ||
    /peaceful|thoughtful|nostalgic/.test(mood);
  if (calmHints) return "lake";

  if (sentiment === "negative") return "home";

  return "home";
}

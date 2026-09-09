import type { MemoryWorldMemory, WorldObjectType } from "./world-types";
import { getMemoryZone } from "./memory-zone";

/**
 * Priority:
 * 1. Explicit markerKind overrides
 * 2. Negative + high intensity → STONE
 * 3. Growth Forest / achievement → TREE
 * 4. Happy Meadow / positive moods → FLOWER
 * 5. Reflection Lake / calm markers → PLANT
 * 6. Default → FLOWER
 */
export function getMemoryObjectType(memory: MemoryWorldMemory): WorldObjectType {
  const marker = (memory.markerKind ?? "").toLowerCase().trim();
  const sentiment = (memory.sentiment ?? "").toLowerCase();
  const intensity = memory.emotionIntensity ?? 5;
  const zone = getMemoryZone(memory);
  const blob = [memory.mood, memory.primaryEmotion, ...(memory.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // 1. Explicit marker overrides
  if (marker === "stone") return "STONE";
  if (marker === "tree") return "TREE";
  if (marker === "flower") return "FLOWER";
  if (marker === "leaf" || marker === "sprout") return "PLANT";

  // 2. Difficult / heavy memories
  if (sentiment === "negative" && intensity >= 6) return "STONE";

  // 3. Growth / achievement
  if (zone === "forest" || /achiev|milestone|growth/.test(blob)) return "TREE";

  // 4. Happy meadow / joyful cues
  if (zone === "meadow" || /joy|happy|excit|grateful|loved/.test(blob)) return "FLOWER";

  // 5. Reflection / calm
  if (zone === "lake" || /peace|calm|thoughtful|nostalgic/.test(blob)) return "PLANT";

  // 6. Soft fallback for remaining negative
  if (sentiment === "negative") return "STONE";

  return "FLOWER";
}

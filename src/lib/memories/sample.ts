import type { Memory } from "./types";
import { getStableMemoryPosition } from "@/lib/world/memory-position";
import { getMemoryZone } from "@/lib/world/memory-zone";

function samplePosition(memory: Pick<Memory, "id" | "title" | "description" | "date" | "mood" | "tags" | "primaryEmotion" | "secondaryEmotion" | "sentiment">) {
  const worldMemory = {
    ...memory,
    primaryEmotion: memory.primaryEmotion ?? undefined,
    secondaryEmotion: memory.secondaryEmotion ?? undefined,
    sentiment: memory.sentiment ?? undefined,
  };
  const position = getStableMemoryPosition(worldMemory, getMemoryZone(worldMemory));
  return { x: position.x, z: position.z };
}

/**
 * Not wired into the app yet — reserved as the seed data for the planned
 * "Explore Demo Garden" mode (populates a realistic garden + AI insights +
 * monthly reflection without requiring the visitor to write anything).
 */
export const SAMPLE_MEMORIES: Memory[] = [
  {
    id: "mem-coffee-mum",
    title: "Coffee with Mum",
    description: "We talked for almost two hours and forgot to check the time.",
    mood: "grateful",
    date: "2026-08-30",
    location: "Corner Café",
    photo: "/samples/coffee.jpg",
    favorite: true,
    createdAt: "2026-08-30T16:20:00.000Z",
    updatedAt: "2026-08-30T16:20:00.000Z",
    markerKind: "flower",
    tags: ["family", "gratitude"],
    emotionIntensity: 6,
    primaryEmotion: "Grateful",
    secondaryEmotion: "Happy",
    sentiment: "positive",
    aiAnalyzed: true,
    worldPosition: samplePosition({
      id: "mem-coffee-mum",
      title: "Coffee with Mum",
      description: "We talked for almost two hours and forgot to check the time.",
      date: "2026-08-30",
      mood: "grateful",
      tags: ["family", "gratitude"],
      primaryEmotion: "Grateful",
      secondaryEmotion: "Happy",
      sentiment: "positive",
    }),
  },
  {
    id: "mem-walk-after-rain",
    title: "The walk after rain",
    description: "The streets were quiet, and every tree was shining.",
    mood: "peaceful",
    date: "2026-08-26",
    location: "Riverside Park",
    photo: "/samples/rain.jpg",
    favorite: false,
    createdAt: "2026-08-26T18:05:00.000Z",
    updatedAt: "2026-08-26T18:05:00.000Z",
    markerKind: "leaf",
    tags: ["nature", "rest"],
    emotionIntensity: 4,
    primaryEmotion: "Calm",
    secondaryEmotion: null,
    sentiment: "positive",
    aiAnalyzed: true,
    worldPosition: samplePosition({
      id: "mem-walk-after-rain",
      title: "The walk after rain",
      description: "The streets were quiet, and every tree was shining.",
      date: "2026-08-26",
      mood: "peaceful",
      tags: ["nature", "rest"],
      primaryEmotion: "Calm",
      secondaryEmotion: null,
      sentiment: "positive",
    }),
  },
  {
    id: "mem-needed-message",
    title: "A message I needed",
    description: "A friend sent exactly the right words at exactly the right time.",
    mood: "loved",
    date: "2026-08-19",
    location: "",
    photo: "/samples/message.jpg",
    favorite: true,
    createdAt: "2026-08-19T21:40:00.000Z",
    updatedAt: "2026-08-19T21:40:00.000Z",
    markerKind: "sprout",
    tags: ["friendship", "love"],
    emotionIntensity: 7,
    primaryEmotion: "Loved",
    secondaryEmotion: "Relieved",
    sentiment: "positive",
    aiAnalyzed: true,
    worldPosition: samplePosition({
      id: "mem-needed-message",
      title: "A message I needed",
      description: "A friend sent exactly the right words at exactly the right time.",
      date: "2026-08-19",
      mood: "loved",
      tags: ["friendship", "love"],
      primaryEmotion: "Loved",
      secondaryEmotion: "Relieved",
      sentiment: "positive",
    }),
  },
];

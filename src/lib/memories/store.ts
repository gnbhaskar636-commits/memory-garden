import { create } from "zustand";
import { MOOD_MARKER } from "./mood";
import {
  clearMyMemories,
  createMemory as createMemoryFn,
  deleteMemory as deleteMemoryFn,
  getGardenSettings,
  listMemories,
  saveGardenSettings,
  toggleFavoriteMemory,
  updateMemory as updateMemoryFn,
} from "./server";
import type { GardenSettings, Memory, MemoryDraft } from "./types";
import { getStableMemoryPosition } from "@/lib/world/memory-position";
import { getMemoryZone } from "@/lib/world/memory-zone";

export const defaultSettings: GardenSettings = {
  theme: "light",
  reducedMotion: false,
  displayName: "",
  hideLocations: false,
};

interface GardenState {
  memories: Memory[];
  settings: GardenSettings;
  hydrated: boolean;
  lastError: string | null;
  hydrate: () => void;
  addMemory: (draft: MemoryDraft) => Promise<Memory>;
  updateMemory: (id: string, draft: MemoryDraft) => void;
  deleteMemory: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateSettings: (patch: Partial<GardenSettings>) => void;
  clearGarden: () => void;
}

function nowIso() {
  return new Date().toISOString();
}

function createLocalMemory(draft: MemoryDraft): Memory {
  const createdAt = nowIso();
  const id = crypto.randomUUID();
  const worldMemory = {
    id,
    title: draft.title.trim(),
    description: draft.description.trim(),
    date: draft.date,
    mood: draft.mood,
    tags: draft.tags,
    primaryEmotion: draft.primaryEmotion ?? undefined,
    secondaryEmotion: draft.secondaryEmotion ?? undefined,
    sentiment: draft.sentiment ?? undefined,
  };
  const zone = getMemoryZone(worldMemory);
  const position = getStableMemoryPosition(worldMemory, zone);
  return {
    id,
    title: worldMemory.title,
    description: worldMemory.description,
    date: draft.date,
    mood: draft.mood,
    location: draft.location.trim(),
    photo: draft.photo,
    photoPath: draft.photoPath,
    favorite: draft.favorite,
    createdAt,
    updatedAt: createdAt,
    markerKind: draft.markerKind ?? MOOD_MARKER[draft.mood],
    tags: draft.tags,
    emotionIntensity: draft.emotionIntensity,
    primaryEmotion: draft.primaryEmotion,
    secondaryEmotion: draft.secondaryEmotion,
    sentiment: draft.sentiment,
    aiAnalyzed: draft.aiAnalyzed,
    worldPosition: { x: position.x, z: position.z },
  };
}

export const useMemoryStore = create<GardenState>()((set, get) => ({
  memories: [],
  settings: defaultSettings,
  hydrated: false,
  lastError: null,

  hydrate: () => {
    void Promise.all([listMemories(), getGardenSettings()])
      .then(([memories, settings]) => {
        set({ memories, settings: settings ?? get().settings, hydrated: true });
      })
      .catch((err: unknown) => {
        set({ hydrated: true, lastError: err instanceof Error ? err.message : "Failed to load your garden." });
      });
  },

  addMemory: async (draft: MemoryDraft) => {
    const memory = createLocalMemory(draft);
    try {
      const saved = await createMemoryFn({ data: { ...draft, id: memory.id } });
      set({ memories: [saved, ...get().memories], lastError: null });
      return saved;
    } catch (err: unknown) {
      set({ lastError: err instanceof Error ? err.message : "Couldn't save that memory." });
      throw err;
    }
  },

  updateMemory: (id, draft) => {
    const previous = get().memories;
    set({
      memories: previous.map((memory) =>
        memory.id === id
          ? {
              ...memory,
              title: draft.title.trim(),
              description: draft.description.trim(),
              date: draft.date,
              mood: draft.mood,
              location: draft.location.trim(),
              photo: draft.photo,
              photoPath: draft.photoPath,
              favorite: draft.favorite,
              markerKind: draft.markerKind ?? memory.markerKind,
              tags: draft.tags,
              emotionIntensity: draft.emotionIntensity,
              primaryEmotion: draft.primaryEmotion,
              secondaryEmotion: draft.secondaryEmotion,
              sentiment: draft.sentiment,
              aiAnalyzed: draft.aiAnalyzed,
              updatedAt: nowIso(),
            }
          : memory,
      ),
      lastError: null,
    });
    void updateMemoryFn({ data: { id, draft } }).catch((err: unknown) => {
      set({ memories: previous, lastError: err instanceof Error ? err.message : "Couldn't save your changes." });
    });
  },

  deleteMemory: (id) => {
    const previous = get().memories;
    set({ memories: previous.filter((memory) => memory.id !== id), lastError: null });
    void deleteMemoryFn({ data: { id } }).catch((err: unknown) => {
      set({ memories: previous, lastError: err instanceof Error ? err.message : "Couldn't delete that memory." });
    });
  },

  toggleFavorite: (id) => {
    const previous = get().memories;
    set({
      memories: previous.map((memory) =>
        memory.id === id ? { ...memory, favorite: !memory.favorite, updatedAt: nowIso() } : memory,
      ),
      lastError: null,
    });
    void toggleFavoriteMemory({ data: { id } }).catch((err: unknown) => {
      set({ memories: previous, lastError: err instanceof Error ? err.message : "Couldn't update that memory." });
    });
  },

  updateSettings: (patch) => {
    const previous = get().settings;
    const next = { ...previous, ...patch };
    set({ settings: next, lastError: null });
    void saveGardenSettings({ data: next }).catch((err: unknown) => {
      set({ settings: previous, lastError: err instanceof Error ? err.message : "Couldn't save your settings." });
    });
  },

  clearGarden: () => {
    const previous = get().memories;
    set({ memories: [], lastError: null });
    void clearMyMemories().catch((err: unknown) => {
      set({ memories: previous, lastError: err instanceof Error ? err.message : "Couldn't clear your garden." });
    });
  },
}));

export function selectMemory(id: string) {
  return useMemoryStore.getState().memories.find((memory) => memory.id === id);
}

export function pickWanderMemory(excludeId?: string) {
  const memories = useMemoryStore.getState().memories;
  const pool = excludeId ? memories.filter((memory) => memory.id !== excludeId) : memories;
  if (pool.length === 0) return memories[0] ?? null;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? null;
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { analyzeMemory } from "@/lib/ai/analyze.server";
import { chatWithGarden, type ChatMessage } from "@/lib/ai/garden-chat.server";
import { MOOD_MARKER } from "./mood";
import { MARKER_KINDS, MOODS } from "./types";
import type { GardenSettings, Memory } from "./types";
import type { MemoryWorldMemory } from "@/lib/world/world-types";
import { getStableMemoryPosition } from "@/lib/world/memory-position";
import { getMemoryZone } from "@/lib/world/memory-zone";

const moodSchema = z.enum(MOODS);
const markerKindSchema = z.enum(MARKER_KINDS);
const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

const draftSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000),
  date: z.string().min(1),
  mood: moodSchema,
  location: z.string().trim().max(200),
  photo: z.string().max(10_000_000).nullable(),
  photoPath: z.string().trim().max(1000).nullable(),
  favorite: z.boolean(),
  markerKind: markerKindSchema.optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
  emotionIntensity: z.number().int().min(1).max(10).nullable(),
  primaryEmotion: z.string().trim().max(60).nullable(),
  secondaryEmotion: z.string().trim().max(60).nullable(),
  sentiment: sentimentSchema.nullable(),
  aiAnalyzed: z.boolean(),
});

interface MemoryRow {
  id: string;
  title: string;
  description: string;
  date: string;
  mood: string;
  location: string;
  photo: string | null;
  photo_path: string | null;
  favorite: boolean;
  marker_kind: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  emotion_intensity: number | null;
  primary_emotion: string | null;
  secondary_emotion: string | null;
  sentiment: string | null;
  ai_analyzed: boolean;
  world_x: number | null;
  world_z: number | null;
}

function worldPositionFor(memory: MemoryWorldMemory) {
  const zone = getMemoryZone(memory);
  const position = getStableMemoryPosition(memory, zone);
  return { x: position.x, z: position.z };
}

async function signedPhotoUrl(path: string | null, fallback: string | null): Promise<string | null> {
  if (!path) return fallback;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage.from("memory-photos").createSignedUrl(path, 60 * 60 * 24);
  if (error || !data?.signedUrl) {
    console.warn("[memory] could not sign photo URL", { code: error?.name ?? "unknown" });
    return null;
  }
  return data.signedUrl;
}

async function rowToMemory(row: MemoryRow): Promise<Memory> {
  const fallback = worldPositionFor({
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    mood: row.mood as Memory["mood"],
    tags: row.tags ?? [],
    primaryEmotion: row.primary_emotion ?? undefined,
    secondaryEmotion: row.secondary_emotion ?? undefined,
    sentiment: row.sentiment ? row.sentiment : undefined,
  });
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date,
    mood: row.mood as Memory["mood"],
    location: row.location,
    photo: await signedPhotoUrl(row.photo_path, row.photo),
    photoPath: row.photo_path,
    favorite: row.favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    markerKind: row.marker_kind as Memory["markerKind"],
    tags: row.tags ?? [],
    emotionIntensity: row.emotion_intensity,
    primaryEmotion: row.primary_emotion,
    secondaryEmotion: row.secondary_emotion,
    sentiment: row.sentiment as Memory["sentiment"],
    aiAnalyzed: row.ai_analyzed,
    worldPosition:
      row.world_x == null || row.world_z == null
        ? fallback
        : { x: Number(row.world_x), z: Number(row.world_z) },
  };
}

const memorySelect = `
  id, title, description, date, mood, location, photo, photo_path, favorite,
  marker_kind, created_at, updated_at, tags, emotion_intensity,
  primary_emotion, secondary_emotion, sentiment, ai_analyzed, world_x, world_z
`;

export const listMemories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<MemoryRow>`
      select ${sql.unsafe(memorySelect)}
      from memories
      where user_id = ${context.userId}
      order by date desc, created_at desc
    `;
    const memories = await Promise.all(rows.map(rowToMemory));
    for (const memory of memories) {
      const row = rows.find((candidate) => candidate.id === memory.id);
      if (row?.world_x == null || row.world_z == null) {
        await sql`
          update memories
          set world_x = ${memory.worldPosition.x}, world_z = ${memory.worldPosition.z}
          where id = ${memory.id} and user_id = ${context.userId}
        `;
      }
    }
    return memories;
  });

export const createMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(draftSchema.extend({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const { id } = data;
    const markerKind = data.markerKind ?? MOOD_MARKER[data.mood];
    const worldPosition = worldPositionFor({
      id,
      title: data.title,
      description: data.description,
      date: data.date,
      mood: data.mood,
      tags: data.tags,
      primaryEmotion: data.primaryEmotion ?? undefined,
      secondaryEmotion: data.secondaryEmotion ?? undefined,
      sentiment: data.sentiment ?? undefined,
    });
    const legacyPhoto = data.photo?.startsWith("data:") ? data.photo : null;
    const rows = await sql<MemoryRow>`
      insert into memories
        (id, user_id, title, description, date, mood, location, photo, photo_path, favorite, marker_kind,
         tags, emotion_intensity, primary_emotion, secondary_emotion, sentiment, ai_analyzed,
         world_x, world_z)
      values
        (${id}, ${context.userId}, ${data.title}, ${data.description}, ${data.date},
         ${data.mood}, ${data.location}, ${legacyPhoto}, ${data.photoPath}, ${data.favorite}, ${markerKind},
         ${data.tags}, ${data.emotionIntensity}, ${data.primaryEmotion}, ${data.secondaryEmotion},
         ${data.sentiment}, ${data.aiAnalyzed}, ${worldPosition.x}, ${worldPosition.z})
      returning ${sql.unsafe(memorySelect)}
    `;
    return rowToMemory(rows[0]!);
  });

export const updateMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1), draft: draftSchema }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const { id, draft } = data;
    const markerKind = draft.markerKind ?? MOOD_MARKER[draft.mood];
    const oldRows = await sql<{ photo_path: string | null }>`
      select photo_path from memories where id = ${id} and user_id = ${context.userId} limit 1
    `;
    if (!oldRows[0]) throw new Error("Memory not found");
    const oldPath = oldRows[0].photo_path;
    const legacyPhoto = draft.photo?.startsWith("data:") ? draft.photo : null;
    const rows = await sql<MemoryRow>`
      update memories set
        title = ${draft.title},
        description = ${draft.description},
        date = ${draft.date},
        mood = ${draft.mood},
        location = ${draft.location},
        photo = ${legacyPhoto},
        photo_path = ${draft.photoPath},
        favorite = ${draft.favorite},
        marker_kind = ${markerKind},
        tags = ${draft.tags},
        emotion_intensity = ${draft.emotionIntensity},
        primary_emotion = ${draft.primaryEmotion},
        secondary_emotion = ${draft.secondaryEmotion},
        sentiment = ${draft.sentiment},
        ai_analyzed = ${draft.aiAnalyzed},
        updated_at = now()
      where id = ${id} and user_id = ${context.userId}
      returning ${sql.unsafe(memorySelect)}
    `;
    if (!rows[0]) throw new Error("Memory not found");

    if (oldPath && oldPath !== draft.photoPath) {
      try {
        const supabase = createSupabaseServerClient();
        await supabase.storage.from("memory-photos").remove([oldPath]);
      } catch (error) {
        console.warn("[memory] old photo cleanup failed", { code: error instanceof Error ? error.name : "unknown" });
      }
    }
    return rowToMemory(rows[0]);
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{ photo_path: string | null }>`
      select photo_path from memories where id = ${data.id} and user_id = ${context.userId} limit 1
    `;
    await sql`delete from memories where id = ${data.id} and user_id = ${context.userId}`;
    if (rows[0]?.photo_path) {
      try {
        const supabase = createSupabaseServerClient();
        await supabase.storage.from("memory-photos").remove([rows[0].photo_path]);
      } catch (error) {
        console.warn("[memory] photo cleanup failed", { code: error instanceof Error ? error.name : "unknown" });
      }
    }
    return { ok: true };
  });

export const toggleFavoriteMemory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<MemoryRow>`
      update memories set favorite = not favorite, updated_at = now()
      where id = ${data.id} and user_id = ${context.userId}
      returning ${sql.unsafe(memorySelect)}
    `;
    if (!rows[0]) throw new Error("Memory not found");
    return rowToMemory(rows[0]);
  });

export const analyzeMemoryDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(4000),
      mood: moodSchema,
    }),
  )
  .handler(async ({ data }) => analyzeMemory(data));

interface SettingsRow {
  theme: string;
  reduced_motion: boolean;
  display_name: string;
  hide_locations: boolean;
}

function rowToSettings(row: SettingsRow | undefined): GardenSettings | null {
  if (!row) return null;
  return {
    theme: row.theme as GardenSettings["theme"],
    reducedMotion: row.reduced_motion,
    displayName: row.display_name,
    hideLocations: row.hide_locations,
  };
}

export const clearMyMemories = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ photo_path: string | null }>`
      select photo_path from memories where user_id = ${context.userId} and photo_path is not null
    `;
    await sql`delete from memories where user_id = ${context.userId}`;
    const paths = rows.map((row) => row.photo_path).filter((path): path is string => Boolean(path));
    if (paths.length) {
      try {
        const supabase = createSupabaseServerClient();
        await supabase.storage.from("memory-photos").remove(paths);
      } catch (error) {
        console.warn("[memory] bulk photo cleanup failed", { code: error instanceof Error ? error.name : "unknown" });
      }
    }
    return { ok: true };
  });

export const getGardenSettings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<SettingsRow>`
      select theme, reduced_motion, display_name, hide_locations
      from garden_settings where user_id = ${context.userId}
    `;
    return rowToSettings(rows[0]);
  });

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  reducedMotion: z.boolean(),
  displayName: z.string().trim().max(200),
  hideLocations: z.boolean(),
});

export const saveGardenSettings = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(settingsSchema)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into garden_settings (user_id, theme, reduced_motion, display_name, hide_locations, updated_at)
      values (${context.userId}, ${data.theme}, ${data.reducedMotion}, ${data.displayName}, ${data.hideLocations}, now())
      on conflict (user_id) do update set
        theme = excluded.theme,
        reduced_motion = excluded.reduced_motion,
        display_name = excluded.display_name,
        hide_locations = excluded.hide_locations,
        updated_at = now()
    `;
    return { ok: true };
  });

export interface MemoryReflection {
  id: string;
  memoryId: string;
  content: string;
  createdAt: string;
}

export const saveMemoryReflection = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ memoryId: z.string().min(1), content: z.string().trim().min(1).max(2000) }))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from memories where id = ${data.memoryId} and user_id = ${context.userId} limit 1
    `;
    if (!owned[0]) throw new Error("Memory not found");
    const rows = await sql<{ id: string; memory_id: string; content: string; created_at: string }>`
      insert into memory_reflections (user_id, memory_id, content)
      values (${context.userId}, ${data.memoryId}, ${data.content})
      returning id, memory_id, content, created_at
    `;
    const row = rows[0]!;
    return { id: row.id, memoryId: row.memory_id, content: row.content, createdAt: row.created_at } satisfies MemoryReflection;
  });

export const listMemoryReflections = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ memoryId: z.string().min(1).optional() }).optional())
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const memoryId = data?.memoryId;
    const rows = memoryId
      ? await sql<{ id: string; memory_id: string; content: string; created_at: string }>`
          select id, memory_id, content, created_at from memory_reflections
          where user_id = ${context.userId} and memory_id = ${memoryId}
          order by created_at desc limit 20
        `
      : await sql<{ id: string; memory_id: string; content: string; created_at: string }>`
          select id, memory_id, content, created_at from memory_reflections
          where user_id = ${context.userId}
          order by created_at desc limit 50
        `;
    return rows.map((row) => ({ id: row.id, memoryId: row.memory_id, content: row.content, createdAt: row.created_at } satisfies MemoryReflection));
  });

export const askGarden = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      question: z.string().trim().min(1).max(1000),
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(16).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    try {
      const sql = await getSql();
      const rows = await sql<MemoryRow>`
        select ${sql.unsafe(memorySelect)} from memories
        where user_id = ${context.userId}
        order by date desc, created_at desc limit 100
      `;
      const memories = await Promise.all(rows.map(rowToMemory));
      return chatWithGarden(memories, data.question, (data.history ?? []) as ChatMessage[]);
    } catch (error) {
      console.error("[chat] memory database unavailable", error);
      throw new Error("Garden memories are temporarily unavailable.");
    }
  });

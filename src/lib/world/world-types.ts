/** Minimal memory shape accepted by MemoryWorld. All fields optional except id + title. */
export interface MemoryWorldMemory {
  id: string;
  title: string;
  description?: string;
  date?: string;
  mood?: string;
  primaryEmotion?: string;
  secondaryEmotion?: string;
  sentiment?: "positive" | "neutral" | "negative" | string;
  emotionIntensity?: number;
  tags?: string[];
  favorite?: boolean;
  markerKind?: string;
  photo?: string | null;
  worldPosition?: { x: number; z: number };
}

export type WorldZoneId = "home" | "meadow" | "forest" | "lake";

export type WorldObjectType = "TREE" | "FLOWER" | "PLANT" | "STONE";

export interface ZoneBounds {
  id: WorldZoneId;
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  /** Center point for paths / labels */
  centerX: number;
  centerZ: number;
  groundColor: string;
  accentColor: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MemoryWorldConfig {
  memory: MemoryWorldMemory;
  zone: WorldZoneId;
  objectType: WorldObjectType;
  importance: number; // 1–10
  scale: number;
  position: Vec3;
  rotationY: number;
  variation: number; // 0–1 deterministic
}

export interface MemoryWorldProps {
  memories: MemoryWorldMemory[];
  onMemorySelect?: (memory: MemoryWorldMemory) => void;
  reducedMotion?: boolean;
  className?: string;
}

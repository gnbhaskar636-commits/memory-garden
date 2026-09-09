import { hashString } from "@/lib/utils";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Stable world position for a memory plant.
 * Hash of memory.id → deterministic x/z inside a soft garden ellipse.
 * Favorites sit slightly closer to the camera (lower z magnitude toward origin).
 */
export function memoryPosition(
  id: string,
  favorite: boolean,
  index: number,
  total: number,
): Vec3 {
  const h = hashString(id);
  const h2 = hashString(id + ":z");
  const h3 = hashString(id + ":y");

  // Spread across a gentle oval bed
  const angle = ((h % 360) / 360) * Math.PI * 2;
  const radiusBase = 2.2 + (h2 % 100) / 100 * 4.5; // 2.2 – 6.7
  // Pull denser plantings slightly inward so the bed doesn't explode
  const densityScale = total > 30 ? 0.85 : total > 15 ? 0.95 : 1;
  const radius = radiusBase * densityScale;

  let x = Math.cos(angle) * radius;
  let z = Math.sin(angle) * radius * 0.78;

  // Light grid bias so plants don't stack exactly on the same ray
  const ring = index % 5;
  x += ((ring - 2) * 0.15);
  z += (((h3 % 5) - 2) * 0.12);

  // Favorites drift slightly toward center / camera
  if (favorite) {
    x *= 0.82;
    z *= 0.82;
  }

  return { x, y: 0, z };
}

export function memoryScale(emotionIntensity: number | null, favorite: boolean): number {
  const intensity = emotionIntensity ?? 5;
  let s = 0.65 + (intensity / 10) * 0.55; // ~0.65 – 1.2
  if (favorite) s *= 1.15;
  return Math.min(1.45, Math.max(0.55, s));
}

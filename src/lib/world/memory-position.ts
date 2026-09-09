import { ZONES } from "./world-zones";
import { hashString, seededRange } from "./seeded-random";
import type { MemoryWorldMemory, Vec3, WorldZoneId } from "./world-types";

const CELL = 2.4;

/**
 * Stable position inside a zone from memory.id.
 * Uses a deterministic cell grid + sub-cell jitter so overlaps are rare
 * without physics. Same id → same coordinates across remounts.
 */
export function getStableMemoryPosition(
  memory: MemoryWorldMemory,
  zoneId: WorldZoneId,
): Vec3 {
  const zone = ZONES[zoneId];
  const margin = 2.4;
  const usableW = Math.max(CELL, zone.maxX - zone.minX - margin * 2);
  const usableD = Math.max(CELL, zone.maxZ - zone.minZ - margin * 2);
  const cols = Math.max(1, Math.floor(usableW / CELL));
  const rows = Math.max(1, Math.floor(usableD / CELL));

  const h = hashString(memory.id);
  const cellIndex = h % (cols * rows);
  const col = cellIndex % cols;
  const row = Math.floor(cellIndex / cols);

  const cellOriginX = zone.minX + margin + col * CELL;
  const cellOriginZ = zone.minZ + margin + row * CELL;

  const jx = seededRange(memory.id + ":jx", 0.35, CELL - 0.35);
  const jz = seededRange(memory.id + ":jz", 0.35, CELL - 0.35);

  let x = cellOriginX + jx;
  let z = cellOriginZ + jz;

  // Clamp hard inside zone
  x = Math.min(zone.maxX - margin, Math.max(zone.minX + margin, x));
  z = Math.min(zone.maxZ - margin, Math.max(zone.minZ + margin, z));

  // Soft push from zone center so paths stay clearer
  const dx = x - zone.centerX;
  const dz = z - zone.centerZ;
  const dist = Math.hypot(dx, dz) || 1;
  if (dist < 3.2) {
    const push = (3.2 - dist) * 0.4;
    x += (dx / dist) * push;
    z += (dz / dist) * push;
    x = Math.min(zone.maxX - margin, Math.max(zone.minX + margin, x));
    z = Math.min(zone.maxZ - margin, Math.max(zone.minZ + margin, z));
  }

  return { x, y: 0, z };
}

export function getStableRotationY(memoryId: string): number {
  return (hashString(memoryId + ":rot") % 360) * (Math.PI / 180);
}

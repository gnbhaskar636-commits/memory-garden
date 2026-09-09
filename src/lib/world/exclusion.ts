import { ZONES } from "./world-zones";
import type { Vec3 } from "./world-types";

/** Distance from point to segment (xz plane). */
function distPointToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLen2 = abx * abx + abz * abz;
  if (abLen2 < 1e-8) return Math.hypot(apx, apz);
  let t = (apx * abx + apz * abz) / abLen2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}

const PATHS: Array<[number, number, number, number]> = [
  [ZONES.home.centerX, ZONES.home.centerZ, ZONES.meadow.centerX, ZONES.meadow.centerZ],
  [ZONES.home.centerX, ZONES.home.centerZ, ZONES.forest.centerX, ZONES.forest.centerZ],
  [ZONES.home.centerX, ZONES.home.centerZ, ZONES.lake.centerX, ZONES.lake.centerZ],
];

const PATH_HALF_WIDTH = 1.1;
const LAKE_CENTER_X = ZONES.lake.centerX + 4;
const LAKE_CENTER_Z = ZONES.lake.centerZ;
const LAKE_RADIUS = 7.2;
const HOME_LANDMARK_RADIUS = 3.0;

/**
 * True if (x,z) should not receive decorative vegetation.
 */
export function isInsideExclusionArea(
  x: number,
  z: number,
  memoryPositions: Vec3[] = [],
): boolean {
  // Paths
  for (const [ax, az, bx, bz] of PATHS) {
    if (distPointToSegment(x, z, ax, az, bx, bz) < PATH_HALF_WIDTH) return true;
  }
  // Lake water
  if (Math.hypot(x - LAKE_CENTER_X, z - LAKE_CENTER_Z) < LAKE_RADIUS) return true;
  // Home landmark
  if (Math.hypot(x - ZONES.home.centerX, z - ZONES.home.centerZ) < HOME_LANDMARK_RADIUS) {
    return true;
  }
  // Near memory plants
  for (const p of memoryPositions) {
    if (Math.hypot(x - p.x, z - p.z) < 1.6) return true;
  }
  return false;
}

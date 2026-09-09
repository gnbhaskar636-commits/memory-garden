/**
 * Shared terrain height — must match ZoneGround vertex displacement
 * in WorldEnvironment so plants, decorations, and the player sit on the same surface.
 *
 * Designed with natural rolling knolls, a gentle lake basin, and protective
 * outer perimeter hills that naturally enclose the memory ecosystem.
 *
 * Multi-octave harmonics create gentle hills, small slopes, and
 * natural terrain variation while keeping the surface smooth enough
 * for comfortable walking.
 */
export function getTerrainHeight(worldX: number, worldZ: number): number {
  // 1. Multi-octave rolling terrain (several overlapping sine waves at different scales)
  //    Large-scale gentle hills
  const hill1 = Math.sin(worldX * 0.05 + worldZ * 0.06) * 0.42;
  const hill2 = Math.cos(worldX * 0.08 - worldZ * 0.04) * 0.28;
  //    Medium undulations
  const mid1 = Math.sin(worldX * 0.12 + 1.3) * 0.18;
  const mid2 = Math.cos(worldZ * 0.1 - 0.7) * 0.15;
  const mid3 = Math.sin(worldX * 0.09 + worldZ * 0.11 + 2.1) * 0.12;
  //    Small detail ripples (subtle ground texture)
  const detail1 = Math.cos(worldX * 0.22 - worldZ * 0.18) * 0.06;
  const detail2 = Math.sin(worldX * 0.28 + worldZ * 0.24 + 0.5) * 0.04;
  const detail3 = Math.cos(worldX * 0.35 + worldZ * 0.3 - 1.2) * 0.025;

  const baseNoise = hill1 + hill2 + mid1 + mid2 + mid3 + detail1 + detail2 + detail3;

  // 2. Lake depression around (33, 0) — smooth bowl shape
  const lakeDist = Math.hypot(worldX - 33, worldZ - 0);
  let lakeDepression = 0;
  if (lakeDist < 12) {
    const t = 1 - lakeDist / 12;
    lakeDepression = -0.55 * (t * t);
  }

  // 3. Meadow gentle dip — the meadow zone (west) has a slight valley feel
  let meadowDip = 0;
  if (worldX < -10) {
    const t = Math.min(1, (-worldX - 10) / 20);
    meadowDip = -0.15 * t * Math.sin(worldZ * 0.08 + 1.0);
  }

  // 4. Growth forest gentle elevation gradient towards north (Z > 12)
  const forestElev = worldZ > 12 ? Math.min(1.4, (worldZ - 12) * 0.04) : 0;

  // 5. Home garden slight raised plateau — the center feels like a gentle knoll
  const homeDist = Math.hypot(worldX, worldZ);
  let homePlateau = 0;
  if (homeDist < 8) {
    const t = 1 - homeDist / 8;
    homePlateau = 0.12 * t * t;
  }

  // 6. Natural perimeter ridges (boundary hills to naturally cradle the world)
  let boundaryElev = 0;
  const distFromCenter = Math.hypot(worldX - 2, worldZ - 12);
  if (distFromCenter > 34) {
    const rim = (distFromCenter - 34) / 14;
    boundaryElev = Math.min(3.5, rim * rim * 1.8);
  }

  // 7. Subtle path depressions — paths feel slightly worn into the ground
  let pathDepression = 0;
  const paths: Array<[number, number, number, number]> = [
    [0, 0, -28, 0],   // home -> meadow
    [0, 0, 0, 29],    // home -> forest
    [0, 0, 29, 0],    // home -> lake
  ];
  for (const [ax, az, bx, bz] of paths) {
    const dist = distToSegment(worldX, worldZ, ax, az, bx, bz);
    if (dist < 1.8) {
      const t = 1 - dist / 1.8;
      pathDepression = Math.min(pathDepression, -0.06 * t * t);
    }
  }

  return baseNoise + lakeDepression + meadowDip + forestElev + homePlateau + boundaryElev + pathDepression;
}

/** Distance from point to segment (xz plane). */
function distToSegment(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number,
): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const abLen2 = abx * abx + abz * abz;
  if (abLen2 < 1e-8) return Math.hypot(apx, apz);
  let t = (apx * abx + apz * abz) / abLen2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

export const PLAYER_EYE_HEIGHT = 1.65;

import { useMemo } from "react";
import { isInsideExclusionArea } from "@/lib/world/exclusion";
import { seededRange, seededUnit } from "@/lib/world/seeded-random";
import { getTerrainHeight } from "@/lib/world/terrain";
import type { Vec3 } from "@/lib/world/world-types";
import { WORLD_BOUNDS, ZONES } from "@/lib/world/world-zones";
import { EnvironmentTree } from "./EnvironmentTree";

export function EnvironmentVegetation({
  reducedMotion,
  memoryPositions = [],
}: {
  reducedMotion: boolean;
  memoryPositions?: Vec3[];
}) {
  const decor = useMemo(
    () => buildDecor(memoryPositions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memoryPositions.map((p) => `${p.x.toFixed(1)},${p.z.toFixed(1)}`).join("|")],
  );

  return (
    <group>
      {/* Outer perimeter boundary forest */}
      {decor.boundaryTrees.map((t) => (
        <EnvironmentTree
          key={t.seed}
          seed={t.seed}
          position={t.pos}
          scale={t.scale}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Zone-specific interior trees */}
      {decor.zoneTrees.map((t) => (
        <EnvironmentTree
          key={t.seed}
          seed={t.seed}
          position={t.pos}
          scale={t.scale}
          reducedMotion={reducedMotion}
        />
      ))}

      {/* Varied bushes — different shapes per type */}
      {decor.bushes.map((b) =>
        b.type === "round" ? (
          <mesh key={b.seed} position={b.pos} castShadow>
            <icosahedronGeometry args={[b.r, 1]} />
            <meshStandardMaterial color={b.color} roughness={0.82} flatShading />
          </mesh>
        ) : b.type === "tall" ? (
          <group key={b.seed} position={b.pos}>
            <mesh position={[0, b.r * 0.6, 0]} castShadow>
              <sphereGeometry args={[b.r * 0.7, 7, 6]} />
              <meshStandardMaterial color={b.color} roughness={0.82} />
            </mesh>
            <mesh position={[0, b.r * 0.1, 0]} castShadow>
              <sphereGeometry args={[b.r * 0.9, 7, 6]} />
              <meshStandardMaterial color={b.colorB} roughness={0.84} />
            </mesh>
          </group>
        ) : (
          <group key={b.seed} position={b.pos}>
            <mesh scale={[1.3, 0.7, 1.1]} castShadow>
              <icosahedronGeometry args={[b.r, 1]} />
              <meshStandardMaterial color={b.color} roughness={0.82} flatShading />
            </mesh>
          </group>
        ),
      )}

      {/* Lush grass tufts — varied blade counts and angles */}
      {decor.grass.map((g) => (
        <group key={g.seed} position={g.pos} rotation={[0, g.rot, 0]}>
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, 0.12]}>
            <coneGeometry args={[0.06, g.h, 4]} />
            <meshStandardMaterial color={g.col1} roughness={0.88} />
          </mesh>
          <mesh position={[0.05, 0.08, 0.02]} rotation={[0, 0.6, 0.28]}>
            <coneGeometry args={[0.05, g.h * 0.82, 4]} />
            <meshStandardMaterial color={g.col2} roughness={0.88} />
          </mesh>
          <mesh position={[-0.04, 0.07, -0.02]} rotation={[0, -0.5, -0.24]}>
            <coneGeometry args={[0.045, g.h * 0.72, 4]} />
            <meshStandardMaterial color={g.col3} roughness={0.88} />
          </mesh>
          {g.extra && (
            <mesh position={[0.02, 0.09, -0.05]} rotation={[0, 1.2, 0.15]}>
              <coneGeometry args={[0.04, g.h * 0.65, 4]} />
              <meshStandardMaterial color={g.col1} roughness={0.88} />
            </mesh>
          )}
        </group>
      ))}

      {/* Varied weathered rocks with mossy tops */}
      {decor.rocks.map((r) => (
        <group key={r.seed} position={r.pos} rotation={r.rot}>
          <mesh castShadow>
            <dodecahedronGeometry args={[r.s, 0]} />
            <meshStandardMaterial color={r.color} roughness={0.94} flatShading />
          </mesh>
          {/* Moss cap */}
          <mesh position={[0, r.s * 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[r.s * 0.55, 6]} />
            <meshStandardMaterial color={r.mossColor} roughness={0.96} />
          </mesh>
          {/* Secondary pebble nearby */}
          {r.hasPebble && (
            <mesh
              position={[r.s * 1.1, -r.s * 0.15, r.s * 0.4]}
              rotation={[0.3, 0.5, 0.1]}
            >
              <dodecahedronGeometry args={[r.s * 0.35, 0]} />
              <meshStandardMaterial color={r.color} roughness={0.94} flatShading />
            </mesh>
          )}
        </group>
      ))}

      {/* Meadow wildflowers — varied heights and colors */}
      {decor.flowers.map((f) => (
        <group key={f.seed} position={f.pos} rotation={[0, f.rot, f.lean]}>
          {/* Stem */}
          <mesh position={[0, f.stemH * 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.016, f.stemH, 4]} />
            <meshStandardMaterial color="#427339" roughness={0.85} />
          </mesh>
          {/* Flower head */}
          <mesh position={[0, f.stemH + 0.02, 0]}>
            <dodecahedronGeometry args={[f.headR, 0]} />
            <meshStandardMaterial
              color={f.color}
              emissive={f.glow}
              emissiveIntensity={0.25}
              roughness={0.5}
            />
          </mesh>
          {/* Optional leaf on stem */}
          {f.hasLeaf && (
            <mesh
              position={[0.04, f.stemH * 0.4, 0]}
              rotation={[0, 0, 0.5]}
              scale={[1.2, 0.4, 0.15]}
            >
              <sphereGeometry args={[0.05, 5, 5]} />
              <meshStandardMaterial color="#508042" roughness={0.8} />
            </mesh>
          )}
        </group>
      ))}

      {/* Lake shoreline reeds */}
      {decor.reeds.map((r) => (
        <group key={r.seed} position={r.pos} rotation={[0, r.rot, r.lean]}>
          <mesh position={[0, r.h * 0.5, 0]}>
            <cylinderGeometry args={[0.01, 0.018, r.h, 4]} />
            <meshStandardMaterial color="#4a6e45" roughness={0.8} />
          </mesh>
          {/* Reed head */}
          <mesh position={[0, r.h * 0.85, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.16, 5]} />
            <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Small ferns scattered in forest zone */}
      {decor.ferns.map((f) => (
        <group key={f.seed} position={f.pos} rotation={[0, f.rot, 0]}>
          {[0, 1, 2, 3].map((fi) => {
            const a = (fi / 4) * Math.PI * 2 + f.phase;
            return (
              <mesh
                key={fi}
                position={[Math.cos(a) * 0.06, 0.08, Math.sin(a) * 0.06]}
                rotation={[0.4 * Math.cos(a), a, 0.3 * Math.sin(a)]}
                scale={[1.2, 0.35, 0.15]}
              >
                <sphereGeometry args={[f.s, 5, 4]} />
                <meshStandardMaterial color={f.color} roughness={0.8} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* ─── Decor Data Builder ────────────────────────────── */

type TreeSpot = { seed: string; pos: [number, number, number]; scale: number };

function tryPlace(
  seed: string,
  x: number,
  z: number,
  memoryPositions: Vec3[],
  maxAttempts = 6,
): [number, number] | null {
  let cx = x;
  let cz = z;
  for (let a = 0; a < maxAttempts; a += 1) {
    if (!isInsideExclusionArea(cx, cz, memoryPositions)) {
      return [cx, cz];
    }
    cx = x + seededRange(`${seed}-nx-${a}`, -2.5, 2.5);
    cz = z + seededRange(`${seed}-nz-${a}`, -2.5, 2.5);
  }
  return null;
}

function atGround(x: number, z: number, yOff = 0): [number, number, number] {
  return [x, getTerrainHeight(x, z) + yOff, z];
}

function buildDecor(memoryPositions: Vec3[]) {
  const boundaryTrees: TreeSpot[] = [];

  // Inner boundary ring
  const ring1 = 33;
  for (let i = 0; i < 38; i += 1) {
    const a = (i / 38) * Math.PI * 2;
    const rad = ring1 + seededRange(`bt1-r-${i}`, -1.8, 2.2);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    const placed = tryPlace(`bt1-${i}`, x, z, memoryPositions, 3);
    if (!placed) continue;
    boundaryTrees.push({
      seed: `bt1-${i}`,
      pos: atGround(placed[0], placed[1]),
      scale: seededRange(`bt1-s-${i}`, 1.25, 1.9),
    });
  }

  // Outer boundary hillside ring
  const ring2 = 41;
  for (let i = 0; i < 30; i += 1) {
    const a = (i / 30) * Math.PI * 2 + 0.1;
    const rad = ring2 + seededRange(`bt2-r-${i}`, -1.5, 2.5);
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    boundaryTrees.push({
      seed: `bt2-${i}`,
      pos: atGround(x, z),
      scale: seededRange(`bt2-s-${i}`, 1.6, 2.4),
    });
  }

  // Dense Growth Forest canopy trees
  for (let i = 0; i < 22; i += 1) {
    const x = seededRange(`ft-x-${i}`, ZONES.forest.minX - 3, ZONES.forest.maxX + 3);
    const z = seededRange(`ft-z-${i}`, ZONES.forest.minZ + 1, ZONES.forest.maxZ + 4);
    const placed = tryPlace(`ft-${i}`, x, z, memoryPositions, 4);
    if (!placed) continue;
    boundaryTrees.push({
      seed: `ft-${i}`,
      pos: atGround(placed[0], placed[1]),
      scale: seededRange(`ft-s-${i}`, 1.35, 2.2),
    });
  }

  const zoneTrees: TreeSpot[] = [];
  const zoneSeeds = [
    { id: "home", n: 7, minX: ZONES.home.minX + 1, maxX: ZONES.home.maxX - 1, minZ: ZONES.home.minZ + 1, maxZ: ZONES.home.maxZ - 1 },
    { id: "meadow", n: 6, minX: ZONES.meadow.minX + 1, maxX: ZONES.meadow.maxX - 1, minZ: ZONES.meadow.minZ + 1, maxZ: ZONES.meadow.maxZ - 1 },
    { id: "forest", n: 16, minX: ZONES.forest.minX + 1, maxX: ZONES.forest.maxX - 1, minZ: ZONES.forest.minZ + 1, maxZ: ZONES.forest.maxZ - 1 },
    { id: "lake", n: 8, minX: ZONES.lake.minX + 1, maxX: ZONES.lake.maxX - 1, minZ: ZONES.lake.minZ + 1, maxZ: ZONES.lake.maxZ - 1 },
  ];
  for (const z of zoneSeeds) {
    for (let i = 0; i < z.n; i += 1) {
      const x = seededRange(`zt-${z.id}-x-${i}`, z.minX, z.maxX);
      const zz = seededRange(`zt-${z.id}-z-${i}`, z.minZ, z.maxZ);
      const placed = tryPlace(`zt-${z.id}-${i}`, x, zz, memoryPositions);
      if (!placed) continue;
      zoneTrees.push({
        seed: `zt-${z.id}-${i}`,
        pos: atGround(placed[0], placed[1]),
        scale: seededRange(`zt-${z.id}-s-${i}`, 0.9, 1.6),
      });
    }
  }

  // ── Bushes with shape variety ──
  const bushColors = ["#3c6e39", "#497d43", "#2f5c2d", "#538a4c", "#456b3a"];
  const bushTypes = ["round", "tall", "flat"] as const;
  const bushes: Array<{
    seed: string;
    pos: [number, number, number];
    r: number;
    color: string;
    colorB: string;
    type: "round" | "tall" | "flat";
  }> = [];
  for (let i = 0; i < 52; i += 1) {
    const x = seededRange(`bx-${i}`, WORLD_BOUNDS.minX + 2, WORLD_BOUNDS.maxX - 2);
    const z = seededRange(`bz-${i}`, WORLD_BOUNDS.minZ + 2, WORLD_BOUNDS.maxZ - 2);
    const placed = tryPlace(`bush-${i}`, x, z, memoryPositions);
    if (!placed) continue;
    const colIdx = i % bushColors.length;
    bushes.push({
      seed: `bush-${i}`,
      pos: atGround(placed[0], placed[1], seededRange(`by-${i}`, 0.1, 0.26)),
      r: seededRange(`br-${i}`, 0.2, 0.48),
      color: bushColors[colIdx]!,
      colorB: bushColors[(colIdx + 2) % bushColors.length]!,
      type: bushTypes[i % bushTypes.length]!,
    });
  }

  // ── Grass tufts with variation ──
  const grassColors1 = ["#5e994e", "#549044", "#6aa55a"];
  const grassColors2 = ["#6fa85c", "#65a052", "#78b264"];
  const grassColors3 = ["#4f8540", "#488038", "#5a9048"];
  const grass: Array<{
    seed: string;
    pos: [number, number, number];
    rot: number;
    h: number;
    col1: string;
    col2: string;
    col3: string;
    extra: boolean;
  }> = [];
  for (let i = 0; i < 80; i += 1) {
    const x = seededRange(`gx-${i}`, WORLD_BOUNDS.minX + 1, WORLD_BOUNDS.maxX - 1);
    const z = seededRange(`gz-${i}`, WORLD_BOUNDS.minZ + 1, WORLD_BOUNDS.maxZ - 1);
    const placed = tryPlace(`grass-${i}`, x, z, memoryPositions, 3);
    if (!placed) continue;
    grass.push({
      seed: `grass-${i}`,
      pos: atGround(placed[0], placed[1]),
      rot: seededUnit(`grot-${i}`) * Math.PI * 2,
      h: seededRange(`gh-${i}`, 0.16, 0.28),
      col1: grassColors1[i % grassColors1.length]!,
      col2: grassColors2[i % grassColors2.length]!,
      col3: grassColors3[i % grassColors3.length]!,
      extra: i % 4 === 0,
    });
  }

  // ── Rocks with more variety ──
  const rockColors = ["#736f66", "#7a7568", "#686460", "#807a6e", "#6e6b64"];
  const mossColors = ["#4f6b3e", "#557545", "#486b38", "#5a7d44"];
  const rocks: Array<{
    seed: string;
    pos: [number, number, number];
    rot: [number, number, number];
    s: number;
    color: string;
    mossColor: string;
    hasPebble: boolean;
  }> = [];
  for (let i = 0; i < 32; i += 1) {
    const x = seededRange(`rx-${i}`, WORLD_BOUNDS.minX + 1, WORLD_BOUNDS.maxX - 1);
    const z = seededRange(`rz-${i}`, WORLD_BOUNDS.minZ + 1, WORLD_BOUNDS.maxZ - 1);
    const placed = tryPlace(`rock-${i}`, x, z, memoryPositions, 3);
    if (!placed) continue;
    rocks.push({
      seed: `rock-${i}`,
      pos: atGround(placed[0], placed[1], seededRange(`ry-${i}`, 0.06, 0.18)),
      rot: [
        seededUnit(`rrotx-${i}`) * 0.5,
        seededUnit(`rroty-${i}`) * Math.PI,
        seededUnit(`rrotz-${i}`) * 0.4,
      ],
      s: seededRange(`rs-${i}`, 0.2, 0.58),
      color: rockColors[i % rockColors.length]!,
      mossColor: mossColors[i % mossColors.length]!,
      hasPebble: i % 3 === 0,
    });
  }

  // ── Wildflowers (meadow heavy, some elsewhere) ──
  const flowerPalette = [
    { color: "#f472b6", glow: "#fb7185" },
    { color: "#fbbf24", glow: "#f59e0b" },
    { color: "#c084fc", glow: "#a855f7" },
    { color: "#38bdf8", glow: "#0ea5e9" },
    { color: "#fb923c", glow: "#ea580c" },
    { color: "#f9a8d4", glow: "#ec4899" },
    { color: "#a3e635", glow: "#84cc16" },
  ];
  const flowers: Array<{
    seed: string;
    pos: [number, number, number];
    color: string;
    glow: string;
    rot: number;
    lean: number;
    stemH: number;
    headR: number;
    hasLeaf: boolean;
  }> = [];
  for (let i = 0; i < 55; i += 1) {
    // 70% meadow, 30% spread elsewhere
    const inMeadow = i < 38;
    const x = inMeadow
      ? seededRange(`flx-${i}`, ZONES.meadow.minX, ZONES.meadow.maxX)
      : seededRange(`flx-${i}`, WORLD_BOUNDS.minX + 3, WORLD_BOUNDS.maxX - 3);
    const z = inMeadow
      ? seededRange(`flz-${i}`, ZONES.meadow.minZ, ZONES.meadow.maxZ)
      : seededRange(`flz-${i}`, WORLD_BOUNDS.minZ + 3, WORLD_BOUNDS.maxZ - 3);
    const placed = tryPlace(`fl-${i}`, x, z, memoryPositions, 4);
    if (!placed) continue;
    const pal = flowerPalette[i % flowerPalette.length]!;
    flowers.push({
      seed: `fl-${i}`,
      pos: atGround(placed[0], placed[1]),
      color: pal.color,
      glow: pal.glow,
      rot: seededUnit(`flrot-${i}`) * Math.PI * 2,
      lean: seededRange(`fllean-${i}`, -0.08, 0.08),
      stemH: seededRange(`flh-${i}`, 0.18, 0.3),
      headR: seededRange(`flhr-${i}`, 0.05, 0.08),
      hasLeaf: i % 3 === 0,
    });
  }

  // ── Reeds around lake ──
  const reeds: Array<{
    seed: string;
    pos: [number, number, number];
    rot: number;
    lean: number;
    h: number;
  }> = [];
  const lakeCx = ZONES.lake.centerX + 4;
  const lakeCz = ZONES.lake.centerZ;
  for (let i = 0; i < 22; i += 1) {
    const a = (i / 22) * Math.PI * 2 + seededRange(`rd-a-${i}`, -0.2, 0.2);
    const dist = 7.4 + seededRange(`rd-d-${i}`, 0.1, 1.4);
    const rx = lakeCx + Math.cos(a) * dist;
    const rz = lakeCz + Math.sin(a) * dist;
    reeds.push({
      seed: `reed-${i}`,
      pos: atGround(rx, rz),
      rot: seededUnit(`rdrot-${i}`) * Math.PI * 2,
      lean: seededRange(`rdlean-${i}`, -0.06, 0.06),
      h: seededRange(`rdh-${i}`, 0.55, 0.85),
    });
  }

  // ── Forest ferns ──
  const ferns: Array<{
    seed: string;
    pos: [number, number, number];
    rot: number;
    phase: number;
    s: number;
    color: string;
  }> = [];
  const fernColors = ["#3a6e3a", "#4a7d42", "#2f5e2e", "#558a48"];
  for (let i = 0; i < 28; i += 1) {
    const x = seededRange(`fx-${i}`, ZONES.forest.minX, ZONES.forest.maxX);
    const z = seededRange(`fz-${i}`, ZONES.forest.minZ, ZONES.forest.maxZ);
    const placed = tryPlace(`fern-${i}`, x, z, memoryPositions, 3);
    if (!placed) continue;
    ferns.push({
      seed: `fern-${i}`,
      pos: atGround(placed[0], placed[1]),
      rot: seededUnit(`frot-${i}`) * Math.PI * 2,
      phase: seededUnit(`fph-${i}`) * Math.PI * 2,
      s: seededRange(`fs-${i}`, 0.08, 0.14),
      color: fernColors[i % fernColors.length]!,
    });
  }

  return { boundaryTrees, zoneTrees, bushes, grass, rocks, flowers, reeds, ferns };
}

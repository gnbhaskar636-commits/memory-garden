import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import type { MemoryWorldMemory } from "@/lib/world/world-types";

// Biophilic palettes: Emerald grove, Sakura dawn, Amber milestone, Mystic twilight
const PALETTES = [
  {
    leafA: "#4a9448",
    leafB: "#6bbb58",
    leafC: "#96d97c",
    trunk: "#4a3528",
    bark: "#38261b",
    vein: "#72f2b4",
    bud: "#d1fae5",
  },
  {
    leafA: "#427a4d",
    leafB: "#df789d",
    leafC: "#f7b2cb",
    trunk: "#3d2b24",
    bark: "#2d1e18",
    vein: "#f472b6",
    bud: "#fce7f3",
  },
  {
    leafA: "#5a8848",
    leafB: "#d97736",
    leafC: "#f5a742",
    trunk: "#523624",
    bark: "#3d2618",
    vein: "#fbbf24",
    bud: "#fef3c7",
  },
  {
    leafA: "#2d6359",
    leafB: "#3b8e7e",
    leafC: "#67d4c0",
    trunk: "#30393b",
    bark: "#222a2c",
    vein: "#38bdf8",
    bud: "#e0f2fe",
  },
];

export interface MemoryTreeProps {
  scale: number;
  variation: number;
  reducedMotion: boolean;
  highlighted?: boolean;
  growthProgress?: number;
  memory?: MemoryWorldMemory;
}

/**
 * Premium Procedural Memory Tree:
 * - Continuous curved trunk with a broad root flare
 * - Primary and secondary branch tubes for a readable silhouette
 * - Multi-layered stylized canopy clusters with organic depth
 * - Embedded biophilic crystal blossom buds
 * - Organic real-time growth transitions
 */
export function MemoryTree({
  scale,
  variation,
  reducedMotion,
  highlighted = false,
  growthProgress = 1,
  memory,
}: MemoryTreeProps) {
  const canopyRef = useRef<Group>(null);
  const veinRef = useRef<Mesh>(null);
  const rootVeinRef = useRef<Mesh>(null);

  // Palette selection derived deterministically from variation or memory mood/sentiment
  const hasPhoto = Boolean(memory?.photo);
  const palette = useMemo(() => {
    if (memory?.favorite) return PALETTES[2]!; // Amber golden milestone
    if (memory?.sentiment === "positive" && memory?.mood?.match(/joy|love|grateful/i)) {
      return PALETTES[1]!; // Sakura dawn
    }
    const idx = Math.floor(variation * PALETTES.length) % PALETTES.length;
    const base = PALETTES[idx]!;
    // Subtly brighten colors when memory has a photo, making it easier to discover
    if (hasPhoto) {
      const brighten = (c: string) => {
        const hex = parseInt(c.slice(1), 16);
        const r = Math.min(255, ((hex >> 16) & 255) * 1.15);
        const g = Math.min(255, ((hex >> 8) & 255) * 1.15);
        const b = Math.min(255, (hex & 255) * 1.15);
        return `#${(0x1000000 + r * 65536 + g * 256 + b).toString(16).slice(1)}`;
      };
      return {
        leafA: brighten(base.leafA),
        leafB: brighten(base.leafB),
        leafC: brighten(base.leafC),
        trunk: brighten(base.trunk),
        bark: brighten(base.bark),
        vein: brighten(base.vein),
        bud: brighten(base.bud),
      };
    }
    return base;
  }, [variation, memory, hasPhoto]);

  const gp = Math.max(0, Math.min(1, growthProgress));
  // Smooth cubic ease-out
  const t = gp * gp * (3 - 2 * gp);
  const maturity = useMemo(() => {
    if (!memory?.date) return 0.94;
    const planted = Date.parse(memory.date);
    if (!Number.isFinite(planted)) return 0.94;
    const years = Math.max(0, (Date.now() - planted) / (1000 * 60 * 60 * 24 * 365));
    return Math.min(1.12, 0.94 + years * 0.035);
  }, [memory?.date]);

  // Procedural tree architecture
  const treeModel = useMemo(() => {
    const trunkH = 0.65 + variation * 0.45;
    const trunkR = 0.065 + variation * 0.035;
    const leanAngle = (variation - 0.5) * 0.22;
    const twist = variation * Math.PI * 2;

    // Root runners extend outward from the flare instead of ending as cones.
    const rootCount = 5;
    const roots: Array<{ a: number; len: number; rad: number; curve: THREE.CatmullRomCurve3 }> = [];
    for (let i = 0; i < rootCount; i += 1) {
      const a = (i / rootCount) * Math.PI * 2 + twist;
      const len = trunkR * (2.8 + variation * 1.2);
      const lift = 0.08 + Math.sin(i * 2.2 + variation * 4) * 0.025;
      roots.push({
        a,
        len,
        rad: trunkR * 0.65,
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.08, 0),
          new THREE.Vector3(len * 0.3, lift, 0),
          new THREE.Vector3(len * 0.72, 0.035, 0),
          new THREE.Vector3(len, 0.012, 0),
        ]),
      });
    }

    // Branch architecture (3 to 5 main branches)
    const branchCount = 3 + Math.floor(variation * 3);
    const branches: Array<{
      y: number;
      yaw: number;
      pitch: number;
      len: number;
      r: number;
      twigAngle: number;
      curve: THREE.CatmullRomCurve3;
      secondaries: THREE.CatmullRomCurve3[];
    }> = [];

    for (let i = 0; i < branchCount; i += 1) {
      const yaw = (i / branchCount) * Math.PI * 2 + variation * 1.8;
      const pitch = 0.58 + ((i % 2) * 0.2) + variation * 0.2;
      const r = trunkR * 0.48;
      const len = 0.38 + variation * 0.28 + ((i % 3) * 0.08);
      const bend = Math.sin(i * 2.7 + variation * 5) * len * 0.18;
      const secondaryCount = 2;
      const secondaries = Array.from({ length: secondaryCount }, (_, secondaryIndex) => {
        const side = secondaryIndex === 0 ? -1 : 1;
        const offset = len * (0.48 + secondaryIndex * 0.16);
        const spread = side * len * (0.18 + variation * 0.08);
        return new THREE.CatmullRomCurve3([
          new THREE.Vector3(bend * 0.45, offset, 0),
          new THREE.Vector3(spread * 0.35, offset + len * 0.1, side * len * 0.04),
          new THREE.Vector3(spread, offset + len * 0.22, side * len * 0.08),
        ]);
      });
      branches.push({
        y: trunkH * (0.52 + (i / branchCount) * 0.36),
        yaw,
        pitch,
        len,
        r,
        twigAngle: 0.35 + (i % 2) * 0.25,
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(bend * 0.35, len * 0.32, 0),
          new THREE.Vector3(bend, len * 0.72, 0),
          new THREE.Vector3(bend * 0.7, len, 0),
        ]),
        secondaries,
      });
    }

    // Three foliage layers keep the crown full from the ground and from above.
    const clusters: Array<{
      x: number;
      y: number;
      z: number;
      r: number;
      color: string;
      hasBud?: boolean;
    }> = [];

    // Central crown
    clusters.push({
      x: 0,
      y: trunkH + 0.22,
      z: 0,
      r: 0.44 + variation * 0.16,
      color: palette.leafA,
      hasBud: true,
    });

    const lowerLayer = 3 + Math.floor(variation * 2);
    for (let i = 0; i < lowerLayer; i += 1) {
      const a = (i / lowerLayer) * Math.PI * 2 + twist * 0.6;
      const dist = 0.22 + variation * 0.12;
      clusters.push({
        x: Math.cos(a) * dist,
        y: trunkH - 0.02 + (i % 2) * 0.08,
        z: Math.sin(a) * dist,
        r: 0.25 + variation * 0.06,
        color: i % 2 === 0 ? palette.leafA : palette.leafB,
        hasBud: false,
      });
    }

    // Satellite clusters creating a full 3D silhouette
    const satellites = 5 + Math.floor(variation * 3);
    for (let i = 0; i < satellites; i += 1) {
      const a = (i / satellites) * Math.PI * 2 + twist;
      const dist = 0.32 + variation * 0.22;
      const col = i % 3 === 0 ? palette.leafC : i % 2 === 0 ? palette.leafB : palette.leafA;
      clusters.push({
        x: Math.cos(a) * dist,
        y: trunkH + 0.08 + (i % 3) * 0.14,
        z: Math.sin(a) * dist,
        r: 0.26 + (i % 3) * 0.06 + variation * 0.08,
        color: col,
        hasBud: i % 2 === 0,
      });
    }

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(leanAngle * 0.18, trunkH * 0.3, 0),
      new THREE.Vector3(-leanAngle * 0.12, trunkH * 0.66, 0),
      new THREE.Vector3(leanAngle * 0.3, trunkH, 0),
    ]);

    return { trunkH, trunkR, leanAngle, roots, branches, clusters, trunkCurve };
  }, [variation, palette]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const time = clock.elapsedTime;

    // Organic canopy sway
    if (canopyRef.current) {
      canopyRef.current.rotation.y = Math.sin(time * 0.25 + variation * 6) * 0.04;
      canopyRef.current.rotation.z = Math.sin(time * 0.2 + variation * 4) * 0.02;
    }

    // Pulsing bioluminescent energy vein
    if (veinRef.current) {
      const mat = veinRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.45 + Math.sin(time * 1.5 + variation * 3) * 0.2 + (hasPhoto ? Math.sin(time * 2.7) * 0.05 : 0);
    }
    if (rootVeinRef.current) {
      const mat = rootVeinRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(time * 1.8 + variation * 4) * 0.15 + (hasPhoto ? Math.sin(time * 3.2) * 0.03 : 0);
    }
  });

  // Stage 1: Seed / Sprout stage (t < 0.14)
  if (t < 0.14) {
    const seedScale = scale * (0.35 + t * 4) * (highlighted ? 1.15 : 1);
    return (
      <group scale={seedScale}>
        {/* Glowing seed sphere */}
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshStandardMaterial
            color={palette.bud}
            emissive={palette.vein}
            emissiveIntensity={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Expanding light ring on ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
          <ringGeometry args={[0.08, 0.22, 16]} />
          <meshBasicMaterial
            color={palette.vein}
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    );
  }

  // Stage 2: Young sapling (0.14 <= t < 0.42)
  if (t < 0.42) {
    const sNorm = (t - 0.14) / 0.28;
    const sapScale = scale * (0.42 + sNorm * 0.42) * (highlighted ? 1.15 : 1);
    return (
      <group scale={sapScale}>
        {/* Curving green sapling stem */}
        <mesh position={[0, 0.22 * sNorm, 0]}>
          <cylinderGeometry args={[0.02, 0.035, 0.44 * sNorm, 6]} />
          <meshStandardMaterial color="#4a733e" roughness={0.8} />
        </mesh>
        {/* Budding leaves */}
        <mesh position={[0.08, 0.38 * sNorm, 0]} rotation={[0, 0, 0.4]}>
          <sphereGeometry args={[0.1 * sNorm, 8, 8]} />
          <meshStandardMaterial color={palette.leafB} roughness={0.7} />
        </mesh>
        <mesh position={[-0.07, 0.32 * sNorm, 0.04]} rotation={[0, 0, -0.4]}>
          <sphereGeometry args={[0.08 * sNorm, 8, 8]} />
          <meshStandardMaterial color={palette.leafA} roughness={0.7} />
        </mesh>
        {/* Glowing tip */}
        <mesh position={[0, 0.45 * sNorm, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial
            color={palette.bud}
            emissive={palette.vein}
            emissiveIntensity={0.7}
          />
        </mesh>
      </group>
    );
  }

  // Stage 3: Maturing / Full Tree (t >= 0.42)
  const growthFactor = t < 0.85 ? 0.65 + ((t - 0.42) / 0.43) * 0.35 : 1;
  const canopyGrowth = t < 0.85 ? 0.48 + ((t - 0.42) / 0.43) * 0.52 : 1;
  const treeScale = scale * growthFactor * maturity * (highlighted ? 1.12 : 1);

  return (
    <group scale={treeScale}>
      {/* Broad root flare anchors the trunk before the visible root runners. */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[0, treeModel.trunkH * 0.08, 0]}>
          <coneGeometry
            args={[treeModel.trunkR * 1.9, treeModel.trunkH * 0.22, 9]}
          />
          <meshStandardMaterial color={palette.trunk} roughness={0.94} />
        </mesh>
        {treeModel.roots.map((r, i) => (
          <mesh
            key={`root-${i}`}
            rotation={[0, r.a, 0]}
          >
            <tubeGeometry args={[r.curve, 5, r.rad * 0.42, 6, false]} />
            <meshStandardMaterial color={palette.bark} roughness={0.96} />
          </mesh>
        ))}
      </group>

      {/* Bioluminescent root ring on soil */}
      <mesh
        ref={rootVeinRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.015, 0]}
      >
        <ringGeometry args={[treeModel.trunkR * 1.2, treeModel.trunkR * 1.8, 16]} />
        <meshBasicMaterial
          color={palette.vein}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Curved Multi-Segment Trunk */}
      <group rotation={[0, 0, treeModel.leanAngle]}>
        {/* One continuous bent trunk keeps the silhouette organic. */}
        <mesh>
          <tubeGeometry args={[treeModel.trunkCurve, 8, treeModel.trunkR, 7, false]} />
          <meshStandardMaterial color={palette.trunk} roughness={0.92} />
        </mesh>

        {/* Bioluminescent Energy Vein running along trunk seam */}
        <mesh
          ref={veinRef}
          position={[treeModel.trunkR * 0.7, treeModel.trunkH * 0.48, 0]}
          rotation={[0, 0, 0.05]}
        >
          <cylinderGeometry
            args={[treeModel.trunkR * 0.12, treeModel.trunkR * 0.15, treeModel.trunkH * 0.82, 4]}
          />
          <meshStandardMaterial
            color={palette.vein}
            emissive={palette.vein}
            emissiveIntensity={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* Branches */}
        {treeModel.branches.map((b, i) => (
          <group key={`br-${i}`} position={[0, b.y, 0]} rotation={[0, b.yaw, 0]}>
            <group rotation={[b.pitch, 0, 0]}>
              {/* Primary branch */}
              <mesh>
                <tubeGeometry args={[b.curve, 5, b.r * 0.7, 5, false]} />
                <meshStandardMaterial color={palette.trunk} roughness={0.9} />
              </mesh>
              {/* Two smaller secondary branches create depth in the crown. */}
              {b.secondaries.map((secondary, secondaryIndex) => (
                <mesh key={`secondary-${i}-${secondaryIndex}`}>
                  <tubeGeometry args={[secondary, 4, b.r * 0.28, 4, false]} />
                  <meshStandardMaterial color={palette.bark} roughness={0.92} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>

      {/* Stylized Canopy Clusters */}
      <group ref={canopyRef} scale={canopyGrowth}>
        {treeModel.clusters.map((c, i) => (
          <group key={`canopy-${i}`} position={[c.x, c.y, c.z]}>
            {/* Layered, softly rounded foliage volume */}
            <mesh scale={[1.12, 0.88, 1]}>
              <sphereGeometry args={[c.r, 12, 8]} />
              <meshStandardMaterial color={c.color} roughness={0.82} />
            </mesh>
            {/* Embedded crystal blossom bud */}
            {c.hasBud && (
              <mesh position={[0, c.r * 0.85, 0]}>
                <octahedronGeometry args={[c.r * 0.22, 0]} />
                <meshStandardMaterial
                  color={palette.bud}
                  emissive={palette.vein}
                  emissiveIntensity={0.65}
                  roughness={0.2}
                  flatShading
                />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}

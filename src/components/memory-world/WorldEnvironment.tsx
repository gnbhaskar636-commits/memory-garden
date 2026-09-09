import { Sky } from "@react-three/drei";
import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, Points } from "three";
import * as THREE from "three";
import { seededRange, seededUnit } from "@/lib/world/seeded-random";
import { getTerrainHeight } from "@/lib/world/terrain";
import type { Vec3 } from "@/lib/world/world-types";
import { ZONE_LIST, ZONES } from "@/lib/world/world-zones";
import { EnvironmentVegetation } from "./EnvironmentVegetation";

/* ─── Color utilities ──────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/* ─── Terrain Ground Colors ─────────────────────────── */

const COL_GRASS_A = hexToRgb("#6b8f58"); // rich green
const COL_GRASS_B = hexToRgb("#8aaa6c"); // pale green
const COL_SOIL = hexToRgb("#8b7d5e");    // warm earth
const COL_MOSS = hexToRgb("#4d6e3d");    // deep moss
const COL_LAKE_SHORE = hexToRgb("#6a867d"); // damp shore

/**
 * Procedural vertex color for a world position — blends between grass, soil,
 * moss and path tones based on position, height, and zone affinity.
 */
function getGroundColor(
  wx: number, wz: number, height: number,
): [number, number, number] {
  // Base grass color with subtle spatial variation
  const noise = Math.sin(wx * 0.18 + wz * 0.14) * 0.5 + 0.5;
  let col = lerpColor(COL_GRASS_A, COL_GRASS_B, noise);

  // Mix soil on higher elevations (hills/slopes)
  if (height > 0.3) {
    const soilT = Math.min(1, (height - 0.3) / 1.2);
    col = lerpColor(col, COL_SOIL, soilT * 0.45);
  }

  // Forest zone gets deeper moss
  if (wz > 12) {
    const forestT = Math.min(1, (wz - 12) / 20);
    col = lerpColor(col, COL_MOSS, forestT * 0.55);
  }

  // Meadow zone gets brighter, warmer grass
  if (wx < -10) {
    const meadowT = Math.min(1, (-wx - 10) / 22);
    const meadowCol = lerpColor(COL_GRASS_B, hexToRgb("#a4b87a"), 0.5);
    col = lerpColor(col, meadowCol, meadowT * 0.4);
  }

  // Lake proximity gets shore tones
  const lakeDist = Math.hypot(wx - 37, wz);
  if (lakeDist < 12) {
    const shoreT = Math.max(0, 1 - lakeDist / 12);
    col = lerpColor(col, COL_LAKE_SHORE, shoreT * 0.5);
  }

  // Fine-scale detail variation to break tiling
  const micro = Math.sin(wx * 0.6 + wz * 0.48) * 0.05;
  col = [
    Math.max(0, Math.min(1, col[0] + micro)),
    Math.max(0, Math.min(1, col[1] + micro * 0.7)),
    Math.max(0, Math.min(1, col[2] + micro * 0.3)),
  ];

  return col;
}

/* ─── Zone Ground Mesh ──────────────────────────────── */

function ZoneGround({
  minX,
  maxX,
  minZ,
  maxZ,
}: {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  color: string; // kept in props for compatibility, no longer used
}) {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const geom = useMemo(() => {
    // Higher segment count for smoother terrain with the richer noise function
    const segsX = Math.max(48, Math.round(w * 2.5));
    const segsZ = Math.max(48, Math.round(d * 2.5));
    const g = new THREE.PlaneGeometry(w, d, segsX, segsZ);
    const pos = g.attributes.position!;

    // Add vertex colors for natural ground variation
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i += 1) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      const worldX = cx + lx;
      const worldZ = cz - ly;
      const h = getTerrainHeight(worldX, worldZ);
      pos.setZ(i, h);

      const col = getGroundColor(worldX, worldZ, h);
      colors[i * 3] = col[0];
      colors[i * 3 + 1] = col[1];
      colors[i * 3 + 2] = col[2];
    }

    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [w, d, cx, cz]);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[cx, 0, cz]}
      geometry={geom}
      receiveShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.92}
        metalness={0.02}
        flatShading={false}
      />
    </mesh>
  );
}

/* ─── Atmospheric Particles ─────────────────────────── */

function AtmosphericParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const count = 80;
  const pointsRef = useRef<Points>(null);

  const [positions, speeds, phases] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const phs = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const x = seededRange(`spore-x-${i}`, -40, 40);
      const z = seededRange(`spore-z-${i}`, -20, 45);
      const groundY = getTerrainHeight(x, z);
      const y = groundY + 0.3 + seededRange(`spore-height-${i}`, 0, 4.5);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      spd[i] = seededRange(`spore-speed-${i}`, 0.1, 0.24);
      phs[i] = seededUnit(`spore-phase-${i}`) * Math.PI * 2;
    }

    return [pos, spd, phs];
  }, [count]);

  useFrame(({ clock }, dt) => {
    if (reducedMotion || !pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const t = clock.elapsedTime;

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      let x = array[idx]!;
      let y = array[idx + 1]!;
      let z = array[idx + 2]!;

      y += speeds[i]! * dt;
      x += Math.sin(t * 0.35 + phases[i]!) * 0.007;
      z += Math.cos(t * 0.3 + phases[i]!) * 0.007;

      const groundY = getTerrainHeight(x, z);
      if (y > groundY + 6) {
        y = groundY + 0.2 + seededRange(`spore-reset-${i}`, 0, 0.5);
      }

      array[idx] = x;
      array[idx + 1] = y;
      array[idx + 2] = z;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#e8f0c0"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Organic Stepping-Stone Paths ──────────────────── */

function OrganicPath({
  from,
  to,
  steps = 20,
}: {
  from: [number, number];
  to: [number, number];
  steps?: number;
}) {
  const pavers = useMemo(() => {
    const list: Array<{
      x: number;
      y: number;
      z: number;
      rx: number;
      rz: number;
      scale: number;
      rot: number;
      isDark: boolean;
    }> = [];

    const [x0, z0] = from;
    const [x1, z1] = to;

    // Two control points for a natural S-curve
    const dx = x1 - x0;
    const dz = z1 - z0;
    const perpX = -dz * 0.14;
    const perpZ = dx * 0.14;
    const midX1 = x0 + dx * 0.33 + perpX;
    const midZ1 = z0 + dz * 0.33 + perpZ;
    const midX2 = x0 + dx * 0.66 - perpX * 0.6;
    const midZ2 = z0 + dz * 0.66 - perpZ * 0.6;

    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      // Cubic Bezier for smoother natural curvature
      const omt = 1 - t;
      const px =
        omt * omt * omt * x0 +
        3 * omt * omt * t * midX1 +
        3 * omt * t * t * midX2 +
        t * t * t * x1;
      const pz =
        omt * omt * omt * z0 +
        3 * omt * omt * t * midZ1 +
        3 * omt * t * t * midZ2 +
        t * t * t * z1;
      const py = getTerrainHeight(px, pz) + 0.018;

      // Natural scatter around path center
      const jx = Math.sin(i * 3.7 + t * 2.1) * 0.28;
      const jz = Math.cos(i * 4.1 + t * 1.8) * 0.28;

      list.push({
        x: px + jx,
        y: py,
        z: pz + jz,
        rx: 0.48 + Math.sin(i * 1.8) * 0.14,
        rz: 0.42 + Math.cos(i * 2.3) * 0.12,
        scale: 0.82 + Math.sin(i * 1.5) * 0.18,
        rot: Math.atan2(z1 - z0, x1 - x0) + Math.sin(i * 1.3) * 0.25,
        isDark: i % 3 === 0,
      });
    }

    return list;
  }, [from, to, steps]);

  return (
    <group>
      {pavers.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} rotation={[0, p.rot, 0]}>
          {/* Weathered stone paver */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[p.rx * p.scale, 7]} />
            <meshStandardMaterial
              color={p.isDark ? "#9a8e7a" : "#b0a590"}
              roughness={0.96}
            />
          </mesh>
          {/* Soft moss edge where stone meets grass */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
            <ringGeometry
              args={[
                p.rx * p.scale * 0.8,
                p.rx * p.scale * 1.12,
                7,
              ]}
            />
            <meshStandardMaterial
              color="#5a7a48"
              roughness={0.95}
              transparent
              opacity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ─── Reflection Lake ───────────────────────────────── */

function LakeWater({ reducedMotion }: { reducedMotion: boolean }) {
  const waterRef = useRef<Mesh>(null);
  const rippleRef = useRef<Mesh>(null);
  const z = ZONES.lake;
  const cx = z.centerX + 4;
  const cz = z.centerZ;
  const baseY = getTerrainHeight(cx, cz) + 0.06;

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.72 + Math.sin(t * 0.6) * 0.04;
      waterRef.current.rotation.z = Math.sin(t * 0.08) * 0.015;
    }
    if (rippleRef.current) {
      rippleRef.current.rotation.z = t * 0.03;
      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.16 + Math.sin(t * 0.5) * 0.06;
    }
  });

  return (
    <group position={[cx, baseY, cz]}>
      {/* Deep water body */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[7.2, 48]} />
        <meshStandardMaterial
          color="#3a8a9a"
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={0.76}
        />
      </mesh>

      {/* Shimmering surface energy ring */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[3.5, 6.8, 40]} />
        <meshBasicMaterial
          color="#a2e8dd"
          transparent
          opacity={0.18}
        />
      </mesh>

      {/* Outer shoreline softening ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[6.6, 7.5, 44]} />
        <meshBasicMaterial
          color="#c8e8dc"
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* Floating water lilies */}
      {[
        { x: -2.5, z: 1.2, r: 0.45 },
        { x: 1.8, z: -2.2, r: 0.52 },
        { x: -0.8, z: -2.8, r: 0.4 },
        { x: 2.9, z: 1.5, r: 0.48 },
        { x: 0.5, z: 2.6, r: 0.38 },
        { x: -1.6, z: 2.1, r: 0.35 },
      ].map((lily, i) => (
        <group key={`lily-${i}`} position={[lily.x, 0.02, lily.z]}>
          <mesh rotation={[-Math.PI / 2, 0, i * 1.2]}>
            <circleGeometry args={[lily.r, 12]} />
            <meshStandardMaterial color="#477353" roughness={0.8} />
          </mesh>
          {/* Lily flower bloom */}
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[lily.r * 0.32, 6, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#fce7f3" : "#fef3c7"}
              emissive={i % 2 === 0 ? "#f472b6" : "#fbbf24"}
              emissiveIntensity={0.3}
              roughness={0.45}
            />
          </mesh>
        </group>
      ))}

      {/* Shoreline boulders */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const a = (i / 12) * Math.PI * 2;
        const dist = 7.1 + (i % 3) * 0.35;
        const rx = Math.cos(a) * dist;
        const rz = Math.sin(a) * dist;
        const ry = getTerrainHeight(cx + rx, cz + rz) - baseY + 0.1;
        return (
          <group key={`rock-${i}`} position={[rx, ry, rz]}>
            <mesh rotation={[0.2 * Math.sin(i), a, 0.15 * Math.cos(i)]}>
              <dodecahedronGeometry args={[0.35 + (i % 3) * 0.09, 0]} />
              <meshStandardMaterial color="#6e7269" roughness={0.92} flatShading />
            </mesh>
            {/* Moss cap */}
            <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.22, 6]} />
              <meshStandardMaterial color="#557545" roughness={0.95} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ─── Home Garden Landmark ──────────────────────────── */

function HomeLandmark({ reducedMotion }: { reducedMotion: boolean }) {
  const h = ZONES.home;
  const y = getTerrainHeight(h.centerX, h.centerZ);
  const crystalRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (crystalRef.current) {
      crystalRef.current.position.y = 0.55 + Math.sin(t * 1.2) * 0.06;
      crystalRef.current.rotation.y = t * 0.28;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.12;
    }
  });

  return (
    <group position={[h.centerX, y, h.centerZ]}>
      {/* Outer circle of mossy stones */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const dist = 2.5;
        return (
          <mesh
            key={`ring-stone-${i}`}
            position={[Math.cos(a) * dist, 0.06, Math.sin(a) * dist]}
            rotation={[0.1, a + 0.3, 0]}
          >
            <dodecahedronGeometry args={[0.22 + (i % 3) * 0.05, 0]} />
            <meshStandardMaterial color="#707568" roughness={0.94} flatShading />
          </mesh>
        );
      })}

      {/* Inner grassy ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.5, 2.6, 32]} />
        <meshStandardMaterial color="#7a9a6a" roughness={0.9} />
      </mesh>

      {/* Inner energy circle */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[1.0, 1.35, 24]} />
        <meshBasicMaterial
          color="#9ad87a"
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Carved stone pedestal */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.65, 0.85, 0.3, 8]} />
        <meshStandardMaterial color="#6d6a62" roughness={0.95} flatShading />
      </mesh>

      {/* Levitating Memory Crystal */}
      <mesh ref={crystalRef} position={[0, 0.55, 0]}>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          color="#d4fce6"
          emissive="#6ee7b7"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.2}
          flatShading
        />
      </mesh>
    </group>
  );
}

/* ─── Main Exports ──────────────────────────────────── */

export function WorldEnvironment({
  reducedMotion,
  memoryPositions = [],
  moods = [],
}: {
  reducedMotion: boolean;
  memoryPositions?: Vec3[];
  moods?: string[];
}) {
  return (
    <group>
      {/* Ground zones with vertex-colored terrain */}
      {ZONE_LIST.map((zone) => (
        <ZoneGround
          key={zone.id}
          minX={zone.minX}
          maxX={zone.maxX}
          minZ={zone.minZ}
          maxZ={zone.maxZ}
          color={zone.groundColor}
        />
      ))}

      {/* Organic stepping-stone paths */}
      <OrganicPath
        from={[ZONES.home.centerX, ZONES.home.centerZ]}
        to={[ZONES.meadow.centerX, ZONES.meadow.centerZ]}
        steps={22}
      />
      <OrganicPath
        from={[ZONES.home.centerX, ZONES.home.centerZ]}
        to={[ZONES.forest.centerX, ZONES.forest.centerZ]}
        steps={22}
      />
      <OrganicPath
        from={[ZONES.home.centerX, ZONES.home.centerZ]}
        to={[ZONES.lake.centerX, ZONES.lake.centerZ]}
        steps={22}
      />

      {/* Reflection Lake */}
      <LakeWater reducedMotion={reducedMotion} />

      {/* Home Garden Landmark */}
      <HomeLandmark reducedMotion={reducedMotion} />

      {/* Atmospheric floating particles */}
      <AtmosphericParticles reducedMotion={reducedMotion} />

      {/* Biome-aware environmental flora */}
      <EnvironmentVegetation reducedMotion={reducedMotion} memoryPositions={memoryPositions} />

      {/* Mood-based subtle environment tint */}
      {moods.length > 0 && (
        <MoodTint reducedMotion={reducedMotion} mood={moods[0]} />
      )}
    </group>
  );
}

/* ─── Mood-Based Environment Tint Component ──────────── */

function MoodTint({ reducedMotion, mood }: { reducedMotion: boolean; mood?: string }) {
  useEffect(() => {
    if (reducedMotion) return;

    const tinted = document.createElement("style");
    tinted.textContent = `
      :root {
        --mood-tint: ${moodMatch(mood)};
      }
    `;
    document.head.appendChild(tinted);
    return () => {
      document.head.removeChild(tinted);
    };
  }, [reducedMotion, mood]);

  function moodMatch(m?: string): string {
    if (!m) return "none";
    const mLower = m.toLowerCase();
    if (/peace|calm|reflect|quiet|still/.test(mLower)) {
      return "rgba(139, 233, 252, 0.15)";
    }
    if (/joy|happy|excit|grateful|loved|celebrat/.test(mLower)) {
      return "rgba(251, 191, 36, 0.15)";
    }
    if (/nostalgic|warm|golden|amber/.test(mLower)) {
      return "rgba(251, 191, 36, 0.12)";
    }
    if (/thoughtful|cool|blue|serious/.test(mLower)) {
      return "rgba(167, 227, 208, 0.15)";
    }
    return "none";
  }

  return null;
}

export function WorldLighting() {
  return (
    <>
      <color attach="background" args={["#a8c4b0"]} />
      <fog attach="fog" args={["#a8c4b0", 18, 65]} />

      {/* Golden hour sky */}
      <Sky
        distance={450000}
        sunPosition={[12, 16, 10]}
        inclination={0.52}
        azimuth={0.28}
        mieCoefficient={0.003}
        mieDirectionalG={0.78}
        rayleigh={0.48}
        turbidity={3.2}
      />

      {/* Warm ambient fill */}
      <ambientLight intensity={0.52} color="#dbe8d0" />

      {/* Hemisphere bounce: sky blue to warm earth */}
      <hemisphereLight args={["#dce8f0", "#5c7050", 0.55]} />

      {/* Main warm directional sunlight with soft shadows */}
      <directionalLight
        position={[16, 24, 12]}
        intensity={1.45}
        color="#ffe4b0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={78}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-bias={-0.001}
      />

      {/* Cool fill light for depth */}
      <directionalLight
        position={[-12, 10, -10]}
        intensity={0.28}
        color="#8aadbd"
      />

      {/* Warm backlight to give objects rim lighting */}
      <directionalLight
        position={[-8, 8, 16]}
        intensity={0.18}
        color="#ffe0c0"
      />
    </>
  );
}

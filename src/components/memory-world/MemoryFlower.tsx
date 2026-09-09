import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import * as THREE from "three";

const FLOWER_THEMES = [
  { petal: "#f472b6", petalInner: "#fbcfe8", core: "#fbbf24", glow: "#f43f5e" },
  { petal: "#fb923c", petalInner: "#fed7aa", core: "#facc15", glow: "#ea580c" },
  { petal: "#c084fc", petalInner: "#e9d5ff", core: "#fef08a", glow: "#9333ea" },
  { petal: "#38bdf8", petalInner: "#bae6fd", core: "#6ee7b7", glow: "#0284c7" },
  { petal: "#facc15", petalInner: "#fef08a", core: "#f97316", glow: "#eab308" },
];

export function MemoryFlower({
  scale,
  variation,
  reducedMotion,
  highlighted,
}: {
  scale: number;
  variation: number;
  reducedMotion: boolean;
  highlighted?: boolean;
}) {
  const group = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  const theme = useMemo(() => {
    const idx = Math.floor(variation * FLOWER_THEMES.length) % FLOWER_THEMES.length;
    return FLOWER_THEMES[idx]!;
  }, [variation]);

  const s = scale * (highlighted ? 1.18 : 1);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 1.1 + variation * 7) * 0.08;
      group.current.rotation.x = Math.cos(t * 0.9 + variation * 5) * 0.05;
    }
    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 2.2 + variation * 4) * 0.25;
    }
  });

  const { outerPetals, innerPetals } = useMemo(() => {
    const petalCount = 6;
    const outer: Array<{ a: number; rot: [number, number, number]; pos: [number, number, number] }> = [];
    const inner: Array<{ a: number; rot: [number, number, number]; pos: [number, number, number] }> = [];

    for (let i = 0; i < petalCount; i += 1) {
      const a = (i / petalCount) * Math.PI * 2;
      outer.push({
        a,
        pos: [Math.cos(a) * 0.17, 0.52, Math.sin(a) * 0.17],
        rot: [0.38 * Math.cos(a), a, 0.38 * Math.sin(a)],
      });
      const aInner = a + Math.PI / petalCount;
      inner.push({
        a: aInner,
        pos: [Math.cos(aInner) * 0.11, 0.54, Math.sin(aInner) * 0.11],
        rot: [0.22 * Math.cos(aInner), aInner, 0.22 * Math.sin(aInner)],
      });
    }

    return { outerPetals: outer, innerPetals: inner };
  }, []);

  return (
    <group ref={group} scale={s}>
      {/* Root base collar */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 0.05, 6]} />
        <meshStandardMaterial color="#2d4a2a" roughness={0.95} />
      </mesh>

      {/* Gentle S-curve stem */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.022, 0.032, 0.52, 6]} />
        <meshStandardMaterial color="#41733b" roughness={0.82} />
      </mesh>

      {/* Stem leaf blades */}
      <group position={[0.07, 0.22, 0]} rotation={[0, 0, 0.6]}>
        <mesh scale={[1.4, 0.45, 0.2]}>
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#5a964e" roughness={0.75} />
        </mesh>
      </group>
      <group position={[-0.06, 0.34, 0.02]} rotation={[0, 0, -0.65]}>
        <mesh scale={[1.3, 0.42, 0.2]}>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial color="#68a85c" roughness={0.75} />
        </mesh>
      </group>

      {/* Outer petal ring */}
      {outerPetals.map((p, i) => (
        <group key={`out-${i}`} position={p.pos} rotation={p.rot}>
          <mesh scale={[1, 1.4, 0.35]}>
            <dodecahedronGeometry args={[0.11, 0]} />
            <meshStandardMaterial color={theme.petal} roughness={0.58} />
          </mesh>
        </group>
      ))}

      {/* Inner petal ring */}
      {innerPetals.map((p, i) => (
        <group key={`in-${i}`} position={p.pos} rotation={p.rot}>
          <mesh scale={[0.8, 1.1, 0.3]}>
            <dodecahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial color={theme.petalInner} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Bioluminescent floral core */}
      <mesh ref={coreRef} position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        <meshStandardMaterial
          color={theme.core}
          emissive={theme.glow}
          emissiveIntensity={0.65}
          roughness={0.25}
        />
      </mesh>

      {/* Subtle pollen light ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.56, 0]}>
        <ringGeometry args={[0.08, 0.14, 16]} />
        <meshBasicMaterial
          color={theme.core}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

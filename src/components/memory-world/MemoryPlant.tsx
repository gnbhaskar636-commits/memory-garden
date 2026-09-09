import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import * as THREE from "three";

const PLANT_PALETTES = [
  { leaf: "#3d7a58", tip: "#86efac", stem: "#284a37", glow: "#4ade80" },
  { leaf: "#2d6a6a", tip: "#67e8f9", stem: "#1e4545", glow: "#22d3ee" },
  { leaf: "#5b6b38", tip: "#d9f99d", stem: "#3b4524", glow: "#a3e635" },
];

export function MemoryPlant({
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
  const dewdropRef = useRef<Mesh>(null);

  const palette = useMemo(() => {
    const idx = Math.floor(variation * PLANT_PALETTES.length) % PLANT_PALETTES.length;
    return PLANT_PALETTES[idx]!;
  }, [variation]);

  const s = scale * (highlighted ? 1.15 : 1);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 0.9 + variation * 5) * 0.05;
      group.current.rotation.x = Math.cos(t * 0.75 + variation * 3) * 0.04;
    }
    if (dewdropRef.current) {
      const mat = dewdropRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 1.8 + variation * 4) * 0.25;
    }
  });

  // Spiraling Fibonacci fronds
  const fronds = useMemo(() => {
    const count = 9;
    const list: Array<{
      yaw: number;
      pitch: number;
      y: number;
      length: number;
      width: number;
    }> = [];

    const goldenAngle = 2.39996; // ~137.5 degrees
    for (let i = 0; i < count; i += 1) {
      const t = i / count;
      list.push({
        yaw: i * goldenAngle + variation * 2,
        pitch: 0.65 - t * 0.28,
        y: 0.08 + t * 0.32,
        length: 0.22 + (1 - t * 0.4) * 0.16,
        width: 0.085 + (1 - t * 0.3) * 0.04,
      });
    }

    return list;
  }, [variation]);

  return (
    <group ref={group} scale={s}>
      {/* Root base collar */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.06, 6]} />
        <meshStandardMaterial color={palette.stem} roughness={0.95} />
      </mesh>

      {/* Central plant core */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.025, 0.045, 0.44, 6]} />
        <meshStandardMaterial color={palette.stem} roughness={0.85} />
      </mesh>

      {/* Spiraling frond blades */}
      {fronds.map((f, i) => (
        <group key={`frond-${i}`} position={[0, f.y, 0]} rotation={[0, f.yaw, 0]}>
          <group rotation={[f.pitch, 0, 0]}>
            {/* Frond blade body */}
            <mesh position={[0, f.length * 0.5, 0]} scale={[f.width, f.length * 0.5, f.width * 0.3]}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={palette.leaf} roughness={0.68} />
            </mesh>
            {/* Bioluminescent glowing tip */}
            <mesh position={[0, f.length * 0.95, 0]}>
              <sphereGeometry args={[f.width * 0.38, 6, 6]} />
              <meshStandardMaterial
                color={palette.tip}
                emissive={palette.glow}
                emissiveIntensity={0.6}
                roughness={0.25}
              />
            </mesh>
          </group>
        </group>
      ))}

      {/* Central glowing dewdrop crystal */}
      <mesh ref={dewdropRef} position={[0, 0.46, 0]}>
        <octahedronGeometry args={[0.05, 0]} />
        <meshStandardMaterial
          color="#d1fae5"
          emissive={palette.glow}
          emissiveIntensity={0.7}
          roughness={0.2}
          flatShading
        />
      </mesh>

      {/* Ground energy ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.08, 0.16, 16]} />
        <meshBasicMaterial
          color={palette.glow}
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

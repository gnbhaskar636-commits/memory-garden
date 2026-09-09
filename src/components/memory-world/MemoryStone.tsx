import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import * as THREE from "three";

export function MemoryStone({
  scale,
  variation,
  reducedMotion = false,
  highlighted = false,
}: {
  scale: number;
  variation: number;
  reducedMotion?: boolean;
  highlighted?: boolean;
}) {
  const shardGroupRef = useRef<Group>(null);
  const runeRef = useRef<Mesh>(null);

  const s = scale * 0.95 * (highlighted ? 1.15 : 1);
  const stoneColor = variation > 0.5 ? "#5c5750" : "#4a4640";
  const runeColor = variation > 0.6 ? "#38bdf8" : variation > 0.3 ? "#a78bfa" : "#fbbf24";

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (shardGroupRef.current) {
      shardGroupRef.current.rotation.y = t * 0.45;
    }
    if (runeRef.current) {
      const mat = runeRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t * 2 + variation * 5) * 0.25;
    }
  });

  return (
    <group scale={s}>
      {/* Weathered base foundation */}
      <mesh position={[0, 0.08, 0]} rotation={[0.08, variation * 3, 0.05]}>
        <cylinderGeometry args={[0.26, 0.35, 0.16, 6]} />
        <meshStandardMaterial color="#383530" roughness={0.96} flatShading />
      </mesh>

      {/* Mossy footing */}
      <mesh position={[0.06, 0.14, 0.04]} rotation={[-0.1, 0.4, 0]}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color="#47593c" roughness={0.92} flatShading />
      </mesh>

      {/* Monolithic upright memory stone */}
      <mesh position={[0, 0.38, 0]} rotation={[0.05, variation * 2, -0.04]}>
        <cylinderGeometry args={[0.16, 0.24, 0.58, 6]} />
        <meshStandardMaterial color={stoneColor} roughness={0.88} flatShading />
      </mesh>

      {/* Glowing engraved runic memory vein */}
      <mesh
        ref={runeRef}
        position={[0.14, 0.42, 0.02]}
        rotation={[0, variation * 2 + 0.3, 0.08]}
      >
        <planeGeometry args={[0.08, 0.42]} />
        <meshStandardMaterial
          color={runeColor}
          emissive={runeColor}
          emissiveIntensity={0.65}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Orbiting floating crystal shards */}
      <group ref={shardGroupRef} position={[0, 0.42, 0]}>
        {[0, 1, 2].map((i) => {
          const angle = (i / 3) * Math.PI * 2;
          const radius = 0.38 + (i % 2) * 0.08;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * radius, (i - 1) * 0.12, Math.sin(angle) * radius]}
              rotation={[0.4 * i, angle, 0.2]}
            >
              <octahedronGeometry args={[0.045, 0]} />
              <meshStandardMaterial
                color="#e0f2fe"
                emissive={runeColor}
                emissiveIntensity={0.5}
                roughness={0.2}
                flatShading
              />
            </mesh>
          );
        })}
      </group>

      {/* Ground light aura */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[0.18, 0.32, 16]} />
        <meshBasicMaterial
          color={runeColor}
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

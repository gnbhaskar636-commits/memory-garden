import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE_COLORS, type PlantConfig } from "./plant-mapping";

export function FlowerMesh({
  config,
  scale,
  reducedMotion,
}: {
  config: PlantConfig;
  scale: number;
  reducedMotion: boolean;
}) {
  const group = useRef<Group>(null);
  const colors = PALETTE_COLORS[config.palette];
  const phase = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (reducedMotion || !group.current) return;
    const t = clock.getElapsedTime();
    group.current.rotation.z = Math.sin(t * 1.1 + phase.current) * 0.06 * config.sway;
    group.current.rotation.x = Math.sin(t * 0.7 + phase.current) * 0.03 * config.sway;
  });

  const petalCount = 5;
  const petals = Array.from({ length: petalCount }, (_, i) => {
    const a = (i / petalCount) * Math.PI * 2;
    return (
      <mesh key={i} position={[Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18]} rotation={[0.4, a, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={colors.petal} roughness={0.65} />
      </mesh>
    );
  });

  return (
    <group ref={group} scale={scale}>
      {/* stem */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.55, 6]} />
        <meshStandardMaterial color={colors.stem} roughness={0.8} />
      </mesh>
      {/* leaves */}
      <mesh position={[0.12, 0.22, 0]} rotation={[0, 0, 0.6]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={colors.leaf} roughness={0.75} />
      </mesh>
      <mesh position={[-0.1, 0.3, 0.05]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={colors.leaf} roughness={0.75} />
      </mesh>
      {/* center */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.1, 10, 10]} />
        <meshStandardMaterial color={colors.accent} roughness={0.5} />
      </mesh>
      {petals}
    </group>
  );
}

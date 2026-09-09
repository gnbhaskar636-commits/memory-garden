import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE_COLORS, type PlantConfig } from "./plant-mapping";

export function TreeMesh({
  config,
  scale,
  reducedMotion,
}: {
  config: PlantConfig;
  scale: number;
  reducedMotion: boolean;
}) {
  const canopy = useRef<Group>(null);
  const colors = PALETTE_COLORS[config.palette];
  const phase = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (reducedMotion || !canopy.current) return;
    const t = clock.getElapsedTime();
    canopy.current.rotation.y = Math.sin(t * 0.35 + phase.current) * 0.04 * config.sway;
    canopy.current.position.y = 0.95 + Math.sin(t * 0.6 + phase.current) * 0.02 * config.sway;
  });

  return (
    <group scale={scale}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 0.9, 6]} />
        <meshStandardMaterial color={colors.stem} roughness={0.9} />
      </mesh>
      <group ref={canopy} position={[0, 0.95, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.48, 12, 12]} />
          <meshStandardMaterial color={colors.leaf} roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 0.05, 0.1]}>
          <sphereGeometry args={[0.28, 10, 10]} />
          <meshStandardMaterial color={colors.leaf} roughness={0.75} />
        </mesh>
        <mesh position={[-0.22, 0.1, -0.12]}>
          <sphereGeometry args={[0.26, 10, 10]} />
          <meshStandardMaterial color={colors.leaf} roughness={0.75} />
        </mesh>
      </group>
    </group>
  );
}

export function SproutMesh({
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
    group.current.rotation.z = Math.sin(t * 1.4 + phase.current) * 0.08 * config.sway;
  });

  return (
    <group ref={group} scale={scale * 0.9}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.4, 5]} />
        <meshStandardMaterial color={colors.stem} roughness={0.85} />
      </mesh>
      <mesh position={[0.08, 0.38, 0]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={colors.leaf} roughness={0.7} />
      </mesh>
      <mesh position={[-0.08, 0.36, 0]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshStandardMaterial color={colors.leaf} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={colors.accent} roughness={0.55} />
      </mesh>
    </group>
  );
}

export function StoneMesh({
  config,
  scale,
}: {
  config: PlantConfig;
  scale: number;
}) {
  const colors = PALETTE_COLORS[config.palette];
  return (
    <group scale={scale * 0.85}>
      <mesh position={[0, 0.12, 0]} rotation={[0.2, 0.4, 0.1]}>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={colors.petal} roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.15, 0.08, 0.1]} rotation={[-0.1, 0.2, 0]}>
        <dodecahedronGeometry args={[0.14, 0]} />
        <meshStandardMaterial color={colors.accent} roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

export function DroopMesh({
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
    group.current.rotation.z = -0.25 + Math.sin(t * 0.5 + phase.current) * 0.04 * config.sway;
  });

  return (
    <group ref={group} scale={scale * 0.85} rotation={[0, 0, -0.2]}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.45, 5]} />
        <meshStandardMaterial color={colors.stem} roughness={0.9} />
      </mesh>
      <mesh position={[0.05, 0.42, 0]} rotation={[0.5, 0, 0.3]}>
        <sphereGeometry args={[0.14, 8, 8]} />
        <meshStandardMaterial color={colors.petal} roughness={0.8} />
      </mesh>
      <mesh position={[-0.02, 0.3, 0.05]} rotation={[0.2, 0, -0.4]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={colors.leaf} roughness={0.85} />
      </mesh>
    </group>
  );
}

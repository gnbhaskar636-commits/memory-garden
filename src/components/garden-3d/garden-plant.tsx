import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Memory } from "@/lib/memories/types";
import { FlowerMesh } from "./flower";
import { DroopMesh, SproutMesh, StoneMesh, TreeMesh } from "./tree";
import { memoryPosition, memoryScale } from "./memory-position";
import { plantConfigForMemory } from "./plant-mapping";

export function GardenPlant({
  memory,
  index,
  total,
  reducedMotion,
  onHover,
  onSelect,
}: {
  memory: Memory;
  index: number;
  total: number;
  reducedMotion: boolean;
  onHover: (memory: Memory | null) => void;
  onSelect: (memory: Memory) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const config = plantConfigForMemory(memory);
  const pos = memoryPosition(memory.id, memory.favorite, index, total);
  const scale = memoryScale(memory.emotionIntensity, memory.favorite) * (hovered ? 1.12 : 1);

  function handlePointerOver(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(true);
    onHover(memory);
    document.body.style.cursor = "pointer";
  }

  function handlePointerOut(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
    document.body.style.cursor = "auto";
  }

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect(memory);
  }

  const mesh =
    config.kind === "tree" ? (
      <TreeMesh config={config} scale={scale} reducedMotion={reducedMotion} />
    ) : config.kind === "sprout" ? (
      <SproutMesh config={config} scale={scale} reducedMotion={reducedMotion} />
    ) : config.kind === "stone" ? (
      <StoneMesh config={config} scale={scale} />
    ) : config.kind === "droop" ? (
      <DroopMesh config={config} scale={scale} reducedMotion={reducedMotion} />
    ) : (
      <FlowerMesh config={config} scale={scale} reducedMotion={reducedMotion} />
    );

  return (
    <group
      position={[pos.x, pos.y, pos.z]}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {mesh}
      {/* soft contact shadow blob */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.22 * scale, 12]} />
        <meshBasicMaterial color="#2a3328" transparent opacity={0.18} />
      </mesh>
      {hovered ? (
        <mesh position={[0, 1.15 * scale, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#f5e6c8" transparent opacity={0.85} />
        </mesh>
      ) : null}
    </group>
  );
}

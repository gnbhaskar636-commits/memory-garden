import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import type { Memory } from "@/lib/memories/types";
import { GardenControls } from "./garden-controls";
import { GardenGround } from "./garden-ground";
import { GardenPlant } from "./garden-plant";
import { GardenTooltipOverlay } from "./garden-tooltip";

function SceneContent({
  memories,
  reducedMotion,
  onHover,
  onSelect,
}: {
  memories: Memory[];
  reducedMotion: boolean;
  onHover: (m: Memory | null) => void;
  onSelect: (m: Memory) => void;
}) {
  // Cap for performance
  const plants = memories.slice(0, 50);

  return (
    <>
      <color attach="background" args={["#e8f0dc"]} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 10, 4]}
        intensity={1.05}
        castShadow={false}
        color="#fff6e0"
      />
      <hemisphereLight args={["#eaf2ff", "#c4b49a", 0.35]} />

      <GardenGround />

      {plants.map((memory, index) => (
        <GardenPlant
          key={memory.id}
          memory={memory}
          index={index}
          total={plants.length}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <GardenControls reducedMotion={reducedMotion} />
    </>
  );
}

export function GardenScene({
  memories,
  reducedMotion,
  onSelectMemory,
}: {
  memories: Memory[];
  reducedMotion: boolean;
  onSelectMemory: (memory: Memory) => void;
}) {
  const [hovered, setHovered] = useState<Memory | null>(null);

  return (
    <div className="relative h-full min-h-[280px] w-full">
      <Canvas
        camera={{ position: [0, 5.5, 9], fov: 42, near: 0.1, far: 60 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "default" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#e8f0dc");
        }}
      >
        <Suspense fallback={null}>
          <SceneContent
            memories={memories}
            reducedMotion={reducedMotion}
            onHover={setHovered}
            onSelect={onSelectMemory}
          />
        </Suspense>
      </Canvas>
      <GardenTooltipOverlay memory={hovered} />
    </div>
  );
}

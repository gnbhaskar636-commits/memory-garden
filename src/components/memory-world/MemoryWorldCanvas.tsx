import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useNewMemoryIds } from "@/hooks/useNewMemoryIds";
import type { MemoryWorldConfig, MemoryWorldMemory } from "@/lib/world/world-types";
import { MemoryTooltip } from "./MemoryTooltip";
import { MemoryWorldScene } from "./MemoryWorldScene";
import { MobileJoystick } from "./MobileJoystick";
import type { MoveInput } from "./WorldControls";

function useIsTouch() {
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    setTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);
  return touch;
}

export function MemoryWorldCanvas({
  memories,
  reducedMotion,
  onSelectConfig,
}: {
  memories: MemoryWorldMemory[];
  reducedMotion: boolean;
  onSelectConfig: (c: MemoryWorldConfig) => void;
}) {
  const [hovered, setHovered] = useState<MemoryWorldConfig | null>(null);
  const [edgeMsg, setEdgeMsg] = useState<string | null>(null);
  const { newIds, completeGrowth } = useNewMemoryIds(memories);
  const moveRef = useRef<MoveInput>({ x: 0, y: 0 });
  const isTouch = useIsTouch();

  useEffect(() => {
    function onEdge(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setEdgeMsg(detail);
      window.setTimeout(() => setEdgeMsg(null), 2800);
    }
    window.addEventListener("memory-world-edge", onEdge);
    return () => window.removeEventListener("memory-world-edge", onEdge);
  }, []);

  return (
    <div className="mw-canvas-wrap">
      {/* Top Futuristic Glassmorphism HUD */}
      <div className="mw-top-hud">
        <div className="mw-brand-pill">
          <span className="mw-brand-pulse" />
          <span className="mw-brand-text">Memory Garden · 3D Ecosystem</span>
        </div>
        <div className="mw-stats-pill">
          <span className="mw-stats-icon">🌿</span>
          <span>{memories.length} {memories.length === 1 ? "Memory" : "Memories"} Alive</span>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 1.65, 7.5], fov: 52, near: 0.1, far: 140 }}
        dpr={[1, 1.5]}
        shadows
        gl={{ antialias: true, powerPreference: "default", toneMapping: THREE.CineonToneMapping }}
      >
        <Suspense fallback={null}>
          <MemoryWorldScene
            memories={memories}
            reducedMotion={reducedMotion}
            newIds={newIds}
            onGrowthComplete={completeGrowth}
            onHover={setHovered}
            onSelect={onSelectConfig}
            moveInput={moveRef}
          />
        </Suspense>
      </Canvas>

      {/* Proximity / Hover Tooltip */}
      <MemoryTooltip config={hovered} />

      {/* Mobile Virtual Navigation Joystick */}
      {isTouch ? <MobileJoystick moveRef={moveRef} /> : null}

      {/* Bottom Controls Pill */}
      <div className="mw-hud">
        <span>
          {isTouch
            ? "🕹️ Stick to walk · Drag to look · Tap memory to open"
            : "WASD to walk · Right-drag to look · Click a memory tree to open it"}
        </span>
      </div>

      {edgeMsg ? <div className="mw-edge-toast">{edgeMsg}</div> : null}
    </div>
  );
}

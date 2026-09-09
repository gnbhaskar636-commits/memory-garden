import { useMemo, type MutableRefObject } from "react";
import { buildWorldConfigs } from "@/lib/world/memory-world-config";
import type { MemoryWorldConfig, MemoryWorldMemory } from "@/lib/world/world-types";
import { MemoryObject } from "./MemoryObject";
import { WorldControls, type MoveInput } from "./WorldControls";
import { WorldEnvironment, WorldLighting } from "./WorldEnvironment";

export function MemoryWorldScene({
  memories,
  reducedMotion,
  newIds,
  onGrowthComplete,
  onHover,
  onSelect,
  moveInput,
}: {
  memories: MemoryWorldMemory[];
  reducedMotion: boolean;
  newIds: Set<string>;
  onGrowthComplete: (id: string) => void;
  onHover: (c: MemoryWorldConfig | null) => void;
  onSelect: (c: MemoryWorldConfig) => void;
  moveInput: MutableRefObject<MoveInput>;
}) {
  const configs = useMemo(() => buildWorldConfigs(memories), [memories]);

  return (
    <>
      <WorldLighting />
      <WorldEnvironment
        reducedMotion={reducedMotion}
        memoryPositions={configs.map((c) => c.position)}
      />
      {configs.map((config) => (
        <MemoryObject
          key={config.memory.id}
          config={config}
          reducedMotion={reducedMotion}
          isNew={newIds.has(config.memory.id)}
          onGrowthComplete={onGrowthComplete}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      <WorldControls enabled moveInput={moveInput} />
    </>
  );
}

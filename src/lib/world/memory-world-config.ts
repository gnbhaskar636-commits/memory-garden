import { calculateMemoryImportance, importanceToScale } from "./memory-importance";
import { getMemoryObjectType } from "./memory-object-type";
import { getStableMemoryPosition, getStableRotationY } from "./memory-position";
import { getMemoryZone } from "./memory-zone";
import { seededUnit } from "./seeded-random";
import type { MemoryWorldConfig, MemoryWorldMemory } from "./world-types";

export function getMemoryWorldConfig(memory: MemoryWorldMemory): MemoryWorldConfig {
  const zone = getMemoryZone(memory);
  const objectType = getMemoryObjectType(memory);
  const importance = calculateMemoryImportance(memory);
  const scale = importanceToScale(importance);
  const position = memory.worldPosition
    ? { x: memory.worldPosition.x, y: 0, z: memory.worldPosition.z }
    : getStableMemoryPosition(memory, zone);
  const rotationY = getStableRotationY(memory.id);
  const variation = seededUnit(memory.id + ":var");

  return {
    memory,
    zone,
    objectType,
    importance,
    scale,
    position,
    rotationY,
    variation,
  };
}

export function buildWorldConfigs(memories: MemoryWorldMemory[]): MemoryWorldConfig[] {
  return memories.map(getMemoryWorldConfig);
}

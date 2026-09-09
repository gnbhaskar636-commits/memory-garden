import { useCallback, useEffect, useState } from "react";
import type { MemoryWorldConfig, MemoryWorldMemory, MemoryWorldProps } from "@/lib/world/world-types";
import { MemoryDetailPanel } from "./MemoryDetailPanel";
import { MemoryWorldCanvas } from "./MemoryWorldCanvas";
import { MemoryWorldError } from "./MemoryWorldError";
import { MemoryWorldLoading } from "./MemoryWorldLoading";

function supportsWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl") || c.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

/**
 * Public entry — standalone explorable 3D memory world.
 * Parent owns data; pass memories + optional onMemorySelect.
 */
export function MemoryWorld({
  memories,
  onMemorySelect,
  reducedMotion = false,
  className,
}: MemoryWorldProps) {
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [selected, setSelected] = useState<MemoryWorldMemory | null>(null);
  const useInternalPanel = !onMemorySelect;

  useEffect(() => {
    setWebgl(supportsWebGL());
    // Brief ready delay so canvas mounts cleanly after enter
    const t = window.setTimeout(() => setReady(true), 120);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = useCallback(
    (config: MemoryWorldConfig) => {
      if (onMemorySelect) {
        onMemorySelect(config.memory);
      } else {
        setSelected(config.memory);
      }
    },
    [onMemorySelect],
  );

  if (!ready) {
    return (
      <div className={`mw-root ${className ?? ""}`}>
        <MemoryWorldLoading />
      </div>
    );
  }

  if (!webgl) {
    return (
      <div className={`mw-root ${className ?? ""}`}>
        <MemoryWorldError />
      </div>
    );
  }

  return (
    <div className={`mw-root ${className ?? ""}`}>
      {memories.length === 0 ? (
        <div className="mw-empty-banner">Your world is waiting to grow.</div>
      ) : null}
      <MemoryWorldCanvas
        memories={memories}
        reducedMotion={reducedMotion}
        onSelectConfig={handleSelect}
      />
      {useInternalPanel && selected ? (
        <MemoryDetailPanel memory={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

export type { MemoryWorldMemory, MemoryWorldProps } from "@/lib/world/world-types";

import type { MemoryWorldConfig } from "@/lib/world/world-types";
import { ZONES } from "@/lib/world/world-zones";

export function MemoryTooltip({ config }: { config: MemoryWorldConfig | null }) {
  if (!config) return null;
  const { memory, zone, objectType } = config;
  const icon =
    objectType === "TREE" ? "🌳" : objectType === "FLOWER" ? "🌸" : objectType === "STONE" ? "🪨" : "🌿";

  return (
    <div className="mw-tooltip" role="status" aria-live="polite">
      <div className="mw-tooltip-header">
        <span className="mw-tooltip-icon" aria-hidden>{icon}</span>
        <span className="mw-tooltip-title">{memory.title}</span>
        {memory.favorite ? <span className="mw-tooltip-star" title="Favorite memory">★</span> : null}
      </div>

      <div className="mw-tooltip-meta">
        {memory.date ? <span className="mw-tooltip-tag mw-tooltip-date">{memory.date}</span> : null}
        {memory.primaryEmotion ? (
          <span className="mw-tooltip-tag mw-tooltip-emotion">{memory.primaryEmotion}</span>
        ) : memory.mood ? (
          <span className="mw-tooltip-tag mw-tooltip-mood">{memory.mood}</span>
        ) : null}
        {memory.photo ? <span className="mw-tooltip-tag mw-tooltip-photo">Photo memory</span> : null}
        <span className="mw-tooltip-tag mw-tooltip-zone">{ZONES[zone].label}</span>
      </div>

      <div className="mw-tooltip-hint">Click or tap to inspect memory</div>
    </div>
  );
}

import { format, parseISO } from "date-fns";
import { MOOD_LABEL } from "@/lib/memories/mood";
import type { Memory } from "@/lib/memories/types";

export function GardenTooltipOverlay({ memory }: { memory: Memory | null }) {
  if (!memory) return null;
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 w-[min(90%,20rem)] -translate-x-1/2 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-border backdrop-blur-sm">
      <p className="font-display text-base leading-snug">{memory.title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{MOOD_LABEL[memory.mood]}</span>
        <span>·</span>
        <time dateTime={memory.date}>{format(parseISO(memory.date), "MMM d, yyyy")}</time>
        {memory.primaryEmotion ? (
          <>
            <span>·</span>
            <span>{memory.primaryEmotion}</span>
          </>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-muted">Click to open</p>
    </div>
  );
}

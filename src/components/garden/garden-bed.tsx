import { useNavigate } from "@tanstack/react-router";
import { BotanicalMark } from "@/components/garden/botanical-mark";
import { EmptyGarden } from "@/components/garden/empty-garden";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTilt } from "@/lib/tilt";
import type { Memory } from "@/lib/memories/types";
import { hashString } from "@/lib/utils";
import { cn } from "@/lib/utils";

/**
 * The garden bed as a real 3D shadow-box: moving the pointer over it tilts
 * the whole scene in space, and each marker sits at its own depth
 * (`translateZ`) rather than flat on the photo. Favorites are pushed
 * noticeably closer to the viewer than ordinary memories — the one piece of
 * depth here is not decoration, it's how the garden shows you what you
 * treasured most. `transform-style: preserve-3d` on the tilting plane is
 * what makes children's individual Z offsets read as real depth instead of
 * all rotating together as a flat image.
 */
export function GardenBed({ memories }: { memories: Memory[] }) {
  const navigate = useNavigate();
  const tilt = useTilt<HTMLDivElement>(7);

  if (memories.length === 0) {
    return <EmptyGarden />;
  }

  return (
    <section
      aria-label="Your garden of memories"
      className="tilt-parent relative overflow-hidden rounded-[2rem] shadow-border"
    >
      <div
        ref={tilt.ref}
        {...tilt.handlers}
        className="tilt-plane relative min-h-[260px] sm:min-h-[340px] lg:min-h-[380px]"
      >
        <img
          src="/samples/garden-bed.jpg"
          alt=""
          className="absolute inset-0 h-[112%] w-[112%] -translate-x-[6%] -translate-y-[6%] object-cover object-[center_28%] dark:opacity-60"
          style={{ transform: "translateZ(-36px) scale(1.08)" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background/55"
          style={{ transform: "translateZ(-20px)" }}
        />
        {memories.map((memory, index) => {
          const position = markerPosition(memory.id, index, memories.length);
          const elevation = memory.favorite ? 46 : 14 + (hashString(memory.id) % 10);
          return (
            <Tooltip key={memory.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Open ${memory.title}`}
                  onClick={() =>
                    navigate({ to: "/memories/$id", params: { id: memory.id } })
                  }
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none"
                  style={{ left: `${position.x}%`, top: `${position.y}%` }}
                >
                  <span
                    aria-hidden="true"
                    className="scene-shadow absolute left-1/2 top-[86%] block h-2.5 w-9 -translate-x-1/2 rounded-full bg-moss/35 blur-[3px] dark:bg-black/50"
                    style={{
                      transform: `translateZ(${elevation - 30}px) scale(${1 - elevation / 140})`,
                      opacity: 0.35,
                    }}
                  />
                  <span
                    className={cn(
                      "flex -translate-y-1 items-end justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/80",
                      memory.favorite ? "garden-bloom" : "garden-sway",
                      index % 2 === 1 && !memory.favorite && "garden-sway-slow",
                    )}
                    style={{ transform: `translateZ(${elevation}px)` }}
                  >
                    <BotanicalMark
                      kind={memory.markerKind}
                      favorite={memory.favorite}
                      className={
                        memory.favorite
                          ? "h-16 w-12 drop-shadow-[0_10px_10px_rgba(41,59,50,0.28)] sm:h-20 sm:w-16"
                          : "h-14 w-11 drop-shadow-[0_5px_6px_rgba(41,59,50,0.18)] sm:h-16 sm:w-12"
                      }
                    />
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{memory.title}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </section>
  );
}

function markerPosition(id: string, index: number, total: number) {
  const columns = Math.max(3, Math.min(6, Math.ceil(Math.sqrt(total * 1.7))));
  const col = index % columns;
  const row = Math.floor(index / columns);
  const rows = Math.max(1, Math.ceil(total / columns));
  const hash = hashString(id);
  const jitterX = ((hash % 17) - 8) * 0.7;
  const jitterY = ((((hash / 17) | 0) % 13) - 6) * 0.55;
  const x = 14 + (col + 0.5) * (72 / columns) + jitterX;
  const y = 22 + (row + 0.5) * (46 / rows) + jitterY;
  return {
    x: Math.min(86, Math.max(14, x)),
    y: Math.min(72, Math.max(18, y)),
  };
}

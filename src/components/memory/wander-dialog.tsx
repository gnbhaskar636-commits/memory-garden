import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { MapPin } from "lucide-react";
import { MoodTag } from "@/components/memory/mood-tag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickWanderMemory, useMemoryStore } from "@/lib/memories/store";
import { useGardenUi } from "@/lib/memories/ui";

export function WanderDialog() {
  const open = useGardenUi((state) => state.wanderOpen);
  const wanderId = useGardenUi((state) => state.wanderId);
  const closeWander = useGardenUi((state) => state.closeWander);
  const openWander = useGardenUi((state) => state.openWander);
  const hideLocations = useMemoryStore((state) => state.settings.hideLocations);
  const memory = useMemoryStore((state) => state.memories.find((item) => item.id === wanderId));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeWander()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {memory ? (
          <>
            {memory.photo ? (
              <img src={memory.photo} alt="" className="aspect-[16/10] w-full object-cover" />
            ) : null}
            <div className="p-6">
              <DialogHeader className="pr-8">
                <p className="font-hand text-lg text-accent">a wander</p>
                <DialogTitle>{memory.title}</DialogTitle>
                <DialogDescription>{memory.description}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                <time dateTime={memory.date}>{format(parseISO(memory.date), "MMMM d, yyyy")}</time>
                <MoodTag mood={memory.mood} />
                {!hideLocations && memory.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {memory.location}
                  </span>
                ) : null}
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const next = pickWanderMemory(memory.id);
                    if (next) openWander(next.id);
                  }}
                >
                  Wander again
                </Button>
                <Button asChild onClick={() => closeWander()}>
                  <Link to="/memories/$id" params={{ id: memory.id }}>
                    Sit with this moment
                  </Link>
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>The garden is still quiet</DialogTitle>
              <DialogDescription>Plant a moment, then wander whenever you like.</DialogDescription>
            </DialogHeader>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

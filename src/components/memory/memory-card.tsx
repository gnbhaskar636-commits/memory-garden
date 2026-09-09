import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Heart, MapPin, MoreHorizontal } from "lucide-react";
import { MoodTag } from "@/components/memory/mood-tag";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemoryStore } from "@/lib/memories/store";
import type { Memory } from "@/lib/memories/types";
import { useGardenUi } from "@/lib/memories/ui";
import { cn } from "@/lib/utils";

export function MemoryCard({ memory }: { memory: Memory }) {
  const hideLocations = useMemoryStore((state) => state.settings.hideLocations);
  const toggleFavorite = useMemoryStore((state) => state.toggleFavorite);
  const deleteMemory = useMemoryStore((state) => state.deleteMemory);
  const openPlant = useGardenUi((state) => state.openPlant);

  return (
    <article className="card-lift paper overflow-hidden rounded-[1.75rem] shadow-border">
      <Link
        to="/memories/$id"
        params={{ id: memory.id }}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
      >
        {memory.photo ? (
          <img
            src={memory.photo}
            alt=""
            className="aspect-[4/3] w-full object-cover saturate-[0.94]"
          />
        ) : (
          <div className="flex aspect-[4/3] items-end bg-primary/15 px-5 py-4">
            <p className="font-hand text-2xl text-moss/80">{memory.title}</p>
          </div>
        )}
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-snug">
              <Link
                to="/memories/$id"
                params={{ id: memory.id }}
                className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
              >
                {memory.title}
              </Link>
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{memory.description}</p>
            {memory.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {memory.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="lavender">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={memory.favorite}
            aria-label={memory.favorite ? "Remove from favorites" : "Mark as favorite"}
            onClick={() => toggleFavorite(memory.id)}
            className={cn(memory.favorite && "text-accent")}
          >
            <Heart className={cn("size-4", memory.favorite && "fill-accent")} />
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
          <time dateTime={memory.date}>{format(parseISO(memory.date), "MMMM d, yyyy")}</time>
          <MoodTag mood={memory.mood} />
          {memory.primaryEmotion ? <Badge variant="muted">{memory.primaryEmotion}</Badge> : null}
          {!hideLocations && memory.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {memory.location}
            </span>
          ) : null}
          <div className="ml-auto">
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="More options">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openPlant({ memory, step: "write" })}>
                    Tend this moment
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/memories/$id" params={{ id: memory.id }}>
                      Sit with it
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem variant="destructive">Let this moment rest</DropdownMenuItem>
                  </AlertDialogTrigger>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Let this moment rest?</AlertDialogTitle>
                  <AlertDialogDescription>
                    “{memory.title}” will leave the garden. You can always plant another when you are ready.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive/90 text-cream hover:opacity-90"
                    onClick={() => deleteMemory(memory.id)}
                  >
                    Let it rest
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </article>
  );
}

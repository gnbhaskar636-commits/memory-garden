import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Heart, MapPin } from "lucide-react";
import { MemoryCard } from "@/components/memory/memory-card";
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
import { relatedMemories } from "@/lib/memories/related";
import { useMemoryStore } from "@/lib/memories/store";
import { useGardenUi } from "@/lib/memories/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memories/$id")({
  component: MemoryDetailPage,
});

function MemoryDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const memories = useMemoryStore((state) => state.memories);
  const hydrated = useMemoryStore((state) => state.hydrated);
  const hideLocations = useMemoryStore((state) => state.settings.hideLocations);
  const toggleFavorite = useMemoryStore((state) => state.toggleFavorite);
  const deleteMemory = useMemoryStore((state) => state.deleteMemory);
  const openPlant = useGardenUi((state) => state.openPlant);
  const memory = memories.find((item) => item.id === id);

  if (!hydrated) {
    return <p className="font-hand text-xl text-muted">Nurturing your memory…</p>;
  }

  if (!memory) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="font-display text-3xl">This moment has drifted</h1>
        <p className="mt-2 text-sm text-muted">It is no longer in the garden, or the path has grown over.</p>
        <Button asChild className="mt-6">
          <Link to="/memories">Return to the garden</Link>
        </Button>
      </div>
    );
  }

  const related = relatedMemories(memory, memories);

  return (
    <article className="anim-unfold mx-auto flex max-w-3xl flex-col gap-8">
      {memory.photo ? (
        <img
          src={memory.photo}
          alt=""
          className="max-h-[520px] w-full rounded-[2rem] object-cover shadow-border saturate-[0.95]"
        />
      ) : null}
      <header className="grid gap-3">
        <p className="font-hand text-xl text-accent">kept with care</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-4xl sm:text-5xl">{memory.title}</h1>
          <Button
            variant="ghost"
            size="icon"
            aria-pressed={memory.favorite}
            aria-label={memory.favorite ? "Remove from favorites" : "Mark as favorite"}
            onClick={() => toggleFavorite(memory.id)}
            className={cn(memory.favorite && "text-accent")}
          >
            <Heart className={cn("size-5", memory.favorite && "fill-accent")} />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <time dateTime={memory.date}>{format(parseISO(memory.date), "EEEE, MMMM d, yyyy")}</time>
          <MoodTag mood={memory.mood} />
          {!hideLocations && memory.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {memory.location}
            </span>
          ) : null}
        </div>
        {memory.aiAnalyzed ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {memory.primaryEmotion ? <Badge>{memory.primaryEmotion}</Badge> : null}
            {memory.secondaryEmotion ? <Badge variant="muted">{memory.secondaryEmotion}</Badge> : null}
            {memory.sentiment ? (
              <Badge
                variant={
                  memory.sentiment === "positive"
                    ? "highlight"
                    : memory.sentiment === "negative"
                      ? "lavender"
                      : "muted"
                }
              >
                {memory.sentiment}
              </Badge>
            ) : null}
            {memory.emotionIntensity ? (
              <span className="text-xs text-muted">intensity {memory.emotionIntensity}/10</span>
            ) : null}
          </div>
        ) : null}
        {memory.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {memory.tags.map((tag) => (
              <Badge key={tag} variant="lavender">
                #{tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>
      <p className="max-w-2xl text-lg leading-relaxed text-foreground">{memory.description}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => openPlant({ memory, step: "write" })}>
          Tend this moment
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost">Let this moment rest</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Let this moment rest?</AlertDialogTitle>
              <AlertDialogDescription>
                “{memory.title}” will leave the garden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive/90 text-cream hover:opacity-90"
                onClick={() => {
                  deleteMemory(memory.id);
                  void navigate({ to: "/memories" });
                }}
              >
                Let it rest
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {related.length > 0 ? (
        <section className="grid gap-4 pt-4">
          <h2 className="font-display text-2xl">Nearby in the garden</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {related.map((item) => (
              <MemoryCard key={item.id} memory={item} />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

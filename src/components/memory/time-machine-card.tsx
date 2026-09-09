import { Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { useMemo, useState, type FormEvent } from "react";
import { MoodTag } from "@/components/memory/mood-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveMemoryReflection } from "@/lib/memories/server";
import { useMemoryStore } from "@/lib/memories/store";
import { pickTimeMachineMemory, type TimeMachinePick } from "@/lib/memories/time-machine";
import { toast } from "sonner";

export function TimeMachineCard() {
  const memories = useMemoryStore((state) => state.memories);
  const hydrated = useMemoryStore((state) => state.hydrated);

  const pick = useMemo(() => pickTimeMachineMemory(memories), [memories]);

  if (!hydrated || !pick) return null;

  return <TimeMachineBody pick={pick} />;
}

function TimeMachineBody({ pick }: { pick: TimeMachinePick }) {
  const { memory, headline, agoLabel } = pick;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSaving(true);
    try {
      await saveMemoryReflection({ data: { memoryId: memory.id, content } });
      setSaved(true);
      setOpen(false);
      setText("");
      toast("Reflection saved in the garden");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save reflection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="overflow-hidden border-accent/25 bg-accent/5">
      <CardContent className="grid gap-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-hand text-lg text-accent">🕰️ Memory Time Machine</p>
            <p className="mt-0.5 text-xs tracking-wide text-muted uppercase">{headline}</p>
          </div>
          <p className="text-xs text-muted">{agoLabel}</p>
        </div>

        <div className="grid gap-2">
          <h3 className="font-display text-xl leading-snug">
            <Link
              to="/memories/$id"
              params={{ id: memory.id }}
              className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              “{memory.title}”
            </Link>
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">{memory.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <time dateTime={memory.date}>{format(parseISO(memory.date), "MMMM d, yyyy")}</time>
            <MoodTag mood={memory.mood} />
            {memory.primaryEmotion ? (
              <span className="rounded-full bg-surface px-2 py-0.5">{memory.primaryEmotion}</span>
            ) : null}
          </div>
        </div>

        <p className="font-hand text-base text-foreground/80">Look how far you’ve come.</p>

        {saved ? (
          <p className="text-sm text-muted">Your reflection on this memory is saved.</p>
        ) : open ? (
          <form onSubmit={onSave} className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span>How do you feel about this memory today?</span>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A few honest words…"
                rows={3}
                maxLength={2000}
                className="resize-none"
                autoFocus
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving || !text.trim()} size="sm">
                {saving ? "Saving…" : "Save reflection"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpen(false);
                  setText("");
                }}
              >
                Not now
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            How do you feel about this today?
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

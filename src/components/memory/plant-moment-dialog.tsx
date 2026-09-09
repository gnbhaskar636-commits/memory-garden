import type { ReactNode } from "react";
import { Camera, Feather, Mic, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MoodTag } from "@/components/memory/mood-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { readFileAsImage } from "@/lib/memories/image";
import { MOOD_LABEL } from "@/lib/memories/mood";
import { analyzeMemoryDraft } from "@/lib/memories/server";
import { useMemoryStore } from "@/lib/memories/store";
import { MOODS, type MemoryDraft, type Mood, type Sentiment } from "@/lib/memories/types";
import { useGardenUi } from "@/lib/memories/ui";
import { todayStamp } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PlantMomentDialog() {
  const open = useGardenUi((state) => state.plantOpen);
  const step = useGardenUi((state) => state.plantStep);
  const editing = useGardenUi((state) => state.editing);
  const closePlant = useGardenUi((state) => state.closePlant);
  const setPlantStep = useGardenUi((state) => state.setPlantStep);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closePlant()}>
      <DialogContent className="sm:max-w-xl">
        {step === "choose" ? (
          <ChooseStep onSelect={setPlantStep} />
        ) : step === "voice" ? (
          <VoiceStep onWrite={() => setPlantStep("write")} />
        ) : (
          <MemoryForm
            key={editing?.id ?? `${step}-new`}
            initial={editing}
            preferPhoto={step === "photo"}
            onCancel={closePlant}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChooseStep({ onSelect }: { onSelect: (step: "write" | "photo" | "voice") => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Plant a moment</DialogTitle>
        <DialogDescription>How would you like to keep this one?</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3">
        <ChoiceCard
          icon={<Feather className="size-5" />}
          title="Write a memory"
          description="A few words, kept like a pressed flower."
          onClick={() => onSelect("write")}
        />
        <ChoiceCard
          icon={<Camera className="size-5" />}
          title="Add a photo"
          description="A still image to sit beside the words."
          onClick={() => onSelect("photo")}
        />
        <ChoiceCard
          icon={<Mic className="size-5" />}
          title="Record a voice note"
          description="The garden is still learning to listen."
          onClick={() => onSelect("voice")}
        />
      </div>
    </>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-4 rounded-2xl bg-background px-4 py-4 text-left shadow-border transition-[transform,box-shadow] duration-(--motion-fast) hover:shadow-lift focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none active:scale-[0.99]"
    >
      <span className="mt-0.5 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-moss">
        {icon}
      </span>
      <span>
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
    </button>
  );
}

function VoiceStep({ onWrite }: { onWrite: () => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Voice notes are still taking root</DialogTitle>
        <DialogDescription>
          This garden cannot hear you yet. You can write the words, or keep a photo until listening arrives.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center rounded-2xl bg-background px-6 py-10 text-center shadow-border">
        <span className="inline-flex size-16 items-center justify-center rounded-full bg-lavender/40 text-moss">
          <Mic className="size-7" />
        </span>
        <p className="mt-4 max-w-xs text-sm text-muted">
          Leave the microphone at rest. The page is still, and that is enough for now.
        </p>
        <Button className="mt-6" onClick={onWrite}>
          Write it instead
        </Button>
      </div>
    </>
  );
}

function MemoryForm({
  initial,
  preferPhoto,
  onCancel,
}: {
  initial: MemoryDraft | null;
  preferPhoto: boolean;
  onCancel: () => void;
}) {
  const addMemory = useMemoryStore((state) => state.addMemory);
  const updateMemory = useMemoryStore((state) => state.updateMemory);
  const closePlant = useGardenUi((state) => state.closePlant);
  const beginPlanting = useGardenUi((state) => state.beginPlanting);
  const editing = useGardenUi((state) => state.editing);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? todayStamp());
  const [mood, setMood] = useState<Mood>(initial?.mood ?? "peaceful");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null);
  const [favorite, setFavorite] = useState(initial?.favorite ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [emotionIntensity, setEmotionIntensity] = useState<number | null>(
    initial?.emotionIntensity ?? null,
  );
  const [primaryEmotion, setPrimaryEmotion] = useState<string | null>(initial?.primaryEmotion ?? null);
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | null>(
    initial?.secondaryEmotion ?? null,
  );
  const [sentiment, setSentiment] = useState<Sentiment | null>(initial?.sentiment ?? null);
  const [aiAnalyzed, setAiAnalyzed] = useState(initial?.aiAnalyzed ?? false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const canSave = title.trim().length > 0 && description.trim().length > 0;
  const canAnalyze = title.trim().length > 0 && description.trim().length > 0 && !analyzing;

  useEffect(() => {
    if (preferPhoto) {
      document.getElementById("memory-photo")?.focus();
    }
  }, [preferPhoto]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const data = await readFileAsImage(file);
      setPhoto(data);
    } catch {
      setError("That photo could not settle here. Try another.");
    } finally {
      setBusy(false);
    }
  }

  function parseTags(): string[] {
    const seen = new Set<string>();
    const tags: string[] = [];
    for (const raw of tagsText.split(",")) {
      const tag = raw.trim().toLowerCase();
      if (!tag || seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
      if (tags.length >= 10) break;
    }
    return tags;
  }

  async function onAnalyze() {
    if (!canAnalyze) return;
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const result = await analyzeMemoryDraft({ data: { title, description, mood } });
      setPrimaryEmotion(result.primaryEmotion);
      setSecondaryEmotion(result.secondaryEmotion);
      setSentiment(result.sentiment);
      setEmotionIntensity(result.intensity);
      setAiAnalyzed(true);
      const existing = parseTags();
      const merged = [...existing];
      for (const tag of result.tags) {
        if (!merged.includes(tag)) merged.push(tag);
      }
      setTagsText(merged.slice(0, 10).join(", "));
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Couldn't analyze that just now.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (!canSave) {
      setError("A title and a few words are enough to plant this.");
      return;
    }
    setError("");
    setBusy(true);
    const draft: MemoryDraft = {
      title,
      description,
      date,
      mood,
      location,
      photo,
      favorite,
      tags: parseTags(),
      emotionIntensity,
      primaryEmotion,
      secondaryEmotion,
      sentiment,
      aiAnalyzed,
    };
    try {
      if (editing) {
        updateMemory(editing.id, draft);
        closePlant();
      } else {
        const memory = await addMemory(draft);
        closePlant();
        beginPlanting(memory.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[memory] save failed", { message: errorMessage, name: err instanceof Error ? err.name : typeof err });
      // Show the actual error message to help with debugging
      setError(errorMessage);
    } finally {
      setBusy(false);
    }
  }

  const heading = useMemo(
    () => (editing ? "Tend this moment" : preferPhoto ? "Keep a photograph" : "Write a memory"),
    [editing, preferPhoto],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>{heading}</DialogTitle>
        <DialogDescription>
          {editing ? "Change only what needs changing." : "Keep it small. Keep it true."}
        </DialogDescription>
      </DialogHeader>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field label="Title" htmlFor="memory-title">
          <Input
            id="memory-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A name for this moment"
            required
          />
        </Field>
        <Field label="What do you want to keep?" htmlFor="memory-body">
          <Textarea
            id="memory-body"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A sentence or two is plenty."
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="memory-date">
            <Input
              id="memory-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </Field>
          <Field label="Location" htmlFor="memory-location">
            <Input
              id="memory-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Optional"
            />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Mood</legend>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMood(item)}
                className={cn(
                  "rounded-full focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none",
                  mood === item && "ring-2 ring-moss/40 ring-offset-2 ring-offset-surface",
                )}
                aria-pressed={mood === item}
              >
                <MoodTag mood={item} />
                <span className="sr-only">{MOOD_LABEL[item]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 rounded-2xl bg-background px-4 py-4 shadow-border">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">AI insight</p>
              <p className="text-xs text-muted">Reads what you wrote and suggests emotion, intensity, and tags.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canAnalyze}
              onClick={() => void onAnalyze()}
            >
              <Sparkles className="size-3.5" />
              {analyzing ? "Reading…" : aiAnalyzed ? "Re-analyze" : "Analyze"}
            </Button>
          </div>
          {analyzeError ? <p className="text-xs text-destructive">{analyzeError}</p> : null}
          {aiAnalyzed ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {primaryEmotion ? <Badge>{primaryEmotion}</Badge> : null}
              {secondaryEmotion ? <Badge variant="muted">{secondaryEmotion}</Badge> : null}
              {sentiment ? (
                <Badge variant={sentiment === "positive" ? "highlight" : sentiment === "negative" ? "lavender" : "muted"}>
                  {sentiment}
                </Badge>
              ) : null}
            </div>
          ) : null}
          <Field label={`Emotional intensity${emotionIntensity ? ` — ${emotionIntensity}/10` : ""}`} htmlFor="memory-intensity">
            <input
              id="memory-intensity"
              type="range"
              min={1}
              max={10}
              value={emotionIntensity ?? 5}
              onChange={(event) => setEmotionIntensity(Number(event.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
            />
          </Field>
          <Field label="Tags" htmlFor="memory-tags">
            <Input
              id="memory-tags"
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
              placeholder="hackathon, friendship, travel…"
            />
          </Field>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="memory-photo">Photo</Label>
          <label
            htmlFor="memory-photo"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted transition-colors hover:bg-primary/10"
          >
            {photo ? (
              <img src={photo} alt="Selected memory" className="mb-3 max-h-40 rounded-xl object-cover" />
            ) : (
              <Camera className="mb-2 size-5" />
            )}
            {photo ? "Choose a different photo" : "Add a photo from your device"}
          </label>
          <input
            id="memory-photo"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => void onFile(event.target.files?.[0])}
          />
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-background px-4 py-3 shadow-border">
          <Label htmlFor="memory-favorite">Keep this close</Label>
          <Switch id="memory-favorite" checked={favorite} onCheckedChange={setFavorite} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Not now
          </Button>
          <Button type="submit" disabled={!canSave || busy}>
            {editing ? "Save changes" : "Plant this moment"}
          </Button>
        </div>
      </form>
    </>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

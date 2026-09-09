import { MOOD_CLASS, MOOD_LABEL } from "@/lib/memories/mood";
import type { Mood } from "@/lib/memories/types";
import { cn } from "@/lib/utils";

export function MoodTag({ mood, className }: { mood: Mood; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", MOOD_CLASS[mood], className)}>
      {MOOD_LABEL[mood]}
    </span>
  );
}

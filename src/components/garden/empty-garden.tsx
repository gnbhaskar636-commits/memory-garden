import { Button } from "@/components/ui/button";
import { useGardenUi } from "@/lib/memories/ui";
import { useTilt } from "@/lib/tilt";

export function EmptyGarden({
  title = "Your garden is waiting for its first moment.",
  prompt = "What made today worth remembering?",
}: {
  title?: string;
  prompt?: string;
}) {
  const openPlant = useGardenUi((state) => state.openPlant);
  const tilt = useTilt<HTMLDivElement>(9);

  return (
    <div className="paper flex flex-col items-center justify-center rounded-[2rem] px-6 py-12 text-center shadow-border sm:py-16">
      <div className="tilt-parent relative mb-6">
        <span
          aria-hidden="true"
          className="absolute inset-x-4 bottom-1 h-4 rounded-[50%] bg-moss/30 blur-md dark:bg-black/50"
        />
        <div
          ref={tilt.ref}
          {...tilt.handlers}
          className="tilt-plane size-40 rounded-[1.5rem] shadow-border sm:size-48"
        >
          <img
            src="/samples/empty-pot.jpg"
            alt="A small terracotta pot of soil, waiting"
            className="size-full rounded-[1.5rem] object-cover"
          />
        </div>
      </div>
      <p className="font-hand text-xl text-accent sm:text-2xl">still unplanted</p>
      <h2 className="mt-2 max-w-md font-display text-2xl text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{prompt}</p>
      <Button className="mt-6" onClick={() => openPlant()}>
        Plant a moment
      </Button>
    </div>
  );
}


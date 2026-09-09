import { useEffect, type ReactNode } from "react";
import { PlantAnimation } from "@/components/garden/plant-animation";
import { PlantMomentDialog } from "@/components/memory/plant-moment-dialog";
import { WanderDialog } from "@/components/memory/wander-dialog";
import { useMemoryStore } from "@/lib/memories/store";

export function GardenProvider({ children }: { children: ReactNode }) {
  const hydrate = useMemoryStore((state) => state.hydrate);
  const theme = useMemoryStore((state) => state.settings.theme);
  const reducedMotion = useMemoryStore((state) => state.settings.reducedMotion);
  const hydrated = useMemoryStore((state) => state.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;

    const apply = (value: "light" | "dark") => {
      root.classList.toggle("dark", value === "dark");
    };

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const sync = () => apply(media.matches ? "dark" : "light");
      sync();
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    apply(theme);
  }, [theme, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
  }, [reducedMotion]);

  return (
    <>
      {children}
      <PlantMomentDialog />
      <WanderDialog />
      <PlantAnimation />
    </>
  );
}

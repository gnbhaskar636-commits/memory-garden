import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { EmptyGarden } from "@/components/garden/empty-garden";
import { GardenBed } from "@/components/garden/garden-bed";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/lib/motion";
import { useMemoryStore } from "@/lib/memories/store";
import type { Memory } from "@/lib/memories/types";
import { GardenLoading } from "./garden-loading";

type ViewMode = "3d" | "2d";

function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

/**
 * Primary garden visualization.
 * - Default: immersive 3D (when WebGL is available)
 * - Toggle / fallback: existing 2D GardenBed
 * Existing memory system is unchanged; click opens /memories/$id
 */
export function GardenView({ memories }: { memories: Memory[] }) {
  const navigate = useNavigate();
  const reducedMotionSetting = useMemoryStore((s) => s.settings.reducedMotion);
  const prefersReduced = usePrefersReducedMotion();
  const reducedMotion = reducedMotionSetting || prefersReduced;

  const [mode, setMode] = useState<ViewMode>("3d");
  const [webgl, setWebgl] = useState(true);
  const [Scene, setScene] = useState<ComponentType<{
    memories: Memory[];
    reducedMotion: boolean;
    onSelectMemory: (m: Memory) => void;
  }> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading3d, setLoading3d] = useState(true);

  useEffect(() => {
    const ok = supportsWebGL();
    setWebgl(ok);
    if (!ok) {
      setMode("2d");
      setLoading3d(false);
      return;
    }
    let cancelled = false;
    // Dynamic import keeps three.js out of the SSR / initial bundle path
    import("./garden-scene")
      .then((mod) => {
        if (!cancelled) {
          setScene(() => mod.GardenScene);
          setLoading3d(false);
        }
      })
      .catch((err) => {
        console.error("[garden-3d] failed to load scene", err);
        if (!cancelled) {
          setFailed(true);
          setMode("2d");
          setLoading3d(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openMemory(memory: Memory) {
    void navigate({ to: "/memories/$id", params: { id: memory.id } });
  }

  if (memories.length === 0) {
    return <EmptyGarden />;
  }

  const show3d = mode === "3d" && webgl && !failed && Scene;

  return (
    <section aria-label="Your garden of memories" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-hand text-lg text-accent">
          {show3d ? "your living garden" : "your garden bed"}
        </p>
        <div className="flex gap-1 rounded-full border border-border bg-surface p-1 shadow-border">
          <Button
            type="button"
            size="sm"
            variant={mode === "3d" ? "default" : "ghost"}
            className="h-8 rounded-full px-3 text-xs"
            disabled={!webgl || failed}
            onClick={() => setMode("3d")}
          >
            3D Garden
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "2d" ? "default" : "ghost"}
            className="h-8 rounded-full px-3 text-xs"
            onClick={() => setMode("2d")}
          >
            2D Garden
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] shadow-border">
        {show3d ? (
          <div className="h-[min(62vh,420px)] w-full bg-[#e8f0dc] sm:h-[380px] lg:h-[420px]">
            {loading3d ? (
              <GardenLoading />
            ) : Scene ? (
              <Scene
                memories={memories}
                reducedMotion={reducedMotion}
                onSelectMemory={openMemory}
              />
            ) : (
              <GardenBed memories={memories} />
            )}
          </div>
        ) : loading3d && mode === "3d" ? (
          <div className="h-[min(62vh,420px)] sm:h-[380px]">
            <GardenLoading />
          </div>
        ) : (
          <GardenBed memories={memories} />
        )}
      </div>

      {show3d ? (
        <p className="text-center text-xs text-muted">
          Drag to look around · scroll to zoom · click a plant to open its memory
        </p>
      ) : null}
    </section>
  );
}

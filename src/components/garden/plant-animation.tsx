import { useEffect } from "react";
import { toast } from "sonner";
import { useGardenUi } from "@/lib/memories/ui";
import { usePrefersReducedMotion } from "@/lib/motion";

export function PlantAnimation() {
  const planting = useGardenUi((state) => state.planting);
  const endPlanting = useGardenUi((state) => state.endPlanting);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!planting) return;
    if (reduced) {
      toast("Your garden is growing");
      endPlanting();
      return;
    }
    const timeout = window.setTimeout(() => {
      toast("Your garden is growing");
      endPlanting();
    }, 2000);
    return () => window.clearTimeout(timeout);
  }, [planting, reduced, endPlanting]);

  if (!planting || reduced) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-overlay"
      role="status"
      aria-live="polite"
    >
      <div className="paper flex w-[min(90vw,320px)] flex-col items-center rounded-[1.75rem] px-8 py-10 text-center shadow-lift">
        {/*
          A little pot scene, framed with real CSS perspective (looking down
          and in, like you're standing over the pot) rather than the flat
          front-on SVG icon this used to be. The pot's roundness comes from
          gradients (a 2D trick, cheap and robust); the framing comes from an
          actual `perspective()` + `rotateX()` on the wrapper, which is where
          the "3D" honestly lives.
        */}
        <div style={{ perspective: "700px" }}>
          <svg
            viewBox="0 0 100 130"
            className="h-32 w-24"
            aria-hidden="true"
            style={{ transform: "rotateX(14deg)", transformStyle: "preserve-3d" }}
          >
            <defs>
              <linearGradient id="pa-pot-face" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#D0894E" />
                <stop offset="55%" stopColor="#B5652E" />
                <stop offset="100%" stopColor="#8B4A22" />
              </linearGradient>
              <linearGradient id="pa-pot-rim" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E9A868" />
                <stop offset="100%" stopColor="#C97B4A" />
              </linearGradient>
              <radialGradient id="pa-soil" cx="45%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#6B4A30" />
                <stop offset="100%" stopColor="#3C2A1B" />
              </radialGradient>
            </defs>

            <ellipse
              cx="50"
              cy="122"
              rx="24"
              ry="5"
              fill="#2E3B2A"
              className="scene-shadow"
              style={{ animation: "shadow-pool 700ms 150ms var(--ease-smooth-out) both" }}
            />

            <g
              className="scene-stem"
              style={{
                transformOrigin: "50px 78px",
                animation: "stem-rise 900ms 550ms var(--ease-smooth-out) both",
              }}
            >
              <path
                d="M50 78 C50 62 50 50 50 38"
                fill="none"
                stroke="#4F6A57"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </g>
            <g
              className="scene-leaf"
              style={{
                transformOrigin: "44px 52px",
                animation: "leaf-unfurl 480ms 1050ms var(--ease-smooth-out) both",
              }}
            >
              <path d="M50 54 C36 48 32 34 40 26 C44 38 47 46 50 54 Z" fill="#91A889" />
            </g>
            <g
              className="scene-leaf"
              style={{
                transformOrigin: "56px 46px",
                animation: "leaf-unfurl 480ms 1220ms var(--ease-smooth-out) both",
              }}
            >
              <path d="M50 48 C64 42 68 28 60 20 C56 32 53 40 50 48 Z" fill="#6F8F6A" />
            </g>

            <g
              className="scene-pot"
              style={{
                transformOrigin: "50px 100px",
                animation: "pot-settle 550ms var(--ease-smooth-out) both",
              }}
            >
              <path d="M28 78 L72 78 L64 118 Q50 124 36 118 Z" fill="url(#pa-pot-face)" />
              <path d="M64 118 Q50 124 36 118 L38 112 Q50 117 62 112 Z" fill="#6E3A18" opacity="0.5" />
              <ellipse cx="50" cy="78" rx="22" ry="7" fill="url(#pa-pot-rim)" />
              <ellipse cx="50" cy="78" rx="17.5" ry="5" fill="url(#pa-soil)" />
            </g>
          </svg>
        </div>
        <p className="mt-4 font-display text-xl text-foreground">A seed finds soil</p>
        <p className="mt-1 text-sm text-muted">Nurturing your memory…</p>
      </div>
    </div>
  );
}

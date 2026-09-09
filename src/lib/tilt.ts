import { useCallback, useRef } from "react";
import { usePrefersReducedMotion } from "./motion";

/**
 * Pointer-tracked 3D tilt, driven entirely by CSS custom properties so it
 * composes with any other `transform` (e.g. the garden's own sway/bloom
 * keyframe animations) instead of fighting over a single `style.transform`.
 *
 * Usage:
 *   const tilt = useTilt<HTMLDivElement>(10);
 *   <div ref={tilt.ref} {...tilt.handlers} className="tilt-plane">...
 *
 * `.tilt-plane` (see styles.css) reads `--tilt-x` / `--tilt-y` to rotate.
 * Reduced-motion visitors get a static, always-centered plane.
 */
export function useTilt<T extends HTMLElement>(maxDeg = 10) {
  const ref = useRef<T | null>(null);
  const reduced = usePrefersReducedMotion();

  const reset = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
    el.style.setProperty("--tilt-px", "50%");
    el.style.setProperty("--tilt-py", "50%");
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<T>) => {
      if (reduced || event.pointerType === "touch") return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * maxDeg * 2;
      const rotateX = (0.5 - py) * maxDeg * 2;
      el.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      el.style.setProperty("--tilt-px", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--tilt-py", `${(py * 100).toFixed(1)}%`);
    },
    [maxDeg, reduced],
  );

  return { ref, handlers: { onPointerMove, onPointerLeave: reset, onPointerCancel: reset } };
}

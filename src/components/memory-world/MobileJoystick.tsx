import { useRef, useState, useEffect, type MutableRefObject } from "react";
import type { MoveInput } from "./WorldControls";

const MAX_OFFSET = 46;
const JOYSTICK_HIT_TEST_RADIUS = 8;

type JoystickPointerEvent = PointerEvent & { currentTarget: HTMLDivElement };

/**
 * Modern Futuristic Biophilic Joystick:
 * - Frosted glass outer ring with glowing concentric energy tracks
 * - Directional crosshair guidance
 * - Responsive glowing thumb knob with dynamic active feedback
 * - Pointer-event support for mouse and touch
 * - Works on both mobile and desktop without interfering with memory clicks
 */
export function MobileJoystick({
  moveRef,
}: {
  moveRef: MutableRefObject<MoveInput>;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function onStickDown(e: PointerEvent) {
    // Only activate if click/tap is inside the joystick area
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    const distanceFromCenter = Math.hypot(dx, dy);

    // If clicked outside the joystick boundary, don't activate
    if (distanceFromCenter > rect.width / 2 - JOYSTICK_HIT_TEST_RADIUS) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();
    target.setPointerCapture(e.pointerId);
    const targetRect = target.getBoundingClientRect();
    origin.current = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };
    setActive(true);
    updateStick(e.clientX, e.clientY);
  }
  function onStickMove(e: PointerEvent) {
    if (!origin.current) return;
    e.stopPropagation();
    e.preventDefault();
    updateStick(e.clientX, e.clientY);
  }
  function onStickUp(e: PointerEvent) {
    e.stopPropagation();
    origin.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    // Reset move input to prevent stuck movement
    moveRef.current = { x: 0, y: 0 };
  }
  function updateStick(cx: number, cy: number) {
    if (!origin.current) return;
    const dx = cx - origin.current.x;
    const dy = cy - origin.current.y;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(len, MAX_OFFSET);
    const nx = (dx / len) * clamped;
    const ny = (dy / len) * clamped;
    setKnob({ x: nx, y: ny });
    // x: left/right (-1 to 1), y: forward/backward (-1 to 1)
    // Negate y so pushing forward moves the camera forward
    moveRef.current = { x: nx / MAX_OFFSET, y: -ny / MAX_OFFSET };
  }

  // Clean up on unmount / re-render
  useEffect(() => {
    return () => {
      origin.current = null;
      setActive(false);
      setKnob({ x: 0, y: 0 });
      moveRef.current = { x: 0, y: 0 };
    };
  }, [moveRef]);

  return (
    <div
      className={`mw-joystick ${active ? "mw-joystick-active" : ""}`}
      onPointerDown={onStickDown}
      onPointerMove={onStickMove}
      onPointerUp={onStickUp}
      onPointerCancel={onStickUp}
      onLostPointerCapture={onStickUp}
      aria-label="Virtual navigation joystick"
      role="application"
    >
      {/* Inner concentric energy tracks */}
      <div className="mw-joystick-track" />
      <div className="mw-joystick-ring-inner" />

      {/* Crosshair accents */}
      <div className="mw-joystick-axis mw-joystick-axis-h" />
      <div className="mw-joystick-axis mw-joystick-axis-v" />

      {/* Floating glowing thumb knob */}
      <div
        className="mw-joystick-knob"
        style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
      >
        <div className="mw-joystick-knob-core" />
      </div>
    </div>
  );
}
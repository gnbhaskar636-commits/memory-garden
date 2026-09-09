import { useRef, useState, type MutableRefObject, type PointerEvent as REPointerEvent } from "react";
import type { MoveInput } from "./WorldControls";

const MAX_OFFSET = 46;

/**
 * Modern Futuristic Biophilic Joystick:
 * - Frosted glass outer ring with glowing concentric energy tracks
 * - Directional crosshair guidance
 * - Responsive glowing thumb knob with dynamic active feedback
 * - Non-blocking touch handling
 */
export function MobileJoystick({
  moveRef,
}: {
  moveRef: MutableRefObject<MoveInput>;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  function onStickDown(e: REPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    origin.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    setActive(true);
    updateStick(e.clientX, e.clientY);
  }
  function onStickMove(e: REPointerEvent<HTMLDivElement>) {
    if (!origin.current) return;
    e.stopPropagation();
    e.preventDefault();
    updateStick(e.clientX, e.clientY);
  }
  function onStickUp(e: REPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    origin.current = null;
    setActive(false);
    moveRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
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
    moveRef.current = { x: nx / MAX_OFFSET, y: -ny / MAX_OFFSET };
  }

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

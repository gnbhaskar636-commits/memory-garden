import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, PLAYER_EYE_HEIGHT } from "@/lib/world/terrain";
import { WORLD_BOUNDS } from "@/lib/world/world-zones";

const SPEED = 6.8;
const LOOK = 0.0022;
const MOVE_RESPONSE = 9;
const LOOK_RESPONSE = 18;
const EDGE_MARGIN = 1.25;
const TOUCH_LOOK_THRESHOLD = 10;
const TOUCH_LOOK_SENS = 0.012;

export type MoveInput = { x: number; y: number };
export type LookInput = { dx: number; dy: number };

/**
 * First-person walk controls:
 * - Buttery-smooth movement damping and terrain height following
 * - Organic gentle head-bob (disabled when reducedMotion is active)
 * - Shoreline boundary guidance around deep lake water
 * - Mobile dual-touch: left stick for movement, right surface for look
 */
export function WorldControls({
  enabled,
  moveInput,
}: {
  enabled: boolean;
  moveInput?: MutableRefObject<MoveInput>;
  lookInput?: MutableRefObject<LookInput>;
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const targetLook = useRef({ yaw: 0, pitch: -0.1 });
  const smoothLook = useRef({ yaw: 0, pitch: -0.1 });
  const velocity = useRef({ x: 0, z: 0 });
  const walkTime = useRef(0);
  const edgeNotified = useRef(false);
  const mouseLookActive = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

    function onKeyDown(e: KeyboardEvent) {
      keys.current[e.code] = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      keys.current[e.code] = false;
    }

    function onPointerDown(e: PointerEvent) {
      if (isTouch) return;
      if (e.button !== 2) return;
      e.preventDefault();
      mouseLookActive.current = true;
      el.setPointerCapture?.(e.pointerId);
    }

    function onMouseMove(e: PointerEvent) {
      if (!mouseLookActive.current) return;
      targetLook.current.yaw -= e.movementX * LOOK;
      targetLook.current.pitch -= e.movementY * LOOK;
      targetLook.current.pitch = Math.max(-1.1, Math.min(0.5, targetLook.current.pitch));
    }

    function onPointerUp(e: PointerEvent) {
      if (e.button !== 2) return;
      mouseLookActive.current = false;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    }

    function onContextMenu(e: MouseEvent) {
      if (!mouseLookActive.current) return;
      e.preventDefault();
    }

    // Mobile look tracking on right 65% of screen
    let touchId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onTouchStart(e: TouchEvent) {
      if (!isTouch) return;
      for (let i = 0; i < e.changedTouches.length; i += 1) {
        const t = e.changedTouches[i]!;
        // Ignore left 35% where the joystick operates
        if (t.clientX < window.innerWidth * 0.35) continue;
        if (touchId !== null) continue;
        touchId = t.identifier;
        startX = lastX = t.clientX;
        startY = lastY = t.clientY;
        dragging = false;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i += 1) {
        const t = e.changedTouches[i]!;
        if (t.identifier !== touchId) continue;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        if (!dragging) {
          if (Math.hypot(dx, dy) < TOUCH_LOOK_THRESHOLD) return;
          dragging = true;
        }
        e.preventDefault();
        const mdx = t.clientX - lastX;
        const mdy = t.clientY - lastY;
        lastX = t.clientX;
        lastY = t.clientY;
        targetLook.current.yaw -= mdx * TOUCH_LOOK_SENS;
        targetLook.current.pitch -= mdy * TOUCH_LOOK_SENS;
        targetLook.current.pitch = Math.max(-1.1, Math.min(0.5, targetLook.current.pitch));
      }
    }

    function onTouchEnd(e: TouchEvent) {
      for (let i = 0; i < e.changedTouches.length; i += 1) {
        if (e.changedTouches[i]!.identifier === touchId) {
          touchId = null;
          dragging = false;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("pointermove", onMouseMove);
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    const y0 = getTerrainHeight(0, 7.5) + PLAYER_EYE_HEIGHT;
    camera.position.set(0, y0, 7.5);
    camera.rotation.order = "YXZ";
    targetLook.current = { yaw: 0, pitch: -0.1 };
    smoothLook.current = { yaw: 0, pitch: -0.1 };

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("pointermove", onMouseMove);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      document.body.style.cursor = "auto";
      keys.current = {};
      mouseLookActive.current = false;
    };
  }, [enabled, camera, gl]);

  useFrame((_, dt) => {
    if (!enabled) return;

    const frameDt = Math.min(dt, 0.05);
    const lookBlend = 1 - Math.exp(-LOOK_RESPONSE * frameDt);
    smoothLook.current.yaw = THREE.MathUtils.lerp(
      smoothLook.current.yaw,
      targetLook.current.yaw,
      lookBlend,
    );
    smoothLook.current.pitch = THREE.MathUtils.lerp(
      smoothLook.current.pitch,
      targetLook.current.pitch,
      lookBlend,
    );

    const { yaw, pitch } = smoothLook.current;
    camera.rotation.set(pitch, yaw, 0);

    let targetFwd = (keys.current["KeyW"] ? 1 : 0) + (keys.current["KeyS"] ? -1 : 0);
    let targetStr = (keys.current["KeyD"] ? 1 : 0) + (keys.current["KeyA"] ? -1 : 0);

    if (moveInput?.current) {
      targetFwd += moveInput.current.y;
      targetStr += moveInput.current.x;
    }

    const inputLen = Math.hypot(targetFwd, targetStr);
    if (inputLen > 1) {
      targetFwd /= inputLen;
      targetStr /= inputLen;
    }

    // Exponential damping gives the same acceleration and deceleration at
    // different frame rates while keeping the input responsive.
    const moveBlend = 1 - Math.exp(-MOVE_RESPONSE * frameDt);
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, targetStr, moveBlend);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, targetFwd, moveBlend);

    const moving = Math.hypot(velocity.current.x, velocity.current.z) > 0.05;
    if (moving) {
      walkTime.current += frameDt * 7.5;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      const sp = SPEED * frameDt;

      camera.position.x += (sin * velocity.current.z + cos * velocity.current.x) * sp;
      camera.position.z += (-cos * velocity.current.z + sin * velocity.current.x) * sp;

      // Soft repulsion from deep lake center at (33, 0)
      const lakeDist = Math.hypot(camera.position.x - 33, camera.position.z);
      if (lakeDist < 6.8) {
        const push = (6.8 - lakeDist) * 0.12;
        const pushAngle = Math.atan2(camera.position.z, camera.position.x - 33);
        camera.position.x += Math.cos(pushAngle) * push;
        camera.position.z += Math.sin(pushAngle) * push;
      }

      // World boundary constraints
      const beforeX = camera.position.x;
      const beforeZ = camera.position.z;
      camera.position.x = Math.min(
        WORLD_BOUNDS.maxX - EDGE_MARGIN,
        Math.max(WORLD_BOUNDS.minX + EDGE_MARGIN, camera.position.x),
      );
      camera.position.z = Math.min(
        WORLD_BOUNDS.maxZ - EDGE_MARGIN,
        Math.max(WORLD_BOUNDS.minZ + EDGE_MARGIN, camera.position.z),
      );

      const hitX = beforeX !== camera.position.x;
      const hitZ = beforeZ !== camera.position.z;
      const hitEdge = hitX || hitZ;
      if (hitEdge) {
        // Keep the shared WASD/joystick velocity smooth, but remove the
        // outward push so the player settles instead of jittering at the edge.
        const edgeDamping = Math.exp(-18 * frameDt);
        velocity.current.x *= edgeDamping;
        velocity.current.z *= edgeDamping;
      }
      if (hitEdge && !edgeNotified.current) {
        edgeNotified.current = true;
        window.dispatchEvent(
          new CustomEvent("memory-world-edge", {
            detail: "You've reached the edge of your Memory World.",
          }),
        );
      }
      if (!hitEdge) edgeNotified.current = false;
    }

    // Smooth elevation following with subtle organic bob
    const targetY = getTerrainHeight(camera.position.x, camera.position.z) + PLAYER_EYE_HEIGHT;
    const bob = moving ? Math.sin(walkTime.current) * 0.025 : 0;
    // Y is derived only from terrain. There is no vertical input, so the
    // player cannot fly or drift above the playable ground surface.
    const groundedY = targetY + bob;
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      groundedY,
      1 - Math.exp(-10 * frameDt),
    );
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, targetY - 0.08, targetY + 0.08);
  });

  return null;
}

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import * as THREE from "three";
import { getTerrainHeight } from "@/lib/world/terrain";
import type { MemoryWorldConfig } from "@/lib/world/world-types";
import { MemoryFlower } from "./MemoryFlower";
import { MemoryPlant } from "./MemoryPlant";
import { MemoryStone } from "./MemoryStone";
import { MemoryTree } from "./MemoryTree";

export function MemoryObject({
  config,
  reducedMotion,
  isNew = false,
  onGrowthComplete,
  onHover,
  onSelect,
}: {
  config: MemoryWorldConfig;
  reducedMotion: boolean;
  isNew?: boolean;
  onGrowthComplete?: (id: string) => void;
  onHover: (config: MemoryWorldConfig | null) => void;
  onSelect: (config: MemoryWorldConfig) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const growth = useRef(isNew ? 0 : 1);
  const [growthProgress, setGrowthProgress] = useState(isNew ? 0 : 1);
  const done = useRef(!isNew);
  const rippleRef = useRef<Mesh>(null);
  const auraRef = useRef<Mesh>(null);
  const { position, rotationY, scale, variation, objectType, memory } = config;

  const groundY = getTerrainHeight(position.x, position.z);

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;

    // Real-time growth progression for newly created memories
    if (!done.current) {
      const speed = reducedMotion ? 1.4 : 0.36;
      growth.current = Math.min(1, growth.current + dt * speed);
      setGrowthProgress(growth.current);

      if (growth.current >= 1) {
        done.current = true;
        onGrowthComplete?.(memory.id);
      }
    }

    // Ripple expansion during growth
    if (rippleRef.current && !done.current) {
      const rScale = (1 - growth.current) * 2.2 + 0.3;
      rippleRef.current.scale.set(rScale, rScale, 1);
      const mat = rippleRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - growth.current) * 0.7;
    }

    // Gentle hover aura pulse
    if (auraRef.current) {
      const mat = auraRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (hovered ? 0.45 : memory.favorite ? 0.28 : 0.12) + Math.sin(t * 2) * 0.06;
    }
  });

  function over(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(true);
    onHover(config);
    document.body.style.cursor = "pointer";
  }
  function out(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    setHovered(false);
    onHover(null);
    document.body.style.cursor = "auto";
  }
  function onPointerDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
  }
  function click(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    onSelect(config);
  }

  const gp =
    objectType === "TREE" || objectType === "PLANT" || objectType === "FLOWER"
      ? growthProgress
      : 1;

  const hasPhoto = Boolean(memory?.photo);
  const isTreeWithPhoto = objectType === "TREE" && hasPhoto;

  // Enhanced aura opacity: favorite > hovered with photo > normal
  const auraBaseOpacity = memory.favorite
    ? 0.28
    : isTreeWithPhoto && hovered
      ? 0.35
      : isTreeWithPhoto
        ? 0.2
        : 0.12;

  // Subtle hover scale factor - only when not in reduced motion
  const hoverScale = reducedMotion ? 1 : hovered ? 1.02 : 1;

  const visual =
    objectType === "TREE" ? (
      <MemoryTree
        scale={scale}
        variation={variation}
        reducedMotion={reducedMotion}
        highlighted={hovered}
        growthProgress={gp}
        memory={memory}
      />
    ) : objectType === "FLOWER" ? (
      <group scale={0.35 + gp * 0.65}>
        <MemoryFlower
          scale={scale}
          variation={variation}
          reducedMotion={reducedMotion}
          highlighted={hovered}
        />
      </group>
    ) : objectType === "STONE" ? (
      <group scale={0.45 + gp * 0.55}>
        <MemoryStone
          scale={scale}
          variation={variation}
          reducedMotion={reducedMotion}
          highlighted={hovered}
        />
      </group>
    ) : (
      <group scale={0.35 + gp * 0.65}>
        <MemoryPlant
          scale={scale}
          variation={variation}
          reducedMotion={reducedMotion}
          highlighted={hovered}
        />
      </group>
    );

  const showPhoto = Boolean(memory.photo);

  return (
    <group
      position={[position.x, groundY, position.z]}
      rotation={[0, rotationY, 0]}
      onPointerOver={over}
      onPointerOut={out}
      onPointerDown={onPointerDown}
      onClick={click}
      scale={hoverScale}
    >
      {visual}

      {/* Ground ambient shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <circleGeometry args={[0.26 * scale * (0.4 + gp * 0.6), 16]} />
        <meshBasicMaterial color="#1a2418" transparent opacity={0.22 * gp} />
      </mesh>

      {/* Bioluminescent aura ring (enhanced on hover or favorite) */}
      <mesh ref={auraRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry
          args={[0.28 * scale * (0.4 + gp * 0.6), 0.44 * scale * (0.4 + gp * 0.6), 24]}
        />
        <meshBasicMaterial
          color={memory.favorite ? "#fbbf24" : isTreeWithPhoto ? "#a7f3d0" : "#6ee7b7"}
          transparent
          opacity={auraBaseOpacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Photo badge on tree that contains a photo — subtle corner marker */}
      {isTreeWithPhoto && (
        <mesh
          position={[0.35 * scale, 0.32 * scale, -0.28 * scale]}
          rotation={[0, Math.PI / 4, 0]}
        >
          <boxGeometry args={[0.04 * scale, 0.04 * scale, 0.02 * scale]}>
            <meshStandardMaterial
              color="#fff"
              opacity={0.8}
              transparent
              blending={THREE.AdditiveBlending}
            />
          </boxGeometry>
        </mesh>
      )}

      {/* Real-time growth celebratory ripple */}
      {isNew && !done.current && (
        <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.3, 0.6, 24]} />
          <meshBasicMaterial
            color="#a7f3d0"
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Small integrated photo fragment for memories with a real image. */}
      {showPhoto && memory.photo ? (
        <HolographicPhotoFragment
          url={memory.photo}
          height={1.45 * scale}
          reducedMotion={reducedMotion}
        />
      ) : null}
    </group>
  );
}

/**
 * Holographic Memory Photo Fragment:
 * - Floating glassmorphic panel with glowing crystalline corner anchors
 * - Soft bobbing and gentle rotation sway
 * - Clean translucent frame preserving world visibility
 */
function HolographicPhotoFragment({
  url,
  height,
  reducedMotion,
}: {
  url: string;
  height: number;
  reducedMotion: boolean;
}) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  const mapRef = useRef<THREE.Texture | null>(null);
  const frameRef = useRef<Group>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        if (mapRef.current && mapRef.current !== tex) {
          mapRef.current.dispose();
        }
        mapRef.current = tex;
        setMap(tex);
      },
      undefined,
      () => {
        /* broken photo — graceful silent fallback */
      },
    );
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.dispose();
        mapRef.current = null;
      }
    };
  }, [url]);

  useFrame(({ clock }) => {
    if (reducedMotion || !frameRef.current) return;
    const t = clock.elapsedTime;
    frameRef.current.position.y = height + Math.sin(t * 1.6) * 0.04;
    frameRef.current.rotation.y = Math.sin(t * 0.8) * 0.06;
  });

  const corners = useMemo(() => {
    const hw = 0.22;
    const hh = 0.16;
    return [
      [-hw, hh],
      [hw, hh],
      [-hw, -hh],
      [hw, -hh],
    ];
  }, []);

  if (!map) return null;

  return (
    <group ref={frameRef} position={[0.48, height, 0.12]}>
      {/* Photo canvas */}
      <mesh>
        <planeGeometry args={[0.4, 0.3]} />
        <meshBasicMaterial map={map} toneMapped={false} />
      </mesh>

      {/* Holographic glass border */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.44, 0.34]} />
          <meshStandardMaterial
          color="#e7eadb"
          roughness={0.15}
          metalness={0.3}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Holographic glowing edge backing */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[0.46, 0.36]} />
        <meshBasicMaterial
          color="#d3e5bd"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Crystalline corner anchor brackets */}
      {corners.map(([cx, cy], i) => (
        <mesh key={i} position={[cx, cy, 0.005]}>
          <octahedronGeometry args={[0.02, 0]} />
          <meshStandardMaterial
            color="#dcecc4"
            emissive="#a6c97d"
            emissiveIntensity={0.35}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

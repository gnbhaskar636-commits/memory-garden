import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Group } from "three";
import { seededRange, seededUnit } from "@/lib/world/seeded-random";

const LEAVES = [
  "#3a7332",
  "#4d8544",
  "#2c5e28",
  "#5e9e50",
  "#416e36",
  "#6ba658",
];
const TRUNKS = ["#3a281e", "#443024", "#2c1e16", "#4d382b"];

/** Stylized environmental tree for forests and world perimeter ridges. */
export function EnvironmentTree({
  seed,
  position,
  scale = 1,
  reducedMotion,
}: {
  seed: string;
  position: [number, number, number];
  scale?: number;
  reducedMotion: boolean;
}) {
  const canopy = useRef<Group>(null);
  const v = seededUnit(seed);
  const leaf = LEAVES[Math.floor(v * LEAVES.length) % LEAVES.length]!;
  const leafAccent = LEAVES[Math.floor((v + 0.4) * LEAVES.length) % LEAVES.length]!;
  const trunk = TRUNKS[Math.floor(seededUnit(seed + "t") * TRUNKS.length) % TRUNKS.length]!;
  const h = seededRange(seed + "h", 1.4, 2.6);
  const r = seededRange(seed + "r", 0.09, 0.15);
  const canopyR = seededRange(seed + "c", 0.65, 1.15);

  const { clusters, branches, trunkCurve } = useMemo(() => {
    const n = 4 + Math.floor(seededUnit(seed + "n") * 3);
    const cList: Array<{ x: number; y: number; z: number; cr: number; col: string }> = [];

    // Central crown volume
    cList.push({ x: 0, y: h * 0.18, z: 0, cr: canopyR, col: leaf });

    // Satellite foliage volumes
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + v * 3;
      const rad = canopyR * 0.48;
      cList.push({
        x: Math.cos(a) * rad,
        y: h * 0.06 + seededRange(seed + `y${i}`, -0.12, 0.22),
        z: Math.sin(a) * rad,
        cr: canopyR * seededRange(seed + `cr${i}`, 0.48, 0.75),
        col: i % 2 === 0 ? leaf : leafAccent,
      });
    }

    // Branch supports under canopy
    const bList: Array<{ a: number; pitch: number; len: number; curve: THREE.CatmullRomCurve3 }> = [];
    for (let i = 0; i < 3; i += 1) {
      const len = canopyR * 0.5;
      const bend = seededRange(`${seed}-bend-${i}`, -0.16, 0.16);
      bList.push({
        a: (i / 3) * Math.PI * 2 + v * 2,
        pitch: 0.6 + (i % 2) * 0.15,
        len,
        curve: new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(bend, len * 0.45, 0),
          new THREE.Vector3(bend * 0.6, len, 0),
        ]),
      });
    }

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(seededRange(`${seed}-tx`, -0.12, 0.12), h * 0.35, 0),
      new THREE.Vector3(seededRange(`${seed}-tx2`, -0.1, 0.1), h * 0.7, 0),
      new THREE.Vector3(0, h, 0),
    ]);

    return { clusters: cList, branches: bList, trunkCurve };
  }, [seed, h, canopyR, v, leaf, leafAccent]);

  useFrame(({ clock }) => {
    if (reducedMotion || !canopy.current) return;
    canopy.current.rotation.y = Math.sin(clock.elapsedTime * 0.18 + v * 8) * 0.035;
    canopy.current.rotation.z = Math.cos(clock.elapsedTime * 0.14 + v * 5) * 0.015;
  });

  return (
    <group position={position} scale={scale}>
      {/* Root flare anchor */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[r * 1.3, r * 1.75, 0.1, 6]} />
        <meshStandardMaterial color={trunk} roughness={0.96} />
      </mesh>

      {/* Main trunk with a deterministic natural bend */}
      <mesh>
        <tubeGeometry args={[trunkCurve, 7, r, 6, false]} />
        <meshStandardMaterial color={trunk} roughness={0.92} />
      </mesh>

      {/* Branch supports under the foliage */}
      <group position={[0, h * 0.88, 0]}>
        {branches.map((b, i) => (
          <group key={i} rotation={[0, b.a, 0]}>
            <group rotation={[b.pitch, 0, 0]}>
              <mesh>
                <tubeGeometry args={[b.curve, 5, r * 0.34, 5, false]} />
                <meshStandardMaterial color={trunk} roughness={0.92} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* Stylized faceted foliage canopy */}
      <group ref={canopy} position={[0, h * 0.96, 0]}>
        {clusters.map((c, i) => (
          <mesh key={i} position={[c.x, c.y, c.z]} scale={[1.15, 0.9, 1]}>
            <sphereGeometry args={[c.cr, 10, 7]} />
            <meshStandardMaterial color={c.col} roughness={0.82} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

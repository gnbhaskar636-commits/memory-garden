import { OrbitControls } from "@react-three/drei";

export function GardenControls({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <OrbitControls
      makeDefault
      enablePan
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI / 2.15}
      minPolarAngle={Math.PI / 6}
      minDistance={4}
      maxDistance={16}
      target={[0, 0.4, 0]}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      rotateSpeed={0.55}
      panSpeed={0.4}
    />
  );
}

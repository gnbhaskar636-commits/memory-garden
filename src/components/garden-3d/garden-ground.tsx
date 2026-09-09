export function GardenGround() {
  return (
    <group>
      {/* Soft ground disk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#c5d4a8" roughness={0.95} />
      </mesh>
      {/* Inner soil bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[7.2, 48]} />
        <meshStandardMaterial color="#b7a789" roughness={1} />
      </mesh>
      {/* Soft rim ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[7.0, 7.4, 48]} />
        <meshStandardMaterial color="#9aaf7a" roughness={0.9} />
      </mesh>
    </group>
  );
}

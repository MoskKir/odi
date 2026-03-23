import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'

function Pyramid() {
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group>
        <mesh>
          <coneGeometry args={[0.9, 1.3, 4]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.6}
            roughness={0.3}
            flatShading
          />
        </mesh>
        <mesh>
          <coneGeometry args={[0.92, 1.32, 4]} />
          <meshBasicMaterial
            color="#444444"
            wireframe
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>
    </Float>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]}>
      <circleGeometry args={[3, 64]} />
      <meshStandardMaterial
        color="#1a1a2e"
        transparent
        opacity={0.2}
      />
    </mesh>
  )
}

export function PyramidScene() {
  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 40 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-3, 3, -3]} intensity={0.3} color="#818cf8" />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#c084fc" />
      <Pyramid />
      <Ground />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={1}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  )
}

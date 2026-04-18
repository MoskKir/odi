import { Component, type ReactNode, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Float, OrbitControls } from '@react-three/drei'

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

function PyramidFallback() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 60% 40%, #1a1a2e 0%, #0f0f1a 100%)' }}
    >
      <div style={{
        width: 0,
        height: 0,
        borderLeft: '80px solid transparent',
        borderRight: '80px solid transparent',
        borderBottom: '140px solid #2a2a3e',
        filter: 'drop-shadow(0 0 24px #818cf855)',
        animation: 'pyramidFloat 4s ease-in-out infinite',
      }} />
      <style>{`@keyframes pyramidFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>
    </div>
  )
}

class WebGLErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  render() { return this.state.error ? this.props.fallback : this.props.children }
}

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
  const [webGLAvailable, setWebGLAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    setWebGLAvailable(isWebGLAvailable())
  }, [])

  if (webGLAvailable === null) return null
  if (!webGLAvailable) return <PyramidFallback />

  return (
    <WebGLErrorBoundary fallback={<PyramidFallback />}>
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 40 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
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
    </WebGLErrorBoundary>
  )
}

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'

interface GlassBlockProps {
  position: [number, number, number]
  size: [number, number, number]
  color: string
  glow?: boolean
}

function GlassBlock({ position, size, color, glow = false }: GlassBlockProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glow && glowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.3 + 0.7
      glowRef.current.scale.setScalar(1 + pulse * 0.05)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.15 + pulse * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Main glass block */}
      <RoundedBox
        ref={meshRef}
        args={size}
        radius={0.05}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          thickness={0.5}
          roughness={0.05}
          metalness={0.1}
          ior={1.5}
          transparent
          opacity={0.85}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Inner glow effect */}
      {glow && (
        <mesh ref={glowRef} scale={[1.05, 1.05, 1.05]}>
          <boxGeometry args={size} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Edge highlights */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...size)]} />
        <lineBasicMaterial color="white" transparent opacity={0.3} />
      </lineSegments>
    </group>
  )
}

export default GlassBlock

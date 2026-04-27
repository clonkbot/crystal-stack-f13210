import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { Suspense } from 'react'
import GameScene from './GameScene'
import type { GameState } from '../App'

interface GameProps {
  gameState: GameState
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
}

function Game({ gameState, onGameOver, onScoreUpdate }: GameProps) {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [6, 8, 6], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['transparent']} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#ff6b9d" />
        <pointLight position={[10, 5, -5]} intensity={0.3} color="#7dd3fc" />

        {/* Environment for reflections */}
        <Suspense fallback={null}>
          <Environment preset="sunset" />
        </Suspense>

        {/* Contact shadows */}
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.4}
          scale={20}
          blur={2}
          far={10}
        />

        {/* Game Scene */}
        <GameScene
          gameState={gameState}
          onGameOver={onGameOver}
          onScoreUpdate={onScoreUpdate}
        />

        {/* Camera Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          autoRotate={gameState === 'menu'}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  )
}

export default Game

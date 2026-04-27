import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import GlassBlock from './GlassBlock'
import type { GameState } from '../App'

interface Block {
  id: number
  position: [number, number, number]
  size: [number, number, number]
  color: string
  settled: boolean
}

interface MovingBlock {
  position: THREE.Vector3
  size: THREE.Vector3
  direction: 'x' | 'z'
  speed: number
  color: string
}

interface GameSceneProps {
  gameState: GameState
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
}

const COLORS = [
  '#ff6b9d', // Pink
  '#7dd3fc', // Sky blue
  '#c4b5fd', // Lavender
  '#fde68a', // Yellow
  '#a7f3d0', // Mint
  '#fca5a1', // Coral
  '#93c5fd', // Light blue
  '#fdba74', // Orange
]

const BASE_SIZE = 3
const BLOCK_HEIGHT = 0.5
const INITIAL_SPEED = 0.04
const SPEED_INCREMENT = 0.002
const MAX_SPEED = 0.12
const SWING_DISTANCE = 4

function GameScene({ gameState, onGameOver, onScoreUpdate }: GameSceneProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [movingBlock, setMovingBlock] = useState<MovingBlock | null>(null)
  const [score, setScore] = useState(0)
  const movingBlockRef = useRef<THREE.Group>(null)
  const gameRef = useRef({
    isPlaying: false,
    direction: 1,
    perfectStreak: 0,
  })

  // Initialize game
  const initGame = useCallback(() => {
    const baseBlock: Block = {
      id: 0,
      position: [0, 0, 0],
      size: [BASE_SIZE, BLOCK_HEIGHT, BASE_SIZE],
      color: COLORS[0],
      settled: true,
    }
    setBlocks([baseBlock])
    setScore(0)
    gameRef.current.perfectStreak = 0

    // Create first moving block
    const newMovingBlock: MovingBlock = {
      position: new THREE.Vector3(-SWING_DISTANCE, BLOCK_HEIGHT, 0),
      size: new THREE.Vector3(BASE_SIZE, BLOCK_HEIGHT, BASE_SIZE),
      direction: 'x',
      speed: INITIAL_SPEED,
      color: COLORS[1 % COLORS.length],
    }
    setMovingBlock(newMovingBlock)
    gameRef.current.isPlaying = true
    gameRef.current.direction = 1
  }, [])

  // Reset on menu
  useEffect(() => {
    if (gameState === 'menu') {
      // Show demo tower
      const demoBlocks: Block[] = []
      for (let i = 0; i < 5; i++) {
        demoBlocks.push({
          id: i,
          position: [0, i * BLOCK_HEIGHT, 0],
          size: [BASE_SIZE - i * 0.3, BLOCK_HEIGHT, BASE_SIZE - i * 0.3],
          color: COLORS[i % COLORS.length],
          settled: true,
        })
      }
      setBlocks(demoBlocks)
      setMovingBlock(null)
      gameRef.current.isPlaying = false
    }
  }, [gameState])

  // Start game
  useEffect(() => {
    if (gameState === 'playing') {
      initGame()
    }
  }, [gameState, initGame])

  // Place block
  const placeBlock = useCallback(() => {
    if (!movingBlock || !gameRef.current.isPlaying) return

    const topBlock = blocks[blocks.length - 1]
    const topPos = new THREE.Vector3(...topBlock.position)
    const topSize = new THREE.Vector3(...topBlock.size)

    const currentPos = movingBlock.position.clone()
    const currentSize = movingBlock.size.clone()

    // Calculate overlap
    const axis = movingBlock.direction
    const offset = currentPos[axis] - topPos[axis]
    const overlap = topSize[axis] - Math.abs(offset)

    if (overlap <= 0) {
      // Missed completely - game over
      gameRef.current.isPlaying = false
      onGameOver(score)
      return
    }

    // Check for perfect placement (within 0.1 units)
    const isPerfect = Math.abs(offset) < 0.1

    let newBlockSize: THREE.Vector3
    let newBlockPos: THREE.Vector3

    if (isPerfect) {
      // Perfect placement - no slicing, keep same size
      newBlockSize = currentSize.clone()
      newBlockPos = new THREE.Vector3(
        topPos.x,
        currentPos.y,
        topPos.z
      )
      gameRef.current.perfectStreak++
    } else {
      // Calculate new block dimensions
      newBlockSize = currentSize.clone()
      newBlockSize[axis] = overlap

      newBlockPos = currentPos.clone()
      newBlockPos[axis] = topPos[axis] + (offset > 0 ? 1 : -1) * (topSize[axis] - overlap) / 2

      gameRef.current.perfectStreak = 0
    }

    // Add new settled block
    const newBlock: Block = {
      id: blocks.length,
      position: [newBlockPos.x, newBlockPos.y, newBlockPos.z],
      size: [newBlockSize.x, newBlockSize.y, newBlockSize.z],
      color: movingBlock.color,
      settled: true,
    }

    setBlocks(prev => [...prev, newBlock])

    // Update score
    const pointsEarned = isPerfect ? 2 + gameRef.current.perfectStreak : 1
    const newScore = score + pointsEarned
    setScore(newScore)
    onScoreUpdate(newScore)

    // Check if block is too small
    if (newBlockSize.x < 0.3 || newBlockSize.z < 0.3) {
      gameRef.current.isPlaying = false
      onGameOver(newScore)
      return
    }

    // Create next moving block
    const nextDirection = movingBlock.direction === 'x' ? 'z' : 'x'
    const nextSpeed = Math.min(movingBlock.speed + SPEED_INCREMENT, MAX_SPEED)
    const nextColor = COLORS[(blocks.length + 1) % COLORS.length]

    const nextMovingBlock: MovingBlock = {
      position: new THREE.Vector3(
        nextDirection === 'x' ? -SWING_DISTANCE : newBlockPos.x,
        newBlockPos.y + BLOCK_HEIGHT,
        nextDirection === 'z' ? -SWING_DISTANCE : newBlockPos.z
      ),
      size: newBlockSize.clone(),
      direction: nextDirection,
      speed: nextSpeed,
      color: nextColor,
    }

    setMovingBlock(nextMovingBlock)
    gameRef.current.direction = 1
  }, [blocks, movingBlock, score, onGameOver, onScoreUpdate])

  // Handle input
  useEffect(() => {
    const handleInput = (e: KeyboardEvent | TouchEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.code !== 'Space') return
      if (gameState === 'playing' && gameRef.current.isPlaying) {
        e.preventDefault()
        placeBlock()
      }
    }

    window.addEventListener('keydown', handleInput)
    window.addEventListener('touchstart', handleInput)
    window.addEventListener('click', handleInput)

    return () => {
      window.removeEventListener('keydown', handleInput)
      window.removeEventListener('touchstart', handleInput)
      window.removeEventListener('click', handleInput)
    }
  }, [gameState, placeBlock])

  // Animate moving block
  useFrame(() => {
    if (!movingBlock || !movingBlockRef.current || !gameRef.current.isPlaying) return

    const axis = movingBlock.direction
    const newPos = movingBlock.position[axis] + movingBlock.speed * gameRef.current.direction

    if (Math.abs(newPos) > SWING_DISTANCE) {
      gameRef.current.direction *= -1
    }

    movingBlock.position[axis] = newPos
    movingBlockRef.current.position.copy(movingBlock.position)
  })

  // Camera follow
  useFrame(({ camera }) => {
    const targetY = blocks.length * BLOCK_HEIGHT + 3
    camera.position.y += (targetY + 5 - camera.position.y) * 0.05
    camera.lookAt(0, targetY - 5, 0)
  })

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[8, 0.5, 8]} />
        <meshStandardMaterial
          color="#1e1b4b"
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Settled blocks */}
      {blocks.map((block) => (
        <GlassBlock
          key={block.id}
          position={block.position}
          size={block.size}
          color={block.color}
        />
      ))}

      {/* Moving block */}
      {movingBlock && gameRef.current.isPlaying && (
        <group ref={movingBlockRef} position={movingBlock.position}>
          <GlassBlock
            position={[0, 0, 0]}
            size={[movingBlock.size.x, movingBlock.size.y, movingBlock.size.z]}
            color={movingBlock.color}
            glow
          />
        </group>
      )}
    </group>
  )
}

export default GameScene

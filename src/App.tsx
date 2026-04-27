import { useState, useCallback } from 'react'
import Game from './components/Game'
import './styles.css'

export type GameState = 'menu' | 'playing' | 'gameover'

function App() {
  const [gameState, setGameState] = useState<GameState>('menu')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('crystalStackHighScore')
    return saved ? parseInt(saved, 10) : 0
  })

  const startGame = useCallback(() => {
    setScore(0)
    setGameState('playing')
  }, [])

  const endGame = useCallback((finalScore: number) => {
    setScore(finalScore)
    if (finalScore > highScore) {
      setHighScore(finalScore)
      localStorage.setItem('crystalStackHighScore', finalScore.toString())
    }
    setGameState('gameover')
  }, [highScore])

  const updateScore = useCallback((newScore: number) => {
    setScore(newScore)
  }, [])

  return (
    <div className="app-container">
      {/* Animated gradient background */}
      <div className="gradient-bg" />
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />

      {/* 3D Game Canvas */}
      <Game
        gameState={gameState}
        onGameOver={endGame}
        onScoreUpdate={updateScore}
      />

      {/* UI Overlay */}
      {gameState === 'menu' && (
        <div className="overlay menu-overlay">
          <div className="glass-panel menu-panel">
            <h1 className="game-title">
              <span className="title-crystal">CRYSTAL</span>
              <span className="title-stack">STACK</span>
            </h1>
            <p className="game-subtitle">Stack the glass. Reach the sky.</p>
            <button className="glass-button play-button" onClick={startGame}>
              <span className="button-text">PLAY</span>
              <span className="button-glow" />
            </button>
            <div className="high-score-display">
              <span className="score-label">HIGH SCORE</span>
              <span className="score-value">{highScore}</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="hud">
          <div className="glass-panel score-panel">
            <span className="hud-label">SCORE</span>
            <span className="hud-score">{score}</span>
          </div>
          <p className="tap-hint">TAP or SPACE to drop</p>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="overlay gameover-overlay">
          <div className="glass-panel gameover-panel">
            <h2 className="gameover-title">TOWER COLLAPSED</h2>
            <div className="final-score">
              <span className="final-label">SCORE</span>
              <span className="final-value">{score}</span>
            </div>
            {score >= highScore && score > 0 && (
              <div className="new-record">NEW RECORD!</div>
            )}
            <button className="glass-button retry-button" onClick={startGame}>
              <span className="button-text">TRY AGAIN</span>
              <span className="button-glow" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <span>Requested by @fanioz &middot; Built by @clonkbot</span>
      </footer>
    </div>
  )
}

export default App

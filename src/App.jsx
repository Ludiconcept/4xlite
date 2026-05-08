import React from 'react'
import { useGameStore, hasSave } from './store/gameStore.js'
import { SetupWizard } from './components/Setup/SetupWizard.jsx'
import { GameScreen } from './components/Layout/GameScreen.jsx'

function HomeScreen({ onNew, onResume, hasSavedGame }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 64, fontWeight: 700, color: '#1e3a5f', letterSpacing: '.05em', marginBottom: 8 }}>4X Lite</h1>
        <p style={{ fontSize: 18, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>Le Roll & Write 4X</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>Un jeu de Mathieu Baiget</p>
        <p style={{ fontSize: 14, color: '#94a3b8' }}>Édité par Ludiconcept</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
        {hasSavedGame && (
          <button onClick={onResume} style={{ width: '100%', padding: '12px 24px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
            Reprendre la partie
          </button>
        )}
        <button onClick={onNew} style={{ width: '100%', padding: '12px 24px', background: '#e07b1a', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 500, cursor: 'pointer' }}>
          Nouvelle partie
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#cbd5e1', position: 'absolute', bottom: 16 }}>v0.91 — Sprint 2</p>
    </div>
  )
}

export default function App() {
  const game = useGameStore((s) => s.game)
  const startNewGame = useGameStore((s) => s.startNewGame)
  const resumeGame = useGameStore((s) => s.resumeGame)

  if (!game) {
    return <HomeScreen onNew={startNewGame} onResume={resumeGame} hasSavedGame={hasSave()} />
  }
  if (game.phase === 'setup') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <SetupWizard />
      </div>
    )
  }
  return <GameScreen />
}

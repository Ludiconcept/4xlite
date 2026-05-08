import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { GameMap } from '../Map/GameMap.jsx'
import { ResourceBar } from './ResourceBar.jsx'
import { PopulationPanel } from './PopulationPanel.jsx'
import { RightPanel } from './RightPanel.jsx'

function TopBar({ onRules, onJournal }) {
  const game = useGameStore((s) => s.game)

  return (
    <div style={{ background: '#1e3a5f', padding: '7px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
      <span style={{ fontWeight: 500, fontSize: 15, letterSpacing: '.05em', color: '#ffffff' }}>
        4X Lite
      </span>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <span style={{ fontSize: 12, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', padding: '3px 10px', borderRadius: 10, color: '#ffffff' }}>
          Tour {game?.turn ?? 0}
        </span>
        <button onClick={onRules} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.5)', color: '#ffffff', padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          📖 Règles
        </button>
        <button onClick={onJournal} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.18)', border: '1.5px solid rgba(255,255,255,.5)', color: '#ffffff', padding: '5px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
          📜 Journal
        </button>
      </div>
    </div>
  )
}

function ActionZone() {
  const [diceValues, setDiceValues] = useState([])
  const [rolled, setRolled] = useState(false)
  const [selected, setSelected] = useState([])

  const DIE_ACTIONS = {
    1: 'Récolter', 2: 'Récolter',
    3: 'Construire',
    4: 'Explorer / Coloniser / Attaquer',
    5: 'Étudier',
    6: 'Grandir',
  }

  function roll() {
    const vals = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
    setDiceValues(vals)
    setRolled(true)
    setSelected([])
  }

  function toggleDie(i) {
    if (!rolled) return
    if (selected.includes(i)) {
      setSelected(selected.filter((x) => x !== i))
    } else if (selected.length < 2) {
      setSelected([...selected, i])
    }
  }

  return (
    <div style={{ background: 'white', borderTop: '0.5px solid #e2e8f0', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
      {!rolled ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Tour en attente</span>
          <button onClick={roll} style={{ background: '#e07b1a', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            🎲 Lancer les dés
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a', minWidth: 90 }}>
              {selected.length < 2 ? `✓ Choisissez ${2 - selected.length} dé${2 - selected.length > 1 ? 's' : ''}` : '✓ Dés choisis'}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {diceValues.map((val, i) => {
                const isSel = selected.includes(i)
                const isDimmed = !isSel && selected.length >= 2
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <button
                      onClick={() => toggleDie(i)}
                      style={{
                        width: 40, height: 40, borderRadius: 9,
                        border: isSel ? '2px solid #e07b1a' : '1.5px solid #cbd5e1',
                        background: isSel ? '#fff7ed' : 'white',
                        color: isSel ? '#e07b1a' : '#1e293b',
                        fontSize: 18, fontWeight: 600, cursor: 'pointer',
                        opacity: isDimmed ? 0.3 : 1,
                        transition: 'all .15s',
                        transform: isSel ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {val}
                    </button>
                    <span style={{ fontSize: 9, color: isSel ? '#e07b1a' : '#94a3b8', textAlign: 'center', maxWidth: 44, lineHeight: 1.2, fontWeight: isSel ? 500 : 400 }}>
                      {DIE_ACTIONS[val]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {selected.length === 2 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Actions ce tour :</span>
              {selected.map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1.5px solid #2563eb', borderRadius: 8, padding: '6px 12px' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 }}>
                    {diceValues[i]}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#1d4ed8' }}>{DIE_ACTIONS[diceValues[i]]}</span>
                </div>
              ))}
              <button
                onClick={() => { setRolled(false); setDiceValues([]); setSelected([]) }}
                style={{ marginLeft: 'auto', background: '#1e3a5f', color: 'white', border: 'none', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              >
                Fin du tour →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function JournalPanel({ onClose }) {
  const entries = useLogStore((s) => s.entries)
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 80, width: 300, background: 'white', borderRadius: 12, border: '0.5px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,.12)', zIndex: 100 }}>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 500, fontSize: 14 }}>📜 Journal de partie</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ padding: '8px 14px', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.length === 0
          ? <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucune action enregistrée.</p>
          : entries.map((e) => (
            <div key={e.id} style={{ fontSize: 12, color: '#475569', borderBottom: '0.5px solid #f1f5f9', paddingBottom: 4 }}>
              <span style={{ color: '#94a3b8', marginRight: 6 }}>Tour {e.turn}</span>
              {e.text}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export function GameScreen() {
  const game = useGameStore((s) => s.game)
  const [showJournal, setShowJournal] = useState(false)
  const [selectedTile, setSelectedTile] = useState(null)

  if (!game) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f7f2', overflow: 'hidden' }}>
      <TopBar onRules={() => alert('Manuel de règles — Sprint 8')} onJournal={() => setShowJournal((v) => !v)} />
      <ResourceBar onInnovationsClick={() => alert('Innovations — Sprint 7')} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <PopulationPanel />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}>
          <GameMap
            map={game.map}
            empires={game.empires}
            onTileClick={setSelectedTile}
            selectedTile={selectedTile}
          />
        </div>
        <RightPanel />
      </div>

      <ActionZone />

      {showJournal && <JournalPanel onClose={() => setShowJournal(false)} />}
    </div>
  )
}

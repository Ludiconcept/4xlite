import { useEffect, useRef, useState } from 'react'
import { useDiceStore } from '../../store/diceStore.js'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'

const DIE_ACTION = {
  1: { label:'Récolter',                        short:'Récolter',    color:'#16a34a' },
  2: { label:'Récolter',                        short:'Récolter',    color:'#16a34a' },
  3: { label:'Construire',                      short:'Construire',  color:'#0369a1' },
  4: { label:'Explorer / Coloniser / Attaquer', short:'Expl./Col./Att.', color:'#7c3aed' },
  5: { label:'Étudier',                         short:'Étudier',     color:'#b45309' },
  6: { label:'Grandir',                         short:'Grandir',     color:'#be185d' },
}

// ── Dé animé numéroté avec rebond ────────────────────────────
function AnimatedDie({ value, isRolling, isSelected, isDimmed, size = 48, onClick }) {
  const [display, setDisplay]   = useState(value)
  const [bouncing, setBouncing] = useState(false)
  const interval = useRef(null)
  const prevRolling = useRef(isRolling)

  useEffect(() => {
    if (isRolling) {
      prevRolling.current = true
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random() * 6) + 1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(value)
      if (prevRolling.current) {
        // Rebond final
        setBouncing(true)
        setTimeout(() => setBouncing(false), 350)
        prevRolling.current = false
      }
    }
    return () => clearInterval(interval.current)
  }, [isRolling, value])

  const cfg = DIE_ACTION[display] || DIE_ACTION[1]

  return (
    <button onClick={onClick} disabled={isDimmed || isRolling}
      style={{
        width: size, height: size, borderRadius: 10,
        border: isSelected ? '2px solid #e07b1a' : '1.5px solid #cbd5e1',
        background: isSelected ? '#fff7ed' : 'white',
        color: isSelected ? '#e07b1a' : '#1e293b',
        cursor: (isDimmed || isRolling) ? 'default' : 'pointer',
        opacity: isDimmed ? 0.3 : 1,
        fontSize: Math.floor(size * 0.46), fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative',
        transition: 'border-color .15s',
        transform: bouncing ? 'scale(1.2)' : isSelected ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isSelected ? '0 2px 8px rgba(224,123,26,.25)' : 'none',
      }}
    >
      {isRolling ? '?' : display}
    </button>
  )
}

// ── Popup fin de tour anticipée ───────────────────────────────
function EndTurnConfirm({ nbRemaining, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:320, display:'flex', flexDirection:'column', gap:14, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
        <h3 style={{ fontWeight:600, fontSize:16, color:'#1e293b' }}>⚠️ Fin de tour anticipée</h3>
        <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>
          Il vous reste <strong>{nbRemaining} action{nbRemaining > 1 ? 's' : ''}</strong> non réalisée{nbRemaining > 1 ? 's' : ''}.<br/>
          En terminant maintenant, vous perdez ces actions et le tour des empires adverses commence.
        </p>
        <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#92400e' }}>
          Êtes-vous sûr de vouloir terminer votre tour ?
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'9px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:13, cursor:'pointer' }}>
            ← Revenir
          </button>
          <button onClick={onConfirm} style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Terminer quand même
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export function DiceZone({ onTurnEnd, onActionsConfirmed, onActionClick, confirmedActions = [], usedActions = [] }) {
  // Use ref to always have fresh usedActions count in callbacks
  const usedActionsRef = useRef(usedActions)
  usedActionsRef.current = usedActions
  const { values, rolling, selected, rolled, maxSelect, rollDice, toggleSelect, reset } = useDiceStore()
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  // Phases : 'idle' | 'rolled' | 'acting' | 'done'
  const [phase, setPhase]             = useState('idle')
  const [showConfirm, setShowConfirm] = useState(false)
  const [turnNumber, setTurnNumber]   = useState(game?.turn || 1)

  const isAnimating  = rolling.length > 0
  // usedActions = array of indices of used actions
  const nbUsed = usedActions.length
  const nbRemaining = Math.max(0, confirmedActions.length - nbUsed)
  const allUsed = confirmedActions.length > 0 && nbRemaining === 0
  // Sync phase when all actions done
  // (phase stays 'acting' even when all used - that's intentional, fin de tour ends it)

  function handleRoll() {
    rollDice(4)
    setPhase('rolled')
  }

  function confirmSelection() {
    if (selected.length < maxSelect || isAnimating) return
    const actions = selected.map(i => ({ dieIndex: i, value: values[i] }))
    const newTurn = (game?.turn || 0) + 1
    setTurnNumber(newTurn)
    updateGame(g => ({ ...g, turn: newTurn }))
    addEntry(`Tour ${newTurn} — Dés choisis : ${actions.map(a => a.value).join(' et ')}`, newTurn)
    onActionsConfirmed?.(actions)
    setPhase('acting')
  }

  function handleEndTurn() {
    // Use ref for fresh value (avoids stale closure after async state updates)
    const freshUsed = usedActionsRef.current.length
    const freshRemaining = Math.max(0, confirmedActions.length - freshUsed)
    if (phase === 'acting' && freshRemaining > 0) { setShowConfirm(true); return }
    doEndTurn()
  }

  function doEndTurn() {
    setShowConfirm(false)
    reset()
    setPhase('idle')
    onTurnEnd?.()
  }

  return (
    <>
      <div style={{ background:'white', borderTop:'0.5px solid #e2e8f0', padding:'10px 14px', flexShrink:0 }}>

        {/* IDLE */}
        {phase === 'idle' && (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>
              Tour {turnNumber} — En attente
            </span>
            <button onClick={handleRoll} style={{ background:'#e07b1a', color:'white', border:'none', padding:'8px 22px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <span style={{ fontSize:16 }}>🎲</span> Lancer les dés
            </button>
          </div>
        )}

        {/* ROLLED — choisir 2 dés */}
        {phase === 'rolled' && (
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:500, minWidth:130, flexShrink:0, color: isAnimating ? '#94a3b8' : selected.length < maxSelect ? '#f59e0b' : '#16a34a' }}>
              {isAnimating
                ? '🎲 Lancer en cours…'
                : selected.length < maxSelect
                  ? `Tour ${turnNumber} — Choisissez ${maxSelect - selected.length} dé${maxSelect - selected.length > 1 ? 's' : ''}`
                  : `✓ Confirmez vos 2 actions`
              }
            </span>
            <div style={{ display:'flex', gap:8 }}>
              {values.map((val, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <AnimatedDie
                    value={val}
                    isRolling={rolling.includes(i)}
                    isSelected={selected.includes(i)}
                    isDimmed={!selected.includes(i) && selected.length >= maxSelect && !rolling.includes(i)}
                    onClick={() => !isAnimating && toggleSelect(i)}
                  />
                  <span style={{ fontSize:9, color: selected.includes(i) ? DIE_ACTION[val]?.color : '#94a3b8', textAlign:'center', maxWidth:52, lineHeight:1.2, fontWeight: selected.includes(i) ? 500 : 400 }}>
                    {isAnimating ? '' : DIE_ACTION[val]?.short}
                  </span>
                </div>
              ))}
            </div>
            {selected.length === maxSelect && !isAnimating && (
              <button onClick={confirmSelection} style={{ marginLeft:8, background:'#1e3a5f', color:'white', border:'none', padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                Confirmer →
              </button>
            )}
          </div>
        )}

        {/* ACTING / DONE — faire les actions */}
        {(phase === 'acting' || phase === 'done') && (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:'#64748b', fontWeight:500, flexShrink:0 }}>
              Tour {turnNumber} — Actions :
            </span>
            {confirmedActions.map((action, i) => {
              const isUsed = usedActions.includes(i)
              const cfg    = DIE_ACTION[action.value] || DIE_ACTION[1]
              return (
                <button key={i}
                  onClick={() => { if (!isUsed) onActionClick?.({ action, idx: i }) }}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    background: isUsed ? '#f1f5f9' : `${cfg.color}15`,
                    border: `1.5px solid ${isUsed ? '#e2e8f0' : cfg.color + '60'}`,
                    borderRadius:7, padding:'5px 12px',
                    cursor: isUsed ? 'default' : 'pointer',
                    opacity: isUsed ? 0.5 : 1,
                    transition:'all .15s',
                  }}
                >
                  <div style={{ width:22, height:22, borderRadius:5, background: isUsed ? '#94a3b8' : cfg.color, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>
                    {action.value}
                  </div>
                  <span style={{ fontSize:11, fontWeight:500, color: isUsed ? '#94a3b8' : cfg.color }}>
                    {isUsed ? '✓ ' : ''}{cfg.label}
                  </span>
                </button>
              )
            })}
            <button onClick={handleEndTurn} style={{ marginLeft:'auto', background: allUsed ? '#16a34a' : '#1e3a5f', color:'white', border:'none', padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' }}>
              {allUsed ? '✓ Fin du tour' : 'Fin du tour →'}
            </button>
          </div>
        )}
      </div>

      {showConfirm && (
        <EndTurnConfirm
          nbRemaining={nbRemaining}
          onConfirm={doEndTurn}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}

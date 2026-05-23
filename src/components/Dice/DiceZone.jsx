import { useEffect, useRef, useState } from 'react'
import { useDiceStore } from '../../store/diceStore.js'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'

const DIE_ACTION = {
  1: { label:'Récolter',                        short:'Récolter',        color:'#16a34a' },
  2: { label:'Récolter',                        short:'Récolter',        color:'#16a34a' },
  3: { label:'Construire',                      short:'Construire',      color:'#0369a1' },
  4: { label:'Explorer / Coloniser / Attaquer', short:'Expl./Col./Att.', color:'#7c3aed' },
  5: { label:'Étudier',                         short:'Étudier',         color:'#b45309' },
  6: { label:'Grandir',                         short:'Grandir',         color:'#be185d' },
}

function AnimatedDie({ value, isRolling, isSelected, isDimmed, size = 48, onClick }) {
  const [display, setDisplay]   = useState(value)
  const [bouncing, setBouncing] = useState(false)
  const prevRolling = useRef(isRolling)
  const interval    = useRef(null)

  useEffect(() => {
    if (isRolling) {
      prevRolling.current = true
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random() * 6) + 1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(value)
      if (prevRolling.current) { setBouncing(true); setTimeout(() => setBouncing(false), 350); prevRolling.current = false }
    }
    return () => clearInterval(interval.current)
  }, [isRolling, value])

  return (
    <button onClick={onClick} disabled={isDimmed || isRolling} style={{
      width: size, height: size, borderRadius: 10,
      border: isSelected ? '2px solid #e07b1a' : '1.5px solid #cbd5e1',
      background: isSelected ? '#fff7ed' : 'white',
      color: isSelected ? '#e07b1a' : '#1e293b',
      cursor: (isDimmed || isRolling) ? 'default' : 'pointer',
      opacity: isDimmed ? 0.3 : 1,
      fontSize: Math.floor(size * 0.46), fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      transform: bouncing ? 'scale(1.2)' : isSelected ? 'scale(1.08)' : 'scale(1)',
      transition: 'transform .12s, border-color .12s',
      boxShadow: isSelected ? '0 2px 8px rgba(224,123,26,.25)' : 'none',
    }}>
      {isRolling ? '?' : display}
    </button>
  )
}

function EndTurnConfirm({ nbRemaining, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:24, width:320, display:'flex', flexDirection:'column', gap:14, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
        <h3 style={{ fontWeight:600, fontSize:16, color:'#1e293b' }}>⚠️ Fin de tour anticipée</h3>
        <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>
          Il vous reste <strong>{nbRemaining} action{nbRemaining > 1 ? 's' : ''}</strong> non réalisée{nbRemaining > 1 ? 's' : ''}. En terminant, vous perdez ces actions.
        </p>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:'9px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:13, cursor:'pointer' }}>← Revenir</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'9px 0', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Terminer quand même</button>
        </div>
      </div>
    </div>
  )
}

export function DiceZone({
  onTurnEnd, onActionsConfirmed, onActionClick, onActionsPhaseStart,
  onDiceRolled,
  confirmedActions = [], usedActions = [],
  externalDiceValues, onDiceValuesChange,
  showSpeciales, onToggleSpeciales,
}) {
  const { values: storeValues, rolling, selected, rolled, maxSelect, rollDice, toggleSelect, reset, setMaxSelect } = useDiceStore()
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [phase, setPhase]             = useState('idle')
  const [showConfirm, setShowConfirm] = useState(false)
  const [turnNumber, setTurnNumber]   = useState(game?.turn || 1)

  const values        = (externalDiceValues && externalDiceValues.length > 0) ? externalDiceValues : storeValues
  const equiperActif  = game?.activeEffects?.equiperActif || false
  const servageActif    = game?.activeEffects?.servageActif || false
  const prierCharges    = game?.prierCharges || 0
  const etudierGratuit  = game?.activeEffects?.etudierGratuit || false
  const genieCivilDe   = game?.nextTurnEffects?.genieCivilDe   || false
  const isAnimating   = rolling.length > 0

  // Si Servage activé pendant la phase 'rolled', augmenter maxSelect immédiatement
  useEffect(() => {
    if (servageActif && phase === 'rolled' && maxSelect < 3) {
      setMaxSelect(3)
      updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, servageActif: false } }))
    }
  }, [servageActif]) // eslint-disable-line
  const usedActionsRef = useRef(usedActions)
  usedActionsRef.current = usedActions
  const nbRemaining   = Math.max(0, confirmedActions.length - usedActions.length)
  const allUsed       = confirmedActions.length > 0 && nbRemaining === 0

  function handleRoll() {
    // Génie civil : ajouter un dé fixe 3 AVANT le lancer
    if (genieCivilDe) {
      onActionsConfirmed?.([...confirmedActions, { dieIndex: 98, value: 3, genieCivilDe: true }])
      updateGame(g => ({ ...g, nextTurnEffects: { ...g.nextTurnEffects, genieCivilDe: false } }))
    }
    const nb = servageActif ? 3 : 2
    setMaxSelect(nb)
    rollDice(4)
    setPhase('rolled')
    onDiceRolled?.()  // notifie GameScreen → dicePhase = 'rolled' → Équiper disponible
    if (servageActif) {
      updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, servageActif: false } }))
    }
    // etudierGratuit : pas de rollDice supplémentaire, le 5e dé est fixe (géré au rendu)
  }

  function confirmSelection() {
    if (selected.length < maxSelect || isAnimating) return
    let actions = selected.map(i => ({ dieIndex: i, value: values[i] }))
    // etudierGratuit : ajouter un dé fixe 5 aux actions
    if (etudierGratuit) {
      actions = [...actions, { dieIndex: 99, value: 5, etudierGratuit: true }]
      updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, etudierGratuit: false } }))
    }
    // genieCivilDe géré dans handleRoll
    const newTurn = (game?.turn || 0) + 1
    setTurnNumber(newTurn)
    updateGame(g => ({ ...g, turn: newTurn }))
    addEntry(`Tour ${newTurn} — Dés : ${actions.map(a => a.value).join(', ')}`, newTurn)
    onActionsConfirmed?.(actions)
    onActionsPhaseStart?.()
    setPhase('acting')
    if (equiperActif) {
      updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, equiperActif: false } }))
    }
  }

  function handleEndTurn() {
    const freshRemaining = Math.max(0, confirmedActions.length - usedActionsRef.current.length)
    if (phase === 'acting' && freshRemaining > 0) { setShowConfirm(true); return }
    doEndTurn()
  }

  function doEndTurn() {
    setShowConfirm(false)
    setMaxSelect(2)
    reset()
    setPhase('idle')
    onTurnEnd?.()
  }

  return (
    <>
      <div style={{ background:'white', padding:'10px 14px', flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>

        {/* ZONE PRINCIPALE DÉS */}
        <div style={{ flex:1 }}>

          {/* IDLE */}
          {phase === 'idle' && (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Tour {turnNumber} — En attente</span>
              {servageActif && <span style={{ fontSize:11, color:'#1e40af', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:6, padding:'2px 8px' }}>⛓️ Servage : 3 dés</span>}
              {etudierGratuit && <span style={{ fontSize:11, color:'#92400e', background:'#fffbeb', border:'1px solid #f59e0b', borderRadius:6, padding:'2px 8px' }}>📜 Étudier gratuit</span>}
              {genieCivilDe && <span style={{ fontSize:11, color:'#1e40af', background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:6, padding:'2px 8px' }}>⚙️ Génie civil</span>}
              <button onClick={handleRoll} style={{ background:'#e07b1a', color:'white', border:'none', padding:'8px 22px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ fontSize:16 }}>🎲</span> Lancer les dés
              </button>
            </div>
          )}

          {/* ROLLED */}
          {phase === 'rolled' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, fontWeight:500, minWidth:130, flexShrink:0, color: isAnimating ? '#94a3b8' : selected.length < maxSelect ? '#f59e0b' : '#16a34a' }}>
                {isAnimating ? '🎲 Lancer…'
                  : selected.length < maxSelect
                    ? `Tour ${turnNumber} — Choisissez ${maxSelect - selected.length} dé${maxSelect - selected.length > 1 ? 's' : ''}`
                    : '✓ Confirmez vos actions'}
              </span>

              <div style={{ display:'flex', gap:8 }}>
                {values.map((val, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                    {/* Bouton + si Équiper actif */}
                    {equiperActif && !isAnimating ? (
                      <button onClick={() => {
                        if ((game?.resources?.fer || 0) < 1) return
                        const next = [...values]; next[i] = Math.min(6, next[i] + 1)
                        onDiceValuesChange?.(next)
                        updateGame(g => ({ ...g, resources: { ...g.resources, fer: Math.max(0, (g.resources.fer||0) - 1) } }))
                      }} disabled={val >= 6 || (game?.resources?.fer||0) < 1} style={{ width:22, height:16, borderRadius:3, border:'1px solid #f59e0b', background: val>=6||(game?.resources?.fer||0)<1 ? '#f8fafc' : '#fffbeb', cursor: val>=6||(game?.resources?.fer||0)<1 ? 'default':'pointer', fontSize:11, fontWeight:700, color:'#d97706', opacity: val>=6||(game?.resources?.fer||0)<1 ? 0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                    ) : <div style={{ height:16 }} />}

                    <AnimatedDie
                      value={val} isRolling={rolling.includes(i)}
                      isSelected={selected.includes(i)}
                      isDimmed={!selected.includes(i) && selected.length >= maxSelect && !rolling.includes(i)}
                      onClick={() => !isAnimating && toggleSelect(i)}
                    />

                    {/* Bouton - si Équiper actif */}
                    {equiperActif && !isAnimating ? (
                      <button onClick={() => {
                        if ((game?.resources?.fer || 0) < 1) return
                        const next = [...values]; next[i] = Math.max(1, next[i] - 1)
                        onDiceValuesChange?.(next)
                        updateGame(g => ({ ...g, resources: { ...g.resources, fer: Math.max(0, (g.resources.fer||0) - 1) } }))
                      }} disabled={val <= 1 || (game?.resources?.fer||0) < 1} style={{ width:22, height:16, borderRadius:3, border:'1px solid #f59e0b', background: val<=1||(game?.resources?.fer||0)<1 ? '#f8fafc' : '#fffbeb', cursor: val<=1||(game?.resources?.fer||0)<1 ? 'default':'pointer', fontSize:11, fontWeight:700, color:'#d97706', opacity: val<=1||(game?.resources?.fer||0)<1 ? 0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    ) : <div style={{ height:16 }} />}

                    <span style={{ fontSize:9, color: selected.includes(i) ? DIE_ACTION[val]?.color : '#94a3b8', textAlign:'center', maxWidth:52, lineHeight:1.2, fontWeight: selected.includes(i) ? 500 : 400 }}>
                      {isAnimating ? '' : DIE_ACTION[val]?.short}
                    </span>
                  </div>
                ))}
              </div>

              {equiperActif && !isAnimating && (
                <div style={{ fontSize:10, color:'#d97706', background:'#fffbeb', border:'1px solid #f59e0b', borderRadius:6, padding:'2px 8px', flexShrink:0 }}>
                  ⚙️ {game?.resources?.fer || 0} Fer dispo.
                </div>
              )}

              {/* Dé fixe Génie civil 3 */}
              {genieCivilDe && !isAnimating && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ height:16 }} />
                  <div style={{ width:48, height:48, borderRadius:8, background:'#eff6ff', border:'2px solid #93c5fd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#1e40af', position:'relative' }}>
                    3
                    <span style={{ position:'absolute', top:-6, right:-6, fontSize:10, background:'#3b82f6', color:'white', borderRadius:4, padding:'1px 3px' }}>🔒</span>
                  </div>
                  <div style={{ height:16 }} />
                  <span style={{ fontSize:9, color:'#1e40af', textAlign:'center', maxWidth:52, lineHeight:1.2, fontWeight:500 }}>Génie civil</span>
                </div>
              )}

              {/* Dé fixe Étudier si etudierGratuit actif */}
              {etudierGratuit && !isAnimating && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ height:16 }} />
                  <div style={{ width:48, height:48, borderRadius:8, background:'#fffbeb', border:'2px solid #f59e0b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#92400e', position:'relative' }}>
                    5
                    <span style={{ position:'absolute', top:-6, right:-6, fontSize:10, background:'#f59e0b', color:'white', borderRadius:4, padding:'1px 3px' }}>🔒</span>
                  </div>
                  <div style={{ height:16 }} />
                  <span style={{ fontSize:9, color:'#92400e', textAlign:'center', maxWidth:52, lineHeight:1.2, fontWeight:500 }}>Étudier</span>
                </div>
              )}

              {/* Bouton Prier — relancer les dés */}
              {prierCharges > 0 && !isAnimating && (
                <button onClick={() => {
                  updateGame(g => ({ ...g, prierCharges: Math.max(0, (g.prierCharges||0)-1) }))
                  rollDice(maxSelect)
                  setSelected([])
                }} style={{ marginLeft:4, background:'#faf5ff', border:'1.5px solid #7c3aed', color:'#5b21b6', padding:'7px 12px', borderRadius:8, fontSize:11, fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                  🙏 Prier ({prierCharges})
                </button>
              )}

              {selected.length === maxSelect && !isAnimating && (
                <button onClick={confirmSelection} style={{ marginLeft:4, background:'#1e3a5f', color:'white', border:'none', padding:'7px 18px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                  Confirmer →
                </button>
              )}
            </div>
          )}

          {/* ACTING / DONE */}
          {(phase === 'acting' || phase === 'done') && (
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:12, color:'#64748b', fontWeight:500, flexShrink:0 }}>Tour {turnNumber} — Actions :</span>
              {confirmedActions.map((action, i) => {
                const isUsed = usedActions.includes(i)
                const cfg    = DIE_ACTION[action.value] || DIE_ACTION[1]
                return (
                  <button key={i} onClick={() => { if (!isUsed) onActionClick?.({ action, idx: i }) }} style={{
                    display:'flex', alignItems:'center', gap:6,
                    background: isUsed ? '#f1f5f9' : `${cfg.color}15`,
                    border: `1.5px solid ${isUsed ? '#e2e8f0' : cfg.color + '60'}`,
                    borderRadius:7, padding:'5px 12px',
                    cursor: isUsed ? 'default' : 'pointer', opacity: isUsed ? 0.5 : 1,
                  }}>
                    <div style={{ width:22, height:22, borderRadius:5, background: isUsed ? '#94a3b8' : cfg.color, color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>
                      {action.value}
                    </div>
                    <span style={{ fontSize:11, fontWeight:500, color: isUsed ? '#94a3b8' : cfg.color }}>
                      {isUsed ? '✓ ' : ''}{cfg.label}
                    </span>
                  </button>
                )
              })}
              <button onClick={handleEndTurn} style={{ marginLeft:'auto', background: allUsed ? '#16a34a' : '#1e3a5f', color:'white', border:'none', padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer', flexShrink:0 }}>
                {allUsed ? '✓ Fin du tour' : 'Fin du tour →'}
              </button>
            </div>
          )}
        </div>

        {/* BOUTON ACTIONS SPÉCIALES — juste à droite des dés, dans la barre */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={onToggleSpeciales} style={{
            padding:'8px 14px',
            background: showSpeciales ? '#7c3aed' : 'white',
            border: `2px solid ${showSpeciales ? '#7c3aed' : '#c4b5fd'}`,
            borderRadius:10, cursor:'pointer',
            color: showSpeciales ? 'white' : '#7c3aed',
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            minWidth:64, transition:'all .15s',
            boxShadow: showSpeciales ? '0 2px 8px rgba(124,58,237,.3)' : '0 1px 3px rgba(0,0,0,.08)',
          }}>
            <span style={{ fontSize:18 }}>⚡</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.04em' }}>SPÉCIALES</span>
          </button>
        </div>

      </div>

      {showConfirm && <EndTurnConfirm nbRemaining={nbRemaining} onConfirm={doEndTurn} onCancel={() => setShowConfirm(false)} />}
    </>
  )
}

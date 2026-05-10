import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { EVENEMENTS } from '../../data/evenements.js'
import {
  lancerDesEmpires, lancerD40, resoudreDe,
  resoudreCombatEmpire, appliquerExpansionImperiale,
  appliquerHegemonieEmpire, appliquerPressionImperiale,
  appliquerEffetsNextTurn,
} from '../../engine/tourEmpires.js'

const POP_LABELS = { fermier:'Fermier', ouvrier:'Ouvrier', artisan:'Artisan', guerrier:'Guerrier', pretre:'Prêtre', noble:'Noble' }
const RES_LABELS = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or' }

// ── Dé empire animé ───────────────────────────────────────────
function EmpireDie({ value, rolling, empireColor }) {
  const [display, setDisplay] = useState('?')
  const [bounce, setBounce]   = useState(false)
  const interval = useRef(null)

  useEffect(() => {
    if (rolling) {
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random()*6)+1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(value ?? '?')
      if (value) { setBounce(true); setTimeout(() => setBounce(false), 350) }
    }
    return () => clearInterval(interval.current)
  }, [rolling, value])

  return (
    <div style={{
      width:44, height:44, borderRadius:10,
      border:`2px solid ${empireColor || '#475569'}`,
      background:'white', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:20, fontWeight:700, color: empireColor || '#475569',
      transform: bounce ? 'scale(1.2)' : 'scale(1)', transition:'transform .12s',
      flexShrink:0,
    }}>{display}</div>
  )
}

// ── Résultat d'un dé affiché ─────────────────────────────────
function ResultatDe({ resultat }) {
  if (!resultat) return null
  const isGrave = resultat.defaite || resultat.action === 'attaque'

  return (
    <div style={{
      padding:'8px 10px', borderRadius:8, fontSize:12, lineHeight:1.5,
      background: isGrave ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isGrave ? '#fca5a5' : '#86efac'}`,
      color: isGrave ? '#dc2626' : '#166534',
    }}>
      {resultat.description}
    </div>
  )
}

// ── Popup choix joueur pour événement ────────────────────────
function EvenementChoixPanel({ evenement, game, onConfirm }) {
  const [choices, setChoices] = useState({})
  const [repetitions, setRep] = useState(0)

  const { effet } = evenement

  if (effet.type === 'gainRessources') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:12, color:'#475569' }}>Choisissez {effet.nb} ressource{effet.nb>1?'s':''} :</p>
        {['nourriture','bois','argile','fer','or'].map(r => {
          const sel = choices[r] || 0
          const total = Object.values(choices).reduce((a,b)=>a+b,0)
          return (
            <div key={r} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ flex:1, fontSize:12 }}>{RES_LABELS[r]}</span>
              <button onClick={() => sel>0 && setChoices({...choices,[r]:sel-1})} disabled={sel===0}
                style={{ width:22, height:22, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:sel>0?'pointer':'default', opacity:sel===0?0.3:1 }}>−</button>
              <span style={{ width:20, textAlign:'center', fontWeight:600 }}>{sel}</span>
              <button onClick={() => total<effet.nb && setChoices({...choices,[r]:sel+1})} disabled={total>=effet.nb}
                style={{ width:22, height:22, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:total<effet.nb?'pointer':'default', opacity:total>=effet.nb?0.3:1 }}>+</button>
            </div>
          )
        })}
        <button onClick={() => {
          if (Object.values(choices).reduce((a,b)=>a+b,0) < effet.nb) return
          const newRes = { ...game.resources }
          for (const [r, q] of Object.entries(choices)) newRes[r] = (newRes[r]||0) + q
          onConfirm({ ...game, resources: newRes })
        }} style={{ padding:'8px 0', borderRadius:8, border:'none', background:'#16a34a', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          Confirmer
        </button>
      </div>
    )
  }

  if (effet.type === 'croissance') {
    const peutPayer = (game.resources.nourriture||0) >= effet.coutNourr
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:12, color:'#475569' }}>{evenement.texte}</p>
        <div style={{ fontSize:12, color:'#64748b' }}>Utilisations : {repetitions}/{effet.maxFois} · Nourriture : {game.resources.nourriture||0}</div>
        {['fermier','ouvrier','artisan','guerrier','pretre','noble'].map(type => (
          <button key={type} disabled={!peutPayer || repetitions>=effet.maxFois}
            onClick={() => {
              const newGame = {
                ...game,
                resources: { ...game.resources, nourriture: (game.resources.nourriture||0) - effet.coutNourr },
                population: { ...game.population, [type]: (game.population[type]||0) + 1 }
              }
              setRep(r => r+1)
              if (repetitions+1 >= effet.maxFois || (newGame.resources.nourriture < effet.coutNourr)) onConfirm(newGame, true)
              else onConfirm(newGame, false)
            }}
            style={{ padding:'7px 9px', borderRadius:7, border:'1px solid #e2e8f0', background:peutPayer&&repetitions<effet.maxFois?'white':'#f8fafc', cursor:peutPayer&&repetitions<effet.maxFois?'pointer':'default', opacity:peutPayer&&repetitions<effet.maxFois?1:0.5, fontSize:12, textAlign:'left' }}>
            +1 {POP_LABELS[type]}
          </button>
        ))}
        <button onClick={() => onConfirm(game, true)} style={{ padding:'7px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Passer</button>
      </div>
    )
  }

  // Cas génériques — juste confirmer
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>{evenement.texte}</p>
      <button onClick={() => onConfirm(game, true)} style={{ padding:'9px 0', borderRadius:8, border:'none', background:'#1e3a5f', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
        Continuer
      </button>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────
export function TourEmpiresPanel({ onClose }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  // Phases : 'rolling' | 'resolving' | 'waitingPlayer' | 'done'
  const [phase, setPhase]         = useState('rolling')
  const [desValues, setDesValues] = useState([null,null,null,null])
  const [rolling, setRolling]     = useState(true)
  const [currentDieIdx, setCurrent] = useState(-1)  // dé en cours de résolution
  const [resultats, setResultats] = useState([])
  const [pendingCombat, setPendingCombat] = useState(null)
  const [pendingEvent, setPendingEvent]   = useState(null)
  const [localGame, setLocalGame] = useState(game)
  const [highlightCase, setHighlight] = useState(null)

  // Lancer les dés au montage
  useEffect(() => {
    const vals = lancerDesEmpires()
    setTimeout(() => {
      setDesValues(vals)
      setRolling(false)
      // Résoudre après l'animation
      setTimeout(() => resoudreSequentiellement(vals), 600)
    }, 800)
  }, []) // eslint-disable-line

  async function resoudreSequentiellement(vals) {
    setPhase('resolving')
    let currentGameState = localGame

    // Trier par valeur croissante pour la résolution (mais afficher dans l'ordre original)
    const ordreResolution = vals.map((v,i) => ({v,i})).sort((a,b) => a.v - b.v)

    for (const { v, i } of ordreResolution) {
      setCurrent(i)
      await pause(400)

      // Lancer D40 si nécessaire
      const d40Value = v === 6 ? lancerD40() : null

      const resultat = resoudreDe(v, currentGameState, { d40Value })

      if (resultat.highlightCase) setHighlight(resultat.highlightCase)

      // Si combat nécessite intervention joueur
      if (resultat.needsCombat) {
        setPendingCombat({ resultat, dieIdx: i })
        setLocalGame(currentGameState)
        setPhase('waitingPlayer')
        return  // Pause — reprendra après interaction
      }

      // Si événement nécessite choix joueur
      if (resultat.type === 'evenement' && resultat.needsPlayerChoice) {
        setPendingEvent({ resultat, dieIdx: i, continueWith: ordreResolution.slice(ordreResolution.findIndex(x=>x.i===i)+1), gameState: resultat.newGame })
        setLocalGame(resultat.newGame)
        setResultats(prev => [...prev, resultat])
        setPhase('waitingPlayer')
        return
      }

      // Appliquer les effets immédiats d'événements
      let newGameState = resultat.newGame
      if (resultat.type === 'evenement' && resultat.applyImmediately) {
        newGameState = appliquerEffetImmediat(resultat.evenement, newGameState)
      }

      currentGameState = newGameState
      setLocalGame(newGameState)
      setResultats(prev => [...prev, resultat])

      if (resultat.defaite) {
        // Condition de défaite
        setPhase('done')
        updateGame(() => newGameState)
        return
      }

      await pause(700)
    }

    // Fin du tour
    setPhase('done')
    updateGame(() => currentGameState)
    addEntry(`Tour des empires — ${vals.join(', ')}`, localGame.turn)
  }

  function appliquerEffetImmediat(evenement, game) {
    switch (evenement.effet.type) {
      case 'expansionImperiale': return appliquerExpansionImperiale(game)
      case 'hegemonieEmpire':    return appliquerHegemonieEmpire(game)
      case 'pressionImperiale':
        return { ...game, activeEffects: { ...game.activeEffects, pressionImperialeActive: true } }
      default: return game
    }
  }

  function handleCombatConfirm() {
    if (!pendingCombat) return
    const { resultat } = pendingCombat
    const tile = localGame.map[resultat.targetCase.row][resultat.targetCase.col]
    const combatResult = resoudreCombatEmpire(resultat.attackerEmpireId, tile, localGame)
    const newGame = combatResult.newGame
    const cfg = EMPIRE_CONFIG[resultat.attackerEmpireId]
    const outcome = combatResult.empireGagne ? '⚔️ L\'empire gagne !' : '🛡️ Vous défendez !'
    setResultats(prev => [...prev, { ...resultat, description: `${resultat.description} ${outcome}` }])
    setLocalGame(newGame)
    setPendingCombat(null)
    setHighlight(null)
    setPhase('done')
    updateGame(() => newGame)
  }

  function handleEventConfirm(newGame, done = true) {
    if (!pendingEvent) return
    setLocalGame(newGame)
    setPendingEvent(null)
    if (done) {
      setPhase('done')
      updateGame(() => newGame)
    }
  }

  function handleClose() {
    // Appliquer les effets nextTurn au game
    const finalGame = appliquerEffetsNextTurn(localGame)
    updateGame(() => finalGame)
    onClose()
  }

  const DIE_COLORS = ['#e1071a','#0891b2','#166534','#ca8a04']

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:16, width:360, display:'flex', flexDirection:'column', gap:12, maxHeight:'80vh', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:500, color:'#1e293b' }}>Tour des empires adverses</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>
            {phase === 'rolling' ? 'Lancer des dés…' : phase === 'done' ? 'Tour terminé' : 'Résolution en cours…'}
          </div>
        </div>
        {phase === 'done' && (
          <button onClick={handleClose} style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#1e3a5f', color:'white', fontSize:12, fontWeight:500, cursor:'pointer' }}>
            Continuer →
          </button>
        )}
      </div>

      {/* Dés */}
      <div style={{ background:'#f8f9fa', border:'0.5px solid #e2e8f0', borderRadius:10, padding:12 }}>
        <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8 }}>4 dés d'empire</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          {desValues.map((v, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <EmpireDie value={v} rolling={rolling} empireColor={currentDieIdx === i ? '#e07b1a' : '#475569'} />
              <div style={{ fontSize:10, color: currentDieIdx === i ? '#e07b1a' : '#94a3b8', fontWeight: currentDieIdx === i ? 500 : 400 }}>
                {v === 1 ? '🐉' : v === 2 ? '🦅' : v === 3 ? '🐺' : v === 4 ? '🦁' : v === 5 ? '📋' : v === 6 ? '⚔️' : '?'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats */}
      {resultats.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {resultats.map((r, i) => <ResultatDe key={i} resultat={r} />)}
        </div>
      )}

      {/* Combat en attente */}
      {phase === 'waitingPlayer' && pendingCombat && (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:10, padding:12 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#dc2626', marginBottom:8 }}>⚔️ Attaque sur votre territoire !</div>
          <p style={{ fontSize:12, color:'#475569', marginBottom:10 }}>{pendingCombat.resultat.description}</p>
          <button onClick={handleCombatConfirm} style={{ width:'100%', padding:'9px 0', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Résoudre le combat
          </button>
        </div>
      )}

      {/* Événement en attente */}
      {phase === 'waitingPlayer' && pendingEvent && (
        <div style={{ background:'#fffbeb', border:'1px solid #fcd34d', borderRadius:10, padding:12 }}>
          <div style={{ fontSize:13, fontWeight:500, color:'#92400e', marginBottom:8 }}>
            {pendingEvent.resultat.evenement.icone} {pendingEvent.resultat.evenement.titre}
          </div>
          <EvenementChoixPanel
            evenement={pendingEvent.resultat.evenement}
            game={localGame}
            onConfirm={handleEventConfirm}
          />
        </div>
      )}
    </div>
  )
}

function pause(ms) { return new Promise(r => setTimeout(r, ms)) }

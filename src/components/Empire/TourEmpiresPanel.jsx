import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import {
  lancerDesEmpires, resoudreDe,
  resoudreCombatEmpireVsJoueur, resoudreCombatEmpireVsEmpire,
  appliquerEffetsNextTurn, appliquerExpansionImperiale,
} from '../../engine/tourEmpires.js'

const pause = ms => new Promise(r => setTimeout(r, ms))

function EmpireDie({ value, rolling, active, size=52 }) {
  const [display, setDisplay] = useState('?')
  const [bounce, setBounce]   = useState(false)
  const interval = useRef(null)
  const prevRolling = useRef(rolling)

  useEffect(() => {
    if (rolling) {
      prevRolling.current = true
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random()*6)+1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(value ?? '?')
      if (prevRolling.current) { setBounce(true); setTimeout(()=>setBounce(false),350); prevRolling.current=false }
    }
    return () => clearInterval(interval.current)
  }, [rolling, value])

  const color = value===6?'#dc2626':value===5?'#7c3aed':value?(EMPIRE_CONFIG[value]?.color||'#475569'):'#475569'
  return (
    <div style={{ width:size, height:size, borderRadius:10, border:`2px solid ${active?'#e07b1a':color}`, background:active?'#fff7ed':'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.floor(size*.44), fontWeight:700, color:active?'#e07b1a':color, transform:bounce?'scale(1.18)':'scale(1)', transition:'transform .12s', flexShrink:0 }}>
      {display}
    </div>
  )
}

// Dé animé (même composant que ActionAttaquer)
function AnimDieCombat({ finalValue, rolling, color = '#1e293b' }) {
  const [display, setDisplay] = useState('?')
  const [bouncing, setBouncing] = useState(false)
  const interval = useRef(null)
  useEffect(() => {
    if (rolling) {
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random()*6)+1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(finalValue ?? '?')
      if (finalValue) { setBouncing(true); setTimeout(()=>setBouncing(false),350) }
    }
    return () => clearInterval(interval.current)
  }, [rolling, finalValue])
  return (
    <div style={{ width:36,height:36,borderRadius:8,border:`2px solid ${color}`,background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:500,color,transform:bouncing?'scale(1.2)':'scale(1)',transition:'transform .12s',flexShrink:0 }}>
      {display}
    </div>
  )
}

function CombatPopup({ empireId, targetCase, game, onConfirm, tributMode=false }) {
  const [guerriers,    setGuerriers]    = useState(0)
  const [soignerUsed,  setSoignerUsed]  = useState(false)
  const [phase,        setPhase]        = useState('prepare') // prepare | rolling | result
  const [rolling,      setRolling]      = useState(false)
  const [dieEmpire,    setDieEmpire]    = useState(null)
  const [dieJoueur,    setDieJoueur]    = useState(null)
  const [combatResult, setCombatResult] = useState(null)

  const cfg        = EMPIRE_CONFIG[empireId]
  const emp        = game.empires?.[empireId] || { power:2, maxPower:8 }
  const maxG       = game.population?.guerrier || 0
  const tile       = game.map[targetCase.row]?.[targetCase.col]
  // Armer : appliqué automatiquement si actif
  const armerActif = game.activeEffects?.armerActif || false
  const hasHopital = game.map.flat().some(t => t.owner==='player' && t.buildings?.includes('hopital'))
  const hasNourriture = (game.resources?.nourriture||0) >= 1

  async function lancerCombat() {
    setPhase('rolling'); setRolling(true); setDieEmpire(null); setDieJoueur(null)
    await new Promise(r => setTimeout(r, 700))
    const res = resoudreCombatEmpireVsJoueur(empireId, tile, game, guerriers)
    // Garder les pertes BRUTES — les réductions seront appliquées à la confirmation
    setDieEmpire(res.de2); setDieJoueur(res.de1); setRolling(false)
    await new Promise(r => setTimeout(r, 400))
    setCombatResult(res); setPhase('result')
  }

  function confirmerAvecSoigner() {
    const res = { ...combatResult }
    // Appliquer toutes les réductions : auto (Armer + bâtiments) + Soigner si activé
    const reductionAuto = (armerActif ? 1 : 0)
      + (res.reductionTourDeGuet || 0)
      + (res.reductionForteresse || 0)
    const reductionSoigner = soignerUsed ? 1 : 0
    res.pertesJoueur = Math.max(0, res.pertesJoueur - reductionAuto - reductionSoigner)
    res.newGame = { ...res.newGame,
      population: { ...res.newGame.population, guerrier: Math.max(0, (game.population?.guerrier||0) - res.pertesJoueur) },
      activeEffects: { ...res.newGame.activeEffects, armerActif: armerActif ? false : res.newGame.activeEffects?.armerActif }
    }
    if (soignerUsed) {
      res.newGame = { ...res.newGame,
        resources: { ...res.newGame.resources, nourriture: Math.max(0,(res.newGame.resources.nourriture||0)-1) }
      }
    }
    onConfirm(res)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:20, width:310, display:'flex', flexDirection:'column', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:cfg.colorLight,border:`2px solid ${cfg.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{cfg.emoji}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:'#dc2626' }}>{cfg.name} attaque !</div>
            <div style={{ fontSize:12, color:'#64748b' }}>Case ({targetCase.col+1},{targetCase.row+1}) · Puissance : {emp.power}</div>
          </div>
        </div>

        {/* PRÉPARATION */}
        {phase === 'prepare' && (
          <>
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#7f1d1d', lineHeight:1.5 }}>
              Défense : 1D6 + guerriers vs 1D6 + {emp.power}. Égalité → vous défendez.
              {armerActif && <><br/><span style={{ color:'#d97706' }}>🗡️ Armer actif : -1 perte automatiquement.</span></>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ flex:1, fontSize:13 }}>⚔️ Guerriers ({maxG} dispo.)</span>
              <button onClick={()=>setGuerriers(g=>Math.max(0,g-1))} disabled={guerriers===0}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers>0?'pointer':'default',opacity:guerriers===0?0.3:1,fontSize:15 }}>−</button>
              <span style={{ width:28, textAlign:'center', fontWeight:600, fontSize:16 }}>{guerriers}</span>
              <button onClick={()=>setGuerriers(g=>Math.min(maxG,g+1))} disabled={guerriers>=maxG}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers<maxG?'pointer':'default',opacity:guerriers>=maxG?0.3:1,fontSize:15 }}>+</button>
            </div>
            <button onClick={lancerCombat}
              style={{ padding:'10px 0',borderRadius:9,border:'none',background:'#dc2626',color:'white',fontSize:14,fontWeight:500,cursor:'pointer' }}>
              ⚔️ Lancer le combat
            </button>
          </>
        )}

        {/* ANIMATION */}
        {phase === 'rolling' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'10px 0' }}>
            <div style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Combat en cours…</div>
            <div style={{ display:'flex', gap:28, alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:11, color:'#64748b' }}>Vous</div>
                <AnimDieCombat finalValue={dieJoueur} rolling={rolling} color="#16a34a" />
              </div>
              <span style={{ fontSize:18, color:'#94a3b8', fontWeight:700 }}>vs</span>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:11, color:'#64748b' }}>{cfg.name}</div>
                <AnimDieCombat finalValue={dieEmpire} rolling={rolling} color="#dc2626" />
              </div>
            </div>
          </div>
        )}

        {/* RÉSULTAT */}
        {phase === 'result' && combatResult && (
          <>
            <div style={{ background:combatResult.empireGagne?'#fef2f2':'#f0fdf4', border:`1px solid ${combatResult.empireGagne?'#fca5a5':'#86efac'}`, borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ textAlign:'center', fontSize:15, fontWeight:500, color:combatResult.empireGagne?'#dc2626':'#166534' }}>
                {combatResult.empireGagne ? '💀 L\'empire prend la case !' : '🛡️ Vous défendez !'}
              </div>
              {/* Dés + totaux */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>Vous</div>
                  <AnimDieCombat finalValue={combatResult.de1} rolling={false} color="#16a34a" />
                  <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                  <div style={{ width:36,height:22,borderRadius:5,background:'#f0fdf4',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#16a34a' }}>+{guerriers}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>guerriers</div>
                  {combatResult.bonusDef > 0 && <>
                    <div style={{ width:36,height:22,borderRadius:5,background:'#fefce8',border:'1px solid #fde68a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#d97706' }}>+{combatResult.bonusDef}</div>
                    <div style={{ fontSize:10, color:'#d97706' }}>défense 🗼</div>
                  </>}
                  <div style={{ width:44,height:34,borderRadius:7,background:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500,color:'white' }}>{combatResult.scoreDef}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
                </div>
                <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500, marginTop:20 }}>vs</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{cfg.emoji} {cfg.name}</div>
                  <AnimDieCombat finalValue={combatResult.de2} rolling={false} color="#dc2626" />
                  <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                  <div style={{ width:36,height:22,borderRadius:5,background:'#fef2f2',border:'1px solid #fca5a5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#dc2626' }}>+{emp.power}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>puissance</div>
                  <div style={{ width:44,height:34,borderRadius:7,background:'#dc2626',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500,color:'white' }}>{combatResult.scoreAtt}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
                </div>
              </div>
              {/* Pertes */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div style={{ background:'rgba(220,38,38,.08)', borderRadius:7, padding:'7px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'#dc2626', marginBottom:3 }}>Vos pertes</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>
                    {combatResult.pertesJoueur>0 ? `-${combatResult.pertesJoueur} guerrier(s)` : 'Aucune'}
                  </div>
                </div>
                <div style={{ background:'rgba(71,85,105,.08)', borderRadius:7, padding:'7px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'#475569', marginBottom:3 }}>Dégâts empire</div>
                  <div style={{ fontSize:13 }}>-{combatResult.pertesEmpire} Puissance</div>
                </div>
              </div>
            </div>

            {/* Armer + Soigner — comme ActionAttaquer */}
            {(armerActif || hasHopital || combatResult.reductionTourDeGuet > 0 || combatResult.reductionForteresse > 0) && combatResult.pertesJoueur > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {armerActif && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    ✓ Armer : -1 perte
                  </div>
                )}
                {combatResult.reductionTourDeGuet > 0 && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    🗼 Tour de guet : -1 perte (victoire)
                  </div>
                )}
                {combatResult.reductionForteresse > 0 && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    🏰 Forteresse : -1 perte (victoire)
                  </div>
                )}
                {hasHopital && hasNourriture && !soignerUsed && (
                  <button onClick={()=>setSoignerUsed(true)}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1px solid #16a34a', background:'#f0fdf4', color:'#166534', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <span>🏥</span> Soigner (1 Nourriture) : -1 perte
                  </button>
                )}
                {soignerUsed && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#f0fdf4', border:'1px solid #86efac', fontSize:11, color:'#16a34a' }}>
                    ✓ Soigner activé : -1 perte
                  </div>
                )}
              </div>
            )}

            <button onClick={confirmerAvecSoigner}
              style={{ padding:'10px 0',borderRadius:9,border:'none',background:'#475569',color:'white',fontSize:14,fontWeight:500,cursor:'pointer' }}>
              Confirmer et continuer →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function EvenementPanel({ evenement, game, onConfirm }) {
  const [choices, setChoices] = useState({})
  const [rep, setRep] = useState(0)
  const { effet } = evenement
  const RES = ['nourriture','bois','argile','fer','or']
  const RES_L = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or' }
  const POP_L = { fermier:'Fermier', ouvrier:'Ouvrier', artisan:'Artisan', guerrier:'Guerrier', pretre:'Prêtre', noble:'Noble' }

  if (effet?.type === 'gainRessources') {
    const total = Object.values(choices).reduce((a,b)=>a+b,0)
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez {effet.nb} ressource{effet.nb>1?'s':''} ({total}/{effet.nb}) :</p>
        {RES.map(r => { const sel=choices[r]||0; return (
          <div key={r} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ flex:1,fontSize:12 }}>{RES_L[r]}</span>
            <button onClick={()=>setChoices({...choices,[r]:Math.max(0,sel-1)})} disabled={sel===0} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:sel>0?'pointer':'default',opacity:sel===0?0.3:1 }}>−</button>
            <span style={{ width:20,textAlign:'center',fontWeight:600 }}>{sel}</span>
            <button onClick={()=>total<effet.nb&&setChoices({...choices,[r]:sel+1})} disabled={total>=effet.nb} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:total<effet.nb?'pointer':'default',opacity:total>=effet.nb?0.3:1 }}>+</button>
          </div>
        )})}
        <button onClick={()=>{ if(total<effet.nb)return; const nr={...game.resources}; for(const[r,q]of Object.entries(choices))nr[r]=(nr[r]||0)+q; onConfirm({...game,resources:nr}) }}
          disabled={total<effet.nb} style={{ padding:'8px 0',borderRadius:8,border:'none',background:total>=effet.nb?'#16a34a':'#e2e8f0',color:'white',fontSize:12,fontWeight:500,cursor:total>=effet.nb?'pointer':'default' }}>
          Confirmer
        </button>
      </div>
    )
  }
  return (
    <button onClick={()=>onConfirm(game)} style={{ padding:'9px 0',borderRadius:8,border:'none',background:'#1e3a5f',color:'white',fontSize:13,fontWeight:500,cursor:'pointer',width:'100%' }}>
      Continuer →
    </button>
  )
}

// ── Composant principal ───────────────────────────────────────
export function TourEmpiresPanel({ onClose, onHighlightCase }) {
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)
  // Lire le game UNE SEULE FOIS au montage via ref — jamais recapturé
  const gameRef = useRef(useGameStore.getState().game)

  const [rolling, setRolling]     = useState(true)
  const [desValues, setDesValues] = useState([null,null,null,null])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [resultats, setResultats] = useState([])
  const resultatsRef = useRef([])
  const [phase, setPhase]         = useState('rolling')
  const [pendingCombat, setPendingCombat] = useState(null)
  const [pendingEvent, setPendingEvent]   = useState(null)
  // gameState courant stocké dans un ref — JAMAIS dans le state React
  const gsRef = useRef(gameRef.current)
  const startedRef = useRef(false)
  const valsRef    = useRef([])

  useEffect(() => {
    if (startedRef.current) return  // Empêche le double déclenchement (React StrictMode)
    startedRef.current = true
    console.log('[EMPIRE] Montage - game.empires:', JSON.stringify(Object.fromEntries(Object.entries(gsRef.current?.empires||{}).map(([k,e])=>[k,e.power]))))
    const vals = lancerDesEmpires(4)
    setTimeout(() => {
      setDesValues(vals)
      setRolling(false)
      // Ordre de tirage : gauche→droite (pas trié par valeur)
      const ordre = vals.map((v,i)=>({v,i}))
      setTimeout(() => runResolution(ordre, 0, vals), 600)
    }, 800)
  }, []) // eslint-disable-line

  // Toute la logique de résolution utilise gsRef.current — jamais de closure React
  async function runResolution(ordre, idx, vals) {
    if (idx >= ordre.length) {
      finalize(vals)
      return
    }
    setPhase('resolving')
    const { v, i } = ordre[idx]
    setActiveIdx(i)
    await pause(400)

    // Résoudre avec l'état courant dans le ref
    const gs = gsRef.current
    // console.log(`[EMPIRE] résolution`, JSON.stringify(Object.fromEntries(Object.entries(gs.empires||{}).map(([k,e])=>[k,e.power]))))
    const res = resoudreDe(v, gs)
    // console.log résultat

    // Mettre à jour le ref immédiatement
    gsRef.current = res.newGame

    // Animation
    if (res.targetCase) {
      onHighlightCase?.(res.targetCase, res.action)
      await pause(1000)
      if (res.action !== 'attaque' || !res.isPlayerCase) onHighlightCase?.(null)
    }

    // Combat joueur — vérifier d'abord le tribut
    if (res.action === 'attaque' && res.isPlayerCase) {
      const tributActifs = gsRef.current.activeEffects?.tributActifs || {}
      if (tributActifs[res.empireId]) {
        // Tribut actif — annuler l'attaque, afficher popup informatif
        const newTribut = { ...tributActifs }
        delete newTribut[res.empireId]
        gsRef.current = { ...gsRef.current, activeEffects: { ...gsRef.current.activeEffects, tributActifs: newTribut } }
        setPendingCombat({ res, ordre, nextIdx: idx+1, tributMode: true })
        setPhase('waitingCombat')
        return
      }
      setPendingCombat({ res, ordre, nextIdx: idx+1 })
      setPhase('waitingCombat')
      return
    }

    // Combat empire vs empire
    if (res.action === 'attaque' && !res.isPlayerCase) {
      const defId = parseInt(res.defenderOwner)
      const tile  = gsRef.current.map[res.targetCase.row]?.[res.targetCase.col]
      const combatRes = resoudreCombatEmpireVsEmpire(res.empireId, defId, tile, gsRef.current)
      gsRef.current = combatRes.newGame
      addLog({ ...res, extraDesc: combatRes.description }, i)
      onHighlightCase?.(null)
      await pause(600)
      await runResolution(ordre, idx+1, vals)
      return
    }

    // Événement interactif
    if (res.type === 'evenement' && res.needsPlayerChoice) {
      addLog(res, i)
      setPendingEvent({ res, ordre, nextIdx: idx+1 })
      setPhase('waitingEvent')
      return
    }

    // Effets immédiats événement
    if (res.type === 'evenement') {
      gsRef.current = applyImmediate(res.evenement, gsRef.current)
    }

    // Mettre à jour la carte immédiatement pour colonisation seulement (pas attaque — owner reste stable)
    if (res.type === 'd40' && res.action === 'colonisation') {
      updateGame(() => ({ ...gsRef.current }))
    }

    // Pour d40, ajouter le d40 dans le log
    const resWithD40 = res.type==='d40' ? { ...res, d40Display: res.d40 } : res
    addLog(resWithD40, i)
    onHighlightCase?.(null)

    if (res.defaite) {
      updateGame(() => gsRef.current)
      setPhase('defaite')
      return
    }

    await pause(500)
    await runResolution(ordre, idx+1, vals)
  }

  function addLog(res, dieOrigIdx = null) {
    const entry = {
      type: res.type,
      action: res.action,
      empireId: res.empireId,
      evenementTitre: res.evenement?.titre,
      extraDesc: res.extraDesc,
      dieOrigIdx,
    }
    resultatsRef.current = [...resultatsRef.current, entry]
    setResultats(resultatsRef.current)
  }

  function applyImmediate(evt, g) {
    const e = evt?.effet
    if (!e) return g
    if (e.type==='expansionImperiale') return appliquerExpansionImperiale(g)
    if (e.type==='gainPop') { const np={...g.population}; for(const[t,n]of Object.entries(e.gains||{}))np[t]=(np[t]||0)+n; return {...g,population:np} }
    if (e.type==='bonus3Des') return {...g,nextTurnEffects:{...(g.nextTurnEffects||{}),bonus3Des:true}}
    if (e.type==='pressionImperiale') return {...g,activeEffects:{...g.activeEffects,pressionImperialeActive:true}}
    if (e.type==='monteeEnPuissance') {
      const d1=Math.floor(Math.random()*4)+1, d2=Math.floor(Math.random()*4)+1
      let ne={...g.empires}
      for(const id of [d1,d2]) { const emp=ne[id]||{power:2,maxPower:8}; ne[id]={...emp,power:Math.min(emp.maxPower,emp.power+2),maxPower:emp.maxPower+2} }
      return {...g,empires:ne}
    }
    return g
  }

  function handleCombatConfirm(combatResult) {
    if (combatResult === null) {
      // Tribut — pas de combat
      updateGame(() => ({ ...gsRef.current }))
      const { ordre, nextIdx } = pendingCombat
      setPendingCombat(null)
      setPhase('resolving')
      runResolution(ordre, nextIdx, valsRef.current)
      return
    }
    gsRef.current = combatResult.newGame
    onHighlightCase?.(null)
    const { ordre, nextIdx } = pendingCombat
    const empId = pendingCombat.res.empireId
    const cfg = EMPIRE_CONFIG[empId]
    const outcome = combatResult.empireGagne ? '✗ Défaite' : '✓ Victoire'
    const tc = pendingCombat.res.targetCase
    addEntry(`⚔️ Défense ${outcome} — ${cfg?.emoji||''} ${cfg?.name} attaque (${tc?.col+1},${tc?.row+1}) | Dés: ${combatResult.de1} vs ${combatResult.de2} | Pertes joueur: ${combatResult.pertesJoueur} guerrier(s) | Pertes empire: -${combatResult.pertesEmpire} Puissance`, gsRef.current.turn)
    setPendingCombat(null)
    setPhase('resolving')
    addLog({ type:'combat', action: combatResult.empireGagne?'attaque':'defense', empireId: empId }, pendingCombat?.res.dieOrigIdx)
    runResolution(ordre, nextIdx, valsRef.current)
  }

  function handleEventConfirm(newGame) {
    gsRef.current = newGame
    const { ordre, nextIdx } = pendingEvent
    setPendingEvent(null)
    setPhase('resolving')
    runResolution(ordre, nextIdx, valsRef.current)
  }

  function finalize(vals=[]) {
    setPhase('done')
    setActiveIdx(-1)
    onHighlightCase?.(null)
    const final = appliquerEffetsNextTurn(gsRef.current)
    updateGame(() => final)
    // Journal détaillé du tour des empires
    const lines = resultatsRef.current.map(r => {
      const cfg = r.empireId ? (EMPIRE_CONFIG[r.empireId] || {}) : {}
      if (r.type === 'puissance') return `${cfg.emoji||''} ${cfg.name||''} : +2 Puissance`
      if (r.type === 'evenement') return `📋 Événement : ${r.evenementTitre || ''}`
      if (r.action === 'colonisation') return `${cfg.emoji||''} ${cfg.name||''} — Colonisation`
      if (r.action === 'attaque' || r.action === 'attaque_gagnee') return `${cfg.emoji||''} ${cfg.name||''} — Attaque${r.extraDesc ? ' → ' + r.extraDesc : ''}`
      if (r.action === 'defense') return `🛡️ Défense réussie`
      if (r.action === 'impossible') return `${cfg.emoji||''} ${cfg.name||''} — Ligne complète`
      return `${cfg.emoji||''} ${cfg.name||''} — D40`
    })
    addEntry(`Tour des empires [${(vals||desValues).filter(Boolean).join(', ')}] : ${lines.join(' | ')}`, gsRef.current.turn)
  }

  const empireColors = {1:'#e1071a',2:'#0891b2',3:'#166534',4:'#ca8a04'}

  return (
    <>
      <div style={{ background:'white', padding:'10px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12,fontWeight:500,color:'#1e293b' }}>
            {phase==='rolling'?'🎲 Tour des empires — lancer…'
             :phase==='done'?'✓ Tour des empires terminé'
             :phase==='defaite'?'💀 Défaite !'
             :phase==='waitingCombat'?'⚔️ Vous êtes attaqué !'
             :phase==='waitingEvent'?'📋 Événement'
             :'⚙️ Résolution…'}
          </span>
          {phase==='done' && (
            <button onClick={onClose} style={{ padding:'5px 14px',borderRadius:7,border:'none',background:'#1e3a5f',color:'white',fontSize:11,fontWeight:500,cursor:'pointer' }}>
              Mon tour →
            </button>
          )}
        </div>

        {/* Dés */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {desValues.map((v,i) => (
            <div key={i} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
              <EmpireDie value={v} rolling={rolling} active={activeIdx===i} />
              {v&&!rolling&&(
                <div style={{ fontSize:9,color:v<=4?empireColors[v]:v===5?'#7c3aed':'#dc2626',textAlign:'center',maxWidth:50,lineHeight:1.2 }}>
                  {v<=4?EMPIRE_CONFIG[v]?.name:v===5?'Événement':'D40 !'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Résultats — reconstruits depuis données brutes, jamais depuis closures */}
        {resultats.length > 0 && (
          <div style={{ display:'flex',flexDirection:'column',gap:4,maxHeight:130,overflowY:'auto' }}>
            {resultats.map((r,idx) => {
              let desc, bg='#f8fafc', color='#475569', border='#e2e8f0'
              if (r.type==='puissance') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} : +2 Puissance`
                bg='#f0f4ff'; color='#3730a3'; border='#c7d2fe'
              } else if (r.type==='evenement') {
                desc = `📋 Événement : ${r.evenementTitre || ''}`
                bg='#fffbeb'; color='#92400e'; border='#fcd34d'
              } else if (r.action==='colonisation') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Colonisation`
                bg='#f0fdf4'; color='#166534'; border='#86efac'
              } else if (r.action==='attaque'||r.action==='attaque_gagnee') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Attaque${r.extraDesc?' → '+r.extraDesc:''}`
                bg='#fef2f2'; color='#dc2626'; border='#fca5a5'
              } else if (r.action==='defense') {
                desc = `🛡️ Vous avez défendu`
                bg='#f0fdf4'; color='#166534'; border='#86efac'
              } else if (r.action==='impossible') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Ligne/colonne déjà entièrement contrôlée`
                bg='#f8fafc'; color='#94a3b8'; border='#e2e8f0'
              } else if (r.action==='pasAttaque') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Puissance 0, attaque annulée`
                bg='#f8fafc'; color='#94a3b8'; border='#e2e8f0'
              } else if (r.type==='d40') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — D40 lancé`
                bg='#f8fafc'; color='#64748b'; border='#e2e8f0'
              } else {
                desc = r.extraDesc || `Dé résolu`
              }
              return (
                <div key={idx} style={{ fontSize:11,padding:'4px 8px',borderRadius:6,background:bg,color,border:`0.5px solid ${border}` }}>
                  {desc}
                </div>
              )
            })}
          </div>
        )}

        {/* Événement interactif */}
        {phase==='waitingEvent' && pendingEvent && (
          <div style={{ background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:9,padding:12 }}>
            <div style={{ fontSize:13,fontWeight:500,color:'#92400e',marginBottom:6 }}>
              {pendingEvent.res.evenement.icone} {pendingEvent.res.evenement.titre}
            </div>
            <p style={{ fontSize:12,color:'#475569',margin:'0 0 8px',lineHeight:1.5 }}>{pendingEvent.res.evenement.texte}</p>
            <EvenementPanel evenement={pendingEvent.res.evenement} game={gsRef.current} onConfirm={handleEventConfirm} />
          </div>
        )}
      </div>

      {/* Combat popup */}
      {phase==='waitingCombat' && pendingCombat && (
        <CombatPopup
          empireId={pendingCombat.res.empireId}
          targetCase={pendingCombat.res.targetCase}
          tributMode={pendingCombat.tributMode || false}
          game={gsRef.current}
          onConfirm={handleCombatConfirm}
        />
      )}
    </>
  )
}

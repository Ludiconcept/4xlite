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

function CombatPopup({ empireId, targetCase, game, onConfirm }) {
  const [guerriers, setGuerriers] = useState(0)
  const [combatResult, setCombatResult] = useState(null)
  const cfg = EMPIRE_CONFIG[empireId]
  const emp = game.empires?.[empireId] || { power:2, maxPower:8 }
  const maxG = game.population?.guerrier || 0
  const tile = game.map[targetCase.row]?.[targetCase.col]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:20, width:320, display:'flex', flexDirection:'column', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.25)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:cfg.colorLight, border:`2px solid ${cfg.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{cfg.emoji}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:'#dc2626' }}>{cfg.name} attaque !</div>
            <div style={{ fontSize:12, color:'#64748b' }}>Case ({targetCase.col+1},{targetCase.row+1}) · Puissance : {emp.power}</div>
          </div>
        </div>
        {!combatResult ? (
          <>
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#7f1d1d', lineHeight:1.5 }}>
              Défense : 1D6 + guerriers vs 1D6 + {emp.power}. Égalité → vous défendez.
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ flex:1, fontSize:13 }}>⚔️ Guerriers ({maxG} dispo.)</span>
              <button onClick={()=>setGuerriers(g=>Math.max(0,g-1))} disabled={guerriers===0}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers>0?'pointer':'default',opacity:guerriers===0?0.3:1,fontSize:15 }}>−</button>
              <span style={{ width:28,textAlign:'center',fontWeight:600,fontSize:16 }}>{guerriers}</span>
              <button onClick={()=>setGuerriers(g=>Math.min(maxG,g+1))} disabled={guerriers>=maxG}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers<maxG?'pointer':'default',opacity:guerriers>=maxG?0.3:1,fontSize:15 }}>+</button>
            </div>
            <button onClick={()=>setCombatResult(resoudreCombatEmpireVsJoueur(empireId, tile, game, guerriers))}
              style={{ padding:'10px 0',borderRadius:9,border:'none',background:'#dc2626',color:'white',fontSize:14,fontWeight:500,cursor:'pointer' }}>
              ⚔️ Lancer le combat
            </button>
          </>
        ) : (
          <>
            <div style={{ background:combatResult.empireGagne?'#fef2f2':'#f0fdf4', border:`1px solid ${combatResult.empireGagne?'#fca5a5':'#86efac'}`, borderRadius:9, padding:12 }}>
              <div style={{ fontWeight:600, fontSize:14, color:combatResult.empireGagne?'#dc2626':'#166534', textAlign:'center', marginBottom:10 }}>
                {combatResult.empireGagne ? '💀 L\'empire prend la case !' : '🛡️ Vous défendez !'}
              </div>
              <div style={{ display:'flex', gap:16, justifyContent:'center', marginBottom:10 }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:24,fontWeight:700,color:'#dc2626' }}>{combatResult.de2}</div>
                  <div style={{ fontSize:11,color:'#64748b' }}>Dé empire +{emp.power} = {combatResult.scoreAtt}</div>
                </div>
                <div style={{ alignSelf:'center',fontSize:18,color:'#94a3b8',fontWeight:700 }}>vs</div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:24,fontWeight:700,color:'#16a34a' }}>{combatResult.de1}</div>
                  <div style={{ fontSize:11,color:'#64748b' }}>Votre dé +{guerriers} = {combatResult.scoreDef}</div>
                </div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12 }}>
                <div style={{ background:'rgba(220,38,38,.08)',borderRadius:7,padding:'6px 8px' }}>
                  <div style={{ color:'#dc2626',fontWeight:500 }}>Vos pertes</div>
                  <div>{combatResult.pertesJoueur>0?`-${combatResult.pertesJoueur} guerrier(s)`:'Aucune'}</div>
                </div>
                <div style={{ background:'rgba(71,85,105,.08)',borderRadius:7,padding:'6px 8px' }}>
                  <div style={{ color:'#475569',fontWeight:500 }}>Dégâts empire</div>
                  <div>-{combatResult.pertesEmpire} Puissance</div>
                </div>
              </div>
            </div>
            <button onClick={()=>onConfirm(combatResult)}
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
  const [phase, setPhase]         = useState('rolling')
  const [pendingCombat, setPendingCombat] = useState(null)
  const [pendingEvent, setPendingEvent]   = useState(null)
  // gameState courant stocké dans un ref — JAMAIS dans le state React
  const gsRef = useRef(gameRef.current)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return  // Empêche le double déclenchement (React StrictMode)
    startedRef.current = true
    console.log('[EMPIRE] Montage - game.empires:', JSON.stringify(Object.fromEntries(Object.entries(gsRef.current?.empires||{}).map(([k,e])=>[k,e.power]))))
    const vals = lancerDesEmpires(4)
    setTimeout(() => {
      setDesValues(vals)
      setRolling(false)
      const ordre = vals.map((v,i)=>({v,i})).sort((a,b)=>a.v-b.v)
      setTimeout(() => runResolution(ordre, 0), 600)
    }, 800)
  }, []) // eslint-disable-line

  // Toute la logique de résolution utilise gsRef.current — jamais de closure React
  async function runResolution(ordre, idx) {
    if (idx >= ordre.length) {
      finalize()
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

    // Combat joueur
    if (res.action === 'attaque' && res.isPlayerCase) {
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
      await runResolution(ordre, idx+1)
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

    addLog(res, i)
    onHighlightCase?.(null)

    if (res.defaite) {
      updateGame(() => gsRef.current)
      setPhase('defaite')
      return
    }

    await pause(500)
    await runResolution(ordre, idx+1)
  }

  function addLog(res, dieOrigIdx = null) {
    setResultats(prev => [...prev, {
      type: res.type,
      action: res.action,
      empireId: res.empireId,
      evenementTitre: res.evenement?.titre,
      extraDesc: res.extraDesc,
      dieOrigIdx,  // index original du dé (0-3) pour tri
    }])
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
    gsRef.current = combatResult.newGame
    onHighlightCase?.(null)
    const { ordre, nextIdx } = pendingCombat
    setPendingCombat(null)
    setPhase('resolving')
    addLog({ type:'combat', action: combatResult.empireGagne?'attaque':'defense', empireId: pendingCombat.res.empireId }, pendingCombat.res.dieOrigIdx)
    runResolution(ordre, nextIdx)
  }

  function handleEventConfirm(newGame) {
    gsRef.current = newGame
    const { ordre, nextIdx } = pendingEvent
    setPendingEvent(null)
    setPhase('resolving')
    runResolution(ordre, nextIdx)
  }

  function finalize() {
    setPhase('done')
    setActiveIdx(-1)
    onHighlightCase?.(null)
    const final = appliquerEffetsNextTurn(gsRef.current)
    updateGame(() => final)
    addEntry(`Tour des empires — ${desValues.join(', ')}`, gsRef.current.turn)
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
            {[...resultats].sort((a,b) => (a.dieOrigIdx??99) - (b.dieOrigIdx??99)).map((r,idx) => {
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
              } else {
                desc = r.extraDesc || '—'
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
          game={gsRef.current}
          onConfirm={handleCombatConfirm}
        />
      )}
    </>
  )
}

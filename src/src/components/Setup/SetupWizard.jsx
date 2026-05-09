import React, { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { GameMap } from '../Map/GameMap.jsx'

function rollDie() { return Math.floor(Math.random() * 6) + 1 }
function rollDice(n) { return Array.from({ length: n }, rollDie) }

// Bouton de lancer avec animation numérotée
function RollButton({ onRoll, label = 'Lancer les dés', disabled = false }) {
  const [anim, setAnim] = React.useState(false)
  const [vals, setVals] = React.useState([])
  const n = 4

  async function handleClick() {
    if (anim || disabled) return
    setAnim(true)
    const final = Array.from({ length: n }, rollDie)
    setVals(Array.from({ length: n }, rollDie))
    const interval = setInterval(() => setVals(Array.from({ length: n }, rollDie)), 80)
    await new Promise(r => setTimeout(r, 650))
    clearInterval(interval)
    setVals(final)
    setAnim(false)
    onRoll(final)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {vals.length > 0 && (
        <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
          {vals.map((v, i) => (
            <div key={i} style={{
              width:40, height:40, borderRadius:9,
              border: anim ? '1.5px solid #fcd34d' : '1.5px solid #f59e0b',
              background: anim ? '#fffbeb' : 'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:18, fontWeight:700, color: anim ? '#92400e' : '#1e293b',
              transition:'transform .1s',
              transform: anim ? 'rotate(' + (Math.random()>0.5?5:-5) + 'deg)' : 'scale(1)',
            }}>{v}</div>
          ))}
        </div>
      )}
      <button onClick={handleClick} disabled={anim || disabled} style={{
        padding:'9px 0', background: anim ? '#e2e8f0' : '#f59e0b',
        color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:13,
        cursor: anim || disabled ? 'default' : 'pointer',
        display:'flex', alignItems:'center', justifyContent:'center', gap:6,
      }}>
        <span>{anim ? '🎲 En cours…' : '🎲 ' + label}</span>
      </button>
    </div>
  )
}


// ── Tables ────────────────────────────────────────────────────
const TERRAIN_FROM_DIE = { 1:'marais', 2:'plaine', 3:'desert', 4:'colline', 5:'montagne' }
const TERRAIN_NAMES    = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne' }
const TERRAIN_ICONS    = { marais:'🌿', plaine:'🌾', desert:'🏜️', colline:'⛰️', montagne:'🏔️' }
const ALL_TERRAINS     = ['marais','plaine','desert','colline','montagne']

const CURIOSITY_FROM_DIE = { 1:'fleuve', 2:'fleuve', 3:'volcan', 4:'lac', 5:'lac', 6:'none' }
const CURIOSITY_INFO = {
  fleuve: { name:'Fleuve', icon:'🌊', desc:'Part d\'un bord, traverse toute la carte. Les Marins ×2 sur les cases avec fleuve.' },
  volcan: { name:'Volcan', icon:'🌋', desc:'À placer n\'importe où. Ferme dessus = 3 Nourriture. Risque d\'éruption.' },
  lac:    { name:'Lac', icon:'🏞️', desc:'À placer n\'importe où. Contient 1 Gibier. Colonisable, pas de construction.' },
  none:   { name:'Aucune curiosité', icon:'—', desc:'Pas de curiosité pour ce résultat.' },
}

// Ressources setup : dé 1-6 → ressource + terrains autorisés
const RESOURCE_FROM_DIE = {
  1: { key:'foret_gibier', name:'Forêt + Gibier', icon:'🌲🦌', terrains:['plaine','colline','montagne'] },
  2: { key:'foret',        name:'Forêt (Bois)',   icon:'🌲',    terrains:['plaine','colline','montagne'] },
  3: { key:'argile',       name:'Argile',          icon:'🏺',    terrains:['marais','plaine','desert'] },
  4: { key:'gibier',       name:'Gibier',           icon:'🦌',    terrains:['marais','fleuve','lac'] },
  5: { key:'fer',          name:'Fer',              icon:'⚙️',    terrains:['colline','montagne','desert'] },
  6: { key:'or',           name:'Or',               icon:'💰',    terrains:['colline','montagne','desert'] },
}

function isCompatible(resKey, terrain, hasFleuve, isLac) {
  const res = Object.values(RESOURCE_FROM_DIE).find(r => r.key === resKey)
  if (!res) return false
  // Lac : seul le gibier est autorisé
  if (isLac) return res.terrains.includes('lac')
  if (hasFleuve && res.terrains.includes('fleuve')) return true
  return res.terrains.includes(terrain)
}

// ── Barre de progression ──────────────────────────────────────
function StepBar({ step }) {
  const labels = ['Territoire','Terrains','Curiosités','Placement','Ressources','Population','Départ']
  return (
    <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
      {labels.map((l,i) => (
        <div key={i} style={{
          padding:'2px 7px', borderRadius:10, fontSize:10, fontWeight:500,
          background: i<step-1?'#16a34a':i===step-1?'#f59e0b':'rgba(255,255,255,.15)',
          color:'white',
        }}>{i+1}. {l}</div>
      ))}
    </div>
  )
}

// ── Wizard ────────────────────────────────────────────────────
export function SetupWizard() {
  const { game, updateGame } = useGameStore()
  const addEntry = useLogStore(s => s.addEntry)

  const [step, setStep] = useState(1)
  const [startTiles, setStartTiles] = useState([])
  const [curiosities, setCuriosities] = useState([])
  const [pendingCur, setPendingCur] = useState([])
  const [curIdx, setCurIdx] = useState(0)

  // Étape 1
  const [hovered, setHovered]   = useState(null)
  const [locked, setLocked]     = useState(null)

  // Étape 2 — terrains
  const [t2Dice, setT2Dice]     = useState([])
  const [t2Rolled, setT2Rolled] = useState(false)
  const [t2SelDie, setT2SelDie] = useState(null)  // index du dé sélectionné
  const [t2Assign, setT2Assign] = useState({})    // { 'r-c': dieIndex }
  const [t2Choice, setT2Choice] = useState({})    // terrains libres (résultat 6)

  // Étape 3 — curiosités
  const [t3Dice, setT3Dice]     = useState([])
  const [t3Rolled, setT3Rolled] = useState(false)
  const [t3Sel, setT3Sel]       = useState([])

  // Étape 5 — ressources
  const [t5Dice, setT5Dice]     = useState([])
  const [t5Rolled, setT5Rolled] = useState(false)
  const [t5Sel, setT5Sel]       = useState([])    // 2 indices sélectionnés
  const [t5Place, setT5Place]   = useState({})    // { dieIndex: 'r-c' }
  const [t5Active, setT5Active] = useState(null)  // dieIndex en attente de placement

  // ── Réinitialisation carte si reprise ─────────────────────
  useEffect(() => {
    if (game?.phase === 'setup') {
      const hasPlayer = game.map?.flat().some(t => t.owner === 'player')
      if (hasPlayer) {
        updateGame(g => ({
          ...g,
          map: g.map.map(r => r.map(t => ({
            row:t.row, col:t.col,
            explored:false, owner:null, terrain:null,
            resource1:null, resource2:null, buildings:[],
            hasFleuve:false, fleuveVertical:false, hasFleuve2:false, fleuve2Vertical:false,
            isLac:false, hasVolcan:false, playerBuildingsPreserved:[],
          })))
        }))
      }
    }
  }, []) // eslint-disable-line

  // ── Interactions carte ────────────────────────────────────
  function handleTileHover(tile) {
    if (step === 1) {
      const { row, col } = tile
      if (row<=3 && col<=3) setHovered({ row, col })
      else setHovered(null)
    }
  }

  function handleTileClick(tile) {
    const { row, col } = tile

    // Étape 1 — sélection territoire
    if (step === 1) {
      if (row<=3 && col<=3) setLocked({ row, col })
      return
    }

    // Étape 2 — assignation terrain directement sur la carte
    if (step === 2 && t2SelDie !== null) {
      const key = `${row}-${col}`
      const isStartTile = startTiles.some(([sr,sc]) => sr===row && sc===col)
      if (!isStartTile) return
      const cleaned = Object.fromEntries(Object.entries(t2Assign).filter(([,v])=>v!==t2SelDie))
      setT2Assign({ ...cleaned, [key]: t2SelDie })
      setT2SelDie(null)
      return
    }

    // Étape 4 — placement curiosité
    if (step === 4) {
      const cur = pendingCur[curIdx]
      if (!cur) return
      if (cur.type === 'fleuve') {
        const isBorder = row===0||row===4||col===0||col===4
        if (!isBorder) return
        const fleuveVertical = (row===0||row===4)
        updateGame(g => ({
          ...g,
          map: g.map.map(r => r.map(t => {
            const onPath = fleuveVertical ? t.col===col : t.row===row
            if (!onPath) return t
            // Si la case a déjà un fleuve d'orientation différente = croisement
            if (t.hasFleuve && t.fleuveVertical !== fleuveVertical) {
              return { ...t, hasFleuve2:true, fleuve2Vertical:fleuveVertical }
            }
            return { ...t, hasFleuve:true, fleuveVertical }
          }))
        }))
      } else if (cur.type === 'volcan') {
        const targetTile = game?.map?.[row]?.[col]
        if (targetTile?.isLac || targetTile?.hasVolcan) return
        updateGame(g => ({
          ...g,
          map: g.map.map(r => r.map(t =>
            t.row===row&&t.col===col ? { ...t, hasVolcan:true } : t
          ))
        }))
      } else if (cur.type === 'lac') {
        // Ne pas placer sur une case qui a déjà une curiosité
        const targetTile = game?.map?.[row]?.[col]
        if (targetTile?.isLac || targetTile?.hasVolcan) return
        updateGame(g => ({
          ...g,
          map: g.map.map(r => r.map(t =>
            t.row===row&&t.col===col
              ? { ...t, isLac:true, terrain:'lac', explored:true, resource1:{ type:'gibier', quantity:1 } }
              : t
          ))
        }))
      }
      advanceCuriosity()
      return
    }

    // Étape 5 — placement ressource directement sur la carte
    if (step === 5 && t5Active !== null) {
      const key = `${row}-${col}`
      const isStartTile = startTiles.some(([sr,sc]) => sr===row && sc===col)
      if (!isStartTile) return
      const tile2 = game?.map?.[row]?.[col]
      if (!tile2) return
      const resKey = RESOURCE_FROM_DIE[t5Dice[t5Active]]?.key
      if (!isCompatible(resKey, tile2.terrain, tile2.hasFleuve, tile2.isLac)) return
      const alreadyUsed = Object.entries(t5Place).some(([k,v])=>v===key&&Number(k)!==t5Active)
      if (alreadyUsed) return
      const p = Object.fromEntries(Object.entries(t5Place).filter(([,v])=>v!==key))
      p[t5Active] = key
      setT5Place(p)
      setT5Active(null)
    }
  }

  function advanceCuriosity() {
    const next = curIdx + 1
    if (next >= pendingCur.length) setStep(5)
    else setCurIdx(next)
  }

  // ── Highlights et clickables ──────────────────────────────
  const step1Highlight = (() => {
    if (step !== 1) return []
    const sq = locked || hovered
    if (!sq) return []
    const { row:r, col:c } = sq
    return [[r,c],[r,c+1],[r+1,c],[r+1,c+1]].map(([row,col])=>({ row, col }))
  })()

  // Étape 2 : cases du territoire mises en surbrillance quand un dé est sélectionné
  const step2Highlight = (() => {
    if (step !== 2 || t2SelDie === null) return []
    return startTiles
      .filter(([r,c]) => !Object.keys(t2Assign).includes(`${r}-${c}`))
      .map(([row,col]) => ({ row, col }))
  })()

  // Étape 4 : cases cliquables selon le type de curiosité
  const step4Clickable = (() => {
    if (step !== 4) return []
    const cur = pendingCur[curIdx]
    if (!cur) return []
    if (cur.type === 'fleuve') {
      const borders = []
      for (let i=0; i<5; i++) {
        borders.push({row:0,col:i},{row:4,col:i},{row:i,col:0},{row:i,col:4})
      }
      return borders
    }
    const all = []
    for (let r=0; r<5; r++) for (let c=0; c<5; c++) all.push({row:r,col:c})
    return all
  })()

  // Étape 5 : cases compatibles avec la ressource active
  const step5Highlight = (() => {
    if (step !== 5 || t5Active === null) return []
    const resKey = RESOURCE_FROM_DIE[t5Dice[t5Active]]?.key
    if (!resKey) return []
    return startTiles
      .filter(([r,c]) => {
        const tile = game?.map?.[r]?.[c]
        if (!tile) return false
        const alreadyUsed = Object.entries(t5Place).some(([k,v])=>v===`${r}-${c}`&&Number(k)!==t5Active)
        return !alreadyUsed && isCompatible(resKey, tile.terrain, tile.hasFleuve)
      })
      .map(([row,col]) => ({ row, col }))
  })()

  // ── Confirmations étapes ──────────────────────────────────
  function confirmStep1() {
    if (!locked) return
    const tiles = [[locked.row,locked.col],[locked.row,locked.col+1],[locked.row+1,locked.col],[locked.row+1,locked.col+1]]
    setStartTiles(tiles)
    updateGame(g => ({
      ...g,
      map: g.map.map(r => r.map(t => {
        const isStart = tiles.some(([sr,sc])=>sr===t.row&&sc===t.col)
        return isStart ? { ...t, explored:true, owner:'player' } : t
      }))
    }))
    setLocked(null); setHovered(null); setStep(2)
  }

  function confirmStep2() {
    const result = {}
    for (const [k,di] of Object.entries(t2Assign)) {
      result[k] = t2Dice[di]===6 ? (t2Choice[k]||'plaine') : TERRAIN_FROM_DIE[t2Dice[di]]
    }
    updateGame(g => ({
      ...g,
      map: g.map.map(r => r.map(t => {
        const key=`${t.row}-${t.col}`
        return result[key] ? { ...t, terrain:result[key] } : t
      }))
    }))
    setStep(3)
  }

  function confirmStep3() {
    if (t3Sel.length<2) return
    const chosen = t3Sel.map(i=>({ type:CURIOSITY_FROM_DIE[t3Dice[i]], die:t3Dice[i] }))
    setCuriosities(chosen)
    const toPlace = chosen.filter(c=>c.type!=='none')
    if (toPlace.length===0) { setStep(5); return }
    setPendingCur(toPlace); setCurIdx(0); setStep(4)
  }

  function confirmStep5() {
    if (!t5AllPlaced) return
    const placements = t5Sel.map(i=>({ key:RESOURCE_FROM_DIE[t5Dice[i]]?.key, tile:t5Place[i] }))
    updateGame(g => ({
      ...g,
      map: g.map.map(r => r.map(t => {
        const key=`${t.row}-${t.col}`
        const p=placements.find(x=>x.tile===key)
        if (!p) return t
        if (p.key==='foret_gibier') return { ...t, resource1:{type:'foret',quantity:1}, resource2:{type:'gibier',quantity:1} }
        if (!t.resource1) return { ...t, resource1:{type:p.key,quantity:1} }
        return { ...t, resource2:{type:p.key,quantity:1} }
      }))
    }))
    setStep(6)
  }

  function confirmStep6() {
    updateGame(g => ({ ...g, population:{fermier:1,ouvrier:1,artisan:0,guerrier:1,pretre:0,noble:0} }))
    setStep(7)
  }

  function startGame() {
    updateGame(g => ({ ...g, phase:'playing', turn:1 }))
    addEntry('La partie commence !', 0)
  }

  // ── Dérivés ───────────────────────────────────────────────
  const t2AllAssigned = startTiles.length>0 && Object.keys(t2Assign).length===startTiles.length
  const t2NeedsChoice = Object.entries(t2Assign).some(([k,di])=>t2Dice[di]===6&&!t2Choice[k])
  const t5AllPlaced   = t5Sel.length===2 && Object.keys(t5Place).length===2
  const currentCur    = step===4 ? pendingCur[curIdx] : null

  // Vérifier si une ressource peut être placée (en excluant les cases déjà prises)
  function canPlaceResource(dieIdx) {
    const resKey = RESOURCE_FROM_DIE[t5Dice[dieIdx]]?.key
    if (!resKey) return false
    const takenKeys = Object.entries(t5Place)
      .filter(([k]) => Number(k) !== dieIdx)
      .map(([,v]) => v)
    return startTiles.some(([r,c]) => {
      const key = String(r) + '-' + String(c)
      if (takenKeys.includes(key)) return false
      const tile = game?.map?.[r]?.[c]
      return tile && isCompatible(resKey, tile.terrain, tile.hasFleuve, tile.isLac)
    })
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#f8f7f2' }}>
      <div style={{ background:'#334155', color:'white', padding:'7px 14px', display:'flex', alignItems:'center', gap:12, flexShrink:0, flexWrap:'wrap' }}>
        <span style={{ fontWeight:500, fontSize:14, whiteSpace:'nowrap' }}>4X Lite — Préparation</span>
        <StepBar step={step} />
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
        {/* ── Panneau gauche ── */}
        <div style={{ width:280, background:'white', borderRight:'0.5px solid #e2e8f0', padding:16, overflowY:'auto', flexShrink:0, display:'flex', flexDirection:'column', gap:12 }}>

          {/* ÉTAPE 1 */}
          {step===1 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Choisissez votre territoire</h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Survolez la carte — la zone 2×2 se met en surbrillance. Cliquez pour verrouiller.</p>
            {locked
              ? <div style={{ background:'#eff6ff', border:'1px solid #3b82f6', borderRadius:8, padding:10, fontSize:13, color:'#1e40af', fontWeight:500 }}>✓ Sélectionné : case ({locked.row+1},{locked.col+1})</div>
              : <div style={{ background:'#fef9c3', border:'1px solid #f59e0b', borderRadius:8, padding:10, fontSize:13, color:'#92400e' }}>Survolez puis cliquez →</div>
            }
            <div style={{ display:'flex', gap:8 }}>
              {locked && <button onClick={()=>setLocked(null)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#64748b', fontSize:13, cursor:'pointer' }}>Annuler</button>}
              <button onClick={confirmStep1} disabled={!locked} style={{ flex:2, padding:'9px 0', borderRadius:8, border:'none', background:locked?'#f59e0b':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:locked?'pointer':'default' }}>Confirmer →</button>
            </div>
          </>}

          {/* ÉTAPE 2 */}
          {step===2 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Terrains de départ</h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Lancez les dés. Sélectionnez un dé puis <strong>cliquez directement sur la case</strong> sur la carte.</p>
            {!t2Rolled
              ? <RollButton label="Lancer les 4 dés" onRoll={(vals) => { setT2Dice(vals); setT2Rolled(true) }} />
              : <>
                  <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em' }}>
                    {t2SelDie!==null ? `✦ Dé ${t2Dice[t2SelDie]} sélectionné — cliquez une case sur la carte` : 'Cliquez un dé pour le sélectionner'}
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {t2Dice.map((val,i) => {
                      const terrain = val===6?null:TERRAIN_FROM_DIE[val]
                      const isAssigned = Object.values(t2Assign).includes(i)
                      const assignedTo = Object.entries(t2Assign).find(([,v])=>v===i)?.[0]
                      return (
                        <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                          <button onClick={()=>!isAssigned&&setT2SelDie(t2SelDie===i?null:i)} style={{
                            width:52, padding:'8px 0', borderRadius:10, fontWeight:700, fontSize:20,
                            border:t2SelDie===i?'2px solid #f59e0b':'1.5px solid #cbd5e1',
                            background:t2SelDie===i?'#fff7ed':isAssigned?'#f0fdf4':'white',
                            color:t2SelDie===i?'#e07b1a':isAssigned?'#166534':'#1e293b',
                            cursor:isAssigned?'default':'pointer',
                          }}>{val}</button>
                          <span style={{ fontSize:10, color:'#64748b' }}>{val===6?'Au choix':TERRAIN_NAMES[terrain]}</span>
                          {isAssigned && (
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                              <span style={{ fontSize:10, color:'#16a34a' }}>✓ Case {assignedTo?.split('-').map(n=>parseInt(n)+1).join(',')}</span>
                              {/* Sélecteur terrain libre pour le 6 */}
                              {val===6 && (
                                <select onChange={e=>setT2Choice({...t2Choice,[assignedTo]:e.target.value})} value={t2Choice[assignedTo]||''} style={{ fontSize:10, border:'1px solid #86efac', borderRadius:4, padding:'1px 3px' }}>
                                  <option value="">Terrain...</option>
                                  {ALL_TERRAINS.map(t=><option key={t} value={t}>{TERRAIN_ICONS[t]} {TERRAIN_NAMES[t]}</option>)}
                                </select>
                              )}
                              <button onClick={()=>{const a={...t2Assign};delete a[assignedTo];setT2Assign(a)}} style={{ fontSize:9, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>retirer</button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <button onClick={confirmStep2} disabled={!t2AllAssigned||t2NeedsChoice} style={{ padding:'9px 0', background:t2AllAssigned&&!t2NeedsChoice?'#f59e0b':'#e2e8f0', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:t2AllAssigned&&!t2NeedsChoice?'pointer':'default' }}>
                    {!t2AllAssigned?`Assignez ${startTiles.length-Object.keys(t2Assign).length} case(s)`:t2NeedsChoice?'Choisissez les terrains libres':'Confirmer →'}
                  </button>
                </>
            }
          </>}

          {/* ÉTAPE 3 */}
          {step===3 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Curiosités géographiques</h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Lancez les dés et choisissez 2 curiosités.</p>
            {!t3Rolled
              ? <RollButton label="Lancer les 4 dés" onRoll={(vals) => { setT3Dice(vals); setT3Rolled(true); setT3Sel([]) }} />
              : <>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {t3Dice.map((val,i) => {
                      const info=CURIOSITY_INFO[CURIOSITY_FROM_DIE[val]]
                      const isSel=t3Sel.includes(i), isDimmed=!isSel&&t3Sel.length>=2
                      return (
                        <button key={i} onClick={()=>{if(t3Sel.includes(i))setT3Sel(t3Sel.filter(x=>x!==i));else if(t3Sel.length<2)setT3Sel([...t3Sel,i])}} style={{
                          padding:10, borderRadius:10, border:isSel?'2px solid #f59e0b':'1.5px solid #e2e8f0',
                          background:isSel?'#fff7ed':'white', cursor:isDimmed?'default':'pointer',
                          opacity:isDimmed?0.3:1, textAlign:'left',
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ fontSize:22, fontWeight:700, color:isSel?'#e07b1a':'#1e293b' }}>{val}</span>
                            <span style={{ fontSize:18 }}>{info.icon}</span>
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:isSel?'#c2410c':'#374151', marginBottom:3 }}>{info.name}</div>
                          <div style={{ fontSize:11, color:'#6b7280', lineHeight:1.4 }}>{info.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={confirmStep3} disabled={t3Sel.length<2} style={{ padding:'9px 0', background:t3Sel.length>=2?'#f59e0b':'#e2e8f0', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:t3Sel.length>=2?'pointer':'default' }}>
                    Confirmer ({t3Sel.length}/2) →
                  </button>
                </>
            }
          </>}

          {/* ÉTAPE 4 — Placement curiosité */}
          {step===4 && currentCur && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>
              {CURIOSITY_INFO[currentCur.type].icon} Placer : {CURIOSITY_INFO[currentCur.type].name}
              {pendingCur.length>1&&<span style={{ fontSize:12, color:'#94a3b8', fontWeight:400 }}> ({curIdx+1}/{pendingCur.length})</span>}
            </h2>
            <div style={{ background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8, padding:10, fontSize:12, color:'#1e40af', lineHeight:1.7 }}>
              {currentCur.type==='fleuve'&&<><div>Cliquez sur une case du <strong>bord</strong> de la carte.</div><div>• Bord haut/bas → fleuve vertical ↕</div><div>• Bord gauche/droit → fleuve horizontal ↔</div></>}
              {currentCur.type==='volcan'&&<div>Cliquez sur <strong>n'importe quelle case</strong> de la carte.</div>}
              {currentCur.type==='lac'&&<div>Cliquez sur <strong>n'importe quelle case</strong> de la carte.</div>}
            </div>
            <button onClick={advanceCuriosity} style={{ fontSize:12, color:'#94a3b8', background:'none', border:'none', textDecoration:'underline', cursor:'pointer', textAlign:'left' }}>Passer (ne pas placer)</button>
          </>}

          {/* ÉTAPE 5 — Ressources */}
          {step===5 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Ressources initiales</h2>
            <p style={{ fontSize:13, color:'#475569', lineHeight:1.6 }}>Lancez les dés, choisissez 2 ressources puis <strong>cliquez directement sur une case</strong> compatible sur la carte.</p>
            {!t5Rolled
              ? <RollButton label="Lancer les 4 dés" onRoll={(vals) => { setT5Dice(vals); setT5Rolled(true); setT5Sel([]); setT5Place({}) }} />
              : <>
                  {/* Phase 1 : choisir 2 dés */}
                  {t5Sel.length<2 && <>
                    <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em' }}>Choisissez 2 ressources ({t5Sel.length}/2)</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {t5Dice.map((val,i) => {
                        const res=RESOURCE_FROM_DIE[val]
                        const isSel=t5Sel.includes(i), isDimmed=!isSel&&t5Sel.length>=2
                        const canPlace=canPlaceResource(i)
                        return (
                          <div key={i} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                            <button
                              disabled={!canPlace}
                              onClick={()=>{
                                if (!canPlace) return
                                if(t5Sel.includes(i)){setT5Sel(t5Sel.filter(x=>x!==i));const p={...t5Place};delete p[i];setT5Place(p)}
                                else if(t5Sel.length<2) setT5Sel([...t5Sel,i])
                              }}
                              style={{
                                padding:10, borderRadius:10,
                                border:isSel?'2px solid #f59e0b':canPlace?'1.5px solid #e2e8f0':'1.5px solid #fca5a5',
                                background:isSel?'#fff7ed':canPlace?'white':'#fff5f5',
                                cursor: !canPlace ? 'not-allowed' : isDimmed ? 'default' : 'pointer',
                                opacity: isDimmed ? 0.3 : 1,
                                textAlign:'left',
                              }}>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                                <span style={{ fontSize:20, fontWeight:700, color:isSel?'#e07b1a':canPlace?'#1e293b':'#ef4444' }}>{val}</span>
                                <span style={{ fontSize:16 }}>{res.icon}</span>
                              </div>
                              <div style={{ fontSize:12, fontWeight:600, color:isSel?'#c2410c':canPlace?'#374151':'#ef4444' }}>{res.name}</div>
                              <div style={{ fontSize:10, color:'#9ca3af' }}>{res.terrains.join(', ')}</div>
                              {!canPlace && <div style={{ fontSize:10, color:'#ef4444', marginTop:2 }}>⚠ Aucune case compatible — relancez</div>}
                            </button>
                            {!canPlace && (
                              <button onClick={()=>{
                                const newDice=[...t5Dice]
                                newDice[i]=rollDie()
                                setT5Dice(newDice)
                              }} style={{ fontSize:11, padding:'4px 0', borderRadius:6, border:'1px solid #fca5a5', background:'#fff5f5', color:'#ef4444', cursor:'pointer' }}>
                                🎲 Relancer ce dé
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>}

                  {/* Phase 2 : placer les ressources */}
                  {t5Sel.length===2 && <>
                    <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em' }}>Placez vos ressources sur la carte</div>
                    {t5Sel.map(di => {
                      const res=RESOURCE_FROM_DIE[t5Dice[di]]
                      const isAct=t5Active===di, placed=t5Place[di]
                      return (
                        <div key={di} style={{ border:isAct?'2px solid #f59e0b':'1.5px solid #e2e8f0', borderRadius:8, padding:10, background:isAct?'#fffbeb':'#f8fafc' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:16, fontWeight:700, color:'#475569' }}>{t5Dice[di]}</span>
                              <span style={{ fontSize:14 }}>{res.icon}</span>
                              <span style={{ fontSize:13, fontWeight:500 }}>{res.name}</span>
                            </div>
                            {placed
                              ? <span style={{ fontSize:12, color:'#16a34a', fontWeight:500 }}>✓</span>
                              : canPlaceResource(di)
                                ? <button onClick={()=>setT5Active(isAct?null:di)} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, cursor:'pointer', background:isAct?'#f59e0b':'#f1f5f9', color:isAct?'white':'#475569', border:'none' }}>
                                    {isAct?'Annuler':'Placer →'}
                                  </button>
                                : <button onClick={()=>{
                                    const newDice=[...t5Dice]; newDice[di]=rollDie(); setT5Dice(newDice)
                                    setT5Sel(t5Sel.filter(x=>x!==di)); const p={...t5Place}; delete p[di]; setT5Place(p)
                                  }} style={{ fontSize:11, padding:'3px 8px', borderRadius:6, border:'1px solid #fca5a5', background:'#fff5f5', color:'#ef4444', cursor:'pointer' }}>
                                    🎲 Relancer
                                  </button>
                            }
                          </div>
                          {isAct && <div style={{ fontSize:11, color:'#f59e0b', marginTop:6 }}>Les cases compatibles sont surlignées sur la carte →</div>}
                          {placed && <div style={{ fontSize:10, color:'#16a34a', marginTop:4 }}>Case {placed.split('-').map(n=>parseInt(n)+1).join(',')}</div>}
                        </div>
                      )
                    })}
                    {t5AllPlaced && <button onClick={confirmStep5} style={{ padding:'9px 0', background:'#f59e0b', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:'pointer' }}>Confirmer →</button>}
                  </>}
                </>
            }
          </>}

          {/* ÉTAPE 6 */}
          {step===6 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Population de départ</h2>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:12, fontSize:14, display:'flex', flexDirection:'column', gap:8 }}>
              {[['🧑‍🌾','Fermier',1],['👷','Ouvrier',1],['⚔️','Guerrier',1]].map(([icon,name,n])=>(
                <div key={name} style={{ display:'flex', justifyContent:'space-between' }}><span>{icon} {name}</span><span style={{ fontWeight:600 }}>{n}</span></div>
              ))}
            </div>
            <button onClick={confirmStep6} style={{ padding:'9px 0', background:'#f59e0b', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:'pointer' }}>Confirmer →</button>
          </>}

          {/* ÉTAPE 7 */}
          {step===7 && <>
            <h2 style={{ fontWeight:600, color:'#1e293b', fontSize:16 }}>Prêt à conquérir ! 🚀</h2>
            <div style={{ background:'#f8fafc', borderRadius:8, padding:12, fontSize:13, display:'flex', flexDirection:'column', gap:6 }}>
              {[['🐉','Varyndor'],['🦅','Elyssar'],['🐺','Kharzun'],['🦁','Solmeria']].map(([e,n])=>(
                <div key={n} style={{ display:'flex', justifyContent:'space-between' }}><span>{e} {n}</span><span style={{ color:'#64748b' }}>Pui. 2 / 8</span></div>
              ))}
            </div>
            <button onClick={startGame} style={{ padding:'11px 0', background:'#1e3a5f', color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:15, cursor:'pointer' }}>🚀 Lancer la partie !</button>
          </>}
        </div>

        {/* ── Carte ── */}
        <div
          style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:8, background:'#f1f5f9', overflow:'hidden' }}
          onMouseLeave={()=>step===1&&setHovered(null)}
        >
          <GameMap
            map={game?.map}
            empires={game?.empires}
            onTileClick={handleTileClick}
            onTileHover={handleTileHover}
            highlightTiles={[...step1Highlight, ...step2Highlight, ...step5Highlight]}
            clickableTiles={step4Clickable}
            selectedTile={null}
          />
        </div>
      </div>
    </div>
  )
}

import { useState, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { INNOVATIONS_PAR_ARBRE, INNOVATIONS_MAP, peutCommencerInnovation } from '../../data/innovations.js'
import UnlockPopup from './UnlockPopup.jsx'

const ARBRES = [
  { id:'administration', label:'Administration', emoji:'📜', color:'#1e40af', bg:'#eff6ff', border:'#93c5fd' },
  { id:'exploitation',   label:'Exploitation',   emoji:'⛏️', color:'#92400e', bg:'#fffbeb', border:'#fcd34d' },
  { id:'guerre',         label:'Guerre',          emoji:'⚔️', color:'#991b1b', bg:'#fef2f2', border:'#fca5a5' },
  { id:'religion',       label:'Religion',        emoji:'✝️', color:'#5b21b6', bg:'#faf5ff', border:'#c4b5fd' },
]
const TYPE_COLORS = {
  A:{ bg:'#fef3c7', color:'#92400e', border:'#f59e0b' },
  N:{ bg:'#dbeafe', color:'#1e40af', border:'#3b82f6' },
  P:{ bg:'#ede9fe', color:'#5b21b6', border:'#7c3aed' },
}

// Dimensions fixes du nœud — calculées sur le cas max (7 cases + labels)
const NODE_W  = 240
const NODE_H  = 140  // hauteur fixe uniforme pour tous les nœuds
const COL_GAP = 80   // espace horizontal entre colonnes
const ROW_GAP = 28   // espace vertical entre nœuds dans une colonne
const PAD     = 24   // padding extérieur

function InnovNode({ innov, innovations, jetons, arbre, onCocher }) {
  const current = innovations[innov.id] || { checked:0, unlocked:false }
  const { checked, unlocked } = current
  const dispo = peutCommencerInnovation(innov.id, innovations) || checked > 0

  const cases = []
  for (const [type, count] of Object.entries(innov.cout))
    for (let i=0; i<count; i++) cases.push(type)

  return (
    <div style={{
      width: NODE_W, height: NODE_H,
      borderRadius: 12,
      border: `2px solid ${unlocked ? arbre.color : dispo ? arbre.border : '#e2e8f0'}`,
      background: unlocked ? arbre.bg : dispo ? 'white' : '#f8fafc',
      opacity: dispo ? 1 : 0.55,
      padding: '10px 12px',
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {unlocked && (
        <div style={{ position:'absolute', top:6, right:8, fontSize:10, color:arbre.color, fontWeight:700 }}>✓</div>
      )}

      {/* Titre + description */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          <span style={{ fontSize:16, flexShrink:0 }}>{innov.emoji}</span>
          <span style={{ fontWeight:700, fontSize:12, color: unlocked ? arbre.color : '#1e293b', lineHeight:1.2 }}>{innov.nom}</span>
        </div>
        <div style={{ fontSize:10, color:'#64748b', lineHeight:1.35, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {innov.effetCourt}
        </div>
      </div>

      {/* Cases à cocher ou condition manquante */}
      <div>
        {!unlocked && dispo ? (
          <div style={{ display:'flex', flexWrap:'wrap', gap:3, alignItems:'center' }}>
            {cases.map((type,idx) => {
              const tc = TYPE_COLORS[type]
              const isChecked = idx < checked
              const isNext    = idx === checked
              const canCheck  = isNext && (jetons[type]||0) > 0
              return (
                <button key={idx}
                  onClick={() => canCheck && onCocher(innov.id, type)}
                  title={`Jeton ${type}${canCheck?'':' — insuffisant'}`}
                  style={{
                    width:19, height:19, borderRadius:4,
                    border:`1.5px solid ${isChecked?tc.border:isNext?tc.border:'#e2e8f0'}`,
                    background: isChecked?tc.color:isNext?tc.bg:'#f8fafc',
                    color: isChecked?'white':tc.color,
                    cursor: canCheck?'pointer':'default',
                    fontSize:9, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    opacity: isNext||isChecked ? 1 : 0.35,
                    flexShrink:0,
                  }}>
                  {isChecked ? '✓' : type}
                </button>
              )
            })}
            <span style={{ fontSize:9, color:'#94a3b8', marginLeft:2 }}>{checked}/{innov.total}</span>
          </div>
        ) : !unlocked ? (
          <div style={{ fontSize:9, color:'#94a3b8' }}>
            🔒 {innov.conditions.map(id => INNOVATIONS_MAP[id]?.nom||id).join(', ')}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ArbreView({ arbreId, innovations, jetons, arbre, onCocher }) {
  const list = INNOVATIONS_PAR_ARBRE[arbreId] || []

  // Calculer les niveaux (colonnes) par BFS sur les dépendances
  const niveaux = {}
  const getLevel = (id, visited=new Set()) => {
    if (niveaux[id] !== undefined) return niveaux[id]
    if (visited.has(id)) return 0
    visited.add(id)
    const innov = INNOVATIONS_MAP[id]
    if (!innov || innov.conditions.length===0) { niveaux[id]=0; return 0 }
    const max = Math.max(...innov.conditions.map(cid => getLevel(cid, new Set(visited))))
    niveaux[id] = max+1; return max+1
  }
  list.forEach(i => getLevel(i.id))

  const maxLevel = Math.max(...Object.values(niveaux), 0)
  const parNiveau = {}
  for (let n=0; n<=maxLevel; n++) parNiveau[n] = []
  list.forEach(i => parNiveau[niveaux[i.id]||0].push(i))

  // Positions — centrage vertical par colonne
  const maxInCol = Math.max(...Object.values(parNiveau).map(a => a.length), 1)
  const totalH = maxInCol * NODE_H + (maxInCol-1) * ROW_GAP + PAD*2
  const totalW = (maxLevel+1) * NODE_W + maxLevel * COL_GAP + PAD*2

  const pos = {}
  for (let n=0; n<=maxLevel; n++) {
    const nodes = parNiveau[n]
    const colH  = nodes.length * NODE_H + (nodes.length-1) * ROW_GAP
    const startY = PAD + (totalH - PAD*2 - colH) / 2
    nodes.forEach((innov, idx) => {
      const x = PAD + n*(NODE_W+COL_GAP)
      const y = startY + idx*(NODE_H+ROW_GAP)
      pos[innov.id] = { x, y, cx: x+NODE_W/2, cy: y+NODE_H/2, rx: x+NODE_W, ry: y+NODE_H/2 }
    })
  }

  // Flèches
  const arrows = []
  list.forEach(innov => {
    innov.conditions.forEach(condId => {
      const from = pos[condId], to = pos[innov.id]
      if (!from || !to) return
      const x1=from.rx, y1=from.ry, x2=to.x, y2=to.cy
      const cp1x=x1+(x2-x1)*0.5, cp1y=y1, cp2x=x1+(x2-x1)*0.5, cp2y=y2
      const unlocked = innovations[condId]?.unlocked
      arrows.push({ d:`M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`, unlocked, key:`${condId}->${innov.id}` })
    })
  })

  return (
    <div style={{ position:'relative', width:totalW, height:totalH, minWidth:totalW }}>
      <svg style={{ position:'absolute', inset:0, width:totalW, height:totalH, pointerEvents:'none', overflow:'visible' }}>
        <defs>
          <marker id={`ah-${arbreId}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill={arbre.border} />
          </marker>
          <marker id={`ao-${arbreId}`} markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill={arbre.color} />
          </marker>
        </defs>
        {arrows.map(a => (
          <path key={a.key} d={a.d} fill="none"
            stroke={a.unlocked ? arbre.color : arbre.border}
            strokeWidth={a.unlocked ? 2.5 : 1.5}
            strokeDasharray={a.unlocked ? undefined : '6,4'}
            opacity={a.unlocked ? 1 : 0.7}
            markerEnd={`url(#${a.unlocked ? `ao-${arbreId}` : `ah-${arbreId}`})`}
          />
        ))}
      </svg>
      {list.map(innov => {
        const p = pos[innov.id]; if (!p) return null
        return (
          <div key={innov.id} style={{ position:'absolute', left:p.x, top:p.y }}>
            <InnovNode innov={innov} innovations={innovations} jetons={jetons} arbre={arbre} onCocher={onCocher} />
          </div>
        )
      })}
    </div>
  )
}

export function InnovationsPanel({ onClose }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const [onglet, setOnglet]           = useState('administration')
  const [pendingUnlocks, setPendingUnlocks] = useState([])

  const jetons      = game?.jetons      || { A:0, N:0, P:0 }
  const innovations = game?.innovations || {}
  const arbre       = ARBRES.find(a => a.id===onglet)

  const handleCocher = useCallback((innovId, type) => {
    const innov = INNOVATIONS_MAP[innovId]
    if (!innov) return
    const current = innovations[innovId] || { checked:0, unlocked:false }
    if (current.unlocked) return
    if ((jetons[type]||0) <= 0) return
    const newChecked = current.checked + 1
    const willUnlock = newChecked >= innov.total
    updateGame(g => ({
      ...g,
      jetons: { ...g.jetons, [type]: Math.max(0,(g.jetons?.[type]||0)-1) },
      innovations: { ...g.innovations, [innovId]: { checked:newChecked, unlocked:willUnlock } },
    }))
    if (willUnlock) setPendingUnlocks(prev => [...prev, innov])
  }, [innovations, jetons, updateGame])

  function applyEffect(id, result) {
    const simple = {
      ceramique:'ceramique', monnaie:'monnaie', bureaucratie:'bureaucratie',
      genieCivil:'genieCivil', architectureRoyale:'architectureRoyale',
      palaisDesMerveilles:'palaisDesMerveilles', drainage:'drainage', irrigation:'irrigation',
      rendementAgricole:'rendementAgricole', cultureEnTerrasse:'cultureEnTerrasse',
      cultureEnTerrasse2:'cultureEnTerrasse2', extraction:'extraction',
      reseauDefensif:'reseauDefensif', tactique:'tactique', strategieOffensive:'strategieOffensive',
      techniquesDeSiege:'techniquesDeSiege', repliStrategique:'repliStrategique',
      strategieDefensive:'strategieDefensive', meilleuresArmes:'meilleuresArmes',
      chevalerie:'chevalerie', navigation:'navigation', culteDesHeros:'culteDesHeros',
      elusDesDieux:'elusDesDieux', inquisition:'inquisition',
    }
    if (simple[id]) {
      updateGame(g => ({ ...g, activeEffects:{ ...g.activeEffects, [simple[id]]:true } }))
      if (id==='genieCivil') updateGame(g => ({ ...g, nextTurnEffects:{ ...g.nextTurnEffects, genieCivilDe:true } }))
      return
    }
    switch(id) {
      case 'proselytisme':   updateGame(g=>({...g,activeEffects:{...g.activeEffects,proselytismeActif:true}})); break
      case 'interventionDivine': updateGame(g=>({...g,prierCharges:4})); break
      case 'benedictionDesTroupeaux': updateGame(g=>({...g,resources:{...g.resources,nourriture:(g.resources?.nourriture||0)+3}})); break
      case 'prospection1': case 'prospection2': case 'prospection3':
        if (result?.ressource&&result?.row!==undefined) updateGame(g=>{const nm=g.map.map(r=>r.map(t=>({...t})));nm[result.row][result.col]={...nm[result.row][result.col],resource1:{type:result.ressource,quantity:1}};return{...g,map:nm}}); break
      case 'conscription': { const nb=Math.floor((game?.map?.flat().filter(t=>t.owner==='player').length||0)/2); if(nb>0) updateGame(g=>({...g,population:{...g.population,guerrier:(g.population?.guerrier||0)+nb}})); break }
      case 'clerge': if(result?.paid) updateGame(g=>({...g,resources:{...g.resources,or:Math.max(0,(g.resources?.or||0)-3)},population:{...g.population,pretre:(g.population?.pretre||0)+2}})); break
      case 'messianisme': if(result?.empireId) updateGame(g=>{const emp=g.empires?.[result.empireId]||{power:0,maxPower:8};return{...g,empires:{...g.empires,[result.empireId]:{...emp,power:Math.max(0,emp.power-2),maxPower:Math.max(0,emp.maxPower-2)}},population:{...g.population,guerrier:(g.population?.guerrier||0)+2}}}); break
      case 'martyrs': if(result?.nbPretres>0) updateGame(g=>{const nb=result.nbPretres;const ne={...g.empires};for(let i=1;i<=4;i++)if(ne[i])ne[i]={...ne[i],power:Math.max(0,ne[i].power-nb)};return{...g,empires:ne,population:{...g.population,pretre:Math.max(0,(g.population?.pretre||0)-nb)}}}); break
      case 'conversion': if(result?.row!==undefined) updateGame(g=>{const nm=g.map.map(r=>r.map(t=>({...t})));nm[result.row][result.col]={...nm[result.row][result.col],owner:'player',explored:true};return{...g,map:nm}}); break
      default: break
    }
  }

  function handleUnlockClose(result) {
    setPendingUnlocks(prev => {
      const [current, ...rest] = prev
      if (current) applyEffect(current.id, result)
      return rest
    })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:12 }}>
      <div style={{ background:'white', borderRadius:16, width:'min(96vw,960px)', height:'min(92vh,720px)', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.35)' }}>

        {/* Header */}
        <div style={{ padding:'12px 18px', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:600, fontSize:15 }}>🔬 Innovations</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>Cliquez sur une case pour dépenser un jeton</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {[['A','#d97706','#fef3c7'],['N','#1d4ed8','#dbeafe'],['P','#7c3aed','#ede9fe']].map(([t,c,bg])=>(
              <div key={t} style={{ background:bg, borderRadius:8, padding:'4px 10px', fontSize:13, fontWeight:700, color:c, minWidth:36, textAlign:'center' }}>
                {t} <span style={{ fontSize:16 }}>{jetons[t]||0}</span>
              </div>
            ))}
            <button onClick={onClose} style={{ marginLeft:8, background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:22 }}>✕</button>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display:'flex', borderBottom:'1px solid #e2e8f0', flexShrink:0 }}>
          {ARBRES.map(a => (
            <button key={a.id} onClick={()=>setOnglet(a.id)} style={{
              flex:1, padding:'10px 4px', border:'none', cursor:'pointer', fontSize:12, fontWeight:500,
              background: onglet===a.id ? a.bg : 'transparent',
              color: onglet===a.id ? a.color : '#64748b',
              borderBottom: onglet===a.id ? `2px solid ${a.color}` : '2px solid transparent',
            }}>
              {a.emoji} {a.label}
            </button>
          ))}
        </div>

        {/* Zone scrollable */}
        <div style={{ flex:1, overflow:'auto', padding:'16px' }}>
          <ArbreView
            arbreId={onglet}
            innovations={innovations}
            jetons={jetons}
            arbre={arbre}
            onCocher={handleCocher}
          />
        </div>
      </div>

      {pendingUnlocks[0] && (
        <UnlockPopup innov={pendingUnlocks[0]} game={game} onClose={handleUnlockClose} />
      )}
    </div>
  )
}

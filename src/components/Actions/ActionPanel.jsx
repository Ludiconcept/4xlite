import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { ActionRecolter }   from './ActionRecolter.jsx'
import { ActionExplorer }   from './ActionExplorer.jsx'
import { ActionColoniser }  from './ActionColoniser.jsx'
import { ActionGrandir }    from './ActionGrandir.jsx'
import { ActionConstruire } from './ActionConstruire.jsx'
import { ActionAttaquer }   from './ActionAttaquer.jsx'
import { getCasesExplorables, getCasesColonisables } from '../../engine/exploration.js'
import { getCasesAttaquables, getEmpiresAttaquablesDirectement } from '../../engine/combat.js'

const ACTION_CFG = {
  explorer:  { label:'Explorer',  emoji:'🧭', color:'#7c3aed' },
  coloniser: { label:'Coloniser', emoji:'🏴', color:'#2563eb' },
  attaquer:  { label:'Attaquer',  emoji:'⚔️', color:'#dc2626' },
}

function useActionAvailability() {
  const game = useGameStore(s => s.game)
  if (!game) return {}
  const map = game.map
  const popTotal      = Object.values(game.population).reduce((a, b) => a + b, 0)
  const nbPlayerTiles = map.flat().filter(t => t.owner === 'player').length
  const explorables   = getCasesExplorables(map)
  const colonisables  = getCasesColonisables(map, popTotal, nbPlayerTiles)
  const attaquables   = getCasesAttaquables(map)

  // Attaquer = cases ennemies adjacentes OU empires attaquables depuis bord
  const empiresDirects = getEmpiresAttaquablesDirectement(map)
  const peutAttaquer   = attaquables.length > 0 || empiresDirects.length > 0
  return {
    explorer:  explorables.length === 0 ? 'Aucune case explorable adjacente.' : null,
    coloniser: popTotal <= nbPlayerTiles
      ? `Population insuffisante (${popTotal} pop. pour ${nbPlayerTiles} cases).`
      : colonisables.length === 0 ? 'Aucune case colonisable disponible.' : null,
    attaquer:  peutAttaquer ? null : 'Aucune cible disponible (cases ennemies ou bord de carte).',
  }
}

function PlaceholderPanel({ label, emoji, note, onClose }) {
  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:16, width:240, display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>{emoji} {label}</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>
      <p style={{ fontSize:13, color:'#94a3b8', fontStyle:'italic' }}>{note}</p>
    </div>
  )
}

function ActionChoiceDie4({ onSelect, onClose }) {
  const availability = useActionAvailability()
  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14, width:230, display:'flex', flexDirection:'column', gap:7 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>Dé 4 — Choisissez</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>
      {['explorer','coloniser','attaquer'].map(action => {
        const cfg     = ACTION_CFG[action]
        const blocked = availability[action]
        return (
          <button key={action} onClick={() => !blocked && onSelect(action)} disabled={!!blocked} style={{
            display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8,
            width:'100%', textAlign:'left', cursor: blocked ? 'not-allowed' : 'pointer',
            border: blocked ? '1.5px solid #f1f5f9' : `1.5px solid ${cfg.color}40`,
            background: blocked ? '#f8fafc' : `${cfg.color}08`,
            opacity: blocked ? 0.6 : 1,
          }}>
            <span style={{ fontSize:18 }}>{cfg.emoji}</span>
            <div style={{ flex:1 }}>
              <span style={{ fontSize:13, fontWeight:500, color: blocked ? '#94a3b8' : cfg.color }}>{cfg.label}</span>
              {blocked && <div style={{ fontSize:10, color:'#ef4444', marginTop:1, lineHeight:1.3 }}>⚠ {blocked}</div>}
            </div>
            {blocked && <span style={{ fontSize:12 }}>🔒</span>}
          </button>
        )
      })}
    </div>
  )
}

export function ActionPanel({
  dieValue, onClose, onMarkUsed,
  onTileHighlight,
  explorerTileClicked,   onExplorerTileHandled,
  coloniserTileClicked,  onColoniserTileHandled,
  constructTileClicked,  onConstructTileHandled,
  attackTileClicked,     onAttackTileHandled,
}) {
  const [chosen, setChosen] = useState(null)

  const actions =
    dieValue === 1 || dieValue === 2 ? ['recolter'] :
    dieValue === 3 ? ['construire'] :
    dieValue === 4 ? ['explorer','coloniser','attaquer'] :
    dieValue === 5 ? ['etudier'] :
    dieValue === 6 ? ['grandir'] : []

  const activeAction = actions.length === 1 ? actions[0] : chosen

  if (actions.length > 1 && !chosen) {
    return <ActionChoiceDie4 onSelect={setChosen} onClose={onClose} />
  }

  const backBtn = actions.length > 1 ? (
    <button onClick={() => setChosen(null)} style={{ fontSize:11, color:'#7c3aed', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textAlign:'left', padding:'2px 0' }}>
      ← Choisir une autre action
    </button>
  ) : null

  const handleClose = () => { onClose() }  // action components call onMarkUsed themselves

  switch (activeAction) {
    case 'recolter':
      return <ActionRecolter onClose={handleClose} onMarkUsed={onMarkUsed} />
    case 'construire':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <ActionConstruire onClose={onClose} onMarkUsed={onMarkUsed} onTileHighlight={onTileHighlight} constructTileClicked={constructTileClicked} onConstructTileHandled={onConstructTileHandled} />
        </div>
      )
    case 'explorer':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <ActionExplorer onClose={handleClose} onMarkUsed={onMarkUsed} onTileHighlight={onTileHighlight} explorerTileClicked={explorerTileClicked} onExplorerTileHandled={onExplorerTileHandled} onBack={() => setChosen(null)} />
        </div>
      )
    case 'coloniser':
      return (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <ActionColoniser onClose={handleClose} onMarkUsed={onMarkUsed} onTileHighlight={onTileHighlight} coloniserTileClicked={coloniserTileClicked} onColoniserTileHandled={onColoniserTileHandled} />
          {backBtn}
        </div>
      )
    case 'attaquer':
      return (
        <ActionAttaquer
          onClose={handleClose} onMarkUsed={onMarkUsed}
          onTileHighlight={onTileHighlight}
          attackTileClicked={attackTileClicked} onAttackTileHandled={onAttackTileHandled}
          onBack={actions.length > 1 ? () => setChosen(null) : undefined}
        />
      )
    case 'grandir':
      return <ActionGrandir onClose={handleClose} onMarkUsed={onMarkUsed} />
    case 'etudier':
      return <PlaceholderPanel label="Étudier" emoji="📚" note="Disponible au Sprint 7 (Innovations)." onClose={handleClose} />
    default:
      return null
  }
}

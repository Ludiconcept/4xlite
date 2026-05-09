import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { GameMap } from '../Map/GameMap.jsx'
import { ResourceBar } from './ResourceBar.jsx'
import { PopulationPanel } from './PopulationPanel.jsx'
import { RightPanel } from './RightPanel.jsx'
import { DiceZone } from '../Dice/DiceZone.jsx'
import { ActionPanel } from '../Actions/ActionPanel.jsx'
import { getCasesExplorables } from '../../engine/exploration.js'
import { getCasesAttaquables } from '../../engine/combat.js'

function TopBar({ onRules, onJournal }) {
  const game = useGameStore(s => s.game)
  const BTN = { display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.18)', border:'1.5px solid rgba(255,255,255,.5)', color:'#fff', padding:'5px 13px', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer' }
  return (
    <div style={{ background:'#1e3a5f', padding:'7px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexShrink:0 }}>
      <span style={{ fontWeight:500, fontSize:15, letterSpacing:'.05em', color:'#fff' }}>4X Lite</span>
      <div style={{ display:'flex', gap:7, alignItems:'center' }}>
        <span style={{ fontSize:12, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', padding:'3px 10px', borderRadius:10, color:'#fff' }}>Tour {game?.turn ?? 0}</span>
        <button onClick={onRules}   style={BTN}>📖 Règles</button>
        <button onClick={onJournal} style={BTN}>📜 Journal</button>
      </div>
    </div>
  )
}

function JournalPanel({ onClose }) {
  const entries = useLogStore(s => s.entries)
  return (
    <div style={{ position:'fixed', right:16, bottom:80, width:300, background:'white', borderRadius:12, border:'0.5px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,.12)', zIndex:200 }}>
      <div style={{ padding:'10px 14px', borderBottom:'0.5px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:500, fontSize:14 }}>📜 Journal</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
      </div>
      <div style={{ padding:'8px 14px', maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
        {entries.length === 0
          ? <p style={{ fontSize:13, color:'#94a3b8' }}>Aucune action enregistrée.</p>
          : entries.map(e => (
            <div key={e.id} style={{ fontSize:12, color:'#475569', borderBottom:'0.5px solid #f1f5f9', paddingBottom:4 }}>
              <span style={{ color:'#94a3b8', marginRight:6 }}>Tour {e.turn}</span>{e.text}
            </div>
          ))
        }
      </div>
    </div>
  )
}

export function GameScreen() {
  const game       = useGameStore(s => s.game)
  const [showJournal, setShowJournal] = useState(false)
  const [highlightTiles, setHighlight] = useState([])

  const [confirmedActions, setConfirmedActions] = useState([])
  const [usedActions,      setUsedActions]       = useState([])
  const [activeActionIdx,  setActiveActionIdx]   = useState(null)
  const [mapTileClicked,   setMapTileClicked]    = useState(null)

  if (!game) return null

  const currentAction = activeActionIdx !== null ? confirmedActions[activeActionIdx] : null

  // L'action en cours utilise-t-elle les clics carte ?
  const mapClickMode = currentAction !== null

  function handleMapTileClick(tile) {
    if (mapClickMode) setMapTileClicked(tile)
  }

  function handleActionClick({ action, idx }) {
    setActiveActionIdx(idx)
    // Pré-surligner les cases pertinentes selon l'action
    if (action.value === 4) {
      // Explorer / Coloniser / Attaquer — surlignage défini par l'action choisie plus tard
    }
    if (action.value === 3) {
      // Construire — surligner les cases du joueur
      const constructibles = game.map.flat().filter(t =>
        t.owner === 'player' && t.explored && !t.isLac && t.terrain !== 'lac' && (t.buildings?.length || 0) < 3
      )
      setHighlight(constructibles.map(t => ({ row:t.row, col:t.col })))
    }
  }

  function closeAction() {
    setActiveActionIdx(null)
    setHighlight([])
    setMapTileClicked(null)
  }

  // Called explicitly by action components when action is completed
  function markUsed() {
    if (activeActionIdx !== null) {
      const idx = activeActionIdx  // capture before closeAction resets it
      setUsedActions(prev => {
        if (prev.includes(idx)) return prev  // prevent double-add
        return [...prev, idx]
      })
    }
    closeAction()
  }

  function handleActionsConfirmed(actions) {
    setConfirmedActions(actions)
    setUsedActions([])
    setActiveActionIdx(null)
  }

  function handleTurnEnd() {
    setConfirmedActions([])
    setUsedActions([])
    setActiveActionIdx(null)
    setHighlight([])
    setMapTileClicked(null)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f8f7f2', overflow:'hidden' }}>
      <TopBar onRules={()=>alert('Manuel de règles — Sprint 8')} onJournal={()=>setShowJournal(v=>!v)} />
      <ResourceBar onInnovationsClick={()=>alert('Innovations — Sprint 7')} />

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0, position:'relative' }}>
        <PopulationPanel />
        <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:6, minWidth:0 }}>
          <GameMap
            map={game.map}
            empires={game.empires}
            highlightTiles={highlightTiles}
            onTileClick={mapClickMode ? handleMapTileClick : undefined}
          />
        </div>
        <RightPanel />

        {/* Panneau action — collé contre le bord droit de la carte */}
        {currentAction && (
          <div style={{ position:'absolute', right:144, top:'50%', transform:'translateY(-50%)', zIndex:300, boxShadow:'0 4px 20px rgba(0,0,0,.13)', borderRadius:12 }}>
            <ActionPanel
              dieValue={currentAction.value}
              onClose={closeAction}
              onMarkUsed={markUsed}
              onTileHighlight={setHighlight}
              explorerTileClicked={mapTileClicked}
              onExplorerTileHandled={() => setMapTileClicked(null)}
              coloniserTileClicked={mapTileClicked}
              onColoniserTileHandled={() => setMapTileClicked(null)}
              constructTileClicked={mapTileClicked}
              onConstructTileHandled={() => setMapTileClicked(null)}
              attackTileClicked={mapTileClicked}
              onAttackTileHandled={() => setMapTileClicked(null)}
            />
          </div>
        )}
      </div>

      <DiceZone
        onTurnEnd={handleTurnEnd}
        onActionsConfirmed={handleActionsConfirmed}
        onActionClick={handleActionClick}
        confirmedActions={confirmedActions}
        usedActions={usedActions}
      />

      {showJournal && <JournalPanel onClose={() => setShowJournal(false)} />}
    </div>
  )
}

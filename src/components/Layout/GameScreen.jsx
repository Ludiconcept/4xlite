import { useState, useRef, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { GameMap } from '../Map/GameMap.jsx'
import { ResourceBar } from './ResourceBar.jsx'
import { PopulationPanel } from './PopulationPanel.jsx'
import { RightPanel } from './RightPanel.jsx'
import { DiceZone } from '../Dice/DiceZone.jsx'
import { ActionPanel } from '../Actions/ActionPanel.jsx'
import { ActionsSpecialesPanel } from '../Actions/ActionsSpecialesPanel.jsx'
import { FaminePopup } from '../Actions/FaminePopup.jsx'
import { getCasesExplorables } from '../../engine/exploration.js'
import { EffetsActifs } from '../UI/EffetsActifs.jsx'
import { ActionEtudier } from '../Actions/ActionEtudier.jsx'
import { ActionDebug } from '../Actions/ActionDebug.jsx' // ⚠️ DEBUG ONLY
import { InnovationsPanel, ProspectionDicePopup } from '../Innovations/InnovationsPanel.jsx'
import { TourEmpiresPanel } from '../Empire/TourEmpiresPanel.jsx'
import { EvenementsPanel } from '../Empire/EvenementsPanel.jsx'
import { resoudreSurpopulation, appliquerFamine, calcStorageMax } from '../../engine/population.js'

function TopBar({ onRules, onJournal, onEvenements }) {
  const game = useGameStore(s => s.game)
  const BTN = { display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.18)', border:'1.5px solid rgba(255,255,255,.5)', color:'#fff', padding:'5px 13px', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer' }
  return (
    <div style={{ background:'#1e3a5f', padding:'7px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexShrink:0 }}>
      <span style={{ fontWeight:500, fontSize:15, letterSpacing:'.05em', color:'#fff' }}>4X Lite</span>
      <div style={{ display:'flex', gap:7, alignItems:'center' }}>
        <span style={{ fontSize:12, background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', padding:'3px 10px', borderRadius:10, color:'#fff' }}>Tour {game?.turn ?? 0}</span>
        <button onClick={onRules}   style={BTN}>📖 Règles</button>
        <button onClick={onJournal}    style={BTN}>📜 Journal</button>
        <button onClick={onEvenements} style={BTN}>📋 Événements</button>
      </div>
    </div>
  )
}

// Journal extrait en composant React propre (hooks autorisés)
function JournalPanel({ onClose }) {
  const entries = useLogStore(s => s.entries)
  const listRef = useRef(null)
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [entries])
  return (
    <div style={{ position:'fixed', right:16, bottom:80, width:300, background:'white', borderRadius:12, border:'0.5px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,.12)', zIndex:200 }}>
      <div style={{ padding:'10px 14px', borderBottom:'0.5px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:500, fontSize:14 }}>📜 Journal</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
      </div>
      <div ref={listRef} style={{ padding:'8px 14px', maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6 }}>
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
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [showJournal,    setShowJournal]    = useState(false)
  const [showEmpires,    setShowEmpires]    = useState(false)
  const [showInnovations, setShowInnovations] = useState(false)
  const [showDebug,       setShowDebug]       = useState(false)
  const [showEtudier,     setShowEtudier]     = useState(false)
  const etudierIdxRef = useRef(null) // capture l'idx avant closeAction
  const [prospectionPending, setProspectionPending] = useState(null) // {innov, tile}
  const [showEvenements, setShowEvenements] = useState(false)
  const [showSpeciales,  setShowSpeciales]  = useState(false)
  const [famineData,     setFamineData]     = useState(null)
  const [equiperMode,    setEquiperMode]    = useState(false)
  const [highlightTiles, setHighlight]      = useState([])
  const [caseSelectCallback, setCaseSelectCallback] = useState(null)

  const [confirmedActions, setConfirmedActions] = useState([])
  const [usedActions,      setUsedActions]       = useState([])
  const [activeActionIdx,  setActiveActionIdx]   = useState(null)
  const [mapTileClicked,   setMapTileClicked]    = useState(null)
  const [diceRolled,       setDiceRolled]        = useState(false)
  const [diceValues,       setDiceValues]        = useState([])
  const [dicePhase,        setDicePhase]         = useState('idle')

  if (!game) return null

  const currentAction = activeActionIdx !== null ? confirmedActions[activeActionIdx] : null
  const mapClickMode  = currentAction !== null

  function handleMapTileClick(tile) {
    // Priorité : sélection de case pour soumission des tribus
    if (caseSelectCallback) {
      caseSelectCallback(tile)
      setCaseSelectCallback(null)
      setHighlight([])
      return
    }
    if (mapClickMode) setMapTileClicked(tile)
  }

  function handleActionClick({ action, idx }) {
    setActiveActionIdx(idx)
    if (action.value === 3) {
      const constructibles = game.map.flat().filter(t => t.owner==='player' && t.explored && t.terrain!=='lac' && !t.isLac)
      setHighlight(constructibles.map(t => ({ row:t.row, col:t.col })))
    }
  }

  function closeAction() {
    // Fermer sans griser — ne pas appeler markUsed
    setActiveActionIdx(null)
    setHighlight([])
    setMapTileClicked(null)
  }

  function markUsed() {
    if (activeActionIdx !== null) {
      const idx = activeActionIdx
      setUsedActions(prev => prev.includes(idx) ? prev : [...prev, idx])
    }
    closeAction()
  }

  function handleDiceRolled() {
    setDicePhase('rolled')
    setDiceRolled(true)
  }

  function handleActionsConfirmed(actions) {
    setConfirmedActions(actions)
    setUsedActions([])
    setActiveActionIdx(null)
    setDiceValues(actions.map(a => a.value))
  }

  function handleActionsPhaseStart() {
    // Appelé quand le joueur confirme ses 2 dés → Équiper n'est plus dispo
    setDicePhase('acting')
  }

  function handleTurnEnd() {
    // Lire le state frais pour éviter les stale closures
    const freshGame = useGameStore.getState().game
    const { newResources, famineData: fd } = resoudreSurpopulation(freshGame.population, freshGame.resources, freshGame.map, freshGame.activeEffects)
    const newStorageMax = calcStorageMax(freshGame.map)
    if (fd) {
      updateGame(g => ({ ...g, resources: newResources, storageMax: newStorageMax }))
      setFamineData(fd)
    } else {
      updateGame(g => ({ ...g, resources: newResources, storageMax: newStorageMax }))
      finirTour()
    }
  }

  function handleFamineConfirm(pertes) {
    updateGame(g => ({ ...g, population: appliquerFamine(g.population, pertes) }))
    setFamineData(null)
    finirTour()
  }

  function finirTour() {
    // Déclencher le tour des empires
    setShowEmpires(true)
    setConfirmedActions([])
    setUsedActions([])
    setActiveActionIdx(null)
    setHighlight([])
    setMapTileClicked(null)
    setDiceRolled(false)
    setDicePhase('idle')
    setDiceValues([])
    // Reset turnLimits dans le game store
    updateGame(g => ({ ...g, turnLimits: { grandir:0, recruter:0, commerce:0, commerceMarche:0, servageUsed:false } }))
    addEntry(`Fin du tour ${game.turn}`, game.turn)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#f8f7f2', overflow:'hidden' }}>
      <TopBar onRules={()=>alert('Manuel de règles — Sprint 8')} onJournal={()=>setShowJournal(v=>!v)} onEvenements={() => setShowEvenements(v=>!v)} />
      <ResourceBar onInnovationsClick={() => setShowInnovations(true)} />

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0, position:'relative' }}>
        <PopulationPanel />

        <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:6, minWidth:0, position:'relative' }}>
          <GameMap map={game.map} empires={game.empires} highlightTiles={highlightTiles} onTileClick={(mapClickMode || caseSelectCallback) ? handleMapTileClick : undefined} />
          {/* Effets actifs — flottant en bas à gauche de la carte */}
          <div style={{ position:'absolute', bottom:10, left:10, zIndex:50 }}>
            <EffetsActifs />
          </div>
        </div>

        <RightPanel />

        {/* Panneau action */}
        {currentAction && (
          <div style={{ position:'absolute', right:144, top:'50%', transform:'translateY(-50%)', zIndex:300, boxShadow:'0 4px 20px rgba(0,0,0,.13)', borderRadius:12 }}>
            <ActionPanel
              dieValue={currentAction.value}
              onClose={closeAction}
              onMarkUsed={markUsed}
              onTileHighlight={setHighlight}
              explorerTileClicked={mapTileClicked}   onExplorerTileHandled={() => setMapTileClicked(null)}
              coloniserTileClicked={mapTileClicked}  onColoniserTileHandled={() => setMapTileClicked(null)}
              constructTileClicked={mapTileClicked}  onConstructTileHandled={() => setMapTileClicked(null)}
              attackTileClicked={mapTileClicked}     onAttackTileHandled={() => setMapTileClicked(null)}
              onOpenInnovations={() => setShowInnovations(true)}
              onOpenEtudier={() => {
                etudierIdxRef.current = activeActionIdx
                setShowEtudier(true)
              }}
            />
          </div>
        )}

        {/* Panneau Spéciales — s'ouvre vers le haut, ancré au bouton dans DiceZone */}
        {showSpeciales && (
          <div style={{ position:'fixed', bottom:70, right:16, zIndex:400, boxShadow:'0 -4px 24px rgba(0,0,0,.15)', borderRadius:12, maxHeight:'75vh', overflowY:'auto' }}>
            <ActionsSpecialesPanel
              onClose={() => setShowSpeciales(false)}
              diceRolled={diceRolled}
              dicePhase={dicePhase}
              diceValues={diceValues}
              onHighlightCase={(tiles) => setHighlight(tiles.map(t => ({ ...t, selectHighlight: true })))}
              onClearHighlight={() => setHighlight([])}
              onRequestCaseSelect={(eligibles, callback) => {
                setHighlight(eligibles.map(t => ({ ...t, selectHighlight: true })))
                setCaseSelectCallback(() => callback)
                setShowSpeciales(false)
              }}
            />
          </div>
        )}
      </div>

      {/* Zone basse : tour empires OU dés joueur */}
      <div style={{ borderTop:'0.5px solid #e2e8f0', flexShrink:0 }}>
        {showEmpires ? (
          <TourEmpiresPanel
            key={`tour-empires-${game.turn}`}
            onClose={() => setShowEmpires(false)}
            onHighlightCase={(tile, action) => {
              if (tile) setHighlight([{ ...tile, empireAction: action }])
              else setHighlight([])
            }}
            onRequestCaseSelect={(eligibles, callback) => {
              setHighlight(eligibles.map(t => ({ ...t, selectHighlight: true })))
              setCaseSelectCallback(() => callback)
            }}
            onClearCaseSelect={() => {
              setCaseSelectCallback(null)
              setHighlight([])
            }}
          />
        ) : (
          <DiceZone
            onTurnEnd={handleTurnEnd}
            onActionsConfirmed={handleActionsConfirmed}
            onActionClick={handleActionClick}
            onActionsPhaseStart={handleActionsPhaseStart}
            onDiceRolled={handleDiceRolled}
            confirmedActions={confirmedActions}
            usedActions={usedActions}
            externalDiceValues={dicePhase === 'rolled' && diceValues.length > 0 ? diceValues : null}
            onDiceValuesChange={setDiceValues}
            showSpeciales={showSpeciales}
            onToggleSpeciales={() => setShowSpeciales(v => !v)}
          />
        )}
      </div>

      {showInnovations && (
        <InnovationsPanel
          onClose={() => setShowInnovations(false)}
          onRequestCaseSelect={(eligibles, callback) => {
            setHighlight(eligibles.map(t => ({ ...t, selectHighlight: true })))
            setCaseSelectCallback(() => callback)
            setShowInnovations(false)
          }}
          onProspectionReady={(innov, tile) => {
            setProspectionPending({ innov, tile })
            setHighlight([])
            setCaseSelectCallback(null)
          }}
        />
      )}

      {prospectionPending && (
        <ProspectionDicePopup
          innov={prospectionPending.innov}
          tile={prospectionPending.tile}
          onDone={(result) => {
            if (result?.ressource && result?.row !== undefined) {
              updateGame(g => {
                const nm = g.map.map(r => r.map(t => ({...t})))
                if (!nm[result.row]?.[result.col]) return g
                const t = nm[result.row][result.col]
                if (!t.resource1) nm[result.row][result.col] = {...t, resource1:{type:result.ressource,quantity:1}}
                else if (!t.resource2) nm[result.row][result.col] = {...t, resource2:{type:result.ressource,quantity:1}}
                return {...g, map:nm}
              })
            }
            setProspectionPending(null)
            setHighlight([])
          }}
        />
      )}

      {showEtudier && (
        <ActionEtudier
          onClose={() => setShowEtudier(false)}
          onMarkUsed={() => {
            setShowEtudier(false)
            // Marquer l'action avec l'idx capturé (activeActionIdx peut être null à ce stade)
            const idx = etudierIdxRef.current
            if (idx !== null) {
              setUsedActions(prev => prev.includes(idx) ? prev : [...prev, idx])
              etudierIdxRef.current = null
            }
          }}
          onOpenInnovations={() => { setShowEtudier(false); setShowInnovations(true) }}
        />
      )}

      {/* ⚠️ DEBUG ONLY — Supprimer avant production */}
      <button onClick={() => setShowDebug(true)} style={{ position:'fixed', bottom:8, left:8,
        background:'#dc2626', color:'white', border:'none', borderRadius:8,
        padding:'4px 10px', fontSize:11, fontWeight:700, cursor:'pointer', zIndex:500, opacity:0.8 }}>
        🐞 Debug
      </button>
      {showDebug && <ActionDebug onClose={() => setShowDebug(false)} />}

      {famineData && <FaminePopup famineData={famineData} onConfirm={handleFamineConfirm} />}
      {showJournal    && <JournalPanel     onClose={() => setShowJournal(false)} />}
      {showEvenements && <EvenementsPanel  onClose={() => setShowEvenements(false)} />}
    </div>
  )
}

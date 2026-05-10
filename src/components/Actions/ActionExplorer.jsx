import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { getCasesExplorables, genererCase } from '../../engine/exploration.js'

const TERRAIN_NAMES = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne', lac:'Lac' }
const TERRAIN_ICONS = { marais:'🌿', plaine:'🌾', desert:'🏜️', colline:'⛰️', montagne:'🏔️', lac:'🏞️' }
const RESOURCE_LABELS = { foret:'Forêt', gibier:'Gibier', argile:'Argile', fer:'Fer', or:'Or', bois:'Bois', nourriture:'Nourriture' }
const ALL_TERRAINS = ['marais','plaine','desert','colline','montagne']

function rollDie() { return Math.floor(Math.random() * 6) + 1 }

export function ActionExplorer({ onClose, onTileHighlight, onMarkUsed, explorerTileClicked, onExplorerTileHandled, onBack }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [phase, setPhase]             = useState('select')
  const [selectedTile, setSelected]   = useState(null)
  const [terrainDie, setTerrainDie]   = useState(null)
  const [resourceDice, setResourceDice] = useState(null)
  const [terrainChoice, setTerrainChoice] = useState(null)
  const [rolling, setRolling]         = useState(false)
  const [animVal, setAnimVal]         = useState(null)
  const [preview, setPreview]         = useState(null)

  if (!game) return null
  const explorables = getCasesExplorables(game.map)

  // Consommer le clic carte via useEffect (pas directement dans le render)
  useEffect(() => {
    if (!explorerTileClicked || phase !== 'select') return
    const isExplorable = explorables.some(
      t => t.row === explorerTileClicked.row && t.col === explorerTileClicked.col
    )
    if (isExplorable) {
      setSelected(explorerTileClicked)
      onTileHighlight?.([{ row: explorerTileClicked.row, col: explorerTileClicked.col }])
      setPhase('roll')
    }
    onExplorerTileHandled?.()
  }, [explorerTileClicked]) // eslint-disable-line

  // Mettre en surbrillance les cases explorables au montage
  useEffect(() => {
    if (phase === 'select') {
      onTileHighlight?.(explorables.map(t => ({ row: t.row, col: t.col })))
    }
    return () => {}
  }, [phase]) // eslint-disable-line

  async function lancerDes() {
    if (!selectedTile || rolling) return
    setRolling(true)

    // Animation terrain
    const tdFinal = rollDie()
    const interval = setInterval(() => setAnimVal(Math.floor(Math.random() * 6) + 1), 80)
    await new Promise(r => setTimeout(r, 650))
    clearInterval(interval)
    setAnimVal(null)
    setTerrainDie(tdFinal)
    setRolling(false)

    if (tdFinal === 6) {
      setPhase('choixTerrain')
      return
    }

    // Dés ressource
    const rd = [rollDie(), rollDie()]
    setResourceDice(rd)
    const tile = game.map[selectedTile.row][selectedTile.col]
    const result = genererCase(tdFinal, rd, tile.hasFleuve, tile.isLac, null)
    setPreview(result)
    setPhase('resultat')
  }

  function confirmerTerrainLibre() {
    if (!terrainChoice || !selectedTile) return
    const tile = game.map[selectedTile.row][selectedTile.col]
    const rd = [rollDie(), rollDie()]
    setResourceDice(rd)
    const result = genererCase(6, rd, tile.hasFleuve, tile.isLac, terrainChoice)
    setPreview(result)
    setPhase('resultat')
  }

  function confirmerExploration() {
    if (!selectedTile || !preview) return
    updateGame(g => ({
      ...g,
      map: g.map.map(r => r.map(t => {
        if (t.row !== selectedTile.row || t.col !== selectedTile.col) return t
        return { ...t, explored: true, terrain: preview.terrain, resource1: preview.resource1, resource2: preview.resource2 }
      }))
    }))
    const res = [preview.resource1, preview.resource2].filter(Boolean).map(r => RESOURCE_LABELS[r.type]).join(' + ')
    addEntry(`Exploration (${selectedTile.col+1},${selectedTile.row+1}) → ${TERRAIN_NAMES[preview.terrain]}${res ? ` + ${res}` : ''}`, game.turn)
    onTileHighlight?.([])
    onMarkUsed?.()
    onClose()
  }

  function handleClose() {
    onTileHighlight?.([])
    onClose()
  }

  function retourSelection() {
    setPhase('select')
    setSelected(null)
    setTerrainDie(null)
    setResourceDice(null)
    setTerrainChoice(null)
    setPreview(null)
    onTileHighlight?.(explorables.map(t => ({ row: t.row, col: t.col })))
  }

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:16, width:260, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>🧭 Explorer</h3>
        <button onClick={handleClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>

      {/* SÉLECTION */}
      {phase === 'select' && (
        <>
          <p style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>
            Cliquez sur une case adjacente surlignée sur la carte.
          </p>
          {explorables.length === 0
            ? <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'7px 9px' }}>
                Aucune case explorable adjacent à votre territoire.
              </div>
            : <div style={{ fontSize:12, background:'#f5f3ff', border:'1px solid #c4b5fd', borderRadius:7, padding:'7px 9px', color:'#7c3aed' }}>
                {explorables.length} case{explorables.length > 1 ? 's' : ''} disponible{explorables.length > 1 ? 's' : ''} — surlignées sur la carte
              </div>
          }
        </>
      )}

      {/* LANCER */}
      {phase === 'roll' && selectedTile && (
        <>
          <div style={{ background:'#f0f4ff', border:'1px solid #c7d2fe', borderRadius:7, padding:'7px 9px', fontSize:12, color:'#3730a3' }}>
            Case ({selectedTile.col+1},{selectedTile.row+1}) sélectionnée
          </div>
          {rolling && animVal && (
            <div style={{ display:'flex', justifyContent:'center' }}>
              <div style={{ width:44, height:44, borderRadius:9, border:'1.5px solid #c4b5fd', background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#7c3aed' }}>
                {animVal}
              </div>
            </div>
          )}
          <button onClick={lancerDes} disabled={rolling} style={{ padding:'9px 0', background: rolling ? '#e2e8f0' : '#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:600, fontSize:13, cursor: rolling ? 'default' : 'pointer' }}>
            {rolling ? '🎲 Lancer…' : '🎲 Lancer les dés'}
          </button>
          {!terrainDie && (
            <button onClick={retourSelection} style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textAlign:'left' }}>
              ← Changer de case
            </button>
          )}
        </>
      )}

      {/* CHOIX TERRAIN (dé=6) */}
      {phase === 'choixTerrain' && (
        <>
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:7, padding:'7px 9px', fontSize:12, color:'#92400e' }}>
            <div style={{ fontWeight:500 }}>Dé 6 — Terrain libre</div>
            <div style={{ marginTop:2 }}>Choisissez le terrain <strong>avant</strong> de générer la ressource.</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {ALL_TERRAINS.map(t => (
              <button key={t} onClick={() => setTerrainChoice(t)} style={{
                padding:'7px 5px', borderRadius:7,
                border: terrainChoice === t ? '2px solid #7c3aed' : '1.5px solid #e2e8f0',
                background: terrainChoice === t ? '#f5f3ff' : 'white',
                cursor:'pointer', fontSize:11, textAlign:'center',
                color: terrainChoice === t ? '#7c3aed' : '#374151', fontWeight: terrainChoice === t ? 500 : 400,
              }}>
                {TERRAIN_ICONS[t]} {TERRAIN_NAMES[t]}
              </button>
            ))}
          </div>
          <button onClick={confirmerTerrainLibre} disabled={!terrainChoice} style={{ padding:'9px 0', background: terrainChoice ? '#7c3aed' : '#e2e8f0', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor: terrainChoice ? 'pointer' : 'default' }}>
            Confirmer → générer ressource
          </button>
          <button onClick={retourSelection} style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textAlign:'left' }}>
            ← Changer de case
          </button>
        </>
      )}

      {/* RÉSULTAT */}
      {phase === 'resultat' && preview && resourceDice && (
        <>
          <div style={{ background:'#f8fafc', border:'0.5px solid #e2e8f0', borderRadius:8, padding:9 }}>
            <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:7 }}>Résultats</div>
            <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#7c3aed' }}>{terrainDie}</div>
                <div style={{ fontSize:10, color:'#64748b' }}>Terrain</div>
              </div>
              <div style={{ width:1, height:32, background:'#e2e8f0' }}/>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:700, color:'#7c3aed' }}>{resourceDice[0]}+{resourceDice[1]}={resourceDice[0]+resourceDice[1]}</div>
                <div style={{ fontSize:10, color:'#64748b' }}>Ressource</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, background:'#f0fdf4', color:'#166534', padding:'3px 8px', borderRadius:8 }}>
                {TERRAIN_ICONS[preview.terrain]} {TERRAIN_NAMES[preview.terrain]}
              </span>
              {preview.resource1 && <span style={{ fontSize:11, background:'#eff6ff', color:'#1e40af', padding:'3px 8px', borderRadius:8 }}>{RESOURCE_LABELS[preview.resource1.type]}</span>}
              {preview.resource2 && <span style={{ fontSize:11, background:'#eff6ff', color:'#1e40af', padding:'3px 8px', borderRadius:8 }}>+ {RESOURCE_LABELS[preview.resource2.type]}</span>}
              {!preview.resource1 && <span style={{ fontSize:11, background:'#f8fafc', color:'#94a3b8', padding:'3px 8px', borderRadius:8 }}>Aucune ressource compatible</span>}
            </div>
          </div>
          <button onClick={confirmerExploration} style={{ padding:'9px 0', background:'#7c3aed', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:'pointer' }}>
            Confirmer →
          </button>
        </>
      )}
    </div>
  )
}

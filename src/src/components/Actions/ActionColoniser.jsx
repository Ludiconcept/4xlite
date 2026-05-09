import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { getCasesColonisables } from '../../engine/exploration.js'

const TERRAIN_NAMES = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne', lac:'Lac' }
const TERRAIN_ICONS = { marais:'🌿', plaine:'🌾', desert:'🏜️', colline:'⛰️', montagne:'🏔️', lac:'🏞️' }

export function ActionColoniser({ onClose, onMarkUsed, onTileHighlight, coloniserTileClicked, onColoniserTileHandled }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)
  const [tileClicked, setTileClicked] = useState(null)

  if (!game) return null

  const popTotal      = Object.values(game.population).reduce((a, b) => a + b, 0)
  const nbPlayerTiles = game.map.flat().filter(t => t.owner === 'player').length
  const colonisables  = getCasesColonisables(game.map, popTotal, nbPlayerTiles)
  const isBlocked     = popTotal <= nbPlayerTiles

  // Surligner les cases colonisables au montage
  useEffect(() => {
    onTileHighlight?.(colonisables.map(t => ({ row: t.row, col: t.col })))
    return () => onTileHighlight?.([])
  }, []) // eslint-disable-line

  function coloniser(tile) {
    updateGame(g => ({
      ...g,
      map: g.map.map(r => r.map(t =>
        t.row === tile.row && t.col === tile.col ? { ...t, owner:'player' } : t
      ))
    }))
    addEntry(`Colonisation (${tile.col+1},${tile.row+1})`, game.turn)
    onTileHighlight?.([])
    onMarkUsed?.()
    onClose()
  }

  // Consommer le clic carte local
  useEffect(() => {
    if (!tileClicked) return
    const isColonisable = colonisables.some(t => t.row === tileClicked.row && t.col === tileClicked.col)
    if (isColonisable) coloniser(tileClicked)
    setTileClicked(null)
  }, [tileClicked]) // eslint-disable-line

  // Consommer le clic carte transmis par GameScreen
  useEffect(() => {
    if (!coloniserTileClicked) return
    const isColonisable = colonisables.some(t => t.row === coloniserTileClicked.row && t.col === coloniserTileClicked.col)
    if (isColonisable) coloniser(coloniserTileClicked)
    onColoniserTileHandled?.()
  }, [coloniserTileClicked]) // eslint-disable-line

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14, width:240, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>🏴 Coloniser</h3>
        <button onClick={() => { onTileHighlight?.([]); onClose() }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>

      {isBlocked ? (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#dc2626' }}>
          ⛔ Population insuffisante : {popTotal} pop. pour {nbPlayerTiles} cases.<br/>
          <span style={{ fontWeight:400, fontSize:11 }}>Vous devez avoir plus de population que de cases contrôlées.</span>
        </div>
      ) : colonisables.length === 0 ? (
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#dc2626' }}>
          Aucune case colonisable. Explorez d'abord des cases adjacentes.
        </div>
      ) : (
        <>
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#1e40af' }}>
            {colonisables.length} case{colonisables.length > 1 ? 's' : ''} disponible{colonisables.length > 1 ? 's' : ''} — cliquez directement sur la carte ou choisissez ci-dessous.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:180, overflowY:'auto' }}>
            {colonisables.map(t => (
              <button key={`${t.row}-${t.col}`}
                onClick={() => coloniser(t)}
                onMouseEnter={() => onTileHighlight?.([{ row:t.row, col:t.col }])}
                onMouseLeave={() => onTileHighlight?.(colonisables.map(c => ({ row:c.row, col:c.col })))}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'white', cursor:'pointer', textAlign:'left' }}
              >
                <span style={{ fontSize:15 }}>{TERRAIN_ICONS[t.terrain] || '?'}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'#374151' }}>
                    ({t.col+1},{t.row+1}) — {TERRAIN_NAMES[t.terrain] || '?'}
                  </div>
                  {(t.resource1 || t.resource2) && (
                    <div style={{ fontSize:10, color:'#64748b' }}>
                      {[t.resource1, t.resource2].filter(Boolean).map(r => r.type).join(' + ')}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

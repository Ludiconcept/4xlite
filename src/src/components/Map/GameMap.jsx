import { useRef, useEffect, useState } from 'react'
import { Tile } from './Tile.jsx'
import { EMPIRE_CONFIG, EMPIRE_POSITIONS } from '../../data/empireConfig.js'

function EmpireBanner({ empireId, empire, position }) {
  const cfg = EMPIRE_CONFIG[empireId]
  if (!cfg) return null
  const isH = position === 'top' || position === 'bottom'
  return (
    <div style={{
      background: cfg.colorLight, border: `1.5px solid ${cfg.color}`,
      color: cfg.colorText, borderRadius: 6,
      padding: isH ? '3px 14px' : '4px 3px',
      fontSize: 11, fontWeight: 500,
      display: 'flex', flexDirection: isH ? 'row' : 'column',
      alignItems: 'center', gap: isH ? 5 : 2, flexShrink: 0,
      writingMode: isH ? 'horizontal-tb' : 'vertical-lr', whiteSpace: 'nowrap',
    }}>
      <span>{cfg.emoji}</span>
      <span style={{ writingMode:'inherit' }}>{cfg.name}</span>
      <span style={{ opacity:0.75, fontSize:10 }}>{empire?.power??0}/{empire?.maxPower??8}</span>
    </div>
  )
}

export function GameMap({
  map, empires,
  onTileClick,          // callback clic — si fourni, désactive tooltip clic dans Tile
  onTileHover,          // callback hover
  selectedTile = null,
  highlightTiles = [],  // cases valides (surbrillance forte rayée)
  clickableTiles = [],  // cases cliquables curiosités (animation pulsée)
}) {
  const containerRef = useRef(null)
  const [tileSize, setTileSize] = useState(56)

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth - 90
      const h = containerRef.current.clientHeight - 90
      const s = Math.floor(Math.min(w, h) / 5) - 3
      setTileSize(Math.max(44, Math.min(s, 90)))
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  if (!map) return null
  const e = empires || {}

  return (
    <div ref={containerRef} style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4, width:'100%', height:'100%' }}>
      <EmpireBanner empireId={EMPIRE_POSITIONS.top} empire={e[EMPIRE_POSITIONS.top]} position="top" />
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        <EmpireBanner empireId={EMPIRE_POSITIONS.left} empire={e[EMPIRE_POSITIONS.left]} position="left" />
        <div style={{
          display:'grid',
          gridTemplateColumns: `repeat(5, ${tileSize}px)`,
          gridTemplateRows:    `repeat(5, ${tileSize}px)`,
          gap: 3,
        }}>
          {map.flat().map(tile => {
            const isHighlighted = highlightTiles.some(h => h.row===tile.row && h.col===tile.col)
            const isClickable   = clickableTiles.some(h => h.row===tile.row && h.col===tile.col)
            const isSelected    = selectedTile?.row===tile.row && selectedTile?.col===tile.col
            return (
              <Tile
                key={`${tile.row}-${tile.col}`}
                tile={tile}
                size={tileSize}
                onClick={onTileClick}    // si fourni → pas de tooltip clic
                onHover={onTileHover}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isClickable={isClickable}
              />
            )
          })}
        </div>
        <EmpireBanner empireId={EMPIRE_POSITIONS.right} empire={e[EMPIRE_POSITIONS.right]} position="right" />
      </div>
      <EmpireBanner empireId={EMPIRE_POSITIONS.bottom} empire={e[EMPIRE_POSITIONS.bottom]} position="bottom" />
    </div>
  )
}

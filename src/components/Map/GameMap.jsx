import { useRef, useEffect, useState } from 'react'
import { Tile } from './Tile.jsx'
import { EMPIRE_CONFIG, EMPIRE_POSITIONS } from '../../data/empireConfig.js'

function EmpireBanner({ empireId, empire, position }) {
  const cfg = EMPIRE_CONFIG[empireId]
  if (!cfg) return null
  const isHorizontal = position === 'top' || position === 'bottom'

  return (
    <div
      style={{
        background: cfg.colorLight,
        border: `1.5px solid ${cfg.color}`,
        color: cfg.colorText,
        borderRadius: 6,
        padding: isHorizontal ? '3px 14px' : '4px 3px',
        fontSize: 11,
        fontWeight: 500,
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        alignItems: 'center',
        gap: isHorizontal ? 5 : 2,
        flexShrink: 0,
        writingMode: isHorizontal ? 'horizontal-tb' : 'vertical-lr',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{cfg.emoji}</span>
      <span style={{ writingMode: 'inherit' }}>{cfg.name}</span>
      <span style={{ opacity: 0.75, fontSize: 10 }}>
        {empire?.power ?? 0}/{empire?.maxPower ?? 8}
      </span>
    </div>
  )
}

export function GameMap({ map, empires, onTileClick, selectedTile = null, setupMode = false, highlightTiles = [] }) {
  const containerRef = useRef(null)
  const [tileSize, setTileSize] = useState(56)

  useEffect(() => {
    function updateSize() {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth - 90  // marges empires latéraux
      const h = containerRef.current.clientHeight - 90 // marges empires haut/bas
      const s = Math.floor(Math.min(w, h) / 5) - 3
      setTileSize(Math.max(44, Math.min(s, 84)))
    }
    updateSize()
    const ro = new ResizeObserver(updateSize)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  if (!map) return null

  const e = empires || {}

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-1 w-full h-full"
    >
      {/* Empire haut — Varyndor */}
      <EmpireBanner empireId={EMPIRE_POSITIONS.top} empire={e[EMPIRE_POSITIONS.top]} position="top" />

      <div className="flex items-center gap-1">
        {/* Empire gauche — Solmeria */}
        <EmpireBanner empireId={EMPIRE_POSITIONS.left} empire={e[EMPIRE_POSITIONS.left]} position="left" />

        {/* Grille 5x5 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, ${tileSize}px)`,
            gridTemplateRows: `repeat(5, ${tileSize}px)`,
            gap: 3,
          }}
        >
          {map.flat().map((tile) => {
            const isHighlighted = highlightTiles.some(
              (h) => h.row === tile.row && h.col === tile.col
            )
            const isSelected =
              selectedTile?.row === tile.row && selectedTile?.col === tile.col

            return (
              <div
                key={`${tile.row}-${tile.col}`}
                style={{
                  outline: isHighlighted ? '2px solid #f59e0b' : 'none',
                  outlineOffset: 1,
                  borderRadius: 6,
                  animation: isHighlighted ? 'pulse-highlight 1s ease-in-out infinite' : 'none',
                }}
              >
                <Tile
                  tile={tile}
                  size={tileSize}
                  onClick={onTileClick}
                  isSelected={isSelected}
                />
              </div>
            )
          })}
        </div>

        {/* Empire droit — Elyssar */}
        <EmpireBanner empireId={EMPIRE_POSITIONS.right} empire={e[EMPIRE_POSITIONS.right]} position="right" />
      </div>

      {/* Empire bas — Kharzun */}
      <EmpireBanner empireId={EMPIRE_POSITIONS.bottom} empire={e[EMPIRE_POSITIONS.bottom]} position="bottom" />
    </div>
  )
}

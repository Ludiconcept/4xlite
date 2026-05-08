import { useState } from 'react'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { ResourceIcon } from '../UI/ResourceIcons.jsx'

const TERRAIN_LABELS = {
  marais:   'Ma',
  plaine:   'P',
  desert:   'D',
  colline:  'C',
  montagne: 'Mo',
}

const TERRAIN_COLORS = {
  marais:   '#6b8f71',
  plaine:   '#4a7c3f',
  desert:   '#c8a84b',
  colline:  '#8b6914',
  montagne: '#6b7280',
}

function TileBackground({ terrain, isLac, hasVolcan }) {
  if (isLac) return <div className="absolute inset-0 rounded" style={{ background: '#bfdbfe' }} />
  if (hasVolcan) return <div className="absolute inset-0 rounded" style={{ background: '#fee2e2' }} />
  return null
}

export function Tile({ tile, size = 56, onClick, isSelected = false }) {
  const [hovered, setHovered] = useState(false)

  if (!tile) return null

  const { explored, owner, terrain, resource1, resource2, buildings,
          hasFleuve, isLac, hasVolcan, playerBuildingsPreserved } = tile

  // Couleurs selon propriétaire
  let borderColor = '#cbd5e1'
  let bgColor = '#e2e8f0'
  let ownerLabel = null

  if (!explored) {
    bgColor = '#e2e8f0'
    borderColor = '#cbd5e1'
  } else if (owner === 'player') {
    bgColor = '#eff6ff'
    borderColor = isSelected ? '#f59e0b' : '#2563eb'
  } else if (owner && EMPIRE_CONFIG[owner]) {
    const cfg = EMPIRE_CONFIG[owner]
    bgColor = cfg.colorLight
    borderColor = cfg.color
    ownerLabel = cfg.emoji
  } else {
    bgColor = '#f1f5f9'
    borderColor = '#94a3b8'
  }

  const terrainLabel = terrain ? TERRAIN_LABELS[terrain] : null
  const terrainColor = terrain ? TERRAIN_COLORS[terrain] : '#94a3b8'

  // Tooltip
  let tooltipParts = []
  if (!explored) tooltipParts.push('Inexplorée')
  else {
    if (terrain) tooltipParts.push(terrain.charAt(0).toUpperCase() + terrain.slice(1))
    if (isLac) tooltipParts.push('Lac')
    if (hasVolcan) tooltipParts.push('🌋 Volcan')
    if (hasFleuve) tooltipParts.push('🌊 Fleuve')
    if (owner === 'player') tooltipParts.push('Vous')
    else if (owner && EMPIRE_CONFIG[owner]) tooltipParts.push(EMPIRE_CONFIG[owner].name)
    if (resource1) tooltipParts.push(resource1.type)
    if (resource2) tooltipParts.push(resource2.type)
    if (buildings?.length) tooltipParts.push(buildings.join(', '))
  }

  const fontSize = Math.max(7, Math.floor(size * 0.17))
  const iconSize = Math.max(10, Math.floor(size * 0.22))
  const borderWidth = (owner === 'player' || (owner && EMPIRE_CONFIG[owner])) ? 2 : 1.5

  return (
    <div
      className="relative cursor-pointer select-none"
      style={{
        width: size, height: size,
        borderRadius: 5,
        border: `${borderWidth}px solid ${borderColor}`,
        background: bgColor,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        transition: 'border-color 0.15s',
        outline: isSelected ? `2px solid #f59e0b` : 'none',
        outlineOffset: 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(tile)}
    >
      {/* Fleuve — ligne bleue */}
      {hasFleuve && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <line x1={size/2} y1="0" x2={size/2} y2={size} stroke="#3b82f6" strokeWidth="2.5" opacity="0.5"/>
          </svg>
        </div>
      )}

      {/* Slot 1 — propriétaire (haut droite) */}
      <div style={{ gridColumn: 3, gridRow: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 2, fontSize: Math.floor(size * 0.18), lineHeight: 1, zIndex: 2 }}>
        {ownerLabel}
        {owner === 'player' && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb', marginTop: 2 }} />
        )}
      </div>

      {/* Slot 2 — ressource 1 (milieu gauche) */}
      <div style={{ gridColumn: 1, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {resource1 && explored && <ResourceIcon type={resource1.type} size={iconSize} />}
      </div>

      {/* Slot 3 — terrain (centre) */}
      <div style={{ gridColumn: 2, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {explored && terrainLabel && (
          <span style={{ fontSize, fontWeight: 600, color: owner === 'player' ? '#2563eb' : terrainColor }}>
            {terrainLabel}
          </span>
        )}
        {isLac && explored && <span style={{ fontSize: fontSize - 1 }}>🏞️</span>}
      </div>

      {/* Slot 4 — ressource 2 (milieu droite) */}
      <div style={{ gridColumn: 3, gridRow: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
        {resource2 && explored && <ResourceIcon type={resource2.type} size={iconSize} />}
      </div>

      {/* Slots 5-6-7 — bâtiments (bas) */}
      {buildings?.length > 0 && explored && (
        <>
          <div style={{ gridColumn: 1, gridRow: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 2, fontSize: fontSize - 1, zIndex: 2 }}>
            {BUILDING_ICONS[buildings[0]] || '🏗️'}
          </div>
          <div style={{ gridColumn: 2, gridRow: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 2, fontSize: fontSize - 1, zIndex: 2 }}>
            {buildings[1] ? (BUILDING_ICONS[buildings[1]] || '🏗️') : null}
          </div>
          <div style={{ gridColumn: 3, gridRow: 3, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 2, fontSize: fontSize - 1, zIndex: 2 }}>
            {buildings[2] ? (BUILDING_ICONS[buildings[2]] || '🏗️') : null}
          </div>
        </>
      )}

      {/* Bâtiments préservés (case ennemie ex-joueur) */}
      {playerBuildingsPreserved?.length > 0 && owner && owner !== 'player' && (
        <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 8, opacity: 0.5, zIndex: 2 }}>
          🔒
        </div>
      )}

      {/* Tooltip */}
      {hovered && tooltipParts.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 4px)', left: '50%',
          transform: 'translateX(-50%)', background: '#1e293b', color: 'white',
          fontSize: 10, padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap',
          zIndex: 100, pointerEvents: 'none', lineHeight: 1.4,
        }}>
          {tooltipParts.join(' — ')}
        </div>
      )}
    </div>
  )
}

const BUILDING_ICONS = {
  ferme:        '🏠',
  mine:         '⛏️',
  scierie:      '🪚',
  tourDeGuet:   '🗼',
  forteresse:   '🏰',
  palais:       '👑',
  marche:       '🏪',
  hopital:      '🏥',
  universite:   '🎓',
  ambassade:    '🤝',
  entrepot:     '📦',
  palaisMerveillesCorps:  '✨',
  palaisMerveillesGauche: '✨',
  palaismerveilles_droite:'✨',
}

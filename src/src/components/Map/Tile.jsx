import { useState, useRef, useEffect } from 'react'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { ResourceIcon } from '../UI/ResourceIcons.jsx'

// ── Constantes ────────────────────────────────────────────────
const TERRAIN_LABELS = { marais:'Ma', plaine:'P', desert:'D', colline:'C', montagne:'Mo', lac:'Lac' }
const TERRAIN_NAMES  = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne', lac:'Lac' }
const TERRAIN_ICONS  = { marais:'🌿', plaine:'🌾', desert:'🏜️', colline:'⛰️', montagne:'🏔️', lac:'🏞️' }
const TERRAIN_COLORS = { marais:'#4d7c5e', plaine:'#4a7c3f', desert:'#c8a84b', colline:'#8b6914', montagne:'#6b7280', lac:'#3b82f6' }

const TERRAIN_MODIFIERS = {
  lac:      ['Seul le Gibier peut être ajouté', 'Construction impossible sur ce terrain'],
  plaine:   ['Ferme gratuite (pas de matériaux)', 'Rendement agricole : 2 Fermes si innovation'],
  colline:  ['Ferme coûte 1 mat. (F, B ou A)', 'Culture en terrasse : 2 Fermes si innovation'],
  montagne: ['Culture en terrasse 2 : Ferme si innovation'],
  marais:   ['Maladie : -1 pop par Marais (sans Hôpital)', 'Drainage possible si innovation'],
  desert:   ['Irrigation possible si innovation'],
}

const RESOURCE_LABELS = {
  foret:'Forêt', gibier:'Gibier', bois:'Bois', argile:'Argile',
  fer:'Fer', or:'Or', nourriture:'Nourriture',
}
const RESOURCE_PRODUCES = {
  foret:'→ Bois (Fermier)', gibier:'→ Nourriture (Fermier)',
  bois:'→ Bois (Fermier)', argile:'→ Argile (Ouvrier)',
  fer:'→ Fer (Ouvrier)', or:'→ Or (Ouvrier)', nourriture:'→ Nourriture',
}
const RESOURCE_ICONS_EMOJI = { foret:'🌲', gibier:'🦌' }

const BUILDING_ICONS = {
  ferme:'🏠', mine:'⛏️', scierie:'🪚', tourDeGuet:'🗼', forteresse:'🏰',
  palais:'👑', marche:'🏪', hopital:'🏥', universite:'🎓', ambassade:'🤝',
  entrepot:'📦', palaisMerveillesCorps:'✨', palaisMerveillesGauche:'✨', palaismerveilles_droite:'✨',
}
const BUILDING_NAMES = {
  ferme:'Ferme', mine:'Mine', scierie:'Scierie', tourDeGuet:'Tour de guet',
  forteresse:'Forteresse', palais:'Palais', marche:'Marché', hopital:'Hôpital',
  universite:'Université', ambassade:'Ambassade', entrepot:'Entrepôt',
  palaisMerveillesCorps:'Palais des Merveilles — Corps',
  palaisMerveillesGauche:'Palais des Merveilles — Aile gauche',
  palaismerveilles_droite:'Palais des Merveilles — Aile droite',
}
const BUILDING_EFFECTS = {
  ferme:'Produit 1 Nourriture. +3 capacité pop. max. Gratuit en Plaine, coûte 1 Bois/Fer/Argile en Colline.',
  mine:'Chaque ressource Fer/Argile/Or sur la case produit +1.',
  scierie:'Chaque ressource Bois sur la case produit +1.',
  tourDeGuet:'+1 guerrier défensif. -1 perte si victoire en défense.',
  forteresse:'+3 guerriers défensifs. -1 perte si victoire en défense.',
  palais:'-1 Prêtre, -1 Noble (perdus définitivement). +1 Or par 5 cases à la récolte. 1 max.',
  marche:'Commerce amélioré : 1 Or = 2 ressources.',
  hopital:'Débloque l\'action Soigner.',
  universite:'Débloque l\'action Former.',
  ambassade:'Débloque l\'action Diplomatie contre cet empire.',
  entrepot:'+4 emplacements de stockage.',
  palaisMerveillesCorps:'3 dés d\'action au lieu de 4.',
  palaisMerveillesGauche:'Gibier réservé aux Nobles. Conversion G/P/A → Nobles gratuite.',
  palaismerveilles_droite:'+1 Noble gratuit par tour.',
}

// ── CSS d'animation pour les cases valides ────────────────────
const PULSE_STYLE = `
@keyframes validPulse {
  0%, 100% { box-shadow: 0 0 0 2px #f59e0b, 0 0 0 4px rgba(245,158,11,.3); }
  50%       { box-shadow: 0 0 0 3px #f59e0b, 0 0 0 7px rgba(245,158,11,.5); }
}
@keyframes validPulseBlue {
  0%, 100% { box-shadow: 0 0 0 2px #2563eb, 0 0 0 4px rgba(37,99,235,.3); }
  50%       { box-shadow: 0 0 0 3px #2563eb, 0 0 0 7px rgba(37,99,235,.5); }
}
`

// Injecter le CSS une seule fois
if (typeof document !== 'undefined' && !document.getElementById('tile-pulse-style')) {
  const style = document.createElement('style')
  style.id = 'tile-pulse-style'
  style.textContent = PULSE_STYLE
  document.head.appendChild(style)
}

// ── Icône ressource sur la case ───────────────────────────────
function TileResourceIcon({ type, size }) {
  if (type === 'foret') return <span style={{ fontSize:size*0.75, lineHeight:1 }}>🌲</span>
  if (type === 'gibier') return <span style={{ fontSize:size*0.75, lineHeight:1 }}>🦌</span>
  return <ResourceIcon type={type} size={size} />
}

// ── Tooltip compact (survol ~0.5s) ────────────────────────────
function CompactTooltip({ tile }) {
  const { terrain, resource1, resource2, buildings, hasFleuve, fleuveVertical, isLac, hasVolcan } = tile
  const parts = []
  if (isLac) parts.push('Lac 🏞️')
  else if (terrain) parts.push(`${TERRAIN_ICONS[terrain]} ${TERRAIN_NAMES[terrain]}`)
  if (hasVolcan) parts.push('🌋 Volcan')
  if (hasFleuve) parts.push(fleuveVertical ? '🌊 Fleuve ↕' : '🌊 Fleuve ↔')
  if (resource1) parts.push(RESOURCE_LABELS[resource1.type])
  if (resource2) parts.push(RESOURCE_LABELS[resource2.type])
  if (buildings?.length) parts.push(`${buildings.length} bât.`)

  return (
    <div style={{
      position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)',
      background:'#1e293b', color:'white', fontSize:10, padding:'5px 9px', borderRadius:6,
      whiteSpace:'nowrap', zIndex:500, pointerEvents:'none', lineHeight:1.5,
    }}>
      {parts.join(' · ')}
      <div style={{ fontSize:9, color:'rgba(255,255,255,.5)', marginTop:1 }}>Clic = détails complets</div>
    </div>
  )
}

// ── Tooltip complet (clic) ────────────────────────────────────
function FullTooltip({ tile, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    // Délai pour éviter que le clic qui ouvre ferme aussitôt
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  const { row, col, terrain, resource1, resource2, buildings, hasFleuve, fleuveVertical,
          isLac, hasVolcan, owner, explored } = tile

  const ownerCfg = owner && owner !== 'player' ? EMPIRE_CONFIG[owner] : null
  const terrainName = terrain ? TERRAIN_NAMES[terrain] : '—'
  const terrainIcon = terrain ? TERRAIN_ICONS[terrain] : '?'
  const mods = terrain ? (TERRAIN_MODIFIERS[terrain] || []) : []
  const resources = [resource1, resource2].filter(Boolean)

  let headerBg = '#f8fafc', headerBorder = '#e2e8f0', headerText = '#334155'
  let ownerLabel = null
  if (owner === 'player') {
    headerBg='#eff6ff'; headerBorder='#bfdbfe'; headerText='#1e40af'
    ownerLabel=<span style={{ fontSize:10, background:'#dbeafe', color:'#1e40af', padding:'2px 7px', borderRadius:8, fontWeight:500 }}>Vous</span>
  } else if (ownerCfg) {
    headerBg=ownerCfg.colorLight; headerBorder=`${ownerCfg.color}40`; headerText=ownerCfg.colorText
    ownerLabel=<span style={{ fontSize:10, background:`${ownerCfg.color}20`, color:ownerCfg.colorText, padding:'2px 7px', borderRadius:8, fontWeight:500 }}>{ownerCfg.emoji} {ownerCfg.name}</span>
  }

  const activeEffects = []
  if (hasFleuve) activeEffects.push({ icon:'🌊', text:`Fleuve — Marins ×2 (${fleuveVertical?'↕ vertical':'↔ horizontal'})` })
  if (hasVolcan) activeEffects.push({ icon:'🌋', text:'Volcan — Ferme = 3 Nourriture. Risque d\'éruption.' })
  // lac is now a terrain type - its restrictions appear in TERRAIN_MODIFIERS

  // Positionner en bas si la case est dans les 2 premières lignes
  const posAbove = tile.row >= 2
  return (
    <div ref={ref} style={{
      position:'absolute',
      ...(posAbove
        ? { bottom:'calc(100% + 8px)' }
        : { top:'calc(100% + 8px)' }),
      left:'50%', transform:'translateX(-50%)',
      width:230, zIndex:1000,
      background:'white', border:'0.5px solid #e2e8f0',
      borderRadius:10, overflow:'hidden',
      boxShadow:'0 4px 20px rgba(0,0,0,.15)',
      pointerEvents:'auto',
    }}>
      {/* Header */}
      <div style={{ background:headerBg, borderBottom:`0.5px solid ${headerBorder}`, padding:'7px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:16 }}>{terrainIcon}</span>
          <span style={{ fontSize:13, fontWeight:500, color:headerText }}>{terrainName}</span>
          <span style={{ fontSize:10, color:'#94a3b8' }}>({col+1},{row+1})</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {ownerLabel}
          <button onClick={e=>{e.stopPropagation();onClose()}} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:14, lineHeight:1, padding:0 }}>✕</button>
        </div>
      </div>

      {!explored ? (
        <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:8, color:'#94a3b8' }}>
          <span style={{ fontSize:16 }}>👁️</span>
          <span style={{ fontSize:12 }}>Case inexplorée. Explorez-la pour révéler son contenu.</span>
        </div>
      ) : (<>
        {/* Modificateurs terrain */}
        {mods.length > 0 && (
          <div style={{ padding:'5px 10px', borderBottom:'0.5px solid #f1f5f9', display:'flex', gap:4, flexWrap:'wrap' }}>
            {mods.map((m,i) => (
              <span key={i} style={{ fontSize:10, background:'#f0fdf4', color:'#166534', padding:'2px 7px', borderRadius:8 }}>{m}</span>
            ))}
          </div>
        )}
        {/* Ressources */}
        <div style={{ padding:'7px 10px', borderBottom:'0.5px solid #f1f5f9' }}>
          <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Ressources</div>
          {resources.length === 0
            ? <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>Aucune</span>
            : <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {resources.map((r,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {RESOURCE_ICONS_EMOJI[r.type]
                      ? <span style={{ fontSize:14 }}>{RESOURCE_ICONS_EMOJI[r.type]}</span>
                      : <ResourceIcon type={r.type} size={16}/>
                    }
                    <span style={{ fontSize:11, fontWeight:500, color:'#1e293b' }}>{RESOURCE_LABELS[r.type]}</span>
                    <span style={{ fontSize:10, color:'#94a3b8' }}>{RESOURCE_PRODUCES[r.type]}</span>
                  </div>
                ))}
              </div>
          }
        </div>
        {/* Bâtiments */}
        <div style={{ padding:'7px 10px', borderBottom:'0.5px solid #f1f5f9' }}>
          <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Bâtiments</div>
          {!buildings?.length
            ? <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>Aucun — 3 emplacements libres</span>
            : <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {buildings.map((b,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                    <span style={{ fontSize:14 }}>{BUILDING_ICONS[b]||'🏗️'}</span>
                    <div>
                      <div style={{ fontSize:11, fontWeight:500, color:'#1e293b' }}>{BUILDING_NAMES[b]||b}</div>
                      <div style={{ fontSize:10, color:'#64748b', lineHeight:1.4 }}>{BUILDING_EFFECTS[b]||''}</div>
                    </div>
                  </div>
                ))}
                {buildings.length < 3 && (
                  <div style={{ fontSize:10, color:'#94a3b8', fontStyle:'italic' }}>
                    {3-buildings.length} emplacement{3-buildings.length>1?'s':''} libre{3-buildings.length>1?'s':''}
                  </div>
                )}
              </div>
          }
        </div>
        {/* Effets actifs */}
        {(activeEffects.length > 0) && (
          <div style={{ padding:'7px 10px' }}>
            <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 }}>Effets actifs</div>
            {activeEffects.map((e,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:5, marginBottom:3 }}>
                <span style={{ fontSize:12, marginTop:1 }}>{e.icon}</span>
                <span style={{ fontSize:11, color:'#475569', lineHeight:1.4 }}>{e.text}</span>
              </div>
            ))}
          </div>
        )}
        {activeEffects.length === 0 && !buildings?.length && resources.length === 0 && (
          <div style={{ padding:'7px 10px' }}>
            <span style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>Aucun effet actif.</span>
          </div>
        )}
      </>)}
    </div>
  )
}

// ── Composant Tile principal ───────────────────────────────────
export function Tile({
  tile, size = 56,
  onClick,        // callback externe (setup) — si fourni, désactive les tooltips clic
  onHover,        // callback hover externe
  isSelected = false,
  isHighlighted = false,  // case valide pour une action (surbrillance forte)
  isClickable = false,    // case cliquable pour placement curiosité
}) {
  const [showCompact, setShowCompact] = useState(false)
  const [showFull, setShowFull]       = useState(false)
  const hoverTimer = useRef(null)

  if (!tile) return null

  const { explored, owner, terrain, resource1, resource2, buildings,
          hasFleuve, fleuveVertical, isLac, hasVolcan } = tile

  // ── Couleurs de base ──
  let borderColor = '#cbd5e1', bgColor = '#e2e8f0', ownerLabel = null
  if (!explored) {
    bgColor = '#e2e8f0'; borderColor = '#cbd5e1'
  } else if (owner === 'player') {
    bgColor = '#eff6ff'; borderColor = '#2563eb'
  } else if (owner && EMPIRE_CONFIG[owner]) {
    const cfg = EMPIRE_CONFIG[owner]
    bgColor = cfg.colorLight; borderColor = cfg.color; ownerLabel = cfg.emoji
  } else {
    bgColor = '#f1f5f9'; borderColor = '#94a3b8'
  }
  if (isLac && explored)    bgColor = '#dbeafe'
  if (hasVolcan && explored) bgColor = '#fee2e2'

  const borderWidth = (owner==='player' || (owner&&EMPIRE_CONFIG[owner]) || isSelected || isHighlighted || isClickable) ? 2 : 1.5
  const fontSize    = Math.max(7, Math.floor(size * 0.16))
  const iconSize    = Math.max(10, Math.floor(size * 0.22))
  const terrainLabel = terrain ? TERRAIN_LABELS[terrain] : null
  const terrainColor = terrain ? TERRAIN_COLORS[terrain] : '#94a3b8'

  // ── Style case valide (isHighlighted) — très visible pour daltoniens ──
  // Fond rayé diagonal blanc/jaune + contour épais animé
  const highlightStyle = isHighlighted ? {
    background: 'repeating-linear-gradient(45deg, #fef9c3 0px, #fef9c3 4px, #fde68a 4px, #fde68a 8px)',
    borderColor: '#f59e0b',
    animation: 'validPulse 1.2s ease-in-out infinite',
    cursor: 'crosshair',
  } : {}

  const clickableStyle = isClickable ? {
    borderColor: '#f59e0b',
    animation: 'validPulse 1.2s ease-in-out infinite',
    cursor: 'crosshair',
  } : {}

  const selectedStyle = isSelected ? {
    borderColor: '#f59e0b',
    outline: '3px solid #f59e0b',
    outlineOffset: 2,
  } : {}

  function handleMouseEnter() {
    onHover?.(tile)
    hoverTimer.current = setTimeout(() => {
      if (!showFull) setShowCompact(true)
    }, 500)
  }
  function handleMouseLeave() {
    clearTimeout(hoverTimer.current)
    setShowCompact(false)
  }
  function handleClick(e) {
    e.stopPropagation()
    clearTimeout(hoverTimer.current)
    setShowCompact(false)

    // Si callback externe fourni (setup), on délègue sans ouvrir le tooltip
    if (onClick) {
      onClick(tile)
      return
    }
    // En jeu : toggle tooltip complet
    setShowFull(v => !v)
  }

  return (
    <div
      style={{
        width: size, height: size, borderRadius: 5,
        border: `${borderWidth}px solid ${borderColor}`,
        background: bgColor,
        position: 'relative',
        cursor: (isHighlighted || isClickable) ? 'crosshair' : 'pointer',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        transition: 'border-color 0.15s',
        overflow: 'visible',
        ...highlightStyle,
        ...clickableStyle,
        ...selectedStyle,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Fleuve — uniquement sur cases explorées
          hasFleuve peut être true + fleuveVertical = true/false (1 fleuve)
          ou hasFleuve + fleuveHorizontal si 2 fleuves se croisent */}
      {hasFleuve && explored && (
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Fleuve principal */}
            {fleuveVertical
              ? <line x1={size/2} y1="0" x2={size/2} y2={size} stroke="#3b82f6" strokeWidth="2.5" opacity="0.6"/>
              : <line x1="0" y1={size/2} x2={size} y2={size/2} stroke="#3b82f6" strokeWidth="2.5" opacity="0.6"/>
            }
            {/* 2e fleuve si croisement (fleuveVertical XOR fleuveHorizontal) */}
            {tile.hasFleuve2 && (
              tile.fleuve2Vertical
                ? <line x1={size/2} y1="0" x2={size/2} y2={size} stroke="#60a5fa" strokeWidth="2" opacity="0.5"/>
                : <line x1="0" y1={size/2} x2={size} y2={size/2} stroke="#60a5fa" strokeWidth="2" opacity="0.5"/>
            )}
          </svg>
        </div>
      )}

      {/* Slot 1 — propriétaire haut droite */}
      <div style={{ gridColumn:3, gridRow:1, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:2, fontSize:Math.floor(size*0.18), lineHeight:1, zIndex:2 }}>
        {ownerLabel}
        {owner==='player' && <div style={{ width:7, height:7, borderRadius:'50%', background:'#2563eb', marginTop:2 }}/>}
      </div>

      {/* Slot 2 — ressource 1 */}
      <div style={{ gridColumn:1, gridRow:2, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
        {resource1 && explored && <TileResourceIcon type={resource1.type} size={iconSize}/>}
      </div>

      {/* Slot 3 — terrain centre */}
      <div style={{ gridColumn:2, gridRow:2, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
        {explored && terrainLabel && (
          <span style={{ fontSize, fontWeight:600, color: owner==='player'?'#2563eb':terrainColor }}>
            {terrainLabel}
          </span>
        )}
      </div>

      {/* Slot 4 — ressource 2 */}
      <div style={{ gridColumn:3, gridRow:2, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
        {resource2 && explored && <TileResourceIcon type={resource2.type} size={iconSize}/>}
      </div>

      {/* Volcan */}
      {hasVolcan && explored && (
        <div style={{ position:'absolute', top:1, left:2, fontSize:Math.floor(size*0.2), zIndex:3, lineHeight:1 }}>🌋</div>
      )}

      {/* Bâtiments */}
      {buildings?.length > 0 && explored && (
        <>
          <div style={{ gridColumn:1, gridRow:3, display:'flex', alignItems:'flex-end', justifyContent:'flex-start', padding:2, fontSize:fontSize-1, zIndex:2 }}>{BUILDING_ICONS[buildings[0]]||'🏗️'}</div>
          <div style={{ gridColumn:2, gridRow:3, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:2, fontSize:fontSize-1, zIndex:2 }}>{buildings[1]?(BUILDING_ICONS[buildings[1]]||'🏗️'):null}</div>
          <div style={{ gridColumn:3, gridRow:3, display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:2, fontSize:fontSize-1, zIndex:2 }}>{buildings[2]?(BUILDING_ICONS[buildings[2]]||'🏗️'):null}</div>
        </>
      )}

      {/* Bâtiments préservés */}
      {tile.playerBuildingsPreserved?.length > 0 && owner && owner!=='player' && (
        <div style={{ position:'absolute', bottom:2, right:2, fontSize:8, opacity:0.5, zIndex:2 }}>🔒</div>
      )}

      {/* Tooltip compact au survol */}
      {showCompact && !showFull && explored && <CompactTooltip tile={tile} />}

      {/* Tooltip complet au clic */}
      {showFull && <FullTooltip tile={tile} onClose={() => setShowFull(false)} />}
    </div>
  )
}

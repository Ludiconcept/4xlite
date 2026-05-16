import { useState } from 'react'
import { INNOVATIONS_MAP } from '../../data/innovations.js'

const TYPE_COLORS = {
  A: { bg:'#fef3c7', color:'#92400e', border:'#f59e0b', label:'Artisan' },
  N: { bg:'#dbeafe', color:'#1e40af', border:'#3b82f6', label:'Noble' },
  P: { bg:'#ede9fe', color:'#5b21b6', border:'#7c3aed', label:'Prêtre' },
}

export default function InnovationCard({ innov, state, jetons, dispo, blocPar, arbreColor, arbreBg, arbreBorder, onCocher }) {
  const [hovered, setHovered] = useState(null)

  const { checked, unlocked } = state

  // Construire la liste ordonnée des cases à cocher
  const cases = []
  for (const [type, count] of Object.entries(innov.cout)) {
    for (let i = 0; i < count; i++) {
      cases.push(type)
    }
  }

  const peutCocher = (idx) => {
    if (!dispo || unlocked) return false
    if (idx !== checked) return false // doivent être cochées dans l'ordre
    const type = cases[idx]
    return (jetons[type] || 0) > 0
  }

  const containerStyle = {
    borderRadius:10,
    border: `1.5px solid ${unlocked ? arbreBorder : dispo ? '#e2e8f0' : '#f1f5f9'}`,
    background: unlocked ? arbreBg : dispo ? 'white' : '#f8fafc',
    opacity: dispo ? 1 : 0.6,
    transition:'all .15s',
    overflow:'hidden',
  }

  return (
    <div style={containerStyle}>
      {/* Bande top si débloquée */}
      {unlocked && (
        <div style={{ background:arbreColor, padding:'2px 10px', fontSize:10, color:'white', fontWeight:600, letterSpacing:'.06em' }}>
          ✓ DÉBLOQUÉE
        </div>
      )}

      <div style={{ padding:'10px 12px' }}>
        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:6 }}>
          <span style={{ fontSize:20 }}>{innov.emoji}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:13, color: unlocked ? arbreColor : '#1e293b' }}>{innov.nom}</div>
            <div style={{ fontSize:11, color:'#64748b', lineHeight:1.4, marginTop:2 }}>{innov.effetCourt}</div>
          </div>
          {innov.conditions.length > 0 && !unlocked && (
            <div style={{ fontSize:10, color:blocPar.length > 0 ? '#dc2626' : '#16a34a',
              background: blocPar.length > 0 ? '#fef2f2' : '#f0fdf4',
              padding:'2px 6px', borderRadius:6, whiteSpace:'nowrap', flexShrink:0 }}>
              {blocPar.length > 0 ? '🔒 Condition manquante' : '✓ Conditions OK'}
            </div>
          )}
        </div>

        {/* Cases à cocher */}
        {!unlocked && dispo && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:6 }}>
            {cases.map((type, idx) => {
              const tc = TYPE_COLORS[type]
              const isChecked = idx < checked
              const isNext    = idx === checked
              const canCheck  = peutCocher(idx)
              return (
                <button
                  key={idx}
                  onClick={() => canCheck && onCocher(innov.id, type)}
                  onMouseEnter={() => setHovered(idx)}
                  onMouseLeave={() => setHovered(null)}
                  title={`${tc.label}${canCheck ? '' : ' (pas de jeton)'}`}
                  style={{
                    width:22, height:22, borderRadius:5,
                    border: `1.5px solid ${isChecked ? tc.border : isNext && canCheck ? tc.border : '#e2e8f0'}`,
                    background: isChecked ? tc.color : isNext && canCheck ? tc.bg : '#f8fafc',
                    color: isChecked ? 'white' : tc.color,
                    cursor: canCheck ? 'pointer' : 'default',
                    fontSize:11, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .1s',
                    transform: hovered === idx && canCheck ? 'scale(1.15)' : 'scale(1)',
                    opacity: isNext || isChecked ? 1 : 0.4,
                  }}
                >
                  {isChecked ? '✓' : type}
                </button>
              )
            })}
            <span style={{ fontSize:10, color:'#94a3b8', alignSelf:'center', marginLeft:4 }}>
              {checked}/{innov.total}
            </span>
          </div>
        )}

        {/* Conditions manquantes */}
        {blocPar.length > 0 && (
          <div style={{ marginTop:6, fontSize:10, color:'#94a3b8' }}>
            Requiert : {blocPar.map(id => INNOVATIONS_MAP[id]?.nom || id).join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}

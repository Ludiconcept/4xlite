import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

const POP_TYPES = [
  { key: 'artisan', label: 'Artisans', token: 'A', emoji: '🏺', color: '#92400e', bg: '#fef3c7', border: '#f59e0b' },
  { key: 'noble',   label: 'Nobles',   token: 'N', emoji: '👑', color: '#1e40af', bg: '#dbeafe', border: '#3b82f6' },
  { key: 'pretre',  label: 'Prêtres',  token: 'P', emoji: '✝️', color: '#5b21b6', bg: '#ede9fe', border: '#7c3aed' },
]

export function ActionEtudier({ onClose, onMarkUsed, onOpenInnovations }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const [chosen, setChosen] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  const population = game?.population || {}

  function confirmer() {
    if (!chosen) return
    const pt = POP_TYPES.find(p => p.key === chosen)
    const nb = population[chosen] || 0
    if (nb <= 0) return

    // Ajouter les jetons
    updateGame(g => ({
      ...g,
      jetons: {
        ...g.jetons,
        [pt.token]: (g.jetons?.[pt.token] || 0) + nb,
      },
    }))

    setConfirmed(true)
    onMarkUsed?.()
  }

  if (confirmed) {
    const pt = POP_TYPES.find(p => p.key === chosen)
    const nb = population[chosen] || 0
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'4px 0' }}>
        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px', fontSize:13, color:'#166534', textAlign:'center' }}>
          +{nb} jeton{nb>1?'s':''} <strong>{pt.label}</strong> ({pt.token}) ajouté{nb>1?'s':''}
        </div>
        <button onClick={() => { onClose(); onOpenInnovations?.() }}
          style={{ padding:'11px', borderRadius:9, border:'none', background:'#1e3a5f', color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Ouvrir les Innovations →
        </button>
        <button onClick={onClose}
          style={{ padding:'9px', borderRadius:9, border:'1px solid #e2e8f0', background:'white', color:'#374151', fontSize:12, cursor:'pointer' }}>
          Fermer
        </button>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'4px 0' }}>
      <p style={{ fontSize:13, color:'#475569', margin:0, lineHeight:1.5 }}>
        Choisissez une population pour générer des jetons Innovation égaux à leur nombre.
      </p>
      {POP_TYPES.map(pt => {
        const nb = population[pt.key] || 0
        const isSel = chosen === pt.key
        return (
          <button key={pt.key} onClick={() => nb > 0 && setChosen(pt.key)}
            disabled={nb === 0}
            style={{
              padding:'12px 14px', borderRadius:10,
              border: `2px solid ${isSel ? pt.border : '#e2e8f0'}`,
              background: isSel ? pt.bg : nb === 0 ? '#f8fafc' : 'white',
              cursor: nb > 0 ? 'pointer' : 'default',
              opacity: nb === 0 ? 0.4 : 1,
              display:'flex', alignItems:'center', gap:10, textAlign:'left',
              transition:'all .15s',
            }}>
            <span style={{ fontSize:22 }}>{pt.emoji}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13, color: isSel ? pt.color : '#1e293b' }}>{pt.label}</div>
              <div style={{ fontSize:12, color:'#64748b' }}>{nb} {pt.label.toLowerCase()} → {nb} jeton{nb>1?'s':''} {pt.token}</div>
            </div>
            <div style={{ background: isSel ? pt.color : '#f1f5f9', color: isSel ? 'white' : '#64748b',
              borderRadius:8, padding:'3px 10px', fontSize:13, fontWeight:700 }}>
              {pt.token}×{nb}
            </div>
          </button>
        )
      })}
      <button onClick={confirmer} disabled={!chosen}
        style={{ padding:'11px', borderRadius:9, border:'none',
          background: chosen ? '#1e3a5f' : '#e2e8f0', color:'white',
          fontSize:13, fontWeight:600, cursor: chosen ? 'pointer' : 'default', marginTop:4 }}>
        Confirmer →
      </button>
    </div>
  )
}

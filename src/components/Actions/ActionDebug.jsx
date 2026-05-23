// ⚠️ DEBUG ONLY — Supprimer avant production
// Pour supprimer : retirer ce fichier + retirer import + cas 'debug' dans ActionPanel
// + retirer entrée dans ACTION_CFG + retirer l'action dans la liste des actions dé=6

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

const RESSOURCES = [
  { key: 'nourriture', label: 'Nourriture', emoji: '🌾' },
  { key: 'bois',       label: 'Bois',       emoji: '🪵' },
  { key: 'argile',     label: 'Argile',      emoji: '🏺' },
  { key: 'fer',        label: 'Fer',         emoji: '⚙️' },
  { key: 'or',         label: 'Or',          emoji: '💰' },
]
const JETONS = ['A', 'N', 'P']
const POP = [
  { key:'fermier', label:'Fermier' }, { key:'ouvrier', label:'Ouvrier' },
  { key:'artisan', label:'Artisan' }, { key:'guerrier', label:'Guerrier' },
  { key:'pretre',  label:'Prêtre'  }, { key:'noble',    label:'Noble'   },
]

export function ActionDebug({ onClose, onMarkUsed }) {
  const updateGame = useGameStore(s => s.updateGame)
  const game       = useGameStore(s => s.game)
  const [qty, setQty] = useState(5)
  const [done, setDone] = useState([])

  function addRes(key) {
    updateGame(g => ({ ...g, resources: { ...g.resources, [key]: (g.resources?.[key] || 0) + qty } }))
    setDone(d => [...d, `+${qty} ${key}`])
  }
  function addPop(key) {
    updateGame(g => ({ ...g, population: { ...g.population, [key]: (g.population?.[key] || 0) + qty } }))
    setDone(d => [...d, `+${qty} ${key}`])
  }
  function addJeton(t) {
    updateGame(g => ({ ...g, jetons: { ...g.jetons, [t]: (g.jetons?.[t] || 0) + qty } }))
    setDone(d => [...d, `+${qty} jeton ${t}`])
  }
  function addPower() {
    updateGame(g => {
      const ne = { ...g.empires }
      for (let i = 1; i <= 4; i++) if (ne[i]) ne[i] = { ...ne[i], power: Math.min(ne[i].power + qty, ne[i].maxPower) }
      return { ...g, empires: ne }
    })
    setDone(d => [...d, `+${qty} puissance tous empires`])
  }

  const btn = (label, onClick, color='#1e3a5f', key=label) => (
    <button key={key} onClick={onClick} style={{ padding:'6px 10px', borderRadius:7, border:'none',
      background:color, color:'white', cursor:'pointer', fontSize:12, fontWeight:500 }}>
      {label}
    </button>
  )

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:950,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', borderRadius:14, width:'100%', maxWidth:420,
        boxShadow:'0 16px 48px rgba(0,0,0,.3)', padding:'20px', display:'flex', flexDirection:'column', gap:12 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontWeight:700, fontSize:15, color:'#dc2626' }}>🐞 Debug — Ajouter des ressources</div>
          <button onClick={() => { onMarkUsed?.(); onClose() }}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#94a3b8' }}>✕</button>
        </div>

        {/* Quantité */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'#64748b' }}>Quantité :</span>
          {[1, 5, 10, 20].map(n => (
            <button key={n} onClick={() => setQty(n)}
              style={{ padding:'4px 10px', borderRadius:6, border:'none',
                background: qty===n ? '#1e3a5f' : '#f1f5f9', color: qty===n ? 'white' : '#374151',
                cursor:'pointer', fontSize:12, fontWeight:600 }}>
              {n}
            </button>
          ))}
        </div>

        {/* Ressources */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Ressources</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {RESSOURCES.map(r => btn(`${r.emoji} +${qty} ${r.label}`, () => addRes(r.key), '#0369a1', r.key))}
          </div>
        </div>

        {/* Jetons */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Jetons Innovation</div>
          <div style={{ display:'flex', gap:6 }}>
            {JETONS.map(t => btn(`+${qty} jeton ${t}`, () => addJeton(t), '#7c3aed', t))}
          </div>
        </div>

        {/* Population */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Population</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {POP.map(p => btn(`+${qty} ${p.label}`, () => addPop(p.key), '#16a34a', p.key))}
          </div>
        </div>

        {/* Empire */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>Empires</div>
          {btn(`+${qty} Puissance (tous)`, addPower, '#dc2626')}
        </div>

        {/* Log actions */}
        {done.length > 0 && (
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8,
            padding:'8px 12px', fontSize:11, color:'#166534', maxHeight:80, overflowY:'auto' }}>
            {done.slice(-8).map((d,i) => <div key={i}>✓ {d}</div>)}
          </div>
        )}
      </div>
    </div>
  )
}

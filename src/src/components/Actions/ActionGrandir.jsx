import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'

const POP_TYPES = [
  { key:'fermier',  label:'Fermier',  emoji:'🧑‍🌾', role:'Récolte Nourriture et Bois' },
  { key:'ouvrier',  label:'Ouvrier',  emoji:'👷',   role:'Récolte Or, Fer, Argile' },
  { key:'artisan',  label:'Artisan',  emoji:'🛠️',   role:'Commerce et Innovations' },
  { key:'guerrier', label:'Guerrier', emoji:'⚔️',   role:'Attaque, explore, défend' },
  { key:'pretre',   label:'Prêtre',   emoji:'⛪',   role:'Innovations Religion & Admin.' },
  { key:'noble',    label:'Noble',    emoji:'👑',   role:'Innovations Guerre & Admin.' },
]

export function ActionGrandir({ onClose, onMarkUsed }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)
  const [chosen, setChosen] = useState(null)

  if (!game) return null

  const popTotal    = Object.values(game.population).reduce((a, b) => a + b, 0)
  const playerTiles = game.map.flat().filter(t => t.owner === 'player').length
  const farms       = game.map.flat().filter(t => t.owner === 'player' && t.buildings?.includes('ferme'))
    .reduce((s, t) => s + t.buildings.filter(b => b === 'ferme').length, 0)
  const popMax  = playerTiles * 5 + farms * 3
  const atCap   = popMax > 0 && popTotal >= popMax

  function confirmer() {
    if (!chosen) return
    updateGame(g => ({
      ...g,
      population: { ...g.population, [chosen]: (g.population[chosen] || 0) + 1 }
    }))
    const type = POP_TYPES.find(p => p.key === chosen)
    addEntry(`Population +1 ${type.emoji} ${type.label}`, game.turn)
    onMarkUsed?.()
    onClose()
  }

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:16, width:280, display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:15, color:'#1e293b' }}>👶 Grandir</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
      </div>

      <p style={{ fontSize:13, color:'#475569', lineHeight:1.5 }}>
        Ajoutez 1 population de votre choix.
        {atCap && <span style={{ color:'#f59e0b', fontWeight:500 }}> Population au maximum — ce nouveau membre coûtera 1 Nourriture/tour.</span>}
      </p>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {POP_TYPES.map(({ key, label, emoji, role }) => (
          <button key={key} onClick={() => setChosen(chosen === key ? null : key)} style={{
            display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
            borderRadius:8, border: chosen === key ? '2px solid #be185d' : '1.5px solid #e2e8f0',
            background: chosen === key ? '#fdf2f8' : 'white', cursor:'pointer', textAlign:'left',
          }}>
            <span style={{ fontSize:20 }}>{emoji}</span>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color: chosen === key ? '#be185d' : '#374151' }}>
                {label} <span style={{ fontWeight:400, color:'#94a3b8' }}>(actuel : {game.population[key] || 0})</span>
              </div>
              <div style={{ fontSize:11, color:'#64748b' }}>{role}</div>
            </div>
          </button>
        ))}
      </div>

      <button onClick={confirmer} disabled={!chosen} style={{
        padding:'9px 0', background: chosen ? '#be185d' : '#e2e8f0',
        color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13,
        cursor: chosen ? 'pointer' : 'default',
      }}>
        Confirmer
      </button>
    </div>
  )
}

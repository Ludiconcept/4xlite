import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'

const POP_TYPES = [
  { key:'fermier',  label:'Fermier',  color:'#78716c', role:'Récolte Nourriture et Bois' },
  { key:'ouvrier',  label:'Ouvrier',  color:'#64748b', role:'Récolte Or, Fer, Argile' },
  { key:'artisan',  label:'Artisan',  color:'#d97706', role:'Commerce et Innovations' },
  { key:'guerrier', label:'Guerrier', color:'#dc2626', role:'Attaque, explore, défend' },
  { key:'pretre',   label:'Prêtre',   color:'#7c3aed', role:'Innovations Religion & Admin.' },
  { key:'noble',    label:'Noble',    color:'#0369a1', role:'Innovations Guerre & Admin.' },
]

const POP_PER_TILE = 10
const POP_PER_FARM = 5

export function PopulationPanel() {
  const game = useGameStore(s => s.game)
  const [showTooltip, setShowTooltip] = useState(false)

  if (!game) return null

  const { population, map } = game
  const playerTiles = map?.flat().filter(t => t.owner === 'player').length ?? 0
  const farms = map?.flat()
    .filter(t => t.owner === 'player' && t.buildings?.includes('ferme'))
    .reduce((sum, t) => sum + t.buildings.filter(b => b === 'ferme').length, 0) ?? 0
  const popMax = playerTiles * POP_PER_TILE + farms * POP_PER_FARM
  const popTotal = Object.values(population).reduce((a, b) => a + b, 0)
  const isOvercrowded = popTotal > popMax && popMax > 0

  return (
    <div style={{ width:118, background:'white', borderRight:'0.5px solid #e2e8f0', padding:'10px 8px', display:'flex', flexDirection:'column', gap:6, flexShrink:0, overflowY:'auto', overflowX:'visible', position:'relative', zIndex:10 }}>
      <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>
        Population
      </div>

      {POP_TYPES.map(({ key, label, color, role }) => (
        <div key={key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'2px 0' }}
          title={role}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'#334155' }}>{label}</span>
          </div>
          <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{population[key] ?? 0}</span>
        </div>
      ))}

      {/* Total + infobulle */}
      <div style={{ marginTop:4, paddingTop:6, borderTop:'0.5px solid #e2e8f0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#64748b' }}>
          <span>Total</span>
          <span style={{ fontWeight:500, color: isOvercrowded ? '#dc2626' : '#1e293b' }}>
            {popTotal} / {popMax || '—'}
          </span>
        </div>

        {/* Ligne "Cap. max" avec bouton ? */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:11, color:'#94a3b8', position:'relative' }}>
          <span>Cap. max</span>
          {/* Bouton ? avec tooltip qui s'affiche par-dessus la carte */}
          <div style={{ position:'relative' }}>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                width:14, height:14, borderRadius:'50%', background:'#f1f5f9',
                border:'0.5px solid #cbd5e1', display:'inline-flex', alignItems:'center',
                justifyContent:'center', fontSize:9, color:'#64748b', cursor:'help',
                flexShrink:0,
              }}
            >?</button>

            {/* Tooltip — z-index élevé pour passer par-dessus la carte */}
            {showTooltip && (
              <div style={{
                position:'fixed',
                // On calcule approximativement la position
                left:130,
                top:'auto',
                marginTop:-40,
                background:'#1e293b', color:'white', fontSize:11,
                padding:'8px 10px', borderRadius:7, whiteSpace:'nowrap',
                zIndex:9999, pointerEvents:'none', lineHeight:1.6,
                boxShadow:'0 4px 12px rgba(0,0,0,.2)',
              }}>
                <div style={{ fontWeight:500, marginBottom:3 }}>Calcul de la capacité max</div>
                <div>Cases contrôlées × {POP_PER_TILE} = {playerTiles} × {POP_PER_TILE} = {playerTiles * POP_PER_TILE}</div>
                <div>Fermes construites × {POP_PER_FARM} = {farms} × {POP_PER_FARM} = {farms * POP_PER_FARM}</div>
                <div style={{ borderTop:'0.5px solid rgba(255,255,255,.2)', marginTop:4, paddingTop:4, fontWeight:500 }}>
                  Total max : {popMax}
                </div>
              </div>
            )}
          </div>
        </div>

        {isOvercrowded && (
          <div style={{ marginTop:4, fontSize:11, color:'#dc2626', fontWeight:500 }}>⚠️ Surpopulation !</div>
        )}
      </div>
    </div>
  )
}

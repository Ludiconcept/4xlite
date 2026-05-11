import { useGameStore } from '../../store/gameStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { EVENEMENTS, getEvenementActuel, DERNIER_EVENEMENT_IDX } from '../../data/evenements.js'

export function RightPanel() {
  const game = useGameStore(s => s.game)
  if (!game) return null

  const { empires } = game
  const eventIndex   = game.eventIndex ?? 0
  const evenement    = getEvenementActuel(eventIndex)

  return (
    <div style={{ width:140, background:'white', borderLeft:'0.5px solid #e2e8f0', padding:'8px 8px', display:'flex', flexDirection:'column', gap:8, flexShrink:0, overflowY:'auto' }}>

      {/* Empires */}
      <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em' }}>Empires</div>
      {[1,2,3,4].map(id => {
        const cfg = EMPIRE_CONFIG[id]
        const emp = empires?.[id] || { power:0, maxPower:8 }
        const pct = emp.maxPower > 0 ? Math.round((emp.power / emp.maxPower) * 100) : 0
        return (
          <div key={id} style={{ borderRadius:7, padding:'5px 7px', border:`1px solid ${cfg.colorBorder}`, background:cfg.colorLight }}>
            <div style={{ fontSize:11, fontWeight:500, color:cfg.colorText, display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
              <span>{cfg.emoji}</span>
              <span style={{ fontSize:10 }}>{cfg.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ flex:1, height:4, background:'#e2e8f0', borderRadius:2, overflow:'hidden' }}>
                <div style={{ width:`${pct}%`, height:'100%', background:cfg.color, borderRadius:2, transition:'width .3s' }} />
              </div>
              <span style={{ fontSize:10, color:'#64748b', minWidth:26 }}>{emp.power}/{emp.maxPower}</span>
            </div>
          </div>
        )
      })}

      {/* Événement en cours */}
      <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>Événement</div>
      {evenement && (
        <div style={{
          borderRadius:8, padding:'7px 8px',
          background: evenement.grave ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${evenement.grave ? '#fca5a5' : '#fcd34d'}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:9, background: evenement.grave?'#dc2626':'#f59e0b', color:'white', padding:'1px 5px', borderRadius:6, fontWeight:500 }}>
              {evenement.icone} {eventIndex + 1}/{EVENEMENTS.length}
            </span>
            {eventIndex >= DERNIER_EVENEMENT_IDX && (
              <span style={{ fontSize:9, color:'#dc2626' }}>🔁</span>
            )}
          </div>
          <div style={{ fontSize:11, fontWeight:500, color: evenement.grave?'#991b1b':'#92400e', marginBottom:2 }}>
            {evenement.titre}
          </div>
          <div style={{ fontSize:10, color: evenement.grave?'#7f1d1d':'#78350f', lineHeight:1.4, opacity:.85 }}>
            {evenement.texte.length > 80 ? evenement.texte.slice(0,80)+'…' : evenement.texte}
          </div>
        </div>
      )}
    </div>
  )
}

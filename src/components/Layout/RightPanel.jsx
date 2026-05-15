import { useGameStore } from '../../store/gameStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { EVENEMENTS, DERNIER_EVENEMENT_IDX, NB_CASES_PISTE } from '../../data/evenements.js'

export function RightPanel() {
  const game = useGameStore(s => s.game)
  if (!game) return null

  const { empires } = game
  const eventIndex   = game.eventIndex ?? 0
  const pressionActive = game.activeEffects?.pressionImperialeActive || false
  // Afficher le DERNIER événement passé (pas le suivant)
  const lastTitre = game.lastEvenementTitre || null
  const history = game.evenementsHistory || []
  const lastEntry = history.length > 0 ? history[history.length - 1] : null
  const lastEvt = lastEntry ? EVENEMENTS.find(e => e.titre === lastEntry.titre) : null

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

      {/* Dernier événement passé */}
      <div style={{ fontSize:10, fontWeight:500, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginTop:4 }}>Dernier événement</div>
      {lastEvt ? (
        <div style={{
          borderRadius:8, padding:'7px 8px',
          background: lastEvt.grave ? '#fef2f2' : '#f8fafc',
          border: `1px solid ${lastEvt.grave ? '#fca5a5' : '#e2e8f0'}`,
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
            <span style={{ fontSize:9, background: lastEvt.grave?'#dc2626':'#94a3b8', color:'white', padding:'1px 5px', borderRadius:6, fontWeight:500 }}>
              {lastEvt.icone} case {lastEntry.caseIdx + 1}
            </span>
            {pressionActive && <span style={{ fontSize:9, color:'#dc2626' }}>🔁</span>}
          </div>
          <div style={{ fontSize:11, fontWeight:500, color: lastEvt.grave?'#991b1b':'#374151', marginBottom:2 }}>
            {lastEvt.titre}
          </div>
          <div style={{ fontSize:10, color:'#64748b', lineHeight:1.4, opacity:.85 }}>
            Prochain : case {Math.min(eventIndex+1, NB_CASES_PISTE-1)+1}/{NB_CASES_PISTE}
          </div>
        </div>
      ) : (
        <div style={{ fontSize:11, color:'#94a3b8', fontStyle:'italic' }}>
          Aucun événement passé
        </div>
      )}
    </div>
  )
}

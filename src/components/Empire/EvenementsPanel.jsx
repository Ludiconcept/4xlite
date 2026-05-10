import { useGameStore } from '../../store/gameStore.js'
import { EVENEMENTS, DERNIER_EVENEMENT_IDX } from '../../data/evenements.js'

export function EvenementsPanel({ onClose }) {
  const game = useGameStore(s => s.game)
  const eventIndex = game?.eventIndex ?? 0

  return (
    <div style={{ position:'fixed', right:16, bottom:80, width:320, background:'white', borderRadius:12, border:'0.5px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,.12)', zIndex:200, display:'flex', flexDirection:'column', maxHeight:'80vh' }}>
      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'0.5px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <span style={{ fontWeight:500, fontSize:14 }}>📋 Piste des événements</span>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
            Événement {eventIndex + 1} / {EVENEMENTS.length} — {EVENEMENTS.length - 1 - eventIndex} avant le dernier
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
      </div>

      {/* Liste */}
      <div style={{ overflowY:'auto', padding:'8px 14px', display:'flex', flexDirection:'column', gap:6 }}>
        {EVENEMENTS.map((evt, idx) => {
          const isPast    = idx < eventIndex
          const isCurrent = idx === eventIndex
          const isFuture  = idx > eventIndex && idx < DERNIER_EVENEMENT_IDX
          const isDernier = idx === DERNIER_EVENEMENT_IDX

          // Le dernier est toujours visible
          if (isFuture) {
            return (
              <div key={evt.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:7, background:'#f8fafc', opacity:0.5 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#94a3b8', flexShrink:0 }}>{idx+1}</div>
                <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Événement à venir…</span>
              </div>
            )
          }

          return (
            <div key={evt.id} style={{
              padding:'8px 10px', borderRadius:8,
              background: isDernier ? '#fef2f2' : isCurrent ? '#fffbeb' : isPast ? '#f8fafc' : '#f0fdf4',
              border: `1px solid ${isDernier ? '#fca5a5' : isCurrent ? '#fcd34d' : isPast ? '#e2e8f0' : '#86efac'}`,
              opacity: isPast ? 0.7 : 1,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background: isDernier ? '#dc2626' : isCurrent ? '#f59e0b' : '#94a3b8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'white', fontWeight:500, flexShrink:0 }}>{idx+1}</div>
                <span style={{ fontSize:12, fontWeight:500, color: isDernier ? '#dc2626' : isCurrent ? '#92400e' : '#374151' }}>
                  {evt.icone} {evt.titre}
                  {isCurrent && <span style={{ fontSize:10, color:'#f59e0b', marginLeft:4 }}>← actuel</span>}
                  {isDernier && <span style={{ fontSize:10, color:'#dc2626', marginLeft:4 }}>← se répète</span>}
                </span>
              </div>
              <p style={{ fontSize:11, color:'#64748b', lineHeight:1.4, margin:0, paddingLeft:28 }}>{evt.texte}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

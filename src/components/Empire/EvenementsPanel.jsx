import { useGameStore } from '../../store/gameStore.js'
import { CASES_SCRIPTEES, NB_CASES_PISTE } from '../../data/evenements.js'

export function EvenementsPanel({ onClose }) {
  const game = useGameStore(s => s.game)
  const eventIndex = game?.eventIndex ?? 0
  const pressionActive = game?.activeEffects?.pressionImperialeActive || false
  const history = game?.evenementsHistory || []

  // Trouver le titre d'une case passée depuis l'historique
  const getTitrePasse = (idx) => {
    const entry = [...history].reverse().find(e => e.caseIdx === idx)
    return entry?.titre || null
  }

  const cases = Array.from({ length: NB_CASES_PISTE }, (_, i) => i)

  return (
    <div style={{ position:'fixed', right:16, bottom:80, width:320, background:'white', borderRadius:12, border:'0.5px solid #e2e8f0', boxShadow:'0 4px 24px rgba(0,0,0,.12)', zIndex:200, display:'flex', flexDirection:'column', maxHeight:'80vh' }}>
      <div style={{ padding:'10px 14px', borderBottom:'0.5px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
        <div>
          <span style={{ fontWeight:500, fontSize:14 }}>📋 Piste des événements</span>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:1 }}>
            {pressionActive
              ? 'Pression impériale active — se répète à chaque résultat 5'
              : `Case ${eventIndex + 1} / ${NB_CASES_PISTE} — ${NB_CASES_PISTE - eventIndex - 1} avant la case 40`
            }
          </div>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
      </div>

      <div style={{ overflowY:'auto', padding:'8px 14px', display:'flex', flexDirection:'column', gap:4 }}>
        {cases.map(idx => {
          const isPast    = idx < eventIndex
          const isCurrent = idx === eventIndex
          const isScripte = CASES_SCRIPTEES.includes(idx)
          const isLast    = idx === NB_CASES_PISTE - 1
          const titrePasse = isPast ? getTitrePasse(idx) : null

          return (
            <div key={idx} style={{
              padding:'6px 10px', borderRadius:7,
              background: isLast ? '#fef2f2' : isCurrent ? '#fffbeb' : isScripte ? '#fefce8' : '#f8fafc',
              border: `1px solid ${isLast ? '#fca5a5' : isCurrent ? '#fcd34d' : isScripte ? '#fde68a' : '#e2e8f0'}`,
              opacity: isPast ? 0.7 : 1,
              display:'flex', alignItems:'center', gap:8,
            }}>
              <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'white',
                background: isLast ? '#dc2626' : isCurrent ? '#f59e0b' : isScripte ? '#d97706' : isPast ? '#94a3b8' : '#cbd5e1',
              }}>{idx+1}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontSize:11, color: isLast ? '#dc2626' : isCurrent ? '#92400e' : isScripte && !isPast ? '#92400e' : '#64748b' }}>
                  {isPast && titrePasse
                    ? titrePasse
                    : isPast ? 'Passé'
                    : isCurrent ? '← Actuel'
                    : isScripte ? '⭐ Scripté'
                    : 'Aléatoire'
                  }
                  {isLast && !isCurrent && ' — Pression impériale'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

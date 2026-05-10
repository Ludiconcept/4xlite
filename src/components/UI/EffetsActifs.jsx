import { useGameStore } from '../../store/gameStore.js'

const EFFETS = {
  armerActif:   { emoji:'🗡️', label:'Armer',   desc:'-1 perte au prochain combat' },
  servageActif: { emoji:'⛓️', label:'Servage',  desc:'3 dés au prochain lancer' },
  equiperActif: { emoji:'⚙️', label:'Équiper',  desc:'+/- sur les dés actif (1 Fer/clic)' },
}

function Badge({ emoji, label, desc, onCancel }) {
  return (
    <div style={{ position:'relative', display:'inline-block' }} className="effet-badge">
      <div style={{
        width:32, height:32, borderRadius:8,
        background:'#1e3a5f', color:'white',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:16, cursor:'default',
        boxShadow:'0 2px 6px rgba(0,0,0,.2)',
      }}>
        {emoji}
      </div>
      {/* Infobulle au survol */}
      <div style={{
        position:'absolute', left:'calc(100% + 8px)', top:'50%',
        transform:'translateY(-50%)',
        background:'#1e293b', color:'white',
        fontSize:11, padding:'5px 9px', borderRadius:7,
        whiteSpace:'nowrap', pointerEvents:'none',
        boxShadow:'0 2px 8px rgba(0,0,0,.25)',
        zIndex:9999,
        opacity:0, transition:'opacity .15s',
      }} className="effet-tooltip">
        <div style={{ fontWeight:500 }}>{label}</div>
        <div style={{ color:'#94a3b8', fontSize:10 }}>{desc}</div>
      </div>
    </div>
  )
}

export function EffetsActifs() {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)

  if (!game) return null

  const effetsActifs = Object.entries(EFFETS).filter(([key]) => game.activeEffects?.[key])

  if (effetsActifs.length === 0) return null

  return (
    <>
      <style>{`
        .effet-badge:hover .effet-tooltip { opacity: 1 !important; }
      `}</style>
      <div style={{
        display:'flex', flexDirection:'column', gap:4,
        padding:'6px', background:'rgba(255,255,255,.9)',
        border:'0.5px solid #e2e8f0', borderRadius:10,
        backdropFilter:'blur(4px)',
        boxShadow:'0 2px 8px rgba(0,0,0,.1)',
      }}>
        {effetsActifs.map(([key, cfg]) => (
          <Badge key={key} {...cfg} onCancel={() =>
            updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, [key]: false } }))
          } />
        ))}
      </div>
    </>
  )
}

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { appliquerFamine, FAMINE_ORDER, FAMINE_PROTECTED } from '../../engine/population.js'

const POP_LABELS = {
  fermier:'Fermier', ouvrier:'Ouvrier', artisan:'Artisan', guerrier:'Guerrier', marin:'Marin',
  pretre:'Prêtre', noble:'Noble',
}
const POP_EMOJI = {
  fermier:'🧑‍🌾', ouvrier:'👷', artisan:'🛠️', guerrier:'⚔️', marin:'⚓', pretre:'⛪', noble:'👑',
}

export function FaminePopup({ famineData, onConfirm }) {
  const game = useGameStore(s => s.game)
  const addEntry = useLogStore(s => s.addEntry)

  const { manque, mortsPossibles } = famineData

  // Le joueur répartit les `manque` pertes entre les types disponibles
  const [pertes, setPertes] = useState(() => {
    // Pré-remplir automatiquement dans l'ordre F→O→A→G
    const auto = {}
    let reste = manque
    for (const type of FAMINE_ORDER) {
      const dispo = mortsPossibles[type] || 0
      const prend = Math.min(reste, dispo)
      if (prend > 0) auto[type] = prend
      reste -= prend
      if (reste <= 0) break
    }
    return auto
  })

  const totalPertes = Object.values(pertes).reduce((a, b) => a + b, 0)
  const peutConfirmer = totalPertes === manque

  function adjust(type, delta) {
    const cur   = pertes[type] || 0
    const dispo = mortsPossibles[type] || 0
    const total = totalPertes - cur

    let newVal = Math.max(0, Math.min(dispo, cur + delta))
    // Ne pas dépasser le total requis
    if (total + newVal > manque) newVal = manque - total
    setPertes({ ...pertes, [type]: newVal })
  }

  function confirmer() {
    if (!peutConfirmer) return
    const detail = Object.entries(pertes).filter(([,v])=>v>0).map(([t,v])=>`-${v} ${POP_LABELS[t]}`).join(', ')
    addEntry(`Famine — ${detail}`, game?.turn || 0)
    onConfirm(pertes)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, border:'0.5px solid #e2e8f0', padding:20, width:340, display:'flex', flexDirection:'column', gap:14, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>

        {/* Titre */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#fef2f2', border:'1px solid #fca5a5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>👥</div>
          <div>
            <div style={{ fontSize:15, fontWeight:500, color:'#1e293b' }}>Surpopulation</div>
            <div style={{ fontSize:12, color:'#64748b' }}>La capacité maximale est dépassée</div>
          </div>
        </div>

        {/* Contexte */}
        <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#7f1d1d', lineHeight:1.5 }}>
          {famineData.nourritureManquante > 0
            ? <>Nourriture insuffisante pour nourrir la surpopulation. <strong>{manque} population{manque>1?'s':''} mourront</strong> faute de ressources.</>
            : <><strong>{manque} population{manque>1?'s':''} en excédent</strong> doivent être retirées.</>
          }
        </div>

        {/* Répartition des pertes */}
        <div>
          <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>
            Répartissez les pertes ({totalPertes}/{manque})
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {/* Types pouvant mourir */}
            {FAMINE_ORDER.map(type => {
              const dispo = mortsPossibles[type] || 0
              if (dispo === 0) return null
              const nb = pertes[type] || 0
              return (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, background: nb>0?'#fef2f2':'#f8fafc', border:`1px solid ${nb>0?'#fca5a5':'#e2e8f0'}` }}>
                  <span style={{ fontSize:16 }}>{nb>0?'💀':'○'}</span>
                  <span style={{ fontSize:12, fontWeight: nb>0?500:400, color: nb>0?'#991b1b':'#475569', flex:1 }}>
                    {POP_EMOJI[type]} {POP_LABELS[type]}
                    <span style={{ fontWeight:400, color:'#94a3b8', marginLeft:4 }}>({dispo} dispo.)</span>
                  </span>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <button onClick={() => adjust(type, -1)} disabled={nb===0} style={{ width:22, height:22, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:nb>0?'pointer':'default', fontSize:14, opacity:nb===0?0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ width:18, textAlign:'center', fontSize:13, fontWeight:500, color:nb>0?'#dc2626':'#94a3b8' }}>{nb}</span>
                    <button onClick={() => adjust(type, 1)} disabled={totalPertes>=manque||nb>=dispo} style={{ width:22, height:22, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:(totalPertes<manque&&nb<dispo)?'pointer':'default', fontSize:14, opacity:(totalPertes>=manque||nb>=dispo)?0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                  </div>
                </div>
              )
            })}

            {/* Protégés */}
            {FAMINE_PROTECTED.map(type => {
              if (!(game?.population?.[type] > 0)) return null
              return (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, background:'#f8fafc', border:'1px solid #e2e8f0', opacity:0.5 }}>
                  <span style={{ fontSize:16 }}>🛡️</span>
                  <span style={{ fontSize:12, color:'#64748b', flex:1 }}>{POP_EMOJI[type]} {POP_LABELS[type]} — nourri en priorité</span>
                  <span style={{ fontSize:11, color:'#94a3b8' }}>protégé</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Note */}
        <div style={{ fontSize:11, color:'#64748b', background:'#f8fafc', borderRadius:8, padding:'7px 10px', lineHeight:1.5 }}>
          Nobles et Prêtres sont protégés. Répartissez les {manque} perte{manque>1?'s':''} entre Fermiers, Ouvriers, Artisans, Guerriers et Marins.
        </div>

        <button onClick={confirmer} disabled={!peutConfirmer} style={{ padding:'10px 0', background: peutConfirmer?'#dc2626':'#e2e8f0', color:'white', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:peutConfirmer?'pointer':'default' }}>
          Confirmer les pertes ({totalPertes}/{manque})
        </button>
      </div>
    </div>
  )
}

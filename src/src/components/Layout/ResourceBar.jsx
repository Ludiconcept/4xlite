import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { ResourceIcon } from '../UI/ResourceIcons.jsx'
import { HelpTooltip } from '../UI/Tooltip.jsx'

const RESOURCES = ['nourriture', 'bois', 'argile', 'fer', 'or']
const RESOURCE_LABELS = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or' }

// Panneau de défausse des ressources
function DiscardPanel({ resources, storageMax, onDiscard, onClose }) {
  const [amounts, setAmounts] = useState({})
  const total = Object.values(amounts).reduce((a, b) => a + b, 0)

  function adjust(type, delta) {
    const cur = amounts[type] || 0
    const max = resources[type] || 0
    const newVal = Math.max(0, Math.min(max, cur + delta))
    setAmounts({ ...amounts, [type]: newVal })
  }

  function confirm() {
    if (total === 0) return
    onDiscard(amounts)
    onClose()
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:20, width:300, display:'flex', flexDirection:'column', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontWeight:600, fontSize:15, color:'#1e293b' }}>🗑️ Vider le stockage</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:18 }}>✕</button>
        </div>
        <p style={{ fontSize:13, color:'#475569', lineHeight:1.5, margin:0 }}>
          Choisissez les ressources à supprimer définitivement pour libérer de la place.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {RESOURCES.map(type => {
            const stock = resources[type] || 0
            const amount = amounts[type] || 0
            if (stock === 0) return null
            return (
              <div key={type} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0' }}>
                <div style={{ width:22, height:22, flexShrink:0 }}>
                  <ResourceIcon type={type} size={22} />
                </div>
                <span style={{ flex:1, fontSize:13, color:'#374151' }}>{RESOURCE_LABELS[type]}</span>
                <span style={{ fontSize:12, color:'#94a3b8', marginRight:4 }}>/{stock}</span>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <button onClick={() => adjust(type, -1)} disabled={amount === 0} style={{ width:22, height:22, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor: amount > 0 ? 'pointer' : 'default', fontSize:14, opacity: amount === 0 ? 0.3 : 1 }}>−</button>
                  <span style={{ width:20, textAlign:'center', fontSize:13, fontWeight:600, color: amount > 0 ? '#dc2626' : '#94a3b8' }}>{amount}</span>
                  <button onClick={() => adjust(type, 1)} disabled={amount >= stock} style={{ width:22, height:22, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor: amount < stock ? 'pointer' : 'default', fontSize:14, opacity: amount >= stock ? 0.3 : 1 }}>+</button>
                </div>
              </div>
            )
          })}
        </div>
        {total > 0 && (
          <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'6px 8px' }}>
            ⚠️ {total} ressource{total > 1 ? 's' : ''} supprimée{total > 1 ? 's' : ''} définitivement
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:13, cursor:'pointer' }}>Annuler</button>
          <button onClick={confirm} disabled={total === 0} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background: total > 0 ? '#dc2626' : '#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor: total > 0 ? 'pointer' : 'default' }}>
            Supprimer {total > 0 ? `(${total})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ResourceBar({ onInnovationsClick }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const [showDiscard, setShowDiscard] = useState(false)

  if (!game) return null

  const { resources, storageMax } = game
  const totalStored = Object.values(resources).reduce((a, b) => a + b, 0)
  const storageFull = totalStored >= storageMax

  function handleDiscard(amounts) {
    updateGame(g => {
      const newRes = { ...g.resources }
      for (const [type, qty] of Object.entries(amounts)) {
        if (qty > 0) newRes[type] = Math.max(0, (newRes[type] || 0) - qty)
      }
      return { ...g, resources: newRes }
    })
  }

  return (
    <>
      <div style={{ background:'white', borderBottom:'0.5px solid #e2e8f0', padding:'6px 12px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', flexShrink:0 }}>
        {/* Ressources */}
        {RESOURCES.map((type, i) => (
          <div key={type} style={{ display:'flex', alignItems:'center', gap:5 }}>
            {i > 0 && <div style={{ width:1, height:18, background:'#e2e8f0', marginRight:2 }} />}
            <div style={{ width:20, height:20 }}>
              <ResourceIcon type={type} size={20} />
            </div>
            <span style={{ fontSize:13, fontWeight:500, color:'#1e293b' }}>{resources[type] ?? 0}</span>
            <span style={{ fontSize:11, color:'#94a3b8' }}>{RESOURCE_LABELS[type]}</span>
          </div>
        ))}

        {/* Stockage */}
        <div style={{ display:'flex', alignItems:'center', gap:4, marginLeft:4 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 8px', borderRadius:20, fontSize:11, border:'0.5px solid #e2e8f0', background: storageFull ? '#fef2f2' : '#f8fafc', color: storageFull ? '#dc2626' : '#64748b' }}>
            <span>📦</span>
            <span style={{ fontWeight:500 }}>{totalStored}/{storageMax}</span>
            {storageFull && <span style={{ fontWeight:700 }}>!</span>}
            <HelpTooltip text={`Stockage de base : 8 emplacements au total.\nChaque Entrepôt ajoute 4 emplacements.\nRessources récoltées au-delà du plafond sont perdues.`} position="bottom" />
          </div>

          {/* Bouton vider stockage */}
          <button onClick={() => setShowDiscard(true)}
            title="Supprimer des ressources"
            style={{ width:22, height:22, borderRadius:5, border:'0.5px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#94a3b8' }}>
            🗑️
          </button>
        </div>

        {/* Innovations */}
        <button onClick={onInnovationsClick} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:500, border:'0.5px solid #f59e0b', background:'#fffbeb', color:'#92400e', cursor:'pointer', marginLeft:4 }}>
          💡 Innovations
        </button>
      </div>

      {showDiscard && (
        <DiscardPanel
          resources={resources}
          storageMax={storageMax}
          onDiscard={handleDiscard}
          onClose={() => setShowDiscard(false)}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { calculerProduction, appliquerRecolte } from '../../engine/recolte.js'
import { ResourceIcon } from '../UI/ResourceIcons.jsx'

const WORKER_CONFIG = {
  fermier: {
    label: 'Fermiers',
    emoji: '🧑‍🌾',
    resources: ['nourriture', 'bois'],
    color: '#78716c',
  },
  ouvrier: {
    label: 'Ouvriers',
    emoji: '👷',
    resources: ['argile', 'fer', 'or'],
    color: '#64748b',
  },
}

const RES_LABELS = {
  nourriture: 'Nourriture', bois: 'Bois',
  argile: 'Argile', fer: 'Fer', or: 'Or',
}
const RES_COLORS = {
  nourriture: '#16a34a', bois: '#92400e',
  argile: '#dc2626', fer: '#475569', or: '#d97706',
}

export function ActionRecolter({ onClose, onMarkUsed }) {
  const game = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry = useLogStore(s => s.addEntry)

  const [workerType, setWorkerType] = useState(null)
  const [harvest, setHarvest] = useState({})

  if (!game) return null

  const production = calculerProduction(game.map, game.globalBuildings, game.activeEffects)
  const nbFermiers = game.population.fermier || 0
  const nbOuvriers = game.population.ouvrier || 0

  const workerCount = workerType === 'fermier' ? nbFermiers : nbOuvriers
  const availableResources = workerType
    ? WORKER_CONFIG[workerType].resources.reduce((acc, r) => {
        if (production[r] > 0) acc[r] = production[r]
        return acc
      }, {})
    : {}

  const totalHarvest = Object.values(harvest).reduce((a, b) => a + b, 0)
  const totalStored = Object.values(game.resources).reduce((a, b) => a + b, 0)
  const storageLeft = game.storageMax - totalStored
  const canHarvest = workerCount > 0

  function adjustHarvest(type, delta) {
    const current = harvest[type] || 0
    const maxProd = availableResources[type] || 0
    const newVal = Math.max(0, Math.min(maxProd, Math.min(workerCount, current + delta)))
    // Vérifier qu'on ne dépasse pas le nb de travailleurs ni le stockage
    const newTotal = totalHarvest - current + newVal
    if (newTotal > workerCount) return
    if (newTotal > storageLeft && delta > 0) return
    setHarvest(prev => ({ ...prev, [type]: newVal }))
  }

  function confirmerRecolte() {
    if (!workerType || totalHarvest === 0) return
    const newResources = appliquerRecolte(game.resources, harvest, game.storageMax)
    updateGame(g => ({ ...g, resources: newResources }))
    const details = Object.entries(harvest)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `+${v} ${RES_LABELS[k]}`)
      .join(', ')
    addEntry(`Récolte (${WORKER_CONFIG[workerType].label}) : ${details}`, game.turn)
    onMarkUsed?.()
    onClose()
  }

  return (
    <div style={{
      background: 'white', border: '0.5px solid #e2e8f0', borderRadius: 12,
      padding: 16, width: 300, display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontWeight: 600, fontSize: 15, color: '#1e293b' }}>🌾 Récolter</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
      </div>

      {/* Choix du type de travailleur */}
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          Choisissez vos travailleurs
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {Object.entries(WORKER_CONFIG).map(([type, cfg]) => {
            const count = type === 'fermier' ? nbFermiers : nbOuvriers
            const isEmpty = count === 0
            return (
              <button key={type}
                onClick={() => { if (!isEmpty) { setWorkerType(type); setHarvest({}) } }}
                disabled={isEmpty}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 9,
                  border: workerType === type ? `2px solid ${cfg.color}` : '1.5px solid #e2e8f0',
                  background: workerType === type ? `${cfg.color}15` : 'white',
                  cursor: isEmpty ? 'not-allowed' : 'pointer',
                  opacity: isEmpty ? 0.4 : 1, textAlign: 'center',
                }}>
                <div style={{ fontSize: 20 }}>{cfg.emoji}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: workerType === type ? cfg.color : '#374151' }}>{cfg.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{count} disponible{count > 1 ? 's' : ''}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Ressources disponibles */}
      {workerType && (
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Ressources disponibles ({totalHarvest}/{Math.min(workerCount, storageLeft)} max)
          </div>
          {Object.keys(availableResources).length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
              {workerType === 'ouvrier' ? 'Aucune production de Fer, Or ou Argile disponible.' : 'Aucune production de Nourriture ou Bois disponible.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(availableResources).map(([type, maxProd]) => {
                const current = harvest[type] || 0
                const canAdd = totalHarvest < workerCount && totalHarvest < storageLeft && current < maxProd
                return (
                  <div key={type} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 7,
                    background: current > 0 ? `${RES_COLORS[type]}10` : '#f8fafc',
                    border: `1px solid ${current > 0 ? RES_COLORS[type] + '40' : '#e2e8f0'}`,
                  }}>
                    <ResourceIcon type={type} size={20} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#374151' }}>
                      {RES_LABELS[type]}
                    </span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>/{maxProd}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button onClick={() => adjustHarvest(type, -1)} disabled={current === 0}
                        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: current === 0 ? 'default' : 'pointer', fontSize: 14, opacity: current === 0 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        −
                      </button>
                      <span style={{ width: 18, textAlign: 'center', fontSize: 13, fontWeight: 600, color: RES_COLORS[type] }}>
                        {current}
                      </span>
                      <button onClick={() => adjustHarvest(type, 1)} disabled={!canAdd}
                        style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid #e2e8f0', background: 'white', cursor: canAdd ? 'pointer' : 'default', fontSize: 14, opacity: canAdd ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Stockage alerte */}
      {storageLeft <= 2 && storageLeft > 0 && (
        <div style={{ fontSize: 11, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '5px 8px' }}>
          ⚠️ Stockage presque plein ({storageLeft} emplacement{storageLeft > 1 ? 's' : ''} libre{storageLeft > 1 ? 's' : ''})
        </div>
      )}
      {storageLeft === 0 && (
        <div style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '5px 8px' }}>
          ⛔ Stockage plein — construisez un Entrepôt
        </div>
      )}

      {/* Bouton confirmer */}
      <button
        onClick={confirmerRecolte}
        disabled={!workerType || totalHarvest === 0}
        style={{
          padding: '9px 0', background: workerType && totalHarvest > 0 ? '#16a34a' : '#e2e8f0',
          color: 'white', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 13,
          cursor: workerType && totalHarvest > 0 ? 'pointer' : 'default',
        }}
      >
        Récolter {totalHarvest > 0 ? `(${totalHarvest} ressource${totalHarvest > 1 ? 's' : ''})` : ''}
      </button>
    </div>
  )
}

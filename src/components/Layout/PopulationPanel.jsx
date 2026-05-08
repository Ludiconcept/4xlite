import { useGameStore } from '../../store/gameStore.js'
import { HelpTooltip } from '../UI/Tooltip.jsx'
import { POP_PER_TILE, POP_PER_FARM } from '../../data/constants.js'

const POP_TYPES = [
  { key: 'fermier',  label: 'Fermier',  color: '#78716c', role: 'Récolte Nourriture et Bois' },
  { key: 'ouvrier',  label: 'Ouvrier',  color: '#64748b', role: 'Récolte Or, Fer, Argile' },
  { key: 'artisan',  label: 'Artisan',  color: '#d97706', role: 'Commerce et Innovations' },
  { key: 'guerrier', label: 'Guerrier', color: '#dc2626', role: 'Attaque, explore, défend' },
  { key: 'pretre',   label: 'Prêtre',   color: '#7c3aed', role: 'Innovations Religion & Admin.' },
  { key: 'noble',    label: 'Noble',    color: '#0369a1', role: 'Innovations Guerre & Admin.' },
]

export function PopulationPanel() {
  const game = useGameStore((s) => s.game)
  if (!game) return null

  const { population, map } = game

  // Calcul du plafond de population
  const playerTiles = map?.flat().filter((t) => t.owner === 'player').length ?? 0
  const farms = map?.flat()
    .filter((t) => t.owner === 'player' && t.buildings?.includes('ferme'))
    .reduce((sum, t) => sum + t.buildings.filter((b) => b === 'ferme').length, 0) ?? 0
  const popMax = playerTiles * POP_PER_TILE + farms * POP_PER_FARM
  const popTotal = Object.values(population).reduce((a, b) => a + b, 0)
  const isOvercrowded = popTotal > popMax && popMax > 0

  return (
    <div className="w-28 bg-white border-r border-slate-200 p-2 flex flex-col gap-1.5 flex-shrink-0 overflow-y-auto">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
        Population
      </div>

      {POP_TYPES.map(({ key, label, color, role }) => (
        <div key={key} className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: color }}
              title={role}
            />
            <span className="text-xs text-slate-700">{label}</span>
          </div>
          <span className="text-xs font-medium text-slate-800">
            {population[key] ?? 0}
          </span>
        </div>
      ))}

      {/* Total */}
      <div className="mt-1 pt-2 border-t border-slate-200">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Total</span>
          <span className={`font-medium ${isOvercrowded ? 'text-red-600' : 'text-slate-800'}`}>
            {popTotal} / {popMax || '—'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
          <span>Cap. max</span>
          <HelpTooltip
            text={`Capacité = cases×${POP_PER_TILE} + Fermes×${POP_PER_FARM}\nActuellement : ${playerTiles} cases × ${POP_PER_TILE} + ${farms} Fermes × ${POP_PER_FARM} = ${popMax}`}
          />
        </div>
        {isOvercrowded && (
          <div className="mt-1 text-xs text-red-600 font-medium">
            ⚠️ Surpopulation !
          </div>
        )}
      </div>
    </div>
  )
}

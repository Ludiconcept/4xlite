import { useGameStore } from '../../store/gameStore.js'
import { ResourceIcon } from '../UI/ResourceIcons.jsx'
import { HelpTooltip } from '../UI/Tooltip.jsx'

const RESOURCES = ['nourriture', 'bois', 'argile', 'fer', 'or']
const RESOURCE_LABELS = {
  nourriture: 'Nourriture',
  bois: 'Bois',
  argile: 'Argile',
  fer: 'Fer',
  or: 'Or',
}

export function ResourceBar({ onInnovationsClick }) {
  const game = useGameStore((s) => s.game)
  if (!game) return null

  const { resources, storageMax } = game
  const totalStored = Object.values(resources).reduce((a, b) => a + b, 0)
  const storageFull = totalStored >= storageMax

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center gap-3 flex-wrap">
      {RESOURCES.map((type, i) => (
        <div key={type} className="flex items-center gap-1.5">
          {i > 0 && <div className="w-px h-5 bg-slate-200 mr-1" />}
          <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
            <ResourceIcon type={type} size={22} />
          </div>
          <span className="text-sm font-medium text-slate-800">
            {resources[type] ?? 0}
          </span>
          <span className="text-xs text-slate-400">{RESOURCE_LABELS[type]}</span>
        </div>
      ))}

      {/* Séparateur */}
      <div className="w-px h-5 bg-slate-200 mx-1" />

      {/* Stockage */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
        storageFull
          ? 'bg-red-50 border-red-300 text-red-700'
          : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
        </svg>
        <span className="font-medium">Stockage {totalStored}/{storageMax}</span>
        {storageFull && <span className="text-red-500 font-bold">!</span>}
        <HelpTooltip text={`Stockage de base : 8. Chaque Entrepôt ajoute 4 emplacements.`} />
      </div>

      {/* Bouton Innovations */}
      <button
        onClick={onInnovationsClick}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer ml-1"
        style={{ background: '#fef3c7', borderColor: '#f59e0b', color: '#92400e' }}
      >
        💡 Innovations
      </button>
    </div>
  )
}

import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import { EVENTS } from '../../data/constants.js'

// Textes des événements (résumés)
const EVENT_NAMES = {
  bonusTour1:        'Bonus d\'actions',
  empiresAttaquent:  'Les empires attaquent',
  gainRessources:    'Gain de ressources',
  croissance:        'Croissance',
  colonisationGrat:  'Colonisation gratuite',
  empireColonise3:   'Expansion ennemie',
  soumissionTribus1: 'Soumission des tribus',
  bonusTour2:        'Bonus d\'actions',
  emergenceEtat:     'Émergence de l\'état',
  famine1:           'Famine',
  empiresPlus2Des:   'Empires renforcés',
  explorerColoniser: 'Explorer & Coloniser',
  bonusTour3:        'Bonus d\'actions',
  empirePuissance1:  'Puissance ennemie +',
  empiresColonisent: 'Colonisation ennemie',
  perceeTechno1:     'Percée technologique',
  soumissionTribus2: 'Soumission des tribus',
  puisMaxCases:      'Puissance max +',
  travauxForces:     'Travaux forcés',
  maladie:           'Maladie',
  explosionDemo:     'Explosion démographique',
  eruption1:         'Éruption volcanique',
  bonusConstruction: 'Bonus construction',
  ressourceEpuisee:  'Ressource épuisée',
  perceeTechno2:     'Percée technologique',
  puisMaxCases2:     'Puissance max +',
  tremblementTerre:  'Tremblement de terre',
  empirePuissance2:  'Puissance ennemie +',
  bonusTourNobles:   'Bonus nobles',
  famine2:           'Famine',
}

const EVENT_DESCS = {
  famine1:    'Dépensez 1 Nourriture pour 2 populations. Nobles et Prêtres nourris en priorité.',
  famine2:    'Dépensez 1 Nourriture pour 2 populations. Nobles et Prêtres nourris en priorité.',
  maladie:    '-1 population par Marais contrôlé, sauf si l\'Hôpital est construit.',
  eruption1:  'Perdez 1 population et 1 bâtiment sur chaque case adjacente à un volcan.',
  tremblementTerre: '2 bâtiments détruits, sauf si le Génie civil est débloqué.',
  perceeTechno1: 'Au prochain tour, une action Étudier est offerte gratuitement.',
  perceeTechno2: 'Au prochain tour, une action Étudier est offerte gratuitement.',
  croissance:  'Dépensez 2 Nourriture pour gagner 1 population. Répétable jusqu\'à 3 fois.',
  gainRessources: 'Gagnez 2 ressources de votre choix.',
  bonusTour1:  'Au prochain tour, choisissez 3 dés au lieu de 2.',
  bonusTour2:  'Au prochain tour, choisissez 3 dés au lieu de 2.',
  bonusTour3:  'Au prochain tour, choisissez 3 dés au lieu de 2.',
}

function EventCard({ eventIndex, onOpenHistory }) {
  const event = EVENTS[eventIndex]
  if (!event) return null
  const name = EVENT_NAMES[event.key] || event.key
  const desc = EVENT_DESCS[event.key] || 'Consultez le manuel pour les détails.'
  const typeColors = {
    positive: { bg: '#f0fdf4', border: '#16a34a', text: '#14532d', badge: '#16a34a' },
    negative: { bg: '#fef2f2', border: '#dc2626', text: '#7f1d1d', badge: '#dc2626' },
    mixed:    { bg: '#fffbeb', border: '#f59e0b', text: '#78350f', badge: '#f59e0b' },
  }
  const colors = typeColors[event.type] || typeColors.mixed

  return (
    <div
      onClick={onOpenHistory}
      style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '7px 8px', cursor: 'pointer', flex: 1 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 9, background: colors.badge, color: 'white', padding: '1px 6px', borderRadius: 8, fontWeight: 500 }}>
          ⚡ Événement
        </span>
        <span style={{ fontSize: 9, color: colors.text }}>{eventIndex + 1} / 30</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: colors.text, marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 10, color: colors.text, lineHeight: 1.4, opacity: 0.85 }}>{desc}</div>
      <div style={{ fontSize: 9, color: colors.text, marginTop: 4, fontStyle: 'italic', opacity: 0.7 }}>
        Cliquer pour consulter tous les événements →
      </div>
    </div>
  )
}

export function RightPanel() {
  const game = useGameStore((s) => s.game)
  const [showHistory, setShowHistory] = useState(false)

  if (!game) return null
  const { empires, eventTrack } = game
  const currentEventIdx = eventTrack?.current ?? 0

  return (
    <div className="w-40 bg-white border-l border-slate-200 p-2 flex flex-col gap-2 flex-shrink-0 overflow-y-auto">
      {/* Empires */}
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Empires</div>
      {[1, 2, 3, 4].map((id) => {
        const cfg = EMPIRE_CONFIG[id]
        const emp = empires?.[id]
        const pct = emp ? Math.round((emp.power / emp.maxPower) * 100) : 0
        return (
          <div key={id} style={{ borderRadius: 7, padding: '5px 7px', border: `1px solid ${cfg.colorBorder}`, background: cfg.colorLight }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: cfg.colorText, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              {cfg.emoji} {cfg.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: cfg.color, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
              <span style={{ fontSize: 10, color: '#64748b', minWidth: 26 }}>{emp?.power ?? 0}/{emp?.maxPower ?? 8}</span>
            </div>
          </div>
        )
      })}

      {/* Événement en cours */}
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-1">Événement en cours</div>
      <EventCard eventIndex={currentEventIdx} onOpenHistory={() => setShowHistory(true)} />

      {/* Modal historique événements */}
      {showHistory && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowHistory(false)}
        >
          <div
            style={{ background: 'white', borderRadius: 12, padding: 20, maxWidth: 400, width: '90%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-slate-800">Piste des événements</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-2">
              {EVENTS.map((ev, i) => {
                const isPast = i < currentEventIdx
                const isCurrent = i === currentEventIdx
                const name = EVENT_NAMES[ev.key] || ev.key
                return (
                  <div key={ev.id} style={{
                    padding: '6px 10px', borderRadius: 6,
                    background: isPast ? '#f0fdf4' : isCurrent ? '#fffbeb' : '#f8fafc',
                    border: `1px solid ${isPast ? '#86efac' : isCurrent ? '#f59e0b' : '#e2e8f0'}`,
                    opacity: isPast ? 0.7 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 24 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: isCurrent ? 500 : 400, color: isCurrent ? '#92400e' : '#475569' }}>{name}</span>
                      {isPast && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#16a34a' }}>✓</span>}
                      {isCurrent && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b' }}>← en cours</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

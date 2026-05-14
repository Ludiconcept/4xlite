/**
 * engine/actionsSpeciales.js
 * Logique des actions spéciales du menu permanent
 */

/**
 * Définition de toutes les actions spéciales du menu.
 * Certaines nécessitent des innovations (Sprint 7) — bloquées pour l'instant.
 */
export const ACTIONS_SPECIALES = {
  grandir: {
    id: 'grandir', name: 'Grandir', emoji: '👶',
    description: '+1 population au choix.',
    cout: { nourriture: 3 },
    maxParTour: 1,
    alwaysAvailable: true,
  },
  equiper: {
    id: 'equiper', name: 'Équiper', emoji: '⚙️',
    description: '+1 ou -1 sur un dé visible (bornes 1-6). Nécessite d\'avoir lancé les dés.',
    cout: { fer: 1 },
    maxParTour: null, // illimité
    requiresDiceRolled: true,
    alwaysAvailable: true,
  },
  commerce: {
    id: 'commerce', name: 'Commerce', emoji: '🏪',
    description: '1 Or → 1 ressource OU 2 ressources → 1 Or. Amélioré si Marché (1 Or → 2 ressources).',
    cout: {},
    maxParTourParArtisan: true, // 1 utilisation par Artisan
    alwaysAvailable: true,
  },
  recruter: {
    id: 'recruter', name: 'Recruter', emoji: '🪖',
    description: '+1 Guerrier ou Artisan.',
    cout: { or: 3 },
    maxParTour: 1,
    alwaysAvailable: true,
  },
  armer: {
    id: 'armer', name: 'Armer', emoji: '🗡️',
    description: '-1 perte au prochain combat. Dure 1 combat.',
    cout: { fer: 1 },
    maxParTour: null, // réactivable entre combats
    alwaysAvailable: true,
  },
  former: {
    id: 'former', name: 'Former', emoji: '🎓',
    description: 'Change 1 population en un autre type.',
    cout: { or: 1 },
    maxParTour: null,
    requiresBuilding: 'universite',
  },
  drainage: {
    id: 'drainage', name: 'Drainage', emoji: '🌿',
    description: 'Convertit 1 case Marais en Plaine. Perd 1 Ouvrier.',
    cout: { bois: 3 },
    coutPop: { ouvrier: 1 },
    maxParTour: null,
    requiresInnovation: 'drainage',
  },
  irrigation: {
    id: 'irrigation', name: 'Irrigation', emoji: '💧',
    description: 'Convertit 1 case Désert en Plaine. Perd 1 Fermier.',
    cout: { argile: 3 },
    coutPop: { fermier: 1 },
    maxParTour: null,
    requiresInnovation: 'irrigation',
  },
  martyrs: {
    id: 'martyrs', name: 'Martyrs', emoji: '✝️',
    description: 'Sacrifice N Prêtres → -N Puissance sur chaque empire. Usage unique.',
    cout: {},
    maxParTour: 1,
    usageUnique: true,
    requiresInnovation: 'martyrs',
  },
  servage: {
    id: 'servage', name: 'Servage', emoji: '⛓️',
    description: '3 actions ce tour au lieu de 2.',
    cout: { or: 3 },
    maxParTour: 1,
    requiresBuilding: 'palais',
  },
  tribut: {
    id: 'tribut', name: 'Tribut', emoji: '💰',
    description: 'Versez 3 Or à un empire (Ambassade requise) pour annuler sa prochaine attaque.',
    cout: { or: 3 },
    maxParTour: 99, // illimité — limité par le nb d'ambassades
  },
  // ── DEBUG — à supprimer après les tests ──────────────────────────────────
  debugGuerriers: {
    id: 'debugGuerriers', name: '[DEBUG] +3 Guerriers', emoji: '🔧',
    description: 'DEBUG : Ajoute 3 guerriers gratuitement.',
    cout: {},
    maxParTour: 99, // illimité
  },
}

/**
 * Vérifie si une action spéciale est disponible.
 */
export function peutUtiliserAction(actionId, game, usedThisTurn = {}) {
  const action = ACTIONS_SPECIALES[actionId]
  if (!action) return { ok: false, raison: 'Action inconnue.' }

  // Innovation requise (Sprint 7 — bloquées pour l'instant)
  if (action.requiresInnovation) {
    const unlocked = game.innovations?.[action.requiresInnovation]?.unlocked
    if (!unlocked) return { ok: false, raison: 'Innovation non débloquée.' }
  }

  // Bâtiment requis
  if (action.requiresBuilding) {
    const hasBuilding = game.map.flat().some(t =>
      t.owner === 'player' && t.buildings?.includes(action.requiresBuilding)
    )
    if (!hasBuilding) return { ok: false, raison: `Nécessite : ${action.requiresBuilding}.` }
  }

  // Max par tour
  if (action.maxParTour) {
    if ((usedThisTurn[actionId] || 0) >= action.maxParTour)
      return { ok: false, raison: 'Déjà utilisé ce tour.' }
  }

  // Armer : grisé si déjà actif
  if (actionId === 'armer' && game?.activeEffects?.armerActif)
    return { ok: false, raison: 'Armer est déjà actif : -1 perte au prochain combat.' }

  // Servage : grisé si déjà actif
  if (actionId === 'servage' && game?.activeEffects?.servageActif)
    return { ok: false, raison: 'Servage déjà actif : 3 dés au prochain lancer.' }

  // Commerce : besoin d'artisans
  if (actionId === 'commerce') {
    const nbArtisans = game.population.artisan || 0
    if (nbArtisans === 0) return { ok: false, raison: 'Nécessite au moins 1 Artisan.' }
    if ((usedThisTurn.commerce || 0) >= nbArtisans)
      return { ok: false, raison: `Limite atteinte (${nbArtisans} Artisan(s) = ${nbArtisans} utilisation(s)/tour).` }
  }

  // Équiper : uniquement après lancer des dés et avant confirmation
  if (actionId === 'equiper') {
    if (game._dicePhase !== 'rolled')
      return { ok: false, raison: game._dicePhase === 'idle' ? 'Lancez les dés d\'abord.' : 'Plus disponible après confirmation des actions.' }
    if (game.activeEffects?.equiperActif)
      return { ok: false, raison: 'Équiper déjà actif — utilisez les +/- sur les dés.' }
  }

  // Coût ressources
  for (const [res, qte] of Object.entries(action.cout || {})) {
    if ((game.resources[res] || 0) < qte)
      return { ok: false, raison: `Ressources insuffisantes (manque ${qte} ${res}).` }
  }

  // Coût population
  for (const [type, qte] of Object.entries(action.coutPop || {})) {
    if ((game.population[type] || 0) < qte)
      return { ok: false, raison: `Population insuffisante (manque ${qte} ${type}).` }
  }

  // DEBUG : toujours autorisé
  if (actionId === 'debugGuerriers') return { ok: true, raison: null }

  return { ok: true, raison: null }
}

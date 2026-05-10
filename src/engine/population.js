/**
 * engine/population.js
 * Gestion des plafonds, surpopulation, famine
 */

export const POP_PER_TILE = 5
export const POP_PER_FARM = 3
export const STORAGE_BASE = 8
export const STORAGE_PER_ENTREPOT = 4

// Ordre de priorité pour la famine : N et P nourris en dernier (protégés)
// F/O/A/G meurent en premier
export const FAMINE_ORDER  = ['fermier','ouvrier','artisan','guerrier']
export const FAMINE_PROTECTED = ['pretre','noble']
export const ALL_POP_TYPES = [...FAMINE_ORDER, ...FAMINE_PROTECTED]

/**
 * Calcule le plafond de population.
 */
export function calcPopMax(map) {
  const playerTiles = map.flat().filter(t => t.owner === 'player').length
  const farms = map.flat()
    .filter(t => t.owner === 'player')
    .reduce((s, t) => s + (t.buildings?.filter(b => b === 'ferme').length || 0), 0)
  return playerTiles * POP_PER_TILE + farms * POP_PER_FARM
}

/**
 * Calcule le stockage max actuel.
 */
export function calcStorageMax(map) {
  const entrepots = map.flat()
    .filter(t => t.owner === 'player')
    .reduce((s, t) => s + (t.buildings?.filter(b => b === 'entrepot').length || 0), 0)
  return STORAGE_BASE + entrepots * STORAGE_PER_ENTREPOT
}

/**
 * Calcule la population totale.
 */
export function calcPopTotal(population) {
  return Object.values(population).reduce((a, b) => a + b, 0)
}

/**
 * Calcule le coût en nourriture de fin de tour (surpopulation).
 * Chaque population excédentaire coûte 1 Nourriture.
 */
export function calcSurpopulationCost(population, map) {
  const total  = calcPopTotal(population)
  const popMax = calcPopMax(map)
  return Math.max(0, total - popMax)
}

/**
 * Résout la fin de tour côté population :
 * - Déduit la nourriture pour les excédents
 * - Retourne { newResources, famineData } où famineData est null si pas de famine
 *   ou { manque, mortsPossibles } si famine
 */
export function resoudreSurpopulation(population, resources, map) {
  const cout = calcSurpopulationCost(population, map)
  if (cout === 0) return { newResources: resources, famineData: null }

  const nourritureDispo = resources.nourriture || 0
  if (nourritureDispo >= cout) {
    // Peut payer
    return {
      newResources: { ...resources, nourriture: nourritureDispo - cout },
      famineData: null,
    }
  }

  // Famine : nourriture insuffisante
  const manque = cout - nourritureDispo
  // Populations pouvant mourir (pas N ni P)
  const mortsPossibles = FAMINE_ORDER.reduce((acc, type) => {
    if ((population[type] || 0) > 0) acc[type] = population[type]
    return acc
  }, {})

  return {
    newResources: { ...resources, nourriture: 0 },
    famineData: { manque, mortsPossibles, cout },
  }
}

/**
 * Applique les pertes de famine choisies par le joueur.
 * pertes = { fermier: N, ouvrier: N, ... }
 */
export function appliquerFamine(population, pertes) {
  const newPop = { ...population }
  for (const [type, nb] of Object.entries(pertes)) {
    newPop[type] = Math.max(0, (newPop[type] || 0) - nb)
  }
  return newPop
}

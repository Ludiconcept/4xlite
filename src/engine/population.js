/**
 * engine/population.js
 * Gestion des plafonds, surpopulation, famine
 */

export const POP_PER_TILE = 3
export const STORAGE_BASE = 10
export const STORAGE_PER_ENTREPOT = 5

// Ordre de priorité pour la famine : N et P nourris en dernier (protégés)
// F/O/A/G meurent en premier
export const FAMINE_ORDER  = ['fermier','ouvrier','artisan','guerrier','marin']
export const FAMINE_PROTECTED = ['pretre','noble']
export const ALL_POP_TYPES = [...FAMINE_ORDER, ...FAMINE_PROTECTED]

/**
 * Calcule le plafond de population.
 */
export function calcPopMax(map) {
  const playerTiles = map.flat().filter(t => t.owner === 'player')
  const nbTiles = playerTiles.length
  let bonusBatiments = 0
  for (const tile of playerTiles) {
    for (const b of (tile.buildings || [])) {
      if (b === 'cabane')   bonusBatiments += 3   // +1 général + 2 propre
      else if (b === 'immeuble') bonusBatiments += 6 // +1 général + 5 propre
      else bonusBatiments += 1                      // +1 général
    }
  }
  return nbTiles * POP_PER_TILE + bonusBatiments
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
  const excedent = Math.max(0, total - popMax)
  return Math.ceil(excedent / 5)  // 1 Nourriture nourrit 5 pop excédentaires
}

export function calcSurpopulationExcedent(population, map) {
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

  // Surpopulation : nourriture insuffisante
  const nourritureManquante = cout - nourritureDispo
  // Pop nourries = nourritureDispo * 5, pop non nourries = excédent - nourritureDispo*5
  const excedent = calcSurpopulationExcedent(population, map)
  const popNourries = nourritureDispo * 5
  const nbMorts = Math.max(0, excedent - popNourries)
  // Populations pouvant mourir (pas Noble ni Prêtre)
  const mortsPossibles = FAMINE_ORDER.reduce((acc, type) => {
    if ((population[type] || 0) > 0) acc[type] = population[type]
    return acc
  }, {})

  return {
    newResources: { ...resources, nourriture: 0 },
    famineData: { manque: nbMorts, mortsPossibles, cout, nourritureManquante },
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

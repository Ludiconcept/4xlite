/**
 * engine/exploration.js
 * Moteur d'exploration et de colonisation
 *
 * Règles CDC :
 * - Explorer : case adjacente orthogonalement à une case explorée
 * - Générer le terrain : 1 dé (1=Ma, 2=P, 3=D, 4=C, 5=Mo, 6=choix)
 * - Générer la ressource : 2 dés additionnés (tableau page 9 du PDF)
 * - Si ressource incompatible avec terrain → aucune ressource
 * - Coloniser : case explorée, non possédée, adjacente au territoire joueur
 *   + population totale > nb cases actuelles
 */

export const TERRAIN_FROM_DIE = {
  1: 'marais', 2: 'plaine', 3: 'desert', 4: 'colline', 5: 'montagne',
}

// Tableau 2 dés additionnés → ressource (page 9 PDF)
export const RESOURCE_FROM_2DICE = {
  2:  { type: 'foret',  bonus: 'gibier', terrains: ['colline','montagne'] },
  3:  { type: 'foret',  bonus: 'gibier', terrains: ['colline','montagne'] },
  4:  { type: 'foret',  bonus: 'gibier', terrains: ['colline','montagne'] },
  5:  { type: 'foret',  bonus: null,     terrains: ['plaine','colline','montagne'] },
  6:  { type: 'gibier', bonus: null,     terrains: ['marais','fleuve','lac'] },
  7:  { type: 'argile', bonus: null,     terrains: ['marais','plaine','desert'] },
  8:  { type: 'or',     bonus: null,     terrains: ['colline','montagne','desert','fleuve'] },
  9:  { type: null,     bonus: null,     terrains: [] },
  10: { type: 'fer',    bonus: null,     terrains: ['colline','montagne','desert'] },
  11: { type: 'fer',    bonus: null,     terrains: ['colline','montagne','desert'] },
  12: { type: 'fer',    bonus: null,     terrains: ['colline','montagne','desert'] },
}

/**
 * Retourne toutes les cases explorables (adjacentes orthogonalement à une case explorée)
 */
export function getCasesExplorables(map) {
  const result = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const tile = map[r][c]
      if (tile.explored) continue
      const voisins = [
        map[r-1]?.[c], map[r+1]?.[c],
        map[r]?.[c-1], map[r]?.[c+1],
      ]
      if (voisins.some(v => v?.explored)) result.push(tile)
    }
  }
  return result
}

/**
 * Retourne toutes les cases colonisables :
 * - Explorées, non possédées
 * - Adjacentes orthogonalement au territoire du joueur
 */
export function getCasesColonisables(map, populationTotale, nbCasesJoueur) {
  if (populationTotale <= nbCasesJoueur) return [] // condition population
  const result = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const tile = map[r][c]
      if (!tile.explored || tile.owner !== null) continue
      const voisins = [
        map[r-1]?.[c], map[r+1]?.[c],
        map[r]?.[c-1], map[r]?.[c+1],
      ]
      if (voisins.some(v => v?.owner === 'player')) result.push(tile)
    }
  }
  return result
}

/**
 * Génère le contenu d'une case explorée à partir des résultats de dés.
 * terrainDie : 1-6 (6 = choix libre → terrainChoice requis)
 * resourceDice : [d1, d2] — additionnés
 * hasFleuve : si la case a un fleuve
 * terrainChoice : terrain choisi si dé = 6
 */
export function genererCase(terrainDie, resourceDice, hasFleuve, isLac, terrainChoice = null) {
  // Terrain
  let terrain
  if (isLac) {
    terrain = 'lac'
  } else if (terrainDie === 6) {
    terrain = terrainChoice || 'plaine'
  } else {
    terrain = TERRAIN_FROM_DIE[terrainDie] || 'plaine'
  }

  // Pas de ressource sur un lac (gibier déjà présent)
  if (isLac) return { terrain, resource1: { type: 'gibier', quantity: 1 }, resource2: null }

  // Ressource
  const sum = resourceDice[0] + resourceDice[1]
  const resData = RESOURCE_FROM_2DICE[sum]
  let resource1 = null
  let resource2 = null

  if (resData && resData.type) {
    // Vérifier compatibilité terrain
    const compatTerrain = hasFleuve
      ? [...resData.terrains, 'fleuve'].includes(terrain) || resData.terrains.includes('fleuve')
      : resData.terrains.includes(terrain)

    if (compatTerrain) {
      resource1 = { type: resData.type, quantity: 1 }
      // Forêt + Gibier (résultats 2-4) → 2 ressources
      if (resData.bonus) {
        resource2 = { type: resData.bonus, quantity: 1 }
      }
    }
    // Sinon : aucune ressource (incompatible)
  }

  return { terrain, resource1, resource2 }
}

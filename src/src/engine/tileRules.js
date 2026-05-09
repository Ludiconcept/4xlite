/**
 * engine/tileRules.js
 * Règles de validation des actions sur les cases.
 */

// Terrains sur lesquels chaque ressource peut être placée
export const RESOURCE_TERRAIN_RULES = {
  foret_gibier: ['plaine','colline','montagne'],
  foret:        ['plaine','colline','montagne'],
  argile:       ['marais','plaine','desert'],
  gibier:       ['marais','fleuve','lac'],  // lac autorise uniquement gibier
  fer:          ['colline','montagne','desert'],
  or:           ['colline','montagne','desert'],
}

export function isResourceCompatible(resKey, terrain, hasFleuve, isLac) {
  const terrains = RESOURCE_TERRAIN_RULES[resKey]
  if (!terrains) return false
  if (isLac || terrain === 'lac') return resKey === 'gibier'
  if (hasFleuve && terrains.includes('fleuve')) return true
  return terrains.includes(terrain)
}

export function canBuildOnTile(tile) {
  if (!tile || !tile.explored) return false
  if (tile.owner !== 'player') return false
  if (tile.isLac || tile.terrain === 'lac') return false  // Lac : construction impossible
  if ((tile.buildings?.length ?? 0) >= 3) return false
  return true
}

export function canAddResourceToTile(tile) {
  if (!tile || !tile.explored) return false
  if (tile.isLac || tile.terrain === 'lac') {
    // Lac : seulement gibier, max 2 gibiers
    if (tile.resource1 && tile.resource2) return false
    return true // mais vérifier le type à l'appel
  }
  if (tile.resource1 && tile.resource2) return false
  return true
}

export function canColonizeTile(tile, playerPopTotal, playerTileCount) {
  if (!tile || !tile.explored || tile.owner !== null) return false
  return playerPopTotal > playerTileCount
}

export function canExploreTile(tile, map) {
  if (!tile || tile.explored) return false
  const { row, col } = tile
  const neighbors = [
    map?.[row-1]?.[col], map?.[row+1]?.[col],
    map?.[row]?.[col-1], map?.[row]?.[col+1],
  ]
  return neighbors.some(n => n?.explored)
}

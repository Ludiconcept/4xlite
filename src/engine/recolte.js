/**
 * engine/recolte.js
 * Moteur de récolte — action dé 1-2
 *
 * Règles CDC :
 * - Le joueur choisit Fermiers OU Ouvriers (pas les deux)
 * - Il répartit librement ses récoltes dans la limite de son nb de travailleurs
 * - La production est calculée case par case selon les bâtiments présents
 */

// ── Production par ressource ──────────────────────────────────

/**
 * Calcule la production totale disponible sur le territoire du joueur.
 * Retourne { nourriture: N, bois: N, argile: N, fer: N, or: N }
 */
export function calculerProduction(map, buildings_global, activeEffects) {
  const prod = { nourriture: 0, bois: 0, argile: 0, fer: 0, or: 0 }

  const playerTiles = map.flat().filter(t => t.owner === 'player' && t.explored)

  for (const tile of playerTiles) {
    const tileBuildings = tile.buildings || []
    const hasMine     = tileBuildings.includes('mine')
    const hasScierie  = tileBuildings.includes('scierie')

    // Fermes → nourriture
    const nbFermes = tileBuildings.filter(b => b === 'ferme').length
    // Volcan : ferme produit 3 au lieu de 1
    const fermeBonus = tile.hasVolcan ? 3 : 1
    prod.nourriture += nbFermes * fermeBonus

    // Ressources du terrain
    const resources = [tile.resource1, tile.resource2].filter(Boolean)
    for (const res of resources) {
      const bonus = 1 // +1 si bâtiment amplificateur

      switch (res.type) {
        case 'gibier':
          // Lac : gibier → nourriture via fermier
          prod.nourriture += 1 + (hasMine ? 0 : 0) // gibier pas affecté par mine
          break
        case 'foret':
        case 'bois':
          prod.bois += 1 + (hasScierie ? 1 : 0)
          break
        case 'argile':
          prod.argile += 1 + (hasMine ? 1 : 0)
          break
        case 'fer':
          prod.fer += 1 + (hasMine ? 1 : 0)
          break
        case 'or':
          prod.or += 1 + (hasMine ? 1 : 0)
          break
        default:
          break
      }
    }
  }

  // Bonus Palais : +1 Or par tranche de 5 cases contrôlées (arrondi inférieur)
  const nbPlayerTiles = playerTiles.length
  const hasPalais = map.flat().some(t => t.owner === 'player' && t.buildings?.includes('palais'))
  if (hasPalais) {
    prod.or += Math.floor(nbPlayerTiles / 5)
  }
  // Note : le bonus Palais est accessible aux Ouvriers (produit Or)

  return prod
}

/**
 * Production accessible selon le type de travailleur choisi.
 * Fermiers → nourriture + bois
 * Ouvriers → argile + fer + or
 */
export function getProductionForWorker(production, workerType) {
  if (workerType === 'fermier') {
    return { nourriture: production.nourriture, bois: production.bois }
  }
  if (workerType === 'ouvrier') {
    return { argile: production.argile, fer: production.fer, or: production.or }
  }
  return {}
}

/**
 * Applique une récolte sur les ressources du joueur.
 * harvest = { nourriture: N, bois: N, ... } — ce que le joueur choisit de récolter
 * Retourne les nouvelles ressources (plafonnées au storageMax)
 */
export function appliquerRecolte(resources, harvest, storageMax) {
  const newRes = { ...resources }
  let totalActuel = Object.values(newRes).reduce((a, b) => a + b, 0)

  for (const [type, amount] of Object.entries(harvest)) {
    if (amount <= 0) continue
    const disponible = storageMax - totalActuel
    const aAjouter = Math.min(amount, disponible)
    newRes[type] = (newRes[type] || 0) + aAjouter
    totalActuel += aAjouter
    if (totalActuel >= storageMax) break
  }

  return newRes
}

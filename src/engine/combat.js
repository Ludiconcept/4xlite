/**
 * engine/combat.js
 * Moteur de combat — action dé 4 (Attaquer)
 *
 * Règles CDC :
 * - Attaquant : 1D6 + valeur de combat des unités mobilisées
 * - Défenseur empire : 1D6 + Puissance de l'empire
 * - Défenseur joueur : 1D6 + valeur mobilisée + bonus bâtiments défensifs
 * - Pertes SYMÉTRIQUES : gagnant ET perdant perdent score adverse / 2 (arrondi sup.)
 * - Égalité : le défenseur gagne
 * - Coefficients : Guerrier ×1 partout, Marin ×2 Fleuve/Lac sinon ×0.5,
 *                 Chevalier ×2 Plaine/Désert sinon ×0.5
 */

// Coefficients de terrain par type d'unité
export const COEFF_TERRAIN = {
  guerrier: () => 1,
  marin:    (terrain, hasFleuve) => (hasFleuve || terrain === 'lac') ? 2 : 0.5,
  chevalier:(terrain)            => (terrain === 'plaine' || terrain === 'desert') ? 2 : 0.5,
}

/**
 * Calcule la valeur de combat d'une force mobilisée.
 * units = { guerrier: N, marin: N, chevalier: N }
 * terrain, hasFleuve : terrain de la case disputée
 */
export function calculerForce(units, terrain, hasFleuve) {
  let force = 0
  for (const [type, count] of Object.entries(units)) {
    if (!count) continue
    const coeff = COEFF_TERRAIN[type]?.(terrain, hasFleuve) ?? 1
    force += count * coeff
  }
  return Math.max(1, force)
}

/**
 * Retourne les bonus défensifs d'une case (bâtiments).
 */
export function getBonusDefensif(tile) {
  if (!tile || !tile.owner) return 0
  const buildings = tile.buildings || []
  let bonus = 0
  if (buildings.includes('tourDeGuet')) bonus += 1
  if (buildings.includes('forteresse')) bonus += 3
  if (buildings.includes('palais'))     bonus += 3 // Architecture royale
  return bonus
}

/**
 * Retourne les cases attaquables depuis le territoire du joueur.
 * Inclut les cases ennemies adjacentes ET (si case sur bord) l'option "attaque directe empire".
 */
export function getCasesAttaquables(map) {
  const cases = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const tile = map[r][c]
      if (!tile.owner || tile.owner === 'player') continue
      const voisins = [map[r-1]?.[c], map[r+1]?.[c], map[r]?.[c-1], map[r]?.[c+1]]
      if (voisins.some(v => v?.owner === 'player')) cases.push(tile)
    }
  }
  return cases
}

/**
 * Retourne les empires pouvant être attaqués directement
 * (le joueur a une case sur le bord correspondant à un empire).
 */
export function getEmpiresAttaquablesDirectement(map) {
  // EMPIRE_POSITIONS: top=1, right=2, bottom=3, left=4
  const BORDS = {
    1: t => t.row === 0,
    2: t => t.col === 4,
    3: t => t.row === 4,
    4: t => t.col === 0,
  }
  return Object.entries(BORDS)
    .filter(([, test]) => map.flat().some(t => t.owner === 'player' && test(t)))
    .map(([id]) => Number(id))
}

/**
 * Résout un combat joueur vs empire (pour une case).
 * Returns { attaquantGagne, scoreAttaquant, scoreDefenseur, pertesAttaquant, pertesDefenseur, bonusDefense }
 */
export function resoudreCombat({ unitsAttaquant, unitsDefenseur, terrain, hasFleuve, empireBonus = 0, bonusDefense = 0 }) {
  const de1 = Math.floor(Math.random() * 6) + 1
  const de2 = Math.floor(Math.random() * 6) + 1

  const forceAtt = calculerForce(unitsAttaquant, terrain, hasFleuve)
  const forceDef = typeof unitsDefenseur === 'number'
    ? unitsDefenseur   // empire : puissance directe
    : calculerForce(unitsDefenseur, terrain, hasFleuve)

  const scoreAtt = de1 + forceAtt
  const scoreDef = de2 + forceDef + bonusDefense + empireBonus

  const attaquantGagne = scoreAtt > scoreDef // égalité → défenseur gagne

  // Pertes symétriques : chaque camp perd score adverse / 2 arrondi sup.
  const pertesAttaquant  = Math.ceil(scoreDef / 2)
  const pertesDefenseur  = Math.ceil(scoreAtt / 2)

  return {
    attaquantGagne, scoreAttaquant: scoreAtt, scoreDefenseur: scoreDef,
    pertesAttaquant, pertesDefenseur,
    de1, de2, forceAtt, forceDef,
  }
}

/**
 * Applique les résultats du combat sur le game state.
 * targetKey = 'r-c' pour case, ou empireId pour attaque directe
 */
export function appliquerCombat({ game, resultat, unitsUsed, targetKey, isDirectAttack, empireId }) {
  let newMap       = game.map
  let newPop       = { ...game.population }
  let newEmpires   = { ...game.empires }

  if (isDirectAttack) {
    // Attaque directe : réduire la puissance de l'empire
    const emp = newEmpires[empireId] || { power: 4, maxPower: 8 }
    const newPower = Math.max(0, emp.power - resultat.pertesDefenseur)
    const newMaxPower = newPower === 0 ? Math.max(0, (emp.maxPower || 8) - (resultat.pertesDefenseur - emp.power)) : emp.maxPower
    newEmpires = { ...newEmpires, [empireId]: { ...emp, power: newPower, maxPower: newMaxPower } }
  } else {
    const [r, c] = targetKey.split('-').map(Number)
    const tile   = newMap[r][c]
    const empId  = tile.owner

    if (resultat.attaquantGagne) {
      // Le joueur prend la case
      newMap = newMap.map(row => row.map(t => {
        if (t.row !== r || t.col !== c) return t
        return {
          ...t, owner: 'player',
          playerBuildingsPreserved: t.buildings?.filter(b => b) || [],
          buildings: [],
        }
      }))
      // Réduire puissance empire
      if (empId && newEmpires[empId]) {
        const emp = newEmpires[empId]
        newEmpires = { ...newEmpires, [empId]: { ...emp, power: Math.max(0, emp.power - resultat.pertesDefenseur) } }
      }
    } else {
      // L'empire tient la case, l'empire subit quand même des dégâts
      if (empId && newEmpires[empId]) {
        const emp = newEmpires[empId]
        newEmpires = { ...newEmpires, [empId]: { ...emp, power: Math.max(0, emp.power - resultat.pertesDefenseur) } }
      }
    }
  }

  // Pertes joueur : retirer les guerriers mobilisés (proportionnellement aux pertes)
  const totalMobilise = Object.values(unitsUsed).reduce((a, b) => a + b, 0)
  if (totalMobilise > 0 && resultat.pertesAttaquant > 0) {
    const pertesReelles = Math.min(resultat.pertesAttaquant, totalMobilise)
    // Retirer en priorité les guerriers
    let reste = pertesReelles
    for (const type of ['guerrier','marin','chevalier']) {
      const lost = Math.min(reste, unitsUsed[type] || 0)
      newPop = { ...newPop, [type]: Math.max(0, (newPop[type] || 0) - lost) }
      reste -= lost
      if (reste <= 0) break
    }
  }

  return { ...game, map: newMap, population: newPop, empires: newEmpires }
}

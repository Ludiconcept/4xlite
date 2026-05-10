/**
 * engine/tourEmpires.js
 * Logique du tour des empires adverses.
 */

import { EMPIRE_CONFIG } from '../data/empireConfig.js'
import { resoudreD40 } from '../data/d40Config.js'
import { getEvenementActuel, DERNIER_EVENEMENT_IDX } from '../data/evenements.js'

/** Lance 4 dés (1-6) pour le tour des empires */
export function lancerDesEmpires() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
}

/** Lance 2 dés (pour l'événement montée en puissance) */
export function lancer2Des() {
  return Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1)
}

/** Lance 1D40 */
export function lancerD40() {
  return Math.floor(Math.random() * 40) + 1
}

/**
 * Résoudre un dé empire.
 * Retourne { type, description, newGame, needsPlayerChoice }
 */
export function resoudreDe(valeur, game, options = {}) {
  switch (valeur) {
    case 1: case 2: case 3: case 4:
      return resoudrePuissance(valeur, game)
    case 5:
      return resoudreEvenement(game)
    case 6:
      return resoudreD40Action(game, options.d40Value)
    default:
      return { type: 'rien', description: 'Rien ne se passe.', newGame: game }
  }
}

/** Dé 1-4 : empire gagne +2 Puissance */
function resoudrePuissance(empireId, game) {
  const emp    = game.empires?.[empireId] || { power: 2, maxPower: 8 }
  const newPow = Math.min(emp.maxPower || 8, (emp.power || 0) + 2)
  const cfg    = EMPIRE_CONFIG[empireId]
  const newGame = {
    ...game,
    empires: {
      ...game.empires,
      [empireId]: { ...emp, power: newPow }
    }
  }
  // Vérifier condition de défaite
  const defaite = newPow >= 20
  return {
    type: 'puissance',
    empireId,
    description: `${cfg.emoji} ${cfg.name} : +2 Puissance (${emp.power} → ${newPow})`,
    newGame,
    defaite,
    defaiteMsg: defaite ? `${cfg.name} atteint 20 de Puissance ! Vous perdez la partie.` : null,
  }
}

/** Dé 5 : avancer sur la piste des événements */
function resoudreEvenement(game) {
  const currentIdx = game.eventIndex ?? 0
  // Si déjà au dernier, rester (mais redéclencher)
  const newIdx   = currentIdx >= DERNIER_EVENEMENT_IDX ? DERNIER_EVENEMENT_IDX : currentIdx + 1
  const evenement = getEvenementActuel(newIdx)

  // Vérifier si l'effet "Pression impériale" est actif
  let newGame = { ...game, eventIndex: newIdx }

  // Si pression impériale active, augmenter le plus puissant
  if (game.activeEffects?.pressionImperialeActive) {
    newGame = appliquerPressionImperiale(newGame)
  }

  return {
    type: 'evenement',
    evenement,
    newEventIndex: newIdx,
    description: `📋 Événement ${newIdx + 1} : ${evenement.titre}`,
    newGame,
    needsPlayerChoice: evenement.type === 'choixJoueur',
    applyImmediately: evenement.type === 'immediat',
  }
}

/** Dé 6 : résoudre D40 */
function resoudreD40Action(game, d40Value) {
  if (!d40Value || !game.configD40) {
    return { type: 'd40', description: 'D40 : configuration manquante.', newGame: game }
  }

  const cible = resoudreD40(d40Value, game.configD40)
  if (!cible) return { type: 'd40', description: `D40 ${d40Value} : aucune cible.`, newGame: game }

  const { empireId, row, col } = cible
  const cfg = EMPIRE_CONFIG[empireId]
  const emp = game.empires?.[empireId] || { power: 2, maxPower: 8 }

  // Trouver la case suivante sur la ligne/colonne (depuis le bord vers l'intérieur)
  const caseSuivante = trouverCaseSuivante(game.map, row, col, empireId)

  if (!caseSuivante) {
    return {
      type: 'd40', empireId, d40: d40Value,
      description: `${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Aucune case disponible.`,
      newGame: game,
    }
  }

  const tileTarget = game.map[caseSuivante.row]?.[caseSuivante.col]
  const isOccupied = tileTarget?.owner && tileTarget.owner !== ''

  if (isOccupied) {
    // Attaque uniquement si puissance ≥ 1
    if ((emp.power || 0) < 1) {
      return {
        type: 'd40', empireId, d40: d40Value, action: 'pasAttaque',
        description: `${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Puissance 0, pas d'attaque sur (${caseSuivante.col+1},${caseSuivante.row+1}).`,
        newGame: game,
        highlightCase: caseSuivante,
      }
    }
    return {
      type: 'd40', empireId, d40: d40Value, action: 'attaque',
      description: `${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Attaque sur (${caseSuivante.col+1},${caseSuivante.row+1}) !`,
      newGame: game,
      highlightCase: caseSuivante,
      targetCase: caseSuivante,
      needsCombat: tileTarget?.owner === 'player',
      isEmpireVsEmpire: tileTarget?.owner !== 'player',
      attackerEmpireId: empireId,
      defenderOwnerId: tileTarget?.owner,
    }
  } else {
    // Colonisation
    const newMap = game.map.map(r => r.map(t => {
      if (t.row !== caseSuivante.row || t.col !== caseSuivante.col) return t
      return { ...t, owner: String(empireId), explored: true }
    }))
    return {
      type: 'd40', empireId, d40: d40Value, action: 'colonisation',
      description: `${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Colonise (${caseSuivante.col+1},${caseSuivante.row+1}).`,
      newGame: { ...game, map: newMap },
      highlightCase: caseSuivante,
    }
  }
}

/**
 * Trouver la case suivante depuis le bord vers l'intérieur sur la ligne/colonne.
 * L'empire part de sa case la plus proche sur cette ligne/colonne.
 */
function trouverCaseSuivante(map, row, col, empireId) {
  const empIdStr = String(empireId)

  // Déterminer direction selon le bord de départ
  // Bord haut (row=0) → descend (row+1)
  // Bord bas (row=4) → monte (row-1)
  // Bord droite (col=4) → va à gauche (col-1)
  // Bord gauche (col=0) → va à droite (col+1)
  let dr = 0, dc = 0
  if      (row === 0) { dr = 1;  dc = 0 }
  else if (row === 4) { dr = -1; dc = 0 }
  else if (col === 4) { dr = 0;  dc = -1 }
  else if (col === 0) { dr = 0;  dc = 1 }

  // Trouver la case de l'empire la plus proche sur cette ligne/colonne
  let empireCase = null
  for (let step = 0; step < 5; step++) {
    const r = row + dr * step, c = col + dc * step
    if (r < 0 || r > 4 || c < 0 || c > 4) break
    if (map[r]?.[c]?.owner === empIdStr) { empireCase = { row: r, col: c, step }; break }
  }

  if (!empireCase) {
    // Pas de case empire sur cette ligne/colonne — partir du bord
    const nextR = row + dr, nextC = col + dc
    if (nextR < 0 || nextR > 4 || nextC < 0 || nextC > 4) return null
    return { row: nextR, col: nextC }
  }

  // Case suivante après la case empire
  const nextR = empireCase.row + dr, nextC = empireCase.col + dc
  if (nextR < 0 || nextR > 4 || nextC < 0 || nextC > 4) return null
  return { row: nextR, col: nextC }
}

/** Résoudre combat empire vs joueur */
export function resoudreCombatEmpire(empireId, tile, game) {
  const emp = game.empires?.[empireId] || { power: 2, maxPower: 8 }
  const de1 = Math.floor(Math.random() * 6) + 1
  const de2 = Math.floor(Math.random() * 6) + 1
  const scoreDef = de1 + (game.population.guerrier || 0) // joueur défend
  const scoreAtt = de2 + (emp.power || 2)

  const empireGagne = scoreAtt > scoreDef
  const pertesJoueur = empireGagne ? Math.ceil(scoreAtt / 2) : 0
  const pertesEmpire = Math.ceil(scoreDef / 2)

  let newGame = { ...game }
  if (empireGagne) {
    // L'empire prend la case
    newGame.map = game.map.map(r => r.map(t =>
      t.row === tile.row && t.col === tile.col ? { ...t, owner: String(empireId) } : t
    ))
    // Pertes joueur en guerriers
    const guerriersPertes = Math.min(pertesJoueur, game.population.guerrier || 0)
    newGame.population = { ...game.population, guerrier: Math.max(0, (game.population.guerrier||0) - guerriersPertes) }
  }
  // Pertes empire
  const emp2 = game.empires?.[empireId] || { power: 2, maxPower: 8 }
  newGame.empires = { ...newGame.empires, [empireId]: { ...emp2, power: Math.max(0, emp2.power - pertesEmpire) } }

  return {
    empireGagne, scoreAtt, scoreDef, de1, de2,
    pertesJoueur: empireGagne ? Math.min(pertesJoueur, game.population.guerrier||0) : 0,
    pertesEmpire, newGame,
  }
}

/** Appliquer l'événement "Expansion impériale" */
export function appliquerExpansionImperiale(game) {
  const newEmpires = { ...game.empires }
  for (let id = 1; id <= 4; id++) {
    const cases = game.map.flat().filter(t => t.owner === String(id)).length
    const bonus  = Math.floor(cases / 2)
    const emp    = newEmpires[id] || { power: 2, maxPower: 8 }
    newEmpires[id] = { ...emp, maxPower: (emp.maxPower || 8) + bonus }
  }
  return { ...game, empires: newEmpires }
}

/** Appliquer "Pression impériale" (bonus au plus puissant) */
export function appliquerPressionImperiale(game) {
  let maxPow = -1, maxId = null
  for (let id = 1; id <= 4; id++) {
    const pow = game.empires?.[id]?.power || 0
    if (pow > maxPow) { maxPow = pow; maxId = id }
  }
  if (!maxId) return game
  const emp = game.empires[maxId]
  return {
    ...game,
    empires: { ...game.empires, [maxId]: { ...emp, power: emp.power + 1, maxPower: (emp.maxPower||8) + 1 } }
  }
}

/** Appliquer "Hégémonie" (empire le plus puissant colonise 3 cases proches) */
export function appliquerHegemonieEmpire(game) {
  let maxPow = -1
  const maxIds = []
  for (let id = 1; id <= 4; id++) {
    const pow = game.empires?.[id]?.power || 0
    if (pow > maxPow) { maxPow = pow; maxIds.length = 0; maxIds.push(id) }
    else if (pow === maxPow) maxIds.push(id)
  }
  const nbCases = maxIds.length === 1 ? 3 : 2
  let newMap = game.map
  for (const id of maxIds) {
    newMap = coloniserCasesProches(newMap, id, nbCases)
  }
  return { ...game, map: newMap }
}

/** Coloniser N cases non occupées les plus proches d'un empire */
function coloniserCasesProches(map, empireId, nb) {
  const BORDS = {
    1: t => t.row === 0, 2: t => t.col === 4,
    3: t => t.row === 4, 4: t => t.col === 0,
  }
  const estBordEmpire = BORDS[empireId]
  const casesLibres = map.flat()
    .filter(t => !t.owner && t.explored)
    .sort((a, b) => {
      // Trier par distance au bord de l'empire
      const distA = estBordEmpire(a) ? 0 : Math.min(a.row, 4-a.row, a.col, 4-a.col)
      const distB = estBordEmpire(b) ? 0 : Math.min(b.row, 4-b.row, b.col, 4-b.col)
      return distA - distB
    })
    .slice(0, nb)

  return map.map(r => r.map(t => {
    if (casesLibres.some(c => c.row === t.row && c.col === t.col))
      return { ...t, owner: String(empireId) }
    return t
  }))
}

/** Appliquer effets nextTurn au début du tour joueur */
export function appliquerEffetsNextTurn(game) {
  const nte = game.nextTurnEffects || {}
  let newGame = { ...game }

  if (nte.bonus3Des) {
    newGame = { ...newGame, activeEffects: { ...newGame.activeEffects, servageActif: true } }
  }
  if (nte.batimentsMoinsCher) {
    newGame = { ...newGame, activeEffects: { ...newGame.activeEffects, batimentsMoinsChers: true } }
  }
  if (nte.etudierGratuit) {
    newGame = { ...newGame, activeEffects: { ...newGame.activeEffects, etudierGratuit: true } }
  }
  if (nte.explosionDemo) {
    newGame = { ...newGame, activeEffects: { ...newGame.activeEffects, explosionDemo: true } }
  }

  // Reset nextTurnEffects
  newGame = { ...newGame, nextTurnEffects: {} }
  return newGame
}

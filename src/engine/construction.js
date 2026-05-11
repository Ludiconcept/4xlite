/**
 * engine/construction.js — Sprint 4b v2
 */

import { canBuildOnTile } from './tileRules.js'

export const BATIMENTS = {
  ferme: {
    id: 'ferme', name: 'Ferme', emoji: '🏠',
    description: 'Produit 1 Nourriture. +3 capacité pop. max. Gratuit en Plaine, coûte 1 Bois/Fer/Argile en Colline.',
    // Terrain : plaine gratuit, colline coûte 1 Bois/Fer/Argile au choix, montagne non constructible de base
    terrains: ['plaine', 'colline'],
    cout: { ressources: {}, population: {} },
    coutColline: ['bois', 'fer', 'argile'], // joueur choisit
    maxParCase: 1,
    effet: 'nourriture+1, popMax+3',
  },
  mine: {
    id: 'mine', name: 'Mine', emoji: '⛏️',
    description: 'Chaque ressource Fer/Argile/Or sur la case produit +1.',
    terrains: ['marais','plaine','desert','colline','montagne','lac'],
    requiresResource: ['fer','argile','or'], // au moins une de ces ressources sur la case
    cout: { ressources: { bois: 3 }, population: {} },
    maxParCase: 1,
    effet: 'ressources+1',
  },
  scierie: {
    id: 'scierie', name: 'Scierie', emoji: '🪚',
    description: 'Chaque ressource Bois/Forêt sur la case produit +1.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    requiresResource: ['bois','foret'], // au moins une forêt sur la case
    cout: { ressources: { bois: 2, argile: 2, fer: 1 }, population: {} },
    maxParCase: 1,
    effet: 'bois+1',
  },
  tourDeGuet: {
    id: 'tourDeGuet', name: 'Tour de guet', emoji: '🗼',
    description: '+1 guerrier défensif. -1 perte si victoire en défense.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 3 }, population: { guerrier: 1 } },
    maxParCase: 1,
  },
  forteresse: {
    id: 'forteresse', name: 'Forteresse', emoji: '🏰',
    description: '+3 guerriers défensifs. -1 perte si victoire en défense.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 3, argile: 5, fer: 2 }, population: { guerrier: 2 } },
    maxParCase: 1,
  },
  palais: {
    id: 'palais', name: 'Palais', emoji: '👑',
    description: '+5 Or par 5 cases (récolte, arrondi inf.). 1 max. Débloque Servage.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 5, argile: 5, fer: 5, or: 5 }, population: { pretre: 1, noble: 1 } },
    maxParCase: 1, maxTotal: 1,
  },
  marche: {
    id: 'marche', name: 'Marché', emoji: '🏪',
    description: 'Commerce amélioré : 1 Or = 2 ressources.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 3, or: 2 }, population: { artisan: 1 } },
    maxParCase: 1,
  },
  hopital: {
    id: 'hopital', name: 'Hôpital', emoji: '🏥',
    description: 'Débloque l\'action Soigner (-1 perte en combat). Max 1.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 2, argile: 2, nourriture: 2 }, population: { pretre: 1 } },
    maxParCase: 1, maxTotal: 1,
  },
  universite: {
    id: 'universite', name: 'Université', emoji: '🎓',
    description: 'Débloque l\'action Former (changer type de pop). Max 1.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 2, argile: 2, or: 2 }, population: { pretre: 1 } },
    maxParCase: 1, maxTotal: 1,
  },
  ambassade: {
    id: 'ambassade', name: 'Ambassade', emoji: '🤝',
    description: 'Attribuée à 1 empire. Débloque Diplomatie contre cet empire. Max 4.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 3, argile: 3, fer: 3, or: 3 }, population: { guerrier: 1, noble: 1 } },
    maxParCase: 1, maxTotal: 4,
    needsEmpireChoice: true,
  },
  entrepot: {
    id: 'entrepot', name: 'Entrepôt', emoji: '📦',
    description: '+4 emplacements de stockage. Coût : 2 Bois OU 2 Argile.',
    terrains: ['marais','plaine','desert','colline','montagne'],
    cout: { ressources: { bois: 2 }, population: {} },
    altCout: { argile: 2 },
    maxParCase: 1,
  },
}

// ── Validation ────────────────────────────────────────────────
export function peutConstruire(batimentId, tile, game, collineMat = null) {
  const bat = BATIMENTS[batimentId]
  if (!bat) return { ok: false, raison: 'Bâtiment inconnu.' }

  if (!canBuildOnTile(tile)) {
    if (tile.isLac || tile.terrain === 'lac') return { ok: false, raison: 'Construction impossible sur un Lac.' }
    return { ok: false, raison: 'Construction impossible.' }
  }

  // Terrain compatible
  if (!bat.terrains.includes(tile.terrain)) {
    return { ok: false, raison: `Non constructible sur ce terrain (${tile.terrain}).` }
  }

  // Ferme colline : besoin d'une ressource au choix
  if (batimentId === 'ferme' && tile.terrain === 'colline') {
    if (collineMat) {
      if ((game.resources[collineMat] || 0) < 1)
        return { ok: false, raison: `Ressource insuffisante (manque 1 ${collineMat}).` }
    } else {
      const hasAny = ['bois','fer','argile'].some(r => (game.resources[r] || 0) >= 1)
      if (!hasAny) return { ok: false, raison: 'Manque 1 Bois, Fer ou Argile pour construire en Colline.' }
    }
  }

  // Ressource requise sur la case (Mine, Scierie)
  if (bat.requiresResource) {
    const tileResources = [tile.resource1?.type, tile.resource2?.type].filter(Boolean)
    const hasRequired = tileResources.some(r => bat.requiresResource.includes(r))
    if (!hasRequired) {
      const label = batimentId === 'mine' ? 'Fer, Argile ou Or' : 'Bois ou Forêt'
      return { ok: false, raison: `Nécessite ${label} sur cette case.` }
    }
  }

  // Max 3 bâtiments par case — si plein, le composant proposera de remplacer
  const existing = tile.buildings || []
  // Si la case est pleine, on signale avec un flag spécial (pas un refus)
  if (existing.length >= 3) return { ok: false, raison: 'Case complète (3 bâtiments max).', casePleine: true }

  const countSame = existing.filter(b => b === batimentId).length
  if (countSame >= (bat.maxParCase || 1)) {
    return { ok: false, raison: `${bat.name} déjà présent sur cette case.` }
  }

  // Max global
  if (bat.maxTotal) {
    const total = game.map.flat().filter(t => t.buildings?.includes(batimentId)).length
    if (total >= bat.maxTotal) return { ok: false, raison: `${bat.name} déjà construit (max ${bat.maxTotal}).` }
  }

  // Ambassade : vérifier qu'il reste des empires sans ambassade
  if (batimentId === 'ambassade') {
    const empAvec = game.map.flat()
      .flatMap(t => t.buildings?.filter(b => b === 'ambassade').map(() => t.ambassadeEmpire) || [])
      .filter(Boolean)
    if (empAvec.length >= 4) return { ok: false, raison: 'Ambassade déjà attribuée aux 4 empires.' }
  }

  // Ressources (coût principal)
  const coutRes = bat.cout.ressources || {}
  const allMainOk = Object.entries(coutRes).every(([r, q]) => (game.resources[r] || 0) >= q)
  const altCoutOk = bat.altCout
    ? Object.entries(bat.altCout).every(([r, q]) => (game.resources[r] || 0) >= q)
    : false
  if (!allMainOk && !altCoutOk) {
    const manque = Object.entries(coutRes).filter(([r, q]) => (game.resources[r] || 0) < q)
      .map(([r, q]) => `${q} ${r}`).join(', ')
    return { ok: false, raison: `Ressources insuffisantes (${manque}).` }
  }

  // Population
  for (const [type, qte] of Object.entries(bat.cout.population || {})) {
    if ((game.population[type] || 0) < qte)
      return { ok: false, raison: `Population insuffisante (manque ${qte} ${type}).` }
  }

  return { ok: true, raison: null }
}

export function appliquerConstruction(batimentId, tileKey, game, opts = {}) {
  const bat = BATIMENTS[batimentId]
  if (!bat) return game
  const [r, c] = tileKey.split('-').map(Number)
  let newRes = { ...game.resources }
  let newPop = { ...game.population }

  // Déduire ressources
  const coutRes = opts.useAlt ? (bat.altCout || bat.cout.ressources) : bat.cout.ressources
  for (const [res, qte] of Object.entries(coutRes || {})) {
    newRes[res] = (newRes[res] || 0) - qte
  }
  // Ferme colline
  if (batimentId === 'ferme' && opts.collineMat) {
    newRes[opts.collineMat] = (newRes[opts.collineMat] || 0) - 1
  }
  // Déduire population
  for (const [type, qte] of Object.entries(bat.cout.population || {})) {
    newPop[type] = (newPop[type] || 0) - qte
  }

  // Ajouter bâtiment sur la case
  const newMap = game.map.map(row => row.map(t => {
    if (t.row !== r || t.col !== c) return t
    const newBuildings = [...(t.buildings || []), batimentId]
    const extra = batimentId === 'ambassade' && opts.empireId
      ? { ambassadeEmpire: opts.empireId }
      : {}
    return { ...t, buildings: newBuildings, ...extra }
  }))

  // Effets immédiats
  let newStorageMax = game.storageMax || 8
  if (batimentId === 'entrepot') newStorageMax += 4

  return { ...game, map: newMap, resources: newRes, population: newPop, storageMax: newStorageMax }
}

export function getBatimentsDisponibles(tile, game) {
  return Object.values(BATIMENTS).map(bat => ({
    ...bat,
    disponibilite: peutConstruire(bat.id, tile, game),
  }))
}

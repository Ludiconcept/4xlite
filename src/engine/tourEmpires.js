/**
 * engine/tourEmpires.js — v3
 */
import { EMPIRE_CONFIG } from '../data/empireConfig.js'
import { resoudreD40 } from '../data/d40Config.js'
import { getEvenementActuel, DERNIER_EVENEMENT_IDX } from '../data/evenements.js'

export function lancerDesEmpires(n=4) {
  return Array.from({length:n}, ()=>Math.floor(Math.random()*6)+1)
}
export function lancerD40() { return Math.floor(Math.random()*40)+1 }

/**
 * Trouver la case cible : depuis le bord, avancer de l'extérieur vers l'intérieur
 * jusqu'à trouver une case n'appartenant pas à l'empire.
 */
export function trouverCaseCible(map, borderRow, borderCol, dr, dc, empireId) {
  const empStr = String(empireId)
  // Parcourir depuis le bord vers l'intérieur
  for (let step=0; step<=4; step++) {
    const r = borderRow + dr*step
    const c = borderCol + dc*step
    if (r<0||r>4||c<0||c>4) break
    const owner = map[r]?.[c]?.owner
    // Si la case n'appartient pas à l'empire → c'est la cible
    if (owner !== empStr) {
      return { row:r, col:c }
    }
  }
  return null // toute la ligne/colonne appartient à l'empire
}

export function resoudreDe(valeur, game, d40Value=null) {
  switch(valeur) {
    case 1: case 2: case 3: case 4: return resoudrePuissance(valeur, game)
    case 5: return resoudreEvenement(game)
    case 6: return resoudreD40Action(game, d40Value ?? lancerD40())
    default: return { type:'rien', description:'Rien.', newGame:game }
  }
}

function resoudrePuissance(empireId, game) {
  const emp    = game.empires?.[empireId] || { power:2, maxPower:8 }
  // Si maxPower = 0, la puissance ne peut pas augmenter
  if ((emp.maxPower||0) <= 0) {
    const cfg = EMPIRE_CONFIG[empireId]
    return { type:'puissance', empireId, description:`${cfg.emoji} ${cfg.name} : Puissance bloquée (max 0)`, newGame:game, defaite:false }
  }
  const newPow = Math.min(emp.maxPower||8, (emp.power||0)+2)
  const cfg    = EMPIRE_CONFIG[empireId]
  const newGame = { ...game, empires:{ ...game.empires, [empireId]:{ ...emp, power:newPow } } }
  const defaite = newPow >= 20
  return {
    type:'puissance', empireId,
    description:`${cfg.emoji} ${cfg.name} : +2 Puissance (${emp.power} → ${newPow})`,
    newGame, defaite,
  }
}

function resoudreEvenement(game) {
  const currentIdx = game.eventIndex ?? 0
  const newIdx     = currentIdx >= DERNIER_EVENEMENT_IDX ? DERNIER_EVENEMENT_IDX : currentIdx+1
  const evenement  = getEvenementActuel(newIdx)
  const newGame    = { ...game, eventIndex:newIdx }
  return {
    type:'evenement', evenement, newEventIndex:newIdx,
    description:`📋 Événement ${newIdx+1} : ${evenement.titre}`,
    newGame,
    needsPlayerChoice: evenement.type === 'choixJoueur',
    isNextTurn: evenement.type === 'nextTurn',
  }
}

function resoudreD40Action(game, d40Value) {
  if (!game.configD40) return { type:'d40', description:'D40 : config manquante.', newGame:game }
  const cible = resoudreD40(d40Value, game.configD40)
  if (!cible) return { type:'d40', description:`D40 ${d40Value} : aucune cible.`, newGame:game }

  const { empireId, row:bRow, col:bCol, dr, dc } = cible
  const cfg = EMPIRE_CONFIG[empireId]
  const emp = game.empires?.[empireId] || { power:0, maxPower:8 }

  const caseCible = trouverCaseCible(game.map, bRow, bCol, dr, dc, empireId)
  if (!caseCible) {
    return { type:'d40', empireId, d40:d40Value, action:'impossible',
      description:`${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Ligne/colonne déjà entièrement contrôlée.`,
      newGame:game }
  }

  const tile     = game.map[caseCible.row]?.[caseCible.col]
  const isOccupied = tile?.owner && tile.owner !== ''

  // Case de départ de l'empire pour animation (la dernière case empire avant la cible)
  const startCase = trouverDerniereCase(game.map, bRow, bCol, dr, dc, empireId) || { row:bRow, col:bCol }

  if (isOccupied) {
    if ((emp.power||0) < 1) {
      return { type:'d40', empireId, d40:d40Value, action:'pasAttaque',
        description:`${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Puissance 0, attaque annulée.`,
        newGame:game, targetCase:caseCible, startCase }
    }
    const isPlayerCase = tile.owner === 'player'
    return {
      type:'d40', empireId, d40:d40Value, action:'attaque',
      description:`${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Attaque (${caseCible.col+1},${caseCible.row+1}) !`,
      newGame:game, targetCase:caseCible, startCase,
      needsPlayerChoice:isPlayerCase, isPlayerCase,
      defenderOwner:tile.owner,
    }
  } else {
    const newMap = game.map.map(r=>r.map(t=>
      t.row===caseCible.row&&t.col===caseCible.col ? {
        ...t, owner:String(empireId), explored:true,
        // Préserver les bâtiments du joueur si applicable
        playerBuildingsPreserved: t.owner==='player' ? (t.buildings||[]) : (t.playerBuildingsPreserved||[]),
        buildings: t.owner==='player' ? [] : (t.buildings||[]),
      } : t
    ))
    return {
      type:'d40', empireId, d40:d40Value, action:'colonisation',
      description:`${cfg.emoji} ${cfg.name} (D40:${d40Value}) — Colonise (${caseCible.col+1},${caseCible.row+1}).`,
      newGame:{...game,map:newMap}, targetCase:caseCible, startCase,
    }
  }
}

function trouverDerniereCase(map, bRow, bCol, dr, dc, empireId) {
  const empStr = String(empireId)
  let last = null
  for (let step=0; step<=4; step++) {
    const r=bRow+dr*step, c=bCol+dc*step
    if (r<0||r>4||c<0||c>4) break
    if (map[r]?.[c]?.owner === empStr) last = {row:r,col:c}
    else break
  }
  return last
}

export function resoudreCombatEmpireVsJoueur(empireId, tile, game, guerriersJoueur) {
  const emp  = game.empires?.[empireId] || { power:2, maxPower:8 }
  const de1  = Math.floor(Math.random()*6)+1
  const de2  = Math.floor(Math.random()*6)+1
  // Bonus défensif de la case (Tour de guet, Forteresse)
  const buildings = tile?.buildings || []
  const bonusDef = (buildings.includes('tourDeGuet') ? 2 : 0) + (buildings.includes('forteresse') ? 5 : 0)
  const scoreDef = de1 + guerriersJoueur + bonusDef
  const scoreAtt = de2 + (emp.power||2)
  const empireGagne = scoreAtt > scoreDef
  const pertesJoueur = Math.min(Math.ceil(scoreAtt/2), guerriersJoueur)
  // Réduction bâtiments défensifs si victoire : exposée séparément pour affichage et confirmation
  const reductionTourDeGuet = (!empireGagne && buildings.includes('tourDeGuet')) ? 1 : 0
  const reductionForteresse = (!empireGagne && buildings.includes('forteresse')) ? 2 : 0
  const pertesEmpire = Math.ceil(scoreDef/2)
  let newGame = {...game}
  if (empireGagne) {
    newGame.map = game.map.map(r=>r.map(t=>
      t.row===tile.row&&t.col===tile.col ? {
        ...t, owner:String(empireId),
        playerBuildingsPreserved: t.owner==='player' ? (t.buildings||[]) : (t.playerBuildingsPreserved||[]),
        buildings: t.owner==='player' ? [] : (t.buildings||[]),
      } : t
    ))
  }
  newGame.population = {...game.population, guerrier:Math.max(0,(game.population.guerrier||0)-pertesJoueur)}
  newGame.empires = {...newGame.empires, [empireId]:{...emp, power:Math.max(0,emp.power-pertesEmpire)}}
  return { empireGagne, scoreAtt, scoreDef, de1, de2, pertesJoueur, pertesEmpire, bonusDef, reductionTourDeGuet, reductionForteresse, newGame }
}

export function resoudreCombatEmpireVsEmpire(attackerId, defenderId, tile, game) {
  const attEmp = game.empires?.[attackerId] || { power:2, maxPower:8 }
  const defEmp = game.empires?.[defenderId] || { power:2, maxPower:8 }
  const de1 = Math.floor(Math.random()*6)+1
  const de2 = Math.floor(Math.random()*6)+1
  const scoreAtt = de1 + (attEmp.power||2)
  const scoreDef = de2 + (defEmp.power||2)
  const attGagne = scoreAtt > scoreDef
  const pertesAtt = Math.ceil(scoreDef/2)
  const pertsDef = Math.ceil(scoreAtt/2)
  let newGame = {...game}
  if (attGagne) {
    newGame.map = game.map.map(r=>r.map(t=>
      t.row===tile.row&&t.col===tile.col ? {...t,owner:String(attackerId)} : t
    ))
  }
  newGame.empires = {
    ...newGame.empires,
    [attackerId]: {...attEmp, power:Math.max(0,attEmp.power-pertesAtt)},
    [defenderId]: {...defEmp, power:Math.max(0,defEmp.power-pertsDef)},
  }
  const cfg1=EMPIRE_CONFIG[attackerId], cfg2=EMPIRE_CONFIG[defenderId]
  return {
    attGagne, scoreAtt, scoreDef, de1, de2, pertesAtt, pertsDef, newGame,
    description:`${cfg1.emoji} ${cfg1.name} ${attGagne?'bat':'perd contre'} ${cfg2.emoji} ${cfg2.name} — Scores ${scoreAtt} vs ${scoreDef}`,
  }
}

export function appliquerEffetsNextTurn(game) {
  const nte = game.nextTurnEffects || {}
  let g = {...game}
  if (nte.bonus3Des) g = {...g, activeEffects:{...g.activeEffects, servageActif:true}}
  if (nte.batimentsMoinsCher) g = {...g, activeEffects:{...g.activeEffects, batimentsMoinsChers:true}}
  if (nte.etudierGratuit) g = {...g, activeEffects:{...g.activeEffects, etudierGratuit:true}}
  return {...g, nextTurnEffects:{}}
}

export function appliquerExpansionImperiale(game) {
  const newEmpires = {...game.empires}
  for (let id=1; id<=4; id++) {
    const cases = game.map.flat().filter(t=>t.owner===String(id)).length
    const bonus  = Math.floor(cases/2)
    const emp    = newEmpires[id] || {power:2,maxPower:8}
    newEmpires[id] = {...emp, maxPower:(emp.maxPower||8)+bonus}
  }
  return {...game, empires:newEmpires}
}

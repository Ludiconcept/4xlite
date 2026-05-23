import {
  GRID_SIZE,
  EMPIRE_IDS,
  EMPIRE_INITIAL_POWER,
  EMPIRE_INITIAL_MAX_POWER,
  POPULATION_INITIAL,
  BASE_STORAGE,
} from './constants.js'

// ─────────────────────────────────────────────────────────────
// FACTORY — crée un état de jeu initial vierge
// Appelé au démarrage d'une nouvelle partie
// ─────────────────────────────────────────────────────────────

export function createInitialGameState() {
  return {
    // Versionnage pour les migrations localStorage futures
    version: '1.0.0',

    // ── Phase de jeu ──────────────────────────────────────────
    phase: 'setup', // 'setup' | 'playing' | 'victory' | 'defeat'
    setupStep: 1,   // 1 à 7 pendant le setup
    turn: 0,
    actionsRemaining: 2, // 2 normalement, 3 avec Servage ou bonus
    playerTurn: true,    // true = tour joueur, false = tour empires

    // ── Carte ─────────────────────────────────────────────────
    // Grille 5×5 : tableau de 25 cases, indexées [row][col] (0-4)
    map: createEmptyMap(),

    // Curiosités géographiques
    river: null,    // null ou { path: [{row, col}], direction: 'horizontal'|'vertical', turns: 0|1|2 }
    volcano: null,  // null ou { row, col }
    lake: null,     // null ou { row, col }

    // ── Empires adverses ──────────────────────────────────────
    empires: createInitialEmpires(),

    // ── Population joueur ─────────────────────────────────────
    population: { ...POPULATION_INITIAL },

    // ── Ressources joueur ─────────────────────────────────────
    resources: {
      nourriture: 0,
      bois:       0,
      argile:     0,
      fer:        0,
      or:         0,
    },
    storageMax: BASE_STORAGE, // augmente avec les Entrepôts

    // ── Bâtiments globaux (compteurs uniques) ─────────────────
    globalBuildings: {
      palais:    false,
      hopital:   false,
      universite:false,
      pdmCorps:  false,
      pdmGauche: false,
      pdmDroite: false,
      ambassades: { 1: false, 2: false, 3: false, 4: false },
    },

    // ── Innovations ───────────────────────────────────────────
    // Pour chaque innovation : { checked: N, unlocked: bool }
    innovations: createInitialInnovations(),

    // ── Jetons Innovation (gagnés via Action Étudier) ─────────
    jetons: { A: 0, N: 0, P: 0 },

    // ── Prier (charges) ───────────────────────────────────────
    prierCharges: 0,

    // ── Piste des événements ──────────────────────────────────
    eventTrack: {
      current: 0,    // index de l'événement en cours (0 = aucun déclenché)
      resolved: [],  // ids des événements résolus
    },

    // ── Effets actifs (innovations permanentes débloquées) ────
    activeEffects: {
      meilleuresArmes:      false, // +1 combat
      strategieOffensive:   false, // +1 combat
      strategieDefensive:   false, // forteresses x5
      techniquesDeSiege:    false, // débloque Assiéger
      architectureRoyale:   false, // palais = forteresse
      genieCivil:           false, // -1 ressource bâtiments
      ceramique:            false, // famines /2
      monnaie:              false, // marché 2×/tour
      bureaucratie:         false, // grandir+recruter 2×/tour
      drainage:             false, // débloque Drainage
      irrigation:           false, // débloque Irrigation
      extraction:           false, // 2 mines/case
      rendementAgricole:    false, // 2 fermes/plaine
      cultureEnTerrasse:    false, // 2 fermes/colline
      cultureEnTerrasse2:   false, // ferme/montagne
      tactique:             false, // dé = 3 si souhaité
      repliStrategique:     false, // abandon sans combat
      chevalerie:           false, // chevaliers
      navigation:           false, // marins
      inquisition:          false, // prêtres = guerriers
      culteDesHeros:        false, // guerrier 1 immortel
      elusDesDieux:         false, // guerrier 2 immortel
      interventionDivine:   0,     // charges restantes (0-4)
      prosélytisme:         false, // encore disponible
      pdmCorpsActive:       false, // 3 dés au lieu de 4
      pdmGaucheActive:      false, // gibier → nobles
      pdmDroiteActive:      false, // +1 noble/tour
      armerActif:           false, // -1 perte au prochain combat
      servageActif:         false, // 3 dés au lieu de 2 au prochain lancer
      equiperActif:         false, // mode +/- sur les dés actif
      tributActifs:         {},    // { empireId: true } — empires sous tribut
    },

    // ── Piste des événements ──────────────────────────────────
    eventIndex: 0,         // index sur la piste des 35 événements
    configD40: null,       // généré au setup (array de 40 entrées)
    nextTurnEffects: {},   // effets différés au prochain tour

    // ── Limites d'actions spéciales (reset chaque tour) ───────
    turnLimits: {
      grandir:         0, // fois utilisé ce tour (max 1, ou 2 avec Bureaucratie)
      recruter:        0,
      commerce:        0, // max = nb artisans (ou ×2 avec Monnaie+Marché)
      servageUsed:     false,
    },

    // ── Dés d'action ──────────────────────────────────────────
    dice: {
      values:   [],       // [d1, d2, d3, d4] résultats actuels
      selected: [],       // indices des dés sélectionnés
      rolled:   false,
      modified: [],       // indices des dés modifiés par Équiper
    },

    // ── Victoire / défaite ────────────────────────────────────
    outcome: null, // null | 'cultural' | 'military' | 'diplomatic' | 'noTiles' | 'empireWon'

    // ── Popups "première fois" déjà affichées ─────────────────
    firstTimeSeen: {
      combat:           false,
      famine:           false,
      event:            false,
      innovation:       false,
      palaisMerveilles: false,
    },

    // ── Métadonnées ───────────────────────────────────────────
    createdAt:  null,
    lastSavedAt: null,
  }
}

// ─────────────────────────────────────────────────────────────
// Carte vide : 25 cases
// ─────────────────────────────────────────────────────────────
export function createEmptyMap() {
  const map = []
  for (let row = 0; row < GRID_SIZE; row++) {
    map[row] = []
    for (let col = 0; col < GRID_SIZE; col++) {
      map[row][col] = createEmptyTile(row, col)
    }
  }
  return map
}

export function createEmptyTile(row, col) {
  return {
    row, col,
    // État
    explored:   false,
    owner:      null,   // null | 'player' | 1 | 2 | 3 | 4 (empire id)
    // Terrain
    terrain:    null,   // TERRAIN_TYPES value
    hasFleuve:  false,
    hasVolcan:  false,
    isLac:      false,
    // Ressources (slots 2 et 4)
    resource1:  null,   // { type, quantity }
    resource2:  null,
    // Bâtiments (slots 5, 6, 7) — max 3, tous différents
    buildings:  [],     // ['ferme', 'mine', ...]
    // Bâtiments d'un empire conquérant (inutilisables)
    // Récupérés intacts si le joueur reconquiert la case
    playerBuildingsPreserved: [], // bâtiments du joueur sur une case ennemie
  }
}

// ─────────────────────────────────────────────────────────────
// Empires adverses
// ─────────────────────────────────────────────────────────────
export function createInitialEmpires() {
  const empires = {}
  for (const id of EMPIRE_IDS) {
    empires[id] = {
      id,
      power:    EMPIRE_INITIAL_POWER,
      maxPower: EMPIRE_INITIAL_MAX_POWER,
      tiles:    [], // cases contrôlées {row, col}
    }
  }
  return empires
}

// ─────────────────────────────────────────────────────────────
// Innovations — état initial (toutes verrouillées, 0 cases cochées)
// ─────────────────────────────────────────────────────────────
export function createInitialInnovations() {
  const state = {}
  // Liste de toutes les innovations (importée dynamiquement pour éviter la circularité)
  const innovationIds = [
    // Religion
    'clerge','proselytisme','culteDesHeros','messianisme','conversion',
    'elusDesDieux','interventionDivine','inquisition','martyrs',
    // Guerre
    'tactique','reseauDefensif','strategieOffensive','strategieDefensive',
    'techniquesDeSiege','meilleuresArmes','repliStrategique','chevalerie',
    'navigation','conscription',
    // Exploitation
    'rendementAgricole','cultureEnTerrasse','cultureEnTerrasse2',
    'prospection1','prospection2','prospection3',
    'drainage','irrigation','extraction',
    'benedictionDesTroupeaux',
    // Administration
    'ceramique','monnaie','bureaucratie','genieCivil',
    'architectureRoyale','palaisDesMerveilles',
  ]
  for (const id of innovationIds) {
    state[id] = {
      checkedTypes: { A:0, N:0, P:0 }, // cases cochées par type
      unlocked: false,
    }
  }
  return state
}

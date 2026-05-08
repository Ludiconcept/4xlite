// ─────────────────────────────────────────────
// CONSTANTES DU JEU — 4X Lite
// ─────────────────────────────────────────────

export const GRID_SIZE = 5

export const TERRAIN_TYPES = {
  MARAIS:    'marais',
  PLAINE:    'plaine',
  DESERT:    'desert',
  COLLINE:   'colline',
  MONTAGNE:  'montagne',
}

export const TERRAIN_FROM_DIE = {
  1: TERRAIN_TYPES.MARAIS,
  2: TERRAIN_TYPES.PLAINE,
  3: TERRAIN_TYPES.DESERT,
  4: TERRAIN_TYPES.COLLINE,
  5: TERRAIN_TYPES.MONTAGNE,
  6: null, // au choix
}

export const CURIOSITY_TYPES = {
  FLEUVE: 'fleuve',
  VOLCAN: 'volcan',
  LAC:    'lac',
  NONE:   'none',
}

export const CURIOSITY_FROM_DIE = {
  1: CURIOSITY_TYPES.FLEUVE,
  2: CURIOSITY_TYPES.FLEUVE,
  3: CURIOSITY_TYPES.VOLCAN,
  4: CURIOSITY_TYPES.LAC,
  5: CURIOSITY_TYPES.LAC,
  6: CURIOSITY_TYPES.NONE,
}

export const RESOURCE_TYPES = {
  NOURRITURE: 'nourriture',
  BOIS:       'bois',
  ARGILE:     'argile',
  FER:        'fer',
  OR:         'or',
  GIBIER:     'gibier', // interne — converti en nourriture
  FORET:      'foret',  // interne — produit bois
}

// Ressources par résultat 2D6 à l'exploration
export const RESOURCE_FROM_2DICE = {
  2:  { type: 'foret_gibier', terrains: ['colline', 'montagne'] },
  3:  { type: 'foret_gibier', terrains: ['colline', 'montagne'] },
  4:  { type: 'foret_gibier', terrains: ['colline', 'montagne'] },
  5:  { type: RESOURCE_TYPES.BOIS,      terrains: ['plaine', 'colline', 'montagne'] },
  6:  { type: RESOURCE_TYPES.GIBIER,    terrains: ['marais', 'fleuve'] },
  7:  { type: RESOURCE_TYPES.ARGILE,    terrains: ['marais', 'plaine', 'desert'] },
  8:  { type: RESOURCE_TYPES.OR,        terrains: ['colline', 'montagne', 'desert', 'fleuve'] },
  9:  { type: null,                     terrains: [] }, // aucune
  10: { type: RESOURCE_TYPES.FER,       terrains: ['colline', 'montagne', 'desert'] },
  11: { type: RESOURCE_TYPES.FER,       terrains: ['colline', 'montagne', 'desert'] },
  12: { type: RESOURCE_TYPES.FER,       terrains: ['colline', 'montagne', 'desert'] },
}

export const POPULATION_TYPES = {
  FERMIER:  'fermier',
  OUVRIER:  'ouvrier',
  ARTISAN:  'artisan',
  GUERRIER: 'guerrier',
  PRETRE:   'pretre',
  NOBLE:    'noble',
}

export const POPULATION_INITIAL = {
  fermier:  1,
  ouvrier:  1,
  artisan:  0,
  guerrier: 1,
  pretre:   0,
  noble:    0,
}

// Capacité de population
export const POP_PER_TILE    = 10
export const POP_PER_FARM    = 5
export const BASE_STORAGE    = 8
export const STORAGE_PER_WAREHOUSE = 4

// Empires
export const EMPIRE_IDS = [1, 2, 3, 4]
export const EMPIRE_INITIAL_POWER     = 2
export const EMPIRE_INITIAL_MAX_POWER = 8

// Numéros de bords de carte pour la colonisation (reproduit le PDF)
// Format : { borderPosition: empireId }
// Bord supérieur (Empire 1), bord droit (Empire 2), bord inférieur (Empire 3), bord gauche (Empire 4)
export const BORDER_NUMBERS = {
  top:    { numbers: [2, 3, 3, 4, 4], empire: 1 },
  right:  { numbers: [5, 5, 6, 6, 7], empire: 2 }, // inversé : haut → bas
  bottom: { numbers: [9, 8, 8, 7, 7], empire: 3 },
  left:   { numbers: [12, 11, 11, 10, 10], empire: 4 },
}

// Actions
export const ACTION_TYPES = {
  RECOLTER:  'recolter',   // dé 1-2
  CONSTRUIRE:'construire', // dé 3
  EXPLORER:  'explorer',   // dé 4
  COLONISER: 'coloniser',  // dé 4
  ATTAQUER:  'attaquer',   // dé 4
  ETUDIER:   'etudier',    // dé 5
  GRANDIR:   'grandir',    // dé 6
}

export const DIE_TO_ACTIONS = {
  1: [ACTION_TYPES.RECOLTER],
  2: [ACTION_TYPES.RECOLTER],
  3: [ACTION_TYPES.CONSTRUIRE],
  4: [ACTION_TYPES.EXPLORER, ACTION_TYPES.COLONISER, ACTION_TYPES.ATTAQUER],
  5: [ACTION_TYPES.ETUDIER],
  6: [ACTION_TYPES.GRANDIR],
}

// Coefficients de combat unités / terrain
export const COMBAT_COEFFICIENTS = {
  guerrier: { default: 1, favorable: 1, unfavorable: 1 },
  marin:    { default: 0.5, favorable: 2, unfavorableTerrain: ['fleuve', 'lac'] },
  chevalier:{ default: 0.5, favorable: 2, favorableTerrain: ['plaine', 'desert'] },
}

// Bâtiments
export const BUILDING_TYPES = {
  FERME:           'ferme',
  MINE:            'mine',
  SCIERIE:         'scierie',
  TOUR_DE_GUET:    'tourDeGuet',
  FORTERESSE:      'forteresse',
  PALAIS:          'palais',
  MARCHE:          'marche',
  HOPITAL:         'hopital',
  UNIVERSITE:      'universite',
  AMBASSADE:       'ambassade',
  ENTREPOT:        'entrepot',
  PDM_CORPS:       'palaisMerveillesCorps',
  PDM_GAUCHE:      'palaisMerveillesGauche',
  PDM_DROITE:      'palaisMerveilles Droite',
}

export const BUILDINGS = {
  ferme: {
    id: 'ferme',
    costPop: {},
    costMat: {}, // gratuit en plaine, 1 F/B/A au choix en colline
    terrains: ['plaine', 'colline'],
    max: null,
    unique: false,
  },
  mine: {
    id: 'mine',
    costPop: {},
    costMat: { bois: 3 },
    terrains: null, // tous
    max: null,
    unique: false,
  },
  scierie: {
    id: 'scierie',
    costPop: {},
    costMat: { bois: 2, argile: 2, fer: 1 }, // B/A x2 + Fx1
    terrains: null,
    max: null,
    unique: false,
  },
  tourDeGuet: {
    id: 'tourDeGuet',
    costPop: { guerrier: 1 },
    costMat: { bois: 3 },
    terrains: null,
    max: null,
    unique: false,
  },
  forteresse: {
    id: 'forteresse',
    costPop: { guerrier: 2 },
    costMat: { bois: 3, argile: 5, fer: 2 },
    terrains: null,
    max: null,
    unique: false,
  },
  palais: {
    id: 'palais',
    costPop: { pretre: 1, noble: 1 },
    costMat: { bois: 5, argile: 5, fer: 5, or: 5 },
    terrains: null,
    max: 1,
    unique: true,
  },
  marche: {
    id: 'marche',
    costPop: { artisan: 1 },
    costMat: { bois: 3, or: 2 },
    terrains: null,
    max: null,
    unique: false,
  },
  hopital: {
    id: 'hopital',
    costPop: { pretre: 1 },
    costMat: { bois: 2, argile: 2, noble: 2 },
    terrains: null,
    max: 1,
    unique: true,
  },
  universite: {
    id: 'universite',
    costPop: { pretre: 1 },
    costMat: { bois: 2, argile: 2, or: 2 },
    terrains: null,
    max: 1,
    unique: true,
  },
  ambassade: {
    id: 'ambassade',
    costPop: { guerrier: 1, noble: 1 },
    costMat: { bois: 3, argile: 3, fer: 3, or: 3 },
    terrains: null,
    max: 4, // 1 par empire
    unique: false,
  },
  entrepot: {
    id: 'entrepot',
    costPop: {},
    costMat: { bois: 2 }, // OU argile: 2 — géré dans le moteur
    terrains: null,
    max: null,
    unique: false,
  },
  palaisMerveillesCorps: {
    id: 'palaisMerveillesCorps',
    costPop: { or: 2, artisan: 2 },
    costMat: { argile: 10, or: 10, fer: 10, bois: 10 },
    terrains: null,
    max: 1,
    unique: true,
    requiresInnovation: 'palaisDesMerveilles',
    requiresBuilding: 'palais',
  },
  palaisMerveillesGauche: {
    id: 'palaisMerveillesGauche',
    costPop: { or: 2, artisan: 2 },
    costMat: { argile: 10, or: 10, fer: 10, bois: 10 },
    terrains: null,
    max: 1,
    unique: true,
    requiresInnovation: 'palaisDesMerveilles',
    requiresBuilding: 'palais',
  },
  palaismerveilles_droite: {
    id: 'palaisMerveilles Droite',
    costPop: { or: 2, artisan: 2 },
    costMat: { argile: 10, or: 10, fer: 10, bois: 10 },
    terrains: null,
    max: 1,
    unique: true,
    requiresInnovation: 'palaisDesMerveilles',
    requiresBuilding: 'palais',
  },
}

// Innovations — structure complète des 4 arbres
export const INNOVATIONS = {
  // ── RELIGION ──────────────────────────────
  clerge: {
    id: 'clerge', branch: 'religion', name: 'Clergé',
    requires: [], cost: { pretre: 6 },
    effect: 'Au déblocage : dépensez 3 Or pour gagner 2 Prêtres.',
    oneTime: true,
  },
  proselytisme: {
    id: 'proselytisme', branch: 'religion', name: 'Prosélytisme',
    requires: ['clerge'], cost: { pretre: 4 },
    effect: 'Usage unique automatique : annule le prochain tour entier des empires adverses.',
    oneTime: true,
  },
  culteDesHeros: {
    id: 'culteDesHeros', branch: 'religion', name: 'Culte des Héros',
    requires: ['clerge'], cost: { pretre: 4, noble: 4 },
    effect: 'Entourez votre premier guerrier. Quelles que soient les pertes, il survit.',
    permanent: true,
  },
  messianisme: {
    id: 'messianisme', branch: 'religion', name: 'Messianisme',
    requires: ['proselytisme'], cost: { pretre: 7 },
    effect: 'Baissez la Puissance d\'un Empire de 2 et gagnez 2 Guerriers.',
    activatable: true,
  },
  conversion: {
    id: 'conversion', branch: 'religion', name: 'Conversion',
    requires: ['messianisme'], cost: { pretre: 8 },
    effect: 'Choisissez une case appartenant à un autre Empire : elle passe sous votre contrôle.',
    activatable: true,
  },
  elusDesDieux: {
    id: 'elusDesDieux', branch: 'religion', name: 'Élus des Dieux',
    requires: ['culteDesHeros'], cost: { pretre: 5, noble: 3 },
    effect: 'Entourez votre deuxième guerrier. Quelles que soient les pertes, il survit.',
    permanent: true,
  },
  interventionDivine: {
    id: 'interventionDivine', branch: 'religion', name: 'Intervention divine',
    requires: ['elusDesDieux'], cost: { pretre: 8 },
    effect: 'Stock de 4 cases : cochez 1 case pour relancer n\'importe quel dé visible.',
    permanent: true,
    charges: 4,
  },
  inquisition: {
    id: 'inquisition', branch: 'religion', name: 'Inquisition',
    requires: ['conversion'], cost: { pretre: 8, noble: 7 },
    effect: 'Chaque Prêtre vaut désormais 1 Guerrier en combat.',
    permanent: true,
  },
  martyrs: {
    id: 'martyrs', branch: 'religion', name: 'Martyrs',
    requires: ['inquisition', 'interventionDivine'], cost: { pretre: 6, noble: 5 },
    effect: 'Sacrifiez N Prêtres : chaque empire adverse perd N Puissance (pas la Puissance max).',
    activatable: true,
  },

  // ── GUERRE ────────────────────────────────
  tactique: {
    id: 'tactique', branch: 'guerre', name: 'Tactique',
    requires: [], cost: { noble: 5 },
    effect: 'Lors d\'un combat, vous pouvez décider que le résultat du dé est 3 sans lancer.',
    permanent: true,
  },
  reseauDefensif: {
    id: 'reseauDefensif', branch: 'guerre', name: 'Réseau défensif',
    requires: ['tactique'], cost: { noble: 4, artisan: 4 },
    effect: 'Effet unique au déblocage : dépensez 5 Bois pour construire 3 tours de guet gratuitement. Si les Bois manquent, le bénéfice est perdu.',
    oneTime: true,
  },
  strategieOffensive: {
    id: 'strategieOffensive', branch: 'guerre', name: 'Stratégie offensive',
    requires: ['tactique'], cost: { noble: 8 },
    effect: '+1 à tous vos combats.',
    permanent: true,
  },
  strategieDefensive: {
    id: 'strategieDefensive', branch: 'guerre', name: 'Stratégie défensive',
    requires: ['reseauDefensif'], cost: { noble: 5, artisan: 3 },
    effect: 'Les forteresses valent 5 guerriers au lieu de 3. Effet unique : 1 action de construction gratuite.',
    permanent: true, oneTime: true,
  },
  techniqesDeSiege: {
    id: 'techniquesDeSiege', branch: 'guerre', name: 'Techniques de siège',
    requires: ['strategieOffensive'], cost: { noble: 4, artisan: 4 },
    effect: 'Débloque l\'action spéciale Assiéger.',
    permanent: true,
  },
  meilleuresArmes: {
    id: 'meilleuresArmes', branch: 'guerre', name: 'Meilleures armes',
    requires: ['strategieDefensive', 'techniquesDeSiege'], cost: { noble: 4, artisan: 4 },
    effect: '+1 à tous vos combats.',
    permanent: true,
  },
  repliStrategique: {
    id: 'repliStrategique', branch: 'guerre', name: 'Repli stratégique',
    requires: ['meilleuresArmes'], cost: { noble: 8 },
    effect: 'En cas d\'attaque, vous pouvez abandonner la case sans combattre et infliger 3 dégâts.',
    permanent: true,
  },
  chevalerie: {
    id: 'chevalerie', branch: 'guerre', name: 'Chevalerie',
    requires: ['meilleuresArmes'], cost: { noble: 4, artisan: 3 },
    effect: 'Convertissez des Nobles en Chevaliers (1 Fer). 1C = 2G en Plaine/Désert, 0.5G ailleurs.',
    permanent: true,
  },
  navigation: {
    id: 'navigation', branch: 'guerre', name: 'Navigation',
    requires: ['chevalerie'], cost: { noble: 4, artisan: 2 },
    effect: 'Recrutez des Marins à la place de Guerriers. 1M = 2G sur Fleuve/Lac, 0.5G ailleurs.',
    permanent: true,
  },
  conscription: {
    id: 'conscription', branch: 'guerre', name: 'Conscription',
    requires: ['repliStrategique', 'navigation'], cost: { noble: 3, artisan: 2 },
    effect: 'Gagnez immédiatement 1 Guerrier toutes les 2 cases contrôlées.',
    oneTime: true,
  },

  // ── EXPLOITATION ──────────────────────────
  rendementAgricole: {
    id: 'rendementAgricole', branch: 'exploitation', name: 'Rendement agricole',
    requires: [], cost: { artisan: 6 },
    effect: 'Vous pouvez construire 2 Fermes sur les cases de Plaine.',
    permanent: true,
  },
  cultureEnTerrasse: {
    id: 'cultureEnTerrasse', branch: 'exploitation', name: 'Culture en terrasse',
    requires: ['rendementAgricole'], cost: { artisan: 6 },
    effect: 'Vous pouvez construire 2 Fermes sur les cases de Colline.',
    permanent: true,
  },
  cultureEnTerrasse2: {
    id: 'cultureEnTerrasse2', branch: 'exploitation', name: 'Culture en terrasse 2',
    requires: ['cultureEnTerrasse'], cost: { artisan: 6 },
    effect: 'Vous pouvez construire une Ferme sur les cases de Montagne.',
    permanent: true,
  },
  prospection1: {
    id: 'prospection1', branch: 'exploitation', name: 'Prospection 1',
    requires: ['rendementAgricole'], cost: { artisan: 5 },
    effect: 'Sur 1 case sans ressource : lancez 1 dé. 1-2: rien, 3: Argile, 4: Gibier, 5: Fer, 6: Or.',
    activatable: true,
  },
  prospection2: {
    id: 'prospection2', branch: 'exploitation', name: 'Prospection 2',
    requires: ['prospection1'], cost: { artisan: 8 },
    effect: 'Même effet que Prospection 1, applicable sur une deuxième case.',
    activatable: true,
  },
  prospection3: {
    id: 'prospection3', branch: 'exploitation', name: 'Prospection 3',
    requires: ['prospection2'], cost: { artisan: 8, noble: 7 },
    effect: 'Même effet que Prospection 1, applicable sur une troisième case.',
    activatable: true,
  },
  drainage: {
    id: 'drainage', branch: 'exploitation', name: 'Drainage',
    requires: ['cultureEnTerrasse'], cost: { artisan: 6, noble: 2 },
    effect: 'Débloque l\'action spéciale Drainage : transforme un Marais en Plaine.',
    permanent: true,
  },
  irrigation: {
    id: 'irrigation', branch: 'exploitation', name: 'Irrigation',
    requires: ['drainage'], cost: { artisan: 4, noble: 2 },
    effect: 'Débloque l\'action spéciale Irrigation : transforme un Désert en Plaine.',
    permanent: true,
  },
  extraction: {
    id: 'extraction', branch: 'exploitation', name: 'Extraction',
    requires: ['prospection3'], cost: { artisan: 6 },
    effect: 'Vous pouvez construire 2 Mines sur la même case.',
    permanent: true,
  },

  // ── ADMINISTRATION ─────────────────────────
  ceramique: {
    id: 'ceramique', branch: 'administration', name: 'Céramique',
    requires: [], cost: { artisan: 5 },
    effect: 'Divise par 2 les effets des famines (1 Nourriture nourrit 4 populations au lieu de 2).',
    permanent: true,
  },
  monnaie: {
    id: 'monnaie', branch: 'administration', name: 'Monnaie',
    requires: [], cost: { artisan: 5 },
    effect: 'L\'action Commerce du Marché peut être effectuée 2 fois par tour.',
    permanent: true,
  },
  bureaucratie: {
    id: 'bureaucratie', branch: 'administration', name: 'Bureaucratie',
    requires: ['ceramique', 'monnaie'], cost: { noble: 5, pretre: 3 },
    effect: 'Vous pouvez faire les actions Grandir et Recruter 2 fois par tour.',
    permanent: true,
  },
  genieCivil: {
    id: 'genieCivil', branch: 'administration', name: 'Génie civil',
    requires: ['bureaucratie'], cost: { noble: 2, artisan: 6 },
    effect: 'Les bâtiments coûtent 1 ressource de moins (au choix du joueur). Protège des tremblements de terre.',
    permanent: true,
  },
  architectureRoyale: {
    id: 'architectureRoyale', branch: 'administration', name: 'Architecture royale',
    requires: ['genieCivil'], cost: { noble: 2, artisan: 6 },
    effect: 'Votre Palais cumule les effets de la Forteresse.',
    permanent: true,
  },
  palaisDesMerveilles: {
    id: 'palaisDesMerveilles', branch: 'administration', name: 'Palais des Merveilles',
    requires: ['architectureRoyale'], cost: { artisan: 8, noble: 7, pretre: 6 },
    effect: 'Permet de construire le bâtiment Palais des Merveilles (victoire culturelle).',
    permanent: true,
  },
}

// Piste des événements — 30 événements dans l'ordre
export const EVENTS = [
  { id: 1,  key: 'bonusTour1',        type: 'positive' },
  { id: 2,  key: 'empiresAttaquent',  type: 'negative' },
  { id: 3,  key: 'gainRessources',    type: 'positive' },
  { id: 4,  key: 'croissance',        type: 'positive' },
  { id: 5,  key: 'colonisationGrat',  type: 'positive' },
  { id: 6,  key: 'empireColonise3',   type: 'negative' },
  { id: 7,  key: 'soumissionTribus1', type: 'positive' },
  { id: 8,  key: 'bonusTour2',        type: 'positive' },
  { id: 9,  key: 'emergenceEtat',     type: 'positive' },
  { id: 10, key: 'famine1',           type: 'negative' },
  { id: 11, key: 'empiresPlus2Des',   type: 'negative' },
  { id: 12, key: 'explorerColoniser', type: 'positive' },
  { id: 13, key: 'bonusTour3',        type: 'positive' },
  { id: 14, key: 'empirePuissance1',  type: 'negative' },
  { id: 15, key: 'empiresColonisent', type: 'negative' },
  { id: 16, key: 'perceeTechno1',     type: 'positive' },
  { id: 17, key: 'soumissionTribus2', type: 'positive' },
  { id: 18, key: 'puisMaxCases',      type: 'negative' },
  { id: 19, key: 'travauxForces',     type: 'mixed'    },
  { id: 20, key: 'maladie',           type: 'negative' },
  { id: 21, key: 'explosionDemo',     type: 'positive' },
  { id: 22, key: 'eruption1',         type: 'negative' },
  { id: 23, key: 'bonusConstruction', type: 'positive' },
  { id: 24, key: 'ressourceEpuisee',  type: 'negative' },
  { id: 25, key: 'perceeTechno2',     type: 'positive' },
  { id: 26, key: 'puisMaxCases2',     type: 'negative' },
  { id: 27, key: 'tremblementTerre',  type: 'negative' },
  { id: 28, key: 'empirePuissance2',  type: 'negative' },
  { id: 29, key: 'bonusTourNobles',   type: 'positive' },
  { id: 30, key: 'famine2',           type: 'negative' },
  // Au-delà de 30 : boucle infinie — chaque nouveau 5 augmente l'empire le plus puissant
]

/**
 * data/innovations.js
 * Définition complète des 34 innovations pour le Sprint 7.
 *
 * Structure de chaque innovation :
 *   id          : identifiant unique (camelCase)
 *   arbre       : 'administration' | 'exploitation' | 'guerre' | 'religion'
 *   nom         : nom affiché
 *   emoji       : icône
 *   cout        : { A:N, N:N, P:N } jetons requis
 *   total       : total de cases (= somme des valeurs de cout)
 *   conditions  : [id, ...] innovations préalables
 *   effetCourt  : description courte (dans l'arbre)
 *   effetLong   : description complète (popup déblocage)
 *   roleplay    : texte scénarisé (popup déblocage)
 *   immediat    : bool — effet déclenché au déblocage (popup interactif)
 *   permanent   : bool — effet actif tant que débloqué
 */

export const INNOVATIONS = [

  // ══════════════════════════════════════════════════════════════
  // ARBRE ADMINISTRATION
  // ══════════════════════════════════════════════════════════════
  {
    id: 'ceramique', arbre: 'administration', nom: 'Céramique', emoji: '🏺',
    cout: { A: 5 }, total: 5, conditions: [],
    effetCourt: '1 Nourriture nourrit 10 pop. +5 pop. max.',
    effetLong: '1 Nourriture nourrit 10 pop (au lieu de 5) lors de la Famine et de la Surpopulation. Le nombre de morts n\'est pas réduit. +5 Population max.',
    roleplay: 'Vos artisans maîtrisent enfin l\'art de conserver les aliments. Les greniers durent deux fois plus longtemps.',
    immediat: false, permanent: true,
  },
  {
    id: 'monnaie', arbre: 'administration', nom: 'Monnaie', emoji: '🪙',
    cout: { A: 5 }, total: 5, conditions: [],
    effetCourt: 'Marché utilisable 2×/tour.',
    effetLong: 'Le bonus d\'achat du Marché est utilisable 2 fois par tour et par Marché (dans la limite du nombre d\'Artisans).',
    roleplay: 'Pièces frappées, échanges facilités. Le commerce reprend vie dans chaque ruelle du marché.',
    immediat: false, permanent: true,
  },
  {
    id: 'bureaucratie', arbre: 'administration', nom: 'Bureaucratie', emoji: '📜',
    cout: { N: 5, P: 3 }, total: 8, conditions: ['ceramique', 'monnaie'],
    effetCourt: 'Grandir et Recruter utilisables 2×/tour.',
    effetLong: 'Les Actions spéciales Grandir et Recruter sont utilisables 2 fois par tour.',
    roleplay: 'Scribes et fonctionnaires organisent l\'empire. Tout s\'accélère quand l\'administration est bien huilée.',
    immediat: false, permanent: true,
  },
  {
    id: 'genieCivil', arbre: 'administration', nom: 'Génie civil', emoji: '⚙️',
    cout: { N: 2, A: 6 }, total: 8, conditions: ['bureaucratie'],
    effetCourt: 'Dé fixe 3 ce tour. +4e emplacement bâtiment.',
    effetLong: 'Au tour du déblocage uniquement : dé d\'action fixe supplémentaire (valeur 3, 🔒). Permanent : chaque case gagne un 4e emplacement de bâtiment (visible uniquement quand un bâtiment y est construit).',
    roleplay: 'Vos ingénieurs repoussent les limites de la construction. Les cités s\'élèvent plus haut que jamais.',
    immediat: true, permanent: true,
  },
  {
    id: 'architectureRoyale', arbre: 'administration', nom: 'Architecture royale', emoji: '🏰',
    cout: { N: 2, A: 6 }, total: 8, conditions: ['genieCivil'],
    effetCourt: 'Palais = Forteresse. +5 pop. max. +5 stockage max.',
    effetLong: 'Le Palais compte comme une Forteresse (+5 Défense, bonus forteresse appliqués). Le Palais gagne +5 Population max. et +5 Stockage max.',
    roleplay: 'Votre palais devient une forteresse imprenable, symbole de votre puissance aux yeux du monde.',
    immediat: false, permanent: true,
  },
  {
    id: 'palaisDesMerveilles', arbre: 'administration', nom: 'Palais des merveilles', emoji: '✨',
    cout: { A: 8, N: 7, P: 6 }, total: 21, conditions: ['architectureRoyale'],
    effetCourt: 'Débloque le Palais des Merveilles (3 parties).',
    effetLong: 'Débloque le bâtiment Palais des Merveilles et ses 3 parties constructibles (Corps central, Aile gauche, Aile droite). Construire les 3 déclenche la victoire culturelle.',
    roleplay: 'La légende de votre empire transcendera les âges. La construction du Palais des Merveilles commence.',
    immediat: false, permanent: true,
  },

  // ══════════════════════════════════════════════════════════════
  // ARBRE EXPLOITATION
  // ══════════════════════════════════════════════════════════════
  {
    id: 'drainage', arbre: 'exploitation', nom: 'Drainage', emoji: '🌿',
    cout: { A: 4, N: 2 }, total: 6, conditions: [],
    effetCourt: 'Débloque l\'action Drainage.',
    effetLong: 'Débloque l\'Action spéciale Drainage : convertit un Marais en Plaine (coût : 1 Ouvrier + 3 Bois).',
    roleplay: 'Vos ingénieurs creusent des canaux dans les marécages. Des terres fertiles émergent là où stagnait l\'eau.',
    immediat: false, permanent: true,
  },
  {
    id: 'irrigation', arbre: 'exploitation', nom: 'Irrigation', emoji: '💧',
    cout: { A: 4, N: 2 }, total: 6, conditions: ['drainage'],
    effetCourt: 'Débloque l\'action Irrigation.',
    effetLong: 'Débloque l\'Action spéciale Irrigation : convertit un Désert en Plaine (coût : 1 Fermier + 3 Argile). Les ressources présentes sur la case restent après transformation.',
    roleplay: 'L\'eau porte la vie jusqu\'aux déserts brûlants. Vos fermiers transforment le sable en champs de blé.',
    immediat: false, permanent: true,
  },
  {
    id: 'prospection1', arbre: 'exploitation', nom: 'Prospection I', emoji: '⛏️',
    cout: { A: 5 }, total: 5, conditions: [],
    effetCourt: 'Prospectez une case : 1D6 → ressource.',
    effetLong: 'Au déblocage : choisissez une case sans ressource. Lancez 1 dé — 1-2 : rien / 3 : Argile / 4 : Gibier / 5 : Fer / 6 : Or.',
    roleplay: 'Vos explorateurs rentrent les poches pleines. Ou presque.',
    immediat: true, permanent: false,
  },
  {
    id: 'prospection2', arbre: 'exploitation', nom: 'Prospection II', emoji: '⛏️',
    cout: { A: 8 }, total: 8, conditions: ['prospection1'],
    effetCourt: 'Prospectez une case : 1D6 → ressource.',
    effetLong: 'Au déblocage : choisissez une case sans ressource. Lancez 1 dé — 1-2 : rien / 3 : Argile / 4 : Gibier / 5 : Fer / 6 : Or.',
    roleplay: 'Votre maîtrise des filons s\'approfondit. Un nouveau gisement attend d\'être découvert.',
    immediat: true, permanent: false,
  },
  {
    id: 'prospection3', arbre: 'exploitation', nom: 'Prospection III', emoji: '⛏️',
    cout: { A: 15 }, total: 15, conditions: ['prospection2'],
    effetCourt: 'Prospectez une case : 1D6 → ressource.',
    effetLong: 'Au déblocage : choisissez une case sans ressource. Lancez 1 dé — 1-2 : rien / 3 : Argile / 4 : Gibier / 5 : Fer / 6 : Or.',
    roleplay: 'Vos géologues sont les meilleurs du monde connu. Nul filon ne peut leur résister.',
    immediat: true, permanent: false,
  },
  {
    id: 'rendementAgricole', arbre: 'exploitation', nom: 'Rendement agricole', emoji: '🌾',
    cout: { A: 6 }, total: 6, conditions: [],
    effetCourt: '2 Fermes possibles sur Plaine.',
    effetLong: 'Une case de Plaine peut accueillir 2 Fermes (chacune occupe 1 emplacement de bâtiment).',
    roleplay: 'Rotation des cultures, nouveaux semis. Vos plaines produisent le double de la récolte attendue.',
    immediat: false, permanent: true,
  },
  {
    id: 'cultureEnTerrasse', arbre: 'exploitation', nom: 'Culture en terrasse', emoji: '🏔️',
    cout: { A: 6 }, total: 6, conditions: ['rendementAgricole'],
    effetCourt: '2 Fermes possibles sur Colline.',
    effetLong: 'Une case de Colline peut accueillir 2 Fermes (chacune occupe 1 emplacement de bâtiment).',
    roleplay: 'Des terrasses taillées dans la roche transforment les collines stériles en jardins suspendus.',
    immediat: false, permanent: true,
  },
  {
    id: 'cultureEnTerrasse2', arbre: 'exploitation', nom: 'Culture en terrasse II', emoji: '⛰️',
    cout: { A: 6 }, total: 6, conditions: ['cultureEnTerrasse'],
    effetCourt: 'Ferme constructible sur Montagne.',
    effetLong: 'Vous pouvez construire une Ferme sur les cases de Montagne (coût : 2 Bois + Fer ou Argile).',
    roleplay: 'Même les sommets enneigés cèdent à l\'ingéniosité de vos paysans.',
    immediat: false, permanent: true,
  },
  {
    id: 'extraction', arbre: 'exploitation', nom: 'Extraction', emoji: '⛏️',
    cout: { A: 6, N: 1 }, total: 7, conditions: [],
    effetCourt: '2 Mines possibles sur une case.',
    effetLong: 'Vous pouvez construire 2 Mines sur une même case contenant Fer, Or ou Argile.',
    roleplay: 'Vos mineurs creusent plus profond. La montagne cache encore de nombreux secrets.',
    immediat: false, permanent: true,
  },
  {
    id: 'benedictionDesTroupeaux', arbre: 'exploitation', nom: 'Bénédiction des troupeaux', emoji: '🐄',
    cout: { P: 3 }, total: 3, conditions: [],
    effetCourt: '+3 Nourriture immédiatement.',
    effetLong: 'Au déblocage uniquement (non répétable) : +3 Nourriture immédiatement.',
    roleplay: 'Les prêtres bénissent les troupeaux. Les bêtes grossissent, les greniers se remplissent.',
    immediat: true, permanent: false,
  },

  // ══════════════════════════════════════════════════════════════
  // ARBRE GUERRE
  // ══════════════════════════════════════════════════════════════
  {
    id: 'reseauDefensif', arbre: 'guerre', nom: 'Réseau défensif', emoji: '🗼',
    cout: { N: 4, A: 4 }, total: 8, conditions: [],
    effetCourt: 'Débloque Réseau défensif (usage unique).',
    effetLong: 'Débloque l\'Action spéciale Réseau défensif (usage unique dans la partie) : dépenser 5 Bois pour placer 3 Tours de guet sur 3 cases éligibles.',
    roleplay: 'Des tours s\'élèvent aux carrefours stratégiques. Vos sentinelles voient venir l\'ennemi de loin.',
    immediat: false, permanent: true,
  },
  {
    id: 'tactique', arbre: 'guerre', nom: 'Tactique', emoji: '♟️',
    cout: { N: 5 }, total: 5, conditions: [],
    effetCourt: 'Fixez votre dé de combat à 3.',
    effetLong: 'Permanent : avant d\'engager les soldats en combat, vous pouvez activer Tactique pour fixer le résultat de votre dé de combat à 3 (pas de lancer). Affiché sous le résultat du dé.',
    roleplay: 'La guerre n\'est pas qu\'une affaire de force. La stratégie l\'emporte sur la chance.',
    immediat: false, permanent: true,
  },
  {
    id: 'strategieOffensive', arbre: 'guerre', nom: 'Stratégie offensive', emoji: '⚔️',
    cout: { N: 8 }, total: 8, conditions: ['tactique'],
    effetCourt: '+1 en attaque.',
    effetLong: '+1 à toutes les attaques du joueur (pas en défense). Affiché sous le résultat du dé, comme le bonus forteresse.',
    roleplay: 'Vos généraux ont étudié les grands conquérants. Chaque assaut est une leçon de stratégie.',
    immediat: false, permanent: true,
  },
  {
    id: 'techniquesDeSiege', arbre: 'guerre', nom: 'Techniques de siège', emoji: '🏹',
    cout: { N: 4, A: 4 }, total: 8, conditions: ['strategieOffensive'],
    effetCourt: 'Débloque l\'action Assiéger.',
    effetLong: 'Débloque l\'Action spéciale Assiéger : +3 en attaque pour un combat (coût : 3 Bois). Activable au moment du choix des soldats.',
    roleplay: 'Catapultes, béliers, tours d\'assaut. Aucune muraille ne vous résistera.',
    immediat: false, permanent: true,
  },
  {
    id: 'repliStrategique', arbre: 'guerre', nom: 'Repli stratégique', emoji: '🏃',
    cout: { N: 8 }, total: 8, conditions: ['techniquesDeSiege'],
    effetCourt: 'Abandonner une case : ennemi -3 Puissance.',
    effetLong: 'Quand un Empire attaque, vous pouvez choisir de vous replier : la case attaquée passe sous contrôle ennemi (comme une défaite) et l\'Empire attaquant perd 3 Puissance. Aucun combat ni perte de population.',
    roleplay: 'Parfois, reculer c\'est gagner. Vos troupes se replient en ordre, laissant l\'ennemi épuisé.',
    immediat: false, permanent: true,
  },
  {
    id: 'conscription', arbre: 'guerre', nom: 'Conscription', emoji: '🪖',
    cout: { N: 3, P: 3, A: 2 }, total: 8, conditions: [],
    effetCourt: '+1 Guerrier par 2 cases (immédiat).',
    effetLong: 'Au déblocage uniquement : +1 Guerrier par tranche de 2 cases contrôlées (immédiat, non répétable).',
    roleplay: 'L\'empire appelle ses fils sous les drapeaux. Chaque village envoie ses meilleurs hommes.',
    immediat: true, permanent: false,
  },
  {
    id: 'strategieDefensive', arbre: 'guerre', nom: 'Stratégie défensive', emoji: '🛡️',
    cout: { N: 5, A: 3 }, total: 8, conditions: ['tactique'],
    effetCourt: 'Forteresses : +6 Défense, moins chères.',
    effetLong: 'Les Forteresses donnent +6 Défense (au lieu de +5) et coûtent 1 Bois et 1 Argile de moins (nouveau coût : 2 Guerriers + 2 Bois + 4 Argile + 2 Fer).',
    roleplay: 'Vos architectes militaires savent où placer chaque pierre pour maximiser la résistance.',
    immediat: false, permanent: true,
  },
  {
    id: 'meilleuresArmes', arbre: 'guerre', nom: 'Meilleures armes', emoji: '🗡️',
    cout: { N: 8, A: 7 }, total: 15, conditions: ['strategieDefensive'],
    effetCourt: '+1 à tous les combats.',
    effetLong: '+1 à tous les combats (attaque et défense). Affiché sous le résultat du dé.',
    roleplay: 'Forgé dans les meilleures aciéries, votre acier surpasse tout ce que l\'ennemi peut opposer.',
    immediat: false, permanent: true,
  },
  {
    id: 'chevalerie', arbre: 'guerre', nom: 'Chevalerie', emoji: '🐴',
    cout: { N: 8, A: 7 }, total: 15, conditions: ['meilleuresArmes'],
    effetCourt: 'Débloque Chevaliers et action Adouber.',
    effetLong: 'Débloque les Chevaliers (nouveau type de population). Débloque l\'Action spéciale Adouber (1 Fer + 1 Or → transforme 1 Guerrier en Chevalier, limité à 1 Chevalier par case). Les Chevaliers valent 2 Guerriers sur Plaine et Désert. Ils meurent en dernier.',
    roleplay: 'La fleur de votre noblesse enfourche ses destriers. L\'ennemi n\'a qu\'à se bien tenir.',
    immediat: false, permanent: true,
  },
  {
    id: 'navigation', arbre: 'guerre', nom: 'Navigation', emoji: '⛵',
    cout: { N: 4, A: 2 }, total: 6, conditions: [],
    effetCourt: 'Débloque les Marins.',
    effetLong: 'Débloque les Marins (nouveau type de population). Valeur au combat : ×2 sur Fleuve/Lac, ×1 sur Marais, ×0,5 sur les autres terrains. Valeurs décimales conservées pour le calcul.',
    roleplay: 'Vos navires sillonnent fleuves et lacs. Sur l\'eau, vos marins ne connaissent pas la défaite.',
    immediat: false, permanent: true,
  },

  // ══════════════════════════════════════════════════════════════
  // ARBRE RELIGION
  // ══════════════════════════════════════════════════════════════
  {
    id: 'clerge', arbre: 'religion', nom: 'Clergé', emoji: '✝️',
    cout: { P: 6 }, total: 6, conditions: [],
    effetCourt: 'Payer 3 Or → +2 Prêtres (au déblocage).',
    effetLong: 'Au déblocage : vous pouvez payer 3 Or pour gagner 2 Prêtres immédiatement. Si vous n\'avez pas 3 Or, l\'option est grisée. Non répétable.',
    roleplay: 'Un clergé organisé attire les dévots. Prêtres et fidèles affluent vers votre cité.',
    immediat: true, permanent: false,
  },
  {
    id: 'culteDesHeros', arbre: 'religion', nom: 'Culte des Héros', emoji: '🦸',
    cout: { P: 5, N: 3 }, total: 8, conditions: ['clerge'],
    effetCourt: '-1 perte par combat.',
    effetLong: 'Permanent : -1 perte à chaque combat (affiché : "Culte des Héros : -1 Perte").',
    roleplay: 'Vos soldats tombés deviennent des légendes. Combattre sous leur protection rend les vivants intrépides.',
    immediat: false, permanent: true,
  },
  {
    id: 'messianisme', arbre: 'religion', nom: 'Messianisme', emoji: '🌟',
    cout: { P: 7 }, total: 7, conditions: ['culteDesHeros'],
    effetCourt: '−2 Puissance/max. à 1 Empire. +2 Guerriers.',
    effetLong: 'Au déblocage : choisissez 1 Empire. Cet Empire perd 2 Puissance et 2 Puissance max. Vous gagnez 2 Guerriers immédiatement.',
    roleplay: 'Votre prophète répand la parole. Les ennemis tremblent, vos guerriers sont galvanisés.',
    immediat: true, permanent: false,
  },
  {
    id: 'elusDesDieux', arbre: 'religion', nom: 'Élus des Dieux', emoji: '⚡',
    cout: { P: 5, N: 3 }, total: 8, conditions: ['messianisme'],
    effetCourt: '-1 perte supplémentaire par combat.',
    effetLong: 'Permanent : -1 perte supplémentaire à chaque combat (cumulable avec Culte des Héros : total -2 pertes). Affiché : "Élus des Dieux : -1 Perte".',
    roleplay: 'Vos soldats sont bénis. La mort elle-même hésite à les toucher.',
    immediat: false, permanent: true,
  },
  {
    id: 'martyrs', arbre: 'religion', nom: 'Martyrs', emoji: '🕯️',
    cout: { P: 11 }, total: 11, conditions: ['elusDesDieux'],
    effetCourt: 'Sacrifiez N Prêtres → −N Puissance à tous.',
    effetLong: 'Au déblocage : choisissez combien de Prêtres sacrifier (0 à max. disponibles). Chaque Prêtre sacrifié réduit la Puissance de TOUS les Empires de 1.',
    roleplay: 'Le sacrifice suprême. Le sang des martyrs affaiblit les dieux adverses.',
    immediat: true, permanent: false,
  },
  {
    id: 'inquisition', arbre: 'religion', nom: 'Inquisition', emoji: '🔥',
    cout: { P: 11, N: 4 }, total: 15, conditions: ['elusDesDieux'],
    effetCourt: 'Prêtres = Guerriers en combat. +1 attaque si Prêtre.',
    effetLong: 'Permanent : les Prêtres valent 1 Guerrier en combat (attaque et défense). En attaque uniquement, si 1 Prêtre ou plus est engagé, +1 en valeur d\'attaque (quel que soit le nombre de Prêtres).',
    roleplay: 'La foi est une arme. Vos prêtres prennent les armes au nom du divin.',
    immediat: false, permanent: true,
  },
  {
    id: 'proselytisme', arbre: 'religion', nom: 'Prosélytisme', emoji: '📣',
    cout: { P: 4 }, total: 4, conditions: [],
    effetCourt: 'Les Empires passent leur prochain tour.',
    effetLong: 'Au déblocage : crée un effet actif. Au prochain tour des Empires, les 4 D6 ne sont pas lancés (les Empires n\'agissent pas, aucun D40 non plus). L\'effet disparaît automatiquement après ce tour.',
    roleplay: 'Votre foi se répand comme une traînée de poudre. Les armées ennemies hésitent, paralysées par le doute.',
    immediat: false, permanent: false,
  },
  {
    id: 'conversion', arbre: 'religion', nom: 'Conversion', emoji: '🕊️',
    cout: { P: 8 }, total: 8, conditions: ['proselytisme'],
    effetCourt: 'Prenez 1 case adjacente d\'un Empire.',
    effetLong: 'Au déblocage : choisissez une case adjacente à votre territoire appartenant à un Empire. Elle passe sous votre contrôle avec ses bâtiments existants (sans combat ni pertes). Si non explorée, elle le devient.',
    roleplay: 'La conviction est plus forte que l\'épée. Une case entière rallie votre cause sans un coup de feu.',
    immediat: true, permanent: false,
  },
  {
    id: 'interventionDivine', arbre: 'religion', nom: 'Intervention divine', emoji: '✨',
    cout: { P: 8 }, total: 8, conditions: ['conversion'],
    effetCourt: 'Débloque Prier (4 charges).',
    effetLong: 'Débloque l\'effet Prier (4 charges pour toute la partie). Prier permet : (1) Annuler une attaque empire en cours, (2) Relancer les dés d\'action joueur, (3) Annuler un événement à choix.',
    roleplay: 'Les dieux vous entendent. Quatre fois dans votre vie, votre prière sera exaucée.',
    immediat: false, permanent: true,
  },
]

// Index par id pour accès rapide
export const INNOVATIONS_MAP = Object.fromEntries(INNOVATIONS.map(i => [i.id, i]))

// Innovations par arbre
export const INNOVATIONS_PAR_ARBRE = {
  administration: INNOVATIONS.filter(i => i.arbre === 'administration'),
  exploitation:   INNOVATIONS.filter(i => i.arbre === 'exploitation'),
  guerre:         INNOVATIONS.filter(i => i.arbre === 'guerre'),
  religion:       INNOVATIONS.filter(i => i.arbre === 'religion'),
}

// Vérifier si une innovation est disponible (conditions remplies)
export function peutCommencerInnovation(id, innovations) {
  const innov = INNOVATIONS_MAP[id]
  if (!innov) return false
  if (innovations[id]?.unlocked) return false // déjà débloquée
  return innov.conditions.every(condId => innovations[condId]?.unlocked)
}

// Vérifier si le joueur peut cocher une case (jetons disponibles + conditions)
export function peutCocherCase(id, type, jetons, innovations) {
  if (!peutCommencerInnovation(id, innovations) && !innovations[id]?.checked) return false
  return (jetons[type] || 0) > 0
}

/**
 * data/evenements.js
 * 40 événements pour la piste d'événements.
 *
 * SYSTÈME :
 * - La piste compte 40 cases (eventIndex 0→39).
 * - Cases scriptées FIXES (déclenchées uniquement par résultat 5 sur dé empire) :
 *   index 7 (case 8), 14 (case 15), 22 (case 23), 29 (case 30), 36 (case 37), 39 (case 40)
 * - Toutes les autres cases : tirage ALÉATOIRE parmi les 40 événements, répétables.
 * - Case 40 (index 39) = Pression impériale : se répète à chaque résultat 5 ensuite.
 *
 * TYPES :
 *   'immediat'    → effet automatique, pas de popup joueur
 *   'choixJoueur' → ouvre un popup interactif (EvenementPanel)
 *   'nextTurn'    → stocké dans nextTurnEffects, appliqué au prochain tour
 */

// Cases scriptées (index 0-based)
export const CASES_SCRIPTEES = [7, 14, 22, 29, 36, 39]
export const CASE_PRESSION_IMPERIALE = 39
export const NB_CASES_PISTE = 40

// ── Événements ────────────────────────────────────────────────────────────
export const EVENEMENTS = [

  // ── 1 Aubaine ─────────────────────────────────────────────────────────
  {
    id: 1, titre: 'Aubaine', icone: '✨', cat: 'bonus',
    intro: 'Les étoiles sont alignées. Cette période de prospérité inattendue sourit à votre royaume.',
    texte: 'Au prochain tour, choisissez 3 dés d\'action au lieu de 2.',
    type: 'nextTurn',
    effet: { type: 'bonus3Des' },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 2 Abondance ───────────────────────────────────────────────────────
  {
    id: 2, titre: 'Abondance', icone: '🌾', cat: 'bonus',
    intro: 'Les greniers débordent, les marchands sont généreux. La chance est de votre côté.',
    texte: 'Choisissez 2 ressources à recevoir (stockage plein = grisé).',
    type: 'choixJoueur',
    effet: { type: 'gainRessources', nb: 2 },
    roleplay: false,
    cat_display: 'Bonus',
    choixTexte: `Choisissez 2 ressources parmi : Nourriture, Bois, Argile, Fer, Or.`,
    finScene: `Les ressources choisies arrivent dans vos entrepôts.`,
    effetTexte: `+1 de chaque ressource choisie.`,
  },

  // ── 3 Récolte exceptionnelle ──────────────────────────────────────────
  {
    id: 3, titre: 'Récolte exceptionnelle', icone: '🏠', cat: 'bonus',
    intro: 'Une saison bénie. Chaque ferme produit bien au-delà des attentes.',
    texte: '+1 Nourriture par Ferme sur votre territoire.',
    type: 'immediat',
    effet: { type: 'gainParBatiment', batiment: 'ferme', ressource: 'nourriture', nb: 1 },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 4 Filon découvert ─────────────────────────────────────────────────
  {
    id: 4, titre: 'Filon découvert', icone: '⛏️', cat: 'bonus',
    intro: 'Vos ouvriers percent la roche et mettent au jour une veine insoupçonnée de métal.',
    texte: '+1 Fer par Mine sur votre territoire.',
    type: 'immediat',
    effet: { type: 'gainParBatiment', batiment: 'mine', ressource: 'fer', nb: 1 },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 5 Commerce florissant ─────────────────────────────────────────────
  {
    id: 5, titre: 'Commerce florissant', icone: '🏪', cat: 'bonus',
    intro: 'Les routes commerciales s\'animent. Les marchands font affluer l\'or dans vos coffres.',
    texte: '+1 Or par Marché sur votre territoire.',
    type: 'immediat',
    effet: { type: 'gainParBatiment', batiment: 'marche', ressource: 'or', nb: 1 },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 6 Émergence de l'État ─────────────────────────────────────────────
  {
    id: 6, titre: "Émergence de l'État", icone: '👑', cat: 'bonus',
    intro: 'Votre réputation grandit. Un noble rejoint votre cour, accompagné d\'un sage prêtre.',
    texte: '+1 Noble et +1 Prêtre dans votre population.',
    type: 'immediat',
    effet: { type: 'gainPop', gains: { noble: 1, pretre: 1 } },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 7 Percée technologique ────────────────────────────────────────────
  {
    id: 7, titre: 'Percée technologique', icone: '📜', cat: 'bonus',
    intro: 'Vos chercheurs font une découverte inattendue. Le savoir avance d\'un grand pas.',
    texte: 'Au prochain tour, une action Étudier est disponible gratuitement (3e dé résultat 5).',
    type: 'nextTurn',
    effet: { type: 'etudierGratuit' },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 8 SCRIPTÉ — Premiers soubresauts ─────────────────────────────────
  {
    id: 8, titre: 'Premiers soubresauts', icone: '🌅', cat: 'scripte', scripte: true,
    intro: "De l'autre côté des frontières, les murmures de guerre deviennent des cris. Les empires commencent à s'agiter.",
    texte: "Tous les empires gagnent +2 Puissance maximale. L'empire le plus puissant colonise immédiatement 1 case libre.",
    type: 'immediat',
    effet: { type: 'premierssoubresauts' },
    roleplay: false,
    cat_display: 'Scripté',
  },

  // ── 9 Conseil des sages ───────────────────────────────────────────────
  {
    id: 9, titre: 'Conseil des sages', icone: '🧙', cat: 'bonus',
    intro: 'Vos sages et prêtres tiennent conseil. Leur sagesse vous offre un avantage stratégique.',
    texte: 'Si ≥5 Nobles ou ≥5 Prêtres : 3 dés au prochain tour. Sinon : +1 Noble et +1 Prêtre.',
    type: 'immediat',
    effet: { type: 'conseilDesSages' },
    roleplay: false,
    cat_display: 'Bonus',
  },

  // ── 10 Migration heureuse ─────────────────────────────────────────────
  {
    id: 10, titre: 'Migration heureuse', icone: '🚶', cat: 'bonus',
    intro: 'Des familles fuyant les terres voisines apportent leurs compétences et leur courage.',
    texte: 'A) +2 Fermiers  B) +2 Ouvriers  C) +2 Artisans  D) Les refouler.',
    type: 'choixJoueur',
    effet: { type: 'migrationHeureuse' },
    roleplay: false,
    cat_display: 'Bonus',
    choixTexte: `A)+2 Fermiers  B)+2 Ouvriers  C)+2 Artisans  D)Les refouler`,
    finScene: `[A/B/C] Les nouveaux venus construisent une cabane.
[D] Les familles repartent.`,
    effetTexte: `[A]+2 Fermiers+Cabane  [B]+2 Ouvriers+Cabane  [C]+2 Artisans+Cabane  [D]Empire+1 Puissance`,
  },

  // ── 11 Famine ─────────────────────────────────────────────────────────
  {
    id: 11, titre: 'Famine', icone: '💀', cat: 'malus',
    intro: 'Les réserves s\'épuisent. Votre peuple souffre. Il faut faire des choix douloureux.',
    texte: '1 Nourriture nourrit 5 pop. Nobles et Prêtres protégés. Désignez qui meurt parmi les non nourris.',
    type: 'choixJoueur',
    effet: { type: 'famine' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `1 Nourriture nourrit 5 pop. Nobles et Prêtres protégés. Désignez qui meurt.`,
    finScene: `Le calme revient. Les survivants reprennent le travail.`,
    effetTexte: `Nourriture déduite. Populations désignées mortes.`,
  },

  // ── 12 Épidémie ───────────────────────────────────────────────────────
  {
    id: 12, titre: 'Épidémie', icone: '🤒', cat: 'malus',
    intro: 'Un mal mystérieux se répand dans vos rangs. Personne n\'est épargné.',
    texte: 'Désignez 2 populations qui meurent (toutes catégories). Avec Hôpital : 1 seule perte.',
    type: 'choixJoueur',
    effet: { type: 'epidemie' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `Désignez 2 populations qui meurent. Avec Hôpital : 1 seule perte.`,
    finScene: `Les malades sont isolés. Le peuple reprend pied.`,
    effetTexte: `[Sans Hôpital]-2 pop  [Avec Hôpital]-1 pop`,
  },

  // ── 13 Sécheresse ─────────────────────────────────────────────────────
  {
    id: 13, titre: 'Sécheresse', icone: '☀️', cat: 'malus',
    intro: 'Le soleil brûle sans pitié. Les récoltes s\'assèchent sur pied.',
    texte: 'A) Payer 2 Fer [grisé si <2]  B) Subir : fermes Désert/Plaine inactives au prochain tour.',
    type: 'choixJoueur',
    effet: { type: 'secheresse' },
    roleplay: true,
    cat_display: 'Malus',
    choixTexte: `A)Payer 2 Fer  B)Subir l'effet`,
    finScene: `[A]Des puits creusés. Cultures sauvées.
[B]Les champs brûlent.`,
    effetTexte: `[A]-2 Fer
[B]Fermes Désert/Plaine inactives au prochain tour`,
  },

  // ── 14 Tremblement de terre ───────────────────────────────────────────
  {
    id: 14, titre: 'Tremblement de terre', icone: '💥', cat: 'malus',
    intro: 'La terre gronde. Des bâtiments s\'effondrent, semant la panique dans la population.',
    texte: 'Désignez 2 bâtiments à détruire. Avec Génie civil : aucun effet.',
    type: 'choixJoueur',
    effet: { type: 'tremblementDeTerre' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `Désignez 2 bâtiments à détruire. Génie civil : aucune destruction.`,
    finScene: `[Sans GC]Décombres dégagés.
[Avec GC]Vos bâtiments résistent.`,
    effetTexte: `[Sans GC]2 bâtiments détruits
[Avec GC]Aucun effet`,
  },

  // ── 15 SCRIPTÉ — Montée en puissance ─────────────────────────────────
  {
    id: 15, titre: 'Montée en puissance', icone: '⚔️', cat: 'scripte', scripte: true,
    intro: 'Les armées s\'entraînent, les généraux planifient. La menace qui couvait prend enfin forme.',
    texte: '2 dés D4 lancés. Les empires correspondants gagnent +2 Puissance maximale et +2 Puissance courante.',
    type: 'immediat',
    effet: { type: 'monteeEnPuissance' },
    roleplay: false,
    cat_display: 'Scripté',
  },

  // ── 16 Révolte populaire ─────────────────────────────────────────────
  {
    id: 16, titre: 'Révolte populaire', icone: '⚡', cat: 'malus',
    intro: 'Le peuple gronde. Des incidents éclatent dans les quartiers ouvriers.',
    texte: '🎭 A) Distribuer de l\'Or  B) Envoyer l\'armée [grisé si <3 soldats]  C) Ne rien faire.',
    type: 'choixJoueur',
    effet: { type: 'revoltePopulaire' },
    roleplay: true,
    cat_display: 'Malus',
    choixTexte: `A)Distribuer de l'Or  B)Envoyer l'armée  C)Ne rien faire`,
    finScene: `[A]Les esprits s'apaisent.
[B]La révolte est matée.
[C]Les émeutiers pillent les réserves.`,
    effetTexte: `[A]-2 Or
[B]-2 Ouvriers/Fermiers
[C]-5 ressources`,
  },

  // ── 17 Inondation ─────────────────────────────────────────────────────
  {
    id: 17, titre: 'Inondation', icone: '🌊', cat: 'malus',
    intro: 'Les rivières débordent et noient les champs cultivés.',
    texte: 'A) Payer 1 Bois [grisé si <1]  B) Subir : fermes Marais/Fleuve inactives au prochain tour.',
    type: 'choixJoueur',
    effet: { type: 'inondation' },
    roleplay: true,
    cat_display: 'Malus',
    choixTexte: `A)Payer 1 Bois  B)Subir l'effet`,
    finScene: `[A]Des digues élevées. Champs sauvés.
[B]Les eaux montent. Champs noyés.`,
    effetTexte: `[A]-1 Bois
[B]Fermes Marais/Fleuve inactives`,
  },

  // ── 18 Incendie ───────────────────────────────────────────────────────
  {
    id: 18, titre: 'Incendie', icone: '🔥', cat: 'malus',
    intro: 'Un incendie ravage une partie de votre territoire avant d\'être maîtrisé.',
    texte: 'Désignez 1 bâtiment à détruire sur une case en Forêt ou adjacente. -1 Bois.',
    type: 'choixJoueur',
    effet: { type: 'incendie' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `Désignez 1 bâtiment à détruire en Forêt ou adjacent.`,
    finScene: `Les flammes s'éteignent.`,
    effetTexte: `Bâtiment détruit. -1 Bois.`,
  },

  // ── 19 Ressource épuisée ──────────────────────────────────────────────
  {
    id: 19, titre: 'Ressource épuisée', icone: '📉', cat: 'malus',
    intro: 'Le filon que vous exploitiez a tari. La production diminue.',
    texte: 'Choisissez 2 ressources à perdre parmi Or, Fer, Argile.',
    type: 'choixJoueur',
    effet: { type: 'ressourceEpuisee' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `Choisissez 2 ressources à perdre : Or, Fer ou Argile.`,
    finScene: `Les entrepôts se vident.`,
    effetTexte: `-2 ressources choisies`,
  },

  // ── 20 Éruption volcanique ────────────────────────────────────────────
  {
    id: 20, titre: 'Éruption volcanique', icone: '🌋', cat: 'malus',
    intro: 'Un volcan entre en activité. La lave et les cendres dévastent les terres alentour.',
    texte: 'Sur chaque case joueur adjacente à un Volcan : -1 bâtiment et -1 population au hasard.',
    type: 'immediat',
    effet: { type: 'eruptionVolcanique' },
    roleplay: false,
    cat_display: 'Malus',
  },

  // ── 21 Mauvais présages ───────────────────────────────────────────────
  {
    id: 21, titre: 'Mauvais présages', icone: '🌑', cat: 'malus',
    intro: 'Les astrologues annoncent des jours sombres. Le peuple est agité.',
    texte: 'A) -3 Or [grisé si <3]  B) -1 Prêtre -1 Noble [grisé si l\'un=0]  C) -1 dé prochain tour.',
    type: 'choixJoueur',
    effet: { type: 'mauvaisPresages' },
    roleplay: false,
    cat_display: 'Malus',
    choixTexte: `A)Dépenser 3 Or  B)-1 Prêtre et -1 Noble  C)-1 dé prochain tour`,
    finScene: `[A]Les Dieux apaisés.
[B]Des têtes tombent.
[C]Le désordre s'installe.`,
    effetTexte: `[A]-3 Or  [B]-1 Prêtre-1 Noble  [C]-1 dé`,
  },

  // ── 22 Expansion impériale ────────────────────────────────────────────
  {
    id: 22, titre: 'Expansion impériale', icone: '🗺️', cat: 'empire',
    intro: 'Les empires grandissent. Chaque territoire gagné nourrit davantage leur ambition.',
    texte: '+1 Puissance maximale par tranche de 2 cases contrôlées, pour chaque empire.',
    type: 'immediat',
    effet: { type: 'expansionImperiale' },
    roleplay: false,
    cat_display: 'Empire',
  },

  // ── 23 SCRIPTÉ — Le grand raid ────────────────────────────────────────
  {
    id: 23, titre: 'Le grand raid', icone: '🏹', cat: 'scripte', scripte: true,
    intro: 'Les empires coordonnent une offensive massive. Vos frontières tremblent.',
    texte: 'Tous les empires gagnent +2 Puissance maximale. Deux D40 supplémentaires sont lancés immédiatement.',
    type: 'immediat',
    effet: { type: 'grandRaid' },
    roleplay: false,
    cat_display: 'Scripté',
  },

  // ── 24 Hégémonie ──────────────────────────────────────────────────────
  {
    id: 24, titre: 'Hégémonie', icone: '🏰', cat: 'empire',
    intro: "L'empire dominant écrase toute résistance et étend son emprise sur les terres libres.",
    texte: "L'empire le plus puissant colonise les 2 cases libres les plus proches de son bord.",
    type: 'immediat',
    effet: { type: 'hegemonieEmpire', nb: 2 },
    roleplay: false,
    cat_display: 'Empire',
  },

  // ── 25 Alliance impériale ─────────────────────────────────────────────
  {
    id: 25, titre: 'Alliance impériale', icone: '🤝', cat: 'empire',
    intro: 'Deux grandes puissances s\'allient dans l\'ombre. Leurs armées grossissent.',
    texte: 'Les 2 empires les plus puissants gagnent chacun +2 Puissance courante.',
    type: 'immediat',
    effet: { type: 'allianceImperiale' },
    roleplay: false,
    cat_display: 'Empire',
  },

  // ── 26 Surveillance des frontières ───────────────────────────────────
  {
    id: 26, titre: 'Surveillance des frontières', icone: '👁️', cat: 'empire',
    intro: 'Des éclaireurs ennemis quadrillent vos terres. Chaque faiblesse est notée.',
    texte: "L'empire avec le plus de cases attaque votre case la plus exposée.",
    type: 'immediat',
    effet: { type: 'surveillanceFrontieres' },
    roleplay: false,
    cat_display: 'Empire',
  },

  // ── 27 Diplomatie ─────────────────────────────────────────────────────
  {
    id: 27, titre: 'Diplomatie', icone: '🕊️', cat: 'interact',
    intro: 'Un émissaire habile négocie une trêve temporaire avec une puissance voisine.',
    texte: 'Choisissez 1 empire : sa prochaine attaque sur vos cases est annulée.',
    type: 'choixJoueur',
    effet: { type: 'diplomatie' },
    roleplay: true,
    cat_display: 'Interaction',
    choixTexte: `Choisissez 1 empire pour conclure une trêve.`,
    finScene: `Le traité est signé. Prochaine attaque annulée.`,
    effetTexte: `Tribut actif sur cet empire.`,
  },

  // ── 28 Tribut forcé ───────────────────────────────────────────────────
  {
    id: 28, titre: 'Tribut forcé', icone: '💰', cat: 'interact',
    intro: "L'empire dominant exige son dû. Payer, c'est acheter la paix. Refuser, c'est s'exposer.",
    texte: 'A) Payer 3 Or [grisé si <3] → Tribut activé.  B) Refuser → 1 D40 immédiat.',
    type: 'choixJoueur',
    effet: { type: 'tributForce' },
    roleplay: false,
    cat_display: 'Interaction',
    choixTexte: `A)Payer 3 Or  B)Refuser`,
    finScene: `[A]Les soldats se retirent.
[B]L'empire se met en marche.`,
    effetTexte: `[A]-3 Or + Tribut  [B]1 D40 immédiat`,
  },

  // ── 29 Soumission des tribus ──────────────────────────────────────────
  {
    id: 29, titre: 'Soumission des tribus', icone: '🏕️', cat: 'interact',
    intro: 'Des tribus nomades frappent à vos portes, cherchant protection. Des soldats sont à leurs trousses !',
    texte: 'A) Protéger (-2 Guerriers) [grisé si <2] → case + Cabane + 2 Fermiers.  B) Refuser.',
    type: 'choixJoueur',
    effet: { type: 'soumissionDesTribus' },
    roleplay: false,
    cat_display: 'Interaction',
    choixTexte: `A)Protéger (-2 Guerriers)  B)Refuser`,
    finScene: `[A]Les tribus s'installent.
[B]Les tribus repartent.`,
    effetTexte: `[A]-2G+case+Cabane+2F  [B]Aucun effet`,
  },

  // ── 30 SCRIPTÉ — Éveil des titans ────────────────────────────────────
  {
    id: 30, titre: 'Éveil des titans', icone: '🌋', cat: 'scripte', scripte: true,
    intro: "La terre gronde. D'immenses forces se réveillent aux quatre coins du monde.",
    texte: 'Tous les empires gagnent +2 Puissance max et +1 Puissance. Le plus faible colonise 2 cases.',
    type: 'immediat',
    effet: { type: 'eveilDesTitans' },
    roleplay: false,
    cat_display: 'Scripté',
  },

  // ── 31 Travaux forcés ─────────────────────────────────────────────────
  {
    id: 31, titre: 'Travaux forcés', icone: '⚒️', cat: 'interact',
    intro: 'En période de crise, votre peuple se mobilise pour construire en urgence.',
    texte: 'A) Sacrifier 1 Ouvrier [grisé si 0] → bâtiment gratuit.  B) Refuser.',
    type: 'choixJoueur',
    effet: { type: 'travauxForces' },
    roleplay: false,
    cat_display: 'Interaction',
    choixTexte: `A)Sacrifier 1 Ouvrier (bâtiment gratuit)  B)Refuser`,
    finScene: `[A]Les chantiers s'ouvrent.
[B]Rien ne se construit.`,
    effetTexte: `[A]-1 Ouvrier+bâtiment gratuit  [B]Rien`,
  },

  // ── 32 Mercenaires ────────────────────────────────────────────────────
  {
    id: 32, titre: 'Mercenaires', icone: '🗡️', cat: 'interact',
    intro: 'Des soldats de fortune proposent leurs services. Leurs lames sont à louer.',
    texte: 'A) 2 Or→+1G  B) 4 Or→+2G  C) 6 Or→+3G  D) Décliner. [Niveaux grisés si Or insuffisant]',
    type: 'choixJoueur',
    effet: { type: 'mercenaires' },
    roleplay: false,
    cat_display: 'Interaction',
    choixTexte: `A)2 Or+1G  B)4 Or+2G  C)6 Or+3G  D)Décliner`,
    finScene: `[A/B/C]Mercenaires recrutés.
[D]Ils repartent déçus.`,
    effetTexte: `[A]-2Or+1G  [B]-4Or+2G  [C]-6Or+3G  [D]Rien`,
  },

  // ── 33 Espionnage ─────────────────────────────────────────────────────
  {
    id: 33, titre: 'Espionnage', icone: '🔍', cat: 'interact',
    intro: 'Vos agents infiltrent les cours ennemies et rapportent des informations précieuses.',
    texte: 'A) Espionner 1 empire → révèle profil D40 + Tribut gratuit.  B) Ne pas espionner.',
    type: 'choixJoueur',
    effet: { type: 'espionnage' },
    roleplay: false,
    cat_display: 'Interaction',
    choixTexte: `A)Espionner 1 empire  B)Ne pas espionner`,
    finScene: `[A]Vos agents rapportent des documents dérobés.
[B]Vous rappelez vos espions.`,
    effetTexte: `[A]Profil D40 révélé + Tribut actif  [B]Aucun effet`,
  },

  // ── 34 Éclipse ────────────────────────────────────────────────────────
  {
    id: 34, titre: 'Éclipse', icone: '🌑', cat: 'neutre',
    intro: 'Un phénomène céleste terrifie les armées. Nul n\'ose bouger.',
    texte: 'Aucun empire ne peut vous attaquer CE tour. Les colonisations restent autorisées.',
    type: 'immediat',
    effet: { type: 'eclipse' },
    roleplay: false,
    cat_display: 'Neutre',
  },

  // ── 35 Découverte ─────────────────────────────────────────────────────
  {
    id: 35, titre: 'Découverte', icone: '🧭', cat: 'neutre',
    intro: 'Un cartographe revient avec des cartes d\'un territoire inexploré.',
    texte: 'Explorez gratuitement 1 case non explorée adjacente à votre territoire.',
    type: 'choixJoueur',
    effet: { type: 'decouverte' },
    roleplay: false,
    cat_display: 'Neutre',
    choixTexte: `Choisissez 1 case non explorée adjacente.`,
    finScene: `Les cartes se déroulent.`,
    effetTexte: `Case explorée. Terrain révélé.`,
  },

  // ── 36 Retournement de fortune ────────────────────────────────────────
  {
    id: 36, titre: 'Retournement de fortune', icone: '⚖️', cat: 'neutre',
    intro: 'Les dieux sont capricieux. La puissance de l\'empire dominant s\'effondre.',
    texte: 'L\'empire le plus puissant perd la moitié de sa Puissance courante (arrondie ↓).',
    type: 'immediat',
    effet: { type: 'retournementDeFortune' },
    roleplay: false,
    cat_display: 'Neutre',
  },

  // ── 37 SCRIPTÉ — Tempête de fer ──────────────────────────────────────
  {
    id: 37, titre: 'Tempête de fer', icone: '🌪️', cat: 'scripte', scripte: true,
    intro: 'Les empires entrent dans une ère de conquête brutale. Le monde tremble.',
    texte: '+2 Puissance max à tous. Les 2 plus puissants colonisent 2 cases. Le plus faible +3 Puissance.',
    type: 'immediat',
    effet: { type: 'tempeteDeFer' },
    roleplay: false,
    cat_display: 'Scripté',
  },

  // ── 38 Migrations impériales ──────────────────────────────────────────
  {
    id: 38, titre: 'Migrations impériales', icone: '🌐', cat: 'neutre',
    intro: 'Un grand mouvement de population remodèle les équilibres.',
    texte: 'Les 2 empires les plus puissants colonisent chacun 1 case libre. Vous recevez +1 Fermier et +1 Ouvrier.',
    type: 'immediat',
    effet: { type: 'migrationsImperiales' },
    roleplay: false,
    cat_display: 'Neutre',
  },

  // ── 39 Catastrophe naturelle ──────────────────────────────────────────
  {
    id: 39, titre: 'Catastrophe naturelle', icone: '🌪️', cat: 'neutre',
    intro: 'Un cataclysme frappe sans distinction. Empires et joueur subissent les conséquences.',
    texte: 'Chaque empire perd la case la plus proche d\'une case joueur (-2 Puissance). Vous perdez 1 bâtiment.',
    type: 'choixJoueur',
    effet: { type: 'catastropheNaturelle' },
    roleplay: true,
    cat_display: 'Neutre',
    choixTexte: `Désignez 1 bâtiment à détruire.`,
    finScene: `Le cataclysme s'éloigne.`,
    effetTexte: `Empires perdent 1 case proche (-2 Puissance). Bâtiment détruit.`,
  },

  // ── 40 SCRIPTÉ — Pression impériale (se répète) ──────────────────────
  {
    id: 40, titre: 'Pression impériale', icone: '👁️', cat: 'scripte', scripte: true,
    grave: true, estDernier: true,
    intro: 'Une ombre définitive s\'étend sur vos frontières. Les empires ont décidé d\'en finir.',
    texte: 'Tous les empires +2 Puissance max. Désormais chaque résultat 5 donne +1 Puissance et +1 max au plus puissant.',
    type: 'immediat',
    effet: { type: 'pressionImperiale' },
    roleplay: false,
    cat_display: 'Scripté',
  },
]

// ── Utilitaires ───────────────────────────────────────────────────────────

export const DERNIER_EVENEMENT_IDX = NB_CASES_PISTE - 1

/**
 * Retourne l'événement scripté pour une case donnée (index 0-based).
 * Retourne null si la case n'est pas scriptée.
 */
export function getEvenementScripte(caseIndex) {
  if (!CASES_SCRIPTEES.includes(caseIndex)) return null
  // Les événements scriptés par case :
  const scriptedMap = {
    7:  EVENEMENTS.find(e => e.id === 8),   // case 8
    14: EVENEMENTS.find(e => e.id === 15),  // case 15
    22: EVENEMENTS.find(e => e.id === 23),  // case 23
    29: EVENEMENTS.find(e => e.id === 30),  // case 30
    36: EVENEMENTS.find(e => e.id === 37),  // case 37
    39: EVENEMENTS.find(e => e.id === 40),  // case 40
  }
  return scriptedMap[caseIndex] || null
}

/**
 * Tire un événement aléatoire parmi les événements NON scriptés.
 * Les événements scriptés (ids 8,15,23,30,37,40) ne peuvent pas être tirés aléatoirement.
 */
const EVENEMENTS_ALEATOIRES = EVENEMENTS.filter(e => !e.scripte)

export function tirerEvenementAleatoire() {
  const idx = Math.floor(Math.random() * EVENEMENTS_ALEATOIRES.length)
  return EVENEMENTS_ALEATOIRES[idx]
}

/**
 * Retourne l'événement à déclencher pour la case eventIndex donnée.
 * - Si case scriptée → événement fixe
 * - Sinon → tirage aléatoire
 * - Si pression impériale déjà active → toujours evt 40
 */
export function getEvenementPourCase(eventIndex, pressionActive) {
  if (pressionActive || eventIndex >= NB_CASES_PISTE) {
    return EVENEMENTS.find(e => e.id === 40)
  }
  const scripte = getEvenementScripte(eventIndex)
  if (scripte) return scripte
  return tirerEvenementAleatoire()
}

/**
 * Compatibilité avec l'ancien code qui appelle getEvenementActuel(eventIndex).
 * @deprecated Utiliser getEvenementPourCase à la place.
 */
export function getEvenementActuel(eventIndex) {
  return getEvenementPourCase(eventIndex, false)
}

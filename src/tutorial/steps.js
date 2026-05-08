/**
 * Tutorial steps — 4X Lite
 *
 * Point d'ancrage pour le tutoriel interactif (prévu post-alpha).
 * Chaque step définit :
 *   - id         : identifiant unique du step
 *   - highlight  : sélecteur CSS de l'élément à mettre en évidence
 *   - text       : clé i18n du texte d'instruction
 *   - arrow      : position de la flèche ('top'|'bottom'|'left'|'right')
 *   - condition  : fonction (gameState) => boolean — quand ce step est actif
 *   - onComplete : fonction (gameState, dispatch) => void — action à déclencher
 *
 * Pour activer le tutoriel, remplir ce tableau et passer
 * tutorialActive: true dans le gameStore.
 */

export const tutorialSteps = [
  // Exemple de structure — à remplir en post-alpha :
  // {
  //   id: 'welcome',
  //   highlight: '#game-map',
  //   text: 'tutorial.welcome',
  //   arrow: 'bottom',
  //   condition: (state) => state.turn === 1,
  //   onComplete: (state, dispatch) => {},
  // },
]

export default tutorialSteps

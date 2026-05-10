/**
 * data/d40Config.js
 * Configuration du D40 : attribution des faces aux cases de bord de la carte 5×5.
 * Générée aléatoirement au setup et stockée dans le gameState.
 *
 * La carte 5×5 a 4 bords × 5 cases = 20 cases de bord.
 * Chaque case de bord se voit attribuer un certain nombre de faces.
 *
 * 4 profils d'empire (mélangés aléatoirement au setup) :
 * - Profil A : 5 cases × 1 face  = 5 faces
 * - Profil B : 2×1 + 3×2         = 8 faces  (côté groupé aléatoire : gauche ou droite)
 * - Profil C : 5 cases × 2 faces = 10 faces
 * - Profil D : 3×3 + 2×4         = 17 faces (côté groupé aléatoire)
 * Total : 40 faces = 1D40
 *
 * Chaque empire occupe un bord de la carte 5×5 :
 * - Empire 1 (Varyndor) : bord haut    → cases (0,0)..(0,4)
 * - Empire 2 (Elyssar)  : bord droite  → cases (0,4)..(4,4)
 * - Empire 3 (Kharzun)  : bord bas     → cases (4,0)..(4,4)
 * - Empire 4 (Solmeria) : bord gauche  → cases (0,0)..(4,0)
 */

// Les 4 profils de distribution des faces
const PROFILS = [
  { id: 'A', faces: [1,1,1,1,1] },                     // 5 faces total
  { id: 'B', facesGauche: [1,1,2,2,2], facesDroite: [2,2,2,1,1] }, // 8 faces, côté variable
  { id: 'C', faces: [2,2,2,2,2] },                     // 10 faces total
  { id: 'D', facesGauche: [3,3,3,4,4], facesDroite: [4,4,3,3,3] }, // 17 faces, côté variable
]

/**
 * Génère la configuration D40 aléatoirement.
 * Retourne un tableau de 40 entrées { empireId, row, col }
 * où chaque entrée représente une face du D40.
 */
export function genererConfigD40() {
  // Mélanger les profils entre les 4 empires
  const profils = [...PROFILS]
  for (let i = profils.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [profils[i], profils[j]] = [profils[j], profils[i]]
  }

  // Cases de bord par empire (dans l'ordre, de gauche à droite ou de haut en bas)
  const bordeaux = {
    1: Array.from({length:5}, (_,i) => ({row:0, col:i})),   // haut
    2: Array.from({length:5}, (_,i) => ({row:i, col:4})),   // droite
    3: Array.from({length:5}, (_,i) => ({row:4, col:4-i})), // bas (droite→gauche)
    4: Array.from({length:5}, (_,i) => ({row:4-i, col:0})), // gauche (bas→haut)
  }

  // Pour chaque empire (1-4), attribuer son profil et générer les faces
  const faces = [] // { empireId, row, col, face: numéro 1..40 }
  let faceNum = 1

  for (let empireId = 1; empireId <= 4; empireId++) {
    const profil = profils[empireId - 1]
    const cases  = bordeaux[empireId]

    // Déterminer les faces par case
    let facesParCase
    if (profil.faces) {
      facesParCase = profil.faces
    } else {
      // Côté aléatoire pour B et D
      facesParCase = Math.random() < 0.5 ? profil.facesGauche : profil.facesDroite
    }

    // Générer les entrées
    for (let i = 0; i < 5; i++) {
      const nb = facesParCase[i]
      for (let f = 0; f < nb; f++) {
        faces.push({ empireId, row: cases[i].row, col: cases[i].col, faceD40: faceNum })
        faceNum++
      }
    }
  }

  return faces // 40 entrées
}

/**
 * Résoudre un lancer de D40 : retourne l'entrée correspondante.
 */
export function resoudreD40(valeur, configD40) {
  return configD40.find(f => f.faceD40 === valeur) || null
}

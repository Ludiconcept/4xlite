/**
 * d40Config.js — v2
 *
 * Attribution fixe des bords :
 * - Solmeria (4) : bords gauches des 5 lignes  → avance gauche→droite
 * - Varyndor (1) : bords hauts des 5 colonnes  → avance haut→bas
 * - Elyssar  (2) : bords droits des 5 lignes   → avance droite→gauche
 * - Kharzun  (3) : bords bas des 5 colonnes    → avance bas→haut
 *
 * 4 profils distribués aléatoirement entre les 4 empires au setup :
 * A: 1×5=5, B: 1+1+2+2+2=8, C: 2×5=10, D: 3+3+3+4+4=17 → total 40
 */

const PROFILS = [
  { id:'A', faces:[1,1,1,1,1] },
  { id:'B', facesL:[1,1,2,2,2], facesR:[2,2,2,1,1] },
  { id:'C', faces:[2,2,2,2,2] },
  { id:'D', facesL:[3,3,3,4,4], facesR:[4,4,3,3,3] },
]

// Bords fixes par empire : { empireId, row, col, direction }
// direction = vecteur de déplacement (dr, dc) depuis le bord vers l'intérieur
const BORDS_EMPIRE = {
  4: Array.from({length:5},(_,i)=>({ row:i, col:0,  dr:0, dc: 1 })),  // Solmeria : gauche→droite
  1: Array.from({length:5},(_,i)=>({ row:0, col:i,  dr:1, dc: 0 })),  // Varyndor : haut→bas
  2: Array.from({length:5},(_,i)=>({ row:i, col:4,  dr:0, dc:-1 })),  // Elyssar  : droite→gauche
  3: Array.from({length:5},(_,i)=>({ row:4, col:i,  dr:-1,dc: 0 })),  // Kharzun  : bas→haut
}

export function genererConfigD40() {
  // Mélanger les 4 profils aléatoirement entre les 4 empires
  const profils = [...PROFILS]
  for (let i=profils.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1));
    [profils[i],profils[j]]=[profils[j],profils[i]]
  }

  const faces = []
  let faceNum = 1
  const empireOrder = [4,1,2,3] // ordre d'attribution des profils

  empireOrder.forEach((empireId, pIdx) => {
    const profil = profils[pIdx]
    const bords  = BORDS_EMPIRE[empireId]
    const facesParCase = profil.faces || (Math.random()<0.5 ? profil.facesL : profil.facesR)

    bords.forEach((bord, i) => {
      const nb = facesParCase[i]
      for (let f=0; f<nb; f++) {
        faces.push({ empireId, row:bord.row, col:bord.col, dr:bord.dr, dc:bord.dc, faceD40:faceNum })
        faceNum++
      }
    })
  })

  return faces // 40 entrées
}

export function resoudreD40(valeur, configD40) {
  return configD40?.find(f => f.faceD40 === valeur) || null
}

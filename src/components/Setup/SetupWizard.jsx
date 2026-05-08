import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { GameMap } from '../Map/GameMap.jsx'
import { TERRAIN_FROM_DIE, CURIOSITY_FROM_DIE, RESOURCE_FROM_2DICE } from '../../data/constants.js'

function rollDie() { return Math.floor(Math.random() * 6) + 1 }
function rollDice(n) { return Array.from({ length: n }, rollDie) }

const TERRAIN_NAMES = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne' }
const CURIOSITY_NAMES = { fleuve:'Fleuve 🌊', volcan:'Volcan 🌋', lac:'Lac 🏞️', none:'Aucune curiosité' }
const RESOURCE_NAMES = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or', gibier:'Gibier', foret_gibier:'Forêt + Gibier' }

// Dé animé
function AnimatedDie({ value, selected, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-12 h-12 rounded-xl border-2 flex flex-col items-center justify-center font-bold text-lg transition-all
        ${selected ? 'border-amber-500 bg-amber-50 text-amber-700 scale-105' : 'border-slate-300 bg-white text-slate-800'}
        ${disabled ? 'opacity-30 cursor-default' : 'hover:border-amber-400 cursor-pointer'}
      `}
    >
      {value}
    </button>
  )
}

export function SetupWizard() {
  const { game, updateGame, setPhase } = useGameStore()
  const addEntry = useLogStore((s) => s.addEntry)

  const [step, setStep] = useState(1)
  const [dice, setDice] = useState([])
  const [rolled, setRolled] = useState(false)
  const [selected, setSelected] = useState([])
  const [startSquare, setStartSquare] = useState(null) // {row, col} coin haut-gauche du carré 2x2
  const [terrainChoices, setTerrainChoices] = useState({}) // {tileKey: terrain} pour les 6
  const [curiosityPlacements, setCuriosityPlacements] = useState([])
  const [resourcePlacements, setResourcePlacements] = useState([])

  // Tuiles du carré de départ sélectionné
  const startTiles = startSquare
    ? [[startSquare.row, startSquare.col],[startSquare.row, startSquare.col+1],
       [startSquare.row+1, startSquare.col],[startSquare.row+1, startSquare.col+1]]
    : []

  function handleRoll(n = 4) {
    setDice(rollDice(n))
    setRolled(true)
    setSelected([])
  }

  function toggleSelect(i) {
    if (selected.includes(i)) {
      setSelected(selected.filter((x) => x !== i))
    } else if (selected.length < 2) {
      setSelected([...selected, i])
    }
  }

  // ── Step 1 : sélection du carré de départ ──
  function handleTileClickStep1(tile) {
    const { row, col } = tile
    // Vérifier que le carré 2x2 tient dans la grille
    if (row < 4 && col < 4) {
      setStartSquare({ row, col })
    }
  }

  function confirmStep1() {
    if (!startSquare) return
    // Marquer les 4 cases comme appartenant au joueur
    updateGame((g) => {
      const newMap = g.map.map((r) => r.map((t) => {
        const isStart = startTiles.some(([sr, sc]) => sr === t.row && sc === t.col)
        if (isStart) return { ...t, explored: true, owner: 'player' }
        return t
      }))
      return { ...g, map: newMap, setupStep: 2 }
    })
    setStep(2)
    handleRoll(4)
  }

  // ── Step 2 : terrains ──
  function applyTerrains() {
    // Pour chaque tuile de départ, on associe un dé
    updateGame((g) => {
      const newMap = g.map.map((r) => r.map((t) => {
        const idx = startTiles.findIndex(([sr, sc]) => sr === t.row && sc === t.col)
        if (idx === -1) return t
        const dieVal = dice[idx]
        const terrain = dieVal === 6
          ? (terrainChoices[`${t.row}-${t.col}`] || 'plaine')
          : TERRAIN_FROM_DIE[dieVal]
        return { ...t, terrain }
      }))
      return { ...g, map: newMap, setupStep: 3 }
    })
    setStep(3)
    handleRoll(4)
    setSelected([])
  }

  // ── Step 3 : curiosités ──
  function confirmCuriosities() {
    if (selected.length < 2) return
    const chosen = selected.map((i) => ({ die: dice[i], type: CURIOSITY_FROM_DIE[dice[i]] }))
    setCuriosityPlacements(chosen)
    setStep(4)
  }

  // ── Step 4 : placement fleuve (simplifié — on met juste un drapeau hasFleuve) ──
  function handleTileClickStep4(tile) {
    // Bord = row===0, row===4, col===0, col===4
    const { row, col } = tile
    const isBorder = row === 0 || row === 4 || col === 0 || col === 4
    if (!isBorder) return
    // Appliquer le fleuve sur toute la ligne/colonne
    updateGame((g) => {
      const isVertical = row === 0 || row === 4
      const newMap = g.map.map((r) => r.map((t) => {
        const onPath = isVertical ? t.col === col : t.row === row
        return onPath ? { ...t, hasFleuve: true } : t
      }))
      return { ...g, map: newMap }
    })
    setStep(5)
    handleRoll(4)
    setSelected([])
  }

  // Si pas de fleuve parmi les curiosités, on saute l'étape 4
  function skipStep4() {
    setStep(5)
    handleRoll(4)
    setSelected([])
  }

  // ── Step 5 : ressources initiales ──
  function confirmResources() {
    if (selected.length < 2) return
    // On place les 2 ressources sur les 2 premières tuiles du territoire
    const r1die = dice[selected[0]]
    const r2die = dice[selected[1]]
    const sum1 = r1die // simplifié — normalement 2 dés
    const sum2 = r2die
    const res1 = RESOURCE_FROM_2DICE[sum1] || RESOURCE_FROM_2DICE[7]
    const res2 = RESOURCE_FROM_2DICE[sum2] || RESOURCE_FROM_2DICE[5]

    updateGame((g) => {
      let applied = 0
      const newMap = g.map.map((r) => r.map((t) => {
        if (t.owner !== 'player') return t
        if (applied === 0 && res1.type) {
          applied++
          return { ...t, resource1: { type: res1.type, quantity: 1 } }
        }
        if (applied === 1 && res2.type) {
          applied++
          return { ...t, resource2: { type: res2.type, quantity: 1 } }
        }
        return t
      }))
      return { ...g, map: newMap, setupStep: 6 }
    })
    setStep(6)
  }

  // ── Step 6 : population (automatique) ──
  function confirmPopulation() {
    updateGame((g) => ({ ...g, population: { fermier:1, ouvrier:1, artisan:0, guerrier:1, pretre:0, noble:0 }, setupStep: 7 }))
    setStep(7)
  }

  // ── Step 7 : confirmation finale ──
  function startGame() {
    updateGame((g) => ({ ...g, phase: 'playing', setupStep: 7, turn: 1 }))
    addEntry('La partie commence. Que votre empire prospère !', 0)
  }

  const hasFleuve = curiosityPlacements.some((c) => c.type === 'fleuve')

  return (
    <div className="flex flex-col h-full">
      {/* En-tête setup */}
      <div className="bg-slate-700 text-white px-4 py-2 flex items-center gap-3">
        <span className="font-medium">4X Lite — Préparation</span>
        <span className="text-sm text-slate-300">Étape {step} / 7</span>
        <div className="flex gap-1 ml-auto">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < step ? 'bg-amber-400' : 'bg-slate-500'}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Panneau gauche — instructions */}
        <div className="w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Choisissez votre territoire</h2>
              <p className="text-sm text-slate-600">Cliquez sur une case dans la carte pour placer votre empire naissant (carré 2×2).</p>
              {startSquare && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Territoire sélectionné en ({startSquare.row + 1}, {startSquare.col + 1})
                </div>
              )}
              <button
                onClick={confirmStep1}
                disabled={!startSquare}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-40 hover:bg-amber-600"
              >
                Confirmer →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Terrains de départ</h2>
              <p className="text-sm text-slate-600">Chaque dé définit le terrain d'une case. Un 6 = terrain au choix.</p>
              <div className="grid grid-cols-4 gap-2">
                {dice.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg border-2 border-slate-300 bg-white flex items-center justify-center font-bold text-lg">{d}</div>
                    <span className="text-xs text-slate-500 text-center">
                      {d === 6 ? 'Au choix' : (TERRAIN_NAMES[TERRAIN_FROM_DIE[d]] || '?')}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={applyTerrains} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600">
                Appliquer les terrains →
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Curiosités géographiques</h2>
              <p className="text-sm text-slate-600">Choisissez 2 résultats parmi les 4 dés.</p>
              <div className="grid grid-cols-2 gap-2">
                {dice.map((d, i) => (
                  <AnimatedDie key={i} value={d} selected={selected.includes(i)}
                    disabled={!selected.includes(i) && selected.length >= 2}
                    onClick={() => toggleSelect(i)} />
                ))}
              </div>
              {selected.length === 2 && (
                <div className="text-sm text-slate-600">
                  Choix : {selected.map((i) => CURIOSITY_NAMES[CURIOSITY_FROM_DIE[dice[i]]]).join(' + ')}
                </div>
              )}
              <button onClick={confirmCuriosities} disabled={selected.length < 2}
                className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-40 hover:bg-amber-600">
                Confirmer →
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Placement du Fleuve</h2>
              <p className="text-sm text-slate-600">Cliquez sur une case du bord de la carte pour placer l'origine du fleuve. Il traversera toute la carte.</p>
              <button onClick={skipStep4} className="text-sm text-slate-500 underline">
                Passer (pas de fleuve)
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Ressources initiales</h2>
              <p className="text-sm text-slate-600">Choisissez 2 ressources à placer sur vos cases. Si incompatible avec le terrain, vous pouvez relancer.</p>
              <div className="grid grid-cols-2 gap-2">
                {dice.map((d, i) => (
                  <AnimatedDie key={i} value={d} selected={selected.includes(i)}
                    disabled={!selected.includes(i) && selected.length >= 2}
                    onClick={() => toggleSelect(i)} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRoll(4)} className="text-sm text-slate-500 underline">Relancer</button>
                <button onClick={confirmResources} disabled={selected.length < 2}
                  className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-40 hover:bg-amber-600">
                  Confirmer →
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Population de départ</h2>
              <p className="text-sm text-slate-600">Votre empire naissant commence avec :</p>
              <div className="bg-slate-50 rounded-lg p-3 flex flex-col gap-1 text-sm">
                <div className="flex justify-between"><span>🧑‍🌾 Fermier</span><span className="font-medium">1</span></div>
                <div className="flex justify-between"><span>👷 Ouvrier</span><span className="font-medium">1</span></div>
                <div className="flex justify-between"><span>⚔️ Guerrier</span><span className="font-medium">1</span></div>
              </div>
              <button onClick={confirmPopulation} className="bg-amber-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-600">
                Confirmer →
              </button>
            </div>
          )}

          {step === 7 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-slate-800">Prêt à conquérir !</h2>
              <p className="text-sm text-slate-600">Les 4 empires adverses sont initialisés. Votre empire est prêt.</p>
              <div className="bg-slate-50 rounded-lg p-3 text-sm flex flex-col gap-1">
                <div className="flex justify-between"><span>🐉 Varyndor</span><span>Pui. 2 / 8</span></div>
                <div className="flex justify-between"><span>🦅 Elyssar</span><span>Pui. 2 / 8</span></div>
                <div className="flex justify-between"><span>🐺 Kharzun</span><span>Pui. 2 / 8</span></div>
                <div className="flex justify-between"><span>🦁 Solmeria</span><span>Pui. 2 / 8</span></div>
              </div>
              <button onClick={startGame} className="bg-blue-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-800 text-base">
                🚀 Lancer la partie !
              </button>
            </div>
          )}
        </div>

        {/* Carte en prévisualisation */}
        <div className="flex-1 p-4 flex items-center justify-center bg-slate-50">
          <GameMap
            map={game?.map}
            empires={game?.empires}
            onTileClick={step === 1 ? handleTileClickStep1 : step === 4 ? handleTileClickStep4 : undefined}
            highlightTiles={step === 1 ? getValidStartTiles(game?.map, startSquare) : []}
            selectedTile={null}
          />
        </div>
      </div>
    </div>
  )
}

// Cases valides pour le carré de départ (bord intérieur de la grille)
function getValidStartTiles(map, selected) {
  if (!map) return []
  const highlights = []
  for (let r = 0; r <= 3; r++) {
    for (let c = 0; c <= 3; c++) {
      if (selected && selected.row === r && selected.col === c) continue
      highlights.push({ row: r, col: c }, { row: r, col: c+1 },
                      { row: r+1, col: c }, { row: r+1, col: c+1 })
    }
  }
  return highlights
}

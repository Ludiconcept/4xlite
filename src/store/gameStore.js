import { create } from 'zustand'
import { createInitialGameState } from '../data/gameState.js'

const SAVE_KEY = '4xlite_save'
const SAVE_VERSION = '1.2.0'  // S6v12 - bump pour forcer réinit

// ─────────────────────────────────────────────────────────────
// Sauvegarde / restauration localStorage
// ─────────────────────────────────────────────────────────────
function saveToStorage(state) {
  try {
    const toSave = {
      ...state,
      version: SAVE_VERSION,
      lastSavedAt: new Date().toISOString(),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(toSave))
  } catch (e) {
    console.warn('[4X Lite] Impossible de sauvegarder la partie :', e)
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Vérification de version pour les migrations futures
    if (parsed.version !== SAVE_VERSION) {
      console.warn('[4X Lite] Version de sauvegarde différente, migration nécessaire.')
      // Pour l'instant on retourne null — à enrichir en V2
      return null
    }
    return parsed
  } catch (e) {
    console.warn('[4X Lite] Impossible de charger la sauvegarde :', e)
    return null
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY)
}

// ─────────────────────────────────────────────────────────────
// Store principal Zustand
// ─────────────────────────────────────────────────────────────
export const useGameStore = create((set, get) => ({
  // ── État du jeu ────────────────────────────────────────────
  game: null, // null = pas de partie en cours

  // ── Chargement / démarrage ─────────────────────────────────
  startNewGame() {
    const initial = createInitialGameState()
    initial.createdAt = new Date().toISOString()
    set({ game: initial })
    saveToStorage(initial)
    console.info('[4X Lite] Nouvelle partie démarrée.')
  },

  resumeGame() {
    const saved = loadFromStorage()
    if (saved) {
      set({ game: saved })
      console.info('[4X Lite] Partie reprise.')
      return true
    }
    return false
  },

  // ── Mise à jour générique de l'état ───────────────────────
  // Toutes les actions du moteur appellent updateGame()
  // afin que la sauvegarde soit toujours déclenchée
  updateGame(updater) {
    set((state) => {
      const newGame = updater(state.game)
      saveToStorage(newGame)
      return { game: newGame }
    })
  },

  // ── Raccourcis fréquents ───────────────────────────────────
  setPhase(phase) {
    get().updateGame((g) => ({ ...g, phase }))
  },

  setSetupStep(step) {
    get().updateGame((g) => ({ ...g, setupStep: step }))
  },

  advanceTurn() {
    get().updateGame((g) => ({
      ...g,
      turn: g.turn + 1,
      actionsRemaining: g.activeEffects.pdmCorpsActive ? 2 : 2, // géré au lancer de dés
      playerTurn: true,
      turnLimits: { grandir: 0, recruter: 0, commerce: 0, servageUsed: false },
      dice: { values: [], selected: [], rolled: false, modified: [] },
    }))
  },

  // ── Tile helpers ──────────────────────────────────────────
  updateTile(row, col, updates) {
    get().updateGame((g) => {
      const newMap = g.map.map((r, ri) =>
        r.map((tile, ci) =>
          ri === row && ci === col ? { ...tile, ...updates } : tile
        )
      )
      return { ...g, map: newMap }
    })
  },

  // ── Population ────────────────────────────────────────────
  updatePopulation(updates) {
    get().updateGame((g) => ({
      ...g,
      population: { ...g.population, ...updates },
    }))
  },

  addPopulation(type, amount = 1) {
    get().updateGame((g) => ({
      ...g,
      population: {
        ...g.population,
        [type]: Math.max(0, (g.population[type] || 0) + amount),
      },
    }))
  },

  // ── Ressources ────────────────────────────────────────────
  updateResources(updates) {
    get().updateGame((g) => ({
      ...g,
      resources: { ...g.resources, ...updates },
    }))
  },

  addResource(type, amount) {
    get().updateGame((g) => {
      const current = g.resources[type] || 0
      const total = Object.values(g.resources).reduce((a, b) => a + b, 0)
      const available = g.storageMax - total
      const toAdd = Math.min(amount, available)
      return {
        ...g,
        resources: {
          ...g.resources,
          [type]: current + toAdd,
        },
      }
    })
  },

  spendResource(type, amount) {
    get().updateGame((g) => ({
      ...g,
      resources: {
        ...g.resources,
        [type]: Math.max(0, (g.resources[type] || 0) - amount),
      },
    }))
  },

  // ── Empires ───────────────────────────────────────────────
  updateEmpire(id, updates) {
    get().updateGame((g) => ({
      ...g,
      empires: {
        ...g.empires,
        [id]: { ...g.empires[id], ...updates },
      },
    }))
  },

  damageEmpire(id, damage) {
    get().updateGame((g) => {
      const empire = g.empires[id]
      let power = empire.power
      let maxPower = empire.maxPower
      let remaining = damage

      // D'abord réduire la Puissance
      if (power > 0) {
        const powerDmg = Math.min(power, remaining)
        power -= powerDmg
        remaining -= powerDmg
      }
      // Puis réduire la Puissance max (définitivement)
      if (remaining > 0) {
        maxPower = Math.max(0, maxPower - remaining)
      }

      return {
        ...g,
        empires: {
          ...g.empires,
          [id]: { ...empire, power, maxPower },
        },
      }
    })
  },

  // ── Innovations ───────────────────────────────────────────
  checkInnovationBoxes(innovationId, count) {
    get().updateGame((g) => {
      const current = g.innovations[innovationId]
      if (!current || current.unlocked) return g
      const newChecked = current.checked + count
      // Pour savoir si elle est débloquée, on calcule le total de cases requis
      // Ce calcul se fait dans le moteur — ici on stocke juste les cases cochées
      return {
        ...g,
        innovations: {
          ...g.innovations,
          [innovationId]: {
            ...current,
            checked: newChecked,
          },
        },
      }
    })
  },

  unlockInnovation(innovationId) {
    get().updateGame((g) => ({
      ...g,
      innovations: {
        ...g.innovations,
        [innovationId]: { ...g.innovations[innovationId], unlocked: true },
      },
    }))
  },

  activateEffect(effectKey, value = true) {
    get().updateGame((g) => ({
      ...g,
      activeEffects: { ...g.activeEffects, [effectKey]: value },
    }))
  },

  // ── Événements ────────────────────────────────────────────
  advanceEventTrack() {
    get().updateGame((g) => {
      const next = g.eventTrack.current + 1
      return {
        ...g,
        eventTrack: {
          current: next,
          resolved: [...g.eventTrack.resolved, g.eventTrack.current],
        },
      }
    })
  },

  // ── Popups première fois ──────────────────────────────────
  markFirstTimeSeen(key) {
    get().updateGame((g) => ({
      ...g,
      firstTimeSeen: { ...g.firstTimeSeen, [key]: true },
    }))
  },

  // ── Outcome ───────────────────────────────────────────────
  setOutcome(outcome) {
    get().updateGame((g) => ({
      ...g,
      phase: outcome === null ? g.phase : (
        ['cultural','military','diplomatic'].includes(outcome) ? 'victory' : 'defeat'
      ),
      outcome,
    }))
  },

  // ── Reset ─────────────────────────────────────────────────
  resetGame() {
    deleteSave()
    set({ game: null })
  },
}))

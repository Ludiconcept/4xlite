import { create } from 'zustand'

const LOG_KEY = '4xlite_log'
const MAX_ENTRIES = 20

function saveLog(entries) {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries))
  } catch (e) {
    console.warn('[4X Lite] Impossible de sauvegarder le journal :', e)
  }
}

function loadLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

// ─────────────────────────────────────────────────────────────
// Store du journal de partie
// Panneau caché par défaut, accessible via bouton
// ─────────────────────────────────────────────────────────────
export const useLogStore = create((set, get) => ({
  entries: loadLog(),
  isOpen: false,

  addEntry(text, turn) {
    set((state) => {
      const entry = {
        id:   Date.now(),
        turn: turn || 0,
        text,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }
      const newEntries = [entry, ...state.entries].slice(0, MAX_ENTRIES)
      saveLog(newEntries)
      return { entries: newEntries }
    })
  },

  toggleOpen() {
    set((state) => ({ isOpen: !state.isOpen }))
  },

  clearLog() {
    localStorage.removeItem(LOG_KEY)
    set({ entries: [] })
  },
}))

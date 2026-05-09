import { create } from 'zustand'

export const useDiceStore = create((set, get) => ({
  values: [],
  rolling: [],
  selected: [],
  rolled: false,
  maxSelect: 2,
  modified: [],
  // Pour le setup : lancer animé générique
  setupRolling: false,
  setupValues: [],
  setupFinal: [],

  rollDice(nbDice = 4) {
    const finalValues = Array.from({ length: nbDice }, () => Math.floor(Math.random() * 6) + 1)
    set({ rolling: Array.from({ length: nbDice }, (_, i) => i), rolled: false, selected: [], modified: [], values: Array.from({ length: nbDice }, () => Math.floor(Math.random() * 6) + 1) })
    finalValues.forEach((val, i) => {
      setTimeout(() => {
        set(state => {
          const newValues = [...state.values]
          newValues[i] = val
          const newRolling = state.rolling.filter(r => r !== i)
          return { values: newValues, rolling: newRolling, rolled: newRolling.length === 0 }
        })
      }, 500 + i * 150)
    })
  },

  // Lancer générique pour le setup (retourne une Promise avec les valeurs finales)
  rollSetup(n) {
    return new Promise(resolve => {
      const final = Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1)
      set({ setupRolling: true, setupValues: Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1), setupFinal: final })
      const interval = setInterval(() => {
        set({ setupValues: Array.from({ length: n }, () => Math.floor(Math.random() * 6) + 1) })
      }, 80)
      setTimeout(() => {
        clearInterval(interval)
        set({ setupRolling: false, setupValues: final })
        resolve(final)
      }, 700)
    })
  },

  toggleSelect(index) {
    const { selected, maxSelect, rolling } = get()
    if (rolling.length > 0) return
    if (selected.includes(index)) set({ selected: selected.filter(i => i !== index) })
    else if (selected.length < maxSelect) set({ selected: [...selected, index] })
  },

  equipDie(index, delta) {
    const { values } = get()
    const newVal = Math.max(1, Math.min(6, values[index] + delta))
    if (newVal === values[index]) return
    const newValues = [...values]; newValues[index] = newVal
    set(state => ({ values: newValues, modified: [...state.modified.filter(i => i !== index), index] }))
  },

  setMaxSelect(n) { set({ maxSelect: n }) },
  reset() { set({ values: [], rolling: [], selected: [], rolled: false, modified: [] }) },
}))

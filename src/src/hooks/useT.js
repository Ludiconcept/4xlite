import fr from '../i18n/fr.json'

// Langue active — V1 : français uniquement
// V2 : ajouter un store langue et importer en.json
const ACTIVE_LOCALE = fr

/**
 * Hook utilitaire pour accéder aux chaînes de traduction.
 *
 * Utilisation :
 *   const t = useT()
 *   t('menu.newGame')         → "Nouvelle partie"
 *   t('combat.lossesPlayer', { n: 3 }) → "Vous perdez 3 unité(s)."
 */
export function useT() {
  return function t(key, vars = {}) {
    const parts = key.split('.')
    let value = ACTIVE_LOCALE
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) {
        console.warn(`[i18n] Clé manquante : "${key}"`)
        return key
      }
    }
    // Interpolation des variables {varName}
    if (typeof value === 'string' && Object.keys(vars).length > 0) {
      return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`)
    }
    return value
  }
}

// Version non-hook pour le moteur de jeu (engine/) qui n'est pas React
export function t(key, vars = {}) {
  const parts = key.split('.')
  let value = ACTIVE_LOCALE
  for (const part of parts) {
    value = value?.[part]
    if (value === undefined) return key
  }
  if (typeof value === 'string' && Object.keys(vars).length > 0) {
    return value.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`)
  }
  return value
}

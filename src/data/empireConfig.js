// Configuration des 4 empires adverses
export const EMPIRE_CONFIG = {
  1: {
    id: 1,
    name: 'Varyndor',
    emoji: '🐉',
    color: '#e1071a',
    colorLight: '#fff0f0',
    colorBorder: '#e1071a80',
    colorText: '#b91c1c',
    tailwindBorder: 'border-red-600',
    tailwindBg: 'bg-red-50',
  },
  2: {
    id: 2,
    name: 'Elyssar',
    emoji: '🦅',
    color: '#1a56db',
    colorLight: '#eff6ff',
    colorBorder: '#1a56db80',
    colorText: '#1e40af',
    tailwindBorder: 'border-blue-700',
    tailwindBg: 'bg-blue-50',
  },
  3: {
    id: 3,
    name: 'Kharzun',
    emoji: '🐺',
    color: '#166534',
    colorLight: '#f0fdf4',
    colorBorder: '#16653480',
    colorText: '#14532d',
    tailwindBorder: 'border-green-800',
    tailwindBg: 'bg-green-50',
  },
  4: {
    id: 4,
    name: 'Solmeria',
    emoji: '🦁',
    color: '#ca8a04',
    colorLight: '#fefce8',
    colorBorder: '#ca8a0480',
    colorText: '#92400e',
    tailwindBorder: 'border-yellow-600',
    tailwindBg: 'bg-yellow-50',
  },
}

// Positions des empires autour de la carte
// top = Empire 1 (Varyndor), right = Empire 2 (Elyssar)
// bottom = Empire 3 (Kharzun), left = Empire 4 (Solmeria)
export const EMPIRE_POSITIONS = {
  top:    1, // Varyndor
  right:  2, // Elyssar
  bottom: 3, // Kharzun
  left:   4, // Solmeria
}

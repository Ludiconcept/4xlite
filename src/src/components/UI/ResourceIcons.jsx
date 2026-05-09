// Icônes SVG des ressources — 4X Lite
// Utilisables à n'importe quelle taille via prop `size`

export function IconBois({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="34" rx="16" ry="7" fill="#6b3a1f" opacity="0.18"/>
      <rect x="10" y="20" width="28" height="10" rx="5" fill="#8B4513"/>
      <rect x="10" y="20" width="28" height="4" rx="2" fill="#A0522D"/>
      <rect x="14" y="22" width="4" height="6" rx="1" fill="#6b3a1f" opacity="0.3"/>
      <rect x="22" y="22" width="4" height="6" rx="1" fill="#6b3a1f" opacity="0.3"/>
      <rect x="30" y="22" width="4" height="6" rx="1" fill="#6b3a1f" opacity="0.3"/>
    </svg>
  )
}

export function IconOr({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="36" rx="14" ry="5" fill="#b8860b" opacity="0.2"/>
      <polygon points="12,32 16,16 32,16 36,32" fill="#DAA520"/>
      <polygon points="16,16 32,16 30,20 18,20" fill="#FFD700"/>
      <polygon points="12,32 18,20 30,20 36,32" fill="#C8960C"/>
      <line x1="18" y1="20" x2="16" y2="28" stroke="#FFD700" strokeWidth="0.8" opacity="0.5"/>
      <line x1="24" y1="20" x2="24" y2="32" stroke="#FFD700" strokeWidth="0.8" opacity="0.5"/>
      <line x1="30" y1="20" x2="32" y2="28" stroke="#FFD700" strokeWidth="0.8" opacity="0.5"/>
    </svg>
  )
}

export function IconFer({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="36" rx="15" ry="4" fill="#555" opacity="0.15"/>
      <rect x="8" y="19" width="32" height="12" rx="2" fill="#71797E"/>
      <rect x="8" y="19" width="32" height="5" rx="2" fill="#9EA7AD"/>
      <rect x="10" y="21" width="6" height="8" rx="1" fill="#5C6368" opacity="0.5"/>
      <rect x="21" y="21" width="6" height="8" rx="1" fill="#5C6368" opacity="0.5"/>
      <rect x="32" y="21" width="6" height="8" rx="1" fill="#5C6368" opacity="0.5"/>
    </svg>
  )
}

export function IconArgile({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="36" rx="13" ry="4" fill="#8b0000" opacity="0.15"/>
      <rect x="10" y="17" width="28" height="16" rx="2" fill="#C0392B"/>
      <rect x="10" y="17" width="28" height="6" rx="2" fill="#E74C3C"/>
      <line x1="10" y1="23" x2="38" y2="23" stroke="#922B21" strokeWidth="1"/>
      <rect x="12" y="18" width="10" height="4" rx="1" fill="#E74C3C" opacity="0.5"/>
      <rect x="26" y="18" width="10" height="4" rx="1" fill="#E74C3C" opacity="0.5"/>
      <rect x="12" y="25" width="10" height="5" rx="1" fill="#922B21" opacity="0.3"/>
      <rect x="26" y="25" width="10" height="5" rx="1" fill="#922B21" opacity="0.3"/>
    </svg>
  )
}

export function IconNourriture({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 8 Q26 6 28 8 Q30 5 27 4 Q25 3 24 5 Q23 3 21 4 Q18 5 20 8 Z" fill="#2E7D32"/>
      <path d="M24 10 Q14 12 13 22 Q12 32 24 36 Q36 32 35 22 Q34 12 24 10 Z" fill="#4CAF50"/>
      <path d="M24 10 Q20 14 20 22 Q20 30 24 36 Q28 30 28 22 Q28 14 24 10 Z" fill="#66BB6A"/>
      <ellipse cx="20" cy="20" rx="3" ry="4" fill="white" opacity="0.15" transform="rotate(-20 20 20)"/>
    </svg>
  )
}

// Icône générique selon le type de ressource
export function ResourceIcon({ type, size = 24 }) {
  switch (type) {
    case 'bois':       return <IconBois size={size} />
    case 'or':         return <IconOr size={size} />
    case 'fer':        return <IconFer size={size} />
    case 'argile':     return <IconArgile size={size} />
    case 'nourriture': return <IconNourriture size={size} />
    default:           return null
  }
}

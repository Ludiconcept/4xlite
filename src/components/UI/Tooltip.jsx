import { useState } from 'react'

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const posStyles = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-1',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
    left:   'right-full top-1/2 -translate-y-1/2 mr-1',
    right:  'left-full top-1/2 -translate-y-1/2 ml-1',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div className={`absolute z-50 pointer-events-none ${posStyles[position]}`}>
          <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-md whitespace-nowrap max-w-xs leading-relaxed">
            {text}
          </div>
        </div>
      )}
    </div>
  )
}

// Bouton point d'interrogation avec infobulle
export function HelpTooltip({ text }) {
  return (
    <Tooltip text={text} position="right">
      <button className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300 inline-flex items-center justify-center text-slate-500 text-xs cursor-help hover:bg-slate-200 flex-shrink-0">
        ?
      </button>
    </Tooltip>
  )
}

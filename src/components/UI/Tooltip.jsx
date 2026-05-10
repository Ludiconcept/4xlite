import { useState } from 'react'

export function Tooltip({ text, children, position = 'top' }) {
  const [visible, setVisible] = useState(false)

  const posMap = {
    top:    { bottom:'calc(100% + 5px)', left:'50%', transform:'translateX(-50%)' },
    bottom: { top:'calc(100% + 5px)', left:'50%', transform:'translateX(-50%)' },
    left:   { right:'calc(100% + 5px)', top:'50%', transform:'translateY(-50%)' },
    right:  { left:'calc(100% + 5px)', top:'50%', transform:'translateY(-50%)' },
  }
  const pos = posMap[position] || posMap.top

  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && text && (
        <div style={{
          position:'absolute', ...pos,
          background:'#1e293b', color:'white',
          fontSize:11, padding:'6px 10px',
          borderRadius:7, zIndex:9999,
          pointerEvents:'none', lineHeight:1.5,
          whiteSpace:'normal',  // permet le retour à la ligne
          minWidth:180, maxWidth:260,
          boxShadow:'0 4px 12px rgba(0,0,0,.2)',
        }}>
          {text}
        </div>
      )}
    </div>
  )
}

export function HelpTooltip({ text, position = 'bottom' }) {
  return (
    <Tooltip text={text} position={position}>
      <button style={{
        width:15, height:15, borderRadius:'50%',
        background:'#f1f5f9', border:'0.5px solid #cbd5e1',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontSize:9, color:'#64748b', cursor:'help', flexShrink:0,
      }}>?</button>
    </Tooltip>
  )
}

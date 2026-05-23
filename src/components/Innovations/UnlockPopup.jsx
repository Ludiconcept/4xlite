import { useState } from 'react'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'

const ARBRE_STYLES = {
  administration: { color:'#1e40af', bg:'#eff6ff', border:'#93c5fd' },
  exploitation:   { color:'#92400e', bg:'#fffbeb', border:'#fcd34d' },
  guerre:         { color:'#991b1b', bg:'#fef2f2', border:'#fca5a5' },
  religion:       { color:'#5b21b6', bg:'#faf5ff', border:'#c4b5fd' },
}

// ── Composants choix avec leur propre state ──────────────────────────────

function ChoixClerge({ game, S, onDone }) {
  const canPay = (game?.resources?.or || 0) >= 3
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>Payer 3 Or pour gagner 2 Prêtres ?</p>
      <p style={{ fontSize:12, color:'#64748b', margin:0 }}>Or disponible : <strong>{game?.resources?.or || 0}</strong></p>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onDone({ paid: true })} disabled={!canPay}
          style={{ flex:1, padding:'10px', borderRadius:9, border:'none',
            background: canPay ? '#16a34a' : '#e2e8f0', color:'white',
            cursor: canPay ? 'pointer' : 'default', fontWeight:500, fontSize:13 }}>
          Payer 3 Or → +2 Prêtres
        </button>
        <button onClick={() => onDone({ paid: false })}
          style={{ flex:1, padding:'10px', borderRadius:9, border:'1px solid #e2e8f0',
            background:'white', cursor:'pointer', fontWeight:500, fontSize:13, color:'#374151' }}>
          Refuser
        </button>
      </div>
    </div>
  )
}

const RESSOURCE_DE = { 1: null, 2: null, 3: 'argile', 4: 'gibier', 5: 'fer', 6: 'or' }

function ChoixProspection({ game, S, onDone, onRequestCaseSelect }) {
  const [selCase, setSelCase] = useState(null)
  const [des, setDes] = useState(null) // [d1, d2]
  const sansRessource = game?.map?.flat().filter(t => t.owner === 'player' && t.explored && !(t.resource1 && t.resource2)) || []

  // Fix setState-in-render : utiliser un bouton pour déclencher la sélection
  const [mapRequested, setMapRequested] = useState(false)

  if (!selCase) {
    if (sansRessource.length === 0) return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:12, color:'#dc2626', margin:0 }}>Aucune case sans ressource disponible.</p>
        <button onClick={() => onDone(null)} style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>Continuer →</button>
      </div>
    )
    if (onRequestCaseSelect && !mapRequested) return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:13, color:'#374151', margin:0 }}>Choisissez une case sans ressource à prospecter.</p>
        <button onClick={() => { setMapRequested(true); onRequestCaseSelect(sansRessource, (tile) => setSelCase(tile)) }}
          style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
          Choisir sur la carte →
        </button>
      </div>
    )
    if (mapRequested) return <div style={{ fontSize:13, color:'#64748b', padding:8 }}>Sélectionnez une case sur la carte…</div>
    // Fallback liste
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:13, color:'#374151', margin:0 }}>Choisissez une case sans ressource :</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {sansRessource.map(t => (
            <button key={`${t.row}-${t.col}`} onClick={() => setSelCase(t)}
              style={{ padding:'6px 10px', borderRadius:7, border:'1px solid #e2e8f0', background:'#f8fafc', cursor:'pointer', fontSize:12 }}>
              ({t.col+1},{t.row+1})
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Lancer 2 dés si pas encore lancés
  if (!des) {
    const d1 = Math.floor(Math.random()*6)+1
    const d2 = Math.floor(Math.random()*6)+1
    setDes([d1, d2])
    return null
  }

  // Table CDC prospection : 1D6 : 1-2=rien, 3=Argile, 4=Gibier, 5=Fer, 6=Or
  const D6_TABLE = { 1:null, 2:null, 3:'argile', 4:'gibier', 5:'fer', 6:'or' }
  // Conditions terrain par ressource
  const TERRAIN_OK = {
    or:     ['colline','montagne','desert'],
    fer:    ['colline','montagne','desert'],
    argile: ['marais','plaine','desert'],
    gibier: ['marais','plaine','colline','montagne','fleuve','lac'],
  }
  // On utilise un seul dé (d6), mais on affiche les deux pour l'immersion
  const d6 = des[0] // premier dé = le résultat effectif
  const raw = D6_TABLE[d6] || null
  const terrain = selCase.terrain || ''
  const ressource = raw && TERRAIN_OK[raw]?.includes(terrain) ? raw : null

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ display:'flex', gap:12, justifyContent:'center', alignItems:'center' }}>
        <div style={{ width:64, height:64, borderRadius:12, background:S.bg, border:`2px solid ${S.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:700, color:S.color }}>
          {d6}
        </div>
        <div style={{ fontSize:12, color:'#94a3b8' }}>({des[1]} ignoré)</div>
      </div>
      <p style={{ fontSize:13, color:'#374151', textAlign:'center', margin:0 }}>
        Case ({selCase.col+1},{selCase.row+1}) · {terrain} :{' '}
        {ressource
          ? <strong style={{ color:S.color }}>+{ressource}</strong>
          : <span style={{ color:'#94a3b8' }}>{raw ? `${raw} incompatible avec ${terrain}` : 'Rien trouvé'}</span>}
      </p>
      <button onClick={() => onDone({ row: selCase.row, col: selCase.col, ressource })}
        style={{ padding:'10px 24px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
        Continuer →
      </button>
    </div>
  )
}

function ChoixConscription({ game, S, onDone }) {
  const nbCases = game?.map?.flat().filter(t => t.owner === 'player').length || 0
  const nb = Math.floor(nbCases / 2)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>
        Vous contrôlez <strong>{nbCases}</strong> cases → <strong>+{nb} Guerrier{nb > 1 ? 's' : ''}</strong>
      </p>
      <button onClick={() => onDone({ nbGuerriers: nb })}
        style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
        Confirmer →
      </button>
    </div>
  )
}

function ChoixMessianisme({ game, S, onDone }) {
  const [chosen, setChosen] = useState(null)
  if (chosen !== null) return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>
        {EMPIRE_CONFIG[chosen]?.emoji} {EMPIRE_CONFIG[chosen]?.name} : -2 Puissance, -2 Puissance max. Vous : +2 Guerriers.
      </p>
      <button onClick={() => onDone({ empireId: chosen })}
        style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
        Confirmer →
      </button>
    </div>
  )
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>Choisissez un Empire à affaiblir :</p>
      {[1,2,3,4].map(id => {
        const cfg = EMPIRE_CONFIG[id]
        const emp = game?.empires?.[id] || { power:0, maxPower:8 }
        return (
          <button key={id} onClick={() => setChosen(id)}
            style={{ padding:'10px 12px', borderRadius:8, border:`1px solid ${cfg?.color||'#e2e8f0'}`,
              background:'white', cursor:'pointer', textAlign:'left', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:13, fontWeight:500 }}>{cfg?.emoji} {cfg?.name}</span>
            <span style={{ fontSize:12, color:'#64748b' }}>{emp.power}/{emp.maxPower} Puissance</span>
          </button>
        )
      })}
    </div>
  )
}

function ChoixMartyrs({ game, S, onDone }) {
  const maxPretres = game?.population?.pretre || 0
  const [nb, setNb] = useState(0)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>
        Sacrifiez des Prêtres pour réduire la Puissance de tous les Empires.<br/>
        Prêtres disponibles : <strong>{maxPretres}</strong>
      </p>
      <div style={{ display:'flex', alignItems:'center', gap:10, justifyContent:'center' }}>
        <button onClick={() => setNb(n => Math.max(0, n-1))} disabled={nb<=0}
          style={{ width:32, height:32, borderRadius:7, border:'1px solid #e2e8f0', background:'white', cursor:nb>0?'pointer':'default', fontSize:18 }}>−</button>
        <span style={{ fontSize:24, fontWeight:700, minWidth:40, textAlign:'center' }}>{nb}</span>
        <button onClick={() => setNb(n => Math.min(maxPretres, n+1))} disabled={nb>=maxPretres}
          style={{ width:32, height:32, borderRadius:7, border:'1px solid #e2e8f0', background:'white', cursor:nb<maxPretres?'pointer':'default', fontSize:18 }}>+</button>
      </div>
      <p style={{ fontSize:12, color:'#64748b', textAlign:'center', margin:0 }}>→ Chaque Empire perd <strong>{nb}</strong> Puissance</p>
      <button onClick={() => onDone({ nbPretres: nb })}
        style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
        Confirmer ({nb} Prêtre{nb!==1?'s':''} sacrifié{nb!==1?'s':''})
      </button>
    </div>
  )
}

function ChoixConversion({ game, S, onDone, onRequestCaseSelect }) {
  const [requested, setRequested] = useState(false)
  const adj = (t, map) => [[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc]) => map[t.row+dr]?.[t.col+dc]).filter(Boolean)
  const playerTiles = game?.map?.flat().filter(t => t.owner === 'player') || []
  const candidates = game?.map?.flat().filter(t =>
    t.owner && t.owner !== 'player' && !isNaN(t.owner) &&
    playerTiles.some(pt => adj(pt, game.map).some(n => n.row === t.row && n.col === t.col))
  ) || []

  if (candidates.length === 0) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:12, color:'#dc2626', margin:0 }}>Aucune case éligible.</p>
      <button onClick={() => onDone(null)} style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>Continuer →</button>
    </div>
  )

  // Sélection sur carte si disponible
  if (onRequestCaseSelect && !requested) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <p style={{ fontSize:13, color:'#374151', margin:0 }}>Choisissez une case d'Empire adjacente à votre territoire.</p>
        <button onClick={() => {
          setRequested(true)
          onRequestCaseSelect(candidates, (tile) => onDone({ row:tile.row, col:tile.col }))
        }}
          style={{ padding:'10px', borderRadius:9, border:'none', background:S.color, color:'white', cursor:'pointer', fontWeight:500 }}>
          Choisir sur la carte →
        </button>
      </div>
    )
  }

  if (requested) return (
    <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'center', padding:'8px 0' }}>
      <div style={{ fontSize:13, color:'#64748b' }}>Cliquez sur une case surlignée sur la carte…</div>
      <button onClick={() => setRequested(false)} style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Annuler</button>
    </div>
  )

  // Fallback liste
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:13, color:'#374151', margin:0 }}>Choisissez une case d'Empire adjacente :</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {candidates.map(t => {
          const cfg = EMPIRE_CONFIG[parseInt(t.owner)]
          return (
            <button key={`${t.row}-${t.col}`} onClick={() => onDone({ row:t.row, col:t.col })}
              style={{ padding:'6px 10px', borderRadius:7, border:`1px solid ${cfg?.color||'#e2e8f0'}`, background:'white', cursor:'pointer', fontSize:12 }}>
              ({t.col+1},{t.row+1}) {cfg?.emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────────────

export default function UnlockPopup({ innov, game, onClose, onRequestCaseSelect }) {
  const S = ARBRE_STYLES[innov.arbre] || ARBRE_STYLES.administration
  const [phase, setPhase] = useState('info')
  const [result, setResult] = useState(null)

  const CHOIX_COMPONENTS = {
    clerge:        ChoixClerge,
    conscription:  ChoixConscription,
    messianisme:   ChoixMessianisme,
    martyrs:       ChoixMartyrs,
    // prospection et conversion : gérés par InnovationsPanel via carte
  }

  const ChoixComponent = CHOIX_COMPONENTS[innov.id]

  function handleChoixDone(res) {
    setResult(res)
    setPhase('done')
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'white', borderRadius:16, width:'100%', maxWidth:440,
        overflow:'hidden', boxShadow:'0 24px 64px rgba(0,0,0,.4)' }}>

        <div style={{ background:S.bg, borderBottom:`2px solid ${S.border}`,
          padding:'16px 20px', borderRadius:'16px 16px 0 0' }}>
          <div style={{ fontSize:11, color:S.color, fontWeight:600, textTransform:'uppercase',
            letterSpacing:'.06em', marginBottom:4 }}>Innovation débloquée</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:28 }}>{innov.emoji}</span>
            <span style={{ fontSize:20, fontWeight:700, color:S.color }}>{innov.nom}</span>
          </div>
        </div>

        <div style={{ width:'100%', height:100, background:'#f1f5f9',
          display:'flex', alignItems:'center', justifyContent:'center',
          borderBottom:'1px solid #e2e8f0' }}>
          <span style={{ fontSize:11, color:'#94a3b8' }}>[ Image — {innov.nom} ]</span>
        </div>

        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
          <p style={{ fontSize:13, color:'#475569', lineHeight:1.65, margin:0, fontStyle:'italic' }}>
            {innov.roleplay}
          </p>
          <div style={{ borderTop:'1px solid #e2e8f0' }} />

          {phase === 'info' && (
            <>
              <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:9,
                padding:'10px 13px', fontSize:12, color:'#374151', lineHeight:1.5 }}>
                <strong>Effet :</strong> {innov.effetLong}
              </div>
              <button onClick={() => innov.immediat && ChoixComponent ? setPhase('choix') : onClose(null)}
                style={{ padding:'12px', borderRadius:10, border:'none', background:S.color,
                  color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                {innov.immediat && ChoixComponent ? 'Continuer →' : 'Fermer ✕'}
              </button>
            </>
          )}

          {phase === 'choix' && ChoixComponent && (
            <ChoixComponent game={game} S={S} onDone={handleChoixDone} />
          )}

          {phase === 'done' && (
            <>
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:9,
                padding:'10px 13px', fontSize:12, color:'#166534' }}>✓ Effet appliqué.</div>
              <button onClick={() => onClose(result)}
                style={{ padding:'12px', borderRadius:10, border:'none', background:S.color,
                  color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Fermer ✕
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

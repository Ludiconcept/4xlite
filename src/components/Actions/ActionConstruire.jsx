import { useState, useEffect } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { getBatimentsDisponibles, appliquerConstruction, BATIMENTS, peutConstruire } from '../../engine/construction.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'

const TERRAIN_NAMES = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne', lac:'Lac' }
const RES_LABELS    = { bois:'Bois', fer:'Fer', argile:'Argile', or:'Or', nourriture:'Nourr.', guerrier:'Guerrier', pretre:'Prêtre', noble:'Noble', artisan:'Artisan' }

function CoutLine({ ressources, population, altCout, gameRes, gamePop, freeLabel }) {
  const items = []
  for (const [r, q] of Object.entries(ressources || {})) {
    const ok = (gameRes[r] || 0) >= q
    items.push(<span key={r} style={{ color: ok ? '#16a34a' : '#dc2626', fontSize:11 }}>{q} {RES_LABELS[r] || r}</span>)
  }
  if (altCout) {
    const [ar, aq] = Object.entries(altCout)[0]
    items.push(<span key="ou" style={{ color:'#94a3b8', fontSize:11 }}>ou {aq} {RES_LABELS[ar]}</span>)
  }
  for (const [t, q] of Object.entries(population || {})) {
    const ok = (gamePop[t] || 0) >= q
    items.push(<span key={t} style={{ color: ok ? '#16a34a' : '#dc2626', fontSize:11 }}>{q} {RES_LABELS[t] || t}</span>)
  }
  if (items.length === 0) {
    items.push(<span key="label" style={{ color:'#64748b', fontSize:11 }}>{freeLabel || 'Gratuit'}</span>)
  }
  return <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:2 }}>{items}</div>
}

export function ActionConstruire({ onClose, onMarkUsed, onTileHighlight, constructTileClicked, onConstructTileHandled }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [selectedTile, setTile]     = useState(null)
  const [selectedBat,  setBat]      = useState(null)
  const [useAlt,       setUseAlt]   = useState(false)
  const [collineMat,   setCollineMat] = useState(null) // pour Ferme en Colline
  const [empireId,     setEmpireId]  = useState(null)  // pour Ambassade
  const [phase, setPhase]           = useState('select') // select | replaceChoice | confirm
  const [replaceBat,   setReplaceBat] = useState(null)  // bâtiment à remplacer

  if (!game) return null

  // Toutes les cases joueur constructibles (pas de filtre strict — on laisse les bâtiments gérer)
  const playerTiles = game.map.flat().filter(t =>
    t.owner === 'player' && t.explored && t.terrain !== 'lac' && !t.isLac
  )

  // Surligner toutes les cases joueur au montage
  useEffect(() => {
    onTileHighlight?.(playerTiles.map(t => ({ row:t.row, col:t.col })))
    return () => onTileHighlight?.([])
  }, []) // eslint-disable-line

  // Consommer clic carte
  useEffect(() => {
    if (!constructTileClicked) return
    const tile = playerTiles.find(t => t.row === constructTileClicked.row && t.col === constructTileClicked.col)
    if (tile) { setTile(tile); setBat(null); setReplaceBat(null); setPhase('select') }
    onConstructTileHandled?.()
  }, [constructTileClicked]) // eslint-disable-line

  // Bâtiments pour la case sélectionnée
  const batiments = selectedTile ? getBatimentsDisponibles(selectedTile, game) : []
  const casePleineSelected = (selectedTile?.buildings || []).length >= 3
  // Si la case est pleine, on montre quand même les bâtiments comme "disponibles" pour le remplacement
  // SAUF ceux bloqués pour d'autres raisons (max global, terrain incompatible...)
  const disponibles = batiments.filter(b => b.disponibilite.ok || (casePleineSelected && b.disponibilite.casePleine))
  const bloques    = batiments.filter(b => !b.disponibilite.ok && !(casePleineSelected && b.disponibilite.casePleine))

  function selectBat(batId) {
    setBat(batId)
    const bat = BATIMENTS[batId]
    const altOk = bat.altCout
      ? Object.entries(bat.altCout).every(([r, q]) => (game.resources[r] || 0) >= q)
      : false
    const mainOk = Object.entries(bat.cout.ressources || {}).every(([r, q]) => (game.resources[r] || 0) >= q)
    setUseAlt(!mainOk && altOk)
    setCollineMat(null)
    setEmpireId(null)
    // Si case pleine, proposer de remplacer
    if ((selectedTile?.buildings || []).length >= 3) {
      setPhase('replaceChoice')
    } else {
      setPhase('confirm')
    }
  }

  function confirmer() {
    if (!selectedTile || !selectedBat) return
    const row = selectedTile.row
    const col = selectedTile.col
    const key = `${row}-${col}`
    const batInfo = BATIMENTS[selectedBat]
    if (!batInfo) return

    // Calculer le nouveau game state
    let ng = { ...game }

    // Retirer le bâtiment remplacé si nécessaire
    if (replaceBat) {
      let removed = false
      ng = {
        ...ng,
        map: ng.map.map(r => r.map(t => {
          if (t.row !== row || t.col !== col) return t
          const newBuildings = []
          for (const b of (t.buildings || [])) {
            if (b === replaceBat && !removed) { removed = true; continue }
            newBuildings.push(b)
          }
          return { ...t, buildings: newBuildings }
        }))
      }
    }

    // Appliquer la construction
    ng = appliquerConstruction(selectedBat, key, ng, { useAlt, collineMat, empireId })
    if (!ng) return // sécurité

    // Mettre à jour le state
    updateGame(() => ng)

    // Journal
    const empStr = empireId ? ` → ${EMPIRE_CONFIG[empireId]?.name}` : ''
    const replStr = replaceBat ? ` (remplace ${BATIMENTS[replaceBat]?.name})` : ''
    addEntry(
      `Construction : ${batInfo.emoji} ${batInfo.name} en (${col+1},${row+1})${empStr}${replStr}`,
      game.turn
    )

    // Fermer l'action
    onMarkUsed?.()
    onClose()
  }

  const bat = selectedBat ? BATIMENTS[selectedBat] : null
  const isFermeColline = selectedBat === 'ferme' && selectedTile?.terrain === 'colline'
  const isAmbassade    = selectedBat === 'ambassade'
  const empiresSansAmbassade = [1,2,3,4].filter(id => {
    const avec = game.map.flat().filter(t => t.ambassadeEmpire === id && t.buildings?.includes('ambassade'))
    return avec.length === 0
  })
  const readyToConfirm = bat && (!isFermeColline || collineMat) && (!isAmbassade || empireId) && (!casePleineSelected || replaceBat)

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14, width:280, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>🏗️ Construire</h3>
        <button onClick={() => { onTileHighlight?.([]); onClose() }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>

      {/* Instructions */}
      <p style={{ fontSize:12, color:'#475569', lineHeight:1.4, margin:0 }}>
        {selectedTile
          ? `Case (${selectedTile.col+1},${selectedTile.row+1}) — ${TERRAIN_NAMES[selectedTile.terrain]} — cliquez une autre case pour changer`
          : 'Cliquez sur une de vos cases surlignées sur la carte.'}
      </p>

      {/* Pas de case sélectionnée */}
      {!selectedTile && playerTiles.length === 0 && (
        <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'7px 9px' }}>
          Aucune case disponible pour construire.
        </div>
      )}

      {/* Liste des bâtiments */}
      {selectedTile && phase === 'select' && (
        <div style={{ position:'relative' }}>
          {/* Ombre en bas pour indiquer le scroll */}
          <div style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:5, paddingBottom:4 }}>
            {/* Disponibles */}
            {disponibles.map(({ id, name, emoji, description, cout, altCout }) => (
              <button key={id} onClick={() => selectBat(id)} style={{
                padding:'8px 9px', borderRadius:8, textAlign:'left', cursor:'pointer',
                border:'1.5px solid #e2e8f0', background:'white',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{emoji}</span>
                  <span style={{ fontSize:12, fontWeight:500, color:'#1e293b' }}>{name}</span>
                </div>
                <div style={{ fontSize:11, color:'#64748b', marginTop:2 }}>{description}</div>
                <CoutLine ressources={cout.ressources} population={cout.population} altCout={altCout} gameRes={game.resources} gamePop={game.population}
                freeLabel={id === 'ferme' ? (selectedTile?.terrain === 'colline' ? '1 Bois/Fer/Argile (au choix)' : 'Gratuit en Plaine') : undefined} />
              </button>
            ))}

            {/* Séparateur si des bâtiments bloqués */}
            {bloques.length > 0 && disponibles.length > 0 && (
              <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', padding:'4px 0 2px' }}>
                Non disponibles
              </div>
            )}
            {bloques.length > 0 && bloques.map(({ id, name, emoji, cout, altCout, disponibilite }) => (
              <div key={id} style={{ padding:'7px 9px', borderRadius:8, border:'1.5px solid #f1f5f9', background:'#f8fafc', opacity:0.6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:16 }}>{emoji}</span>
                  <span style={{ fontSize:12, color:'#94a3b8' }}>{name}</span>
                  <span style={{ marginLeft:'auto', fontSize:10, color:'#ef4444' }}>🔒</span>
                </div>
                <div style={{ fontSize:10, color:'#ef4444', marginTop:2 }}>{disponibilite.raison}</div>
              </div>
            ))}

            {batiments.length === 0 && (
              <p style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Aucun bâtiment à afficher.</p>
            )}
          </div>
          {/* Indicateur de scroll */}
          {(disponibles.length + bloques.length) > 5 && (
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:32, background:'linear-gradient(transparent, white)', pointerEvents:'none', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
              <span style={{ fontSize:10, color:'#94a3b8', paddingBottom:2 }}>▾ défiler</span>
            </div>
          )}
        </div>
      )}

      {/* Confirmation */}
      {selectedTile && phase === 'confirm' && bat && (
        <>
          <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:18 }}>{bat.emoji}</span>
              <span style={{ fontSize:13, fontWeight:500, color:'#166534' }}>{bat.name}</span>
            </div>
            <div style={{ fontSize:11, color:'#475569', marginBottom:6 }}>{bat.description}</div>

            {/* Entrepôt : choix bois ou argile */}
            {bat.altCout && (
              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Payer avec :</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[{ label:'2 Bois', useAlt:false, ok:(game.resources.bois||0)>=2 },
                    { label:'2 Argile', useAlt:true, ok:(game.resources.argile||0)>=2 }].map(opt => (
                    <button key={String(opt.useAlt)} onClick={() => setUseAlt(opt.useAlt)}
                      disabled={!opt.ok}
                      style={{ flex:1, padding:'5px 0', borderRadius:6, fontSize:11, cursor: opt.ok ? 'pointer' : 'not-allowed',
                        border: useAlt === opt.useAlt ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        background: useAlt === opt.useAlt ? '#f0fdf4' : 'white',
                        color: !opt.ok ? '#cbd5e1' : useAlt === opt.useAlt ? '#16a34a' : '#64748b',
                        fontWeight: useAlt === opt.useAlt ? 500 : 400 }}>
                      {useAlt === opt.useAlt ? '✓ ' : ''}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ferme en Colline : choix matériau */}
            {isFermeColline && (
              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Payer 1 ressource (colline) :</div>
                <div style={{ display:'flex', gap:5 }}>
                  {['bois','fer','argile'].map(r => {
                    const ok = (game.resources[r]||0) >= 1
                    return (
                      <button key={r} onClick={() => ok && setCollineMat(r)}
                        disabled={!ok}
                        style={{ flex:1, padding:'5px 0', borderRadius:6, fontSize:11, cursor: ok ? 'pointer' : 'not-allowed',
                          border: collineMat === r ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                          background: collineMat === r ? '#fffbeb' : 'white',
                          color: !ok ? '#cbd5e1' : collineMat === r ? '#d97706' : '#64748b',
                          fontWeight: collineMat === r ? 500 : 400 }}>
                        {collineMat === r ? '✓ ' : ''}{RES_LABELS[r]}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ambassade : choix empire */}
            {isAmbassade && (
              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>Attribuer à l'empire :</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {empiresSansAmbassade.map(id => {
                    const cfg = EMPIRE_CONFIG[id]
                    return (
                      <button key={id} onClick={() => setEmpireId(id)} style={{
                        display:'flex', alignItems:'center', gap:8, padding:'6px 9px', borderRadius:7,
                        border: empireId === id ? `2px solid ${cfg.color}` : '1px solid #e2e8f0',
                        background: empireId === id ? cfg.colorLight : 'white', cursor:'pointer', textAlign:'left',
                      }}>
                        <span>{cfg.emoji}</span>
                        <span style={{ fontSize:12, fontWeight: empireId===id ? 500 : 400, color: empireId===id ? cfg.colorText : '#374151' }}>{cfg.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setPhase('select')} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:12, cursor:'pointer' }}>← Retour</button>
            <button onClick={confirmer} disabled={!readyToConfirm} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background: readyToConfirm ? '#0369a1' : '#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor: readyToConfirm ? 'pointer' : 'default' }}>
              Construire ✓
            </button>
          </div>
        </>
      )}
    </div>
  )
}

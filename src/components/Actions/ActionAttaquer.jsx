import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import {
  getCasesAttaquables, getEmpiresAttaquablesDirectement,
  resoudreCombat, appliquerCombat, getBonusDefensif,
} from '../../engine/combat.js'

const TERRAIN_NAMES = { marais:'Marais', plaine:'Plaine', desert:'Désert', colline:'Colline', montagne:'Montagne', lac:'Lac' }

function AnimDie({ finalValue, rolling, color = '#1e293b' }) {
  const [display, setDisplay] = useState('?')
  const [bouncing, setBouncing] = useState(false)
  const interval = useRef(null)

  useEffect(() => {
    if (rolling) {
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random() * 6) + 1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(finalValue ?? '?')
      if (finalValue) { setBouncing(true); setTimeout(() => setBouncing(false), 350) }
    }
    return () => clearInterval(interval.current)
  }, [rolling, finalValue])

  return (
    <div style={{
      width:36, height:36, borderRadius:8,
      border:`2px solid ${color}`, background:'white',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:17, fontWeight:500, color,
      transform: bouncing ? 'scale(1.2)' : 'scale(1)',
      transition:'transform .12s', flexShrink:0,
    }}>{display}</div>
  )
}

export function ActionAttaquer({ onClose, onMarkUsed, onBack, attackTileClicked, onAttackTileHandled }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [phase, setPhase]     = useState('selectTarget')
  const [target, setTarget]   = useState(null)
  const [units, setUnits]     = useState({ guerrier: 0 })
  const [result, setResult]   = useState(null)
  const [rolling, setRolling] = useState(false)
  const [dieAtt, setDieAtt]   = useState(null)
  const [dieDef, setDieDef]   = useState(null)

  if (!game) return null

  const casesAtt     = getCasesAttaquables(game.map)
  const hasHopital   = game.map.flat().some(t => t.owner==='player' && t.buildings?.includes('hopital'))
  const armerActif   = game.activeEffects?.armerActif || false
  const [soignerUsed, setSoignerUsed] = useState(false)
  const empiresDir   = getEmpiresAttaquablesDirectement(game.map)
  const maxGuerriers = game.population.guerrier || 0
  const totalMob     = units.guerrier || 0
  const empire       = target ? (game.empires?.[target.empireId] || { power:2, maxPower:8 }) : null

  useEffect(() => {
    if (!attackTileClicked || phase !== 'selectTarget') return
    const tile = casesAtt.find(t => t.row === attackTileClicked.row && t.col === attackTileClicked.col)
    if (tile) { setTarget({ type:'case', key:`${tile.row}-${tile.col}`, tile, empireId:tile.owner }); setPhase('mobilise') }
    onAttackTileHandled?.()
  }, [attackTileClicked]) // eslint-disable-line

  function selectCase(tile) { setTarget({ type:'case', key:`${tile.row}-${tile.col}`, tile, empireId:tile.owner }); setUnits({ guerrier:0 }); setPhase('mobilise') }
  function selectEmpire(id) { setTarget({ type:'empire', empireId:id }); setUnits({ guerrier:0 }); setPhase('mobilise') }
  function adjustUnit(d)    { setUnits({ guerrier: Math.max(0, Math.min(maxGuerriers, (units.guerrier||0)+d)) }) }

  async function lancerCombat() {
    if (totalMob === 0) return
    setPhase('rolling'); setRolling(true); setDieAtt(null); setDieDef(null)
    await new Promise(r => setTimeout(r, 700))
    const tile = target.type === 'case' ? target.tile : null
    const res  = resoudreCombat({
      unitsAttaquant: units,
      unitsDefenseur: empire?.power ?? 2,
      terrain: tile?.terrain || 'plaine',
      hasFleuve: tile?.hasFleuve || false,
      bonusDefense: tile ? getBonusDefensif(tile) : 0,
    })
    setDieAtt(res.de1); setDieDef(res.de2); setRolling(false)
    await new Promise(r => setTimeout(r, 400))
    setResult(res); setPhase('result')
  }

  function confirmerResultat() {
    // Appliquer les bonus Soigner + Armer
    const reductionPertes = (soignerUsed ? 1 : 0) + (armerActif ? 1 : 0)
    const resultAvecBonus = { ...result, pertesAttaquant: Math.max(0, Math.min(totalMob, result.pertesAttaquant) - reductionPertes) }
    const newGame = appliquerCombat({ game, resultat:resultAvecBonus, unitsUsed:units, targetKey:target.key, isDirectAttack:target.type==='empire', empireId:target.empireId })
    // Désactiver Armer après le combat
    const gameApresArmer = { ...newGame, activeEffects: { ...newGame.activeEffects, armerActif: false } }
    updateGame(() => gameApresArmer)
    const empCfg = EMPIRE_CONFIG[target.empireId]
    const outcome = result.attaquantGagne ? '✓ Victoire' : '✗ Défaite'
    if (soignerUsed) {
      gameApresArmer.resources = { ...gameApresArmer.resources, nourriture: Math.max(0, (gameApresArmer.resources.nourriture||0) - 1) }
    }
    const detail  = target.type === 'case' ? `vs ${empCfg?.name} (${target.tile.col+1},${target.tile.row+1})` : `attaque directe vs ${empCfg?.name}`
    addEntry(`Combat ${outcome} — ${detail} — Pertes : ${Math.min(result.pertesAttaquant, totalMob)} guerrier(s)`, game.turn)
    onMarkUsed?.(); onClose()
  }

  // Calcul des pertes
  const pertesJoueur = result ? Math.min(result.pertesAttaquant, totalMob) : 0
  const reductionBonus = result ? (armerActif ? 1 : 0) + (soignerUsed ? 1 : 0) : 0
  const pertesFinales  = result ? Math.max(0, pertesJoueur - reductionBonus) : 0
  const pertesEmpire = result ? result.pertesDefenseur : 0
  const newPower     = empire ? Math.max(0, empire.power - pertesEmpire) : 0
  const depassement  = empire ? Math.max(0, pertesEmpire - (empire.power || 0)) : 0
  const newMaxPower  = empire ? Math.max(0, (empire.maxPower || 8) - depassement) : 0

  // Bouton fermer désactivé pendant et après le combat
  const canClose = phase !== 'rolling' && phase !== 'result'

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14, width:270, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>⚔️ Attaquer</h3>
        {canClose
          ? <button onClick={() => { onMarkUsed?.(); onClose() }} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
          : <span style={{ width:20 }} />
        }
      </div>

      {/* SÉLECTION CIBLE */}
      {phase === 'selectTarget' && (
        <>
          {casesAtt.length === 0 && empiresDir.length === 0 ? (
            <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:7, padding:'7px 9px' }}>Aucune cible disponible.</div>
          ) : (
            <>
              {casesAtt.length > 0 && <>
                <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>Cases ennemies adjacentes</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:120, overflowY:'auto' }}>
                  {casesAtt.map(t => { const cfg=EMPIRE_CONFIG[t.owner]; return (
                    <button key={`${t.row}-${t.col}`} onClick={() => selectCase(t)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:8, border:`1.5px solid ${cfg?.color||'#e2e8f0'}40`, background:cfg?.colorLight||'white', cursor:'pointer', textAlign:'left' }}>
                      <span>{cfg?.emoji}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500 }}>({t.col+1},{t.row+1}) — {TERRAIN_NAMES[t.terrain]}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>{cfg?.name} · Défense +{getBonusDefensif(t)}</div>
                      </div>
                    </button>
                  )})}
                </div>
              </>}
              {empiresDir.length > 0 && <>
                <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginTop:4 }}>Attaque directe depuis le bord</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {empiresDir.map(id => { const cfg=EMPIRE_CONFIG[id]; const emp=game.empires?.[id]||{power:2,maxPower:8}; return (
                    <button key={id} onClick={() => selectEmpire(id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:8, border:`1.5px solid ${cfg?.color}40`, background:cfg?.colorLight, cursor:'pointer', textAlign:'left' }}>
                      <span>{cfg?.emoji}</span>
                      <div>
                        <div style={{ fontSize:12, fontWeight:500, color:cfg?.colorText }}>{cfg?.name}</div>
                        <div style={{ fontSize:11, color:'#64748b' }}>Puissance : {emp.power} / {emp.maxPower}</div>
                      </div>
                    </button>
                  )})}
                </div>
              </>}
            </>
          )}
          {onBack && <button onClick={onBack} style={{ fontSize:11, color:'#94a3b8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', textAlign:'left' }}>← Choisir une autre action</button>}
        </>
      )}

      {/* MOBILISATION */}
      {phase === 'mobilise' && target && empire && (
        <>
          <div style={{ background:EMPIRE_CONFIG[target.empireId]?.colorLight, border:`1px solid ${EMPIRE_CONFIG[target.empireId]?.color}40`, borderRadius:8, padding:'8px 10px', fontSize:12 }}>
            <div style={{ fontWeight:500, color:EMPIRE_CONFIG[target.empireId]?.colorText }}>
              {EMPIRE_CONFIG[target.empireId]?.emoji} {target.type==='case' ? `(${target.tile.col+1},${target.tile.row+1}) — ${TERRAIN_NAMES[target.tile?.terrain]}` : `Attaque directe — ${EMPIRE_CONFIG[target.empireId]?.name}`}
            </div>
            <div style={{ color:'#64748b', marginTop:2 }}>Puissance ennemie : {empire.power} {target.type==='case'&&getBonusDefensif(target.tile)>0?`· Défense +${getBonusDefensif(target.tile)}`:''}</div>
          </div>
          <div style={{ background:'#f8fafc', border:'0.5px solid #e2e8f0', borderRadius:7, padding:'8px 10px', fontSize:12 }}>
            <div style={{ fontWeight:500, color:'#374151', marginBottom:4 }}>Formule de combat</div>
            <div style={{ color:'#dc2626' }}>Vous : 1D6 + {totalMob} guerrier{totalMob>1?'s':''} = <strong>{totalMob} + D6</strong></div>
            <div style={{ color:'#475569', marginTop:2 }}>Ennemi : 1D6 + {empire.power} puissance{target.type==='case'&&getBonusDefensif(target.tile)>0?` + ${getBonusDefensif(target.tile)} défense`:''}</div>
            <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>Égalité = défenseur gagne</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flex:1, fontSize:13 }}>⚔️ Guerriers ({maxGuerriers} dispo.)</span>
            <button onClick={() => adjustUnit(-1)} disabled={totalMob===0} style={{ width:24, height:24, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:totalMob>0?'pointer':'default', fontSize:16, opacity:totalMob===0?0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
            <span style={{ width:24, textAlign:'center', fontWeight:600, fontSize:14, color:totalMob>0?'#dc2626':'#94a3b8' }}>{totalMob}</span>
            <button onClick={() => adjustUnit(1)} disabled={totalMob>=maxGuerriers} style={{ width:24, height:24, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:totalMob<maxGuerriers?'pointer':'default', fontSize:16, opacity:totalMob>=maxGuerriers?0.3:1, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setPhase('selectTarget')} style={{ flex:1, padding:'7px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:12, cursor:'pointer' }}>← Retour</button>
            <button onClick={lancerCombat} disabled={totalMob===0} style={{ flex:2, padding:'7px 0', borderRadius:8, border:'none', background:totalMob>0?'#dc2626':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:totalMob>0?'pointer':'default' }}>⚔️ Lancer le combat</button>
          </div>
        </>
      )}

      {/* ANIMATION */}
      {phase === 'rolling' && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'10px 0' }}>
          <div style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Combat en cours…</div>
          <div style={{ display:'flex', gap:28, alignItems:'center' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:11, color:'#64748b' }}>Vous</div>
              <AnimDie finalValue={dieAtt} rolling={rolling} color="#dc2626" />
            </div>
            <span style={{ fontSize:18, color:'#94a3b8', fontWeight:700 }}>vs</span>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ fontSize:11, color:'#64748b' }}>Empire</div>
              <AnimDie finalValue={dieDef} rolling={rolling} color="#475569" />
            </div>
          </div>
        </div>
      )}

      {/* RÉSULTAT */}
      {phase === 'result' && result && empire && (
        <>
          <div style={{ background:result.attaquantGagne?'#f0fdf4':'#fef2f2', border:`1px solid ${result.attaquantGagne?'#86efac':'#fca5a5'}`, borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:10 }}>

            <div style={{ textAlign:'center', fontSize:15, fontWeight:500, color:result.attaquantGagne?'#166534':'#dc2626' }}>
              {result.attaquantGagne ? '🏆 Victoire !' : '💀 Défaite'}
            </div>

            {/* Dés + totaux côte à côte */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>

              {/* Colonne Vous */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>Vous</div>
                <AnimDie finalValue={result.de1} rolling={false} color="#dc2626" />
                <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                <div style={{ width:36, height:22, borderRadius:5, background:'#fef2f2', border:'1px solid #fca5a5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:'#dc2626' }}>+{Math.round(result.forceAtt)}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>guerriers</div>
                <div style={{ width:44, height:34, borderRadius:7, background:'#dc2626', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:500, color:'white' }}>{result.scoreAttaquant}</div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
              </div>

              <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500, marginTop:20 }}>vs</div>

              {/* Colonne Empire */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>Empire</div>
                <AnimDie finalValue={result.de2} rolling={false} color="#475569" />
                <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                <div style={{ width:36, height:22, borderRadius:5, background:'#f1f5f9', border:'1px solid #cbd5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:500, color:'#475569' }}>+{Math.round(result.forceDef)}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>puissance</div>
                <div style={{ width:44, height:34, borderRadius:7, background:'#475569', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:500, color:'white' }}>{result.scoreDefenseur}</div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
              </div>
            </div>

            {/* Pertes */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              <div style={{ background:'rgba(220,38,38,.08)', borderRadius:7, padding:'7px 8px' }}>
                <div style={{ fontSize:11, fontWeight:500, color:'#dc2626', marginBottom:3 }}>Vos pertes</div>
                <div style={{ fontSize:14, fontWeight:500, color:'#1e293b' }}>
                  {pertesJoueur > 0 ? `-${pertesJoueur} guerrier${pertesJoueur>1?'s':''}` : 'Aucune'}
                </div>
              </div>
              <div style={{ background:'rgba(71,85,105,.08)', borderRadius:7, padding:'7px 8px' }}>
                <div style={{ fontSize:11, fontWeight:500, color:'#475569', marginBottom:3 }}>Pertes ennemies</div>
                <div style={{ fontSize:13, color:'#1e293b', whiteSpace:'nowrap' }}>
                  Puiss {empire.power} → <span style={{ fontWeight:500 }}>{newPower}</span>
                </div>
                {depassement > 0 && (
                  <div style={{ fontSize:12, color:'#dc2626', whiteSpace:'nowrap' }}>
                    Max {empire.maxPower} → <span style={{ fontWeight:500 }}>{newMaxPower}</span>
                  </div>
                )}
              </div>
            </div>

            {target?.type === 'case' && (
              <div style={{ fontSize:11, padding:'5px 7px', borderRadius:6, background:result.attaquantGagne?'#dcfce7':'#fef2f2', color:result.attaquantGagne?'#166534':'#dc2626' }}>
                {result.attaquantGagne ? '✓ Vous prenez le contrôle de la case !' : '✗ L\'empire conserve la case.'}
              </div>
            )}
          </div>

          {/* Soigner + Armer actifs */}
          {(hasHopital || armerActif) && pertesJoueur > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {hasHopital && !soignerUsed && (game.resources.nourriture||0) >= 1 && (
                <button onClick={() => setSoignerUsed(true)} style={{ padding:'7px 10px', borderRadius:8, border:'1px solid #16a34a', background:'#f0fdf4', color:'#166534', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  <span>🏥</span> Soigner (1 Nourriture) : -1 perte
                </button>
              )}
              {soignerUsed && (
                <div style={{ padding:'5px 10px', borderRadius:8, background:'#f0fdf4', border:'1px solid #86efac', fontSize:11, color:'#16a34a' }}>
                  ✓ Soigner activé : -1 perte
                </div>
              )}
              {armerActif && (
                <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                  ✓ Armer actif : -1 perte
                </div>
              )}
            </div>
          )}
          <button onClick={confirmerResultat} style={{ padding:'9px 0', background:result.attaquantGagne?'#16a34a':'#475569', color:'white', border:'none', borderRadius:8, fontWeight:500, fontSize:13, cursor:'pointer' }}>
            Confirmer et continuer
          </button>
        </>
      )}
    </div>
  )
}

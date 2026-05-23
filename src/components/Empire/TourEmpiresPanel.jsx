import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { EMPIRE_CONFIG } from '../../data/empireConfig.js'
import {
  lancerDesEmpires, resoudreDe, resoudreD40Action,
  resoudreCombatEmpireVsJoueur, resoudreCombatEmpireVsEmpire,
  appliquerEffetsNextTurn, appliquerExpansionImperiale,
} from '../../engine/tourEmpires.js'
import { calcPopMax } from '../../engine/population.js'
import { genererCase } from '../../engine/exploration.js'

const pause = ms => new Promise(r => setTimeout(r, ms))

function EmpireDie({ value, rolling, active, size=52 }) {
  const [display, setDisplay] = useState('?')
  const [bounce, setBounce]   = useState(false)
  const interval = useRef(null)
  const prevRolling = useRef(rolling)

  useEffect(() => {
    if (rolling) {
      prevRolling.current = true
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random()*6)+1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(value ?? '?')
      if (prevRolling.current) { setBounce(true); setTimeout(()=>setBounce(false),350); prevRolling.current=false }
    }
    return () => clearInterval(interval.current)
  }, [rolling, value])

  const color = value==='✕'?'#7c3aed':value===6?'#dc2626':value===5?'#7c3aed':value?(EMPIRE_CONFIG[value]?.color||'#475569'):'#475569'
  return (
    <div style={{ width:size, height:size, borderRadius:10, border:`2px solid ${active?'#e07b1a':color}`, background:active?'#fff7ed':'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.floor(size*.44), fontWeight:700, color:active?'#e07b1a':color, transform:bounce?'scale(1.18)':'scale(1)', transition:'transform .12s', flexShrink:0 }}>
      {display}
    </div>
  )
}

// Dé animé (même composant que ActionAttaquer)
function AnimDieCombat({ finalValue, rolling, color = '#1e293b' }) {
  const [display, setDisplay] = useState('?')
  const [bouncing, setBouncing] = useState(false)
  const interval = useRef(null)
  useEffect(() => {
    if (rolling) {
      interval.current = setInterval(() => setDisplay(Math.floor(Math.random()*6)+1), 80)
    } else {
      clearInterval(interval.current)
      setDisplay(finalValue ?? '?')
      if (finalValue) { setBouncing(true); setTimeout(()=>setBouncing(false),350) }
    }
    return () => clearInterval(interval.current)
  }, [rolling, finalValue])
  return (
    <div style={{ width:36,height:36,borderRadius:8,border:`2px solid ${color}`,background:'white',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,fontWeight:500,color,transform:bouncing?'scale(1.2)':'scale(1)',transition:'transform .12s',flexShrink:0 }}>
      {display}
    </div>
  )
}

function CombatPopup({ empireId, targetCase, game, onConfirm, tributMode=false }) {
  const [guerriers,    setGuerriers]    = useState(0)
  const [soignerUsed,  setSoignerUsed]  = useState(false)
  const [phase,        setPhase]        = useState('prepare') // prepare | rolling | result
  const [rolling,      setRolling]      = useState(false)
  const [dieEmpire,    setDieEmpire]    = useState(null)
  const [dieJoueur,    setDieJoueur]    = useState(null)
  const [combatResult, setCombatResult] = useState(null)

  const cfg        = EMPIRE_CONFIG[empireId]
  const emp        = game.empires?.[empireId] || { power:2, maxPower:8 }
  const maxG       = game.population?.guerrier || 0
  const tile       = game.map[targetCase.row]?.[targetCase.col]
  // Armer : appliqué automatiquement si actif
  const armerActif = game.activeEffects?.armerActif || false
  const hasHopital = game.map.flat().some(t => t.owner==='player' && t.buildings?.includes('hopital'))
  const hasNourriture = (game.resources?.nourriture||0) >= 1

  async function lancerCombat() {
    setPhase('rolling'); setRolling(true); setDieEmpire(null); setDieJoueur(null)
    await new Promise(r => setTimeout(r, 700))
    const res = resoudreCombatEmpireVsJoueur(empireId, tile, game, guerriers)
    // Garder les pertes BRUTES — les réductions seront appliquées à la confirmation
    setDieEmpire(res.de2); setDieJoueur(res.de1); setRolling(false)
    await new Promise(r => setTimeout(r, 400))
    setCombatResult(res); setPhase('result')
  }

  function confirmerAvecSoigner() {
    const res = { ...combatResult }
    // Appliquer toutes les réductions : auto (Armer + bâtiments) + Soigner si activé
    const reductionAuto = (armerActif ? 1 : 0)
      + (res.reductionTourDeGuet || 0)
      + (res.reductionForteresse || 0)
    const reductionSoigner = soignerUsed ? 1 : 0
    res.pertesJoueur = Math.max(0, res.pertesJoueur - reductionAuto - reductionSoigner)
    res.newGame = { ...res.newGame,
      population: { ...res.newGame.population, guerrier: Math.max(0, (game.population?.guerrier||0) - res.pertesJoueur) },
      activeEffects: { ...res.newGame.activeEffects, armerActif: armerActif ? false : res.newGame.activeEffects?.armerActif }
    }
    if (soignerUsed) {
      res.newGame = { ...res.newGame,
        resources: { ...res.newGame.resources, nourriture: Math.max(0,(res.newGame.resources.nourriture||0)-1) }
      }
    }
    onConfirm(res)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', borderRadius:12, padding:20, width:310, display:'flex', flexDirection:'column', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.25)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36,height:36,borderRadius:9,background:cfg.colorLight,border:`2px solid ${cfg.color}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18 }}>{cfg.emoji}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:14, color:'#dc2626' }}>{cfg.name} attaque !</div>
            <div style={{ fontSize:12, color:'#64748b' }}>Case ({targetCase.col+1},{targetCase.row+1}) · Puissance : {emp.power}</div>
          </div>
        </div>

        {/* MODE TRIBUT — attaque annulée par le tribut */}
        {tributMode && (
          <>
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:9, padding:12, display:'flex', alignItems:'flex-start', gap:10 }}>
              <span style={{ fontSize:22, flexShrink:0 }}>🛡️</span>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#166534', marginBottom:4 }}>Tribut diplomatique actif</div>
                <div style={{ fontSize:12, color:'#166534', lineHeight:1.5 }}>
                  Votre Ambassade auprès de {cfg?.name} annule cette attaque.
                </div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:10, display:'flex', flexDirection:'column', gap:6 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'#64748b' }}>Attaque annulée</span>
                <span style={{ fontWeight:500, color:'#16a34a' }}>✓ Aucune perte</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                <span style={{ color:'#64748b' }}>Tribut {cfg?.emoji} {cfg?.name}</span>
                <span style={{ color:'#94a3b8' }}>Consommé</span>
              </div>
            </div>
            <button onClick={() => onConfirm(null)}
              style={{ padding:'10px 0', borderRadius:9, border:'none', background:'#166534', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
              Continuer →
            </button>
          </>
        )}

        {/* PRÉPARATION */}
        {!tributMode && phase === 'prepare' && (
          <>
            <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'8px 10px', fontSize:12, color:'#7f1d1d', lineHeight:1.5 }}>
              Défense : 1D6 + guerriers vs 1D6 + {emp.power}. Égalité → vous défendez.
              {armerActif && <><br/><span style={{ color:'#d97706' }}>🗡️ Armer actif : -1 perte automatiquement.</span></>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ flex:1, fontSize:13 }}>⚔️ Guerriers ({maxG} dispo.)</span>
              <button onClick={()=>setGuerriers(g=>Math.max(0,g-1))} disabled={guerriers===0}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers>0?'pointer':'default',opacity:guerriers===0?0.3:1,fontSize:15 }}>−</button>
              <span style={{ width:28, textAlign:'center', fontWeight:600, fontSize:16 }}>{guerriers}</span>
              <button onClick={()=>setGuerriers(g=>Math.min(maxG,g+1))} disabled={guerriers>=maxG}
                style={{ width:24,height:24,borderRadius:5,border:'1px solid #e2e8f0',background:'white',cursor:guerriers<maxG?'pointer':'default',opacity:guerriers>=maxG?0.3:1,fontSize:15 }}>+</button>
            </div>
            <button onClick={lancerCombat}
              style={{ padding:'10px 0',borderRadius:9,border:'none',background:'#dc2626',color:'white',fontSize:14,fontWeight:500,cursor:'pointer' }}>
              ⚔️ Lancer le combat
            </button>
          </>
        )}

        {/* ANIMATION */}
        {!tributMode && phase === 'rolling' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'10px 0' }}>
            <div style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Combat en cours…</div>
            <div style={{ display:'flex', gap:28, alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:11, color:'#64748b' }}>Vous</div>
                <AnimDieCombat finalValue={dieJoueur} rolling={rolling} color="#16a34a" />
              </div>
              <span style={{ fontSize:18, color:'#94a3b8', fontWeight:700 }}>vs</span>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ fontSize:11, color:'#64748b' }}>{cfg.name}</div>
                <AnimDieCombat finalValue={dieEmpire} rolling={rolling} color="#dc2626" />
              </div>
            </div>
          </div>
        )}

        {/* RÉSULTAT */}
        {phase === 'result' && combatResult && (
          <>
            <div style={{ background:combatResult.empireGagne?'#fef2f2':'#f0fdf4', border:`1px solid ${combatResult.empireGagne?'#fca5a5':'#86efac'}`, borderRadius:10, padding:12, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ textAlign:'center', fontSize:15, fontWeight:500, color:combatResult.empireGagne?'#dc2626':'#166534' }}>
                {combatResult.empireGagne ? '💀 L\'empire prend la case !' : '🛡️ Vous défendez !'}
              </div>
              {/* Dés + totaux */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>Vous</div>
                  <AnimDieCombat finalValue={combatResult.de1} rolling={false} color="#16a34a" />
                  <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                  <div style={{ width:36,height:22,borderRadius:5,background:'#f0fdf4',border:'1px solid #86efac',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#16a34a' }}>+{guerriers}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>guerriers</div>
                  {combatResult.bonusDef > 0 && <>
                    <div style={{ width:36,height:22,borderRadius:5,background:'#fefce8',border:'1px solid #fde68a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#d97706' }}>+{combatResult.bonusDef}</div>
                    <div style={{ fontSize:10, color:'#d97706' }}>défense 🗼</div>
                  </>}
                  <div style={{ width:44,height:34,borderRadius:7,background:'#16a34a',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500,color:'white' }}>{combatResult.scoreDef}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
                </div>
                <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500, marginTop:20 }}>vs</div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>{cfg.emoji} {cfg.name}</div>
                  <AnimDieCombat finalValue={combatResult.de2} rolling={false} color="#dc2626" />
                  <div style={{ fontSize:11, color:'#94a3b8' }}>dé</div>
                  <div style={{ width:36,height:22,borderRadius:5,background:'#fef2f2',border:'1px solid #fca5a5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:500,color:'#dc2626' }}>+{emp.power}</div>
                  <div style={{ fontSize:10, color:'#94a3b8' }}>puissance</div>
                  <div style={{ width:44,height:34,borderRadius:7,background:'#dc2626',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:500,color:'white' }}>{combatResult.scoreAtt}</div>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:500 }}>total</div>
                </div>
              </div>
              {/* Pertes */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                <div style={{ background:'rgba(220,38,38,.08)', borderRadius:7, padding:'7px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'#dc2626', marginBottom:3 }}>Vos pertes</div>
                  <div style={{ fontSize:14, fontWeight:500 }}>
                    {combatResult.pertesJoueur>0 ? `-${combatResult.pertesJoueur} guerrier(s)` : 'Aucune'}
                  </div>
                </div>
                <div style={{ background:'rgba(71,85,105,.08)', borderRadius:7, padding:'7px 8px' }}>
                  <div style={{ fontSize:11, fontWeight:500, color:'#475569', marginBottom:3 }}>Dégâts empire</div>
                  <div style={{ fontSize:13 }}>-{combatResult.pertesEmpire} Puissance</div>
                </div>
              </div>
            </div>

            {/* Armer + Soigner — comme ActionAttaquer */}
            {(armerActif || hasHopital || combatResult.reductionTourDeGuet > 0 || combatResult.reductionForteresse > 0) && combatResult.pertesJoueur > 0 && (
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {armerActif && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    ✓ Armer : -1 perte
                  </div>
                )}
                {combatResult.reductionTourDeGuet > 0 && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    🗼 Tour de guet : -1 perte (victoire)
                  </div>
                )}
                {combatResult.reductionForteresse > 0 && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#fef9c3', border:'1px solid #f59e0b', fontSize:11, color:'#92400e' }}>
                    🏰 Forteresse : -2 pertes (victoire)
                  </div>
                )}
                {hasHopital && hasNourriture && !soignerUsed && (
                  <button onClick={()=>setSoignerUsed(true)}
                    style={{ padding:'7px 10px', borderRadius:8, border:'1px solid #16a34a', background:'#f0fdf4', color:'#166534', fontSize:12, fontWeight:500, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                    <span>🏥</span> Soigner (1 Nourriture) : -1 perte
                  </button>
                )}
                {soignerUsed && (
                  <div style={{ padding:'5px 10px', borderRadius:8, background:'#f0fdf4', border:'1px solid #86efac', fontSize:11, color:'#16a34a' }}>
                    ✓ Soigner activé : -1 perte
                  </div>
                )}
              </div>
            )}

            <button onClick={confirmerAvecSoigner}
              style={{ padding:'10px 0',borderRadius:9,border:'none',background:'#475569',color:'white',fontSize:14,fontWeight:500,cursor:'pointer' }}>
              Confirmer et continuer →
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── EventOverlay — popup centré sur tout l'écran ─────────────────────────
function EventOverlay({ evenement, game, onConfirm, infoOnly, caseIdx, effetCalcule }) {
  const { icone, titre, intro, texte, cat_display, roleplay, choixTexte, finScene, effetTexte } = evenement
  const [phase, setPhase] = useState('choix')   // choix | resultat
  // Nettoyer les préfixes [A] A) [Sans GC] etc. d'une ligne
  const stripPrefix = (line) => line
    .replace(/^\[([A-Z\/]+|Sans [A-Za-zÀ-ÿ ]+|Avec [A-Za-zÀ-ÿ ]+)\]\s*/, '')
    .replace(/^[A-D]\)\s*/, '')
    .trim()

  // N'afficher que la ligne correspondant au choix fait
  const filterByChoice = (text, choiceLabel) => {
    if (!text) return text
    const lines = text.split('\n').filter(Boolean)
    // Si le texte n'a pas de préfixes [X] → l'afficher tel quel (un seul résultat possible)
    const hasPrefix = lines.some(l => /^\[/.test(l) || /^[A-D]\)/.test(l))
    if (!hasPrefix) return lines.map(stripPrefix).join('\n')
    if (!choiceLabel) return lines.map(stripPrefix).join('\n')
    // Chercher la ligne correspondant au label
    const match = lines.find(l =>
      l.startsWith('[' + choiceLabel + ']') ||
      l.startsWith(choiceLabel + ')') ||
      l.startsWith('[A/B/C]') && ['A','B','C'].includes(choiceLabel) ||
      l.startsWith('[A/B/C/D]') ||
      l.startsWith('[Sans GC]') && choiceLabel === 'SansGC' ||
      l.startsWith('[Avec GC]') && choiceLabel === 'AvecGC'
    )
    if (match) return stripPrefix(match)
    // Fallback : première ligne sans préfixe correspondant à un autre choix
    return lines.map(stripPrefix).join('\n')
  }
  const [choixFait, setChoixFait] = useState(null) // label du choix fait
  const pendingNewGameRef = useRef(null) // stocke newGame pendant la phase résultat
  const setPhaseStable = (p) => setPhase(p)

  // Couleurs par catégorie
  const STYLES = {
    Bonus:       { bg:'#f0fdf4', border:'#86efac', badge:'#dcfce7', badgeText:'#166534', title:'#14532d' },
    Malus:       { bg:'#fef2f2', border:'#fca5a5', badge:'#fee2e2', badgeText:'#991b1b', title:'#7f1d1d' },
    Scripté:     { bg:'#fffbeb', border:'#fcd34d', badge:'#fef3c7', badgeText:'#92400e', title:'#78350f' },
    Empire:      { bg:'#fff7ed', border:'#fdba74', badge:'#ffedd5', badgeText:'#9a3412', title:'#7c2d12' },
    Interaction: { bg:'#eff6ff', border:'#93c5fd', badge:'#dbeafe', badgeText:'#1e40af', title:'#1e3a8a' },
    Neutre:      { bg:'#faf5ff', border:'#c4b5fd', badge:'#ede9fe', badgeText:'#5b21b6', title:'#4c1d95' },
  }
  const S = STYLES[cat_display] || STYLES['Neutre']

  // Phase résultat : afficher fin scénarisée + effet
  const showResultat = (labelChoix) => {
    setChoixFait(labelChoix)
    setPhase('resultat')
  }

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:800,
      display:'flex', alignItems:'center', justifyContent:'center', padding:16
    }}>
      <div style={{
        background:'white', borderRadius:16, width:'100%', maxWidth:480,
        boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', display:'flex', flexDirection:'column',
      }}>

        {/* Header */}
        <div style={{ background:S.bg, borderBottom:`1.5px solid ${S.border}`, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, borderRadius:'16px 16px 0 0' }}>
          <div style={{ width:44, height:44, borderRadius:10, background:S.badge, border:`1px solid ${S.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
            {icone}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:11, color:S.badgeText, fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>
              {cat_display} — case {caseIdx + 1}
            </div>
            <div style={{ fontSize:17, fontWeight:500, color:S.title }}>{titre}</div>
          </div>
          <div style={{ fontSize:10, background:S.badge, color:S.badgeText, padding:'3px 9px', borderRadius:20, border:`0.5px solid ${S.border}`, flexShrink:0 }}>
            {cat_display}
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:14, overflowY:'auto', flex:1 }}>

          {/* Intro scénarisée */}
          <p style={{ fontSize:13, color:'#475569', lineHeight:1.65, margin:0, fontStyle:'italic' }}>
            {intro || texte}
          </p>

          {/* Phase choix */}
          {phase === 'choix' && (
            <>
              {(choixTexte || effetTexte) && (
                <div style={{ borderTop:'0.5px solid #e2e8f0', paddingTop:12 }} />
              )}
              {/* Mode infoOnly (nextTurn + immediat) */}
              {infoOnly && (
                <>
                  {(effetCalcule || effetTexte) && (
                    <div style={{ background:'#f8fafc', border:'0.5px solid #e2e8f0', borderRadius:9, padding:'10px 13px' }}>
                      <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Effets</div>
                      {(effetCalcule || effetTexte || '').split('\n').filter(Boolean).map((line,i) => (
                        <p key={i} style={{ fontSize:12, color:'#374151', lineHeight:1.5, margin:0, marginBottom:3 }}>
                          {stripPrefix(line)}
                        </p>
                      ))}
                    </div>
                  )}
                  <button onClick={()=>onConfirm(game)} style={{ padding:'11px 0', borderRadius:10, border:'none', background:S.badgeText, color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                    Continuer →
                  </button>
                </>
              )}
              {/* Mode choixJoueur */}
              {!infoOnly && (
                <EvenementPanel
                  evenement={evenement}
                  game={game}
                  onConfirm={(newGame, labelChoix) => {
                    // _select = sélection de case en cours → ne pas intercepter
                    if (labelChoix && labelChoix.endsWith('_select')) {
                      onConfirm(newGame, labelChoix)
                      return
                    }
                    if (finScene && finScene !== '—') {
                      setChoixFait(labelChoix || '')
                      pendingNewGameRef.current = newGame
                      setPhaseStable('resultat')
                    } else {
                      onConfirm(newGame)
                    }
                  }}
                  showEffetInButton={!roleplay}
                />
              )}
            </>
          )}

          {/* Phase résultat (roleplay) */}
          {phase === 'resultat' && (() => {
            const r = evenement.resultats?.[choixFait]
            const finText = r?.fin || ''
            const effetText = r?.effet || ''
            return (
              <>
                <div style={{ borderTop:'0.5px solid #e2e8f0', paddingTop:12 }} />
                {finText && (
                  <div style={{ background:S.bg, border:`1px solid ${S.border}`, borderRadius:9, padding:'11px 13px' }}>
                    <p style={{ fontSize:13, color:S.title, lineHeight:1.6, margin:0, fontStyle:'italic' }}>
                      {finText}
                    </p>
                  </div>
                )}
                {effetText && (
                  <div style={{ background:'#f8fafc', border:'0.5px solid #e2e8f0', borderRadius:9, padding:'10px 13px' }}>
                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Effet</div>
                    <p style={{ fontSize:12, color:'#374151', lineHeight:1.5, margin:0 }}>{effetText}</p>
                  </div>
                )}
                <button onClick={()=>{ const ng = pendingNewGameRef.current || game; onConfirm(ng) }}
                  style={{ padding:'11px 0', borderRadius:10, border:'none', background:S.badgeText, color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  Continuer →
                </button>
              </>
            )
          })()}

        </div>
      </div>
    </div>
  )
}


function EvenementPanel({ evenement, game, onConfirm, infoOnly=false, showEffetInButton=true }) {
  const [choices, setChoices] = useState({})
  const [step, setStep] = useState(0)
  const { effet } = evenement
  const EMPIRE_CFG = EMPIRE_CONFIG
  const RES = ['nourriture','bois','argile','fer','or']
  const RES_L = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or', or2:'Or' }
  const POP_ALL = ['fermier','ouvrier','artisan','guerrier','marin','pretre','noble','chevalier']
  const POP_L = { fermier:'Fermier', ouvrier:'Ouvrier', artisan:'Artisan', guerrier:'Guerrier', marin:'Marin', pretre:'Prêtre', noble:'Noble', chevalier:'Chevalier' }
  const POP_FAMINE = ['fermier','ouvrier','artisan','guerrier','marin']
  const btnStyle = (active,color='#1e3a5f') => ({ padding:'9px 0',borderRadius:8,border:'none',background:active?color:'#e2e8f0',color:'white',fontSize:12,fontWeight:500,cursor:active?'pointer':'default' })

  // ── Mode info uniquement (Aubaine, Percée techno, etc.) ───────────────
  if (infoOnly) {
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <div style={{ background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#166534',lineHeight:1.5 }}>
          ✓ {evenement.texte}
        </div>
        <button onClick={()=>onConfirm(game)} style={btnStyle(true,'#16a34a')}>Continuer →</button>
      </div>
    )
  }

  // ── gainRessources (Abondance) ────────────────────────────────────────
  if (effet?.type === 'gainRessources') {
    const total = Object.values(choices).reduce((a,b)=>a+b,0)
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez {effet.nb} ressource(s) ({total}/{effet.nb}) :</p>
        {RES.map(r => { const sel=choices[r]||0; const full=(game.resources?.[r]||0)>=(game.storageMax||10); return (
          <div key={r} style={{ display:'flex',alignItems:'center',gap:8,opacity:full&&sel===0?0.35:1 }}>
            <span style={{ flex:1,fontSize:12 }}>{RES_L[r]}{full&&sel===0?' (plein)':''}</span>
            <button onClick={()=>setChoices({...choices,[r]:Math.max(0,sel-1)})} disabled={sel===0} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:sel>0?'pointer':'default',opacity:sel===0?0.3:1 }}>−</button>
            <span style={{ width:20,textAlign:'center',fontWeight:600 }}>{sel}</span>
            <button onClick={()=>{if(total>=effet.nb||full)return;setChoices({...choices,[r]:sel+1})}} disabled={total>=effet.nb||full} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:(total<effet.nb&&!full)?'pointer':'default',opacity:(total>=effet.nb||full)?0.3:1 }}>+</button>
          </div>
        )})}
        <button onClick={()=>{ if(total<effet.nb)return; const nr={...game.resources}; for(const[r,q]of Object.entries(choices))nr[r]=Math.min((nr[r]||0)+q,game.storageMax||10); onConfirm({...game,resources:nr},'A') }}
          disabled={total<effet.nb} style={btnStyle(total>=effet.nb,'#16a34a')}>Confirmer</button>
      </div>
    )
  }

  // ── migrationHeureuse ──────────────────────────────────────────────────
  if (effet?.type === 'migrationHeureuse') {
    const types = [{k:'fermier',l:'Fermiers'},{k:'ouvrier',l:'Ouvriers'},{k:'artisan',l:'Artisans'}]
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez le type de population :</p>
        {types.map(({k,l})=>(
          <button key={k} onClick={()=>{
            const c=g=>({...g,map:g.map.map(r=>r.map(t=>t))})
            const np={...game.population,[k]:(game.population?.[k]||0)+2}
            // Cabane sur case aléatoire <3 bâtiments
            const eligibles=game.map.flat().filter(t=>t.owner==='player'&&(t.buildings?.length||0)<3)
            let nm=game.map.map(r=>r.map(t=>({...t})))
            if(eligibles.length>0){const t=eligibles[Math.floor(Math.random()*eligibles.length)];nm[t.row][t.col]={...nm[t.row][t.col],buildings:[...(nm[t.row][t.col].buildings||[]),'cabane']}}
            onConfirm({...game,population:np,map:nm},'A')
          }} style={{ padding:'8px',borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12,textAlign:'left' }}>
            +2 {l} + 1 Cabane
          </button>
        ))}
        <button onClick={()=>{
          // Refouler → empire le plus puissant +1 power
          const sorted=Object.entries(game.empires||{}).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
          if(!sorted.length){onConfirm(game);return}
          const [topId,topEmp]=sorted[0]
          const ne={...game.empires,[topId]:{...topEmp,power:Math.min(topEmp.maxPower,topEmp.power+1)}}
          onConfirm({...game,empires:ne})
        }} style={{ padding:'8px',borderRadius:8,border:'1px solid #fca5a5',background:'#fef2f2',cursor:'pointer',fontSize:12,textAlign:'left',color:'#dc2626' }}>
          Les refouler (empire le plus puissant +1 Puissance)
        </button>
      </div>
    )
  }

  // ── famine ─────────────────────────────────────────────────────────────
  if (effet?.type === 'famine') {
    // Événement Famine : nourrir toute la population (pas seulement l'excédent)
    // Nobles et Prêtres sont protégés (pas besoin de Nourriture pour eux)
    const pop = game.population||{}
    const popProtegee = (pop.noble||0) + (pop.pretre||0)
    const popANourrir = Math.max(0, Object.values(pop).reduce((a,b)=>a+b,0) - popProtegee)
    const nourritureDispo = game.resources?.nourriture||0
    const nourritureDemandee = Math.ceil(popANourrir/5)
    // Réutiliser excedent pour la logique de morts (pop non nourrie)
    const excedent = popANourrir
    const [nourr, setNourr] = useState(Math.min(nourritureDispo, nourritureDemandee))
    const [famPhase, setFamPhase] = useState('nourrir') // nourrir | tuer | fin
    const [pertes, setPertes] = useState({})
    const FAMINE_TYPES = ['fermier','ouvrier','artisan','guerrier','marin']
    const POP_L = {fermier:'Fermier',ouvrier:'Ouvrier',artisan:'Artisan',guerrier:'Guerrier',marin:'Marin',pretre:'Prêtre',noble:'Noble'}
    const nourrisTotal = nourr * 5
    const morts = Math.max(0, excedent - nourrisTotal)
    const totalPertes = Object.values(pertes).reduce((a,b)=>a+b,0)

    if (famPhase === 'nourrir') return (
      <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
        <div style={{ background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#7f1d1d',lineHeight:1.5 }}>
          Population à nourrir : <strong>{popANourrir}</strong> (Nobles et Prêtres protégés)<br/>
          Nourriture nécessaire : <strong>{nourritureDemandee}</strong> (1 Nourr. = 5 pop)
        </div>
        <div>
          <div style={{ fontSize:11,color:'#94a3b8',marginBottom:6 }}>Nourriture à distribuer ({nourritureDispo} disponible)</div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button onClick={()=>setNourr(n=>Math.max(0,n-1))} disabled={nourr<=0} style={{ width:28,height:28,borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:nourr>0?'pointer':'default',opacity:nourr>0?1:0.3,fontSize:16 }}>−</button>
            <span style={{ width:30,textAlign:'center',fontWeight:600,fontSize:16 }}>{nourr}</span>
            <button onClick={()=>setNourr(n=>Math.min(nourritureDispo,n+1))} disabled={nourr>=nourritureDispo} style={{ width:28,height:28,borderRadius:6,border:'1px solid #e2e8f0',background:'white',cursor:nourr<nourritureDispo?'pointer':'default',opacity:nourr<nourritureDispo?1:0.3,fontSize:16 }}>+</button>
            <span style={{ fontSize:12,color:'#64748b' }}>→ nourrit {nourrisTotal} pop, <strong style={{color:morts>0?'#dc2626':'#16a34a'}}>{morts} mort{morts>1?'s':''}</strong></span>
          </div>
        </div>
        <button onClick={()=>{ if(morts>0) setFamPhase('tuer'); else { const nr={...game.resources,nourriture:Math.max(0,nourritureDispo-nourr)}; onConfirm({...game,resources:nr},'A') }}} style={btnStyle(true,'#dc2626')}>Valider</button>
      </div>
    )
    if (famPhase === 'tuer') return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <div style={{ background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#7f1d1d' }}>
          {morts} population{morts>1?'s':''} doivent mourir. Désignez qui.
        </div>
        {FAMINE_TYPES.map(t=>{ const dispo=game.population?.[t]||0; if(!dispo)return null; const nb=pertes[t]||0; return (
          <div key={t} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ flex:1,fontSize:12 }}>{POP_L[t]} ({dispo})</span>
            <button onClick={()=>{const cur=pertes[t]||0;if(cur>0)setPertes({...pertes,[t]:cur-1})}} disabled={!nb} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:nb?'pointer':'default',opacity:nb?1:0.3 }}>−</button>
            <span style={{ width:20,textAlign:'center',fontWeight:600,color:'#dc2626' }}>{nb}</span>
            <button onClick={()=>{if(totalPertes>=morts)return;setPertes({...pertes,[t]:(pertes[t]||0)+1})}} disabled={totalPertes>=morts||nb>=dispo} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:(totalPertes<morts&&nb<dispo)?'pointer':'default',opacity:(totalPertes>=morts||nb>=dispo)?0.3:1 }}>+</button>
          </div>
        )})}
        <button onClick={()=>{ if(totalPertes<morts)return; setFamPhase('fin') }} disabled={totalPertes<morts} style={btnStyle(totalPertes>=morts,'#dc2626')}>Confirmer les pertes ({totalPertes}/{morts})</button>
      </div>
    )
    if (famPhase === 'fin') {
      const np={...game.population}
      Object.entries(pertes).forEach(([t,n])=>{np[t]=Math.max(0,(np[t]||0)-n)})
      const nr={...game.resources,nourriture:Math.max(0,nourritureDispo-nourr)}
      const ng={...game,population:np,resources:nr}
      return (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          <div style={{ background:'#f0fdf4',border:'1px solid #86efac',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#166534',lineHeight:1.5,fontStyle:'italic' }}>
            Le calme revient, lourd et triste. Les survivants reprennent le travail, épuisés.
          </div>
          <div style={{ background:'#f8fafc',border:'0.5px solid #e2e8f0',borderRadius:8,padding:'10px 12px',fontSize:12,color:'#374151' }}>
            {nourr>0&&<div>-{nourr} Nourriture distribuée</div>}
            {Object.entries(pertes).filter(([,v])=>v>0).map(([t,v])=><div key={t}>-{v} {POP_L[t]}</div>)}
            {morts===0&&nourr>0&&<div style={{color:'#16a34a'}}>Aucune perte</div>}
          </div>
          <button onClick={()=>onConfirm(ng,'A')} style={btnStyle(true,'#1e3a5f')}>Continuer →</button>
        </div>
      )
    }
  }

  // ── épidémie ───────────────────────────────────────────────────────────
  if (effet?.type === 'epidemie') {
    const hasHopital=game.map?.flat().some(t=>t.owner==='player'&&t.buildings?.includes('hopital'))
    const nbPertes=hasHopital?1:2
    const [sel,setSel]=useState([])
    const canAdd=sel.length<nbPertes
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Désignez {nbPertes} population(s) à perdre :{hasHopital?' (Hôpital : 1 perte)':''}</p>
        {POP_ALL.map(t=>{ const dispo=(game.population?.[t]||0)>0; const nb=sel.filter(s=>s===t).length; return dispo?(
          <div key={t} style={{ display:'flex',alignItems:'center',gap:8 }}>
            <span style={{ flex:1,fontSize:12 }}>{POP_L[t]} ({game.population?.[t]||0})</span>
            <button onClick={()=>{if(canAdd)setSel([...sel,t])}} disabled={!canAdd} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:canAdd?'pointer':'default',opacity:canAdd?1:0.3 }}>+</button>
            <span style={{ width:20,textAlign:'center',fontWeight:600,color:'#dc2626' }}>{nb}</span>
            <button onClick={()=>{const i=sel.lastIndexOf(t);if(i>=0){const ns=[...sel];ns.splice(i,1);setSel(ns)}}} disabled={nb===0} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:nb>0?'pointer':'default',opacity:nb>0?1:0.3 }}>−</button>
          </div>
        ):null})}
        <button onClick={()=>{ if(sel.length<nbPertes)return; const np={...game.population}; sel.forEach(t=>{np[t]=Math.max(0,(np[t]||0)-1)}); onConfirm({...game,population:np}) }}
          disabled={sel.length<nbPertes} style={btnStyle(sel.length>=nbPertes,'#dc2626')}>Confirmer ({sel.length}/{nbPertes})</button>
      </div>
    )
  }

  // ── sécheresse ─────────────────────────────────────────────────────────
  if (effet?.type === 'secheresse') {
    const canPay=(game.resources?.fer||0)>=2
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canPay)return; const nr={...game.resources,fer:Math.max(0,(game.resources.fer||0)-2)}; onConfirm({...game,resources:nr},'A') }}
          disabled={!canPay} style={btnStyle(canPay,'#16a34a')}>Payer 2 Fer {!canPay?'(insuffisant)':''}</button>
        <button onClick={()=>{onConfirm({...game,nextTurnEffects:{...(game.nextTurnEffects||{}),secheresse:true}},'B')}}
          style={btnStyle(true,'#dc2626')}>Subir l'effet</button>
      </div>
    )
  }

  // ── tremblement de terre ───────────────────────────────────────────────
  if (effet?.type === 'tremblementDeTerre') {
    if(game.activeEffects?.genieCivil) return (
      <div>
        <p style={{ fontSize:12,color:'#16a34a',margin:'0 0 8px' }}>✓ Génie civil protège vos constructions.</p>
        <button onClick={()=>onConfirm(game)} style={btnStyle(true,'#16a34a')}>Continuer →</button>
      </div>
    )
    const allBuildings=[]
    game.map?.flat().forEach(t=>{ if(t.owner!=='player')return; (t.buildings||[]).forEach((b,bi)=>allBuildings.push({row:t.row,col:t.col,bi,b})) })
    if(!allBuildings.length) return <button onClick={()=>onConfirm(game)} style={btnStyle(true)}>Aucun bâtiment — Continuer →</button>
    const [sel,setSel]=useState([])
    const nb=Math.min(2,allBuildings.length)
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Désignez {nb} bâtiment(s) à détruire ({sel.length}/{nb}) :</p>
        {allBuildings.map((b,idx)=>{ const isSel=sel.includes(idx); return (
          <button key={idx} onClick={()=>{ if(isSel)setSel(sel.filter(s=>s!==idx)); else if(sel.length<nb)setSel([...sel,idx]) }}
            style={{ padding:'7px 10px',borderRadius:7,border:`1px solid ${isSel?'#dc2626':'#e2e8f0'}`,background:isSel?'#fef2f2':'#f8fafc',cursor:'pointer',fontSize:12,textAlign:'left' }}>
            {isSel?'💥 ':''}{b.b} — case ({b.col+1},{b.row+1})
          </button>
        )})}
        <button onClick={()=>{ if(sel.length<nb)return; let nm=game.map.map(r=>r.map(t=>({...t}))); sel.forEach(idx=>{ const {row,col,bi}=allBuildings[idx]; nm[row][col]={...nm[row][col],buildings:nm[row][col].buildings.filter((_,i)=>i!==bi)} }); onConfirm({...game,map:nm}) }}
          disabled={sel.length<nb} style={btnStyle(sel.length>=nb,'#dc2626')}>Confirmer</button>
      </div>
    )
  }

  // ── révolte populaire (roleplay) ──────────────────────────────────────
  if (effet?.type === 'revoltePopulaire') {
    const canDistribuer = (game.resources?.or||0) >= 2
    if(step===0) return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canDistribuer)return; const nr={...game.resources,or:Math.max(0,(game.resources?.or||0)-2)};onConfirm({...game,resources:nr},'A')}} disabled={!canDistribuer} style={btnStyle(canDistribuer,'#16a34a')}>Distribuer de l'Or {!canDistribuer?'(Or insuffisant)':''}</button>
        <button onClick={()=>{ const cap=(game.population?.guerrier||0)+(game.population?.marin||0)+(game.population?.chevalier||0); if(cap<3){const keys=Object.keys(game.resources||{}).filter(k=>(game.resources[k]||0)>0);const nr={...game.resources};let n=5;while(n>0&&keys.length){const k=keys[Math.floor(Math.random()*keys.length)];if(nr[k]>0){nr[k]=Math.max(0,nr[k]-1);n--}else keys.splice(keys.indexOf(k),1)};onConfirm({...game,resources:nr},'C');return}; const types=['fermier','ouvrier'];const np={...game.population};for(let k=0;k<2;k++){const eligible=types.filter(t=>(np[t]||0)>0);if(!eligible.length)break;const t=eligible[Math.floor(Math.random()*eligible.length)];np[t]=Math.max(0,(np[t]||0)-1)};onConfirm({...game,population:np},'B') }} style={btnStyle(true,'#dc2626')}>Envoyer l'armée</button>
        <button onClick={()=>{ const keys=Object.keys(game.resources||{}).filter(k=>(game.resources[k]||0)>0);const nr={...game.resources};let n=5;while(n>0&&keys.length){const k=keys[Math.floor(Math.random()*keys.length)];if(nr[k]>0){nr[k]=Math.max(0,nr[k]-1);n--}else keys.splice(keys.indexOf(k),1)};onConfirm({...game,resources:nr},'C') }} style={btnStyle(true,'#475569')}>Ne rien faire</button>
      </div>
    )
  }

  // ── inondation ────────────────────────────────────────────────────────
  if (effet?.type === 'inondation') {
    const canPay=(game.resources?.bois||0)>=1
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canPay)return; const nr={...game.resources,bois:Math.max(0,(game.resources.bois||0)-1)}; onConfirm({...game,resources:nr},'A') }}
          disabled={!canPay} style={btnStyle(canPay,'#16a34a')}>Payer 1 Bois {!canPay?'(insuffisant)':''}</button>
        <button onClick={()=>{onConfirm({...game,nextTurnEffects:{...(game.nextTurnEffects||{}),inondation:true}},'B')}}
          style={btnStyle(true,'#dc2626')}>Subir l'effet</button>
      </div>
    )
  }

  // ── incendie ──────────────────────────────────────────────────────────
  if (effet?.type === 'incendie') {
    const adj=(t,map)=>[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>map[t.row+dr]?.[t.col+dc]).filter(Boolean)
    // La forêt est une RESSOURCE (resource1.type = 'foret' ou 'foret_gibier'), pas un terrain
    const hasForet=(t)=>t.resource1?.type==='foret'||t.resource1?.type==='foret_gibier'||t.resource2?.type==='foret'||t.resource2?.type==='foret_gibier'
    const eligibles=game.map?.flat().filter(t=>t.owner==='player'&&(t.buildings?.length||0)>0&&(hasForet(t)||adj(t,game.map).some(v=>hasForet(v))))||[]
    if(!eligibles.length) return <button onClick={()=>onConfirm(game)} style={btnStyle(true)}>Aucune case éligible — Continuer →</button>
    const [selCase,setSelCase]=useState(null)
    const [selB,setSelB]=useState(null)
    if(!selCase) return (
      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez une case :</p>
        {eligibles.map(t=><button key={`${t.row}-${t.col}`} onClick={()=>setSelCase(t)} style={{ padding:'7px',borderRadius:7,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:12 }}>Case ({t.col+1},{t.row+1}) — {t.buildings?.join(', ')}</button>)}
      </div>
    )
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez un bâtiment :</p>
        {(selCase.buildings||[]).map((b,bi)=><button key={bi} onClick={()=>{ let nm=game.map.map(r=>r.map(t=>({...t}))); nm[selCase.row][selCase.col]={...nm[selCase.row][selCase.col],buildings:nm[selCase.row][selCase.col].buildings.filter((_,i)=>i!==bi)}; const nr={...game.resources,bois:Math.max(0,(game.resources?.bois||0)-1)}; onConfirm({...game,map:nm,resources:nr},'A') }} style={{ padding:'7px',borderRadius:7,border:'1px solid #fca5a5',background:'#fef2f2',cursor:'pointer',fontSize:12 }}>{b}</button>)}
      </div>
    )
  }

  // ── ressource épuisée ─────────────────────────────────────────────────
  if (effet?.type === 'ressourceEpuisee') {
    const RES3=['or','fer','argile']
    const RES3L={or:'Or',fer:'Fer',argile:'Argile'}
    const [sel,setSel]=useState([])
    const canAdd=sel.length<2
    // Total de ressources disponibles parmi Or/Fer/Argile
    const totalDispo=RES3.reduce((s,r)=>s+(game.resources?.[r]||0),0)
    const nbRequis=Math.min(2,totalDispo) // si <2 dispo, confirmer avec ce qu'on a
    const peutConfirmer=sel.length>=nbRequis
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>
          Choisissez {nbRequis} ressource(s) à perdre ({sel.length}/{nbRequis}) :
          {totalDispo===0 && <span style={{color:'#dc2626'}}> Aucune ressource disponible.</span>}
        </p>
        {RES3.map(r=>{ const qty=(game.resources?.[r]||0); const nbSel=sel.filter(s=>s===r).length; const grise=qty===0||(nbSel>0&&qty<=nbSel); return (
          <div key={r} style={{ display:'flex',alignItems:'center',gap:8,opacity:grise&&nbSel===0?0.35:1 }}>
            <span style={{ flex:1,fontSize:12 }}>{RES3L[r]} ({qty})</span>
            <button onClick={()=>{if(!grise&&canAdd)setSel([...sel,r])}} disabled={grise||!canAdd} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:(!grise&&canAdd)?'pointer':'default',opacity:(!grise&&canAdd)?1:0.3 }}>+</button>
            <span style={{ width:18,textAlign:'center',fontWeight:600,color:'#dc2626' }}>{nbSel}</span>
            <button onClick={()=>{const i=sel.lastIndexOf(r);if(i>=0){const ns=[...sel];ns.splice(i,1);setSel(ns)}}} disabled={nbSel===0} style={{ width:22,height:22,borderRadius:4,border:'1px solid #e2e8f0',background:'white',cursor:nbSel>0?'pointer':'default',opacity:nbSel>0?1:0.3 }}>−</button>
          </div>
        )})}
        <button onClick={()=>{ if(!peutConfirmer)return; const nr={...game.resources}; sel.forEach(r=>{nr[r]=Math.max(0,(nr[r]||0)-1)}); onConfirm({...game,resources:nr},'A') }}
          disabled={!peutConfirmer} style={btnStyle(peutConfirmer,'#dc2626')}>Confirmer</button>
      </div>
    )
  }

  // ── mauvais présages ──────────────────────────────────────────────────
  if (effet?.type === 'mauvaisPresages') {
    const canA=(game.resources?.or||0)>=3
    const canB=(game.population?.pretre||0)>0&&(game.population?.noble||0)>0
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez votre moindre mal :</p>
        <button onClick={()=>{ if(!canA)return; const nr={...game.resources,or:Math.max(0,(game.resources.or||0)-3)}; onConfirm({...game,resources:nr},'A') }} disabled={!canA} style={btnStyle(canA)}>-3 Or {!canA?'(insuffisant)':''}</button>
        <button onClick={()=>{ if(!canB)return; const np={...game.population,pretre:Math.max(0,(game.population.pretre||0)-1),noble:Math.max(0,(game.population.noble||0)-1)}; onConfirm({...game,population:np},'B') }} disabled={!canB} style={btnStyle(canB)}>-1 Prêtre, -1 Noble {!canB?'(impossible)':''}</button>
        <button onClick={()=>onConfirm({...game,nextTurnEffects:{...(game.nextTurnEffects||{}),actionBloquee:true}},'C')} style={btnStyle(true,'#dc2626')}>-1 dé au prochain tour</button>
      </div>
    )
  }

  // ── diplomatie ────────────────────────────────────────────────────────
  if (effet?.type === 'diplomatie') {
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez 1 empire à neutraliser :</p>
        {[1,2,3,4].map(id=>{ const cfg=EMPIRE_CONFIG[id]; return (
          <button key={id} onClick={()=>{ const ta={...(game.activeEffects?.tributActifs||{}),[id]:true,[String(id)]:true}; onConfirm({...game,activeEffects:{...game.activeEffects,tributActifs:ta}},cfg?.name) }}
            style={{ padding:'8px',borderRadius:7,border:`1px solid ${cfg?.color||'#e2e8f0'}`,background:'#f8fafc',cursor:'pointer',fontSize:12,textAlign:'left' }}>
            {cfg?.emoji} {cfg?.name}
          </button>
        )})}
      </div>
    )
  }

  // ── tribut forcé ──────────────────────────────────────────────────────
  if (effet?.type === 'tributForce') {
    const canPay=(game.resources?.or||0)>=3
    const topEmp=Object.entries(game.empires||{}).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)[0]
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canPay)return; const nr={...game.resources,or:Math.max(0,(game.resources.or||0)-3)}; const ta={...(game.activeEffects?.tributActifs||{}),[topEmp?.[0]]:true,[String(topEmp?.[0])]:true}; onConfirm({...game,resources:nr,activeEffects:{...game.activeEffects,tributActifs:ta}},'A') }}
          disabled={!canPay} style={btnStyle(canPay,'#16a34a')}>Payer 3 Or {!canPay?'(insuffisant)':''}</button>
        <button onClick={()=>onConfirm({...game,nextTurnEffects:{...(game.nextTurnEffects||{}),tributForceD40:topEmp?.[0]}},'B')}
          style={btnStyle(true,'#dc2626')}>Refuser (1 D40 immédiat)</button>
      </div>
    )
  }

  // ── soumission des tribus ─────────────────────────────────────────────
  if (effet?.type === 'soumissionDesTribus') {
    const canAccept=(game.population?.guerrier||0)>=2
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canAccept)return; onConfirm({...game,_soumissionPendingCase:true},'A_select') }}
          disabled={!canAccept} style={btnStyle(canAccept,'#16a34a')}>
          Protéger (-2 Guerriers) {!canAccept?'(insuffisant)':''}
        </button>
        <button onClick={()=>onConfirm(game,'B')} style={btnStyle(true,'#475569')}>Refuser</button>
      </div>
    )
  }

  // ── travaux forcés ────────────────────────────────────────────────────
  if (effet?.type === 'travauxForces') {
    const canAccept=(game.population?.ouvrier||0)>0
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
        <button onClick={()=>{ if(!canAccept)return; const np={...game.population,ouvrier:Math.max(0,(game.population.ouvrier||0)-1)}; onConfirm({...game,population:np,nextTurnEffects:{...(game.nextTurnEffects||{}),batimentGratuit:true}},'A') }}
          disabled={!canAccept} style={btnStyle(canAccept,'#16a34a')}>Sacrifier 1 Ouvrier → bâtiment gratuit {!canAccept?'(aucun ouvrier)':''}</button>
        <button onClick={()=>onConfirm(game)} style={btnStyle(true,'#475569')}>Refuser</button>
      </div>
    )
  }

  // ── mercenaires ───────────────────────────────────────────────────────
  if (effet?.type === 'mercenaires') {
    const or=game.resources?.or||0
    const opts=[{or:2,g:1},{or:4,g:2},{or:6,g:3}]
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        {opts.map(({or:cost,g})=>(
          <button key={cost} onClick={()=>{ if(or<cost)return; const nr={...game.resources,or:or-cost}; const np={...game.population,guerrier:(game.population?.guerrier||0)+g}; onConfirm({...game,resources:nr,population:np}, cost===2?'A':cost===4?'B':'C') }}
            disabled={or<cost} style={btnStyle(or>=cost,'#1e3a5f')}>Payer {cost} Or → +{g} Guerrier{g>1?'s':''} {or<cost?'(insuffisant)':''}</button>
        ))}
        <button onClick={()=>onConfirm(game)} style={btnStyle(true,'#475569')}>Décliner</button>
      </div>
    )
  }

  // ── espionnage ────────────────────────────────────────────────────────
  if (effet?.type === 'espionnage') {
    if(step===1) {
      const empId=choices.empireId
      const cfg=EMPIRE_CONFIG[empId]
      const d40=game.configD40||[]
      const facesParBord={}
      d40.forEach(f=>{if(f.empireId===empId)facesParBord[`Bord ${f.bord||f.startCase||'?'}`]=(facesParBord[`Bord ${f.bord||f.startCase||'?'}`]||0)+1})
      return (
        <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
          <p style={{ fontSize:12,fontWeight:500,color:'#1e293b' }}>{cfg?.emoji} {cfg?.name} — Profil D40 :</p>
          {Object.entries(facesParBord).map(([b,n])=><div key={b} style={{ fontSize:11,color:'#475569' }}>{b} : {n} face{n>1?'s':''}</div>)}
          <button onClick={()=>{ const ta={...(game.activeEffects?.tributActifs||{}),[empId]:true,[String(empId)]:true}; onConfirm({...game,activeEffects:{...game.activeEffects,tributActifs:ta}},'A') }} style={btnStyle(true,'#1e3a5f')}>Continuer →</button>
        </div>
      )
    }
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Choisissez un empire à espionner :</p>
        {[1,2,3,4].map(id=>{ const cfg=EMPIRE_CONFIG[id]; return (
          <button key={id} onClick={()=>{ setChoices({empireId:id}); setStep(1) }}
            style={{ padding:'8px',borderRadius:7,border:`1px solid ${cfg?.color||'#e2e8f0'}`,background:'#f8fafc',cursor:'pointer',fontSize:12,textAlign:'left' }}>
            {cfg?.emoji} {cfg?.name}
          </button>
        )})}
        <button onClick={()=>onConfirm(game)} style={btnStyle(true,'#475569')}>Ne pas espionner</button>
      </div>
    )
  }

  // ── découverte ────────────────────────────────────────────────────────
  if (effet?.type === 'decouverte') {
    const adj=(t,map)=>[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>map[t.row+dr]?.[t.col+dc]).filter(Boolean)
    const playerTiles=game.map?.flat().filter(t=>t.owner==='player')||[]
    const candidats=[...new Set(playerTiles.flatMap(t=>adj(t,game.map)).filter(t=>!t.explored).map(t=>`${t.row}-${t.col}`))]
      .map(k=>{ const[r,cx]=k.split('-'); return game.map?.[+r]?.[+cx] }).filter(Boolean)
    if(!candidats.length) return <button onClick={()=>onConfirm(game,'A')} style={btnStyle(true)}>Aucune case adjacente non explorée — Continuer →</button>
    return (
      <button onClick={()=>onConfirm({...game,_decouvertePendingCase:true,_decouverteCandidats:candidats},'A_select')}
        style={btnStyle(true,'#1e3a5f')}>
        Choisir une case à explorer
      </button>
    )
  }

  // ── catastrophe naturelle ─────────────────────────────────────────────
  if (effet?.type === 'catastropheNaturelle') {
    const allBuildings=[]
    game.map?.flat().forEach(t=>{ if(t.owner!=='player')return; (t.buildings||[]).forEach((b,bi)=>allBuildings.push({row:t.row,col:t.col,bi,b})) })
    const [selB,setSelB]=useState(null)
    return (
      <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
        <p style={{ fontSize:12,color:'#475569',margin:0 }}>Désignez 1 bâtiment à perdre :</p>
        {allBuildings.length===0?<p style={{ fontSize:11,color:'#94a3b8' }}>Aucun bâtiment — aucune perte pour vous.</p>:null}
        {allBuildings.map((b,idx)=>(
          <button key={idx} onClick={()=>setSelB(idx)} style={{ padding:'7px',borderRadius:7,border:`1px solid ${selB===idx?'#dc2626':'#e2e8f0'}`,background:selB===idx?'#fef2f2':'#f8fafc',cursor:'pointer',fontSize:12,textAlign:'left' }}>
            {selB===idx?'💥 ':''}{b.b} — case ({b.col+1},{b.row+1})
          </button>
        ))}
        <button onClick={()=>{
          // Appliquer pertes empires
          let g2={...game,empires:{...game.empires},map:game.map.map(r=>r.map(t=>({...t})))}
          for(let empId=1;empId<=4;empId++){
            const empTiles=g2.map.flat().filter(t=>t.owner===String(empId))
            if(!empTiles.length) continue
            const playerTiles2=g2.map.flat().filter(t=>t.owner==='player')
            if(!playerTiles2.length) continue
            const dist=(a,b)=>Math.abs(a.row-b.row)+Math.abs(a.col-b.col)
            const target=empTiles.reduce((best,t)=>{ const d=Math.min(...playerTiles2.map(p=>dist(t,p))); return d<best.d?{t,d}:best },{t:null,d:Infinity}).t
            if(target){
            const wasExplored = g2.map[target.row][target.col].explored
            g2.map[target.row][target.col]={...g2.map[target.row][target.col],owner:null,buildings:[],explored:wasExplored||false}
          }
            const emp=g2.empires[empId]||{power:0,maxPower:8}
            g2.empires[empId]={...emp,power:Math.max(0,emp.power-2)}
          }
          // Bâtiment joueur
          if(selB!==null&&allBuildings[selB]){
            const{row,col,bi}=allBuildings[selB]
            g2.map[row][col]={...g2.map[row][col],buildings:g2.map[row][col].buildings.filter((_,i)=>i!==bi)}
          }
          onConfirm(g2,'A')
        }} disabled={allBuildings.length>0&&selB===null} style={btnStyle(allBuildings.length===0||selB!==null,'#dc2626')}>Confirmer</button>
      </div>
    )
  }

  // Fallback
  return (
    <button onClick={()=>onConfirm(game)} style={{ padding:'9px 0',borderRadius:8,border:'none',background:'#1e3a5f',color:'white',fontSize:13,fontWeight:500,cursor:'pointer',width:'100%' }}>
      Continuer →
    </button>
  )
}

// ── Composant principal ───────────────────────────────────────
export function TourEmpiresPanel({ onClose, onHighlightCase, onRequestCaseSelect, onClearCaseSelect }) {
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)
  // Lire le game UNE SEULE FOIS au montage via ref — jamais recapturé
  const gameRef = useRef(useGameStore.getState().game)

  const [rolling, setRolling]     = useState(true)
  const [desValues, setDesValues] = useState([null,null,null,null])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [resultats, setResultats] = useState([])
  const resultatsRef = useRef([])
  const [phase, setPhase]         = useState('rolling')
  const [pendingCombat, setPendingCombat] = useState(null)
  const [pendingEvent, setPendingEvent]   = useState(null)
  const [pendingCaseSelect, setPendingCaseSelect] = useState(null) // { type, onSelect, eligibles }
  // gameState courant stocké dans un ref — JAMAIS dans le state React
  const gsRef = useRef(gameRef.current)
  const startedRef = useRef(false)
  const valsRef    = useRef([])

  useEffect(() => {
    if (startedRef.current) return  // Empêche le double déclenchement (React StrictMode)
    startedRef.current = true
    // Toujours lire le state FRAIS au démarrage pour capturer tous les effets actifs
    gsRef.current = useGameStore.getState().game
    console.log('[EMPIRE] Montage - game.empires:', JSON.stringify(Object.fromEntries(Object.entries(gsRef.current?.empires||{}).map(([k,e])=>[k,e.power]))))
    console.log('[EMPIRE] Montage - tributActifs:', JSON.stringify(gsRef.current?.activeEffects?.tributActifs || {}))
    // Prosélytisme : les empires passent ce tour
    if (gsRef.current.activeEffects?.proselytismeActif) {
      gsRef.current = { ...gsRef.current, activeEffects: { ...gsRef.current.activeEffects, proselytismeActif: false } }
      updateGame(() => ({ ...gsRef.current }))
      setRolling(false)
      setDesValues(['✕','✕','✕','✕'])
      setPhase('proselytisme')
      pause(2000).then(() => finalize([]))
      return
    }
    const vals = lancerDesEmpires(4)
    valsRef.current = vals  // stocker pour les reprises après popup
    setTimeout(() => {
      setDesValues(vals)
      setRolling(false)
      // Ordre de tirage : gauche→droite (pas trié par valeur)
      const ordre = vals.map((v,i)=>({v,i}))
      setTimeout(() => runResolution(ordre, 0, vals), 600)
    }, 800)
  }, []) // eslint-disable-line

  // Toute la logique de résolution utilise gsRef.current — jamais de closure React
  async function runResolution(ordre, idx, vals) {
    if (idx >= ordre.length) {
      finalize(vals)
      return
    }
    setPhase('resolving')
    const { v, i } = ordre[idx]
    setActiveIdx(i)
    await pause(400)

    // Résoudre avec l'état courant dans le ref
    const gs = gsRef.current
    // console.log(`[EMPIRE] résolution`, JSON.stringify(Object.fromEntries(Object.entries(gs.empires||{}).map(([k,e])=>[k,e.power]))))
    const res = resoudreDe(v, gs)
    // console.log résultat

    // Mettre à jour le ref immédiatement
    gsRef.current = res.newGame

    // Animation
    if (res.targetCase) {
      onHighlightCase?.(res.targetCase, res.action)
      await pause(1000)
      if (res.action !== 'attaque' || !res.isPlayerCase) onHighlightCase?.(null)
    }

    // Combat joueur — vérifier d'abord l'éclipse puis le tribut
    if (res.action === 'attaque' && res.isPlayerCase) {
      // Éclipse : annuler toutes les attaques ce tour
      if (gsRef.current.activeEffects?.eclipseActive) {
        addLog({ ...res, action:'eclipse', extraDesc:'Éclipse — attaque annulée' }, i)
        await runResolution(ordre, idx+1, vals)
        return
      }
      const tributActifs = gsRef.current.activeEffects?.tributActifs || {}
      const empIdKey = String(res.empireId)
      console.log('[EMPIRE] Vérif tribut - empireId:', res.empireId, 'tributActifs:', JSON.stringify(tributActifs))
      if (tributActifs[empIdKey] || tributActifs[Number(res.empireId)]) {
        // Tribut actif — annuler l'attaque, afficher popup informatif
        const newTribut = { ...tributActifs }
        delete newTribut[empIdKey]
        delete newTribut[Number(res.empireId)]
        gsRef.current = { ...gsRef.current, activeEffects: { ...gsRef.current.activeEffects, tributActifs: newTribut } }
        setPendingCombat({ res, ordre, nextIdx: idx+1, tributMode: true })
        setPhase('waitingCombat')
        return
      }
      setPendingCombat({ res, ordre, nextIdx: idx+1 })
      setPhase('waitingCombat')
      return
    }

    // Combat empire vs empire
    if (res.action === 'attaque' && !res.isPlayerCase) {
      const defId = parseInt(res.defenderOwner)
      const tile  = gsRef.current.map[res.targetCase.row]?.[res.targetCase.col]
      const combatRes = resoudreCombatEmpireVsEmpire(res.empireId, defId, tile, gsRef.current)
      gsRef.current = combatRes.newGame
      addLog({ ...res, extraDesc: combatRes.description }, i)
      onHighlightCase?.(null)
      await pause(600)
      await runResolution(ordre, idx+1, vals)
      return
    }

    // Événement interactif (choixJoueur)
    if (res.type === 'evenement' && res.needsPlayerChoice) {
      addLog(res, i)
      setPendingEvent({ res, ordre, nextIdx: idx+1 })
      setPhase('waitingEvent')
      return
    }

    // Événement nextTurn → appliquer et afficher popup informatif
    if (res.type === 'evenement' && res.isNextTurn) {
      const gBefore2 = gsRef.current
      gsRef.current = applyImmediate(res.evenement, gsRef.current)
      gsRef.current = { ...gsRef.current, lastEvenementTitre: res.evenement?.titre || '' }
      updateGame(() => ({ ...gsRef.current }))
      addLog(res, i)
      const effetCalc2 = calcEffetTexte(res.evenement, gBefore2, gsRef.current) || res.evenement?.effetTexte || res.evenement?.texte
      setPendingEvent({ res, ordre, nextIdx: idx+1, infoOnly: true, effetCalcule: effetCalc2 })
      setPhase('waitingEvent')
      return
    }

    // Grand Raid : déclencher D40 supplémentaires si flag actif
    if (gsRef.current.nextTurnEffects?.grandRaidD40 > 0) {
      const nb = gsRef.current.nextTurnEffects.grandRaidD40
      gsRef.current = { ...gsRef.current, nextTurnEffects: { ...gsRef.current.nextTurnEffects, grandRaidD40: 0 } }
      for (let k=0; k<nb; k++) {
        const d40val = Math.floor(Math.random()*40)+1
        const d40res = resoudreD40Action(gsRef.current, d40val)
        gsRef.current = d40res.newGame
        addLog({ ...d40res, type:'d40', d40Display: d40val }, i)
        if (d40res.action === 'attaque' && d40res.isPlayerCase) {
          setPendingCombat({ res: d40res, ordre, nextIdx: idx+1 })
          setPhase('waitingCombat')
          return
        }
        await pause(600)
      }
    }

    // Effets immédiats événement
    if (res.type === 'evenement') {
      const gBefore = gsRef.current
      gsRef.current = applyImmediate(res.evenement, gsRef.current)
      // Surveillance des frontières : déclencher combat si flag présent
      if (gsRef.current._surveillanceCombat) {
        const { empireId, targetCase } = gsRef.current._surveillanceCombat
        const { _surveillanceCombat, ...cleanG } = gsRef.current
        gsRef.current = cleanG
        const combatRes = resoudreCombatEmpireVsJoueur(gsRef.current, empireId, targetCase)
        gsRef.current = { ...gsRef.current, lastEvenementTitre: res.evenement?.titre || '' }
        updateGame(() => ({ ...gsRef.current }))
        const effetCalcSurv = calcEffetTexte(res.evenement, gBefore, gsRef.current)
        addLog(res, i)
        setPendingEvent({ res, ordre, nextIdx: idx+1, infoOnly: true, effetCalcule: effetCalcSurv })
        setPendingCombat({ res: { ...combatRes, empireId, targetCase }, ordre, nextIdx: idx+1 })
        setPhase('waitingCombat')
        return
      }
      gsRef.current = { ...gsRef.current, lastEvenementTitre: res.evenement?.titre || '' }
      updateGame(() => ({ ...gsRef.current }))
      // Calculer le texte d'effet concret (diff avant/après)
      const effetCalcule = calcEffetTexte(res.evenement, gBefore, gsRef.current)
      addLog(res, i)
      // Ouvrir popup informatif pour TOUS les événements immediats
      setPendingEvent({ res, ordre, nextIdx: idx+1, infoOnly: true, effetCalcule })
      setPhase('waitingEvent')
      return
    }

    // Mettre à jour la carte immédiatement pour colonisation seulement (pas attaque — owner reste stable)
    if (res.type === 'd40' && res.action === 'colonisation') {
      updateGame(() => ({ ...gsRef.current }))
    }

    // Pour d40, ajouter le d40 dans le log
    const resWithD40 = res.type==='d40' ? { ...res, d40Display: res.d40 } : res
    addLog(resWithD40, i)
    onHighlightCase?.(null)

    if (res.defaite) {
      updateGame(() => gsRef.current)
      setPhase('defaite')
      return
    }

    await pause(500)
    await runResolution(ordre, idx+1, vals)
  }

  function addLog(res, dieOrigIdx = null) {
    const entry = {
      type: res.type,
      action: res.action,
      empireId: res.empireId,
      evenementTitre: res.evenement?.titre,
      extraDesc: res.extraDesc,
      dieOrigIdx,
    }
    resultatsRef.current = [...resultatsRef.current, entry]
    setResultats(resultatsRef.current)
  }


  // ── Calcule un texte d'effet concret à partir de l'état avant/après ──────
  function calcEffetTexte(evt, gBefore, gAfter) {
    const cfg = id => EMPIRE_CONFIG[id] || { name: `Empire ${id}`, emoji: '' }
    const lines = []

    // Empires : power/maxPower changed
    for (let id = 1; id <= 4; id++) {
      const b = gBefore.empires?.[id], a = gAfter.empires?.[id]
      if (!b || !a) continue
      const parts = []
      if (a.maxPower !== b.maxPower) parts.push(`+${a.maxPower - b.maxPower} Puissance max`)
      if (a.power !== b.power) {
        const diff = a.power - b.power
        parts.push(`${diff > 0 ? '+' : ''}${diff} Puissance`)
      }
      if (parts.length) lines.push(`${cfg(id).emoji} ${cfg(id).name} : ${parts.join(', ')}`)
    }

    // Carte : nouvelles cases colonisées + bâtiments détruits
    const newCases = []
    gAfter.map?.forEach(row => row.forEach(t => {
      const tb = gBefore.map?.[t.row]?.[t.col]
      if (t.owner && t.owner !== 'player' && tb?.owner !== t.owner) {
        const empId = parseInt(t.owner)
        newCases.push(`${cfg(empId).emoji} ${cfg(empId).name} colonise (${t.col+1},${t.row+1})`)
      }
      // Cases perdues
      if (!t.owner && tb?.owner && tb.owner !== 'player') {
        const empId = parseInt(tb.owner)
        newCases.push(`${cfg(empId).emoji} ${cfg(empId).name} perd (${t.col+1},${t.row+1})`)
      }
      // Bâtiments détruits sur cases joueur
      if (t.owner === 'player' && tb?.owner === 'player') {
        const batBefore = tb.buildings || []
        const batAfter  = t.buildings  || []
        if (batBefore.length > batAfter.length) {
          const detruits = [...batBefore]
          batAfter.forEach(b => { const i = detruits.indexOf(b); if (i>=0) detruits.splice(i,1) })
          detruits.forEach(b => newCases.push(`Bâtiment détruit : ${b} (${t.col+1},${t.row+1})`))
        }
      }
    }))
    lines.push(...newCases)

    // Resources joueur
    for (const [k, v] of Object.entries(gAfter.resources || {})) {
      const diff = v - (gBefore.resources?.[k] || 0)
      if (diff !== 0) {
        const labels = { nourriture: 'Nourriture', bois: 'Bois', argile: 'Argile', fer: 'Fer', or: 'Or' }
        lines.push(`${diff > 0 ? '+' : ''}${diff} ${labels[k] || k}`)
      }
    }

    // Population joueur
    for (const [k, v] of Object.entries(gAfter.population || {})) {
      const diff = v - (gBefore.population?.[k] || 0)
      if (diff !== 0) {
        const labels = { fermier: 'Fermier', ouvrier: 'Ouvrier', artisan: 'Artisan', guerrier: 'Guerrier', marin: 'Marin', noble: 'Noble', pretre: 'Prêtre' }
        lines.push(`${diff > 0 ? '+' : ''}${diff} ${labels[k] || k}`)
      }
    }

    // nextTurnEffects
    const nteA = gAfter.nextTurnEffects || {}, nteB = gBefore.nextTurnEffects || {}
    if (nteA.bonus3Des && !nteB.bonus3Des) lines.push('Prochain tour : 3 dés d\'action')
    if (nteA.etudierGratuit && !nteB.etudierGratuit) lines.push('Prochain tour : action Étudier gratuite')

    // activeEffects
    if (gAfter.activeEffects?.pressionImperialeActive && !gBefore.activeEffects?.pressionImperialeActive)
      lines.push('Pression impériale activée')
    if (gAfter.activeEffects?.eclipseActive && !gBefore.activeEffects?.eclipseActive)
      lines.push('Éclipse : attaques annulées ce tour')

    return lines.join('\n') || (evt?.effetTexte || evt?.texte || 'Effet appliqué')
  }

  function applyImmediate(evt, g) {
    const e = evt?.effet
    if (!e) return g

    // ── Bonus joueur ──────────────────────────────────────────────────
    if (e.type==='bonus3Des') return {...g,nextTurnEffects:{...(g.nextTurnEffects||{}),bonus3Des:true}}
    if (e.type==='etudierGratuit') return {...g,nextTurnEffects:{...(g.nextTurnEffects||{}),etudierGratuit:true}}

    if (e.type==='gainPop') {
      const np={...g.population}
      for(const[t,n]of Object.entries(e.gains||{})) np[t]=(np[t]||0)+n
      return {...g,population:np}
    }

    if (e.type==='gainParBatiment') {
      // +N ressource par bâtiment de type e.batiment sur les cases joueur
      const count = g.map.flat().filter(t=>t.owner==='player').reduce((s,t)=>s+(t.buildings?.filter(b=>b===e.batiment).length||0),0)
      const gain = count * (e.nb||1)
      const newRes = {...g.resources, [e.ressource]: Math.min((g.resources?.[e.ressource]||0)+gain, g.storageMax||10)}
      return {...g,resources:newRes}
    }

    if (e.type==='conseilDesSages') {
      if ((g.population?.noble||0)>=5||(g.population?.pretre||0)>=5) {
        return {...g,nextTurnEffects:{...(g.nextTurnEffects||{}),bonus3Des:true}}
      } else {
        const np={...g.population,noble:(g.population?.noble||0)+1,pretre:(g.population?.pretre||0)+1}
        return {...g,population:np}
      }
    }

    // ── Empire ────────────────────────────────────────────────────────
    if (e.type==='expansionImperiale') return appliquerExpansionImperiale(g)

    if (e.type==='monteeEnPuissance') {
      const d1=Math.floor(Math.random()*4)+1, d2=Math.floor(Math.random()*4)+1
      let ne={...g.empires}
      for(const id of [d1,d2]) {
        const emp=ne[id]||{power:2,maxPower:8}
        ne[id]={...emp,power:Math.min(emp.maxPower+2,emp.power+2),maxPower:emp.maxPower+2}
      }
      return {...g,empires:ne}
    }

    if (e.type==='hegemonieEmpire') {
      // Empire le plus puissant colonise les N cases libres les plus proches de son bord
      const nb = e.nb||2
      const empiresSorted = Object.entries(g.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
      if (!empiresSorted.length) return g
      const [empId] = empiresSorted[0]
      return coloniserCasesProches(g, parseInt(empId), nb)
    }

    if (e.type==='allianceImperiale') {
      const sorted = Object.entries(g.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
      let ne={...g.empires}
      sorted.slice(0,2).forEach(([id])=>{
        const emp=ne[id]||{power:0,maxPower:8}
        ne[id]={...emp,power:Math.min(emp.maxPower,emp.power+2)}
      })
      return {...g,empires:ne}
    }

    if (e.type==='surveillanceFrontieres') {
      // Empire avec le plus de cases
      const empCases = [1,2,3,4].map(id=>({
        id, count:g.map.flat().filter(t=>t.owner===String(id)).length
      })).sort((a,b)=>(b.count-a.count)||Math.random()-0.5)
      if (!empCases.length||empCases[0].count===0) return g
      const empId = empCases[0].id

      const playerTiles = g.map.flat().filter(t=>t.owner==='player')
      if (!playerTiles.length) return coloniserCasesProches(g, empId, 1)

      const getVoisines = (t,map)=>[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>map[t.row+dr]?.[t.col+dc]).filter(Boolean)
      // Zone de contact : cases joueur adjacentes à au moins une case de l'empire
      const empireTiles = g.map.flat().filter(t=>t.owner===String(empId))
      const contact = playerTiles.filter(t =>
        getVoisines(t,g.map).some(v=>v.owner===String(empId))
      )
      if (!contact.length) {
        // Pas de zone de contact → coloniser case libre
        return coloniserCasesProches(g, empId, 1)
      }
      // Case joueur en contact avec le moins de voisines joueur (= la plus exposée)
      const targeted = contact
        .map(t=>({t, voisinesJoueur:getVoisines(t,g.map).filter(v=>v.owner==='player').length}))
        .sort((a,b)=>a.voisinesJoueur-b.voisinesJoueur)[0]?.t
      if (!targeted) return coloniserCasesProches(g, empId, 1)
      // Stocker la cible pour déclencher le combat dans runResolution
      return {...g, _surveillanceCombat: { empireId: empId, targetCase: {row:targeted.row, col:targeted.col} }}
    }

    if (e.type==='premierssoubresauts') {
      let g2={...g,empires:{...g.empires}}
      for(let id=1;id<=4;id++){const emp=g2.empires[id]||{power:0,maxPower:8};g2.empires[id]={...emp,maxPower:emp.maxPower+2}}
      // Empire le plus puissant colonise 1 case
      const topEmp = Object.entries(g2.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)[0]
      if(topEmp) g2=coloniserCasesProches(g2,parseInt(topEmp[0]),1)
      return g2
    }

    if (e.type==='grandRaid') {
      // +2 maxPower à tous; les 2 D40 sont déclenchés dans runResolution via flag
      let g2={...g,empires:{...g.empires}}
      for(let id=1;id<=4;id++){const emp=g2.empires[id]||{power:0,maxPower:8};g2.empires[id]={...emp,maxPower:emp.maxPower+2}}
      g2={...g2,nextTurnEffects:{...(g2.nextTurnEffects||{}),grandRaidD40:2}}
      return g2
    }

    if (e.type==='eveilDesTitans') {
      let g2={...g,empires:{...g.empires}}
      for(let id=1;id<=4;id++){const emp=g2.empires[id]||{power:0,maxPower:8};g2.empires[id]={...emp,maxPower:emp.maxPower+2,power:Math.min(emp.maxPower+2,emp.power+1)}}
      const weakEmp=Object.entries(g2.empires).sort(([,a],[,b])=>a.power-b.power || Math.random()-0.5)[0]
      if(weakEmp) g2=coloniserCasesProches(g2,parseInt(weakEmp[0]),2)
      return g2
    }

    if (e.type==='tempeteDeFer') {
      let g2={...g,empires:{...g.empires}}
      for(let id=1;id<=4;id++){const emp=g2.empires[id]||{power:0,maxPower:8};g2.empires[id]={...emp,maxPower:emp.maxPower+2}}
      const sorted=Object.entries(g2.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
      // Top 2 colonisent 2 cases chacun
      for(const [id] of sorted.slice(0,2)) g2=coloniserCasesProches(g2,parseInt(id),2)
      // Plus faible +3 power
      const weakId=parseInt(sorted[sorted.length-1][0])
      const we=g2.empires[weakId]
      g2.empires[weakId]={...we,power:Math.min(we.maxPower,we.power+3)}
      return g2
    }

    if (e.type==='migrationsImperiales') {
      const sorted=Object.entries(g.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
      let g2=g
      for(const [id] of sorted.slice(0,2)) g2=coloniserCasesProches(g2,parseInt(id),1)
      const np={...g2.population,fermier:(g2.population?.fermier||0)+1,ouvrier:(g2.population?.ouvrier||0)+1}
      return {...g2,population:np}
    }

    if (e.type==='retournementDeFortune') {
      const sorted=Object.entries(g.empires).sort(([,a],[,b])=>b.power-a.power || Math.random()-0.5)
      if(!sorted.length) return g
      const [topId,topEmp]=sorted[0]
      const ne={...g.empires,[topId]:{...topEmp,power:Math.floor(topEmp.power/2)}}
      return {...g,empires:ne}
    }

    if (e.type==='eruptionVolcanique') {
      let g2={...g,map:g.map.map(r=>r.map(t=>({...t})))}
      const adj=(t,map)=>[[-1,0],[1,0],[0,-1],[0,1]].map(([dr,dc])=>map[t.row+dr]?.[t.col+dc]).filter(Boolean)
      g2.map.flat().filter(t=>t.owner==='player').forEach(t=>{
        const eligible=t.hasVolcan||adj(t,g2.map).some(v=>v.hasVolcan)
        if(!eligible) return
        // -1 bâtiment aléatoire
        if(t.buildings?.length>0) {
          const idx=Math.floor(Math.random()*t.buildings.length)
          g2.map[t.row][t.col]={...g2.map[t.row][t.col],buildings:t.buildings.filter((_,i)=>i!==idx)}
        }
        // -1 population aléatoire
        const popTypes=Object.entries(g2.population||{}).filter(([,v])=>v>0)
        if(popTypes.length>0){
          const [pt]=popTypes[Math.floor(Math.random()*popTypes.length)]
          g2={...g2,population:{...g2.population,[pt]:Math.max(0,(g2.population[pt]||0)-1)}}
        }
      })
      return g2
    }

    if (e.type==='eclipse') {
      return {...g,activeEffects:{...g.activeEffects,eclipseActive:true}}
    }

    // ── Pression impériale ────────────────────────────────────────────
    if (e.type==='pressionImperiale') {
      let g2={...g,empires:{...g.empires}}
      for(let id=1;id<=4;id++){const emp=g2.empires[id]||{power:0,maxPower:8};g2.empires[id]={...emp,maxPower:emp.maxPower+2}}
      return {...g2,activeEffects:{...g2.activeEffects,pressionImperialeActive:true}}
    }

    return g
  }

  // Helper : coloniser N cases libres les plus proches du bord d'un empire
  function coloniserCasesProches(g, empireId, nb) {
    const cfg = EMPIRE_CONFIG[empireId] || {}
    // Bord de départ selon l'empire (1=haut, 2=droite, 3=bas, 4=gauche)
    const bordsRow = {1:0, 3:4}
    const bordsCol = {2:4, 4:0}
    const toutes = g.map.flat().filter(t=>t.owner===null||t.owner===undefined)
    if(!toutes.length) return g

    const dist = (t) => {
      if(bordsRow[empireId]!==undefined) return Math.abs(t.row-bordsRow[empireId])
      if(bordsCol[empireId]!==undefined) return Math.abs(t.col-bordsCol[empireId])
      return t.row+t.col
    }
    const sorted = [...toutes].sort((a,b)=>dist(a)-dist(b))
    const cibles = sorted.slice(0,nb)

    let newMap = g.map.map(r=>r.map(t=>({...t})))
    cibles.forEach(t=>{
      newMap[t.row][t.col]={...newMap[t.row][t.col],owner:String(empireId),explored:true}
    })
    return {...g,map:newMap}
  }

  function handleCombatConfirm(combatResult) {
    if (combatResult === null) {
      // Tribut — pas de combat
      updateGame(() => ({ ...gsRef.current }))
      const { ordre, nextIdx } = pendingCombat
      setPendingCombat(null)
      setPhase('resolving')
      runResolution(ordre, nextIdx, valsRef.current)
      return
    }
    // Préserver les tributActifs de gsRef (pas ceux de la snapshot du CombatPopup)
    combatResult.newGame = {
      ...combatResult.newGame,
      activeEffects: {
        ...combatResult.newGame.activeEffects,
        tributActifs: gsRef.current.activeEffects?.tributActifs || {}
      }
    }
    gsRef.current = combatResult.newGame
    onHighlightCase?.(null)
    const { ordre, nextIdx } = pendingCombat
    const empId = pendingCombat.res.empireId
    const cfg = EMPIRE_CONFIG[empId]
    const outcome = combatResult.empireGagne ? '✗ Défaite' : '✓ Victoire'
    const tc = pendingCombat.res.targetCase
    addEntry(`⚔️ Défense ${outcome} — ${cfg?.emoji||''} ${cfg?.name} attaque (${tc?.col+1},${tc?.row+1}) | Dés: ${combatResult.de1} vs ${combatResult.de2} | Pertes joueur: ${combatResult.pertesJoueur} guerrier(s) | Pertes empire: -${combatResult.pertesEmpire} Puissance`, gsRef.current.turn)
    setPendingCombat(null)
    setPhase('resolving')
    addLog({ type:'combat', action: combatResult.empireGagne?'attaque':'defense', empireId: empId }, pendingCombat?.res.dieOrigIdx)
    runResolution(ordre, nextIdx, valsRef.current)
  }

  function handleEventConfirm(newGame, choiceLabel) {
    // Cas spécial : découverte → déclencher surlignage de cases non explorées
    if (newGame._decouvertePendingCase) {
      const { _decouvertePendingCase, _decouverteCandidats, ...cleanGame } = newGame
      const candidats = _decouverteCandidats || []
      onRequestCaseSelect?.(candidats, (tile) => {
        let nm = cleanGame.map.map(r => r.map(t => ({...t})))
        // Générer le terrain et les ressources comme l'action Explorer normale
        const t = nm[tile.row][tile.col]
        const terrainDie = Math.floor(Math.random()*6)+1
        const rd = [Math.floor(Math.random()*6)+1, Math.floor(Math.random()*6)+1]
        const generated = genererCase(terrainDie, rd, t.hasFleuve, t.isLac, null)
        nm[tile.row][tile.col] = {
          ...t, explored: true,
          terrain: generated.terrain,
          resource1: generated.resource1,
          resource2: generated.resource2,
        }
        const ng = { ...cleanGame, map: nm }
        gsRef.current = { ...ng, lastEvenementTitre: pendingEvent?.res?.evenement?.titre || '' }
        updateGame(() => ({ ...gsRef.current }))
        onHighlightCase?.(null)
        const terrain = generated.terrain || '?'
        const res = [generated.resource1, generated.resource2].filter(Boolean).map(r=>r.type).join(', ')
        setPendingEvent(prev => ({
          ...prev,
          infoOnly: true,
          effetCalcule: `Case (${tile.col+1},${tile.row+1}) explorée → ${terrain}${res?' + '+res:''}`,
        }))
        setPendingCaseSelect(null)
        setPhase('waitingEvent')
      })
      setPendingEvent(prev => ({ ...prev, _awaitingCase: true }))
      setPhase('awaitingCase')
      return
    }

    // Cas spécial : soumission des tribus → déclencher surlignage de case
    if (newGame._soumissionPendingCase) {
      const { _soumissionPendingCase, ...cleanGame } = newGame
      const explorées = cleanGame.map?.flat().filter(t=>t.explored&&(t.owner===null||t.owner===undefined))||[]
      // Surligner les cases éligibles
      onHighlightCase?.(null)
      // Demander sélection de case via GameScreen
      const explorées2 = cleanGame.map?.flat().filter(t=>t.explored&&(t.owner===null||t.owner===undefined))||[]
      onRequestCaseSelect?.(explorées2, (tile) => {
          let nm = cleanGame.map.map(r=>r.map(t=>({...t})))
          nm[tile.row][tile.col] = {...nm[tile.row][tile.col], owner:'player', buildings:[...(nm[tile.row][tile.col].buildings||[]),'cabane']}
          const np = {...cleanGame.population, guerrier:Math.max(0,(cleanGame.population.guerrier||0)-2), fermier:(cleanGame.population.fermier||0)+2}
          const ng = {...cleanGame, map:nm, population:np}
          gsRef.current = {...ng, lastEvenementTitre: pendingEvent?.res?.evenement?.titre||''}
          updateGame(() => ({...gsRef.current}))
          onHighlightCase?.(null)
          // Rouvrir popup avec résultat
          setPendingEvent(prev => ({
            ...prev,
            infoOnly: true,
            effetCalcule: `-2 Guerriers
Case (${tile.col+1},${tile.row+1}) colonisée avec 1 Cabane
+2 Fermiers`,
          }))
          setPendingCaseSelect(null)
          setPhase('waitingEvent')
      })
      setPendingEvent(prev => ({...prev, _awaitingCase: true}))
      setPhase('awaitingCase')
      return
    }

    // Stocker le dernier événement passé + mettre à jour le store
    const lastTitre = pendingEvent?.res?.evenement?.titre || ''
    gsRef.current = { ...newGame, lastEvenementTitre: lastTitre }
    updateGame(() => ({ ...gsRef.current }))
    const { ordre, nextIdx } = pendingEvent
    setPendingEvent(null)
    setPendingCaseSelect(null)
    setPhase('resolving')
    runResolution(ordre, nextIdx, valsRef.current)
  }

  function finalize(vals=[]) {
    setPhase('done')
    setActiveIdx(-1)
    onHighlightCase?.(null)
    // Réinitialiser eclipseActive à la fin du tour des empires
    if (gsRef.current.activeEffects?.eclipseActive) {
      gsRef.current = { ...gsRef.current, activeEffects: { ...gsRef.current.activeEffects, eclipseActive: false } }
    }
    const final = appliquerEffetsNextTurn(gsRef.current)
    updateGame(() => final)
    // Journal détaillé du tour des empires
    const lines = resultatsRef.current.map(r => {
      const cfg = r.empireId ? (EMPIRE_CONFIG[r.empireId] || {}) : {}
      if (r.type === 'puissance') return `${cfg.emoji||''} ${cfg.name||''} : +2 Puissance`
      if (r.type === 'evenement') return `📋 Événement : ${r.evenementTitre || ''}`
      if (r.action === 'colonisation') return `${cfg.emoji||''} ${cfg.name||''} — Colonisation`
      if (r.action === 'attaque' || r.action === 'attaque_gagnee') return `${cfg.emoji||''} ${cfg.name||''} — Attaque${r.extraDesc ? ' → ' + r.extraDesc : ''}`
      if (r.action === 'defense') return `🛡️ Défense réussie`
      if (r.action === 'impossible') return `${cfg.emoji||''} ${cfg.name||''} — Ligne complète`
      return `${cfg.emoji||''} ${cfg.name||''} — D40`
    })
    addEntry(`Tour des empires [${(vals||desValues).filter(Boolean).join(', ')}] : ${lines.join(' | ')}`, gsRef.current.turn)
  }

  const empireColors = {1:'#e1071a',2:'#0891b2',3:'#166534',4:'#ca8a04'}

  return (
    <>
      <div style={{ background:'white', padding:'10px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12,fontWeight:500,color:'#1e293b' }}>
            {phase==='rolling'?'🎲 Tour des empires — lancer…'
             :phase==='proselytisme'?'🙏 Prosélytisme — les Empires passent leur tour'
             :phase==='done'?'✓ Tour des empires terminé'
             :phase==='defaite'?'💀 Défaite !'
             :phase==='waitingCombat'?'⚔️ Vous êtes attaqué !'
             :phase==='waitingEvent'?'📋 Événement'
             :'⚙️ Résolution…'}
          </span>
          {(phase==='done' || phase==='proselytisme') && (
            <button onClick={phase==='done'?onClose:undefined}
              disabled={phase==='proselytisme'}
              style={{ padding:'5px 14px',borderRadius:7,border:'none',
                background:phase==='done'?'#1e3a5f':'#94a3b8',
                color:'white',fontSize:11,fontWeight:500,
                cursor:phase==='done'?'pointer':'default' }}>
              Mon tour →
            </button>
          )}
        </div>

        {/* Dés */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {desValues.map((v,i) => (
            <div key={i} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
              <EmpireDie value={v} rolling={rolling} active={activeIdx===i} />
              {v&&!rolling&&(
                <div style={{ fontSize:9,color:v<=4?empireColors[v]:v===5?'#7c3aed':'#dc2626',textAlign:'center',maxWidth:50,lineHeight:1.2 }}>
                  {v<=4?EMPIRE_CONFIG[v]?.name:v===5?'Événement':'D40 !'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Résultats — reconstruits depuis données brutes, jamais depuis closures */}
        {resultats.length > 0 && (
          <div style={{ display:'flex',flexDirection:'column',gap:4,maxHeight:130,overflowY:'auto' }}>
            {resultats.map((r,idx) => {
              let desc, bg='#f8fafc', color='#475569', border='#e2e8f0'
              if (r.type==='puissance') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} : +2 Puissance`
                bg='#f0f4ff'; color='#3730a3'; border='#c7d2fe'
              } else if (r.type==='evenement') {
                desc = `📋 Événement : ${r.evenementTitre || ''}`
                bg='#fffbeb'; color='#92400e'; border='#fcd34d'
              } else if (r.action==='colonisation') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Colonisation`
                bg='#f0fdf4'; color='#166534'; border='#86efac'
              } else if (r.action==='attaque'||r.action==='attaque_gagnee') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Attaque${r.extraDesc?' → '+r.extraDesc:''}`
                bg='#fef2f2'; color='#dc2626'; border='#fca5a5'
              } else if (r.action==='defense') {
                desc = `🛡️ Vous avez défendu`
                bg='#f0fdf4'; color='#166534'; border='#86efac'
              } else if (r.action==='impossible') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Ligne/colonne déjà entièrement contrôlée`
                bg='#f8fafc'; color='#94a3b8'; border='#e2e8f0'
              } else if (r.action==='pasAttaque') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — Puissance 0, attaque annulée`
                bg='#f8fafc'; color='#94a3b8'; border='#e2e8f0'
              } else if (r.type==='d40') {
                const cfg = EMPIRE_CONFIG[r.empireId]
                desc = `${cfg?.emoji} ${cfg?.name} — D40 lancé`
                bg='#f8fafc'; color='#64748b'; border='#e2e8f0'
              } else {
                desc = r.extraDesc || `Dé résolu`
              }
              return (
                <div key={idx} style={{ fontSize:11,padding:'4px 8px',borderRadius:6,background:bg,color,border:`0.5px solid ${border}` }}>
                  {desc}
                </div>
              )
            })}
          </div>
        )}

        {/* Événement — géré en overlay fixed ci-dessous */}
      </div>

      {/* ── Événement overlay — centré sur tout l'écran ─────────────────── */}
      {phase==='waitingEvent' && pendingEvent && (
        <EventOverlay
          evenement={pendingEvent.res.evenement}
          game={gsRef.current}
          onConfirm={handleEventConfirm}
          infoOnly={pendingEvent.infoOnly||false}
          caseIdx={(gsRef.current?.eventIndex ?? 0)}
          effetCalcule={pendingEvent.effetCalcule||null}
        />
      )}

      {/* Combat popup */}
      {phase==='waitingCombat' && pendingCombat && (
        <CombatPopup
          empireId={pendingCombat.res.empireId}
          targetCase={pendingCombat.res.targetCase}
          tributMode={pendingCombat.tributMode || false}
          game={gsRef.current}
          onConfirm={handleCombatConfirm}
        />
      )}
    </>
  )
}

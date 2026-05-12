import { useState } from 'react'
import { useGameStore } from '../../store/gameStore.js'
import { useLogStore } from '../../store/logStore.js'
import { ACTIONS_SPECIALES, peutUtiliserAction } from '../../engine/actionsSpeciales.js'
import { calcPopMax } from '../../engine/population.js'

const POP_TYPES = ['fermier','ouvrier','artisan','guerrier','pretre','noble']
const POP_LABELS = { fermier:'Fermier', ouvrier:'Ouvrier', artisan:'Artisan', guerrier:'Guerrier', pretre:'Prêtre', noble:'Noble' }
const POP_EMOJI  = { fermier:'🧑‍🌾', ouvrier:'👷', artisan:'🛠️', guerrier:'⚔️', pretre:'⛪', noble:'👑' }
const RES_LABELS = { nourriture:'Nourriture', bois:'Bois', argile:'Argile', fer:'Fer', or:'Or' }

// ── Sous-panneaux par action ───────────────────────────────────

function PanelGrandir({ game, onConfirm, onClose }) {
  const [chosen, setChosen] = useState(null)
  const popMax = calcPopMax(game.map)
  const popTotal = Object.values(game.population).reduce((a,b)=>a+b,0)
  const atCap = popTotal >= popMax

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>
        Coût : 3 Nourriture. {atCap && <span style={{ color:'#f59e0b', fontWeight:500 }}> Population au maximum — ce membre coûtera 1 Nourr./tour.</span>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
        {POP_TYPES.map(type => (
          <button key={type} onClick={() => setChosen(chosen===type?null:type)} style={{
            display:'flex', alignItems:'center', gap:8, padding:'7px 9px', borderRadius:8,
            border: chosen===type?'2px solid #be185d':'1.5px solid #e2e8f0',
            background: chosen===type?'#fdf2f8':'white', cursor:'pointer', textAlign:'left',
          }}>
            <span style={{ fontSize:16 }}>{POP_EMOJI[type]}</span>
            <span style={{ fontSize:12, fontWeight:500, color:chosen===type?'#be185d':'#374151' }}>
              {POP_LABELS[type]} <span style={{ fontWeight:400, color:'#94a3b8' }}>({game.population[type]||0})</span>
            </span>
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
        <button onClick={() => chosen && onConfirm('grandir', { popType: chosen })} disabled={!chosen} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:chosen?'#be185d':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:chosen?'pointer':'default' }}>
          Confirmer
        </button>
      </div>
    </div>
  )
}

function PanelRecruter({ game, onConfirm, onClose }) {
  const [chosen, setChosen] = useState(null)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569' }}>Coût : 3 Or. Choisissez le type à recruter :</div>
      <div style={{ display:'flex', gap:8 }}>
        {['guerrier','artisan'].map(type => (
          <button key={type} onClick={() => setChosen(type)} style={{
            flex:1, padding:'10px 0', borderRadius:8, textAlign:'center',
            border: chosen===type?'2px solid #dc2626':'1.5px solid #e2e8f0',
            background: chosen===type?'#fef2f2':'white', cursor:'pointer',
            color: chosen===type?'#dc2626':'#374151', fontSize:13, fontWeight: chosen===type?500:400,
          }}>
            {POP_EMOJI[type]} {POP_LABELS[type]}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
        <button onClick={() => chosen && onConfirm('recruter', { popType: chosen })} disabled={!chosen} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:chosen?'#dc2626':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:chosen?'pointer':'default' }}>
          Recruter
        </button>
      </div>
    </div>
  )
}

function PanelCommerce({ game, usedThisTurn, onConfirm, onClose }) {
  const [mode, setMode] = useState('acheter')
  const [resAcheter, setResAcheter] = useState(null)
  const [res1Vendre, setRes1Vendre] = useState(null)
  const [res2Vendre, setRes2Vendre] = useState(null)

  const nbMarchés   = game.map.flat().filter(t => t.owner==='player' && t.buildings?.includes('marche')).length
  const nbArtisans  = game.population.artisan || 0
  const utilisations = usedThisTurn.commerce || 0
  const restantes   = nbArtisans - utilisations

  // Marché : améliore les achats uniquement (1Or→2res au lieu de 1Or→1res)
  // Quota Marché = 1×/Marché/tour, indépendant du quota Artisan
  // achatsEffectues = nb d'achats déjà faits ce tour (on ne peut pas le savoir sans tracking séparé)
  // Simplification : on compte les utilisations Marché depuis les turnLimits
  const marchesUtilises = usedThisTurn.commerceMarche || 0
  const cetteFoisMarche = marchesUtilises < nbMarchés
  const qtéAchat = cetteFoisMarche ? 2 : 1

  const totalStocké = Object.values(game.resources).reduce((a,b)=>a+b,0)
  const storageMax  = game.storageMax || 8
  const placeRestante = storageMax - totalStocké
  // Net après échange : on perd 1 Or (-1) et on gagne qté ressources (+qté) → net = qté - 1
  const netAchat = qtéAchat - 1  // 1Or→1res : net=0, 1Or→2res : net=1
  const peutAcheter = resAcheter && (game.resources.or||0)>=1 && placeRestante >= netAchat
  const erreurStockage = resAcheter && (game.resources.or||0)>=1 && placeRestante < netAchat

  const RESOURCES = ['nourriture','bois','argile','fer','or']

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>
        {restantes} utilisation{restantes>1?'s':''} restante{restantes>1?'s':''} ce tour.
        {nbMarchés > 0 && marchesUtilises < nbMarchés && (
          <span style={{ color:'#16a34a' }}> Marché : {nbMarchés - marchesUtilises} achat{nbMarchés-marchesUtilises>1?'s':''} 1Or→2res restant{nbMarchés-marchesUtilises>1?'s':''}.</span>
        )}
      </div>
      <div style={{ display:'flex', gap:6 }}>
        {['acheter','vendre'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex:1, padding:'7px 0', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer',
            border: mode===m?'2px solid #d97706':'1px solid #e2e8f0',
            background: mode===m?'#fffbeb':'white', color: mode===m?'#92400e':'#64748b',
          }}>{m==='acheter'?'🪙 Or → Ressource':'📦 Ressources → Or'}</button>
        ))}
      </div>

      {mode==='acheter' && (
        <>
          <div style={{ fontSize:11, color:'#64748b' }}>
            1 Or → <strong>{qtéAchat}</strong> ressource{qtéAchat>1?'s':''} de votre choix
            {placeRestante < 5 && <span style={{ color:'#f59e0b' }}> · Stockage : {placeRestante} place{placeRestante>1?'s':''} libre{placeRestante>1?'s':''}</span>}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {RESOURCES.filter(r=>r!=='or').map(r => (
              <button key={r} onClick={() => setResAcheter(resAcheter===r?null:r)} style={{
                padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer',
                border: resAcheter===r?'2px solid #d97706':'1px solid #e2e8f0',
                background: resAcheter===r?'#fffbeb':'white', color: resAcheter===r?'#92400e':'#374151',
              }}>{RES_LABELS[r]}</button>
            ))}
          </div>
          {erreurStockage && (
            <div style={{ fontSize:11, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, padding:'5px 8px' }}>
              ⛔ Stockage plein — il ne reste que {placeRestante} place{placeRestante>1?'s':''}, achat de {qtéAchat} impossible.
            </div>
          )}
          <button onClick={() => peutAcheter && onConfirm('commerce', { mode:'acheter', resource:resAcheter, qté:qtéAchat })}
            disabled={!peutAcheter} style={{ padding:'8px 0', borderRadius:8, border:'none', background:peutAcheter?'#d97706':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:peutAcheter?'pointer':'default' }}>
            Échanger ({game.resources.or||0} Or dispo.)
          </button>
        </>
      )}

      {mode==='vendre' && (
        <>
          <div style={{ fontSize:11, color:'#64748b' }}>2 ressources → 1 Or</div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>Ressource 1 :</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {RESOURCES.filter(r=>r!=='or'&&(game.resources[r]||0)>0).map(r => (
              <button key={r} onClick={() => setRes1Vendre(res1Vendre===r?null:r)} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', border:res1Vendre===r?'2px solid #d97706':'1px solid #e2e8f0', background:res1Vendre===r?'#fffbeb':'white', color:res1Vendre===r?'#92400e':'#374151' }}>{RES_LABELS[r]} ({game.resources[r]})</button>
            ))}
          </div>
          <div style={{ fontSize:11, color:'#94a3b8' }}>Ressource 2 :</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {RESOURCES.filter(r=>r!=='or'&&(game.resources[r]||0)>(r===res1Vendre?1:0)).map(r => (
              <button key={r} onClick={() => setRes2Vendre(res2Vendre===r?null:r)} style={{ padding:'5px 10px', borderRadius:6, fontSize:11, cursor:'pointer', border:res2Vendre===r?'2px solid #d97706':'1px solid #e2e8f0', background:res2Vendre===r?'#fffbeb':'white', color:res2Vendre===r?'#92400e':'#374151' }}>{RES_LABELS[r]} ({game.resources[r]})</button>
            ))}
          </div>
          <button onClick={() => res1Vendre && res2Vendre && onConfirm('commerce', { mode:'vendre', res1:res1Vendre, res2:res2Vendre })}
            disabled={!res1Vendre||!res2Vendre} style={{ padding:'8px 0', borderRadius:8, border:'none', background:res1Vendre&&res2Vendre?'#d97706':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:res1Vendre&&res2Vendre?'pointer':'default' }}>
            Échanger
          </button>
        </>
      )}
      <button onClick={onClose} style={{ padding:'6px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
    </div>
  )
}

function PanelFormer({ game, onConfirm, onClose }) {
  const [from, setFrom] = useState(null)
  const [to, setTo]     = useState(null)
  const available = POP_TYPES.filter(t => (game.population[t]||0) > 0)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569' }}>Coût : 1 Or. Changez 1 population en un autre type.</div>
      <div style={{ fontSize:11, color:'#94a3b8' }}>Convertir :</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {available.map(t => (
          <button key={t} onClick={() => setFrom(from===t?null:t)} style={{ padding:'5px 8px', borderRadius:6, fontSize:11, cursor:'pointer', border:from===t?'2px solid #7c3aed':'1px solid #e2e8f0', background:from===t?'#f5f3ff':'white', color:from===t?'#7c3aed':'#374151' }}>
            {POP_EMOJI[t]} {POP_LABELS[t]} ({game.population[t]})
          </button>
        ))}
      </div>
      {from && <>
        <div style={{ fontSize:11, color:'#94a3b8' }}>En :</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
          {POP_TYPES.filter(t=>t!==from).map(t => (
            <button key={t} onClick={() => setTo(to===t?null:t)} style={{ padding:'5px 8px', borderRadius:6, fontSize:11, cursor:'pointer', border:to===t?'2px solid #7c3aed':'1px solid #e2e8f0', background:to===t?'#f5f3ff':'white', color:to===t?'#7c3aed':'#374151' }}>
              {POP_EMOJI[t]} {POP_LABELS[t]}
            </button>
          ))}
        </div>
      </>}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
        <button onClick={() => from&&to&&onConfirm('former',{from,to})} disabled={!from||!to} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:from&&to?'#7c3aed':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:from&&to?'pointer':'default' }}>Former</button>
      </div>
    </div>
  )
}

function PanelDrainageIrrigation({ actionId, game, onConfirm, onClose }) {
  const [tileKey, setTile] = useState(null)
  const type = actionId === 'drainage' ? 'marais' : 'desert'
  const tiles = game.map.flat().filter(t => t.owner==='player' && t.terrain===type)
  const TERRAIN_NAMES = { marais:'Marais', desert:'Désert' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569' }}>
        Convertit un {TERRAIN_NAMES[type]} en Plaine.
        {actionId==='drainage' ? ' Perd 1 Ouvrier + 3 Bois.' : ' Perd 1 Fermier + 3 Argile.'}
      </div>
      {tiles.length === 0
        ? <div style={{ fontSize:12, color:'#dc2626' }}>Aucune case {TERRAIN_NAMES[type]} dans votre territoire.</div>
        : <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {tiles.map(t => {
              const key=`${t.row}-${t.col}`
              return (
                <button key={key} onClick={() => setTile(tileKey===key?null:key)} style={{
                  padding:'7px 9px', borderRadius:8, fontSize:12, textAlign:'left', cursor:'pointer',
                  border: tileKey===key?'2px solid #16a34a':'1.5px solid #e2e8f0',
                  background: tileKey===key?'#f0fdf4':'white',
                }}>
                  Case ({t.col+1},{t.row+1}) — {TERRAIN_NAMES[type]}
                </button>
              )
            })}
          </div>
      }
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
        <button onClick={() => tileKey && onConfirm(actionId,{tileKey})} disabled={!tileKey} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:tileKey?'#16a34a':'#e2e8f0', color:'white', fontSize:13, fontWeight:500, cursor:tileKey?'pointer':'default' }}>Confirmer</button>
      </div>
    </div>
  )
}

function PanelMartyrs({ game, onConfirm, onClose }) {
  const [nb, setNb] = useState(1)
  const max = game.population.pretre || 0
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>
        Sacrifiez des Prêtres pour réduire la Puissance de chaque empire. Usage unique.
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ flex:1, fontSize:13 }}>⛪ Prêtres à sacrifier ({max} dispo.)</span>
        <button onClick={() => setNb(Math.max(1,nb-1))} style={{ width:24, height:24, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
        <span style={{ width:24, textAlign:'center', fontWeight:600, fontSize:14, color:'#7c3aed' }}>{nb}</span>
        <button onClick={() => setNb(Math.min(max,nb+1))} style={{ width:24, height:24, borderRadius:5, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
      </div>
      <div style={{ fontSize:11, color:'#64748b', background:'#f5f3ff', borderRadius:7, padding:'6px 8px' }}>
        Effet : -{nb} Puissance sur chaque empire
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
        <button onClick={() => onConfirm('martyrs',{nb})} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:'#7c3aed', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Sacrifier</button>
      </div>
    </div>
  )
}

// ── Panneau principal ─────────────────────────────────────────
export function ActionsSpecialesPanel({ onClose, diceRolled = false, diceValues = [], onEquiper, dicePhase = 'idle' }) {
  const game       = useGameStore(s => s.game)
  const updateGame = useGameStore(s => s.updateGame)
  const addEntry   = useLogStore(s => s.addEntry)

  const [activeAction, setActive]     = useState(null)
  // turnLimits persisté dans le gameStore (reset en fin de tour)
  const usedThisTurn = {
    grandir:       game?.turnLimits?.grandir || 0,
    recruter:      game?.turnLimits?.recruter || 0,
    commerce:      game?.turnLimits?.commerce || 0,
    commerceMarche:game?.turnLimits?.commerceMarche || 0,
    servage:       game?.turnLimits?.servageUsed ? 1 : 0,
  }
  const armerActive = game?.activeEffects?.armerActif || false
  function setArmerActive(val) {
    updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, armerActif: val } }))
  }

  if (!game) return null

  // Vérifier disponibilité avec _diceRolledThisTurn injecté
  const gameWithDice = { ...game, _diceRolledThisTurn: diceRolled, _dicePhase: dicePhase }

  function handleConfirm(actionId, params) {
    const newGame = appliquerActionSpeciale(actionId, params, game)
    if (!newGame) return
    updateGame(() => newGame)
    // Incrémenter utilisation dans le gameStore (persisté, reset en fin de tour)
    updateGame(g => {
      const tl = g.turnLimits || {}
      if (actionId === 'grandir')  return { ...g, turnLimits: { ...tl, grandir:  (tl.grandir||0)+1 } }
      if (actionId === 'recruter') return { ...g, turnLimits: { ...tl, recruter: (tl.recruter||0)+1 } }
      // Commerce : incrémenter pour achat ET vente (1 utilisation par artisan)
      if (actionId === 'commerce') {
        const newTl = { ...tl, commerce: (tl.commerce||0)+1 }
        // Si achat avec marché, incrémenter le compteur marché
        if (params?.mode === 'acheter' && params?.qté >= 2)
          newTl.commerceMarche = (tl.commerceMarche||0)+1
        return { ...g, turnLimits: newTl }
      }
      if (actionId === 'servage')  return { ...g, turnLimits: { ...tl, servageUsed: true } }
      return g
    })
    const action = ACTIONS_SPECIALES[actionId]
    addEntry(`Action spéciale : ${action.emoji} ${action.name}`, game.turn)
    if (actionId === 'armer') { setArmerActive(true); setActive(null); return }
    setActive(null)
  }

  // Afficher l'indicateur Armer actif
  const showArmerBadge = armerActive

  // Liste des actions visibles
  const actionIds = Object.keys(ACTIONS_SPECIALES)

  return (
    <div style={{ background:'white', border:'0.5px solid #e2e8f0', borderRadius:12, padding:14, width:290, display:'flex', flexDirection:'column', gap:10, maxHeight:'80vh', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <h3 style={{ fontWeight:600, fontSize:14, color:'#1e293b' }}>⚡ Actions spéciales</h3>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:16 }}>✕</button>
      </div>

      {/* Badge Servage actif */}
      {game?.activeEffects?.servageActif && (
        <div style={{ background:'#eff6ff', border:'1px solid #93c5fd', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#1e40af', display:'flex', alignItems:'center', gap:6 }}>
          <span>⛓️</span>
          <span style={{ flex:1 }}>Servage actif : 3 dés au prochain lancer</span>
          <button onClick={() => updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, servageActif: false }, turnLimits: { ...g.turnLimits, servageUsed: false } }))}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#1e40af', fontSize:11, textDecoration:'underline' }}>Annuler</button>
        </div>
      )}
      {/* Badge Équiper actif */}
      {game?.activeEffects?.equiperActif && (
        <div style={{ background:'#f8fafc', border:'1px solid #cbd5e1', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#475569', display:'flex', alignItems:'center', gap:6 }}>
          <span>⚙️</span>
          <span style={{ flex:1 }}>Équiper actif : +/- sur les dés (1 Fer/clic)</span>
          <button onClick={() => updateGame(g => ({ ...g, activeEffects: { ...g.activeEffects, equiperActif: false } }))}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', fontSize:11, textDecoration:'underline' }}>Désactiver</button>
        </div>
      )}
      {/* Badge Armer actif */}
      {showArmerBadge && (
        <div style={{ background:'#fef9c3', border:'1px solid #f59e0b', borderRadius:8, padding:'7px 10px', fontSize:12, color:'#92400e', display:'flex', alignItems:'center', gap:6 }}>
          <span>🗡️</span>
          <span style={{ flex:1 }}>Armer actif : -1 perte au prochain combat</span>
          <button onClick={() => setArmerActive(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#92400e', fontSize:11, textDecoration:'underline' }}>Annuler</button>
        </div>
      )}

      {/* Liste ou sous-panneau actif */}
      {!activeAction ? (
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {actionIds.map(id => {
            const action = ACTIONS_SPECIALES[id]
            const { ok, raison } = peutUtiliserAction(id, gameWithDice, usedThisTurn)
            const coutStr = Object.entries(action.cout||{}).map(([r,q])=>`${q} ${RES_LABELS[r]||r}`).join(' + ') || (action.maxParTourParArtisan ? 'Artisan requis' : 'Gratuit')
            return (
              <button key={id} onClick={() => ok && setActive(id)} disabled={!ok} style={{
                display:'flex', alignItems:'flex-start', gap:8, padding:'8px 9px', borderRadius:8,
                border: ok?'1.5px solid #e2e8f0':'1.5px solid #f1f5f9',
                background: ok?'white':'#f8fafc', cursor:ok?'pointer':'not-allowed',
                opacity:ok?1:0.6, textAlign:'left',
              }}>
                <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>{action.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:ok?'#1e293b':'#94a3b8' }}>{action.name}</div>
                  <div style={{ fontSize:11, color:'#64748b', lineHeight:1.3, marginTop:1 }}>{action.description}</div>
                  <div style={{ fontSize:10, color:ok?'#16a34a':'#94a3b8', marginTop:2 }}>{coutStr}</div>
                  {!ok && raison && <div style={{ fontSize:10, color:'#ef4444', marginTop:1 }}>{raison}</div>}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <>
          <div style={{ fontSize:11, color:'#7c3aed', fontWeight:500 }}>
            {ACTIONS_SPECIALES[activeAction].emoji} {ACTIONS_SPECIALES[activeAction].name}
          </div>
          {activeAction==='grandir'   && <PanelGrandir game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='recruter'  && <PanelRecruter game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='commerce'  && <PanelCommerce game={game} usedThisTurn={usedThisTurn} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='former'    && <PanelFormer game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='drainage'  && <PanelDrainageIrrigation actionId="drainage" game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='irrigation'&& <PanelDrainageIrrigation actionId="irrigation" game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='martyrs'   && <PanelMartyrs game={game} onConfirm={handleConfirm} onClose={() => setActive(null)} />}
          {activeAction==='armer'     && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#475569' }}>Coût : 1 Fer. Active -1 perte au prochain combat.</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setActive(null)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
                <button onClick={() => handleConfirm('armer',{})} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:'#d97706', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Activer Armer</button>
              </div>
            </div>
          )}
          {activeAction==='servage' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>Coût : 3 Or. Au prochain lancer, choisissez 3 dés au lieu de 2. L'effet persiste jusqu'au lancer.</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setActive(null)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
                <button onClick={() => handleConfirm('servage',{})} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:'#0369a1', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Activer Servage</button>
              </div>
            </div>
          )}
          {activeAction==='debugGuerriers' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:6, padding:'6px 8px' }}>
                ⚠️ Mode debug — à supprimer avant la mise en production.
              </div>
              <button onClick={() => handleConfirm('debugGuerriers',{})} style={{ padding:'8px 0', borderRadius:8, border:'none', background:'#dc2626', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                🔧 +3 Guerriers
              </button>
            </div>
          )}
          {activeAction==='equiper' && (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontSize:12, color:'#475569', lineHeight:1.5 }}>Coût : 1 Fer par utilisation. Active les boutons +/- sur les dés. Disponible uniquement après le lancer des dés.</div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setActive(null)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid #e2e8f0', background:'white', fontSize:12, cursor:'pointer', color:'#475569' }}>Annuler</button>
                <button onClick={() => { handleConfirm('equiper',{}); }} style={{ flex:2, padding:'8px 0', borderRadius:8, border:'none', background:'#475569', color:'white', fontSize:13, fontWeight:500, cursor:'pointer' }}>Activer Équiper</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Application des effets ────────────────────────────────────
function appliquerActionSpeciale(actionId, params, game) {
  let newResources = { ...game.resources }
  let newPop       = { ...game.population }
  let newMap       = game.map
  let newEmpires   = { ...game.empires }

  switch (actionId) {
    case 'grandir':
      newResources.nourriture = (newResources.nourriture || 0) - 3
      newPop[params.popType] = (newPop[params.popType] || 0) + 1
      break

    case 'recruter':
      newResources.or = (newResources.or || 0) - 3
      newPop[params.popType] = (newPop[params.popType] || 0) + 1
      break

    case 'armer':
      newResources.fer = (newResources.fer || 0) - 1
      return { ...game, resources: newResources, activeEffects: { ...game.activeEffects, armerActif: true } }

    case 'equiper':
      // Pas de déduction ici — le Fer est déduit à chaque clic +/-
      return { ...game, activeEffects: { ...game.activeEffects, equiperActif: true } }

    case 'servage':
      newResources.or = (newResources.or || 0) - 3
      return { ...game, resources: newResources, activeEffects: { ...game.activeEffects, servageActif: true } }

    case 'debugGuerriers':  // DEBUG — à supprimer après les tests
      return { ...game, population: { ...game.population, guerrier: (game.population.guerrier||0) + 3 } }

    case 'former':
      newResources.or = (newResources.or || 0) - 1
      newPop[params.from] = Math.max(0, (newPop[params.from] || 0) - 1)
      newPop[params.to]   = (newPop[params.to] || 0) + 1
      break

    case 'commerce':
      if (params.mode === 'acheter') {
        newResources.or = (newResources.or || 0) - 1
        newResources[params.resource] = (newResources[params.resource] || 0) + (params.qté || 1)
      } else {
        newResources[params.res1] = (newResources[params.res1] || 0) - 1
        newResources[params.res2] = (newResources[params.res2] || 0) - 1
        newResources.or = (newResources.or || 0) + 1
      }
      break

    case 'drainage': {
      const [r,c] = params.tileKey.split('-').map(Number)
      newPop.ouvrier = Math.max(0, (newPop.ouvrier || 0) - 1)
      newResources.bois = (newResources.bois || 0) - 3
      newMap = newMap.map(row => row.map(t => t.row===r&&t.col===c ? {...t,terrain:'plaine'} : t))
      break
    }

    case 'irrigation': {
      const [r,c] = params.tileKey.split('-').map(Number)
      newPop.fermier = Math.max(0, (newPop.fermier || 0) - 1)
      newResources.argile = (newResources.argile || 0) - 3
      newMap = newMap.map(row => row.map(t => t.row===r&&t.col===c ? {...t,terrain:'plaine'} : t))
      break
    }

    case 'martyrs': {
      newPop.pretre = Math.max(0, (newPop.pretre || 0) - params.nb)
      for (const id of [1,2,3,4]) {
        if (newEmpires[id]) newEmpires[id] = { ...newEmpires[id], power: Math.max(0, (newEmpires[id].power||0) - params.nb) }
      }
      break
    }

    default:
      return null
  }

  return { ...game, resources: newResources, population: newPop, map: newMap, empires: newEmpires }
}

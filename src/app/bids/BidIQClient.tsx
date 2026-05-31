'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { user: any; project: any }

const T = {
  bg:'#07090E', bgPage:'#0B0F16', bgCard:'#131A26', bgElev:'#1A2333', bgInput:'#0F1521',
  border:'#232E42', borderSoft:'rgba(255,255,255,0.06)',
  fg:'#F1EEE5', fg2:'#B6BCCB', fg3:'#7B8497', fg4:'#545B6C',
  orange:'#FF6B1F', orangeDim:'rgba(255,107,31,0.1)',
  mint:'#4FE3B5', mintDim:'rgba(79,227,181,0.1)',
  danger:'#FF5260', dangerDim:'rgba(255,82,96,0.1)',
  warn:'#FFB020', warnDim:'rgba(255,176,32,0.1)',
  blue:'#6FA8FF', blueDim:'rgba(111,168,255,0.1)',
}

const TRADES = ['Electrical','Plumbing','Mechanical','General','Concrete','Steel','Drywall','Roofing']
const PROJECT_TYPES = ['Commercial Office','Casino / Hotel','Healthcare','Industrial','Data Center','Retail','Education','Government']
const GC_LIST = ['Turner Construction','Whiting-Turner','Hensel Phelps','McCarthy','Mortenson','Skanska','Clark Construction','DPR Construction','Other']

interface BidResult {
  win_probability: number
  your_bid: number
  market_low: number
  market_high: number
  market_mid: number
  position: 'too_low' | 'competitive' | 'too_high' | 'unknown'
  risk_flags: { level: 'high'|'medium'|'low'; text: string }[]
  missing: string[]
  strengths: string[]
  recommendation: string
  adjusted_probability: number
  adjusted_bid: number
  labor_analysis: string
  material_analysis: string
  margin_analysis: string
  verdict: string
}

function WinMeter({ probability }: { probability: number }) {
  const color = probability >= 70 ? T.mint : probability >= 45 ? T.warn : T.danger
  const label = probability >= 70 ? 'Strong' : probability >= 45 ? 'Competitive' : 'Weak'
  const r = 64
  const circ = 2 * Math.PI * r
  const dash = (probability / 100) * circ

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ position:'relative', width:160, height:160 }}>
        <svg width="160" height="160" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12"/>
          <circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1.5s cubic-bezier(.2,.9,.3,1)', filter:`drop-shadow(0 0 12px ${color})` }}/>
          {/* Tick marks */}
          {Array.from({length:20}).map((_,i)=>{
            const a=(i/20)*Math.PI*2; const x1=80+Math.cos(a)*(r+8); const y1=80+Math.sin(a)*(r+8); const x2=80+Math.cos(a)*(r+13); const y2=80+Math.sin(a)*(r+13)
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={T.fg4} strokeWidth="1"/>
          })}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:36, fontWeight:700, color, letterSpacing:'-2px', lineHeight:1 }}>{probability}%</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>Win Chance</div>
        </div>
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color, textTransform:'uppercase', letterSpacing:'0.1em' }}>{label} Position</div>
    </div>
  )
}

function MarketBar({ low, high, bid, mid }: { low:number; high:number; bid:number; mid:number }) {
  const range = high - low
  const bidPct = Math.max(2, Math.min(98, ((bid - low) / range) * 100))
  const midPct = ((mid - low) / range) * 100

  return (
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Market Range vs Your Bid</div>
      <div style={{ position:'relative', height:28, background:T.bgElev, borderRadius:99, overflow:'visible', marginBottom:28 }}>
        {/* Winning zone */}
        <div style={{ position:'absolute', top:0, bottom:0, left:'15%', right:'15%', background:`${T.mint}20`, borderRadius:99, border:`1px solid ${T.mint}40` }}/>
        {/* Mid marker */}
        <div style={{ position:'absolute', top:-4, bottom:-4, left:`${midPct}%`, width:2, background:T.mint, borderRadius:1 }}/>
        {/* Your bid marker */}
        <div style={{ position:'absolute', top:-8, transform:'translateX(-50%)', left:`${bidPct}%`, display:'flex', flexDirection:'column', alignItems:'center', zIndex:10 }}>
          <div style={{ background:T.orange, color:'#0A0E14', fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:4, whiteSpace:'nowrap' }}>
            YOUR BID
          </div>
          <div style={{ width:2, height:36, background:T.orange }}/>
        </div>
        {/* Labels */}
        <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, paddingLeft:10 }}>
          ${(low/1000).toFixed(0)}K
        </div>
        <div style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, paddingRight:10 }}>
          ${(high/1000).toFixed(0)}K
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
        {[
          { l:'Market Low',    v:`$${low.toLocaleString()}`,  c:T.fg3 },
          { l:'Sweet Spot',    v:`$${mid.toLocaleString()}`,  c:T.mint },
          { l:'Market High',   v:`$${high.toLocaleString()}`, c:T.fg3 },
        ].map(s=>(
          <div key={s.l} style={{ background:T.bgElev, borderRadius:9, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{s.l}</div>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:16, fontWeight:700, color:s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BidIQClient({ user, project }: Props) {
  const [step, setStep] = useState<'input'|'analyzing'|'result'>('input')
  const [result, setResult] = useState<BidResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [toast, setToast] = useState('')
  const [saved, setSaved] = useState(false)

  // Form state
  const [trade, setTrade]           = useState('Electrical')
  const [projectType, setProjectType] = useState('Casino / Hotel')
  const [gc, setGc]                 = useState('Turner Construction')
  const [gcOther, setGcOther]       = useState('')
  const [projectName, setProjectName] = useState('')
  const [bidAmount, setBidAmount]   = useState('')
  const [scope, setScope]           = useState('')
  const [laborHours, setLaborHours] = useState('')
  const [materialCost, setMaterialCost] = useState('')
  const [overhead, setOverhead]     = useState('15')
  const [margin, setMargin]         = useState('12')
  const [city, setCity]             = useState('Las Vegas, NV')
  const [bidFile, setBidFile]       = useState<File | null>(null)
  const [prevWins, setPrevWins]     = useState('')
  const [prevLosses, setPrevLosses] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t:string){ setToast(t); setTimeout(()=>setToast(''),3000) }

  async function analyze() {
    if (!bidAmount || !scope.trim()) { msg('Enter your bid amount and scope description'); return }
    setStep('analyzing'); setProgress(0)
    const iv = setInterval(()=>setProgress(p=>Math.min(p+3+Math.random()*4,92)),200)

    try {
      const gcName = gc === 'Other' ? gcOther : gc
      const bid = parseFloat(bidAmount.replace(/,/g,''))
      const labor = parseFloat(laborHours) || 0
      const materials = parseFloat(materialCost.replace(/,/g,'')) || 0
      const ovhPct = parseFloat(overhead) || 15
      const marginPct = parseFloat(margin) || 12

      const prompt = `You are SubIQ's Bid Intelligence Engine â€” the Bloomberg Terminal for contractors. Analyze this bid with deep market intelligence.

BID DETAILS:
Trade: ${trade}
Project Type: ${projectType}
GC: ${gcName}
Location: ${city}
Project: ${projectName || 'Not specified'}
Bid Amount: $${bid.toLocaleString()}
Labor Hours: ${labor || 'Not specified'}
Material Cost: $${materials.toLocaleString() || 'Not specified'}
Overhead: ${ovhPct}%
Target Margin: ${marginPct}%
Previous wins with this GC: ${prevWins || 'Unknown'}
Previous losses: ${prevLosses || 'Unknown'}

SCOPE OF WORK:
${scope}

Return ONLY valid JSON (no markdown, no backticks) with this exact structure:
{
  "win_probability": <number 0-100>,
  "market_low": <estimated market low for this scope>,
  "market_high": <estimated market high for this scope>,
  "market_mid": <sweet spot / most likely winning bid>,
  "position": "<too_low|competitive|too_high|unknown>",
  "risk_flags": [
    {"level": "<high|medium|low>", "text": "<specific risk>"},
    {"level": "<high|medium|low>", "text": "<specific risk>"}
  ],
  "missing": ["<missing requirement or item>"],
  "strengths": ["<bid strength>"],
  "recommendation": "<specific single most important action to improve win probability>",
  "adjusted_probability": <win probability after implementing recommendation>,
  "adjusted_bid": <recommended bid amount>,
  "labor_analysis": "<analysis of labor hours vs market for this scope>",
  "material_analysis": "<analysis of material pricing vs current market>",
  "margin_analysis": "<analysis of margin vs typical winning bids for this trade/project type>",
  "verdict": "<one punchy sentence verdict on this bid>"
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role:'user', content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || '{}'
      const clean = text.replace(/```json|```/g,'').trim()
      const parsed: BidResult = JSON.parse(clean)
      parsed.your_bid = bid

      clearInterval(iv)
      setProgress(100)
      setTimeout(() => { setResult(parsed); setStep('result') }, 400)

      // Save to Supabase
      try {
        const { data: { user: au } } = await supabase.auth.getUser()
        if (au) {
          await supabase.from('bids').insert({
            user_id: au.id,
            project_id: project?.id || null,
            trade, project_type: projectType, gc: gcName,
            city, bid_amount: bid, scope,
            win_probability: parsed.win_probability,
            market_low: parsed.market_low, market_high: parsed.market_high,
            status: 'pending',
          })
          setSaved(true)
        }
      } catch { /* non-fatal */ }

    } catch(e) {
      clearInterval(iv)
      msg('Analysis failed â€” try again')
      setStep('input')
    }
  }

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', fontSize:13, borderRadius:9, border:`1.5px solid ${T.border}`, background:T.bgInput, color:T.fg, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }
  const lbl: React.CSSProperties = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, color:T.fg4, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.1em' }
  const sel: React.CSSProperties = { ...inp, cursor:'pointer' }

  return (
    <div style={{ fontFamily:"'Space Grotesk',-apple-system,sans-serif", color:T.fg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'); select option{background:#131A26;color:#F1EEE5;} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}} @keyframes count-up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, textTransform:'uppercase', letterSpacing:'0.12em' }}>Construction Intelligence</div>
          <div style={{ padding:'2px 10px', borderRadius:99, background:T.orangeDim, border:`1px solid ${T.orange}40`, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.08em' }}>Beta</div>
        </div>
        <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', color:T.fg, marginBottom:6 }}>BidIQ</h1>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>Upload your bid. Know if you'll win before you submit.</div>
      </div>

      {/* â”€â”€ INPUT FORM â”€â”€ */}
      {step === 'input' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Project basics */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Project Details</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <label style={lbl}>Your Trade</label>
                  <select style={sel} value={trade} onChange={e=>setTrade(e.target.value)}>
                    {TRADES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Project Type</label>
                  <select style={sel} value={projectType} onChange={e=>setProjectType(e.target.value)}>
                    {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>General Contractor</label>
                  <select style={sel} value={gc} onChange={e=>setGc(e.target.value)}>
                    {GC_LIST.map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>
                {gc === 'Other' && (
                  <div>
                    <label style={lbl}>GC Name</label>
                    <input style={inp} placeholder="GC Company Name" value={gcOther} onChange={e=>setGcOther(e.target.value)}/>
                  </div>
                )}
                <div>
                  <label style={lbl}>City / Market</label>
                  <input style={inp} placeholder="Las Vegas, NV" value={city} onChange={e=>setCity(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Project Name</label>
                  <input style={inp} placeholder="Hardrock Hotel" value={projectName} onChange={e=>setProjectName(e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Bid numbers */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Your Numbers</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={lbl}>Total Bid Amount ($) *</label>
                  <input style={{ ...inp, fontSize:16, fontWeight:700 }} placeholder="94,200" value={bidAmount} onChange={e=>setBidAmount(e.target.value)} autoFocus/>
                </div>
                <div>
                  <label style={lbl}>Labor Hours</label>
                  <input type="number" style={inp} placeholder="280" value={laborHours} onChange={e=>setLaborHours(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Material Cost ($)</label>
                  <input style={inp} placeholder="38,000" value={materialCost} onChange={e=>setMaterialCost(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Overhead %</label>
                  <input type="number" style={inp} placeholder="15" value={overhead} onChange={e=>setOverhead(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Target Margin %</label>
                  <input type="number" style={inp} placeholder="12" value={margin} onChange={e=>setMargin(e.target.value)}/>
                </div>
                <div>
                  <label style={lbl}>Previous wins this GC</label>
                  <input type="number" style={inp} placeholder="2" value={prevWins} onChange={e=>setPrevWins(e.target.value)}/>
                </div>
              </div>
            </div>

            {/* Scope */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>Scope of Work *</div>
              <textarea
                style={{ ...inp, resize:'none', minHeight:100, lineHeight:1.6 }}
                placeholder="Describe exactly what you're bidding. e.g.: Complete electrical rough-in and finish for 340-room hotel, floors 3-18. Includes 42 electrical panels, 8,400 devices, emergency power, fire alarm rough-in. Excludes elevator power and penthouse mechanical..."
                value={scope} onChange={e=>setScope(e.target.value)}
              />
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, marginTop:6 }}>More detail = more accurate analysis. Include scope, exclusions, allowances.</div>
            </div>

            {/* Optional file upload */}
            <div
              style={{ border:`2px dashed ${T.border}`, borderRadius:12, padding:'24px', textAlign:'center', cursor:'pointer', background:T.bgCard }}
              onClick={()=>fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls,.csv" style={{ display:'none' }} onChange={e=>setBidFile(e.target.files?.[0]||null)}/>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, marginBottom:6 }}>OPTIONAL â€” UPLOAD BID DOCUMENT</div>
              <div style={{ fontSize:13, color:T.fg3 }}>{bidFile ? bidFile.name : 'Drop your bid PDF or spreadsheet for deeper analysis'}</div>
            </div>

            <button
              onClick={analyze}
              disabled={!bidAmount || !scope.trim()}
              style={{ width:'100%', padding:'15px', fontSize:15, fontWeight:700, borderRadius:12, cursor:(!bidAmount||!scope.trim())?'not-allowed':'pointer', border:'none', background:(!bidAmount||!scope.trim())?T.bgElev:T.orange, color:(!bidAmount||!scope.trim())?T.fg4:'#0A0E14', fontFamily:'inherit', letterSpacing:'-0.2px', transition:'all 0.15s' }}
            >
              Analyze My Bid â€” Get Win Probability
            </button>
          </div>

          {/* Right â€” what this does */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:14 }}>What BidIQ Returns</div>
              {[
                { color:T.mint,   label:'Win Probability',    desc:'% chance of winning based on market data and scope' },
                { color:T.blue,   label:'Market Range',       desc:'What bids are actually winning in your market right now' },
                { color:T.danger, label:'Risk Flags',         desc:'What could blow your margin or cost you the job' },
                { color:T.warn,   label:'Missing Items',      desc:'Requirements other subs will include that you might miss' },
                { color:T.mint,   label:'Recommended Bid',    desc:'Exact adjustment to maximize win probability' },
                { color:T.orange, label:'Labor Analysis',     desc:'How your hours compare to winning bids for this scope' },
              ].map((item,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:i<5?`1px solid ${T.borderSoft}`:'none' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:item.color, flexShrink:0, marginTop:6 }}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.fg, marginBottom:2 }}>{item.label}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, lineHeight:1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background:T.orangeDim, border:`1px solid ${T.orange}30`, borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:10 }}>The Intelligence Edge</div>
              <div style={{ fontSize:13, color:T.fg2, lineHeight:1.7 }}>
                Every bid analyzed makes the engine smarter. After 1,000 bids in Las Vegas, SubIQ knows exactly what wins â€” and tells you before you submit.
              </div>
            </div>

            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>Recent Market Intel</div>
              {[
                { market:'Las Vegas Casino',    range:'$88Kâ€“$96K', trade:'Electrical', confidence:'High' },
                { market:'Commercial Office NV', range:'$42Kâ€“$51K', trade:'Plumbing',   confidence:'Medium' },
                { market:'Las Vegas Hotel',      range:'$210Kâ€“$240K',trade:'Mechanical', confidence:'High' },
              ].map((m,i)=>(
                <div key={i} style={{ padding:'8px 0', borderBottom:i<2?`1px solid ${T.borderSoft}`:'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:T.fg }}>{m.market}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.mint, fontWeight:700 }}>{m.range}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4 }}>{m.trade}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:m.confidence==='High'?T.mint:T.warn }}>{m.confidence} confidence</span>
                  </div>
                </div>
              ))}
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, marginTop:8, fontStyle:'italic' }}>Based on recent bid submissions. More data = better accuracy.</div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ ANALYZING â”€â”€ */}
      {step === 'analyzing' && (
        <div style={{ textAlign:'center', padding:'80px 20px' }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ position:'relative', width:100, height:100, margin:'0 auto 24px' }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke={T.bgElev} strokeWidth="6"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke={T.mint} strokeWidth="6"
                  strokeDasharray="66 200" strokeLinecap="round"
                  style={{ animation:'spin 1.2s linear infinite', transformOrigin:'center', filter:`drop-shadow(0 0 8px ${T.mint})` }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:16, fontWeight:700, color:T.mint }}>{Math.round(progress)}%</div>
              </div>
            </div>
            <div style={{ fontSize:20, fontWeight:700, color:T.fg, marginBottom:8 }}>Analyzing your bid...</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>
              {progress < 30 ? 'Reading scope of work...' : progress < 55 ? 'Comparing to market data...' : progress < 75 ? 'Calculating win probability...' : progress < 90 ? 'Flagging risks and gaps...' : 'Generating recommendation...'}
            </div>
          </div>
          <div style={{ maxWidth:400, margin:'0 auto', height:3, background:T.bgElev, borderRadius:99, overflow:'hidden' }}>
            <div style={{ width:`${progress}%`, height:'100%', background:T.mint, borderRadius:99, transition:'width 0.2s ease', boxShadow:`0 0 10px ${T.mint}` }}/>
          </div>
        </div>
      )}

      {/* â”€â”€ RESULT â”€â”€ */}
      {step === 'result' && result && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Top verdict bar */}
          <div style={{ padding:'16px 20px', background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Verdict</div>
              <div style={{ fontSize:16, fontWeight:700, color:T.fg }}>{result.verdict}</div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{setStep('input');setResult(null)}} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.fg2, fontFamily:'inherit' }}>
                Analyze Another Bid
              </button>
              <button onClick={()=>{
                const text = `BID ANALYSIS REPORT\n\nProject: ${projectName||'Project'}\nBid: $${result.your_bid.toLocaleString()}\nWin Probability: ${result.win_probability}%\nMarket Range: $${result.market_low.toLocaleString()} - $${result.market_high.toLocaleString()}\nRecommended Bid: $${result.adjusted_bid.toLocaleString()} (${result.adjusted_probability}% win probability)\n\nRecommendation: ${result.recommendation}\n\nRisk Flags:\n${result.risk_flags.map(r=>`â€¢ ${r.text}`).join('\n')}\n\nMissing:\n${result.missing.map(m=>`â€¢ ${m}`).join('\n')}`
                navigator.clipboard?.writeText(text)
                msg('Copied to clipboard')
              }} style={{ padding:'8px 16px', fontSize:12, fontWeight:700, borderRadius:8, cursor:'pointer', border:'none', background:T.orange, color:'#0A0E14', fontFamily:'inherit' }}>
                Copy Report
              </button>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:20, alignItems:'start' }}>

            {/* Win meter */}
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:24 }}>
              <WinMeter probability={result.win_probability}/>
              {result.adjusted_probability > result.win_probability && (
                <div style={{ marginTop:16, padding:'12px 14px', background:T.mintDim, border:`1px solid ${T.mint}30`, borderRadius:10, textAlign:'center' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.mint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>After Adjustment</div>
                  <div style={{ fontSize:28, fontWeight:700, color:T.mint }}>{result.adjusted_probability}%</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, marginTop:2 }}>+{result.adjusted_probability - result.win_probability}% improvement</div>
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Market range */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
                <MarketBar low={result.market_low} high={result.market_high} bid={result.your_bid} mid={result.market_mid}/>
              </div>

              {/* Key recommendation */}
              <div style={{ padding:'16px 18px', background:T.orangeDim, border:`1px solid ${T.orange}30`, borderLeft:`3px solid ${T.orange}`, borderRadius:12 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Key Recommendation</div>
                <div style={{ fontSize:14, fontWeight:600, color:T.fg, lineHeight:1.6, marginBottom:10 }}>{result.recommendation}</div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, marginBottom:2 }}>Recommended Bid</div>
                    <div style={{ fontSize:18, fontWeight:700, color:T.orange }}>${result.adjusted_bid.toLocaleString()}</div>
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:T.fg4, margin:'0 8px' }}>â†’</div>
                  <div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, marginBottom:2 }}>New Win Probability</div>
                    <div style={{ fontSize:18, fontWeight:700, color:T.mint }}>{result.adjusted_probability}%</div>
                  </div>
                </div>
              </div>

              {/* Analysis breakdown */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Bid Breakdown Analysis</div>
                {[
                  { label:'Labor',    text:result.labor_analysis },
                  { label:'Material', text:result.material_analysis },
                  { label:'Margin',   text:result.margin_analysis },
                ].map((a,i)=>(
                  <div key={i} style={{ padding:'10px 0', borderBottom:i<2?`1px solid ${T.borderSoft}`:'none' }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>{a.label}</div>
                    <div style={{ fontSize:13, color:T.fg2, lineHeight:1.6 }}>{a.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk flags */}
          {result.risk_flags.length > 0 && (
            <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:20 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Risk Flags â€” {result.risk_flags.length} Found</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {result.risk_flags.map((f,i)=>{
                  const c = f.level==='high'?T.danger:f.level==='medium'?T.warn:T.fg3
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', background:`${c}10`, border:`1px solid ${c}30`, borderLeft:`3px solid ${c}`, borderRadius:9 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, color:c, textTransform:'uppercase', flexShrink:0, paddingTop:2 }}>{f.level}</div>
                      <div style={{ fontSize:13, color:T.fg, lineHeight:1.5 }}>{f.text}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Missing items */}
            {result.missing.length > 0 && (
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.danger, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Missing From Bid</div>
                {result.missing.map((m,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:T.dangerDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:T.danger }}/>
                    </div>
                    <div style={{ fontSize:12, color:T.fg2, lineHeight:1.5 }}>{m}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.mint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Bid Strengths</div>
                {result.strengths.map((s,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                    <div style={{ width:14, height:14, borderRadius:'50%', background:T.mintDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={T.mint} strokeWidth="3" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ fontSize:12, color:T.fg2, lineHeight:1.5 }}>{s}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Track outcome */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Track This Bid Outcome</div>
            <div style={{ fontSize:13, color:T.fg3, marginBottom:14 }}>When you hear back, tell SubIQ what happened. Every outcome makes the intelligence better for you and every sub in your market.</div>
            <div style={{ display:'flex', gap:8 }}>
              {['Won', 'Lost', 'Pending', 'Withdrew'].map(status=>(
                <button key={status} onClick={async()=>{
                  try {
                    const { data:{user:au} } = await supabase.auth.getUser()
                    if(au) await supabase.from('bids').update({status:status.toLowerCase()}).eq('user_id',au.id).order('created_at',{ascending:false}).limit(1)
                    msg(`Bid marked as ${status}`)
                  } catch { msg('Could not update') }
                }} style={{ padding:'8px 16px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer', border:`1px solid ${T.border}`, background:status==='Won'?T.mintDim:status==='Lost'?T.dangerDim:T.bgElev, color:status==='Won'?T.mint:status==='Lost'?T.danger:T.fg2, fontFamily:'inherit' }}>
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, background:T.bgElev, border:`1px solid ${T.border}`, color:T.fg, padding:'12px 20px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}



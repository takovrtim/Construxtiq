'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Props { user: any; project: any }

const T = {
  bg:'#0B0F16', bgDeep:'#07090E', bgCard:'#131A26', bgElev:'#1A2333', bgInput:'#0F1521',
  border:'#232E42', borderSoft:'rgba(255,255,255,0.06)',
  fg:'#F1EEE5', fg2:'#B6BCCB', fg3:'#7B8497', fg4:'#545B6C',
  orange:'#FF6B1F', orangeDim:'rgba(255,107,31,0.12)',
  mint:'#4FE3B5', mintDim:'rgba(79,227,181,0.1)',
  danger:'#FF5260', dangerDim:'rgba(255,82,96,0.12)',
  warn:'#FFB020', warnDim:'rgba(255,176,32,0.12)',
  blue:'#6FA8FF', blueDim:'rgba(111,168,255,0.12)',
  purple:'#A78BFA', purpleDim:'rgba(167,139,250,0.12)',
}

const TABS = ['Bid Score', 'Bid Builder', 'My Bids', 'Opportunities']

// ── SCORE RING ────────────────────────────────────────────────
function ScoreRing({ score, size=120 }: { score:number; size?:number }) {
  const r = (size-10)/2
  const c = 2*Math.PI*r
  const dash = (score/100)*c
  const color = score>=75?T.mint:score>=50?T.warn:T.danger
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          style={{ filter:`drop-shadow(0 0 8px ${color})`, transition:'stroke-dasharray 1s ease' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontSize:size*0.28, fontWeight:700, color, lineHeight:1, letterSpacing:'-1px' }}>{score}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em' }}>Score</div>
      </div>
    </div>
  )
}

// ── BID SCORE TAB ─────────────────────────────────────────────
function BidScoreTab({ user, project }: { user:any; project:any }) {
  const [file, setFile] = useState<File|null>(null)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [dragging, setDragging] = useState(false)
  const [trade, setTrade] = useState('electrical')
  const [market, setMarket] = useState('Las Vegas, NV')
  const fileRef = useRef<HTMLInputElement>(null)

  async function analyze() {
    if (!file) return
    setScanning(true); setProgress(0); setResult(null)
    let prog = 0
    const iv = setInterval(()=>{ prog=Math.min(prog+Math.random()*6+2,88); setProgress(prog) },180)
    try {
      const base64 = await new Promise<string>((res,rej)=>{ const r=new FileReader(); r.onload=()=>res((r.result as string).split(',')[1]); r.onerror=rej; r.readAsDataURL(file) })
      const mediaType = file.type==='application/pdf'?'application/pdf':'image/jpeg'
      const resp = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:2000,
          messages:[{
            role:'user',
            content:[
              { type:'document', source:{ type:'base64', media_type:mediaType, data:base64 } },
              { type:'text', text:`You are SubIQ's bid intelligence AI — the Bloomberg Terminal for ${trade} subcontractors in ${market}.

Analyze this bid document like a senior estimator with 20 years of experience in commercial ${trade} contracting.

Return ONLY valid JSON with this exact structure:
{
  "overall_score": <0-100 integer>,
  "win_probability": <0-100 integer>,
  "total_bid_value": "<dollar amount or 'Not specified'>",
  "market_range_low": "<estimated low for this scope>",
  "market_range_high": "<estimated high for this scope>",
  "competitive_position": "<'Below Market' | 'In Range' | 'Above Market' | 'Unknown'>",
  "scope_summary": "<2 sentence summary of what this bid covers>",
  "completeness_score": <0-100>,
  "missing_items": ["<item 1>", "<item 2>", "<item 3>"],
  "risk_flags": ["<risk 1>", "<risk 2>", "<risk 3>"],
  "strengths": ["<strength 1>", "<strength 2>"],
  "winning_tips": ["<specific actionable tip 1>", "<specific actionable tip 2>", "<specific actionable tip 3>"],
  "disqualification_risks": ["<reason that could get bid rejected>"]
}

Be specific to ${trade} work in ${market}. Reference real market conditions. Flag anything that would cause a GC like Turner Construction to reject or not consider this bid.` }
            ]
          }]
        })
      })
      const data = await resp.json()
      const text = data.content?.[0]?.text || '{}'
      clearInterval(iv)
      try {
        const clean = text.replace(/```json|```/g,'').trim()
        const parsed = JSON.parse(clean)
        setResult(parsed)
        setProgress(100)
      } catch {
        setResult({ overall_score:0, error:'Could not parse analysis. Try a clearer PDF.' })
      }
    } catch { clearInterval(iv); setResult({ overall_score:0, error:'Analysis failed. Check connection.' }) }
    setScanning(false)
  }

  const inp: React.CSSProperties = { padding:'9px 12px', fontSize:13, borderRadius:9, border:`1.5px solid ${T.border}`, background:T.bgInput, color:T.fg, fontFamily:'inherit', outline:'none' }

  return (
    <div style={{ display:'grid', gridTemplateColumns:result?'1fr 420px':'1fr', gap:20, alignItems:'start' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Context */}
        <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:12 }}>Your Context</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Trade</div>
              <select value={trade} onChange={e=>setTrade(e.target.value)} style={{ ...inp, width:'100%' }}>
                {['electrical','plumbing','mechanical','hvac','general','fire protection','low voltage'].map(t=>(
                  <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Market</div>
              <input value={market} onChange={e=>setMarket(e.target.value)} placeholder="Las Vegas, NV" style={{ ...inp, width:'100%', boxSizing:'border-box' as const }}/>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true)}}
          onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f){setFile(f);setResult(null)}}}
          onClick={()=>fileRef.current?.click()}
          style={{ border:`2px dashed ${dragging?T.orange:T.border}`, borderRadius:16, padding:'40px 24px', textAlign:'center', cursor:'pointer', background:dragging?T.orangeDim:T.bgCard, transition:'all 0.2s' }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display:'none' }} onChange={e=>{const f=e.target.files?.[0];if(f){setFile(f);setResult(null)};e.target.value=''}}/>
          <div style={{ width:52, height:52, borderRadius:14, background:T.orangeDim, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="1.8" strokeLinecap="round"><path d="M7 3h8l5 5v13H7z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 16h4"/></svg>
          </div>
          {file ? (
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:T.orange, marginBottom:4 }}>{file.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>{(file.size/1024).toFixed(0)}KB — Ready to analyze</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:T.fg, marginBottom:6 }}>Drop your bid here</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, marginBottom:16 }}>PDF, PNG, JPG — any bid document</div>
            </div>
          )}
        </div>

        {/* Analyze button */}
        {file && !scanning && (
          <button onClick={analyze} style={{ padding:'14px', fontSize:15, fontWeight:700, borderRadius:12, cursor:'pointer', border:'none', background:T.orange, color:'#0A0E14', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3 3 6v5.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V6l-9-3Z"/><path d="m9 12 2 2 4-4"/></svg>
            Score This Bid
          </button>
        )}

        {/* Progress */}
        {scanning && (
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:24, textAlign:'center' }}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke={T.bgElev} strokeWidth="3"/>
                <circle cx="20" cy="20" r="16" fill="none" stroke={T.orange} strokeWidth="3" strokeDasharray="25 75" strokeLinecap="round" style={{ animation:'spin 1s linear infinite', transformOrigin:'center' }}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </svg>
            </div>
            <div style={{ fontSize:14, fontWeight:700, color:T.fg, marginBottom:4 }}>AI Analyzing Your Bid</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, marginBottom:16 }}>
              {progress<30?'Reading bid document...':progress<60?'Comparing to market data...':progress<85?'Calculating win probability...':'Generating intelligence report...'}
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:99, overflow:'hidden' }}>
              <div style={{ width:`${progress}%`, height:'100%', background:T.orange, borderRadius:99, transition:'width 0.3s', boxShadow:`0 0 8px ${T.orange}` }}/>
            </div>
          </div>
        )}

        {/* What we analyze */}
        {!file && !result && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:'🎯', title:'Win Probability', desc:'Based on market data and bid strength' },
              { icon:'📊', title:'Market Range', desc:'What this scope typically wins for' },
              { icon:'⚠️', title:'Risk Flags', desc:'What will get your bid rejected' },
              { icon:'✓', title:'Missing Items', desc:'Gaps that cost you the job' },
            ].map(c=>(
              <div key={c.title} style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:12, padding:'14px' }}>
                <div style={{ fontSize:20, marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.fg, marginBottom:4 }}>{c.title}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results panel */}
      {result && !result.error && (
        <div style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:20 }}>

          {/* Score header */}
          <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:16, padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:16 }}>
              <ScoreRing score={result.overall_score||0}/>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Bid Intelligence Score</div>
                <div style={{ fontSize:13, fontWeight:600, color:T.fg, marginBottom:4 }}>{result.scope_summary}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, padding:'3px 10px', borderRadius:20, background:result.competitive_position==='In Range'?T.mintDim:result.competitive_position==='Below Market'?T.dangerDim:T.warnDim, color:result.competitive_position==='In Range'?T.mint:result.competitive_position==='Below Market'?T.danger:T.warn }}>
                    {result.competitive_position}
                  </span>
                </div>
              </div>
            </div>

            {/* Key metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div style={{ background:T.bgElev, borderRadius:10, padding:'12px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Win Probability</div>
                <div style={{ fontSize:22, fontWeight:700, color:result.win_probability>=60?T.mint:result.win_probability>=40?T.warn:T.danger }}>{result.win_probability}%</div>
              </div>
              <div style={{ background:T.bgElev, borderRadius:10, padding:'12px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Market Range</div>
                <div style={{ fontSize:13, fontWeight:700, color:T.fg }}>{result.market_range_low} — {result.market_range_high}</div>
              </div>
            </div>
          </div>

          {/* Risk flags */}
          {result.risk_flags?.length > 0 && (
            <div style={{ background:T.bgCard, border:`1px solid ${T.danger}30`, borderLeft:`3px solid ${T.danger}`, borderRadius:14, padding:16 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.danger, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Risk Flags</div>
              {result.risk_flags.map((r:string,i:number)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:T.dangerDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M12 3 2 21h20L12 3Z" stroke={T.danger} strokeWidth="2"/><path d="M12 10v5M12 18h.01" stroke={T.danger} strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize:12, color:T.fg2, lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Missing items */}
          {result.missing_items?.length > 0 && (
            <div style={{ background:T.bgCard, border:`1px solid ${T.warn}30`, borderLeft:`3px solid ${T.warn}`, borderRadius:14, padding:16 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.warn, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Missing From Bid</div>
              {result.missing_items.map((m:string,i:number)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:T.warn, flexShrink:0, marginTop:5 }}/>
                  <span style={{ fontSize:12, color:T.fg2, lineHeight:1.5 }}>{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Winning tips */}
          {result.winning_tips?.length > 0 && (
            <div style={{ background:T.bgCard, border:`1px solid ${T.mint}30`, borderLeft:`3px solid ${T.mint}`, borderRadius:14, padding:16 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.mint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>To Win This Bid</div>
              {result.winning_tips.map((t:string,i:number)=>(
                <div key={i} style={{ display:'flex', gap:8, marginBottom:8, alignItems:'flex-start' }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:T.mintDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-9" stroke={T.mint} strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize:12, color:T.fg2, lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Disqualification risks */}
          {result.disqualification_risks?.length > 0 && (
            <div style={{ background:T.dangerDim, border:`1px solid ${T.danger}20`, borderRadius:14, padding:16 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.danger, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Will Get You Disqualified</div>
              {result.disqualification_risks.map((d:string,i:number)=>(
                <div key={i} style={{ fontSize:12, color:T.fg2, lineHeight:1.5, marginBottom:4 }}>{d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {result?.error && (
        <div style={{ background:T.bgCard, border:`1px solid ${T.danger}30`, borderRadius:14, padding:20, textAlign:'center' }}>
          <div style={{ fontSize:14, fontWeight:700, color:T.danger, marginBottom:8 }}>Analysis Failed</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>{result.error}</div>
        </div>
      )}
    </div>
  )
}

// ── BID BUILDER TAB ───────────────────────────────────────────
function BidBuilderTab({ user, project }: { user:any; project:any }) {
  const [step, setStep] = useState(1)
  const [trade, setTrade] = useState('Electrical')
  const [gcName, setGcName] = useState('')
  const [jobName, setJobName] = useState('')
  const [jobType, setJobType] = useState('Commercial')
  const [sqft, setSqft] = useState('')
  const [scope, setScope] = useState('')
  const [generating, setGenerating] = useState(false)
  const [bid, setBid] = useState('')

  const inp: React.CSSProperties = { width:'100%', padding:'10px 12px', fontSize:13, borderRadius:9, border:`1.5px solid ${T.border}`, background:T.bgInput, color:T.fg, fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const }
  const lbl: React.CSSProperties = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase' as const, letterSpacing:'0.1em', display:'block', marginBottom:5 }

  async function generateBid() {
    setGenerating(true)
    try {
      const resp = await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:2000,
          messages:[{
            role:'user',
            content:`You are a senior ${trade} estimator with 20 years of commercial construction experience.

Generate a professional bid proposal for:
- Job: ${jobName}
- GC: ${gcName}
- Type: ${jobType}
- Size: ${sqft} sq ft
- Scope: ${scope}
- Trade: ${trade}

Create a complete, professional bid document including:
1. Cover page header
2. Scope of work (detailed)
3. Line item breakdown with realistic costs
4. Exclusions list
5. Assumptions
6. Payment terms
7. Validity period
8. Signature block

Use realistic market rates for Las Vegas, NV. Be specific with line items. Format professionally.`
          }]
        })
      })
      const data = await resp.json()
      setBid(data.content?.[0]?.text || 'Generation failed')
      setStep(3)
    } catch { setBid('Failed to generate. Check connection.') }
    setGenerating(false)
  }

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:16, padding:24 }}>
      <div style={{ display:'flex', gap:4, marginBottom:24 }}>
        {['Job Info','Scope','Your Bid'].map((s,i)=>(
          <div key={s} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:step>i?T.mint:step===i+1?T.orange:T.bgElev, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:step>i?'#042418':step===i+1?'#0A0E14':T.fg4, transition:'all 0.3s' }}>
              {step>i+1?'✓':i+1}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:step===i+1?T.fg:T.fg4 }}>{s}</span>
            {i<2 && <div style={{ width:24, height:1, background:T.border, margin:'0 4px' }}/>}
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Trade</label>
              <select value={trade} onChange={e=>setTrade(e.target.value)} style={{ ...inp }}>
                {['Electrical','Plumbing','Mechanical','HVAC','General','Fire Protection'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Job Type</label>
              <select value={jobType} onChange={e=>setJobType(e.target.value)} style={{ ...inp }}>
                {['Commercial','Casino/Hotel','Healthcare','Industrial','Retail','Office','Multi-Family'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Project Name</label><input style={inp} value={jobName} onChange={e=>setJobName(e.target.value)} placeholder="Hardrock Hotel — Tower B Electrical"/></div>
          <div><label style={lbl}>General Contractor</label><input style={inp} value={gcName} onChange={e=>setGcName(e.target.value)} placeholder="Turner Construction"/></div>
          <div><label style={lbl}>Square Footage</label><input style={inp} value={sqft} onChange={e=>setSqft(e.target.value)} placeholder="45,000"/></div>
          <button onClick={()=>setStep(2)} disabled={!jobName.trim()||!gcName.trim()} style={{ padding:'12px', fontSize:14, fontWeight:700, borderRadius:10, cursor:'pointer', border:'none', background:T.orange, color:'#0A0E14', fontFamily:'inherit' }}>
            Next: Scope
          </button>
        </div>
      )}

      {step===2 && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>Describe the scope of work</label>
            <textarea style={{ ...inp, resize:'none' }} rows={6} value={scope} onChange={e=>setScope(e.target.value)} autoFocus
              placeholder="Complete electrical rough-in and finish for a 45,000 SF hotel tower. Includes service entrance, distribution panels, branch circuits, lighting, devices, fire alarm rough-in, low voltage raceways. 12 floors, 180 guest rooms, lobby, restaurant, conference rooms..."/>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setStep(1)} style={{ padding:'11px 18px', fontSize:13, borderRadius:10, cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.fg3, fontFamily:'inherit' }}>Back</button>
            <button onClick={generateBid} disabled={!scope.trim()||generating} style={{ flex:1, padding:'12px', fontSize:14, fontWeight:700, borderRadius:10, cursor:'pointer', border:'none', background:generating?T.bgElev:T.orange, color:generating?T.fg4:'#0A0E14', fontFamily:'inherit' }}>
              {generating?'Generating professional bid...':'Generate Bid Document'}
            </button>
          </div>
        </div>
      )}

      {step===3 && bid && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.mint, textTransform:'uppercase', letterSpacing:'0.1em' }}>Bid Generated</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>{navigator.clipboard.writeText(bid)}} style={{ padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.fg3, fontFamily:'inherit' }}>Copy</button>
              <button onClick={()=>setStep(1)} style={{ padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.fg3, fontFamily:'inherit' }}>New Bid</button>
            </div>
          </div>
          <div style={{ background:T.bgDeep, borderRadius:12, padding:20, maxHeight:'60vh', overflowY:'auto', fontSize:13, color:T.fg2, lineHeight:1.8, whiteSpace:'pre-wrap', fontFamily:'inherit' }}>
            {bid}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MY BIDS TAB ───────────────────────────────────────────────
function MyBidsTab({ user }: { user:any }) {
  const [bids, setBids] = useState([
    { id:'1', name:'Hardrock Tower B — Electrical', gc:'Turner Construction', value:'$892,000', submitted:'May 15, 2026', status:'pending',   score:78 },
    { id:'2', name:'Raiders Stadium Expansion',    gc:'Skanska USA',         value:'$1.2M',    submitted:'May 8, 2026',  status:'won',      score:91 },
    { id:'3', name:'UNLV Student Center',          gc:'McCarthy Building',   value:'$340,000', submitted:'Apr 22, 2026', status:'lost',     score:62 },
    { id:'4', name:'Allegiant Stadium Suite Fit',  gc:'Hensel Phelps',       value:'$156,000', submitted:'Apr 10, 2026', status:'pending',  score:74 },
  ])

  const STATUS: Record<string,{label:string;color:string;bg:string}> = {
    pending: { label:'Pending',  color:T.warn,   bg:T.warnDim   },
    won:     { label:'Won',      color:T.mint,   bg:T.mintDim   },
    lost:    { label:'Lost',     color:T.danger, bg:T.dangerDim },
    invited: { label:'Invited',  color:T.blue,   bg:T.blueDim   },
  }

  const won  = bids.filter(b=>b.status==='won').length
  const total = bids.length
  const totalValue = bids.filter(b=>b.status==='won').reduce((s,b)=>s+parseFloat(b.value.replace(/[$,M]/g,b.value.includes('M')?'000000':'')),0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Win Rate',    value:`${Math.round(won/total*100)}%`, color:won/total>=0.5?T.mint:T.warn },
          { label:'Bids Submitted', value:total, color:T.fg },
          { label:'Revenue Won', value:won>0?`$${(totalValue/1000).toFixed(0)}K`:'$0', color:T.mint },
        ].map(s=>(
          <div key={s.label} style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:'18px 16px' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:700, color:s.color, letterSpacing:'-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${T.borderSoft}`, fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.12em' }}>
          Active Bids
        </div>
        {bids.map((b,i)=>{
          const st = STATUS[b.status]
          return (
            <div key={b.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<bids.length-1?`1px solid ${T.borderSoft}`:'none' }}>
              <ScoreRing score={b.score} size={48}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:T.fg, marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.name}</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4 }}>{b.gc} · {b.submitted}</div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.fg, marginBottom:4 }}>{b.value}</div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, padding:'2px 8px', borderRadius:20, background:st.bg, color:st.color }}>{st.label}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── OPPORTUNITIES TAB ─────────────────────────────────────────
function OpportunitiesTab({ user }: { user:any }) {
  const opps = [
    { id:'1', name:'MSG Sphere Phase 2 — Interior Electrical', type:'Casino/Entertainment', value:'$2.1M–$3.4M', gc:'Mortenson Construction', deadline:'Jun 15, 2026', source:'Clark County Permit', match:94, posted:'2 days ago' },
    { id:'2', name:'Station Casinos Durango Expansion', type:'Casino', value:'$890K–$1.2M', gc:'Turner Construction', deadline:'Jun 22, 2026', source:'BuildingConnected', match:88, posted:'3 days ago' },
    { id:'3', name:'UNLV Medical School Building', type:'Healthcare/Education', value:'$1.4M–$1.9M', gc:'Hensel Phelps', deadline:'Jul 1, 2026', source:'Nevada State Procurement', match:76, posted:'5 days ago' },
    { id:'4', name:'Las Vegas Convention Center Renovation', type:'Commercial', value:'$420K–$680K', gc:'McCarthy Building Co', deadline:'Jun 30, 2026', source:'Clark County Permit', match:82, posted:'1 week ago' },
    { id:'5', name:'Resorts World Pool Complex Electrical', type:'Casino/Hotel', value:'$280K–$390K', gc:'Skanska USA', deadline:'Jun 18, 2026', source:'PlanHub', match:71, posted:'1 week ago' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ padding:'14px 18px', background:T.mintDim, border:`1px solid ${T.mint}30`, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:T.mint, boxShadow:`0 0 8px ${T.mint}`, flexShrink:0, animation:'pulse 1.4s ease-in-out infinite' }}/>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:T.mint, marginBottom:2 }}>5 new opportunities this week matching your profile</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3 }}>Sources: Clark County permits, BuildingConnected, PlanHub, Nevada State Procurement</div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>

      {opps.map((o,i)=>(
        <div key={o.id} style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18, display:'flex', gap:16, alignItems:'flex-start' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
            <ScoreRing score={o.match} size={56}/>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.fg4, textTransform:'uppercase' }}>Match</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:6, flexWrap:'wrap' }}>
              <div style={{ fontSize:14, fontWeight:700, color:T.fg, lineHeight:1.3 }}>{o.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:700, color:T.mint, flexShrink:0 }}>{o.value}</div>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'2px 8px', borderRadius:20, background:T.blueprintDim, color:T.blue }}>{o.type}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'2px 8px', borderRadius:20, background:T.bgElev, color:T.fg4 }}>via {o.source}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'2px 8px', borderRadius:20, background:T.bgElev, color:T.fg4 }}>{o.posted}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
              <div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4 }}>GC: </span>
                <span style={{ fontSize:12, fontWeight:600, color:T.fg2 }}>{o.gc}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, marginLeft:12 }}>Deadline: </span>
                <span style={{ fontSize:12, fontWeight:600, color:T.warn }}>{o.deadline}</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button style={{ padding:'7px 14px', fontSize:12, fontWeight:600, borderRadius:8, cursor:'pointer', border:`1px solid ${T.border}`, background:'transparent', color:T.fg3, fontFamily:'inherit' }}>Track</button>
                <button style={{ padding:'7px 14px', fontSize:12, fontWeight:700, borderRadius:8, cursor:'pointer', border:'none', background:T.orange, color:'#0A0E14', fontFamily:'inherit' }}>Build Bid</button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ padding:'16px 18px', background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, textAlign:'center' }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, marginBottom:8 }}>
          Connected to: Clark County Permits · BuildingConnected · PlanHub · SAM.gov
        </div>
        <div style={{ fontSize:12, color:T.fg3 }}>Opportunities refresh every 24 hours based on your trade and market</div>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────
export function BidIntelligenceClient({ user, project }: Props) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div style={{ fontFamily:"'Space Grotesk',-apple-system,sans-serif", color:T.fg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, textTransform:'uppercase', letterSpacing:'0.12em' }}>Bid Intelligence</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, padding:'2px 10px', borderRadius:20, background:T.mintDim, color:T.mint }}>BETA</div>
        </div>
        <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', color:T.fg, marginBottom:6 }}>
          The Bloomberg Terminal for Contractors
        </h1>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>
          Find jobs · Score bids · Predict wins · Track outcomes
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:T.bgCard, borderRadius:12, padding:4, border:`1px solid ${T.borderSoft}` }}>
        {TABS.map((tab,i)=>(
          <button key={tab} onClick={()=>setActiveTab(i)} style={{
            flex:1, padding:'9px 12px', borderRadius:9, cursor:'pointer',
            fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:activeTab===i?700:500,
            border:'none', background:activeTab===i?T.orange:'transparent',
            color:activeTab===i?'#0A0E14':T.fg3, transition:'all 0.15s',
          }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab===0 && <BidScoreTab user={user} project={project}/>}
      {activeTab===1 && <BidBuilderTab user={user} project={project}/>}
      {activeTab===2 && <MyBidsTab user={user}/>}
      {activeTab===3 && <OpportunitiesTab user={user}/>}
    </div>
  )
}

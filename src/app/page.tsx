'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── DESIGN TOKENS (from tokens.css) ──────────────────────────
const T = {
  bgDeep:   '#07090E',
  bgPage:   '#0B0F16',
  bgCard:   '#131A26',
  bgElev:   '#1A2333',
  bgInput:  '#0F1521',
  border:   '#232E42',
  borderSoft:'rgba(255,255,255,0.06)',
  fg:       '#F1EEE5',
  fg2:      '#B6BCCB',
  fg3:      '#7B8497',
  fg4:      '#545B6C',
  safety:   '#FF6B1F',
  safety2:  '#FF8F4D',
  safetyDim:'rgba(255,107,31,0.14)',
  mint:     '#4FE3B5',
  mintDim:  'rgba(79,227,181,0.14)',
  danger:   '#FF5260',
  dangerDim:'rgba(255,82,96,0.14)',
  warn:     '#FFB020',
  warnDim:  'rgba(255,176,32,0.14)',
  blueprint:'#6FA8FF',
  blueprintDim:'rgba(111,168,255,0.14)',
}

// ── ICONS ─────────────────────────────────────────────────────
const Ico = ({ n, s=16, c='currentColor', w=1.6 }: { n:string;s?:number;c?:string;w?:number }) => {
  const p = { width:s, height:s, viewBox:'0 0 24 24', fill:'none', stroke:c, strokeWidth:w, strokeLinecap:'round' as const, strokeLinejoin:'round' as const }
  const paths: Record<string,React.ReactNode> = {
    shield:   <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></>,
    'shield-check': <><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></>,
    check:    <><path d="m4 12 5 5 11-11"/></>,
    arrow:    <><path d="M5 12h14M12 5l7 7-7 7"/></>,
    flag:     <><path d="M5 21V4m0 0h12l-3 4 3 4H5"/></>,
    doc:      <><path d="M7 3h8l5 5v13H7z"/><path d="M14 3v6h6"/></>,
    alert:    <><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18h.01"/></>,
    clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    send:     <><path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7Z"/></>,
    archive:  <><rect x="3" y="3" width="18" height="5" rx="1"/><path d="M5 8v12h14V8"/><path d="M10 12h4"/></>,
    fingerprint: <><path d="M12 4a8 8 0 0 0-8 8v2"/><path d="M20 14V12a8 8 0 0 0-3.5-6.6"/><path d="M8 18c0-3 1.5-6 4-6s4 3 4 6"/><path d="M12 14v6"/></>,
    sparkle:  <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>,
    lock:     <><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    bolt:     <><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></>,
    scan:     <><path d="M7 3h8l5 5v13H7z"/><path d="M14 3v6h6"/><path d="M10 13h7M10 16h5"/></>,
    menu:     <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    x:        <><path d="M6 6l12 12M18 6 6 18"/></>,
  }
  return <svg {...p}>{paths[n]}</svg>
}

// ── LOGO ─────────────────────────────────────────────────────
function Logo({ size=22 }: { size?: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill={T.safety} stroke={T.safety} strokeWidth="1.2"/>
        <path d="m8 12 3 3 5-6" fill="none" stroke="#0B0F16" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:size*0.82, letterSpacing:'-0.02em', color:T.fg }}>
        Sub<span style={{ color:T.safety }}>IQ</span>
      </span>
    </div>
  )
}

// ── PILL ──────────────────────────────────────────────────────
function Pill({ tone='ghost', children }: { tone?:string; children:React.ReactNode }) {
  const colors: Record<string,[string,string]> = {
    mint:      [T.mintDim, T.mint],
    safety:    [T.safetyDim, T.safety],
    danger:    [T.dangerDim, T.danger],
    warn:      [T.warnDim, T.warn],
    blueprint: [T.blueprintDim, T.blueprint],
    ghost:     ['rgba(255,255,255,0.04)', T.fg3],
  }
  const [bg, color] = colors[tone] || colors.ghost
  return (
    <span style={{ display:'inline-flex', alignItems:'center', height:22, padding:'0 10px', borderRadius:99, background:bg, color, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase' }}>
      {children}
    </span>
  )
}

// ── SCORE RING ────────────────────────────────────────────────
function ScoreRing({ value=87, size=140 }: { value?:number; size?:number }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (value / 100) * c
  const tone = value >= 80 ? T.mint : value >= 60 ? T.warn : T.danger
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={tone} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.2,.9,.3,1)', filter:`drop-shadow(0 0 10px ${tone})` }}/>
        {Array.from({length:40}).map((_,i) => {
          const a = (i/40)*Math.PI*2
          const x1 = size/2 + Math.cos(a)*(r+stroke/2+3)
          const y1 = size/2 + Math.sin(a)*(r+stroke/2+3)
          const x2 = size/2 + Math.cos(a)*(r+stroke/2+(i%5===0?8:5))
          const y2 = size/2 + Math.sin(a)*(r+stroke/2+(i%5===0?8:5))
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%5===0?T.fg3:T.fg4} strokeWidth={i%5===0?1:0.5}/>
        })}
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:size*0.36, fontWeight:700, color:T.fg, letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:'0.15em', color:T.fg3, marginTop:4, textTransform:'uppercase' }}>Protection</div>
      </div>
    </div>
  )
}

// ── TIMELINE STEP ─────────────────────────────────────────────
function TLStep({ done=false, current=false, label='', sub='', time='' }: { done?:boolean;current?:boolean;label?:string;sub?:string;time?:string }) {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:'5px 0' }}>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0, paddingTop:2 }}>
        <div style={{ width:14, height:14, borderRadius:99,
          background: done ? T.mint : 'transparent',
          border: done ? 'none' : current ? `2px solid ${T.safety}` : `2px solid ${T.border}`,
          boxShadow: current ? `0 0 0 4px ${T.safetyDim}` : 'none',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          {done && <Ico n="check" s={8} c="#042418" w={3}/>}
          {current && <div style={{ width:5, height:5, borderRadius:99, background:T.safety }}/>}
        </div>
        <div style={{ width:1, flex:1, background:T.borderSoft, minHeight:10, marginTop:2 }}/>
      </div>
      <div style={{ flex:1, paddingBottom:6 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
          <span style={{ fontSize:12, fontWeight:500, color: done ? T.fg : current ? T.safety : T.fg4 }}>{label}</span>
          {time && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3 }}>{time}</span>}
        </div>
        {sub && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color: done||current?T.fg3:T.fg4, marginTop:2, lineHeight:1.5 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── LIVE CHANGE ORDER DEMO ────────────────────────────────────
function ChangeOrderDemo() {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const full = "Per M. Halloran (Turner PM) verbal direction on site, panel B-3 relocated 12' east of drawing position. Additional conduit runs required."
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setStep(0); setTyped('')
      t.push(setTimeout(()=>setStep(1), 500))
      t.push(setTimeout(()=>setStep(2), 1200))
      for(let i=0;i<=full.length;i++) t.push(setTimeout(()=>setTyped(full.slice(0,i)),1400+i*22))
      t.push(setTimeout(()=>setStep(3),4200))
      t.push(setTimeout(()=>setStep(4),5400))
      t.push(setTimeout(()=>setStep(5),6600))
      t.push(setTimeout(()=>{ t.forEach(clearTimeout); run() },9000))
    }
    run()
    return ()=>t.forEach(clearTimeout)
  }, [])

  const card: React.CSSProperties = { background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:'18px', height:'100%', display:'flex', flexDirection:'column', gap:10, fontFamily:"'Space Grotesk',sans-serif" }
  const field = (label:string, val:React.ReactNode, active=false) => (
    <div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.fg4, marginBottom:5 }}>{label}</div>
      <div style={{ padding:'10px 12px', borderRadius:9, border:`1.5px solid ${active?T.safety:T.border}`, background:active?T.safetyDim:T.bgInput, fontSize:12, color:T.fg, transition:'all 0.3s', minHeight:38, lineHeight:1.5 }}>{val}</div>
    </div>
  )

  return (
    <div style={card}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
        <Logo size={16}/>
        <Pill tone="safety">New Change Order</Pill>
      </div>
      {field('Title', "Panel B-3 relocated 12' east", step>=1)}
      {field('What changed?', <>{typed}{step>=2 && typed.length<full.length && <span style={{ borderRight:`2px solid ${T.safety}` }}>&nbsp;</span>}</>, step>=2)}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.fg4, marginBottom:5 }}>Cost impact</div>
          <div style={{ padding:'10px 12px', borderRadius:9, border:`1.5px solid ${step>=3?T.mint:T.border}`, background:step>=3?T.mintDim:T.bgInput, fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color:T.mint, transition:'all 0.3s' }}>{step>=3?'+$4,820':'—'}</div>
        </div>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.fg4, marginBottom:5 }}>Schedule</div>
          <div style={{ padding:'10px 12px', borderRadius:9, border:`1.5px solid ${step>=3?T.danger:T.border}`, background:step>=3?T.dangerDim:T.bgInput, fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color:T.danger, transition:'all 0.3s' }}>{step>=3?'+2 days':'—'}</div>
        </div>
      </div>
      <div style={{ opacity:step>=4?1:0.25, transition:'opacity 0.4s', background:T.safety, borderRadius:10, padding:'11px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:13, fontWeight:600, color:'#0A0E14' }}>
        <Ico n="send" s={14} c="#0A0E14"/> Send for legal approval
      </div>
      {step>=5 && (
        <div style={{ padding:'10px 12px', background:T.mintDim, border:`1px solid ${T.mint}30`, borderRadius:9, display:'flex', alignItems:'center', gap:8 }}>
          <Ico n="check" s={14} c={T.mint}/>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.mint }}>Timestamped approval sent to M. Halloran · Turner Construction</div>
        </div>
      )}
    </div>
  )
}

// ── APPROVED RECEIPT DEMO ─────────────────────────────────────
function ApprovedDemo() {
  const [visible, setVisible] = useState(false)
  useEffect(()=>{ setTimeout(()=>setVisible(true),400) },[])
  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.mint}`, borderRadius:14, padding:20, position:'relative', overflow:'hidden',
      boxShadow:`0 24px 50px -20px rgba(79,227,181,0.3)`,
      opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(12px)', transition:'all 0.6s ease',
      fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ position:'absolute', inset:0, opacity:0.3, pointerEvents:'none',
        background:'repeating-linear-gradient(0deg,transparent 0,transparent 19px,rgba(79,227,181,0.05) 19px,rgba(79,227,181,0.05) 20px),repeating-linear-gradient(90deg,transparent 0,transparent 19px,rgba(79,227,181,0.05) 19px,rgba(79,227,181,0.05) 20px)' }}/>
      <div style={{ position:'absolute', top:14, right:14 }}>
        <div style={{ border:`2px solid ${T.mint}`, borderRadius:6, padding:'3px 10px', transform:'rotate(-3deg)',
          fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, color:T.mint, letterSpacing:'0.1em',
          boxShadow:`0 0 16px ${T.mint}40` }}>
          APPROVED
        </div>
      </div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:T.mint, marginBottom:8 }}>Legally Binding Receipt</div>
      <div style={{ fontSize:17, fontWeight:600, lineHeight:1.3, maxWidth:'72%', marginBottom:4, color:T.fg }}>Panel B-3 relocated 12' east</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3, marginBottom:14 }}>CO-0142 · Turner Casino Tower · JC-7142</div>
      <div style={{ height:1, background:`linear-gradient(to right, ${T.mint}40, transparent)`, marginBottom:14 }}/>
      {[
        {l:'Approved by', v:'Mike Halloran', v2:'PM · Turner Construction'},
        {l:'Timestamp', v:'May 24 · 09:36:08 PDT', v2:'2m 14s after link opened'},
        {l:'IP Address', v:'162.83.41.118', v2:'Las Vegas, NV · iPhone 15'},
        {l:'Cost approved', v:'+$4,820.00', tone:T.mint},
        {l:'Schedule approved', v:'+2 days', tone:T.mint},
      ].map((r,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.borderSoft}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{r.l}</span>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12, fontWeight:500, color:(r as any).tone||T.fg, fontFamily:"'JetBrains Mono',monospace" }}>{r.v}</div>
            {(r as any).v2 && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg3 }}>{(r as any).v2}</div>}
          </div>
        </div>
      ))}
      <div style={{ display:'flex', gap:8, marginTop:14, alignItems:'flex-start' }}>
        <Ico n="fingerprint" s={16} c={T.mint}/>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg3, lineHeight:1.5 }}>SHA-256: 7a3b91…d2f0e4c · Anchored to SubIQ ledger @ block #4,820,114</div>
      </div>
    </div>
  )
}

// ── PERMIT SCAN DEMO ─────────────────────────────────────────
function PermitDemo() {
  const [phase, setPhase] = useState<'scanning'|'done'>('scanning')
  useEffect(()=>{ setTimeout(()=>setPhase('done'),2200) },[])
  const rows = [
    {l:'Permit #', v:'ECL-2024-7821', t:T.mint},
    {l:'Expires', v:'Jun 1, 2026 · 8 days', t:T.warn},
    {l:'Inspector', v:'D. Reyes · ext 4118', t:T.fg},
    {l:'Authority', v:'Clark County', t:T.fg},
    {l:'Conditions', v:'AFCI on all 120v circuits', t:T.safety},
  ]
  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:18, fontFamily:"'Space Grotesk',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.14em', textTransform:'uppercase', color:T.fg3 }}>AI Permit Scanner</div>
        <Pill tone={phase==='done'?'mint':'blueprint'}>{phase==='done'?'Extracted':'Reading...'}</Pill>
      </div>
      <div style={{ aspectRatio:'7/4', background:T.bgElev, borderRadius:9, position:'relative', overflow:'hidden', marginBottom:14, border:`1px solid ${T.border}` }}>
        <div style={{ position:'absolute', inset:10, background:'#F5F2E8', borderRadius:4, padding:12, fontFamily:"'JetBrains Mono',monospace", fontSize:6, lineHeight:1.7, color:'#1A1A1A' }}>
          <div style={{ textAlign:'center', fontWeight:700, fontSize:7, letterSpacing:'0.1em' }}>CLARK COUNTY BUILDING DEPT</div>
          <div style={{ textAlign:'center', opacity:0.6 }}>ELECTRICAL PERMIT</div>
          <div style={{ marginTop:6, borderTop:'1px dashed #00000030', paddingTop:4 }}>
            <div>PERMIT #: <span style={{ background:phase==='done'?'#4FE3B540':'transparent' }}>ECL-2024-7821</span></div>
            <div>EXPIRES: <span style={{ background:phase==='done'?'#FFB02040':'transparent' }}>2026-06-01</span></div>
            <div>PROJECT: Turner Casino Tower</div>
            <div>INSPECTOR: <span style={{ background:phase==='done'?'#4FE3B540':'transparent' }}>D. Reyes (ext 4118)</span></div>
            <div>CONDITIONS: AFCI on all 120v branch circuits</div>
          </div>
        </div>
        {phase==='scanning' && (
          <div style={{ position:'absolute', left:0, right:0, height:24,
            background:`linear-gradient(180deg,transparent,${T.mint}60,transparent)`,
            animation:'scanline 1.6s ease-in-out infinite' }}/>
        )}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
        {rows.map((r,i)=>(
          <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0',
            borderBottom:i<rows.length-1?`1px solid ${T.borderSoft}`:'none',
            opacity:phase==='done'?1:0.2, transition:`opacity 0.4s ease ${i*80}ms` }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{r.l}</span>
            <span style={{ fontSize:12, color:r.t, fontWeight:500 }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── APP PREVIEW (3-PANEL DESKTOP MOCKUP) ─────────────────────
function AppPreview() {
  const [activeScreen, setActiveScreen] = useState<'home'|'co'|'permit'>('home')
  const screens = [
    { id:'home' as const, label:'Protection Score', icon:'shield' },
    { id:'co' as const,   label:'Change Order',     icon:'flag'   },
    { id:'permit' as const, label:'Permit AI',     icon:'scan'  },
  ]
  return (
    <div style={{ background:T.bgPage, border:`1px solid ${T.border}`, borderRadius:20, overflow:'hidden', boxShadow:`0 40px 80px rgba(0,0,0,0.6)` }}>
      {/* Window chrome */}
      <div style={{ background:T.bgDeep, padding:'12px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#FF5F57' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#FEBC2E' }}/>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#28C840' }}/>
        </div>
        <div style={{ flex:1, background:T.bgCard, borderRadius:6, padding:'4px 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, textAlign:'center' }}>
          app.subiq.co/dashboard
        </div>
      </div>
      {/* App layout */}
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr', height:460 }}>
        {/* Sidebar */}
        <div style={{ background:T.bgDeep, borderRight:`1px solid ${T.border}`, padding:'16px 0' }}>
          <div style={{ padding:'0 14px 16px', borderBottom:`1px solid ${T.borderSoft}` }}>
            <Logo size={18}/>
          </div>
          <div style={{ padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 }}>
            {screens.map(s=>(
              <button key={s.id} onClick={()=>setActiveScreen(s.id)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:9,
                border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif",
                background:activeScreen===s.id?T.safetyDim:'transparent',
                color:activeScreen===s.id?T.safety:T.fg3, fontSize:12, fontWeight:activeScreen===s.id?600:400,
                width:'100%', textAlign:'left', transition:'all 0.15s',
              }}>
                <Ico n={s.icon} s={14} c={activeScreen===s.id?T.safety:T.fg3}/>
                {s.label}
              </button>
            ))}
            <div style={{ padding:'8px 10px', marginTop:8, fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.fg4 }}>Case File</div>
            {[{i:'alert',l:'RFI Tracker'},{i:'clock',l:'Delay Log'},{i:'doc',l:'Daily Log'},{i:'archive',l:'Audit Export'}].map(x=>(
              <button key={x.l} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:"'Space Grotesk',sans-serif", background:'transparent', color:T.fg3, fontSize:12, width:'100%', textAlign:'left' }}>
                <Ico n={x.i} s={13} c={T.fg4}/>{x.l}
              </button>
            ))}
          </div>
          {/* Score in sidebar */}
          <div style={{ padding:'14px', borderTop:`1px solid ${T.borderSoft}`, position:'absolute', bottom:0, width:180 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.fg4 }}>CASE STRENGTH</div>
              <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700, color:T.mint }}>87</div>
            </div>
            <div style={{ height:3, background:T.bgElev, borderRadius:99, marginTop:6, overflow:'hidden' }}>
              <div style={{ width:'87%', height:'100%', background:T.mint, borderRadius:99, boxShadow:`0 0 8px ${T.mint}` }}/>
            </div>
          </div>
        </div>
        {/* Main content */}
        <div style={{ padding:20, overflowY:'auto', background:T.bgPage }}>
          {activeScreen==='home' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:T.fg, letterSpacing:'-0.5px' }}>Good morning, John</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3, marginTop:2 }}>Turner Casino Tower · JC-7142 · Las Vegas, NV</div>
                </div>
                <Pill tone="mint">Protected</Pill>
              </div>
              {/* Alerts */}
              <div style={{ padding:'10px 14px', background:T.warnDim, border:`1px solid ${T.warn}30`, borderLeft:`3px solid ${T.warn}`, borderRadius:10 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.warn }}>Electrical permit expires in 8 days</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3, marginTop:2 }}>ECL-2024-7821 · Clark County · Inspector: D. Reyes</div>
              </div>
              <div style={{ padding:'10px 14px', background:T.safetyDim, border:`1px solid ${T.safety}30`, borderLeft:`3px solid ${T.safety}`, borderRadius:10 }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.safety }}>CO-0142 awaiting Turner approval</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg3, marginTop:2 }}>Panel B-3 relocated · $4,820 · +2 days · Sent 14m ago</div>
              </div>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {[{l:'Delay Days',v:'22',c:T.danger},{l:'GC Caused',v:'22d',c:T.danger},{l:'Open RFIs',v:'2',c:T.warn},{l:'Logs / Week',v:'5/5',c:T.mint}].map(s=>(
                  <div key={s.l} style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:10, padding:'12px' }}>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{s.l}</div>
                    <div style={{ fontSize:22, fontWeight:700, color:s.c, letterSpacing:'-1px' }}>{s.v}</div>
                  </div>
                ))}
              </div>
              {/* Timeline */}
              <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:T.fg4, marginBottom:12 }}>Case File Timeline</div>
                <TLStep done label="CO-0142 sent to Turner PM" sub="M. Halloran · $4,820 · +2 days" time="09:14"/>
                <TLStep done label="Daily Log signed" sub="14-day streak · 6 crew · 92°F" time="08:02"/>
                <TLStep done label="RFI-038 overdue" sub="Conduit routing through L3 chase · Day 4" time="May 20"/>
                <TLStep done label="Permit ECL-2024-7821 scanned" sub="Expiry alerts armed · 8 days left" time="May 18"/>
              </div>
            </div>
          )}
          {activeScreen==='co' && <ChangeOrderDemo/>}
          {activeScreen==='permit' && <PermitDemo/>}
        </div>
      </div>
    </div>
  )
}

// ── SCROLL REVEAL ─────────────────────────────────────────────
function Reveal({ children, delay=0 }: { children:React.ReactNode;delay?:number }) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{ if(e.isIntersecting){ setTimeout(()=>setVis(true),delay); obs.disconnect() } },{threshold:0.08})
    if(ref.current) obs.observe(ref.current)
    return ()=>obs.disconnect()
  },[delay])
  return <div ref={ref} style={{ opacity:vis?1:0, transform:vis?'translateY(0)':'translateY(20px)', transition:'opacity 0.7s ease, transform 0.7s ease' }}>{children}</div>
}

// ── COUNTER ───────────────────────────────────────────────────
function Counter({ to, prefix='', suffix='' }: { to:number;prefix?:string;suffix?:string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if(!e.isIntersecting) return
      obs.disconnect()
      const start = Date.now()
      const tick = ()=>{ const p=Math.min((Date.now()-start)/2000,1); setVal(Math.floor(p*to)); if(p<1)requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    })
    if(ref.current) obs.observe(ref.current)
    return ()=>obs.disconnect()
  },[to])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// ── MAIN LANDING PAGE ─────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  const SCENARIOS = [
    { trigger:'GC changed the scope', pain:'Turner called at 2pm and moved the panel 12 feet. You did the work. Now they say they never approved it. You have a text message. They have a lawyer.', win:'You logged the change order in 60 seconds. Sent Turner a timestamped approval link. They clicked it. Legally binding. You get paid.' },
    { trigger:'22 days of GC delays', pain:'Inspectors no-show. Materials held up. Drawing revisions. All GC problems. Now they want to penalize you for being behind schedule.', win:'Every delay logged by cause, date, and days lost. SubIQ generates a Delay Impact Report. You walk into the meeting with proof. They back down.' },
    { trigger:'Permit expires in 8 days', pain:'Nobody told you. The permit was buried in a folder. Now you are facing a stop-work order on a $2.4M job.', win:'SubIQ AI read your permit on day one. It flagged the expiry 30 days out. You renewed. The job never stopped.' },
    { trigger:'$180K retention held hostage', pain:'Job is 95% done. Punch list keeps growing. GC keeps finding reasons not to release your money.', win:'Every punch list item documented with timestamps. Lien waiver log shows exactly what you signed away. You know exactly what you are owed.' },
  ]

  const FEATURES = [
    { tag:'Core', color:T.safety, title:'Change Order Protection', desc:'Log scope changes in 60 seconds. Send the GC a professional approval link. Their click is timestamped and legally binding — they cannot dispute it.' },
    { tag:'Core', color:T.safety, title:'Delay Tracker', desc:'Document every GC-caused delay by date, cause, and days lost. One click generates a dispute-ready PDF report.' },
    { tag:'AI', color:T.blueprint, title:'Permit Scanner', desc:'Upload any permit PDF. Our AI reads every field, flags expiry dates, special conditions, and required inspections automatically.' },
    { tag:'AI', color:T.blueprint, title:'Document Intelligence', desc:'Upload contracts, submittals, blueprints. AI extracts key terms, flags risks, generates RFIs from gaps. Trained on NEC 2020.' },
    { tag:'Legal', color:T.mint, title:'RFI Tracker', desc:'Every question to the GC is on record. Every missed deadline is documented delay you can claim. Overdue RFIs surface automatically.' },
    { tag:'Legal', color:T.mint, title:'Audit Export', desc:'One button generates a legal-grade case file — every delay, CO, RFI, and daily log. The document you bring to arbitration.' },
  ]

  return (
    <div style={{ fontFamily:"'Space Grotesk',sans-serif", background:T.bgDeep, color:T.fg, overflowX:'hidden', minHeight:'100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${T.safety};color:#0A0E14;}
        @keyframes scanline{0%{transform:translateY(-100%);opacity:0}20%{opacity:1}80%{opacity:1}100%{transform:translateY(300%);opacity:0}}
        @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:0.4}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes glow{0%,100%{opacity:0.5}50%{opacity:1}}
        .nav-link{color:${T.fg3};text-decoration:none;font-size:13px;font-weight:500;transition:color 0.15s;}
        .nav-link:hover{color:${T.fg};}
        .feat-card{transition:transform 0.2s,border-color 0.2s;}
        .feat-card:hover{transform:translateY(-3px);border-color:${T.border}!important;}
        .btn-primary{background:${T.safety};color:#0A0E14;border:none;cursor:pointer;font-family:inherit;font-weight:600;display:inline-flex;align-items:center;gap:8px;border-radius:12px;transition:background 0.15s,transform 0.06s;}
        .btn-primary:hover{background:${T.safety2};}
        .btn-primary:active{transform:scale(0.985);}
        .btn-ghost{background:transparent;color:${T.fg2};border:1px solid ${T.border};cursor:pointer;font-family:inherit;font-weight:500;display:inline-flex;align-items:center;gap:8px;border-radius:12px;transition:background 0.15s;}
        .btn-ghost:hover{background:rgba(255,255,255,0.03);}
        .tab-btn{cursor:pointer;font-family:inherit;transition:all 0.2s;}
        /* Responsive */
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .app-preview-wrap{display:none!important;}
          .stats-grid{grid-template-columns:1fr 1fr!important;}
          .features-grid{grid-template-columns:1fr!important;}
          .scenario-grid{grid-template-columns:1fr!important;}
          .competitor-table th:nth-child(n+4),.competitor-table td:nth-child(n+4){display:none!important;}
          .pricing-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
        }
        @media(min-width:769px) and (max-width:1024px){
          .hero-grid{gap:32px!important;}
          .app-preview-wrap{font-size:0.85em;}
          .features-grid{grid-template-columns:1fr 1fr!important;}
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:`${T.bgDeep}ee`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.borderSoft}` }}>
        <div style={{ maxWidth:1140, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:58 }}>
          <Logo size={22}/>
          <div className="nav-links" style={{ display:'flex', gap:28 }}>
            {['How it works','Features','Pricing'].map(l=>(
              <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`} className="nav-link">{l}</a>
            ))}
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Link href="/auth/login" style={{ color:T.fg3, textDecoration:'none', fontSize:13, fontWeight:500 }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding:'8px 18px', fontSize:13, borderRadius:10, textDecoration:'none' }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px 60px', position:'relative', overflow:'hidden' }}>
        {/* Background grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`repeating-linear-gradient(0deg,transparent 0,transparent 39px,rgba(255,255,255,0.025) 39px,rgba(255,255,255,0.025) 40px),repeating-linear-gradient(90deg,transparent 0,transparent 39px,rgba(255,255,255,0.025) 39px,rgba(255,255,255,0.025) 40px)` }}/>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(1000px 600px at 60% 0%,rgba(255,107,31,0.08),transparent 70%),radial-gradient(800px 500px at 10% 80%,rgba(79,227,181,0.05),transparent 60%)` }}/>

        <div style={{ maxWidth:1140, margin:'0 auto', position:'relative' }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
            {/* Left */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:T.safetyDim, border:`1px solid rgba(255,107,31,0.25)`, borderRadius:99, padding:'5px 14px', marginBottom:28 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:T.safety, animation:'pulseDot 1.5s ease-in-out infinite' }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:500, color:T.safety, letterSpacing:'0.12em', textTransform:'uppercase' }}>Built for subs. Not against them.</span>
              </div>

              <h1 style={{ fontSize:'clamp(36px,4.5vw,58px)', fontWeight:700, lineHeight:1.05, letterSpacing:'-2px', marginBottom:22, color:T.fg }}>
                The GC changed<br/>the scope.<br/>
                <span style={{ color:T.safety }}>Do you have proof?</span>
              </h1>

              <p style={{ fontSize:17, color:T.fg3, lineHeight:1.75, marginBottom:32, maxWidth:480 }}>
                SubIQ is the legal protection layer for electrical and plumbing subs. Every change order, delay, RFI, and permit — documented, timestamped, and dispute-ready.
              </p>

              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:36 }}>
                <Link href="/auth/signup" className="btn-primary" style={{ padding:'14px 28px', fontSize:15, borderRadius:12, textDecoration:'none', boxShadow:`0 8px 32px rgba(255,107,31,0.35)` }}>
                  Start building your case file <Ico n="arrow" s={16} c="#0A0E14"/>
                </Link>
                <a href="#how-it-works" className="btn-ghost" style={{ padding:'14px 22px', fontSize:14 }}>See how it works</a>
              </div>

              {/* Proof points */}
              <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                {[{v:'$2M+',l:'in documented disputes'},{v:'60 sec',l:'to log a change order'},{v:'100%',l:'legally timestamped'}].map(s=>(
                  <div key={s.l}>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, color:T.safety, letterSpacing:'-0.5px' }}>{s.v}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — App preview */}
            <div className="app-preview-wrap" style={{ animation:'float 6s ease-in-out infinite' }}>
              <AppPreview/>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────── */}
      <div style={{ background:T.safety, padding:'11px 0', overflow:'hidden' }}>
        <div style={{ display:'flex', animation:'ticker 28s linear infinite', width:'max-content' }}>
          {Array(4).fill(['GC SCOPE CHANGES','DOCUMENTED DELAYS','PERMIT EXPIRY ALERTS','RFI PAPER TRAILS','CHANGE ORDER APPROVALS','LEGAL CASE FILES','RETENTION TRACKING','AUDIT EXPORTS']).flat().map((t,i)=>(
            <span key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'#0A0E14', padding:'0 28px', opacity:0.85 }}>{t} &nbsp; &bull;</span>
          ))}
        </div>
      </div>

      {/* ── SOUND FAMILIAR ───────────────────────────────────── */}
      <section style={{ padding:'100px 24px' }} id="how-it-works">
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.safety, marginBottom:14 }}>The situations that cost you</div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-1.5px', lineHeight:1.1, color:T.fg }}>Sound familiar?</h2>
            </div>
          </Reveal>

          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:36 }}>
            {SCENARIOS.map((s,i)=>(
              <button key={i} className="tab-btn" onClick={()=>setActiveTab(i)} style={{
                padding:'8px 18px', borderRadius:99, border:`1.5px solid ${activeTab===i?T.safety:T.border}`,
                background:activeTab===i?T.safetyDim:'transparent', color:activeTab===i?T.safety:T.fg3,
                fontSize:12, fontWeight:activeTab===i?600:500,
                fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.05em',
              }}>{s.trigger}</button>
            ))}
          </div>

          <Reveal>
            <div className="scenario-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, borderRadius:16, overflow:'hidden', border:`1px solid ${T.border}` }}>
              <div style={{ background:T.bgCard, padding:'36px 32px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:T.danger, marginBottom:14 }}>Without SubIQ</div>
                <h3 style={{ fontSize:20, fontWeight:700, color:T.fg, letterSpacing:'-0.5px', marginBottom:14, lineHeight:1.3 }}>{SCENARIOS[activeTab].trigger}</h3>
                <p style={{ fontSize:14, color:T.fg3, lineHeight:1.8 }}>{SCENARIOS[activeTab].pain}</p>
              </div>
              <div style={{ background:T.bgElev, padding:'36px 32px', borderLeft:`2px solid rgba(79,227,181,0.2)` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.15em', textTransform:'uppercase', color:T.mint, marginBottom:14 }}>With SubIQ</div>
                <h3 style={{ fontSize:20, fontWeight:700, color:T.fg, letterSpacing:'-0.5px', marginBottom:14 }}>You have proof.</h3>
                <p style={{ fontSize:14, color:T.fg2, lineHeight:1.8 }}>{SCENARIOS[activeTab].win}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LIVE DEMO: APPROVED ──────────────────────────────── */}
      <section style={{ padding:'60px 24px 100px', background:T.bgPage }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.mint, marginBottom:14 }}>The moment that matters</div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:700, letterSpacing:'-1.5px', color:T.fg }}>When Turner clicks Approve — it's over.</h2>
            </div>
          </Reveal>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
            <Reveal delay={0}><ChangeOrderDemo/></Reveal>
            <Reveal delay={100}><ApprovedDemo/></Reveal>
            <Reveal delay={200}><PermitDemo/></Reveal>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ padding:'80px 24px', background:T.bgDeep, borderTop:`1px solid ${T.borderSoft}`, borderBottom:`1px solid ${T.borderSoft}` }}>
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
            {[
              {n:2000000,p:'$',s:'+',l:'in documented disputes'},
              {n:14,p:'',s:'d avg',l:'GC delay avoided per job'},
              {n:60,p:'',s:'sec',l:'to log a change order'},
              {n:100,p:'',s:'%',l:'legally timestamped records'},
            ].map((s,i)=>(
              <Reveal key={i} delay={i*80}>
                <div style={{ textAlign:'center', padding:'32px 20px', borderRight:i<3?`1px solid ${T.borderSoft}`:'none' }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:'clamp(32px,4vw,52px)', fontWeight:700, color:T.safety, letterSpacing:'-2px', lineHeight:1, marginBottom:8 }}>
                    {s.p}<Counter to={s.n}/>{s.s}
                  </div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>{s.l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding:'100px 24px' }} id="features">
        <div style={{ maxWidth:1140, margin:'0 auto' }}>
          <Reveal>
            <div style={{ marginBottom:56 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.safety, marginBottom:14 }}>Every tool you need</div>
              <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:700, letterSpacing:'-1.5px', maxWidth:560, color:T.fg }}>Your entire legal protection layer in one place.</h2>
            </div>
          </Reveal>
          <div className="features-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {FEATURES.map((f,i)=>(
              <Reveal key={i} delay={i*60}>
                <div className="feat-card" style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:16, padding:'26px 22px', height:'100%' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', padding:'3px 10px', borderRadius:99, background:`${f.color}20`, color:f.color }}>{f.tag}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.fg, marginBottom:10, letterSpacing:'-0.3px' }}>{f.title}</div>
                  <div style={{ fontSize:13, color:T.fg3, lineHeight:1.75 }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETITOR TABLE ─────────────────────────────────── */}
      <section style={{ padding:'80px 24px 100px', background:T.bgPage }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:48 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.safety, marginBottom:14 }}>Built specifically for subs</div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:700, letterSpacing:'-1.5px', color:T.fg }}>No other tool is built for you.</h2>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div style={{ background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:18, overflow:'hidden' }}>
              <table className="competitor-table" style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${T.borderSoft}` }}>
                    {['Tool','Change Orders','Delay Tracking','Permit AI','RFI Tracker','Audit Export','Price'].map((h,i)=>(
                      <th key={h} style={{ padding:'14px 16px', textAlign:i===0||i===6?'left':'center', fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', color:T.fg4, fontWeight:500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {n:'SubIQ',    p:'$149/mo', co:true,  d:true,  ai:true,  rfi:true,  audit:true,  hl:true},
                    {n:'Procore',  p:'$833+/mo',co:true,  d:false, ai:false, rfi:true,  audit:false, hl:false},
                    {n:'eSUB',     p:'$200+/mo',co:true,  d:false, ai:false, rfi:true,  audit:false, hl:false},
                    {n:'Spreadsheets',p:'Your time',co:false,d:false,ai:false,rfi:false,audit:false,hl:false},
                  ].map((row,i)=>(
                    <tr key={i} style={{ borderBottom:i<3?`1px solid ${T.borderSoft}`:'none', background:row.hl?T.safetyDim:'transparent' }}>
                      <td style={{ padding:'14px 16px', fontSize:14, fontWeight:row.hl?700:500, color:row.hl?T.safety:T.fg2 }}>{row.n}</td>
                      {[row.co,row.d,row.ai,row.rfi,row.audit].map((v,j)=>(
                        <td key={j} style={{ padding:'14px 8px', textAlign:'center' }}>
                          {v ? <div style={{ width:18,height:18,borderRadius:'50%',background:T.mint,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto' }}><Ico n="check" s={9} c="#042418" w={3}/></div>
                             : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, color:T.fg4 }}>—</span>}
                        </td>
                      ))}
                      <td style={{ padding:'14px 16px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:12, fontWeight:600, color:row.hl?T.mint:T.fg4 }}>{row.p}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section style={{ padding:'100px 24px' }} id="pricing">
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <Reveal>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.safety, marginBottom:14 }}>Simple pricing</div>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:700, letterSpacing:'-1.5px', marginBottom:52, color:T.fg }}>Less than one hour of lost work.</h2>
          </Reveal>
          <div className="pricing-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              { name:'Starter', price:'$149', desc:'Individual subs and small crews', features:['Unlimited change orders','Delay tracker','RFI tracker','Daily log','Permit scanner','Email support'], hl:false },
              { name:'Pro', price:'$299', desc:'Growing subcontracting operations', features:['Everything in Starter','AI document intelligence','Audit export + case file','GC approval email flow','Weekly digest reports','Priority support'], hl:true },
            ].map((p,i)=>(
              <Reveal key={i} delay={i*100}>
                <div style={{ background:p.hl?T.bgElev:T.bgCard, border:`1px solid ${p.hl?T.safety+'40':T.borderSoft}`, borderRadius:18, padding:'32px 28px', textAlign:'left', position:'relative' }}>
                  {p.hl && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:T.safety, color:'#0A0E14', fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, padding:'4px 16px', borderRadius:99, letterSpacing:'0.1em', textTransform:'uppercase' }}>Most Popular</div>}
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>{p.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:48, fontWeight:700, letterSpacing:'-2px', color:T.fg }}>{p.price}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:T.fg4 }}>/month</span>
                  </div>
                  <div style={{ fontSize:13, color:T.fg3, marginBottom:24 }}>{p.desc}</div>
                  {p.features.map((f,j)=>(
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <Ico n="check" s={14} c={T.mint} w={2.5}/>
                      <span style={{ fontSize:13, color:T.fg2 }}>{f}</span>
                    </div>
                  ))}
                  <Link href="/auth/signup" className={p.hl?"btn-primary":"btn-ghost"} style={{ display:'block', marginTop:28, padding:'13px', fontSize:14, borderRadius:11, textAlign:'center', textDecoration:'none', width:'100%' }}>
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding:'120px 24px', textAlign:'center', borderTop:`1px solid ${T.borderSoft}`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(800px 500px at 50% 0%,rgba(255,107,31,0.08),transparent 70%)` }}/>
        <Reveal>
          <div style={{ maxWidth:680, margin:'0 auto', position:'relative' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, letterSpacing:'0.15em', textTransform:'uppercase', color:T.safety, marginBottom:20 }}>Stop losing disputes</div>
            <h2 style={{ fontSize:'clamp(32px,5vw,60px)', fontWeight:700, letterSpacing:'-2.5px', lineHeight:1.05, marginBottom:22, color:T.fg }}>
              Every day without SubIQ, the GC wins by default.
            </h2>
            <p style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontStyle:'italic', fontSize:20, color:T.fg3, marginBottom:40, lineHeight:1.7 }}>
              Your case file starts building the moment you sign up. The more you log, the stronger your protection.
            </p>
            <Link href="/auth/signup" className="btn-primary" style={{ padding:'17px 44px', fontSize:16, borderRadius:14, textDecoration:'none', boxShadow:`0 8px 40px rgba(255,107,31,0.4)` }}>
              Start building your case file <Ico n="arrow" s={18} c="#0A0E14"/>
            </Link>
            <div style={{ marginTop:18, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>No credit card required. 14-day free trial.</div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding:'36px 24px', borderTop:`1px solid ${T.borderSoft}`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <Logo size={20}/>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>2025 SubIQ. Built for subs. Not against them.</div>
        <div style={{ display:'flex', gap:20 }}>
          {['Privacy','Terms'].map(l=>(
            <a key={l} href="#" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, textDecoration:'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}

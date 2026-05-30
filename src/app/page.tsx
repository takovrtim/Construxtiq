'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const T = {
  bg:'#07090E', bgCard:'#131A26', bgElev:'#1A2333',
  border:'#232E42', borderSoft:'rgba(255,255,255,0.06)',
  fg:'#F1EEE5', fg2:'#B6BCCB', fg3:'#7B8497', fg4:'#545B6C',
  orange:'#FF6B1F', orangeDim:'rgba(255,107,31,0.10)',
  mint:'#4FE3B5', mintDim:'rgba(79,227,181,0.10)',
  danger:'#FF5260',
}

function Reveal({ children, delay=0 }: { children:React.ReactNode; delay?:number }) {
  const [v, setV] = useState(false)
  const r = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const o = new IntersectionObserver(([e])=>{ if(e.isIntersecting){ setTimeout(()=>setV(true),delay); o.disconnect() } },{threshold:0.1})
    if(r.current) o.observe(r.current)
    return ()=>o.disconnect()
  },[delay])
  return <div ref={r} style={{ opacity:v?1:0, transform:v?'translateY(0)':'translateY(18px)', transition:'opacity 0.6s ease,transform 0.6s ease' }}>{children}</div>
}

// ── LIVE BID SCORE DEMO ───────────────────────────────────────
function BidScoreDemo() {
  const [step, setStep] = useState(0)
  useEffect(()=>{
    const t = [
      setTimeout(()=>setStep(1),600),
      setTimeout(()=>setStep(2),1400),
      setTimeout(()=>setStep(3),2200),
      setTimeout(()=>setStep(4),3000),
      setTimeout(()=>setStep(5),3800),
    ]
    return ()=>t.forEach(clearTimeout)
  },[])

  const score = step>=5?82:step>=4?60:step>=3?30:0
  const r=44, c=2*Math.PI*r
  const dash=(score/100)*c

  return (
    <div style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:16, padding:24, fontFamily:"'Space Grotesk',sans-serif" }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.orange, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:4 }}>Bid Intelligence</div>
          <div style={{ fontSize:14, fontWeight:700, color:T.fg }}>Hardrock Tower — Electrical</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4 }}>Turner Construction · Las Vegas, NV</div>
        </div>
        <div style={{ position:'relative', width:100, height:100, flexShrink:0 }}>
          <svg width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
            <circle cx="50" cy="50" r={r} fill="none" stroke={score>=75?T.mint:score>=50?'#FFB020':T.danger} strokeWidth="7"
              strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
              style={{ transition:'stroke-dasharray 0.8s ease', filter:`drop-shadow(0 0 6px ${score>=75?T.mint:'#FFB020'})` }}/>
          </svg>
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:26, fontWeight:700, color:T.fg, letterSpacing:'-1px', lineHeight:1 }}>{score}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:T.fg4, textTransform:'uppercase' }}>Score</div>
          </div>
        </div>
      </div>

      {/* Streaming results */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {[
          { show:step>=2, color:T.mint,   icon:'↑', text:'Win probability: 74% — bid is competitive' },
          { show:step>=3, color:'#FFB020', icon:'!', text:'Missing: temporary power allowance ($8,200)' },
          { show:step>=4, color:T.mint,   icon:'↑', text:'Market range: $847K–$1.1M — you\'re in range' },
          { show:step>=5, color:'#FFB020', icon:'!', text:'Turner rejects bids without unit pricing breakdown' },
        ].map((item,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:T.bgElev, borderRadius:9, opacity:item.show?1:0, transform:item.show?'translateY(0)':'translateY(6px)', transition:'all 0.4s ease' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:`${item.color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:item.color }}>
              {item.icon}
            </div>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg2 }}>{item.text}</span>
          </div>
        ))}
      </div>

      {step>=5 && (
        <div style={{ marginTop:12, padding:'10px 14px', background:T.orangeDim, border:`1px solid ${T.orange}30`, borderRadius:10 }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, fontWeight:600 }}>
            Fix 2 items → win probability jumps to 89%
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0)

  const PROBLEMS = [
    {
      trigger: 'GC changed the scope',
      before: 'Turner told you verbally to move the panel. You moved it. Now they deny it ever happened. You have a text. They have a lawyer. You lose $40K.',
      after: 'You captured the directive in 10 seconds. SubIQ auto-emailed Turner\'s PM asking for confirmation. Their silence is legally documented. You get paid.',
    },
    {
      trigger: 'Bidding blind',
      before: 'You spent 60 hours on a bid. Submitted $920K. Someone bid $871K. You never found out why you lost. You did this 8 times this quarter.',
      after: 'SubIQ scored your bid before you submitted. Flagged you were 6% above the winning range. You adjusted. You won.',
    },
    {
      trigger: 'GC caused 22 delay days',
      before: 'Inspectors no-show. Materials held up. Drawing revisions. All Turner\'s fault. Now they want to penalize you for being behind. You have no proof.',
      after: 'Every delay logged by cause and date. SubIQ generates a delay impact report. You walk into the meeting with a case file. They back down.',
    },
    {
      trigger: 'Permit expired mid-job',
      before: 'Nobody tracked it. It expired while you were in the walls. Stop-work order on a $2M job. $180K in penalties. Total blindside.',
      after: 'SubIQ read your permit on day one. Sent you an alert 30 days out, 7 days out, 1 day out. You renewed. The job never stopped.',
    },
  ]

  const FEATURES = [
    {
      tag:'Intelligence', color:T.orange,
      title:'Bid Score',
      desc:'Upload any bid. Get win probability, market range, risk flags, and exactly what\'s missing — in 30 seconds.',
    },
    {
      tag:'Intelligence', color:T.orange,
      title:'Opportunity Hunter',
      desc:'SubIQ monitors county permits, BuildingConnected, and PlanHub. You get alerts on jobs before they go to bid.',
    },
    {
      tag:'Intelligence', color:T.orange,
      title:'Bid Builder',
      desc:'Describe the scope. AI generates a complete, professional bid document with line items in 60 seconds — not 60 hours.',
    },
    {
      tag:'Protection', color:T.mint,
      title:'Verbal Directive Capture',
      desc:'GC gave you a verbal order on site. Record it in 10 seconds. SubIQ auto-emails the GC asking for confirmation. Their silence is proof.',
    },
    {
      tag:'Protection', color:T.mint,
      title:'Change Order Clock',
      desc:'When you submit a CO, a countdown starts based on the contract window. When it expires, SubIQ sends an automatic legal notice.',
    },
    {
      tag:'Protection', color:T.mint,
      title:'Audit Export',
      desc:'One click generates a legal-grade case file — every delay, CO, RFI, and daily log. The document you bring to arbitration.',
    },
  ]

  return (
    <div style={{ background:T.bg, color:T.fg, fontFamily:"'Space Grotesk',-apple-system,sans-serif", overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::selection{background:${T.orange};color:#0A0E14;}
        a{color:inherit;text-decoration:none;}
        .btn-primary{background:${T.orange};color:#0A0E14;border:none;cursor:pointer;font-family:inherit;font-weight:700;display:inline-flex;align-items:center;gap:8px;transition:all 0.15s;}
        .btn-primary:hover{background:#FF8F4D;transform:translateY(-1px);}
        .btn-ghost{background:transparent;color:${T.fg3};border:1px solid ${T.border};cursor:pointer;font-family:inherit;font-weight:500;display:inline-flex;align-items:center;gap:8px;transition:all 0.15s;}
        .btn-ghost:hover{border-color:${T.fg3};color:${T.fg};}
        .feat-card{transition:border-color 0.2s,transform 0.2s;}
        .feat-card:hover{border-color:${T.border}!important;transform:translateY(-2px);}
        .tab-btn{cursor:pointer;font-family:inherit;transition:all 0.15s;border:none;}
        @media(max-width:768px){
          .hero-grid{grid-template-columns:1fr!important;}
          .demo-col{display:none!important;}
          .feat-grid{grid-template-columns:1fr!important;}
          .price-grid{grid-template-columns:1fr!important;}
          .nav-links{display:none!important;}
          .hero-h1{font-size:clamp(34px,8vw,52px)!important;}
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:`${T.bg}ee`, backdropFilter:'blur(20px)', borderBottom:`1px solid ${T.borderSoft}`, padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:9 }}>
            <svg viewBox="0 0 24 24" width={26} height={26}>
              <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill={T.orange} stroke={T.orange} strokeWidth="1.2"/>
              <path d="m8 12 3 3 5-6" fill="none" stroke="#07090E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.5px' }}>Sub<span style={{ color:T.orange }}>IQ</span></span>
          </Link>
          <div className="nav-links" style={{ display:'flex', gap:28 }}>
            {[['#problem','How it works'],['#features','Features'],['#pricing','Pricing']].map(([h,l])=>(
              <a key={h} href={h} style={{ fontSize:13, fontWeight:500, color:T.fg3, transition:'color 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.color=T.fg)}
                onMouseLeave={e=>(e.currentTarget.style.color=T.fg3)}
              >{l}</a>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Link href="/auth/login" style={{ fontSize:13, fontWeight:500, color:T.fg3, padding:'7px 12px' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding:'9px 20px', fontSize:13, borderRadius:10 }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding:'90px 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(900px 600px at 70% 0%,rgba(255,107,31,0.07),transparent 60%),radial-gradient(600px 400px at 10% 90%,rgba(79,227,181,0.04),transparent 60%)` }}/>
        {/* Blueprint grid */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.4,
          backgroundImage:`linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
          backgroundSize:'40px 40px' }}/>

        <div style={{ maxWidth:1100, margin:'0 auto', position:'relative' }}>
          <div className="hero-grid" style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:72, alignItems:'center' }}>

            {/* Left */}
            <div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:T.orangeDim, border:`1px solid rgba(255,107,31,0.2)`, borderRadius:99, padding:'5px 14px', marginBottom:28 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:T.orange, boxShadow:`0 0 8px ${T.orange}` }}/>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  Construction Intelligence
                </span>
              </div>

              <h1 className="hero-h1" style={{ fontSize:'clamp(38px,4.5vw,60px)', fontWeight:700, lineHeight:1.05, letterSpacing:'-2.5px', marginBottom:24, color:T.fg }}>
                Win more work.<br/>
                <span style={{ color:T.orange }}>Protect what</span><br/>
                you win.
              </h1>

              <p style={{ fontSize:17, color:T.fg3, lineHeight:1.75, marginBottom:36, maxWidth:460 }}>
                SubIQ is the Bloomberg Terminal for subcontractors. Score bids before you submit. Find jobs before they go public. Build your legal case file automatically.
              </p>

              <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:40 }}>
                <Link href="/auth/signup" className="btn-primary" style={{ padding:'14px 30px', fontSize:15, borderRadius:12, boxShadow:`0 8px 28px rgba(255,107,31,0.35)` }}>
                  Start for free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <a href="#problem" className="btn-ghost" style={{ padding:'14px 22px', fontSize:14, borderRadius:12 }}>
                  See how it works
                </a>
              </div>

              {/* 3 stats */}
              <div style={{ display:'flex', gap:28, flexWrap:'wrap', paddingTop:28, borderTop:`1px solid ${T.borderSoft}` }}>
                {[
                  { n:'30s', l:'bid scored' },
                  { n:'60s', l:'change order logged' },
                  { n:'100%', l:'legally timestamped' },
                ].map(s=>(
                  <div key={s.l}>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:24, fontWeight:700, color:T.orange, letterSpacing:'-0.5px', lineHeight:1 }}>{s.n}</div>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Live demo */}
            <div className="demo-col">
              <div style={{ position:'relative' }}>
                {/* Browser chrome */}
                <div style={{ background:'#0F1521', border:`1px solid ${T.border}`, borderRadius:16, overflow:'hidden', boxShadow:`0 32px 64px rgba(0,0,0,0.6)` }}>
                  <div style={{ background:T.bg, padding:'10px 16px', display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ display:'flex', gap:5 }}>
                      {['#FF5F57','#FEBC2E','#28C840'].map(c=>(
                        <div key={c} style={{ width:10, height:10, borderRadius:'50%', background:c }}/>
                      ))}
                    </div>
                    <div style={{ flex:1, background:T.bgCard, borderRadius:6, padding:'3px 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, textAlign:'center' }}>
                      app.subiq.co/bids
                    </div>
                  </div>
                  <div style={{ padding:20 }}>
                    <BidScoreDemo/>
                  </div>
                </div>
                {/* Floating badge */}
                <div style={{ position:'absolute', bottom:-16, right:-16, background:T.mint, borderRadius:12, padding:'10px 16px', boxShadow:`0 8px 24px rgba(79,227,181,0.4)` }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'#042418', fontWeight:700 }}>Win rate +34%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM ──────────────────────────────────────────── */}
      <section id="problem" style={{ padding:'90px 24px', background:T.bgCard, borderTop:`1px solid ${T.borderSoft}` }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <Reveal>
            <div style={{ textAlign:'center', marginBottom:52 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:12 }}>Sound Familiar</div>
              <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-1.5px', color:T.fg }}>Every sub faces the same four problems.</h2>
            </div>
          </Reveal>

          {/* Tab selector */}
          <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap', marginBottom:36 }}>
            {PROBLEMS.map((p,i)=>(
              <button key={i} className="tab-btn" onClick={()=>setActiveTab(i)} style={{
                padding:'8px 16px', borderRadius:99, fontSize:12, fontWeight:activeTab===i?700:500,
                border:`1.5px solid ${activeTab===i?T.orange:T.border}`,
                background:activeTab===i?T.orangeDim:'transparent',
                color:activeTab===i?T.orange:T.fg3,
                fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em',
              }}>{p.trigger}</button>
            ))}
          </div>

          <Reveal>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2, borderRadius:16, overflow:'hidden' }}>
              <div style={{ background:'#0F0A0A', padding:'36px 32px', borderRight:`2px solid rgba(255,82,96,0.15)` }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.danger, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:14 }}>Without SubIQ</div>
                <p style={{ fontSize:15, color:T.fg3, lineHeight:1.85 }}>{PROBLEMS[activeTab].before}</p>
              </div>
              <div style={{ background:'#071210', padding:'36px 32px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:T.mint, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:14 }}>With SubIQ</div>
                <p style={{ fontSize:15, color:T.fg2, lineHeight:1.85 }}>{PROBLEMS[activeTab].after}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding:'90px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <Reveal>
            <div style={{ marginBottom:52 }}>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:12 }}>Everything in one place</div>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
                <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-1.5px', color:T.fg, maxWidth:480 }}>
                  Win more work.<br/>Get paid for all of it.
                </h2>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'4px 12px', borderRadius:20, background:T.orangeDim, color:T.orange }}>Intelligence</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, padding:'4px 12px', borderRadius:20, background:T.mintDim, color:T.mint }}>Protection</span>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="feat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {FEATURES.map((f,i)=>(
              <Reveal key={i} delay={i*50}>
                <div className="feat-card" style={{ background:T.bgCard, border:`1px solid ${T.borderSoft}`, borderRadius:14, padding:'24px 22px', height:'100%' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, padding:'3px 9px', borderRadius:99, background:`${f.color}15`, color:f.color, textTransform:'uppercase', letterSpacing:'0.08em' }}>{f.tag}</span>
                  </div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.fg, marginBottom:10, letterSpacing:'-0.3px' }}>{f.title}</div>
                  <div style={{ fontSize:13, color:T.fg3, lineHeight:1.75 }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── VS OTHERS ────────────────────────────────────────── */}
      <section style={{ padding:'72px 24px', background:T.bgCard, borderTop:`1px solid ${T.borderSoft}` }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <Reveal>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:32 }}>
              How we compare
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                {
                  label:'Every Other Tool',
                  color:T.danger,
                  items:['File storage','Document management','Built for GCs','$833+/month (Procore)','Tells you what happened'],
                  dark:true,
                },
                {
                  label:'SubIQ',
                  color:T.mint,
                  items:['Bid Intelligence','Legal case file','Built for subs','$149/month','Tells you what to do next'],
                  dark:false,
                },
              ].map(col=>(
                <div key={col.label} style={{ background:col.dark?'rgba(255,82,96,0.04)':'rgba(79,227,181,0.04)', border:`1px solid ${col.color}20`, borderRadius:14, padding:'24px 22px', textAlign:'left' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:700, color:col.color, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:18 }}>{col.label}</div>
                  {col.items.map((item,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background:`${col.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {col.dark
                          ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke={col.color} strokeWidth="2.5" strokeLinecap="round"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-9" stroke={col.color} strokeWidth="2.5" strokeLinecap="round"/></svg>
                        }
                      </div>
                      <span style={{ fontSize:13, color:col.dark?T.fg3:T.fg2 }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding:'90px 24px' }}>
        <div style={{ maxWidth:780, margin:'0 auto', textAlign:'center' }}>
          <Reveal>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.orange, textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:12 }}>Pricing</div>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,42px)', fontWeight:700, letterSpacing:'-1.5px', marginBottom:14, color:T.fg }}>Less than one hour of lost work.</h2>
            <p style={{ fontSize:15, color:T.fg3, marginBottom:48 }}>Every plan includes a 14-day free trial. No credit card required.</p>
          </Reveal>

          <div className="price-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            {[
              {
                name:'Starter', price:'$149', period:'/mo',
                desc:'For individual subs and small crews',
                features:['Bid Score — upload and score any bid','Opportunity alerts in your market','Change order + GC approval link','Delay tracker + RFI tracker','Permit scanner with AI extraction','Daily log + audit export'],
                hl:false,
              },
              {
                name:'Pro', price:'$299', period:'/mo',
                desc:'For growing subcontracting businesses',
                features:['Everything in Starter','Bid Builder — AI generates your bid','Verbal directive capture + auto-email','Contract risk scanner','Settlement calculator','GC reputation intelligence'],
                hl:true,
              },
            ].map((p,i)=>(
              <Reveal key={i} delay={i*100}>
                <div style={{ background:p.hl?'rgba(79,227,181,0.04)':T.bgCard, border:`1px solid ${p.hl?T.mint+'30':T.borderSoft}`, borderRadius:18, padding:'32px 28px', textAlign:'left', position:'relative' }}>
                  {p.hl && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:T.mint, color:'#042418', fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:700, padding:'4px 16px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>Most Popular</div>}
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:T.fg4, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>{p.name}</div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:8 }}>
                    <span style={{ fontSize:48, fontWeight:700, letterSpacing:'-2px', color:T.fg }}>{p.price}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12, color:T.fg4 }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize:13, color:T.fg3, marginBottom:24 }}>{p.desc}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:28 }}>
                    {p.features.map((f,j)=>(
                      <div key={j} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                        <div style={{ width:14, height:14, borderRadius:'50%', background:T.mintDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-9" stroke={T.mint} strokeWidth="2.5" strokeLinecap="round"/></svg>
                        </div>
                        <span style={{ fontSize:13, color:T.fg2, lineHeight:1.5 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/auth/signup" style={{ display:'block', padding:'13px', fontSize:14, fontWeight:700, borderRadius:11, textAlign:'center', background:p.hl?T.mint:T.bgElev, color:p.hl?'#042418':T.fg, border:p.hl?'none':`1px solid ${T.border}`, transition:'all 0.15s' }}>
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{ padding:'100px 24px', textAlign:'center', borderTop:`1px solid ${T.borderSoft}`, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:`radial-gradient(600px 400px at 50% 100%,rgba(255,107,31,0.07),transparent 70%)`, pointerEvents:'none' }}/>
        <Reveal>
          <div style={{ maxWidth:580, margin:'0 auto', position:'relative' }}>
            <h2 style={{ fontSize:'clamp(32px,5vw,56px)', fontWeight:700, letterSpacing:'-2.5px', lineHeight:1.08, marginBottom:20, color:T.fg }}>
              Stop guessing.<br/>Start winning.
            </h2>
            <p style={{ fontSize:16, color:T.fg3, marginBottom:36, lineHeight:1.75 }}>
              Your first bid score is free. Your first protected change order takes 60 seconds. The case file builds itself from day one.
            </p>
            <Link href="/auth/signup" className="btn-primary" style={{ padding:'16px 40px', fontSize:16, borderRadius:13, boxShadow:`0 8px 32px rgba(255,107,31,0.4)` }}>
              Get started free — no credit card
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <div style={{ marginTop:16, fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>
              14-day free trial · Cancel anytime · Takes 2 minutes to set up
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding:'32px 24px', borderTop:`1px solid ${T.borderSoft}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <svg viewBox="0 0 24 24" width={22} height={22}>
            <path d="M12 2 3 5v6.5C3 16.5 6.5 20 12 22c5.5-2 9-5.5 9-10.5V5l-9-3Z" fill={T.orange} stroke={T.orange} strokeWidth="1.2"/>
            <path d="m8 12 3 3 5-6" fill="none" stroke="#07090E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.3px' }}>Sub<span style={{ color:T.orange }}>IQ</span></span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4, marginLeft:8 }}>Win more. Protect more.</span>
        </div>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:T.fg4 }}>2026 SubIQ</div>
      </footer>
    </div>
  )
}

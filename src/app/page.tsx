'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── DESIGN SYSTEM ─────────────────────────────────────────────
// Editorial / financial terminal aesthetic
// Cream background, near-black text, electric amber accent
// Fonts: Instrument Serif (display) + DM Mono (data) + Geist (body)
const C = {
  cream:    '#FAF9F6',
  paper:    '#F4F2ED',
  ink:      '#0E0E0C',
  ink2:     '#3A3A36',
  ink3:     '#6B6B63',
  ink4:     '#9B9B91',
  amber:    '#E8A020',
  amberDim: 'rgba(232,160,32,0.12)',
  amberBr:  'rgba(232,160,32,0.3)',
  green:    '#1A7A45',
  greenDim: 'rgba(26,122,69,0.1)',
  red:      '#C0392B',
  redDim:   'rgba(192,57,43,0.1)',
  blue:     '#1A3A8F',
  blueDim:  'rgba(26,58,143,0.1)',
  border:   'rgba(14,14,12,0.1)',
  borderMd: 'rgba(14,14,12,0.18)',
}

// ── BID SCORE DEMO ────────────────────────────────────────────
function BidScoreDemo() {
  const [phase, setPhase] = useState<'idle'|'analyzing'|'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [score, setScore] = useState(0)

  function run() {
    setPhase('analyzing'); setProgress(0); setScore(0)
    let p = 0
    const iv = setInterval(() => {
      p += Math.random() * 9 + 3
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { setPhase('done'); animScore() }, 300) }
      setProgress(p)
    }, 120)
  }

  function animScore() {
    let s = 0
    const iv = setInterval(() => {
      s += 3
      if (s >= 74) { clearInterval(iv); setScore(74) }
      else setScore(s)
    }, 18)
  }

  const checks = [
    { label: 'Union wage rates verified', ok: true },
    { label: 'Material escalation included', ok: true },
    { label: 'Permit fees accounted', ok: true },
    { label: 'Bonding requirement noted', ok: false, flag: 'Missing: Performance bond 100% contract value' },
    { label: 'Prevailing wage clause', ok: false, flag: 'Clark County project — prevailing wage applies' },
  ]

  return (
    <div style={{ background: C.cream, border: `1px solid ${C.borderMd}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(14,14,12,0.12)', fontFamily: "'DM Mono', monospace" }}>
      {/* Terminal bar */}
      <div style={{ background: C.ink, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
        </div>
        <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>subiq — bid intelligence terminal</span>
      </div>

      <div style={{ padding: '24px 24px 20px' }}>
        {/* Upload zone */}
        <div style={{ border: `2px dashed ${phase === 'idle' ? C.border : C.amber}`, borderRadius: 12, padding: '20px', marginBottom: 18, textAlign: 'center', background: phase !== 'idle' ? C.amberDim : 'transparent', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.ink3, marginBottom: 8 }}>
            {phase === 'idle' ? 'Bid Document' : phase === 'analyzing' ? 'Analyzing...' : 'Analysis Complete'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink2, marginBottom: phase === 'idle' ? 12 : 0 }}>
            {phase === 'idle' ? 'Hardrock Tower — Electrical Rough-In.pdf' : 'Hardrock Tower — Electrical Rough-In.pdf'}
          </div>
          {phase === 'idle' && (
            <button onClick={run} style={{ marginTop: 4, padding: '8px 20px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1.5px solid ${C.ink}`, background: C.ink, color: C.cream, fontFamily: 'inherit', letterSpacing: '0.05em' }}>
              Score This Bid
            </button>
          )}
          {phase === 'analyzing' && (
            <div style={{ height: 4, background: C.border, borderRadius: 99, overflow: 'hidden', marginTop: 10 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: C.amber, borderRadius: 99, transition: 'width 0.1s' }}/>
            </div>
          )}
        </div>

        {phase === 'done' && (
          <>
            {/* Score */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ gridColumn: '1', background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink4, marginBottom: 8 }}>Win Score</div>
                <div style={{ fontSize: 40, fontWeight: 700, color: C.amber, letterSpacing: '-2px', lineHeight: 1, fontFamily: "'Instrument Serif', serif" }}>{score}</div>
                <div style={{ fontSize: 9, color: C.ink4, marginTop: 4 }}>out of 100</div>
              </div>
              <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink4, marginBottom: 8 }}>Winning Range</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: '-0.5px' }}>$89K–$97K</div>
                <div style={{ fontSize: 10, color: C.ink4, marginTop: 3 }}>Your bid: $94,200</div>
              </div>
              <div style={{ background: C.paper, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 14px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink4, marginBottom: 8 }}>Margin</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, letterSpacing: '-0.5px' }}>18.4%</div>
                <div style={{ fontSize: 10, color: C.ink4, marginTop: 3 }}>Market avg: 14.1%</div>
              </div>
            </div>

            {/* Checks */}
            <div style={{ marginBottom: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.ink4, marginBottom: 10 }}>Bid Analysis</div>
              {checks.map((c, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.ok ? C.greenDim : C.redDim, border: `1px solid ${c.ok ? C.green : C.red}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 8, color: c.ok ? C.green : C.red }}>{c.ok ? '✓' : '!'}</span>
                    </div>
                    <span style={{ fontSize: 11, color: c.ok ? C.ink2 : C.red, fontWeight: c.ok ? 400 : 600 }}>{c.label}</span>
                  </div>
                  {c.flag && <div style={{ marginLeft: 22, marginTop: 3, fontSize: 10, color: C.red, fontStyle: 'italic' }}>{c.flag}</div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── MARKET TICKER ─────────────────────────────────────────────
function MarketTicker() {
  const items = [
    { label: 'ELEC · LAS VEGAS', val: '$89K–$97K', dir: 'up' },
    { label: 'PLMB · LAS VEGAS', val: '$62K–$71K', dir: 'up' },
    { label: 'ELEC · HENDERSON', val: '$74K–$83K', dir: 'down' },
    { label: 'MECH · CLARK CO.',  val: '$118K–$134K', dir: 'up' },
    { label: 'WIN RATE · ELEC',   val: '31%',     dir: 'neutral' },
    { label: 'AVG MARGIN',        val: '14.1%',   dir: 'up' },
    { label: 'BIDS THIS WEEK',    val: '247',     dir: 'up' },
    { label: 'ACTIVE PROJECTS',   val: '1,842',   dir: 'up' },
  ]
  return (
    <div style={{ background: C.ink, padding: '10px 0', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', animation: 'ticker 40s linear infinite', width: 'max-content', gap: 0 }}>
        {[...items,...items,...items,...items].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 28px', borderRight: `1px solid rgba(255,255,255,0.08)` }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>{item.label}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600, color: item.dir === 'up' ? '#4ADE80' : item.dir === 'down' ? '#F87171' : C.amber }}>{item.val}</span>
            <span style={{ fontSize: 10, color: item.dir === 'up' ? '#4ADE80' : item.dir === 'down' ? '#F87171' : 'rgba(255,255,255,0.3)' }}>{item.dir === 'up' ? '▲' : item.dir === 'down' ? '▼' : '—'}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-25%)}}`}</style>
    </div>
  )
}

// ── COUNTER ───────────────────────────────────────────────────
function Counter({ to, prefix='', suffix='' }: { to: number; prefix?: string; suffix?: string }) {
  const [v, setV] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const t = Date.now()
      const tick = () => { const p = Math.min((Date.now()-t)/2000,1); setV(Math.floor(p*to)); if(p<1)requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>
}

// ── REVEAL ────────────────────────────────────────────────────
function Reveal({ children, delay=0, dir='up' }: { children: React.ReactNode; delay?: number; dir?: 'up'|'left'|'right' }) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting){setTimeout(()=>setVis(true),delay);obs.disconnect()} },{threshold:0.08})
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])
  const t = vis?'translate(0,0)':dir==='left'?'translate(-24px,0)':dir==='right'?'translate(24px,0)':'translate(0,20px)'
  return <div ref={ref} style={{ opacity:vis?1:0, transform:t, transition:'opacity 0.7s ease, transform 0.7s ease' }}>{children}</div>
}

// ── MAIN PAGE ─────────────────────────────────────────────────
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [hovered, setHovered] = useState<number|null>(null)

  const problems = [
    { q: 'What should I bid?', a: 'SubIQ tells you the winning range in your market before you submit.' },
    { q: 'Will I win this job?', a: 'Your bid score predicts win probability in 30 seconds.' },
    { q: 'Am I making money?', a: 'Margin forecasting shows if a job is worth taking before you start.' },
    { q: 'What did the GC approve?', a: 'Every verbal directive captured, timestamped, and sent back for confirmation.' },
  ]

  const intelligence = [
    { tag: 'BID', color: C.amber,   title: 'Bid Score',           desc: 'Upload any bid. Get win probability, market range comparison, risk flags, and missing requirements in 30 seconds.' },
    { tag: 'MKT', color: C.blue,    title: 'Market Intelligence',  desc: 'See what bids are winning in your trade and market. Know the range before you submit a number.' },
    { tag: 'CASH',color: C.green,   title: 'Cash Flow Forecast',   desc: 'Model payment timelines, retention release, and working capital before you commit to a job.' },
    { tag: 'RISK', color: C.red,    title: 'Contract Risk Score',  desc: 'Upload any contract. AI flags pay-if-paid clauses, short notice windows, and liquidated damages before you sign.' },
    { tag: 'FIELD',color: C.ink,    title: 'Verbal Directive Capture', desc: 'Record what the GC says on site. SubIQ transcribes it and sends an automated confirmation email within 60 seconds.' },
    { tag: 'LEGAL',color: C.green,  title: 'Settlement Calculator', desc: 'When a dispute happens, SubIQ calculates exactly what you\'re owed from every logged delay, CO, and RFI.' },
  ]

  return (
    <div style={{ fontFamily: "'Geist', 'DM Sans', -apple-system, sans-serif", background: C.cream, color: C.ink, overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${C.amber}; color: ${C.ink}; }
        html { scroll-behavior: smooth; }
        a { color: inherit; }

        .nav-link { color: ${C.ink3}; text-decoration: none; font-size: 13px; font-weight: 500; letter-spacing: 0.01em; transition: color 0.15s; }
        .nav-link:hover { color: ${C.ink}; }

        .tab-btn { cursor: pointer; font-family: inherit; transition: all 0.15s; background: none; border: none; }

        .feat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default; }
        .feat-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(14,14,12,0.1); }

        .cta-btn { display: inline-flex; align-items: center; gap: 8px; padding: 14px 32px; font-size: 14px; font-weight: 600; border-radius: 10px; cursor: pointer; text-decoration: none; font-family: inherit; letter-spacing: 0.01em; transition: all 0.15s; border: none; }
        .cta-primary { background: ${C.ink}; color: ${C.cream}; }
        .cta-primary:hover { background: ${C.ink2}; }
        .cta-ghost { background: transparent; color: ${C.ink}; border: 1.5px solid ${C.borderMd}; }
        .cta-ghost:hover { background: ${C.paper}; }

        /* Grid background */
        .grid-bg {
          background-image: linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px);
          background-size: 48px 48px;
        }

        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .problems-grid { grid-template-columns: 1fr 1fr !important; }
          .comp-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(250,249,246,0.92)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: C.ink, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 16 16" width={14} height={14} fill="none">
                <path d="M8 1 2 3v4C2 10.5 4.5 13 8 14c3.5-1 6-3.5 6-7V3L8 1Z" fill={C.amber} stroke={C.amber} strokeWidth="0.8"/>
                <path d="m5.5 8 2 2 3-4" fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 600, letterSpacing: '-0.03em', color: C.ink }}>SubIQ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {['Intelligence','Pricing','About'].map(l => <a key={l} href={`#${l.toLowerCase()}`} className="nav-link">{l}</a>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/auth/login" className="nav-link" style={{ padding: '7px 14px' }}>Sign in</Link>
            <Link href="/auth/signup" className="cta-btn cta-primary" style={{ padding: '8px 18px', fontSize: 13 }}>Get started</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="grid-bg" style={{ padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 700px at 30% 0%, rgba(232,160,32,0.06), transparent 60%), radial-gradient(700px 500px at 80% 100%, rgba(26,58,143,0.04), transparent 60%)`, pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
          {/* Eyebrow */}
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.paper, border: `1px solid ${C.borderMd}`, borderRadius: 99, padding: '5px 14px 5px 8px', marginBottom: 32 }}>
              <div style={{ background: C.amber, borderRadius: 99, padding: '2px 8px', fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, color: C.ink, letterSpacing: '0.12em', textTransform: 'uppercase' }}>New</div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.ink3, letterSpacing: '0.06em' }}>Bid intelligence now available for electrical subs</span>
            </div>
          </Reveal>

          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <div>
              <Reveal delay={60}>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(44px, 5vw, 68px)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-1px', color: C.ink, marginBottom: 24 }}>
                  Subcontractors are<br/>
                  flying blind.<br/>
                  <span style={{ fontStyle: 'italic', color: C.amber }}>SubIQ gives them eyes.</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p style={{ fontSize: 17, color: C.ink3, lineHeight: 1.75, marginBottom: 36, maxWidth: 480, fontFamily: "'DM Sans', sans-serif" }}>
                  The first construction intelligence platform for subs. Know what to bid, predict your win probability, capture every GC directive, and protect every dollar — before it's too late.
                </p>
              </Reveal>
              <Reveal delay={180}>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 48 }}>
                  <Link href="/auth/signup" className="cta-btn cta-primary" style={{ boxShadow: `0 4px 20px rgba(14,14,12,0.2)` }}>
                    Score your first bid free
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </Link>
                  <Link href="#intelligence" className="cta-btn cta-ghost">See the intelligence</Link>
                </div>
              </Reveal>
              <Reveal delay={220}>
                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                  {[
                    { v: '74%', l: 'Average win score improvement' },
                    { v: '30s', l: 'To score any bid' },
                    { v: '$2M+', l: 'In documented disputes won' },
                  ].map(s => (
                    <div key={s.l}>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, color: C.amber, letterSpacing: '-0.5px' }}>{s.v}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.ink4, textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.4 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={100} dir="right">
              <BidScoreDemo/>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── MARKET TICKER ────────────────────────────────────── */}
      <MarketTicker/>

      {/* ── PROBLEM FRAMING ──────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: C.ink, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg,transparent 0,transparent 47px,rgba(255,255,255,0.02) 47px,rgba(255,255,255,0.02) 48px),repeating-linear-gradient(90deg,transparent 0,transparent 47px,rgba(255,255,255,0.02) 47px,rgba(255,255,255,0.02) 48px)`, pointerEvents: 'none' }}/>
        <div style={{ maxWidth: 1120, margin: '0 auto', position: 'relative' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 18 }}>The problem nobody solved</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: C.cream, letterSpacing: '-1px', lineHeight: 1.1 }}>
                Every subcontractor asks<br/>the same four questions.
              </h2>
            </div>
          </Reveal>
          <div className="problems-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {problems.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 22px', height: '100%' }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Q{i+1}</div>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: C.cream, marginBottom: 14, lineHeight: 1.3, fontStyle: 'italic' }}>{p.q}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{p.a}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
            {[
              { n: 247,  prefix: '', suffix: '',     label: 'Bids scored this week' },
              { n: 74,   prefix: '', suffix: '%',    label: 'Average win score' },
              { n: 30,   prefix: '', suffix: 's',    label: 'To score any bid' },
              { n: 2000, prefix: '$', suffix: 'M+',  label: 'In protected disputes' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80}>
                <div style={{ textAlign: 'center', padding: '32px 20px', borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, color: C.ink, letterSpacing: '-2px', lineHeight: 1, marginBottom: 10 }}>
                    {s.prefix}<Counter to={s.n}/>{s.suffix}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.ink4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE FEATURES ────────────────────────────── */}
      <section id="intelligence" style={{ padding: '100px 24px', background: C.paper }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 64 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>What SubIQ does</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: C.ink, letterSpacing: '-1px', maxWidth: 600, lineHeight: 1.1 }}>
                Not software. Intelligence.
              </h2>
            </div>
          </Reveal>
          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {intelligence.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="feat-card" style={{ background: C.cream, border: `1px solid ${C.border}`, borderLeft: `3px solid ${f.color}`, borderRadius: 16, padding: '28px 24px', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: `${f.color}18`, color: f.color, letterSpacing: '0.1em' }}>{f.tag}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.ink2, lineHeight: 1.75 }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>The difference</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, color: C.ink, letterSpacing: '-1px' }}>Other tools file. SubIQ thinks.</h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="comp-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.borderMd}` }}>
              <div style={{ background: C.paper, padding: '36px 32px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.ink4, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Every other tool</div>
                {['Stores your documents','Generates reports after the fact','Tells you what happened','$600–$800/month for basic logging','Built for GCs, not subs'].map((t,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M6 18L18 6M6 6l12 12" stroke={C.ink4} strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.ink3 }}>{t}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: C.ink, padding: '36px 32px' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>SubIQ</div>
                {['Scores your bids before you submit','Predicts win probability in 30 seconds','Tells you what\'s about to happen','Starts at $149/month, built for subs','Your legal advisor on the job site'].map((t,i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.amberDim, border: `1px solid ${C.amber}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={C.amber} strokeWidth="2.5" strokeLinecap="round"/></svg>
                    </div>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(250,249,246,0.8)' }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '100px 24px', background: C.paper }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>Simple pricing</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px,4vw,48px)', fontWeight: 400, color: C.ink, letterSpacing: '-1px', marginBottom: 52 }}>Less than one bad bid costs you.</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { name: 'Starter', price: '$149', desc: 'Individual subs and small crews', features: ['Bid scoring — 10 bids/month','Change order protection','Delay tracker','RFI tracker','Daily log','Permit scanner'], hl: false },
              { name: 'Intelligence', price: '$299', desc: 'Serious operators who want every edge', features: ['Unlimited bid scoring','Market intelligence data','Contract risk scanner','Verbal directive capture','Settlement calculator','GC reputation profiles'], hl: true },
            ].map((p, i) => (
              <Reveal key={i} delay={i*100}>
                <div style={{ background: p.hl ? C.ink : C.cream, border: `1px solid ${p.hl ? 'transparent' : C.borderMd}`, borderRadius: 20, padding: '36px 28px', textAlign: 'left', position: 'relative' }}>
                  {p.hl && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: C.amber, color: C.ink, fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 600, padding: '4px 16px', borderRadius: 99, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>}
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: p.hl ? 'rgba(250,249,246,0.4)' : C.ink4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 52, fontWeight: 400, letterSpacing: '-2px', color: p.hl ? C.cream : C.ink }}>{p.price}</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: p.hl ? 'rgba(250,249,246,0.35)' : C.ink4 }}>/month</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: p.hl ? 'rgba(250,249,246,0.45)' : C.ink3, marginBottom: 28 }}>{p.desc}</div>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginTop: 2, flexShrink: 0 }}><path d="M5 13l4 4L19 7" stroke={p.hl ? C.amber : C.green} strokeWidth="2.5" strokeLinecap="round"/></svg>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: p.hl ? 'rgba(250,249,246,0.7)' : C.ink2 }}>{f}</span>
                    </div>
                  ))}
                  <Link href="/auth/signup" style={{ display: 'block', marginTop: 28, padding: '13px', fontSize: 14, fontWeight: 600, borderRadius: 11, textAlign: 'center', textDecoration: 'none', background: p.hl ? C.amber : C.ink, color: p.hl ? C.ink : C.cream, fontFamily: "'DM Sans', sans-serif" }}>
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: C.ink, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,160,32,0.12), transparent 70%)`, pointerEvents: 'none' }}/>
        <Reveal>
          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.amber, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>Stop guessing</div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(36px,5vw,64px)', fontWeight: 400, letterSpacing: '-2px', lineHeight: 1.05, color: C.cream, marginBottom: 24 }}>
              Your next bid could win.<br/>
              <span style={{ fontStyle: 'italic', color: C.amber }}>SubIQ will tell you if it will.</span>
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(250,249,246,0.45)', marginBottom: 44, lineHeight: 1.7 }}>
              Score your first bid free. No credit card. No commitment. Just intelligence.
            </p>
            <Link href="/auth/signup" className="cta-btn cta-primary" style={{ background: C.amber, color: C.ink, boxShadow: `0 8px 40px rgba(232,160,32,0.35)`, fontSize: 15, padding: '16px 40px' }}>
              Score my first bid free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </Link>
            <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(250,249,246,0.2)', letterSpacing: '0.08em' }}>NO CREDIT CARD · 14-DAY FREE TRIAL · CANCEL ANYTIME</div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ padding: '36px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, background: C.cream }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 22, height: 22, background: C.ink, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 16 16" width={11} height={11} fill="none"><path d="M8 1 2 3v4C2 10.5 4.5 13 8 14c3.5-1 6-3.5 6-7V3L8 1Z" fill={C.amber}/><path d="m5.5 8 2 2 3-4" fill="none" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: C.ink }}>SubIQ</span>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.ink4, marginLeft: 8 }}>Construction Intelligence</span>
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: C.ink4, letterSpacing: '0.06em' }}>2025 SubIQ. Built for subs. Not against them.</div>
      </footer>
    </div>
  )
}

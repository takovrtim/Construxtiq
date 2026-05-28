'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

// ── MOCK VIDEO PLAYER (inline, no import needed) ──────────────────
function ChangeOrderDemo({ playing }: { playing: boolean }) {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const full = 'Panel location moved B-4 to B-6. Turner verbal directive 2pm.'
  useEffect(() => {
    if (!playing) { setStep(0); setTyped(''); return }
    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setStep(1), 400))
    t.push(setTimeout(() => setStep(2), 1000))
    for (let i = 0; i <= full.length; i++) t.push(setTimeout(() => setTyped(full.slice(0, i)), 1200 + i * 30))
    t.push(setTimeout(() => setStep(3), 3400))
    t.push(setTimeout(() => setStep(4), 4600))
    t.push(setTimeout(() => setStep(5), 5800))
    return () => t.forEach(clearTimeout)
  }, [playing])
  return (
    <div style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 10, background: '#1A2333', fontFamily: '-apple-system,sans-serif' }}>
      <div style={{ background: '#000', borderRadius: 9, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>SubIQ</span>
        <span style={{ color: '#7B8497', fontSize: 11 }}>Hardrock Hotel</span>
      </div>
      <div style={{ background: '#131A26', borderRadius: 12, padding: 14, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#F1EEE5', marginBottom: 12 }}>New Change Order</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Title</div>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 1 ? '#ea580c' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12, color: '#F1EEE5', background: step >= 1 ? '#fff7ed' : '#f9fafb', transition: 'all 0.3s' }}>Panel Location Change — Turner Directive</div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#545B6C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Description</div>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 2 ? '#ea580c' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, color: '#B6BCCB', background: '#1A2333', minHeight: 36, lineHeight: 1.5 }}>
            {typed}{step >= 2 && typed.length < full.length && <span style={{ borderRight: '2px solid #ea580c' }}>&nbsp;</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 3 ? '#22c55e' : '#e5e7eb'}`, borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#16a34a', background: step >= 3 ? '#f0fdf4' : '#f9fafb', transition: 'all 0.3s' }}>{step >= 3 ? '+$8,400' : '--'}</div>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 3 ? '#ef4444' : '#e5e7eb'}`, borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#dc2626', background: step >= 3 ? '#fef2f2' : '#f9fafb', transition: 'all 0.3s' }}>{step >= 3 ? '+2 days' : '--'}</div>
        </div>
        <div style={{ opacity: step >= 4 ? 1 : 0.3, transition: 'opacity 0.4s', background: '#ea580c', borderRadius: 9, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>Send GC Approval Link</div>
        {step >= 5 && <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#166534' }}>Timestamped approval sent to Turner Construction</div>}
      </div>
    </div>
  )
}

function VideoPlayer({ Component, title, sub, duration }: { Component: React.ComponentType<{ playing: boolean }>; title: string; sub: string; duration: string }) {
  const [playing, setPlaying] = useState(false)
  const [key, setKey] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  function play() { setPlaying(false); setTimeout(() => { setPlaying(true); setKey(k => k + 1) }, 50) }
  useEffect(() => {
    if (!playing) return
    timer.current = setTimeout(() => { setPlaying(false); setTimeout(() => { setPlaying(true); setKey(k => k + 1) }, 200) }, 7000)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [playing, key])
  return (
    <div style={{ background: '#0a0a0a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
      <div style={{ background: '#1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #222' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 5, padding: '3px 10px', fontSize: 11, color: '#7B8497', textAlign: 'center' }}>app.subiq.co</div>
      </div>
      <div style={{ height: 340, position: 'relative', overflow: 'hidden', background: '#1A2333' }}>
        {!playing && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <button onClick={play} style={{ width: 64, height: 64, borderRadius: '50%', background: '#ea580c', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 8px 32px rgba(234,88,12,0.5)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 5 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 280 }}>{sub}</div>
          </div>
        )}
        <Component key={key} playing={playing} />
      </div>
      <div style={{ background: '#07090E', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={playing ? () => setPlaying(false) : play} style={{ width: 26, height: 26, borderRadius: '50%', background: '#ea580c', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {playing ? <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <div style={{ flex: 1, height: 3, background: '#2a2a2a', borderRadius: 20 }}>
          <div style={{ height: '100%', background: '#ea580c', borderRadius: 20, width: playing ? '100%' : '0%', transition: playing ? 'width 7s linear' : 'none' }} />
        </div>
        <span style={{ fontSize: 11, color: '#7B8497' }}>{duration}</span>
      </div>
    </div>
  )
}

// ── COUNTER ANIMATION ──────────────────────────────────────────────
function Counter({ to, prefix = '', suffix = '', duration = 2000 }: { to: number; prefix?: string; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const start = Date.now()
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1)
        setVal(Math.floor(p * to))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// ── SCROLL REVEAL ──────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect() } }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [delay])
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' }}>
      {children}
    </div>
  )
}

// ── MAIN LANDING PAGE ──────────────────────────────────────────────
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const SCENARIOS = [
    { trigger: 'The GC changed the scope.', pain: 'Turner called at 2pm and moved the panel 12 feet. You did the work. Now they say they never approved it and refuse to pay the $8,400.', subiq: 'You logged the change order in 60 seconds. Sent Turner an approval link. They clicked it. Timestamped. Legally binding. You get paid.' },
    { trigger: 'The GC caused 22 days of delays.', pain: 'Inspectors no-shows. Material holdups. Drawing revisions. All GC problems. Now they want to penalize you for being behind schedule.', subiq: 'Every delay logged by cause, date, and days lost. SubIQ generates a Delay Impact Report. You walk into the meeting with proof. They back down.' },
    { trigger: 'Your permit expires in 8 days.', pain: 'Nobody told you. The permit was buried in a folder. Now you are looking at a stop-work order on a $2M job.', subiq: 'SubIQ AI read your permit on day one. It flagged the expiry 30 days out. You renewed. Job never stopped.' },
    { trigger: 'They are holding $180K in retention.', pain: 'Job is 95% done. Punch list keeps growing. GC keeps finding reasons not to release your money.', subiq: 'Every punch list item documented with photos and timestamps. Lien waiver log shows exactly what you signed away. You know exactly what you are owed.' },
  ]

  const FEATURES = [
    { tag: 'Core', title: 'Change Order Protection', desc: 'Log scope changes in 60 seconds. Send the GC a professional approval link. Their click is legally binding and timestamped.' },
    { tag: 'Core', title: 'Delay Tracker', desc: 'Document every GC-caused delay by date, cause, and days lost. Generate a dispute-ready PDF report in one click.' },
    { tag: 'AI', title: 'Permit Scanner', desc: 'Upload any permit PDF. Our AI reads every detail, flags expiry dates, special conditions, and required inspections automatically.' },
    { tag: 'AI', title: 'RFI Tracker', desc: 'Every question you submit to the GC is on record. Every missed deadline is documented delay you can claim.' },
    { tag: 'Protection', title: 'Daily Log', desc: 'One tap to log your day. Hours, crew, conditions, GC interactions. Timestamped entries that hold up in arbitration.' },
    { tag: 'Protection', title: 'Audit Export', desc: 'One click generates a legal-grade case file with every delay, change order, RFI, and daily log. Drop it on the table.' },
  ]

  const COMPETITORS = [
    { name: 'SubIQ', price: '$149/mo', co: true, delay: true, permit: true, rfi: true, audit: true, mobile: true, highlight: true },
    { name: 'Procore', price: '$833+/mo', co: true, delay: false, permit: false, rfi: true, audit: false, mobile: true, highlight: false },
    { name: 'eSUB', price: '$200+/mo', co: true, delay: false, permit: false, rfi: true, audit: false, mobile: false, highlight: false },
    { name: 'Spreadsheets', price: 'Your time', co: false, delay: false, permit: false, rfi: false, audit: false, mobile: false, highlight: false },
  ]

  const check = (v: boolean) => v
    ? <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" /></svg></div>
    : <div style={{ color: '#B6BCCB', fontSize: 18, textAlign: 'center' }}>--</div>

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: '#080808', color: 'white', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #ea580c; color: white; }
        html { scroll-behavior: smooth; }
        .tab-btn { transition: all 0.2s; }
        .tab-btn:hover { opacity: 0.8; }
        .feat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .feat-card:hover { transform: translateY(-3px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        @keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes gradient-shift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#ea580c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white" /><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7" /><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5" /><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3" /></svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' }}>SubIQ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/auth/login" style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/auth/signup" style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, background: '#ea580c', color: 'white', textDecoration: 'none' }}>Get started free</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background grain */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(234,88,12,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(234,88,12,0.1)', border: '1px solid rgba(234,88,12,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', animation: 'pulse-ring 1.5s ease-out infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px' }}>Built for subs. Not against them.</span>
            </div>

            {/* Headline — emotion first */}
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
              The GC changed<br />
              the scope.<br />
              <span style={{ color: '#ea580c' }}>Do you have proof?</span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              SubIQ is the legal protection layer for electrical and plumbing subs. Every change order, delay, RFI, and permit — documented, timestamped, and dispute-ready.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 32px', fontSize: 15, fontWeight: 800, borderRadius: 12, background: '#ea580c', color: 'white', textDecoration: 'none', boxShadow: '0 8px 32px rgba(234,88,12,0.4)', letterSpacing: '-0.3px' }}>
                Start building your case file
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
              </Link>
              <Link href="#how-it-works" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 24px', fontSize: 14, fontWeight: 600, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
                See how it works
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[{ val: '$2M+', label: 'in documented disputes' }, { val: '60 sec', label: 'to log a change order' }, { val: '100%', label: 'legally timestamped' }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ea580c', letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo */}
          <div style={{ animation: 'float 6s ease-in-out infinite' }}>
            <VideoPlayer Component={ChangeOrderDemo} title="Change Order + GC Approval" sub="Log scope change and send Turner an approval link in 60 seconds" duration="0:06" />
          </div>
        </div>
      </section>

      {/* ── TICKER ──────────────────────────────────────────── */}
      <div style={{ background: '#ea580c', padding: '12px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {Array(4).fill(['GC SCOPE CHANGES', 'DOCUMENTED DELAYS', 'PERMIT EXPIRY ALERTS', 'RFI PAPER TRAILS', 'CHANGE ORDER APPROVALS', 'LEGAL CASE FILES', 'RETENTION TRACKING', 'AUDIT EXPORTS']).flat().map((t, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', color: 'white', padding: '0 32px', opacity: 0.9 }}>{t} &nbsp; &bull;</span>
          ))}
        </div>
      </div>

      {/* ── SOUND FAMILIAR ──────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#080808' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>The Situations That Cost You</div>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1 }}>Sound familiar?</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {SCENARIOS.map((s, i) => (
              <button key={i} className="tab-btn" onClick={() => setActiveTab(i)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${activeTab === i ? '#ea580c' : 'rgba(255,255,255,0.1)'}`, background: activeTab === i ? 'rgba(234,88,12,0.1)' : 'transparent', color: activeTab === i ? '#ea580c' : 'rgba(255,255,255,0.5)' }}>
                {s.trigger.split('.')[0]}
              </button>
            ))}
          </div>

          <Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ background: '#131A26', padding: '40px 36px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>Without SubIQ</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 16, lineHeight: 1.3 }}>{SCENARIOS[activeTab].trigger}</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{SCENARIOS[activeTab].pain}</p>
              </div>
              <div style={{ background: 'rgba(234,88,12,0.06)', padding: '40px 36px', borderLeft: '2px solid rgba(234,88,12,0.3)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 16 }}>With SubIQ</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.5px', marginBottom: 16, lineHeight: 1.3 }}>You have proof.</h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>{SCENARIOS[activeTab].subiq}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
          {[
            { n: 2000000, prefix: '$', suffix: '+', label: 'In documented disputes', decimals: false },
            { n: 14, prefix: '', suffix: ' days', label: 'Average GC delay avoided', decimals: false },
            { n: 60, prefix: '', suffix: ' sec', label: 'To log a change order', decimals: false },
            { n: 100, prefix: '', suffix: '%', label: 'Legally timestamped records', decimals: false },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div style={{ textAlign: 'center', padding: '32px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, color: '#ea580c', letterSpacing: '-2px', lineHeight: 1, marginBottom: 10 }}>
                  {s.prefix}<Counter to={s.n} />{s.suffix}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#080808' }} id="how-it-works">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Every Tool You Need</div>
              <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, letterSpacing: '-1.5px', maxWidth: 560 }}>Your entire legal protection layer in one place.</h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="feat-card" style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: f.tag === 'AI' ? 'rgba(59,130,246,0.1)' : f.tag === 'Core' ? 'rgba(234,88,12,0.1)' : 'rgba(34,197,94,0.1)', color: f.tag === 'AI' ? '#3b82f6' : f.tag === 'Core' ? '#ea580c' : '#22c55e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.tag}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 10, letterSpacing: '-0.3px' }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETITOR TABLE ─────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#0a0a0a' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 50 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Built Specifically For Subs</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px' }}>No other tool is built for you.</h2>
            </div>
          </Reveal>
          <Reveal delay={200}>
            <div style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tool</th>
                    {['Change Orders', 'Delay Tracking', 'Permit AI', 'RFI Tracker', 'Audit Export', 'Mobile'].map(h => (
                      <th key={h} style={{ padding: '16px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                    <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map((c, i) => (
                    <tr key={i} style={{ borderBottom: i < COMPETITORS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: c.highlight ? 'rgba(234,88,12,0.05)' : 'transparent' }}>
                      <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: c.highlight ? 800 : 500, color: c.highlight ? '#ea580c' : 'rgba(255,255,255,0.6)' }}>{c.name}</td>
                      {[c.co, c.delay, c.permit, c.rfi, c.audit, c.mobile].map((v, j) => (
                        <td key={j} style={{ padding: '16px 12px', textAlign: 'center' }}>{check(v)}</td>
                      ))}
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: c.highlight ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>{c.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', background: '#080808' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 14 }}>Simple Pricing</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 50 }}>Less than one hour of lost work.</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { name: 'Starter', price: '$149', period: '/month', desc: 'For individual subs and small crews', features: ['Unlimited change orders', 'Delay tracker', 'RFI tracker', 'Daily log', 'Permit scanner', 'Email support'], highlight: false },
              { name: 'Pro', price: '$299', period: '/month', desc: 'For growing subcontracting operations', features: ['Everything in Starter', 'AI document intelligence', 'Audit export + case file', 'GC approval email flow', 'Weekly digest reports', 'Priority support'], highlight: true },
            ].map((p, i) => (
              <Reveal key={i} delay={i * 100}>
                <div style={{ background: p.highlight ? 'rgba(234,88,12,0.06)' : '#0f0f0f', border: `1px solid ${p.highlight ? 'rgba(234,88,12,0.3)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 20, padding: '36px 32px', textAlign: 'left', position: 'relative' }}>
                  {p.highlight && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#ea580c', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '1px' }}>Most Popular</div>}
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-2px', color: 'white' }}>{p.price}</span>
                    <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{p.period}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>{p.desc}</div>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" /></svg>
                      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                    </div>
                  ))}
                  <Link href="/auth/signup" style={{ display: 'block', marginTop: 28, padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, textAlign: 'center', textDecoration: 'none', background: p.highlight ? '#ea580c' : 'rgba(255,255,255,0.06)', color: 'white', border: p.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                    Start free trial
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', background: '#0a0a0a', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <Reveal>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: 20 }}>Stop Losing Disputes</div>
            <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.05, marginBottom: 24 }}>
              Every day without SubIQ is a day the GC wins by default.
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.4)', marginBottom: 40, lineHeight: 1.7 }}>
              Your case file starts building the moment you sign up. The more you log, the stronger your protection.
            </p>
            <Link href="/auth/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 44px', fontSize: 16, fontWeight: 800, borderRadius: 14, background: '#ea580c', color: 'white', textDecoration: 'none', boxShadow: '0 8px 40px rgba(234,88,12,0.5)', letterSpacing: '-0.3px' }}>
              Start building your case file
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </Link>
            <div style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No credit card required. 14-day free trial.</div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, background: '#ea580c', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white" /><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7" /><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5" /><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3" /></svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' }}>SubIQ</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>Built for subs. Not against them.</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          2025 SubIQ. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MockVideoPlayer } from '@/components/MockVideoPlayer'

const PROBLEMS = [
  {
    number: '01', color: '#ef4444',
    tab: 'Scope changes',
    title: 'Turner calls and changes the scope',
    before: 'You say "ok" over the phone. No email, no paper trail. Six months later when you bill for it, Turner says they never authorized it. You eat $40,000.',
    after: 'You log the change in SubIQ and send Turner an approval link. They tap Approve on their phone. Timestamped with their name and title. Legally binding. Turner cannot dispute it.',
    stat: '$40K avg per verbal approval dispute',
  },
  {
    number: '02', color: '#f59e0b',
    tab: 'GC delays',
    title: 'GC delays pile up and nobody tracks them',
    before: 'Inspector no-shows. Material delivery gets pushed by the GC. Three days lost here, two days there. By the end of the job you are 22 days behind and nothing is documented.',
    after: 'Every delay logged in 30 seconds — cause, days lost, who is responsible. One click exports a PDF showing 22 days of GC-caused delay. Drop it on the table at your next meeting.',
    stat: '22 avg delay days on commercial jobs',
  },
  {
    number: '03', color: '#8b5cf6',
    tab: 'Permit expires',
    title: 'Your permit expires and you had no idea',
    before: 'Stop-work order. Crew standing around billing you $3,000 a day. $500 fine from Clark County. Two days lost. All because nobody tracked the expiry date.',
    after: 'SubIQ reads your permit with AI, extracts the expiry date, and emails you 14 days before it expires. Shows every special condition and the inspector\'s direct phone number.',
    stat: '$8K avg cost of a stop-work order',
  },
  {
    number: '04', color: '#22c55e',
    tab: 'Retention held',
    title: 'Retention sits there for months',
    before: 'Punch list done. Job complete. Turner is still holding 10% — $180,000 — with no release date. You have no leverage and no documentation of when the job finished.',
    after: 'Retention tracker shows exactly what every GC owes you, when it was earned, what the release conditions are, and how long they have been holding it.',
    stat: '10% avg retention held months overdue',
  },
]

const FEATURES = [
  { icon: '📝', tag: 'Legal protection', tagColor: '#ef4444', title: 'Change Orders with GC Approval', body: 'Log every scope change. Send the GC a link — they tap Approve or Reject on their phone. Timestamped and legally binding. No more verbal agreements.' },
  { icon: '⏱️', tag: 'Dispute weapon', tagColor: '#f59e0b', title: 'Delay Tracker + PDF Export', body: 'Log every delay in 30 seconds. One button generates a professional delay report with total GC-caused days highlighted. Drop it on the table.' },
  { icon: '🤖', tag: 'AI powered', tagColor: '#3b82f6', title: 'Document Intelligence', body: 'Upload your Clark County permit, blueprint, or contract. AI reads it and extracts expiry dates, special conditions, inspector contacts, scope gaps, and RFI candidates.' },
  { icon: '📋', tag: 'Legal protection', tagColor: '#ef4444', title: 'RFI Tracker', body: 'Every question you submit to the GC is on record with a deadline. When Turner ignores you past the deadline, that unanswered question is documented delay.' },
  { icon: '💵', tag: 'Cash protection', tagColor: '#22c55e', title: 'Retention Tracker', body: 'See exactly what every GC owes you and how long they have been holding it. Track lien waiver status so you know what you have and have not signed away.' },
  { icon: '⚖️', tag: 'The closer', tagColor: '#ea580c', title: 'One-Click Audit Export', body: 'Every delay, RFI, change order, daily log, and safety record in one professional legal document. Walk into any dispute meeting ready.' },
]

const COMPARISON = [
  { feature: 'Built specifically for subcontractors', subiq: true, procore: false, esub: true },
  { feature: 'AI document parsing', subiq: true, procore: false, esub: false },
  { feature: 'GC approval portal + legal timestamp', subiq: true, procore: false, esub: false },
  { feature: 'One-click audit export / case file', subiq: true, procore: false, esub: false },
  { feature: 'GC reputation score', subiq: true, procore: false, esub: false },
  { feature: 'Permit expiry alerts', subiq: true, procore: false, esub: false },
  { feature: 'Blueprint AI scanner', subiq: true, procore: false, esub: false },
  { feature: 'Delay tracker with PDF export', subiq: true, procore: false, esub: true },
  { feature: 'Price / month', subiq: '$149', procore: '$833+', esub: '$249' },
]

function Check({ yes, isSub }: { yes: boolean | string; isSub: boolean }) {
  if (yes === true) return (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:'50%', background: isSub ? '#ea580c' : '#dcfce7' }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={isSub ? 'white' : '#16a34a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  )
  if (yes === false) return (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:26, height:26, borderRadius:'50%', background:'#f3f4f6' }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round"/></svg>
    </div>
  )
  return <span style={{ fontSize:13, fontWeight:700, color: isSub ? '#ea580c' : '#6b7280' }}>{yes as string}</span>
}



export default function LandingPage() {
  const [activeProblem, setActiveProblem] = useState(0)

  return (
    <div style={{ fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif", background:'#fff', color:'#111827' }}>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,0.96)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f3f4f6', padding:'0 32px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:'#ea580c', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
          </div>
          <span style={{ fontSize:17, fontWeight:900, letterSpacing:'-0.4px' }}>SubIQ</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Link href="/auth/login" style={{ fontSize:14, fontWeight:500, color:'#6b7280', textDecoration:'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize:14, fontWeight:700, color:'white', background:'#ea580c', padding:'8px 20px', borderRadius:9, textDecoration:'none' }}>Start Free →</Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'72px 32px 56px', textAlign:'center' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:24, padding:'6px 16px', marginBottom:24 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#ea580c' }} />
          <span style={{ fontSize:12, fontWeight:700, color:'#ea580c' }}>Built for electrical and plumbing subcontractors</span>
        </div>

        <h1 style={{ fontSize:'clamp(38px,6vw,70px)', fontWeight:900, letterSpacing:'-2.5px', lineHeight:1.02, marginBottom:20, color:'#0a0a0a' }}>
          The GC changed the scope.<br />
          <span style={{ color:'#ea580c' }}>Now you have proof.</span>
        </h1>

        <p style={{ fontSize:'clamp(16px,2vw,19px)', color:'#6b7280', maxWidth:540, margin:'0 auto 32px', lineHeight:1.65 }}>
          SubIQ automatically builds your legal case file — every change order, delay, RFI, and permit logged, timestamped, and dispute-ready.
        </p>

        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:14 }}>
          <Link href="/auth/signup" style={{ fontSize:15, fontWeight:800, color:'white', background:'#ea580c', padding:'14px 34px', borderRadius:12, textDecoration:'none', letterSpacing:'-0.2px', boxShadow:'0 6px 28px rgba(234,88,12,0.32)' }}>
            Start 14-Day Free Trial →
          </Link>
          <Link href="/auth/login" style={{ fontSize:15, fontWeight:600, color:'#374151', background:'#f9fafb', border:'1.5px solid #e5e7eb', padding:'14px 26px', borderRadius:12, textDecoration:'none' }}>
            Sign in
          </Link>
        </div>
        <p style={{ fontSize:12, color:'#9ca3af' }}>No credit card · 2 minutes · Cancel anytime</p>

        {/* Hero video */}
        <div style={{ maxWidth:860, margin:'40px auto 0' }}>
          <MockVideoPlayer defaultVideo="change-order" height={400} hideTabs={true} autoPlay={true} />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <div style={{ background:'#0a0a0a', padding:'24px 32px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-around', flexWrap:'wrap', gap:24 }}>
          {[
            { stat:'$2M+', label:'Revenue protected per user' },
            { stat:'14 days', label:'Free trial, no card' },
            { stat:'60 sec', label:'To log a daily entry' },
            { stat:'100%', label:'Built for subs, not GCs' },
          ].map(s => (
            <div key={s.stat} style={{ textAlign:'center', padding:'4px 0' }}>
              <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-1px', color:'#fff' }}>{s.stat}</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SOUND FAMILIAR ───────────────────────────────────── */}
      <section style={{ padding:'72px 32px', background:'#f9fafb' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>

          {/* Centered header */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>The problem</div>
            <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, letterSpacing:'-1.5px', lineHeight:1.05, marginBottom:12 }}>Sound familiar?</h2>
            <p style={{ fontSize:15, color:'#6b7280', maxWidth:480, margin:'0 auto' }}>
              Four situations that cost electrical and plumbing subs the most money every year. Tap each one.
            </p>
          </div>

          {/* Centered tabs */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', marginBottom:32 }}>
            {PROBLEMS.map((p, i) => (
              <button key={i} onClick={() => setActiveProblem(i)} style={{
                display:'flex', alignItems:'center', gap:8,
                padding:'9px 18px', borderRadius:50,
                border:`2px solid ${activeProblem === i ? p.color : '#e5e7eb'}`,
                background: activeProblem === i ? `${p.color}10` : 'white',
                cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
                transition:'all 0.18s',
                boxShadow: activeProblem === i ? `0 4px 14px ${p.color}22` : 'none',
              }}>
                <div style={{ width:22, height:22, borderRadius:'50%', background: activeProblem === i ? p.color : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.18s' }}>
                  <span style={{ fontSize:10, fontWeight:900, color: activeProblem === i ? 'white' : '#9ca3af' }}>{p.number}</span>
                </div>
                <span style={{ fontSize:13, fontWeight: activeProblem === i ? 700 : 500, color: activeProblem === i ? p.color : '#374151' }}>{p.tab}</span>
              </button>
            ))}
          </div>

          {/* Before / After cards */}
          {PROBLEMS.map((p, i) => i === activeProblem && (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
              <div style={{ background:'white', border:`1.5px solid #fecaca`, borderRadius:18, padding:28, borderLeft:`4px solid #ef4444` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'#ef4444', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.5px' }}>Without SubIQ</span>
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#0a0a0a', marginBottom:10, lineHeight:1.3 }}>{p.title}</h3>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:14 }}>{p.before}</p>
                <div style={{ background:'#fee2e2', borderRadius:9, padding:'9px 13px', fontSize:12, fontWeight:700, color:'#991b1b' }}>💸 {p.stat}</div>
              </div>

              <div style={{ background:'white', border:`1.5px solid #bbf7d0`, borderRadius:18, padding:28, borderLeft:`4px solid #22c55e` }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize:11, fontWeight:800, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.5px' }}>With SubIQ</span>
                </div>
                <h3 style={{ fontSize:18, fontWeight:800, color:'#0a0a0a', marginBottom:10, lineHeight:1.3 }}>Problem solved</h3>
                <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:14 }}>{p.after}</p>
                <div style={{ background:'#dcfce7', borderRadius:9, padding:'9px 13px', fontSize:12, fontWeight:700, color:'#166534' }}>✓ Documented, timestamped, dispute-ready</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ background:'#0a0a0a', padding:'72px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>The solution</div>
            <h2 style={{ fontSize:'clamp(26px,4vw,48px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', lineHeight:1.05, marginBottom:12 }}>Your legal case file. Built automatically.</h2>
            <p style={{ fontSize:15, color:'#6b7280', maxWidth:440, margin:'0 auto' }}>Every feature builds your case or protects your cash. Nothing else.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:14 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background:'#111', border:'1px solid #1f2937', borderRadius:16, padding:24, transition:'border-color 0.15s', cursor:'default' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f2937')}
              >
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <span style={{ fontSize:28 }}>{f.icon}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, background:`${f.tagColor}15`, color:f.tagColor }}>{f.tag}</span>
                </div>
                <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:8, lineHeight:1.3 }}>{f.title}</div>
                <div style={{ fontSize:13, color:'#9ca3af', lineHeight:1.65 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{ maxWidth:1100, margin:'0 auto', padding:'72px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:56, alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>How it works</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:10 }}>Set up in 5 minutes.<br />Use it every day.</h2>
            <p style={{ fontSize:14, color:'#6b7280', marginBottom:32, lineHeight:1.6 }}>The longer you use it, the stronger your case file gets.</p>
            {[
              { n:'1', title:'Create your account', body:'Tell us your trade, GC name, biggest pain. 2 minutes. No card.' },
              { n:'2', title:'Add your active job', body:'Project name, address, contract value. Dashboard activates immediately.' },
              { n:'3', title:'Upload your first document', body:'AI reads your permit or blueprint — extracts dates, conditions, risks.' },
              { n:'4', title:'Log daily and build your case', body:'60 seconds a day. Every log is a timestamped legal record.' },
            ].map((step, i) => (
              <div key={i} style={{ display:'flex', gap:14, padding:'16px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:9, background:'#fff7ed', border:'1.5px solid #fed7aa', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:900, color:'#ea580c' }}>{step.n}</span>
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{step.title}</div>
                  <div style={{ fontSize:13, color:'#6b7280', lineHeight:1.55 }}>{step.body}</div>
                </div>
              </div>
            ))}
          </div>
          <MockVideoPlayer defaultVideo="delay-report" height={360} hideTabs={true} autoPlay={true} />
        </div>
      </section>

      {/* ── AI SECTION ───────────────────────────────────────── */}
      <section style={{ background:'#f9fafb', padding:'72px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))', gap:56, alignItems:'center' }}>
            <MockVideoPlayer defaultVideo="permit-scan" height={360} hideTabs={true} autoPlay={true} />
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:14 }}>AI Document Intelligence</div>
              <h2 style={{ fontSize:'clamp(24px,3.5vw,42px)', fontWeight:900, letterSpacing:'-1.2px', lineHeight:1.1, marginBottom:12 }}>Upload any document.<br />AI reads everything.</h2>
              <p style={{ fontSize:14, color:'#6b7280', marginBottom:24, lineHeight:1.65 }}>
                No other software does what SubIQ's AI does for subcontractors. It reads your documents and tells you exactly what to do — specific to your trade, GC, and jurisdiction.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { icon:'📋', title:'Permits', body:'Expiry date, special conditions, inspector name and phone, jurisdiction requirements' },
                  { icon:'🏗️', title:'Blueprints', body:'Scope gaps, code issues, safety flags, cost savings, RFI candidates — NEC 2020 aware' },
                  { icon:'📝', title:'Contracts', body:'Contract value, retention %, penalty clauses, payment terms, notice requirements' },
                  { icon:'🪪', title:'Licenses', body:'License number, classifications, expiry date, renewal alerts' },
                ].map(item => (
                  <div key={item.title} style={{ display:'flex', gap:12, padding:'13px 16px', background:'white', borderRadius:11, border:'1px solid #e5e7eb' }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{item.title}</div>
                      <div style={{ fontSize:12, color:'#6b7280', lineHeight:1.5 }}>{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────────────── */}
      <section style={{ maxWidth:960, margin:'0 auto', padding:'72px 32px' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>Comparison</div>
          <h2 style={{ fontSize:'clamp(24px,3.5vw,44px)', fontWeight:900, letterSpacing:'-1.2px', marginBottom:10 }}>Why not Procore or eSUB?</h2>
          <p style={{ fontSize:14, color:'#6b7280' }}>Procore costs $10,000 a year and is built for GCs. SubIQ is built for subs looking up.</p>
        </div>
        <div style={{ background:'white', borderRadius:18, border:'1.5px solid #e5e7eb', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.05)' }}>
          {/* Header */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr' }}>
            {['Feature','★ SubIQ','Procore','eSUB'].map((h,j) => (
              <div key={j} style={{ padding:'14px 20px', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.6px', textAlign: j===0 ? 'left' : 'center', background: j===1 ? '#0a0a0a' : '#f9fafb', color: j===1 ? '#ea580c' : '#9ca3af', borderBottom:'1.5px solid #e5e7eb' }}>{h}</div>
            ))}
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', borderBottom: i < COMPARISON.length-1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ padding:'12px 20px', fontSize:13, color:'#374151', fontWeight:500, display:'flex', alignItems:'center' }}>{row.feature}</div>
              <div style={{ padding:'12px 20px', textAlign:'center', background:'#fffbeb', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {typeof row.subiq === 'string' ? <span style={{ fontSize:14, fontWeight:800, color:'#ea580c' }}>{row.subiq}</span> : <Check yes={row.subiq} isSub={true} />}
              </div>
              <div style={{ padding:'12px 20px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {typeof row.procore === 'string' ? <span style={{ fontSize:13, fontWeight:700, color:'#ef4444' }}>{row.procore}</span> : <Check yes={row.procore} isSub={false} />}
              </div>
              <div style={{ padding:'12px 20px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {typeof row.esub === 'string' ? <span style={{ fontSize:13, color:'#6b7280' }}>{row.esub}</span> : <Check yes={row.esub} isSub={false} />}
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', marginTop:12, fontSize:12, color:'#9ca3af' }}>Procore pricing based on publicly available estimates.</p>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section style={{ background:'#f9fafb', padding:'72px 32px' }}>
        <div style={{ maxWidth:700, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#ea580c', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>Pricing</div>
            <h2 style={{ fontSize:'clamp(24px,3.5vw,44px)', fontWeight:900, letterSpacing:'-1.2px', marginBottom:8 }}>Simple pricing</h2>
            <p style={{ fontSize:14, color:'#6b7280' }}>One dispute won pays for years of SubIQ.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
            {[
              { name:'Starter', price:'$149', desc:'Solo operators and small crews', features:['1 active project','All core features','AI document scanning','Audit export PDF','Permit expiry alerts','Email support'], highlight:false },
              { name:'Pro', price:'$299', desc:'Growing subs with multiple jobs', features:['Unlimited projects','Everything in Starter','GC reputation scores','3 team seats','Priority support','Custom alerts'], highlight:true },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlight ? '#0a0a0a' : 'white', border:`2px solid ${plan.highlight ? '#ea580c' : '#e5e7eb'}`, borderRadius:20, padding:'28px 26px', position:'relative' }}>
                {plan.highlight && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#ea580c', color:'white', fontSize:10, fontWeight:800, padding:'4px 14px', borderRadius:20, whiteSpace:'nowrap' }}>Most Popular</div>}
                <div style={{ fontSize:12, fontWeight:700, color: plan.highlight ? '#ea580c' : '#9ca3af', marginBottom:8 }}>{plan.name}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:2, marginBottom:4 }}>
                  <span style={{ fontSize:44, fontWeight:900, color: plan.highlight ? '#fff' : '#111827', letterSpacing:'-2px', lineHeight:1 }}>{plan.price}</span>
                  <span style={{ fontSize:14, color:'#9ca3af', marginLeft:2 }}>/mo</span>
                </div>
                <div style={{ fontSize:13, color:'#9ca3af', marginBottom:20 }}>{plan.desc}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:9, marginBottom:24 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display:'flex', alignItems:'center', gap:9, fontSize:13, color: plan.highlight ? '#d1d5db' : '#374151' }}>
                      <div style={{ width:17, height:17, borderRadius:'50%', background:'#22c55e', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup" style={{ display:'block', textAlign:'center', padding:'12px', fontSize:14, fontWeight:700, borderRadius:10, textDecoration:'none', background: plan.highlight ? '#ea580c' : '#111827', color:'white' }}>
                  Start free trial →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'#9ca3af' }}>14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section style={{ background:'#0a0a0a', padding:'80px 32px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(234,88,12,0.1) 0%,transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:560, margin:'0 auto', position:'relative', zIndex:1 }}>
          <h2 style={{ fontSize:'clamp(28px,4.5vw,54px)', fontWeight:900, color:'#fff', letterSpacing:'-2px', marginBottom:16, lineHeight:1.05 }}>
            Stop losing disputes.<br /><span style={{ color:'#ea580c' }}>Start building your case.</span>
          </h2>
          <p style={{ fontSize:15, color:'#6b7280', marginBottom:32, lineHeight:1.65 }}>
            Every day you work without SubIQ is a day the GC has the advantage. Start your free trial — no card needed.
          </p>
          <Link href="/auth/signup" style={{ display:'inline-block', fontSize:16, fontWeight:800, color:'white', background:'#ea580c', padding:'16px 42px', borderRadius:13, textDecoration:'none', boxShadow:'0 8px 36px rgba(234,88,12,0.38)' }}>
            Start Free Trial — No Card Needed →
          </Link>
          <p style={{ marginTop:14, fontSize:12, color:'#6b7280' }}>Takes 2 minutes · 14-day trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background:'#0a0a0a', borderTop:'1px solid #111827', padding:'28px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, background:'#ea580c', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>SubIQ</div>
              <div style={{ fontSize:11, color:'#6b7280' }}>Built for subs. Not against them.</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:20, alignItems:'center' }}>
            <Link href="/auth/login" style={{ fontSize:13, color:'#6b7280', textDecoration:'none' }}>Sign in</Link>
            <Link href="/auth/signup" style={{ fontSize:13, color:'#6b7280', textDecoration:'none' }}>Sign up</Link>
            <Link href="/auth/signup" style={{ fontSize:13, fontWeight:700, color:'#ea580c', textDecoration:'none' }}>Start free →</Link>
          </div>
        </div>
      </footer>

      <style>{`@media(max-width:768px){nav{padding:0 16px}section{padding-left:16px!important;padding-right:16px!important}}`}</style>
    </div>
  )
}

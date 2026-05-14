'use client'

import Link from 'next/link'
import { useState } from 'react'

const PROBLEMS = [
  {
    number: '01',
    color: '#ef4444',
    title: 'Turner calls and changes the scope',
    before: 'You say "ok" over the phone. No email, no paper trail. Six months later when you bill for it, Turner says they never authorized it. You eat $40,000.',
    after: 'You log the change in SubIQ and send Turner an approval link. They tap Approve on their phone. That approval is timestamped with their name, title, and date. Legally binding. Turner cannot dispute it.',
    stat: '$40K avg dispute per verbal approval',
  },
  {
    number: '02',
    color: '#f59e0b',
    title: 'GC delays pile up and nobody tracks them',
    before: 'Inspector no-shows. Material delivery gets pushed by the GC. Three days lost here, two days there. By the end of the job you are 22 days behind schedule and nobody has any documentation.',
    after: 'Every delay logged in 30 seconds — cause, days lost, who is responsible. One click exports a PDF report showing 22 days of GC-caused delay with dates and descriptions. Drop it on the table in your next meeting.',
    stat: '22 avg delay days on commercial jobs',
  },
  {
    number: '03',
    color: '#8b5cf6',
    title: 'Your permit expires and you had no idea',
    before: 'Stop-work order. Crew standing around billing you $3,000 a day. $500 fine from Clark County. Two days lost waiting for renewal. All because nobody tracked the expiry date on the permit.',
    after: 'SubIQ reads your permit with AI, extracts the expiry date, and emails you 14 days before it expires. Also shows you every special condition and the inspector\'s direct phone number.',
    stat: '$8K avg cost of a stop-work order',
  },
  {
    number: '04',
    color: '#22c55e',
    title: 'Retention sits there for months',
    before: 'Punch list done. Job complete. Turner is still holding 10% — $180,000 — with no release date. You have no leverage and no documentation of when the job was actually finished.',
    after: 'Retention tracker shows exactly what every GC owes you, when it was earned, what the release conditions are, and how long they have been holding it. Your leverage in every conversation.',
    stat: '10% avg retention held — months overdue',
  },
]

const FEATURES = [
  {
    icon: '📝',
    tag: 'Legal protection',
    tagColor: '#ef4444',
    title: 'Change Orders with GC Approval',
    body: 'Log every scope change. Send the GC a link — they tap Approve or Reject on their phone. Timestamped, tied to their name and title. Legally binding. No more verbal agreements.',
    video: null,
  },
  {
    icon: '⏱️',
    tag: 'Dispute weapon',
    tagColor: '#f59e0b',
    title: 'Delay Tracker + PDF Export',
    body: 'Log every delay in 30 seconds. GC-caused, weather, material, permit. One button generates a professional delay report with total days highlighted. Drop it on the table.',
    video: null,
  },
  {
    icon: '🤖',
    tag: 'AI powered',
    tagColor: '#3b82f6',
    title: 'Document Intelligence',
    body: 'Upload your Clark County permit, blueprint, or contract. AI reads it and extracts expiry dates, special conditions, inspector contacts, scope gaps, penalty clauses, and RFI candidates.',
    video: null,
  },
  {
    icon: '📋',
    tag: 'Legal protection',
    tagColor: '#ef4444',
    title: 'RFI Tracker',
    body: 'Every question you submit to the GC or architect is on record. Set response deadlines. When Turner ignores you past the deadline, that unanswered question is documented delay.',
    video: null,
  },
  {
    icon: '💵',
    tag: 'Cash protection',
    tagColor: '#22c55e',
    title: 'Retention Tracker',
    body: 'See exactly what every GC owes you, when it was earned, and how long they have been holding it. Track lien waiver status so you know what you have and have not signed away.',
    video: null,
  },
  {
    icon: '⚖️',
    tag: 'The closer',
    tagColor: '#ea580c',
    title: 'One-Click Audit Export',
    body: 'Every delay, RFI, change order, daily log, and safety record in one professional legal document. Walk into any dispute meeting with documentation that looks like a lawyer built it.',
    video: null,
  },
]

const COMPARISON = [
  { feature: 'Built specifically for subcontractors', subiq: true, procore: false, esub: true },
  { feature: 'AI document parsing (permits, blueprints, contracts)', subiq: true, procore: false, esub: false },
  { feature: 'GC approval portal with legal timestamp', subiq: true, procore: false, esub: false },
  { feature: 'One-click audit export / case file', subiq: true, procore: false, esub: false },
  { feature: 'GC reputation score', subiq: true, procore: false, esub: false },
  { feature: 'Permit expiry alerts (14, 7, 1 day)', subiq: true, procore: false, esub: false },
  { feature: 'Blueprint AI scanner', subiq: true, procore: false, esub: false },
  { feature: 'Delay tracker with PDF export', subiq: true, procore: false, esub: true },
  { feature: 'Mobile first — works on job site', subiq: true, procore: true, esub: true },
  { feature: 'Price per month', subiq: '$149', procore: '$833+', esub: '$249' },
]

function Check({ yes, isSub }: { yes: boolean; isSub: boolean }) {
  if (yes === true) return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: isSub ? '#ea580c' : '#dcfce7' }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={isSub ? 'white' : '#16a34a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  )
  if (yes === false) return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: '#f3f4f6' }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round"/></svg>
    </div>
  )
  return <span style={{ fontSize: 13, fontWeight: 700, color: isSub ? '#ea580c' : '#6b7280' }}>{yes as string}</span>
}

export default function LandingPage() {
  const [activeProblem, setActiveProblem] = useState(0)

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", background: '#fff', color: '#111827', overflowX: 'hidden' }}>

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #f3f4f6', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#ea580c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px', color: '#111827' }}>SubIQ</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 500, color: '#6b7280', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/auth/signup" style={{ fontSize: 14, fontWeight: 700, color: 'white', background: '#ea580c', padding: '9px 20px', borderRadius: 10, textDecoration: 'none', letterSpacing: '-0.2px' }}>
            Start Free →
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,8vw,120px) 24px clamp(40px,6vw,80px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 24, padding: '7px 16px', marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ea580c', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', letterSpacing: '0.2px' }}>Built for electrical and plumbing subcontractors</span>
        </div>

        <h1 style={{ fontSize: 'clamp(38px, 6.5vw, 72px)', fontWeight: 900, letterSpacing: '-2.5px', lineHeight: 1.02, marginBottom: 24, color: '#0a0a0a' }}>
          The GC changed the scope.<br />
          <span style={{ color: '#ea580c' }}>Now you have proof.</span>
        </h1>

        <p style={{ fontSize: 'clamp(16px, 2.2vw, 21px)', color: '#6b7280', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65 }}>
          SubIQ automatically builds your legal case file — every change order, delay, RFI, and permit logged, timestamped, and dispute-ready.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <Link href="/auth/signup" style={{ fontSize: 16, fontWeight: 800, color: 'white', background: '#ea580c', padding: '15px 36px', borderRadius: 13, textDecoration: 'none', letterSpacing: '-0.3px', boxShadow: '0 8px 32px rgba(234,88,12,0.35)' }}>
            Start 14-Day Free Trial →
          </Link>
          <Link href="/auth/login" style={{ fontSize: 16, fontWeight: 600, color: '#374151', background: '#f9fafb', border: '1.5px solid #e5e7eb', padding: '15px 28px', borderRadius: 13, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
        <p style={{ fontSize: 13, color: '#9ca3af' }}>No credit card required · Takes 2 minutes · Cancel anytime</p>

        {/* HERO VIDEO PLACEHOLDER */}
        <div style={{ maxWidth: 860, margin: '52px auto 0', background: '#0a0a0a', borderRadius: 20, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.18)', border: '1px solid #1f2937', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(234,88,12,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 }}>See SubIQ in action</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>2 minute product walkthrough</div>
          </div>
          {/* Decorative grid overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <div style={{ background: '#0a0a0a', padding: '28px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(32px, 6vw, 80px)', flexWrap: 'wrap' }}>
          {[
            { stat: '$2M+', label: 'Revenue protected per user annually' },
            { stat: '14 days', label: 'Free trial, no card needed' },
            { stat: '60 sec', label: 'Daily log, every day' },
            { stat: '100%', label: 'Built for subs, not GCs' },
          ].map(s => (
            <div key={s.stat} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: '#fff' }}>{s.stat}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SOUND FAMILIAR — INTERACTIVE ─────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>The problem</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 14 }}>Sound familiar?</h2>
          <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>These are the four situations that cost electrical and plumbing subs the most money every year. Click each one.</p>
        </div>

        {/* Problem selector tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, overflowX: 'auto', paddingBottom: 4 }}>
          {PROBLEMS.map((p, i) => (
            <button key={i} onClick={() => setActiveProblem(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 50, border: `2px solid ${activeProblem === i ? p.color : '#e5e7eb'}`, background: activeProblem === i ? `${p.color}10` : 'white', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: activeProblem === i ? p.color : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: activeProblem === i ? 'white' : '#9ca3af' }}>{p.number}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: activeProblem === i ? 700 : 500, color: activeProblem === i ? p.color : '#374151' }}>
                {p.title.split(' ').slice(0, 3).join(' ')}...
              </span>
            </button>
          ))}
        </div>

        {/* Active problem display */}
        {PROBLEMS.map((p, i) => i === activeProblem && (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, animation: 'fadeIn 0.3s ease' }}>
            {/* BEFORE */}
            <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Without SubIQ</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginBottom: 12, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{p.title}</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>{p.before}</p>
              <div style={{ background: '#fee2e2', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#991b1b' }}>
                💸 {p.stat}
              </div>
            </div>

            {/* AFTER */}
            <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 20, padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>With SubIQ</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0a0a0a', marginBottom: 12, lineHeight: 1.3, letterSpacing: '-0.3px' }}>Problem solved</h3>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>{p.after}</p>
              <div style={{ background: '#dcfce7', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                ✓ Documented, timestamped, legally protected
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ON BLACK ────────────────────────────── */}
      <section style={{ background: '#0a0a0a', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>The solution</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 50px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', lineHeight: 1.05, marginBottom: 16 }}>
              Your legal case file.<br />Built automatically.
            </h2>
            <p style={{ fontSize: 16, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
              Every feature builds your case or protects your cash. Nothing else.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: '#111', border: '1px solid #1f2937', borderRadius: 18, padding: 28, transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f2937')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: 32 }}>{f.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${f.tagColor}15`, color: f.tagColor, letterSpacing: '0.3px' }}>{f.tag}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 10, lineHeight: 1.3, letterSpacing: '-0.3px' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.7 }}>{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS + VIDEO ─────────────────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 12 }}>
              Set up in 5 minutes.<br />Use it every day.
            </h2>
            <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 36, lineHeight: 1.6 }}>The longer you use it, the stronger your case file gets.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { num: '1', title: 'Create your account', body: 'Tell us your trade, your GC name, your biggest pain. 2 minutes. No card.' },
                { num: '2', title: 'Add your active job', body: 'Project name, address, contract value. Dashboard activates immediately.' },
                { num: '3', title: 'Upload your first document', body: 'AI reads your permit or blueprint. Extracts everything. Sets expiry alerts.' },
                { num: '4', title: 'Log daily and build your case', body: '60 seconds a day. Change orders, delays, safety. Every day your protection grows.' },
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '20px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#ea580c' }}>{step.num}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#111827' }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{step.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURE VIDEO PLACEHOLDER */}
          <div style={{ background: '#0a0a0a', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(234,88,12,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>Daily Log + AI Summary</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>See how 60 seconds a day builds your case</div>
            </div>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(234,88,12,0.08) 0%, transparent 70%)' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          </div>
        </div>
      </section>

      {/* ── AI SECTION ───────────────────────────────────── */}
      <section style={{ background: '#f9fafb', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 60, alignItems: 'center' }}>

            {/* AI VIDEO PLACEHOLDER */}
            <div style={{ background: '#0a0a0a', borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(234,88,12,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', cursor: 'pointer' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 4 }}>AI Document Reader</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Watch AI read a Clark County permit</div>
              </div>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>AI Document Intelligence</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 44px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 16 }}>
                Upload any document.<br />AI reads everything.
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 28, lineHeight: 1.7 }}>
                No other software does what SubIQ's AI does for subcontractors. It does not just store your documents — it reads them, understands them, and tells you exactly what to do.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: '📋', title: 'Permits', body: 'Expiry date, special conditions, inspector name and phone, jurisdiction requirements' },
                  { icon: '🏗️', title: 'Blueprints', body: 'Scope gaps, code issues, safety flags, cost saving opportunities, RFI candidates' },
                  { icon: '📝', title: 'Contracts', body: 'Contract value, retention %, penalty clauses, payment terms, scope of work' },
                  { icon: '🪪', title: 'Licenses', body: 'License number, classifications, expiry date, automatic renewal alerts' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: 'white', borderRadius: 12, border: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, color: '#111827' }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPETITOR TABLE ─────────────────────────────── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Comparison</div>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 900, letterSpacing: '-1.2px', lineHeight: 1.1, marginBottom: 12 }}>
            Why not Procore or eSUB?
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
            Procore costs $10,000 a year and is built for GCs looking down at you. SubIQ is built for subs looking up.
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, border: '1.5px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
            {[
              { label: 'Feature', bg: '#f9fafb', color: '#9ca3af', align: 'left' },
              { label: '★ SubIQ', bg: '#0a0a0a', color: '#ea580c', align: 'center' },
              { label: 'Procore', bg: '#f9fafb', color: '#9ca3af', align: 'center' },
              { label: 'eSUB', bg: '#f9fafb', color: '#9ca3af', align: 'center' },
            ].map((h, j) => (
              <div key={j} style={{ padding: '16px 20px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', background: h.bg, color: h.color, textAlign: h.align as any, borderBottom: '1.5px solid #e5e7eb' }}>
                {h.label}
              </div>
            ))}
          </div>

          {/* Table rows */}
          {COMPARISON.map((row, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: i < COMPARISON.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ padding: '14px 20px', fontSize: 13, color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{row.feature}</div>
              <div style={{ padding: '14px 20px', textAlign: 'center', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof row.subiq === 'string'
                  ? <span style={{ fontSize: 14, fontWeight: 800, color: '#ea580c' }}>{row.subiq}</span>
                  : <Check yes={row.subiq} isSub={true} />}
              </div>
              <div style={{ padding: '14px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof row.procore === 'string'
                  ? <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{row.procore}</span>
                  : <Check yes={row.procore} isSub={false} />}
              </div>
              <div style={{ padding: '14px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {typeof row.esub === 'string'
                  ? <span style={{ fontSize: 13, color: '#6b7280' }}>{row.esub}</span>
                  : <Check yes={row.esub} isSub={false} />}
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#9ca3af' }}>Procore pricing based on publicly available estimates. eSUB pricing based on published rates.</p>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section style={{ background: '#f9fafb', padding: 'clamp(60px,8vw,100px) 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 12 }}>Pricing</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 46px)', fontWeight: 900, letterSpacing: '-1.2px', marginBottom: 10 }}>Simple pricing</h2>
            <p style={{ fontSize: 15, color: '#6b7280' }}>One dispute won pays for years of SubIQ.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {[
              {
                name: 'Starter', price: '$149', per: '/mo',
                desc: 'Solo operators and small crews',
                features: ['1 active project', 'All core features', 'AI document scanning', 'Audit export PDF', 'Email alerts', 'Email support'],
                highlight: false,
              },
              {
                name: 'Pro', price: '$299', per: '/mo',
                desc: 'Growing subs with multiple active jobs',
                features: ['Unlimited projects', 'Everything in Starter', 'GC reputation scores', '3 team seats', 'Priority support', 'Custom alerts'],
                highlight: true,
              },
            ].map(plan => (
              <div key={plan.name} style={{ background: plan.highlight ? '#0a0a0a' : 'white', border: `2px solid ${plan.highlight ? '#ea580c' : '#e5e7eb'}`, borderRadius: 22, padding: '32px 28px', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
              >
                {plan.highlight && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#ea580c', color: 'white', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? '#ea580c' : '#9ca3af', marginBottom: 10 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlight ? '#fff' : '#111827', letterSpacing: '-2px', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ fontSize: 15, color: '#9ca3af', marginLeft: 2 }}>{plan.per}</span>
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: plan.highlight ? '#d1d5db' : '#374151' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup" style={{ display: 'block', textAlign: 'center', padding: '13px', fontSize: 14, fontWeight: 800, borderRadius: 11, textDecoration: 'none', background: plan.highlight ? '#ea580c' : '#111827', color: 'white', letterSpacing: '-0.2px' }}>
                  Start free trial →
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9ca3af' }}>14-day free trial · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────── */}
      <section style={{ background: '#0a0a0a', padding: 'clamp(60px,8vw,100px) 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,88,12,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(30px, 4.5vw, 56px)', fontWeight: 900, color: '#fff', letterSpacing: '-2px', marginBottom: 18, lineHeight: 1.05 }}>
            Stop losing disputes.<br />
            <span style={{ color: '#ea580c' }}>Start building your case.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 36, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
            Every day you work without SubIQ is a day the GC has the advantage. Start your free trial today — takes 2 minutes, no card needed.
          </p>
          <Link href="/auth/signup" style={{ display: 'inline-block', fontSize: 17, fontWeight: 800, color: 'white', background: '#ea580c', padding: '17px 44px', borderRadius: 14, textDecoration: 'none', letterSpacing: '-0.3px', boxShadow: '0 8px 40px rgba(234,88,12,0.4)' }}>
            Start Free Trial — No Card Needed →
          </Link>
          <p style={{ marginTop: 16, fontSize: 13, color: '#6b7280' }}>Takes 2 minutes · 14-day trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #111827', padding: '32px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, background: '#ea580c', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>SubIQ</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Built for subs. Not against them.</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/auth/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/auth/signup" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Sign up</Link>
            <Link href="/auth/signup" style={{ fontSize: 13, fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>Start free trial →</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          nav { padding: 0 16px; }
        }
      `}</style>
    </div>
  )
}

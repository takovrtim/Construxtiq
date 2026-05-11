'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ── TYPES ──────────────────────────────────────────────────
type Trade    = 'electrical' | 'plumbing' | 'both' | 'general'
type Size     = 'solo' | 'small' | 'medium' | 'large'
type Pain     = 'scope_changes' | 'delays' | 'permits' | 'billing' | 'crew' | 'documentation'
type JobType  = 'casino' | 'commercial' | 'residential' | 'industrial' | 'mixed'

interface Profile {
  name: string
  trade: Trade | null
  size: Size | null
  pain: Pain | null
  jobType: JobType | null
  gcName: string
  projectName: string
  projectValue: string
  city: string
  state: string
}

// ── PAIN CONFIG ────────────────────────────────────────────
const PAIN_CONFIG: Record<Pain, {
  icon: string; title: string; sub: string
  solution: string; route: string; feature: string
}> = {
  scope_changes: {
    icon: '📝',
    title: 'GC changes the scope — nothing in writing',
    sub: 'They change the spec then dispute your bill at the end',
    solution: 'Every scope change logged with cost impact, time impact, and a GC approval link. They text you "go ahead" — you text back a link they have to sign.',
    route: '/changes',
    feature: 'Change Orders',
  },
  delays: {
    icon: '⏳',
    title: 'Small delays that pile up and nobody tracks',
    sub: 'GC-caused days eat your schedule and nobody documents it',
    solution: 'Delay Tracker logs every delay, who caused it, and total days lost. Export a PDF before your next GC meeting.',
    route: '/delay-tracker',
    feature: 'Delay Tracker',
  },
  permits: {
    icon: '📋',
    title: 'Permit expires and you had no idea',
    sub: 'Stop-work orders cost more than the permit renewal',
    solution: 'Auto email alerts at 14, 7, and 1 day before any permit expires. Upload your permit — AI reads it and sets the alert automatically.',
    route: '/documents',
    feature: 'Document Intelligence',
  },
  billing: {
    icon: '💵',
    title: 'Getting paid takes forever',
    sub: 'Invoicing is slow, change orders get lost, retention never gets released',
    solution: 'Invoice builder with automatic change order import. Retention tracker shows exactly what every GC owes you.',
    route: '/invoices',
    feature: 'Invoice Builder',
  },
  crew: {
    icon: '👷',
    title: "Can't see what each job actually costs",
    sub: 'Labor is your biggest cost and you track it in your head',
    solution: 'One-tap clock in/out per job. Overtime alerts. Auto labor cost calc. See your real margin on every job.',
    route: '/crew-time',
    feature: 'Crew Time Tracking',
  },
  documentation: {
    icon: '📸',
    title: 'Nothing to back you up in a dispute',
    sub: 'No photos, no logs — just your word against the GC',
    solution: 'Daily logs, timestamped photos, safety checklists — all tied to the job. AI generates a professional summary of every day on site.',
    route: '/logs',
    feature: 'Daily Log',
  },
}

const TRADE_OPTIONS = [
  { val: 'electrical' as Trade, icon: '⚡', title: 'Electrical',   sub: 'Panel, rough-in, service, inspections' },
  { val: 'plumbing'   as Trade, icon: '🔧', title: 'Plumbing',     sub: 'Rough-in, water heaters, drain, gas' },
  { val: 'both'       as Trade, icon: '⚡🔧', title: 'Both',       sub: 'Electrical and plumbing' },
  { val: 'general'    as Trade, icon: '🏗️', title: 'General',     sub: 'GC managing multiple trades' },
]

const SIZE_OPTIONS = [
  { val: 'solo'   as Size, icon: '👤', title: 'Just me',      sub: 'Solo operator' },
  { val: 'small'  as Size, icon: '👥', title: '2–5 people',   sub: 'Small crew' },
  { val: 'medium' as Size, icon: '👷', title: '6–20 people',  sub: 'Multiple crews' },
  { val: 'large'  as Size, icon: '🏢', title: '20+ people',   sub: 'Large company' },
]

const JOB_OPTIONS = [
  { val: 'casino'       as JobType, icon: '🎰', title: 'Casino / Hotel',  sub: 'Hardrock, MGM, Wynn, resorts' },
  { val: 'commercial'   as JobType, icon: '🏢', title: 'Commercial',       sub: 'Office, retail, restaurants' },
  { val: 'residential'  as JobType, icon: '🏠', title: 'Residential',      sub: 'Houses, condos, apartments' },
  { val: 'industrial'   as JobType, icon: '🏭', title: 'Industrial',       sub: 'Warehouses, data centers' },
  { val: 'mixed'        as JobType, icon: '🔀', title: 'Mixed',            sub: 'Whatever comes in' },
]

// ── OPTION CARD ────────────────────────────────────────────
function Card({ icon, title, sub, selected, onClick }: {
  icon: string; title: string; sub?: string; selected: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14,
      border: `2px solid ${selected ? '#E8520A' : '#e8e3da'}`,
      background: selected ? '#FFF4EE' : 'white',
      transition: 'all 0.12s',
    }}>
      <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#E8520A' : '#0a0a0a' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: selected ? '#E8520A' : '#888', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      </div>
      {selected && (
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#E8520A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      )}
    </button>
  )
}

// ── MAIN ───────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]       = useState(0) // 0-3 = questions, 4 = done
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [userName, setUserName] = useState('')

  const [profile, setProfile] = useState<Profile>({
    name: '', trade: null, size: null, pain: null, jobType: null,
    gcName: '', projectName: '', projectValue: '', city: 'Las Vegas', state: 'NV',
  })

  // Pull name from auth on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setProfile(p => ({ ...p, name: user.user_metadata.full_name }))
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }
    })
  }, [])

  const set = (key: keyof Profile, val: any) => setProfile(p => ({ ...p, [key]: val }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14,
    border: '1.5px solid #e8e3da', borderRadius: 10,
    fontFamily: 'inherit', outline: 'none',
    background: '#fafaf8', color: '#0a0a0a',
    boxSizing: 'border-box' as const,
  }

  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#aaa',
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase' as const, letterSpacing: '0.5px',
  }

  function canProceed(): boolean {
    if (step === 0) return !!profile.trade
    if (step === 1) return !!profile.pain
    if (step === 2) return !!profile.jobType && !!profile.size
    if (step === 3) return !!profile.projectName.trim()
    return true
  }

  async function finish() {
    if (!canProceed()) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Save user profile
    await supabase.from('users').update({
      full_name: profile.name.trim() || undefined,
      trade_type: profile.trade,
      company_size: profile.size,
      biggest_pain: profile.pain,
      project_type: profile.jobType,
      company_gc: profile.gcName.trim() || null,
      city: profile.city.trim() || null,
      state: profile.state.trim() || null,
      onboarded: true,
    }).eq('id', user.id)

    // Create first project
    await supabase.from('projects').insert({
      user_id: user.id,
      name: profile.projectName.trim(),
      address: null,
      city: profile.city.trim() || null,
      state: profile.state.trim() || null,
      total_bid: parseFloat(profile.projectValue) || null,
      status: 'active',
      trade_type: profile.trade,
      project_type: profile.jobType,
    })

    setSaving(false)

    // Route directly to their biggest pain feature
    const routes: Record<string, string> = {
      scope_changes: '/changes',
      delays: '/delay-tracker',
      permits: '/documents',
      billing: '/invoices',
      crew: '/crew-time',
      documentation: '/logs',
    }
    const dest = profile.pain ? routes[profile.pain] : '/dashboard'
    router.push(dest)
  }

  const painConfig = profile.pain ? PAIN_CONFIG[profile.pain] : null
  const firstName  = (profile.name || userName || '').split(' ')[0]

  const STEP_LABELS = ['Your trade', 'Your problem', 'Your work', 'First project']

  return (
    <div style={{
      minHeight: '100vh', background: '#fdfcfb',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px 16px',
    }}>

      {/* LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 30, height: 30, background: '#E8520A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
          </svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
      </div>

      {/* PROGRESS */}
      {step < 4 && (
        <div style={{ width: '100%', maxWidth: 520, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: i < step ? '#0a0a0a' : i === step ? '#E8520A' : '#ede9e4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                  {i < step ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === step ? 'white' : '#ccc' }} />
                  )}
                </div>
                <span style={{ fontSize: 11, fontWeight: i === step ? 700 : 400, color: i === step ? '#E8520A' : i < step ? '#0a0a0a' : '#ccc', display: 'none' }}
                  className="step-label">{label}</span>
              </div>
            ))}
          </div>
          <div style={{ height: 3, background: '#ede9e4', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: '#E8520A', borderRadius: 20, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* CARD */}
      <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 22, padding: '32px', boxShadow: '0 8px 48px rgba(0,0,0,0.07)', border: '1px solid #ede9e4' }}>

        {error && (
          <div style={{ background: '#fdf0f0', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#b83232', marginBottom: 16, border: '1px solid rgba(184,50,50,0.15)' }}>{error}</div>
        )}

        {/* ── STEP 0: TRADE ─────────────────────────── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
              {firstName ? `Hey ${firstName} 👋` : 'Welcome'}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a', lineHeight: 1.1 }}>
              What trade are you in?
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 22, lineHeight: 1.6 }}>
              We'll set up your tools, alerts, and dashboard around your specific trade.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {TRADE_OPTIONS.map(o => (
                <Card key={o.val} icon={o.icon} title={o.title} sub={o.sub} selected={profile.trade === o.val} onClick={() => set('trade', o.val)} />
              ))}
            </div>
            <button onClick={() => { if (profile.trade) setStep(1) }} disabled={!profile.trade} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: profile.trade ? 'pointer' : 'not-allowed', border: 'none', background: profile.trade ? '#0a0a0a' : '#e8e3da', color: profile.trade ? 'white' : '#aaa', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              Next →
            </button>
          </div>
        )}

        {/* ── STEP 1: BIGGEST PAIN ──────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Be honest</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a', lineHeight: 1.1 }}>
              What's your biggest problem right now?
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 22, lineHeight: 1.6 }}>
              We'll fix this first. The rest can wait.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {(Object.entries(PAIN_CONFIG) as [Pain, typeof PAIN_CONFIG[Pain]][]).map(([key, cfg]) => (
                <Card key={key} icon={cfg.icon} title={cfg.title} sub={cfg.sub} selected={profile.pain === key} onClick={() => set('pain', key)} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(0)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #e8e3da', background: 'white', color: '#666', fontFamily: 'inherit' }}>←</button>
              <button onClick={() => { if (profile.pain) setStep(2) }} disabled={!profile.pain} style={{ flex: 1, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: profile.pain ? 'pointer' : 'not-allowed', border: 'none', background: profile.pain ? '#0a0a0a' : '#e8e3da', color: profile.pain ? 'white' : '#aaa', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: JOB TYPE + SIZE ───────────────── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Your work</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a', lineHeight: 1.1 }}>
              What kind of jobs do you run?
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>Quick — two taps and you're done with this step.</p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Project type</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {JOB_OPTIONS.map(o => (
                  <button key={o.val} type="button" onClick={() => set('jobType', o.val)} style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', border: `1.5px solid ${profile.jobType === o.val ? '#E8520A' : '#e8e3da'}`, background: profile.jobType === o.val ? '#FFF4EE' : 'white', transition: 'all 0.12s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{o.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: profile.jobType === o.val ? '#E8520A' : '#0a0a0a' }}>{o.title}</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{o.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Crew size</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {SIZE_OPTIONS.map(o => (
                  <button key={o.val} type="button" onClick={() => set('size', o.val)} style={{ flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', border: `1.5px solid ${profile.size === o.val ? '#E8520A' : '#e8e3da'}`, background: profile.size === o.val ? '#FFF4EE' : 'white', transition: 'all 0.12s' }}>
                    <div style={{ fontSize: 18, marginBottom: 3 }}>{o.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: profile.size === o.val ? 700 : 400, color: profile.size === o.val ? '#E8520A' : '#555' }}>{o.title}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>GC / General Contractor (optional)</label>
              <input style={inp} placeholder="Turner Construction, Clark Construction..." value={profile.gcName} onChange={e => set('gcName', e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(1)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #e8e3da', background: 'white', color: '#666', fontFamily: 'inherit' }}>←</button>
              <button onClick={() => { if (canProceed()) setStep(3) }} disabled={!canProceed()} style={{ flex: 1, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: canProceed() ? 'pointer' : 'not-allowed', border: 'none', background: canProceed() ? '#0a0a0a' : '#e8e3da', color: canProceed() ? 'white' : '#aaa', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: FIRST PROJECT ─────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Almost done</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a', lineHeight: 1.1 }}>
              What are you working on right now?
            </h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 22, lineHeight: 1.6 }}>
              Create your first project — takes 30 seconds.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={lbl}>Project Name *</label>
                <input style={inp} autoFocus
                  placeholder={
                    profile.jobType === 'casino' ? 'Hardrock Cafe — Electrical Rough-In' :
                    profile.jobType === 'commercial' ? 'Desert Ridge Office — Panel Upgrade' :
                    profile.jobType === 'residential' ? 'Smith Residence — Rewire' :
                    profile.trade === 'plumbing' ? 'Lakeview Apartments — Plumbing Retrofit' :
                    'My First Project'
                  }
                  value={profile.projectName}
                  onChange={e => set('projectName', e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>City</label>
                  <input style={inp} placeholder="Las Vegas" value={profile.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <input style={inp} placeholder="NV" value={profile.state} onChange={e => set('state', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Contract Value ($)</label>
                <input type="number" style={inp} placeholder="250000" value={profile.projectValue} onChange={e => set('projectValue', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(2)} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #e8e3da', background: 'white', color: '#666', fontFamily: 'inherit' }}>←</button>
              <button onClick={finish} disabled={saving || !profile.projectName.trim()} style={{ flex: 1, padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: saving || !profile.projectName.trim() ? 'not-allowed' : 'pointer', border: 'none', background: saving || !profile.projectName.trim() ? '#e8e3da' : '#E8520A', color: saving || !profile.projectName.trim() ? '#aaa' : 'white', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {saving ? '⏳ Building your workspace...' : 'Launch ConstructIQ →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: LOADING ───── */}
        {step === 4 && false && (
          <div>
            {/* Big personalized welcome */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#FFF4EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 36 }}>
                {painConfig.icon}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a', lineHeight: 1.1 }}>
                {firstName ? `You're all set, ${firstName}.` : "You're all set."}
              </h1>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
                Based on what you told us, here's exactly what we built for you.
              </p>
            </div>

            {/* PERSONALIZED SOLUTION — the hero of the done screen */}
            <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '22px 24px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(232,82,10,0.15)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  Your biggest problem
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#ff8c5a', marginBottom: 12, lineHeight: 1.4 }}>
                  "{painConfig.title}"
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>
                  How ConstructIQ fixes it
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                  {painConfig.solution}
                </div>
              </div>
            </div>

            {/* Quick wins — 3 other things ready for them */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Also ready for you</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🦺', label: 'Safety checklist before crew starts', href: '/safety' },
                  { icon: '📋', label: 'Upload your permit — AI reads it', href: '/documents' },
                  { icon: '🔄', label: 'Log your first change order', href: '/changes' },
                ].filter(item => item.href !== painConfig.route).slice(0, 2).map(item => (
                  <div key={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f6f4f1', borderRadius: 10 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: '#444' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA BUTTONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => router.push(painConfig.route)} style={{ padding: '15px', fontSize: 15, fontWeight: 800, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#E8520A', color: 'white', fontFamily: 'inherit', letterSpacing: '-0.3px' }}>
                Fix my biggest problem first → {painConfig.feature}
              </button>
              <button onClick={() => router.push('/safety')} style={{ padding: '13px', fontSize: 14, fontWeight: 600, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #e8e3da', background: 'white', color: '#333', fontFamily: 'inherit' }}>
                Start today's safety checklist
              </button>
              <button onClick={() => router.push('/dashboard')} style={{ padding: '11px', fontSize: 13, fontWeight: 400, borderRadius: 12, cursor: 'pointer', border: 'none', background: 'transparent', color: '#aaa', fontFamily: 'inherit' }}>
                Go to dashboard
              </button>
            </div>

            {/* Trial reminder */}
            <div style={{ marginTop: 20, textAlign: 'center', padding: '12px', background: '#f6f4f1', borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: '#888' }}>
                ⏱️ You're on a <strong style={{ color: '#0a0a0a' }}>14-day free trial</strong> — no credit card needed
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP DOTS */}
      {step < 4 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: i === step ? 24 : 7, height: 7, borderRadius: 20, background: i === step ? '#E8520A' : i < step ? '#0a0a0a' : '#ede9e4', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// ─── TYPES ───────────────────────────────────────────────
type TradeType = 'electrical' | 'plumbing' | 'both' | 'general'
type CompanySize = 'solo' | 'small' | 'medium' | 'large'
type RoleType = 'owner' | 'foreman' | 'pm' | 'office'
type BiggestPain = 'delays' | 'scope_changes' | 'permits' | 'crew' | 'billing' | 'documentation'
type ProjectType = 'commercial' | 'residential' | 'industrial' | 'casino' | 'mixed'

interface UserProfile {
  fullName: string
  companyName: string
  tradeType: TradeType | null
  companySize: CompanySize | null
  role: RoleType | null
  biggestPain: BiggestPain | null
  projectType: ProjectType | null
  gcName: string
  licenseNum: string
  city: string
  state: string
  // First project
  projectName: string
  projectAddr: string
  projectValue: string
}

const STEPS = [
  'name',
  'trade',
  'company',
  'role',
  'pain',
  'project_type',
  'first_project',
  'done',
] as const
type Step = typeof STEPS[number]

// ─── OPTION CARDS ────────────────────────────────────────
function OptionCard({ icon, title, sub, selected, onClick }: { icon: string; title: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 12,
        border: `2px solid ${selected ? '#E8520A' : '#ede9e4'}`,
        background: selected ? '#FFF4EE' : 'white',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 26, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? '#E8520A' : '#0a0a0a', marginBottom: sub ? 2 : 0 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: selected ? '#E8520A' : '#888', lineHeight: 1.4 }}>{sub}</div>}
      </div>
      {selected && (
        <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: '#E8520A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
        </div>
      )}
    </button>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('name')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState<UserProfile>({
    fullName: '', companyName: '', tradeType: null, companySize: null,
    role: null, biggestPain: null, projectType: null,
    gcName: '', licenseNum: '', city: 'Las Vegas', state: 'NV',
    projectName: '', projectAddr: '', projectValue: '',
  })

  const set = (key: keyof UserProfile, val: any) => setProfile(p => ({ ...p, [key]: val }))

  const stepIdx = STEPS.indexOf(step)
  const progress = ((stepIdx) / (STEPS.length - 1)) * 100

  function next(s?: Step) {
    setError('')
    const nextStep = s || STEPS[stepIdx + 1]
    setStep(nextStep)
  }

  function back() {
    setError('')
    setStep(STEPS[stepIdx - 1])
  }

  // Personalized greeting based on answers
  function getPersonalizedMessage() {
    const pain = profile.biggestPain
    const trade = profile.tradeType
    if (pain === 'delays') return `We built the Delay Tracker specifically for subs like you. Every day the GC costs you — logged and exportable.`
    if (pain === 'scope_changes') return `The Scope Change Log is your new best friend. Every spec change documented before the GC can deny it.`
    if (pain === 'permits') return `Permit alerts at 14, 7, and 1 day before expiry. You'll never get a stop-work order again.`
    if (pain === 'crew') return `Crew time tracking with one-tap clock in/out. See labor cost per job in real time.`
    if (pain === 'billing') return `Invoice builder with automatic change order import. Your approved changes become line items instantly.`
    if (pain === 'documentation') return `Photos, safety checklists, daily logs — all timestamped and tied to the job. Your legal protection.`
    if (trade === 'electrical') return `Built for electricians. Panel upgrades, rough-in, inspection — we track it all.`
    if (trade === 'plumbing') return `Built for plumbers. Rough-in, inspections, permits — everything in one place.`
    return `ConstructIQ is built around how you actually work on the job site.`
  }

  function getFirstProjectPlaceholder() {
    const pt = profile.projectType
    const t = profile.tradeType
    if (pt === 'casino') return 'Hardrock Cafe — Electrical Rough-In'
    if (pt === 'commercial') return 'Desert Ridge Office — Panel Upgrade'
    if (pt === 'residential') return 'Smith Residence — Rewire'
    if (pt === 'industrial') return 'Henderson Warehouse — 3-Phase Install'
    if (t === 'plumbing') return 'Lakeview Apartments — Plumbing Retrofit'
    return 'My First Project'
  }

  async function finish() {
    if (!profile.projectName.trim()) { setError('Project name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Update user profile
    await supabase.from('users').update({
      full_name: profile.fullName.trim() || undefined,
      company_name: profile.companyName.trim() || null,
      trade_type: profile.tradeType,
      company_size: profile.companySize,
      role_type: profile.role,
      biggest_pain: profile.biggestPain,
      project_type: profile.projectType,
      company_gc: profile.gcName.trim() || null,
      license_number: profile.licenseNum.trim() || null,
      city: profile.city.trim() || null,
      state: profile.state.trim() || null,
      onboarded: true,
    }).eq('id', user.id)

    // Create first project
    await supabase.from('projects').insert({
      user_id: user.id,
      name: profile.projectName.trim(),
      address: profile.projectAddr.trim() || null,
      city: profile.city.trim() || null,
      state: profile.state.trim() || null,
      total_bid: parseFloat(profile.projectValue) || null,
      status: 'active',
      trade_type: profile.tradeType,
      project_type: profile.projectType,
    })

    setSaving(false)
    next('done')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14,
    border: '1.5px solid #ede9e4', borderRadius: 10,
    fontFamily: 'inherit', outline: 'none',
    background: '#fafafa', color: '#0a0a0a',
    boxSizing: 'border-box' as const,
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#888',
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
  }

  const NextBtn = ({ label = 'Next →', onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', background: disabled ? '#ede9e4' : '#0a0a0a', color: disabled ? '#aaa' : 'white', fontFamily: 'inherit', marginTop: 8 }}>
      {label}
    </button>
  )

  const BackBtn = () => (
    <button onClick={back} style={{ width: '100%', padding: '10px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: 'none', background: 'transparent', color: '#aaa', fontFamily: 'inherit', marginTop: 4 }}>
      ← Back
    </button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#fdfcfb', fontFamily: "'DM Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <div style={{ width: 30, height: 30, background: '#E8520A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
      </div>

      {/* Progress */}
      {step !== 'done' && (
        <div style={{ width: '100%', maxWidth: 500, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#aaa' }}>Setting up your workspace</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>{stepIdx + 1} of {STEPS.length - 1}</span>
          </div>
          <div style={{ height: 4, background: '#ede9e4', borderRadius: 20, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#E8520A', borderRadius: 20, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 500, background: 'white', borderRadius: 22, padding: '32px', boxShadow: '0 8px 40px rgba(0,0,0,0.07)', border: '1px solid #ede9e4' }}>

        {error && <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#b83232', marginBottom: 16 }}>{error}</div>}

        {/* ── STEP: NAME ── */}
        {step === 'name' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Welcome</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>Let's set up your workspace.</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 1.6 }}>A few quick questions so ConstructIQ works the way you do.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Your Name</label>
                <input style={inp} placeholder="John Rodriguez" value={profile.fullName} onChange={e => set('fullName', e.target.value)} autoFocus />
              </div>
              <div>
                <label style={lbl}>Company Name</label>
                <input style={inp} placeholder="Rodriguez Electric LLC" value={profile.companyName} onChange={e => set('companyName', e.target.value)} />
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
              <NextBtn label="Let's go →" onClick={() => next()} disabled={!profile.fullName.trim()} />
            </div>
          </div>
        )}

        {/* ── STEP: TRADE ── */}
        {step === 'trade' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Your Trade</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>What trade are you in?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>We'll tailor your dashboard and alerts to your trade.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { val: 'electrical', icon: '⚡', title: 'Electrical', sub: 'Panel upgrades, rough-in, service calls, inspections' },
                { val: 'plumbing',   icon: '🔧', title: 'Plumbing',   sub: 'Rough-in, water heaters, drain work, gas lines' },
                { val: 'both',       icon: '⚡🔧', title: 'Both',    sub: 'Electrical and plumbing on the same jobs' },
                { val: 'general',    icon: '🏗️', title: 'General Contractor', sub: 'Managing subs across multiple trades' },
              ] as const).map(opt => (
                <OptionCard key={opt.val} icon={opt.icon} title={opt.title} sub={opt.sub} selected={profile.tradeType === opt.val} onClick={() => set('tradeType', opt.val)} />
              ))}
              <NextBtn onClick={() => next()} disabled={!profile.tradeType} />
              <BackBtn />
            </div>
          </div>
        )}

        {/* ── STEP: COMPANY SIZE ── */}
        {step === 'company' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Your Team</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>How big is your crew?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>This helps us set up crew tracking for you.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 8 }}>
              {([
                { val: 'solo',   icon: '👤', title: 'Just me',        sub: 'Solo operator, I do it all' },
                { val: 'small',  icon: '👥', title: '2–5 people',     sub: 'Small crew, tight operation' },
                { val: 'medium', icon: '👷', title: '6–20 people',    sub: 'Multiple crews on multiple jobs' },
                { val: 'large',  icon: '🏢', title: '20+ people',     sub: 'Large company, multiple foremen' },
              ] as const).map(opt => (
                <OptionCard key={opt.val} icon={opt.icon} title={opt.title} sub={opt.sub} selected={profile.companySize === opt.val} onClick={() => set('companySize', opt.val)} />
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={lbl}>GC / General Contractor Name</label>
              <input style={inp} placeholder="Turner Construction, Clark Construction..." value={profile.gcName} onChange={e => set('gcName', e.target.value)} />
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>The GC you report to (optional)</div>
            </div>
            <NextBtn onClick={() => next()} disabled={!profile.companySize} />
            <BackBtn />
          </div>
        )}

        {/* ── STEP: ROLE ── */}
        {step === 'role' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Your Role</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>What's your role?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>We'll show you the most relevant tools first.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { val: 'owner',   icon: '🏆', title: 'Owner / Partner', sub: 'Running the business, handling bids and billing' },
                { val: 'foreman', icon: '👷', title: 'Foreman',          sub: 'Running the crew on site every day' },
                { val: 'pm',      icon: '📋', title: 'Project Manager',  sub: 'Tracking jobs, permits, and schedule' },
                { val: 'office',  icon: '💼', title: 'Office / Admin',   sub: 'Invoicing, documents, scheduling' },
              ] as const).map(opt => (
                <OptionCard key={opt.val} icon={opt.icon} title={opt.title} sub={opt.sub} selected={profile.role === opt.val} onClick={() => set('role', opt.val)} />
              ))}
              <NextBtn onClick={() => next()} disabled={!profile.role} />
              <BackBtn />
            </div>
          </div>
        )}

        {/* ── STEP: BIGGEST PAIN ── */}
        {step === 'pain' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Your Biggest Problem</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>What keeps you up at night?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Be honest — we'll make sure that gets solved first.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { val: 'delays',        icon: '⏳', title: 'Small delays that add up', sub: 'GC changes push your schedule and nobody tracks it' },
                { val: 'scope_changes', icon: '📝', title: 'GC scope changes with no paper trail', sub: 'They change the spec then dispute your bill' },
                { val: 'permits',       icon: '📋', title: 'Permit tracking and expiry', sub: 'Permits slip through the cracks and you get stop-work orders' },
                { val: 'crew',          icon: '👷', title: 'Crew time and labor costs', sub: "Can't see what each job actually costs in labor" },
                { val: 'billing',       icon: '💵', title: 'Getting paid on time', sub: 'Invoicing is slow and change orders get lost' },
                { val: 'documentation', icon: '📸', title: 'Documenting everything', sub: 'No photos, no logs — nothing to back you up in a dispute' },
              ] as const).map(opt => (
                <OptionCard key={opt.val} icon={opt.icon} title={opt.title} sub={opt.sub} selected={profile.biggestPain === opt.val} onClick={() => set('biggestPain', opt.val)} />
              ))}
              <NextBtn onClick={() => next()} disabled={!profile.biggestPain} />
              <BackBtn />
            </div>
          </div>
        )}

        {/* ── STEP: PROJECT TYPE ── */}
        {step === 'project_type' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Your Work</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>What kind of projects do you run?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>We'll set up your first project the right way.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {([
                { val: 'commercial',   icon: '🏢', title: 'Commercial',          sub: 'Office buildings, retail, restaurants' },
                { val: 'residential',  icon: '🏠', title: 'Residential',          sub: 'Houses, condos, apartments' },
                { val: 'industrial',   icon: '🏭', title: 'Industrial',           sub: 'Warehouses, manufacturing, data centers' },
                { val: 'casino',       icon: '🎰', title: 'Hospitality / Casino',  sub: 'Hotels, casinos, entertainment venues' },
                { val: 'mixed',        icon: '🔀', title: 'Mixed',               sub: 'Whatever comes in the door' },
              ] as const).map(opt => (
                <OptionCard key={opt.val} icon={opt.icon} title={opt.title} sub={opt.sub} selected={profile.projectType === opt.val} onClick={() => set('projectType', opt.val)} />
              ))}
              <NextBtn onClick={() => next()} disabled={!profile.projectType} />
              <BackBtn />
            </div>
          </div>
        )}

        {/* ── STEP: FIRST PROJECT ── */}
        {step === 'first_project' && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8520A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>First Project</div>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8, color: '#0a0a0a' }}>What are you working on right now?</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Set up your first job — you can add more anytime.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Project Name *</label>
                <input style={inp} placeholder={getFirstProjectPlaceholder()} value={profile.projectName} onChange={e => set('projectName', e.target.value)} autoFocus />
              </div>
              <div>
                <label style={lbl}>Job Address</label>
                <input style={inp} placeholder="4455 Paradise Rd, Las Vegas, NV" value={profile.projectAddr} onChange={e => set('projectAddr', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Contract Value ($)</label>
                <input type="number" style={inp} placeholder="250000" value={profile.projectValue} onChange={e => set('projectValue', e.target.value)} />
              </div>
              <div>
                <label style={lbl}>License Number</label>
                <input style={inp} placeholder="EC-12345" value={profile.licenseNum} onChange={e => set('licenseNum', e.target.value)} />
              </div>
              <button onClick={finish} disabled={saving || !profile.projectName.trim()} style={{ width: '100%', padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: saving || !profile.projectName.trim() ? 'not-allowed' : 'pointer', border: 'none', background: saving || !profile.projectName.trim() ? '#ede9e4' : '#E8520A', color: saving || !profile.projectName.trim() ? '#aaa' : 'white', fontFamily: 'inherit', marginTop: 8 }}>
                {saving ? 'Setting up your workspace...' : 'Launch ConstructIQ →'}
              </button>
              <BackBtn />
            </div>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, background: '#FFF4EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
              🎉
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 10, color: '#0a0a0a' }}>
              Welcome{profile.fullName ? `, ${profile.fullName.split(' ')[0]}` : ''}!
            </h1>
            <p style={{ fontSize: 15, color: '#444', lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              {getPersonalizedMessage()}
            </p>

            {/* Personalized first action based on pain point */}
            <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '20px 22px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 12 }}>
                Your workspace is ready
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  profile.biggestPain === 'delays' && { icon: '📅', label: 'Delay Tracker', href: '/delay-tracker', highlight: true },
                  profile.biggestPain === 'scope_changes' && { icon: '📊', label: 'Scope Change Log', href: '/scope-changes', highlight: true },
                  profile.biggestPain === 'permits' && { icon: '📋', label: 'Documents & Permits', href: '/documents', highlight: true },
                  profile.biggestPain === 'crew' && { icon: '⏱️', label: 'Crew Time Tracking', href: '/crew-time', highlight: true },
                  profile.biggestPain === 'billing' && { icon: '💵', label: 'Invoice Builder', href: '/invoices', highlight: true },
                  profile.biggestPain === 'documentation' && { icon: '📸', label: 'Photo Documentation', href: '/photos', highlight: true },
                  { icon: '🦺', label: 'Safety Checklist', href: '/safety', highlight: false },
                  { icon: '🔧', label: 'Job Board', href: '/jobs', highlight: false },
                  { icon: '🏠', label: 'Dashboard', href: '/dashboard', highlight: false },
                ].filter(Boolean).slice(0, 3).map((item: any) => (
                  <div key={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: item.highlight ? 'rgba(232,82,10,0.15)' : 'rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: 16 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: item.highlight ? 700 : 400, color: item.highlight ? '#ff8c5a' : 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                    {item.highlight && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#E8520A', background: 'rgba(232,82,10,0.2)', padding: '2px 8px', borderRadius: 20 }}>START HERE</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.biggestPain && (
                <button onClick={() => router.push(
                  profile.biggestPain === 'delays' ? '/delay-tracker' :
                  profile.biggestPain === 'scope_changes' ? '/scope-changes' :
                  profile.biggestPain === 'permits' ? '/documents' :
                  profile.biggestPain === 'crew' ? '/crew-time' :
                  profile.biggestPain === 'billing' ? '/invoices' :
                  '/photos'
                )} style={{ padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#E8520A', color: 'white', fontFamily: 'inherit' }}>
                  Fix my biggest problem first →
                </button>
              )}
              <button onClick={() => router.push('/safety')} style={{ padding: '13px', fontSize: 14, fontWeight: 600, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #ede9e4', background: 'white', color: '#333', fontFamily: 'inherit' }}>
                Start today's safety checklist
              </button>
              <button onClick={() => router.push('/dashboard')} style={{ padding: '11px', fontSize: 13, fontWeight: 400, borderRadius: 12, cursor: 'pointer', border: 'none', background: 'transparent', color: '#aaa', fontFamily: 'inherit' }}>
                Go to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step dots */}
      {step !== 'done' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 24 }}>
          {STEPS.filter(s => s !== 'done').map((s, i) => (
            <div key={s} style={{ width: s === step ? 20 : 7, height: 7, borderRadius: 20, background: s === step ? '#E8520A' : STEPS.indexOf(s) < stepIdx ? '#0a0a0a' : '#ede9e4', transition: 'all 0.3s' }} />
          ))}
        </div>
      )}
    </div>
  )
}

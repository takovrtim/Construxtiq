'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STEPS = ['welcome', 'project', 'trade', 'done'] as const
type Step = typeof STEPS[number]

const FEATURES = [
  { icon: '📅', title: 'Delay Tracker', sub: 'Log every GC-caused delay with dates and days lost. Export PDF for meetings.' },
  { icon: '📊', title: 'Scope Change Log', sub: 'Document every spec change — original vs new, cost impact, time impact.' },
  { icon: '📋', title: 'Permit Alerts', sub: 'Auto email at 14, 7, and 1 day before any permit expires.' },
  { icon: '🦺', title: 'Safety Checklists', sub: '17-item pre-job checklist. Timestamped. Your legal protection.' },
  { icon: '🔄', title: 'GC Approvals', sub: 'Send a link. GC approves or rejects from their phone. Documented.' },
  { icon: '💵', title: 'Invoice Builder', sub: 'Professional invoices. Approved changes import automatically.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Project form
  const [projectName, setProjectName] = useState('')
  const [projectAddr, setProjectAddr] = useState('')
  const [projectCity, setProjectCity] = useState('')
  const [projectState, setProjectState] = useState('NV')
  const [projectValue, setProjectValue] = useState('')

  // Trade
  const [tradeType, setTradeType] = useState<'electrical' | 'plumbing' | 'both'>('electrical')
  const [gcName, setGcName] = useState('')
  const [licenseNum, setLicenseNum] = useState('')

  const stepIdx = STEPS.indexOf(step)
  const progress = ((stepIdx + 1) / STEPS.length) * 100

  async function createProject() {
    if (!projectName.trim()) { setError('Project name is required'); return }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    // Create project
    const { error: projErr } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projectName.trim(),
      address: projectAddr.trim() || null,
      city: projectCity.trim() || null,
      state: projectState || 'NV',
      total_bid: parseFloat(projectValue) || null,
      status: 'active',
      trade_type: tradeType,
    })

    if (projErr) { setError('Failed to create project. Try again.'); setSaving(false); return }

    // Update user profile
    await supabase.from('users').update({
      trade_type: tradeType,
      company_gc: gcName.trim() || null,
      license_number: licenseNum.trim() || null,
      onboarded: true,
    }).eq('id', user.id)

    setSaving(false)
    setStep('done')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14,
    border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10,
    fontFamily: 'inherit', outline: 'none',
    background: '#f8f7f4', color: '#0a0a0a', boxSizing: 'border-box' as const,
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#666',
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fdfcfb',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '20px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 32, height: 32, background: '#E8520A', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
          </svg>
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>ConstructIQ</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 520, height: 4, background: '#ede9e4', borderRadius: 20, marginBottom: 36, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#E8520A', borderRadius: 20, transition: 'width 0.4s ease' }} />
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 520, background: 'white', borderRadius: 22, padding: '36px 36px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #ede9e4' }}>

        {/* WELCOME */}
        {step === 'welcome' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>⚡</div>
            <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 12, color: '#0a0a0a' }}>Welcome to ConstructIQ</h1>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
              Built for electrical and plumbing subs. Everything the GC tries to blame you for — you'll have proof.
            </p>
            <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '22px 24px', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 14 }}>What this does for you</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Log GC scope changes with cost and time impact',
                  'Track every delay and who caused it',
                  'Get permit expiry alerts before it\'s too late',
                  'Generate GC approval links for change orders',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E8520A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0, marginTop: 1 }}>✓</div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('project')} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#E8520A', color: 'white', fontFamily: 'inherit' }}>
              Get Started →
            </button>
          </div>
        )}

        {/* PROJECT */}
        {step === 'project' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a' }}>Create your first project</h1>
              <p style={{ fontSize: 14, color: '#666' }}>Every job, permit, and change order lives under a project.</p>
            </div>

            {error && (
              <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#b83232', marginBottom: 16 }}>{error}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Project Name *</label>
                <input style={inp} placeholder="Hardrock Cafe — Electrical Rough-In" value={projectName} onChange={e => setProjectName(e.target.value)} autoFocus />
              </div>
              <div>
                <label style={lbl}>Job Address</label>
                <input style={inp} placeholder="4455 Paradise Rd, Las Vegas, NV" value={projectAddr} onChange={e => setProjectAddr(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={lbl}>City</label>
                  <input style={inp} placeholder="Las Vegas" value={projectCity} onChange={e => setProjectCity(e.target.value)} />
                </div>
                <div>
                  <label style={lbl}>State</label>
                  <input style={inp} placeholder="NV" value={projectState} onChange={e => setProjectState(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Contract Value ($)</label>
                <input type="number" style={inp} placeholder="250000" value={projectValue} onChange={e => setProjectValue(e.target.value)} />
              </div>
              <button onClick={() => {
                if (!projectName.trim()) { setError('Project name is required'); return }
                setError(''); setStep('trade')
              }} style={{ padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#0a0a0a', color: 'white', fontFamily: 'inherit', marginTop: 4 }}>
                Next →
              </button>
              <button onClick={() => setStep('welcome')} style={{ padding: '10px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: 'none', background: 'transparent', color: '#999', fontFamily: 'inherit' }}>← Back</button>
            </div>
          </div>
        )}

        {/* TRADE */}
        {step === 'trade' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6, color: '#0a0a0a' }}>Tell us about your business</h1>
              <p style={{ fontSize: 14, color: '#666' }}>We'll tailor the app to your trade.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl}>Trade Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['electrical', 'plumbing', 'both'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTradeType(t)} style={{ flex: 1, padding: '12px 8px', fontSize: 13, fontWeight: tradeType === t ? 700 : 400, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${tradeType === t ? '#E8520A' : '#ede9e4'}`, background: tradeType === t ? '#FFF4EE' : '#fdfcfb', color: tradeType === t ? '#E8520A' : '#555', textAlign: 'center' as const }}>
                      {t === 'electrical' ? '⚡ Electrical' : t === 'plumbing' ? '🔧 Plumbing' : '⚡🔧 Both'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={lbl}>General Contractor Name</label>
                <input style={inp} placeholder="Turner Construction" value={gcName} onChange={e => setGcName(e.target.value)} />
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>The GC you report to on this project</div>
              </div>
              <div>
                <label style={lbl}>License Number</label>
                <input style={inp} placeholder="EC-12345 or C-36-987654" value={licenseNum} onChange={e => setLicenseNum(e.target.value)} />
              </div>
              <button onClick={createProject} disabled={saving} style={{ padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', background: saving ? 'rgba(232,82,10,0.4)' : '#E8520A', color: 'white', fontFamily: 'inherit', marginTop: 4 }}>
                {saving ? 'Setting up...' : 'Create my workspace →'}
              </button>
              <button onClick={() => setStep('project')} style={{ padding: '10px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: 'none', background: 'transparent', color: '#999', fontFamily: 'inherit' }}>← Back</button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#edf5f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 30 }}>✅</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 10, color: '#0a0a0a' }}>You're all set.</h1>
            <p style={{ fontSize: 15, color: '#555', lineHeight: 1.7, marginBottom: 32 }}>
              Your project is live. Start by logging today's safety checklist before the crew starts.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ padding: '14px', background: '#f8f7f4', borderRadius: 12, border: '1px solid #ede9e4', textAlign: 'left' as const }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: '#0a0a0a' }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: '#777', lineHeight: 1.5 }}>{f.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => router.push('/safety')} style={{ padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#E8520A', color: 'white', fontFamily: 'inherit' }}>
                Start safety checklist →
              </button>
              <button onClick={() => router.push('/dashboard')} style={{ padding: '12px', fontSize: 14, fontWeight: 500, borderRadius: 12, cursor: 'pointer', border: '1.5px solid #ede9e4', background: 'white', color: '#555', fontFamily: 'inherit' }}>
                Go to dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ width: i === stepIdx ? 24 : 8, height: 8, borderRadius: 20, background: i === stepIdx ? '#E8520A' : i < stepIdx ? '#0a0a0a' : '#ede9e4', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to SubIQ',
    subtitle: 'The operating system for electrical and plumbing contractors.',
    icon: 'ðŸ—ï¸',
  },
  {
    id: 'project',
    title: 'Create your first project',
    subtitle: 'Everything in SubIQ is organized around projects.',
    icon: 'ðŸ“‹',
  },
  {
    id: 'tour',
    title: "Here's what you can do",
    subtitle: 'A quick look at your most powerful tools.',
    icon: 'âš¡',
  },
  {
    id: 'done',
    title: "You're all set.",
    subtitle: 'Your project is ready. Let\'s go.',
    icon: 'âœ…',
  },
]

const FEATURES = [
  { icon: 'ðŸ“¸', title: 'Photo Documentation', sub: 'Before/after shots, issue photos â€” all organized by job' },
  { icon: 'ðŸ¦º', title: 'Daily Safety Checks', sub: '17-item pre-job checklist creates a timestamped legal record' },
  { icon: 'ðŸ”„', title: 'Change Order Approvals', sub: 'Send owners a link â€” they approve or reject from their phone' },
  { icon: 'â±ï¸', title: 'Crew Time Tracking', sub: 'Clock in/out per job, overtime alerts, auto labor cost calc' },
  { icon: 'ðŸ“‹', title: 'Permit Alerts', sub: 'Get emailed 14 days before any permit expires' },
  { icon: 'ðŸ’µ', title: 'Invoice Builder', sub: 'Professional invoices that import your approved change orders' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep]             = useState(0)
  const [saving, setSaving]         = useState(false)

  // Project form
  const [projectName, setProjectName]   = useState('')
  const [projectAddr, setProjectAddr]   = useState('')
  const [projectCity, setProjectCity]   = useState('')
  const [projectState, setProjectState] = useState('NV')
  const [projectBid, setProjectBid]     = useState('')
  const [tradeType, setTradeType]       = useState<'electrical' | 'plumbing' | 'both'>('electrical')

  async function createProject() {
    if (!projectName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      name: projectName.trim(),
      address: projectAddr.trim() || null,
      city: projectCity.trim() || null,
      state: projectState,
      total_bid: parseFloat(projectBid) || null,
      status: 'active',
      trade_type: tradeType,
    })

    if (!error) {
      await supabase.from('users').update({ onboarded: true }).eq('id', user.id)
      setStep(2)
    }
    setSaving(false)
  }

  function finish() {
    router.push('/dashboard')
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: '-apple-system, BlinkMacSystemFont, "DM Sans", sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, background: '#d95f2b', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
            <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
            <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
            <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
          </svg>
        </div>
        <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.4px' }}>SubIQ</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 560, height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 20, marginBottom: 40, overflow: 'hidden' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: '#d95f2b', borderRadius: 20, transition: 'width 0.4s ease' }} />
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 560, background: '#131A26', borderRadius: 24, padding: '40px 40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

        {/* WELCOME */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>{STEPS[0].icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>{STEPS[0].title}</div>
            <div style={{ fontSize: 15, color: '#6b6a66', marginBottom: 32, lineHeight: 1.6 }}>{STEPS[0].subtitle}</div>
            <div style={{ background: '#131A26', borderRadius: 16, padding: '24px 28px', marginBottom: 32, textAlign: 'left', color: 'white' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, marginBottom: 14 }}>Built for</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Electrical contractors', 'Plumbing contractors', 'General contractors doing both'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2d7a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>âœ“</div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(1)} style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
              Get Started â†’
            </button>
          </div>
        )}

        {/* PROJECT SETUP */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{STEPS[1].title}</div>
            <div style={{ fontSize: 14, color: '#9e9d99', marginBottom: 28 }}>{STEPS[1].subtitle}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Project Name *</label>
                <input style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', boxSizing: 'border-box' }} placeholder="Smith Residence â€” Panel Upgrade" value={projectName} onChange={e => setProjectName(e.target.value)} autoFocus />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Trade Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['electrical','plumbing','both'] as const).map(t => (
                    <button key={t} type="button" onClick={() => setTradeType(t)} style={{ flex: 1, padding: '10px 8px', fontSize: 13, fontWeight: tradeType===t?700:400, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${tradeType===t?'#d95f2b':'rgba(0,0,0,0.1)'}`, background: tradeType===t?'#fdf0e8':'white', color: tradeType===t?'#d95f2b':'#6b6a66', textTransform: 'capitalize' }}>
                      {t === 'electrical' ? 'âš¡ Electrical' : t === 'plumbing' ? 'ðŸ”§ Plumbing' : 'âš¡ðŸ”§ Both'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Job Address</label>
                <input style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', boxSizing: 'border-box' }} placeholder="1234 Desert Blvd" value={projectAddr} onChange={e => setProjectAddr(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>City</label>
                  <input style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="Las Vegas" value={projectCity} onChange={e => setProjectCity(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>State</label>
                  <input style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="NV" value={projectState} onChange={e => setProjectState(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Contract Value ($)</label>
                <input type="number" style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', boxSizing: 'border-box' }} placeholder="45000" value={projectBid} onChange={e => setProjectBid(e.target.value)} />
              </div>

              <button onClick={createProject} disabled={saving || !projectName.trim()} style={{ padding: '15px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: saving||!projectName.trim()?'not-allowed':'pointer', border: 'none', background: saving||!projectName.trim()?'#f1ede6':'#d95f2b', color: saving||!projectName.trim()?'#9e9d99':'white', fontFamily: 'inherit', marginTop: 4 }}>
                {saving ? 'Creating...' : 'Create Project â†’'}
              </button>

              <button onClick={() => setStep(0)} style={{ padding: '10px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: 'none', background: 'transparent', color: '#9e9d99', fontFamily: 'inherit' }}>â† Back</button>
            </div>
          </div>
        )}

        {/* FEATURE TOUR */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 6 }}>{STEPS[2].title}</div>
            <div style={{ fontSize: 14, color: '#9e9d99', marginBottom: 24 }}>{STEPS[2].subtitle}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{ padding: '14px 16px', background: '#f8f7f4', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: '#9e9d99', lineHeight: 1.5 }}>{f.sub}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(3)} style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
              Got it â†’
            </button>
          </div>
        )}

        {/* DONE */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>{STEPS[3].icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 12 }}>{STEPS[3].title}</div>
            <div style={{ fontSize: 15, color: '#6b6a66', marginBottom: 32, lineHeight: 1.6 }}>Your project is created and SubIQ is ready. Start by logging today's safety checklist or adding your crew.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={finish} style={{ width: '100%', padding: '15px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
                Open Dashboard â†’
              </button>
              <button onClick={() => { finish() }} style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 600, borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'transparent', color: '#6b6a66', fontFamily: 'inherit' }}>
                Go to Safety Checklist first
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 20, background: i === step ? '#d95f2b' : i < step ? '#0f0f0f' : 'rgba(0,0,0,0.12)', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props { user: any }

const TRADES = [
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'plumbing',   label: 'Plumbing',   icon: '🔧' },
  { id: 'mechanical', label: 'Mechanical', icon: '❄️' },
  { id: 'general',    label: 'General',    icon: '🏗️' },
  { id: 'other',      label: 'Other',      icon: '📋' },
]

const PAINS = [
  { id: 'scope_changes',  label: 'GC changes scope, never pays', icon: '💸' },
  { id: 'delays',         label: 'GC delays kill my schedule',   icon: '⏱️' },
  { id: 'retention',      label: 'Retention held way too long',  icon: '💵' },
  { id: 'permits',        label: 'Permit issues and surprises',  icon: '📋' },
  { id: 'documentation',  label: 'No paper trail for disputes',  icon: '📝' },
]

export default function OnboardingFlow({ user }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 — Trade
  const [trade, setTrade] = useState('')

  // Step 2 — Pain
  const [pain, setPain] = useState('')

  // Step 3 — GC + Company
  const [gcName, setGcName] = useState('')
  const [companyName, setCompanyName] = useState(user?.company_name || '')
  const [phone, setPhone] = useState(user?.phone || '')

  // Step 4 — First project
  const [projectName, setProjectName] = useState('')

  const totalSteps = 4

  async function saveAndNext() {
    if (step === 1 && !trade) return
    if (step === 2 && !pain) return
    if (step === 3) {
      // Save user profile
      await supabase.from('users').update({
        trade_type: trade,
        biggest_pain: pain,
        company_gc: gcName.trim() || null,
        company_name: companyName.trim() || null,
        phone: phone.trim() || null,
      }).eq('id', user.id)
    }
    if (step === 4) {
      if (!projectName.trim()) return
      setSaving(true)
      // Create first project
      const { data: project } = await supabase.from('projects').insert({
        user_id: user.id,
        name: projectName.trim(),
        status: 'active',
        trade_type: trade,
        gc_name: gcName.trim() || null,
      }).select().single()

      // Mark onboarded
      await supabase.from('users').update({ onboarded: true }).eq('id', user.id)

      setSaving(false)
      router.push('/dashboard')
      return
    }
    setStep(s => s + 1)
  }

  const progressPct = ((step - 1) / totalSteps) * 100

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "-apple-system, 'DM Sans', sans-serif",
    }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
        <div style={{ width: 34, height: 34, background: '#ea580c', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="17" height="17" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>SubIQ</span>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B8497' }}>Step {step} of {totalSteps}</span>
          <span style={{ fontSize: 12, color: '#7B8497' }}>{Math.round(progressPct)}% complete</span>
        </div>
        <div style={{ height: 3, background: '#1f2937', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: '#ea580c', borderRadius: 20, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 480, background: '#07090E', border: '1px solid #1f2937', borderRadius: 20, padding: '32px 28px' }}>

        {/* ── STEP 1 — TRADE ───────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Step 1</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
              What trade are you in?
            </h2>
            <p style={{ fontSize: 14, color: '#7B8497', marginBottom: 24 }}>
              SubIQ personalizes everything to your trade.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TRADES.map(t => (
                <button key={t.id} onClick={() => setTrade(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  border: `2px solid ${trade === t.id ? '#ea580c' : '#1f2937'}`,
                  background: trade === t.id ? 'rgba(234,88,12,0.08)' : '#0a0a0a',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: trade === t.id ? 700 : 500, color: trade === t.id ? '#fff' : '#9ca3af' }}>{t.label}</span>
                  {trade === t.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2 — BIGGEST PAIN ────────────────────── */}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Step 2</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
              What costs you the most money?
            </h2>
            <p style={{ fontSize: 14, color: '#7B8497', marginBottom: 24 }}>
              SubIQ protects you where it hurts most.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAINS.map(p => (
                <button key={p.id} onClick={() => setPain(p.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'inherit', textAlign: 'left',
                  border: `2px solid ${pain === p.id ? '#ea580c' : '#1f2937'}`,
                  background: pain === p.id ? 'rgba(234,88,12,0.08)' : '#0a0a0a',
                  transition: 'all 0.15s',
                }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: pain === p.id ? 700 : 500, color: pain === p.id ? '#fff' : '#9ca3af' }}>{p.label}</span>
                  {pain === p.id && (
                    <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3 — GC + COMPANY ────────────────────── */}
        {step === 3 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Step 3</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
              Who do you work for?
            </h2>
            <p style={{ fontSize: 14, color: '#7B8497', marginBottom: 24 }}>
              SubIQ uses this to personalize your change orders and delays.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7B8497', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Your Company Name
                </label>
                <input
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #1f2937', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#0a0a0a', color: '#fff', boxSizing: 'border-box' as const }}
                  placeholder="Siao Electric LLC"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7B8497', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  General Contractor (GC)
                </label>
                <input
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #1f2937', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#0a0a0a', color: '#fff', boxSizing: 'border-box' as const }}
                  placeholder="Turner Construction"
                  value={gcName}
                  onChange={e => setGcName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7B8497', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid #1f2937', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#0a0a0a', color: '#fff', boxSizing: 'border-box' as const }}
                  placeholder="(702) 555-0100"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(234,88,12,0.08)', borderRadius: 10, border: '1px solid rgba(234,88,12,0.2)' }}>
              <div style={{ fontSize: 12, color: '#ea580c', lineHeight: 1.6 }}>
                Every change order and delay you log will reference {gcName || 'your GC'} automatically. No re-typing.
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4 — FIRST PROJECT ───────────────────── */}
        {step === 4 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Step 4</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1.2 }}>
              Name your first job
            </h2>
            <p style={{ fontSize: 14, color: '#7B8497', marginBottom: 24 }}>
              Your case file starts building the moment you create it.
            </p>
            <input
              style={{ width: '100%', padding: '14px 16px', fontSize: 16, border: '1.5px solid #1f2937', borderRadius: 12, fontFamily: 'inherit', outline: 'none', background: '#0a0a0a', color: '#fff', boxSizing: 'border-box' as const, marginBottom: 16 }}
              placeholder="Hardrock Hotel — Electrical Rough-In"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && projectName.trim()) saveAndNext() }}
            />

            {/* What happens next */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '📝', text: 'Your dashboard activates immediately' },
                { icon: '🤖', text: 'Upload a permit or blueprint — AI reads it in seconds' },
                { icon: '🔄', text: 'Log a change order — send Turner an approval link' },
                { icon: '⚖️', text: 'Every day you use it, your legal case gets stronger' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#0a0a0a', borderRadius: 9, border: '1px solid #1f2937' }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: '#545B6C' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={saveAndNext}
          disabled={
            saving ||
            (step === 1 && !trade) ||
            (step === 2 && !pain) ||
            (step === 4 && !projectName.trim())
          }
          style={{
            width: '100%', marginTop: 24,
            padding: '15px', fontSize: 15, fontWeight: 800,
            borderRadius: 12, cursor: 'pointer', border: 'none',
            fontFamily: 'inherit', letterSpacing: '-0.2px',
            background: saving || (step === 1 && !trade) || (step === 2 && !pain) || (step === 4 && !projectName.trim())
              ? '#1f2937' : '#ea580c',
            color: saving || (step === 1 && !trade) || (step === 2 && !pain) || (step === 4 && !projectName.trim())
              ? '#6b7280' : 'white',
            transition: 'all 0.15s',
          }}
        >
          {saving ? 'Setting up your account...' :
           step === 4 ? 'Launch SubIQ' :
           step === 3 ? 'Continue' : 'Continue'}
        </button>

        {/* Skip option for step 3 */}
        {step === 3 && (
          <button onClick={() => setStep(4)} style={{ width: '100%', marginTop: 10, padding: '10px', fontSize: 13, fontWeight: 500, color: '#7B8497', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Skip for now
          </button>
        )}

        {/* Back button */}
        {step > 1 && (
          <button onClick={() => setStep(s => s - 1)} style={{ display: 'block', marginTop: step === 3 ? 0 : 12, marginLeft: 'auto', marginRight: 'auto', fontSize: 12, color: '#7B8497', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Back
          </button>
        )}
      </div>

      {/* Bottom reassurance */}
      <div style={{ marginTop: 20, fontSize: 12, color: '#B6BCCB', textAlign: 'center' }}>
        Takes 2 minutes. No credit card. Cancel anytime.
      </div>
    </div>
  )
}

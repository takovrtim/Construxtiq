'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PLAN_LIMITS } from '@/types'
import type { User, Project } from '@/types'

interface Props {
  user: User
  projects: Project[]
}

const PLAN_DISPLAY = { starter: 'Starter', pro: 'Pro', company: 'Company' }
const PLAN_PRICE   = { starter: '$49', pro: '$99', company: '$249' }

export function SettingsClient({ user: initialUser, projects }: Props) {
  const [user, setUser]         = useState(initialUser)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [company, setCompany]   = useState(user.company_name || '')
  const [phone, setPhone]       = useState(user.phone || '')
  const [smsEnabled, setSmsEnabled] = useState(user.sms_alerts_enabled)
  const [saving, setSaving]     = useState(false)
  const [billing, setBilling]   = useState(false)
  const [checkout, setCheckout] = useState(false)
  const [toast, setToast]       = useState('')

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3200) }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('users').update({
      full_name: fullName.trim(),
      company_name: company.trim(),
      phone: phone.trim() || null,
      sms_alerts_enabled: smsEnabled,
    }).eq('id', user.id)
    if (!error) { showMsg('Profile saved') }
    setSaving(false)
  }

  async function openBillingPortal() {
    setBilling(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else showMsg(error || 'Billing portal unavailable')
    setBilling(false)
  }

  async function upgradePlan(plan: 'starter' | 'pro' | 'company') {
    setCheckout(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    if (url) window.location.href = url
    else showMsg(error || 'Checkout failed')
    setCheckout(false)
  }

  const limits = PLAN_LIMITS[user.plan]
  const isActive = user.subscription_status === 'active' || user.subscription_status === 'trialing'

  return (
    <>
      <div className="ptitle">Settings</div>
      <p className="psub">Manage your account, billing, and notifications</p>

      <div className="g2">
        {/* LEFT: Profile */}
        <div>
          <div className="card" style={{ marginBottom: 15 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Profile</div>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="input-label">Full name</label>
                <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Company name</label>
                <input className="input" value={company} onChange={e => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input className="input" value={user.email} readOnly style={{ opacity: 0.6 }} />
              </div>
              <div>
                <label className="input-label">Phone (for SMS alerts)</label>
                <input className="input" type="tel" placeholder="+1 702 555 0100" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>SMS permit alerts</div>
                  <div className="tsm tm">Receive texts when permits are expiring</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSmsEnabled(v => !v)}
                  style={{
                    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: smsEnabled ? 'var(--green)' : 'var(--border-md)', transition: 'background 0.2s',
                    position: 'relative',
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 2, left: smsEnabled ? 18 : 2, width: 16, height: 16,
                    borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                  }} />
                </button>
              </div>
              <button type="submit" className="btn btn-p btn-sm" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          {/* Projects list */}
          <div className="card">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Projects</div>
            {projects.length === 0 ? (
              <div className="tsm tm" style={{ textAlign: 'center', padding: '16px 0' }}>No projects yet</div>
            ) : (
              projects.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div className="tsm tm">{[p.city, p.state].filter(Boolean).join(', ')}</div>
                  </div>
                  <span className={`pill ${p.status === 'active' ? 'p-green' : 'p-gray'}`}>{p.status}</span>
                </div>
              ))
            )}
            <a href="/dashboard?new=1" style={{ display: 'block', textAlign: 'center', marginTop: 12, color: 'var(--orange)', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>+ Add Project</a>
          </div>
        </div>

        {/* RIGHT: Billing + plan */}
        <div>
          <div className="card" style={{ marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Subscription</div>
              <span className={`pill ${isActive ? 'p-green' : user.subscription_status === 'past_due' ? 'p-red' : 'p-gray'}`}>
                {user.subscription_status}
              </span>
            </div>

            <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{PLAN_DISPLAY[user.plan]} Plan</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{PLAN_PRICE[user.plan]}<span className="tsm tm">/mo</span></div>
              </div>
              {user.trial_ends_at && user.subscription_status === 'trialing' && (
                <div className="tsm" style={{ color: 'var(--orange)' }}>
                  Trial ends {new Date(user.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>

            <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              <div className="fr"><span style={{ color: limits.projects === -1 || limits.projects > 1 ? 'var(--green)' : 'var(--text-3)', fontSize: 14 }}>✓</span><span>{limits.projects === -1 ? 'Unlimited' : limits.projects} project{limits.projects !== 1 ? 's' : ''}</span></div>
              <div className="fr"><span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span><span>{limits.docs_per_month === -1 ? 'Unlimited' : limits.docs_per_month} documents/month</span></div>
              <div className="fr"><span style={{ color: limits.bid_analysis ? 'var(--green)' : 'var(--text-3)', fontSize: 14 }}>{limits.bid_analysis ? '✓' : '×'}</span><span style={{ color: limits.bid_analysis ? 'inherit' : 'var(--text-3)' }}>Bid analysis & flags</span></div>
              <div className="fr"><span style={{ color: limits.ai_replies ? 'var(--green)' : 'var(--text-3)', fontSize: 14 }}>{limits.ai_replies ? '✓' : '×'}</span><span style={{ color: limits.ai_replies ? 'inherit' : 'var(--text-3)' }}>AI sub replies</span></div>
              <div className="fr"><span style={{ color: limits.training_hub ? 'var(--green)' : 'var(--text-3)', fontSize: 14 }}>{limits.training_hub ? '✓' : '×'}</span><span style={{ color: limits.training_hub ? 'inherit' : 'var(--text-3)' }}>Training hub</span></div>
              <div className="fr"><span style={{ color: limits.sms_alerts ? 'var(--green)' : 'var(--text-3)', fontSize: 14 }}>{limits.sms_alerts ? '✓' : '×'}</span><span style={{ color: limits.sms_alerts ? 'inherit' : 'var(--text-3)' }}>SMS permit alerts</span></div>
            </div>

            {user.stripe_customer_id ? (
              <button className="btn btn-sm btn-p btn-full" onClick={openBillingPortal} disabled={billing}>
                {billing ? 'Opening…' : 'Manage Billing →'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-o btn-full" onClick={() => upgradePlan('pro')} disabled={checkout}>
                  {checkout ? 'Loading…' : 'Upgrade to Pro — $99/mo'}
                </button>
                <button className="btn btn-full" onClick={() => upgradePlan('starter')} disabled={checkout}>
                  Starter Plan — $49/mo
                </button>
              </div>
            )}
          </div>

          {/* Plan comparison for upsell */}
          {user.plan !== 'company' && (
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Company Plan — $249/mo</div>
              <div className="tsm tm" style={{ marginBottom: 12, lineHeight: 1.6 }}>
                Unlimited projects, 5 team seats, sub portal with shareable links, priority support.
              </div>
              <button className="btn btn-sm btn-full" onClick={() => upgradePlan('company')} disabled={checkout}>
                Upgrade to Company →
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}

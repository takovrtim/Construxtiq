'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props { user: any; projects: any[] }

const TABS = ['Profile', 'Notifications', 'Billing', 'Danger Zone']

export function SettingsClient({ user, projects }: Props) {
  const router = useRouter()
  const [tab, setTab]           = useState('Profile')
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  // Profile
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email]                 = useState(user?.email || '')
  const [companyName, setCompanyName] = useState(user?.company_name || '')
  const [phone, setPhone]       = useState(user?.phone || '')
  const [licenseNum, setLicenseNum] = useState(user?.license_number || '')
  const [tradeType, setTradeType] = useState(user?.trade_type || 'electrical')

  // Notifications
  const [emailPermits, setEmailPermits]       = useState(user?.notif_permits ?? true)
  const [emailInspections, setEmailInspections] = useState(user?.notif_inspections ?? true)
  const [emailChanges, setEmailChanges]       = useState(user?.notif_changes ?? true)
  const [emailInvoices, setEmailInvoices]     = useState(user?.notif_invoices ?? true)
  const [emailDaily, setEmailDaily]           = useState(user?.notif_daily ?? false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('users').update({
      full_name: fullName.trim(),
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      license_number: licenseNum.trim() || null,
      trade_type: tradeType,
    }).eq('id', user.id)
    if (!error) msg('✓ Profile saved')
    else msg('Failed to save')
    setSaving(false)
  }

  async function saveNotifications() {
    setSaving(true)
    const { error } = await supabase.from('users').update({
      notif_permits: emailPermits,
      notif_inspections: emailInspections,
      notif_changes: emailChanges,
      notif_invoices: emailInvoices,
      notif_daily: emailDaily,
    }).eq('id', user.id)
    if (!error) msg('✓ Notification preferences saved')
    else msg('Failed to save')
    setSaving(false)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function deleteAccount() {
    if (!confirm('Are you absolutely sure? This will delete your account and ALL project data. This cannot be undone.')) return
    if (!confirm('Last chance — type DELETE in your head and click OK if you are sure.')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Settings</div>
        <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Manage your account, preferences, and billing</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar tabs */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'sticky', top: 78 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ width: '100%', padding: '10px 12px', fontSize: 13, fontWeight: tab === t ? 700 : 400, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: tab === t ? '#f1ede6' : 'transparent', color: tab === t ? '#0f0f0f' : '#6b6a66', textAlign: 'left', marginBottom: 2 }}>
              {t === 'Danger Zone' ? <span style={{ color: tab === t ? '#b83232' : '#6b6a66' }}>{t}</span> : t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>

          {/* PROFILE */}
          {tab === 'Profile' && (
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Profile</div>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0f0f0f', color: 'white', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '-0.5px' }}>
                  {(fullName || email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{fullName || email}</div>
                  <div style={{ fontSize: 12, color: '#9e9d99' }}>{email}</div>
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fdf0e8', color: '#d95f2b', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {user?.plan || 'Trial'} plan
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={lbl}>Full Name</label><input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Rodriguez" /></div>
                  <div><label style={lbl}>Email</label><input style={{ ...inp, opacity: 0.5 }} value={email} disabled /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={lbl}>Company Name</label><input style={inp} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Rodriguez Electric LLC" /></div>
                  <div><label style={lbl}>Phone</label><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(702) 555-0100" /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={lbl}>License Number</label><input style={inp} value={licenseNum} onChange={e => setLicenseNum(e.target.value)} placeholder="EC-12345" /></div>
                  <div>
                    <label style={lbl}>Trade Type</label>
                    <select style={{ ...inp, background: 'white' }} value={tradeType} onChange={e => setTradeType(e.target.value)}>
                      <option value="electrical">⚡ Electrical</option>
                      <option value="plumbing">🔧 Plumbing</option>
                      <option value="both">⚡🔧 Both</option>
                      <option value="general">🏗️ General</option>
                    </select>
                  </div>
                </div>

                <div style={{ paddingTop: 8 }}>
                  <button onClick={saveProfile} disabled={saving} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'Notifications' && (
            <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Email Notifications</div>
              <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 24 }}>Choose what you get emailed about</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Permit expiry alerts', sub: 'Email at 14, 7, and 1 day before expiry', value: emailPermits, set: setEmailPermits },
                  { label: 'Inspection reminders', sub: 'Day-before reminder for scheduled inspections', value: emailInspections, set: setEmailInspections },
                  { label: 'Change order updates', sub: 'When an owner approves or rejects a change', value: emailChanges, set: setEmailChanges },
                  { label: 'Invoice reminders', sub: 'When invoices become overdue', value: emailInvoices, set: setEmailInvoices },
                  { label: 'Daily summary', sub: 'Morning briefing with today\'s alerts and tasks', value: emailDaily, set: setEmailDaily },
                ].map((item, i) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#9e9d99' }}>{item.sub}</div>
                    </div>
                    <button onClick={() => item.set((v: boolean) => !v)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: item.value ? '#0f0f0f' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: 3, left: item.value ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 24 }}>
                <button onClick={saveNotifications} disabled={saving} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {tab === 'Billing' && (
            <div>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Current Plan</div>
                <div style={{ background: '#0f0f0f', borderRadius: 14, padding: '20px 24px', color: 'white', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Current Plan</div>
                      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{user?.plan === 'pro' ? 'Pro' : user?.plan === 'company' ? 'Company' : 'Trial'}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{user?.plan === 'trial' ? '14-day free trial' : 'Active subscription'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>{user?.plan === 'pro' ? '$99' : user?.plan === 'company' ? '$249' : '$0'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{user?.plan === 'trial' ? 'during trial' : '/month'}</div>
                    </div>
                  </div>
                </div>

                {user?.plan === 'trial' && (
                  <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010', marginBottom: 4 }}>Trial ending soon</div>
                    <div style={{ fontSize: 12, color: '#b06e1a' }}>Upgrade to keep your data and continue using ConstructIQ after your trial ends.</div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { name: 'Pro', price: '$99/mo', desc: '5 projects · Unlimited docs · AI features · SMS alerts', color: '#d95f2b' },
                    { name: 'Company', price: '$249/mo', desc: 'Unlimited projects · 5 seats · Sub portal · Priority', color: '#7F77DD' },
                  ].map(plan => (
                    <div key={plan.name} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: plan.color }}>{plan.price}</div>
                      <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 14, lineHeight: 1.6 }}>{plan.desc}</div>
                      <button style={{ width: '100%', padding: '9px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: plan.color, color: 'white', fontFamily: 'inherit' }}>Upgrade to {plan.name}</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Your Projects</div>
                {projects.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#9e9d99' }}>No projects yet</div>
                ) : projects.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#9e9d99' }}>{[p.city, p.state].filter(Boolean).join(', ')}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#edf5f0', color: '#1a4d31' }}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANGER ZONE */}
          {tab === 'Danger Zone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Sign Out</div>
                <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 16 }}>Sign out of your account on this device</div>
                <button onClick={signOut} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Sign out</button>
              </div>

              <div style={{ background: 'white', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#b83232', marginBottom: 4 }}>Delete Account</div>
                <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 16 }}>Permanently delete your account and all project data. This cannot be undone.</div>
                <button onClick={deleteAccount} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete Account</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

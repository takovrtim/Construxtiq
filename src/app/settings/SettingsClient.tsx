'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Props { user: any; projects: any[] }

const TABS = ['Profile', 'Company', 'Notifications', 'Danger Zone'] as const
type Tab = typeof TABS[number]

const Toggle = ({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
    <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>
    <button type="button" onClick={() => onChange(!on)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: on ? '#ea580c' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  </div>
)

export function SettingsClient({ user, projects }: Props) {
  const router = useRouter()
  const [tab, setTab]     = useState<Tab>('Profile')
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState('')
  const [deleting, setDeleting] = useState(false)

  // Profile
  const [fullName,     setFullName]     = useState(user?.full_name || '')
  const [companyName,  setCompanyName]  = useState(user?.company_name || '')
  const [phone,        setPhone]        = useState(user?.phone || '')
  const [licenseNum,   setLicenseNum]   = useState(user?.license_number || '')
  const [tradeType,    setTradeType]    = useState(user?.trade_type || 'electrical')
  const [city,         setCity]         = useState(user?.city || '')
  const [state,        setState]        = useState(user?.state || 'NV')

  // Company / GC
  const [gcName,       setGcName]       = useState(user?.company_gc || '')
  const [companySize,  setCompanySize]  = useState(user?.company_size || '')
  const [insuranceExp, setInsuranceExp] = useState(user?.insurance_expiry || '')
  const [bondNum,      setBondNum]      = useState(user?.bond_number || '')

  // Notifications
  const [notifPermits,     setNotifPermits]     = useState(user?.notif_permits ?? true)
  const [notifInspections, setNotifInspections] = useState(user?.notif_inspections ?? true)
  const [notifChanges,     setNotifChanges]     = useState(user?.notif_changes ?? true)
  const [notifInvoices,    setNotifInvoices]    = useState(user?.notif_invoices ?? true)
  const [notifRFIs,        setNotifRFIs]        = useState(user?.notif_rfis ?? true)
  const [notifRetention,   setNotifRetention]   = useState(user?.notif_retention ?? false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3500) }

  async function saveProfile() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    const { error } = await supabase.from('users').update({
      full_name: fullName.trim() || null,
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      license_number: licenseNum.trim() || null,
      trade_type: tradeType,
      city: city.trim() || null,
      state: state.trim() || null,
    }).eq('id', authUser.id)
    if (!error) msg('✓ Profile saved')
    else msg('Failed to save')
    setSaving(false)
  }

  async function saveCompany() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    const { error } = await supabase.from('users').update({
      company_gc: gcName.trim() || null,
      company_size: companySize || null,
      insurance_expiry: insuranceExp || null,
      bond_number: bondNum.trim() || null,
    }).eq('id', authUser.id)
    if (!error) msg('✓ Company info saved')
    else msg('Failed to save')
    setSaving(false)
  }

  async function saveNotifications() {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    await supabase.from('users').update({
      notif_permits: notifPermits,
      notif_inspections: notifInspections,
      notif_changes: notifChanges,
      notif_invoices: notifInvoices,
      notif_rfis: notifRFIs,
      notif_retention: notifRetention,
    }).eq('id', authUser.id)
    msg('✓ Notification preferences saved')
    setSaving(false)
  }

  async function deleteAccount() {
    if (!confirm('Are you absolutely sure? This permanently deletes your account and all data. This cannot be undone.')) return
    if (!confirm('Last chance — type "DELETE" in the next prompt to confirm')) return
    const input = prompt('Type DELETE to confirm account deletion:')
    if (input !== 'DELETE') { msg('Account deletion cancelled'); return }
    setDeleting(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', fontSize: 14,
    border: '1.5px solid var(--border)', borderRadius: 9,
    fontFamily: 'inherit', outline: 'none',
    background: 'var(--surface-2)', color: 'var(--text)',
    boxSizing: 'border-box' as const,
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your profile, company info, and preferences</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: tab === t ? 700 : 400,
            borderRadius: '8px 8px 0 0', cursor: 'pointer', fontFamily: 'inherit',
            border: 'none', borderBottom: tab === t ? '2px solid #ea580c' : '2px solid transparent',
            background: 'transparent',
            color: tab === t ? '#ea580c' : 'var(--text-3)',
            transition: 'all 0.1s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {/* PROFILE */}
      {tab === 'Profile' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {(fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{fullName || 'Your Name'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{user?.email}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {user?.plan === 'trial' ? '14-day trial' : (user?.plan || 'Free plan')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={lbl}>Full Name</label><input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Rodriguez" /></div>
                <div><label style={lbl}>Phone</label><input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(702) 555-0100" type="tel" /></div>
              </div>
              <div>
                <label style={lbl}>Trade Type</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['electrical','⚡ Electrical'],['plumbing','🔧 Plumbing'],['both','⚡🔧 Both'],['general','🏗️ General']].map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setTradeType(v)} style={{ flex: 1, padding: '9px 6px', fontSize: 12, fontWeight: tradeType === v ? 700 : 400, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${tradeType === v ? '#ea580c' : 'var(--border)'}`, background: tradeType === v ? '#FFF4EE' : 'var(--surface)', color: tradeType === v ? '#ea580c' : 'var(--text-3)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div><label style={lbl}>Contractor License #</label><input style={inp} value={licenseNum} onChange={e => setLicenseNum(e.target.value)} placeholder="EC-12345 / C-10-987654" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div><label style={lbl}>City</label><input style={inp} value={city} onChange={e => setCity(e.target.value)} placeholder="Las Vegas" /></div>
                <div><label style={lbl}>State</label><input style={inp} value={state} onChange={e => setState(e.target.value)} placeholder="NV" /></div>
              </div>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0a0a0a', color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* COMPANY */}
      {tab === 'Company' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Company & GC Information</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.6 }}>
              This info populates your documents, approval links, and reports automatically.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div><label style={lbl}>Company Name</label><input style={inp} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Rodriguez Electric LLC" /></div>
              <div>
                <label style={lbl}>Primary GC / General Contractor</label>
                <input style={inp} value={gcName} onChange={e => setGcName(e.target.value)} placeholder="Turner Construction" />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Used in change order emails and delay reports</div>
              </div>
              <div>
                <label style={lbl}>Crew Size</label>
                <select style={{ ...inp, background: 'var(--surface)' }} value={companySize} onChange={e => setCompanySize(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="solo">Just me</option>
                  <option value="small">2–5 people</option>
                  <option value="medium">6–20 people</option>
                  <option value="large">20+ people</option>
                </select>
              </div>
              <div><label style={lbl}>Insurance Expiry Date</label><input type="date" style={inp} value={insuranceExp} onChange={e => setInsuranceExp(e.target.value)} /></div>
              <div><label style={lbl}>Bond Number</label><input style={inp} value={bondNum} onChange={e => setBondNum(e.target.value)} placeholder="Bond #12345" /></div>
            </div>
          </div>
          <button onClick={saveCompany} disabled={saving} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0a0a0a', color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save Company Info'}
          </button>
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab === 'Notifications' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Email Notifications</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Choose what gets emailed to {user?.email}</div>
            <Toggle on={notifPermits}     onChange={setNotifPermits}     label="Permit expiry alerts (14, 7, 1 day before)" />
            <Toggle on={notifRFIs}        onChange={setNotifRFIs}        label="RFI response deadline reminders" />
            <Toggle on={notifChanges}     onChange={setNotifChanges}     label="Change order approved or rejected" />
            <Toggle on={notifInvoices}    onChange={setNotifInvoices}    label="Invoice overdue reminders" />
            <Toggle on={notifInspections} onChange={setNotifInspections} label="Upcoming inspection reminders" />
            <Toggle on={notifRetention}   onChange={setNotifRetention}   label="Retention release reminders" />
          </div>
          <button onClick={saveNotifications} disabled={saving} style={{ padding: '12px 28px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0a0a0a', color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      )}

      {/* DANGER ZONE */}
      {tab === 'Danger Zone' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Projects ({projects.length})</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>Your active projects on this account</div>
            {projects.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.status === 'active' ? '#22c55e' : '#9ca3af', flexShrink: 0 }} />
                <span style={{ fontSize: 13, flex: 1 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{p.status}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fef2f2', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Delete Account</div>
            <div style={{ fontSize: 13, color: '#991b1b', marginBottom: 20, lineHeight: 1.6 }}>
              Permanently delete your account and all associated data including projects, logs, documents, and reports. This cannot be undone.
            </div>
            <button onClick={deleteAccount} disabled={deleting} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.3)', background: '#fef2f2', color: '#dc2626', fontFamily: 'inherit' }}>
              {deleting ? 'Processing...' : 'Delete My Account'}
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

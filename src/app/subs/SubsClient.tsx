'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialSubs: Subcontractor[]
  initialJobs: any[]
}

const STATUS_CONFIG = {
  prospect:  { label: 'Prospect',   bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
  bidding:   { label: 'Bidding',    bg: '#E6F1FB', text: '#0C447C', dot: '#378ADD' },
  awarded:   { label: 'Awarded',    bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  active:    { label: 'Active',     bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  completed: { label: 'Completed',  bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
  rejected:  { label: 'Rejected',   bg: '#fdf0f0', text: '#6e1a1a', dot: '#b83232' },
}

const TRADES = [
  'Electrical', 'Plumbing', 'HVAC', 'Framing', 'Drywall', 'Roofing',
  'Concrete', 'Painting', 'Flooring', 'Landscaping', 'General Labor', 'Other'
]

const CREW_COLORS = ['#0f0f0f', '#d95f2b', '#1f5fa6', '#2d7a4f', '#7F77DD', '#b06e1a', '#b83232']

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length >= 7) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  if (d.length >= 4) return `(${d.slice(0,3)}) ${d.slice(3)}`
  if (d.length >= 1) return `(${d}`
  return ''
}

export function SubsClient({ user, project, initialSubs, initialJobs }: Props) {
  const [subs, setSubs]         = useState<Subcontractor[]>(initialSubs)
  const [jobs]                  = useState<any[]>(initialJobs)
  const [selected, setSelected] = useState<Subcontractor | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [activeTab, setActiveTab] = useState<'crew' | 'subs'>('crew')
  const [message, setMessage]   = useState('')
  const [filterTrade, setFilterTrade] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Form
  const [company, setCompany]   = useState('')
  const [contact, setContact]   = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [trade, setTrade]       = useState('Electrical')
  const [license, setLicense]   = useState('')
  const [status, setStatus]     = useState<Subcontractor['status']>('prospect')
  const [bidAmt, setBidAmt]     = useState('')
  const [notes, setNotes]       = useState('')

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  async function addSub(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSaving(true)
    const { data, error } = await supabase.from('subcontractors').insert({
      project_id: project.id, user_id: user.id,
      company_name: company.trim(), contact_name: contact.trim() || null,
      email: email.trim() || null, phone: phone || null,
      trade, license_number: license.toUpperCase() || null,
      status, bid_amount: bidAmt ? parseFloat(bidAmt) : null,
      ai_notes: notes || null,
    }).select().single()

    if (!error && data) {
      setSubs(prev => [...prev, data as Subcontractor])
      msg(`✓ ${company} added`)
      setCompany(''); setContact(''); setEmail(''); setPhone('')
      setLicense(''); setBidAmt(''); setNotes('')
      setShowAdd(false)
    } else msg('Failed to add')
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: Subcontractor['status']) {
    const { error } = await supabase.from('subcontractors').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      msg(`✓ Status updated`)
    }
  }

  async function deleteSub(id: string) {
    if (!confirm('Remove this subcontractor?')) return
    const { error } = await supabase.from('subcontractors').delete().eq('id', id)
    if (!error) { setSubs(prev => prev.filter(s => s.id !== id)); setSelected(null); msg('Removed') }
  }

  const filteredSubs = subs.filter(s => {
    if (filterTrade !== 'All' && s.trade !== filterTrade) return false
    if (filterStatus !== 'All' && s.status !== filterStatus) return false
    return true
  })

  // Crew = active/awarded subs
  const crew = subs.filter(s => s.status === 'active' || s.status === 'awarded')

  const inp: React.CSSProperties = { width: '100%', padding: '9px 11px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)', transition: 'border-color 0.15s' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Crew & Subs</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {crew.length} active crew · {subs.length} total subcontractors
          </div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          + Add Sub
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Subs', value: subs.length, sub: 'in database' },
          { label: 'Active Crew', value: crew.length, sub: 'on jobs now', accent: '#2d7a4f' },
          { label: 'Bidding', value: subs.filter(s=>s.status==='bidding').length, sub: 'awaiting bids' },
          { label: 'Trades', value: [...new Set(subs.map(s=>s.trade))].length, sub: 'different trades' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: 'var(--shadow-xs)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>Add Subcontractor / Crew Member</div>
          <form onSubmit={addSub} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Company Name *</label>
                <input style={inp} placeholder="ABC Electric LLC" value={company} onChange={e => setCompany(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={lbl}>Trade</label>
                <select style={{ ...inp, background: 'var(--surface)' }} value={trade} onChange={e => setTrade(e.target.value)}>
                  {TRADES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Contact Name</label>
                <input style={inp} placeholder="John Smith" value={contact} onChange={e => setContact(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, pointerEvents: 'none' }}>📞</span>
                  <input style={{ ...inp, paddingLeft: 32 }} placeholder="(702) 555-0100" type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input style={inp} placeholder="john@abcelectric.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>License #</label>
                <input style={inp} placeholder="NV-C2-12345" value={license} onChange={e => setLicense(e.target.value.toUpperCase())} />
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={{ ...inp, background: 'var(--surface)' }} value={status} onChange={e => setStatus(e.target.value as any)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Bid Amount ($)</label>
                <input style={inp} type="number" placeholder="25000" value={bidAmt} onChange={e => setBidAmt(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={lbl}>Internal Notes (private)</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Reliability notes, past performance, anything to remember..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: '10px 22px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Add to Crew'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--surface-2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {(['crew', 'subs'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '7px 18px', fontSize: 13, fontWeight: activeTab === tab ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activeTab === tab ? 'var(--surface)' : 'transparent', color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)', boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s' }}>
            {tab === 'crew' ? `Active Crew (${crew.length})` : `All Subs (${subs.length})`}
          </button>
        ))}
      </div>

      {/* ACTIVE CREW TAB */}
      {activeTab === 'crew' && (
        <div>
          {crew.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>No active crew yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>Add subs and set their status to Active or Awarded</div>
              <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Crew Member</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {crew.map((sub, i) => {
                const sc = STATUS_CONFIG[sub.status]
                return (
                  <div key={sub.id} onClick={() => setSelected(sub)} style={{ background: 'var(--surface)', border: `1.5px solid ${selected?.id === sub.id ? '#0f0f0f' : 'var(--border)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected?.id === sub.id ? 'var(--shadow-md)' : 'var(--shadow-xs)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: CREW_COLORS[i % CREW_COLORS.length], color: 'white', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sub.company_name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.company_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub.trade}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{sc.label}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {sub.contact_name && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <span>👤</span> {sub.contact_name}
                        </div>
                      )}
                      {sub.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📞</span>
                          <a href={`tel:${sub.phone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()} style={{ fontSize: 13, color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{sub.phone}</a>
                          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Tap to call</span>
                        </div>
                      )}
                      {sub.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden' }}>
                          <span>✉️</span>
                          <a href={`mailto:${sub.email}`} onClick={e => e.stopPropagation()} style={{ color: '#1f5fa6', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.email}</a>
                        </div>
                      )}
                      {sub.license_number && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                          <span>📋</span>
                          <span style={{ fontFamily: 'monospace', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4 }}>{sub.license_number}</span>
                        </div>
                      )}
                    </div>

                    {sub.bid_amount && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>Bid</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>${Number(sub.bid_amount).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL SUBS TAB */}
      {activeTab === 'subs' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <select style={{ ...inp, width: 'auto', minWidth: 130 }} value={filterTrade} onChange={e => setFilterTrade(e.target.value)}>
              <option value="All">All Trades</option>
              {TRADES.map(t => <option key={t}>{t}</option>)}
            </select>
            <select style={{ ...inp, width: 'auto', minWidth: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', alignSelf: 'center', marginLeft: 4 }}>
              {filteredSubs.length} result{filteredSubs.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filteredSubs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{subs.length === 0 ? 'No subs yet' : 'No results'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>{subs.length === 0 ? 'Add your first subcontractor above' : 'Try changing the filters'}</div>
              {subs.length === 0 && <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Sub</button>}
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Company', 'Trade', 'Contact', 'Phone', 'License', 'Bid', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((sub, i) => {
                    const sc = STATUS_CONFIG[sub.status]
                    return (
                      <tr key={sub.id} onClick={() => setSelected(sub === selected ? null : sub)} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected?.id === sub.id ? 'var(--surface-2)' : 'transparent', transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: CREW_COLORS[i % CREW_COLORS.length], color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {sub.company_name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.company_name}</div>
                              {sub.email && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{sub.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{sub.trade}</td>
                        <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{sub.contact_name || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          {sub.phone
                            ? <a href={`tel:${sub.phone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()} style={{ color: '#1f5fa6', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>{sub.phone}</a>
                            : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{sub.license_number || '—'}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {sub.bid_amount ? `$${Number(sub.bid_amount).toLocaleString()}` : '—'}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={e => { e.stopPropagation(); deleteSub(sub.id) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 16, padding: '0 4px' }} onMouseEnter={e => (e.currentTarget.style.color = '#b83232')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>×</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 390, background: 'var(--surface)', borderLeft: '1px solid var(--border)', boxShadow: 'var(--shadow-panel)', zIndex: 100, overflowY: 'auto', padding: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#d95f2b', color: 'white', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.company_name[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{selected.company_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{selected.trade}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>×</button>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {selected.phone && (
                <a href={`tel:${selected.phone.replace(/\D/g,'')}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: '#eef3fb', color: '#1f5fa6', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                  📞 Call
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-primary)', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>
                  ✉️ Email
                </a>
              )}
            </div>

            {/* Details */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 11, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.contact_name && <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-tertiary)', minWidth: 65 }}>Contact</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selected.contact_name}</span></div>}
              {selected.phone && <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-tertiary)', minWidth: 65 }}>Phone</span><a href={`tel:${selected.phone.replace(/\D/g,'')}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{selected.phone}</a></div>}
              {selected.email && <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-tertiary)', minWidth: 65 }}>Email</span><a href={`mailto:${selected.email}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontSize: 12 }}>{selected.email}</a></div>}
              {selected.license_number && <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-tertiary)', minWidth: 65 }}>License</span><span style={{ fontFamily: 'monospace', fontWeight: 600, background: 'var(--surface-3)', padding: '1px 7px', borderRadius: 4, color: 'var(--text-primary)' }}>{selected.license_number}</span></div>}
              {selected.bid_amount && <div style={{ display: 'flex', gap: 10, fontSize: 13 }}><span style={{ color: 'var(--text-tertiary)', minWidth: 65 }}>Bid</span><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>${Number(selected.bid_amount).toLocaleString()}</span></div>}
            </div>

            {/* Status */}
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
              {(Object.keys(STATUS_CONFIG) as Subcontractor['status'][]).map(s => {
                const cfg = STATUS_CONFIG[s]
                const active = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${active ? cfg.dot : 'var(--border)'}`, background: active ? cfg.bg : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : 'var(--text-secondary)', flex: 1 }}>{cfg.label}</span>
                    {active && <span style={{ color: cfg.dot }}>✓</span>}
                  </button>
                )
              })}
            </div>

            {/* Private notes */}
            {selected.ai_notes && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>Private Notes</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65, background: 'var(--surface-2)', borderRadius: 9, padding: '12px 14px' }}>{selected.ai_notes}</div>
              </div>
            )}

            {/* Message */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Send Message</div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={`Message ${selected.company_name}...`} rows={3} style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 8, background: 'var(--surface-2)', color: 'var(--text-primary)', lineHeight: 1.6 }} />
              <button onClick={() => { msg(`✓ Message sent to ${selected.company_name}`); setMessage('') }} disabled={!message.trim()} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: message.trim() ? 'pointer' : 'not-allowed', border: 'none', background: message.trim() ? '#0f0f0f' : 'var(--surface-2)', color: message.trim() ? 'white' : 'var(--text-tertiary)', fontFamily: 'inherit', transition: 'all .15s' }}>
                {message.trim() ? `Send to ${selected.company_name}` : 'Type a message first'}
              </button>
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => deleteSub(selected.id)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
                Remove Subcontractor
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 414 : 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: 'var(--shadow-lg)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

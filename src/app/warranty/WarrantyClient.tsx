'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'

interface Warranty {
  id: string
  project_id: string
  job_id: string | null
  item_name: string
  description: string | null
  warranty_type: 'labor' | 'material' | 'equipment' | 'subcontractor'
  provider: string | null
  warranty_number: string | null
  start_date: string
  expiry_date: string
  duration_years: number | null
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  notes: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialWarranties: Warranty[]
  jobs: { id: string; title: string }[]
}

const TYPE_CONFIG = {
  labor:        { label: 'Labor',        icon: '👷', color: '#1f5fa6' },
  material:     { label: 'Material',     icon: '🏗️', color: '#2d7a4f' },
  equipment:    { label: 'Equipment',    icon: '⚙️', color: '#7F77DD' },
  subcontractor: { label: 'Subcontractor', icon: '🔧', color: '#d95f2b' },
}

export function WarrantyClient({ user, project, initialWarranties, jobs }: Props) {
  const [warranties, setWarranties] = useState<Warranty[]>(initialWarranties)
  const [showAdd, setShowAdd]       = useState(false)
  const [selected, setSelected]     = useState<Warranty | null>(null)
  const [toast, setToast]           = useState('')
  const [saving, setSaving]         = useState(false)

  const [itemName, setItemName]     = useState('')
  const [description, setDescription] = useState('')
  const [warrantyType, setWarrantyType] = useState<Warranty['warranty_type']>('labor')
  const [provider, setProvider]     = useState('')
  const [warrantyNumber, setWarrantyNumber] = useState('')
  const [startDate, setStartDate]   = useState(new Date().toISOString().split('T')[0])
  const [expiryDate, setExpiryDate] = useState('')
  const [durationYears, setDurationYears] = useState('1')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [jobId, setJobId]           = useState(jobs[0]?.id || '')
  const [notes, setNotes]           = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  function calcExpiry(start: string, years: string) {
    if (!start || !years) return ''
    const d = new Date(start)
    d.setFullYear(d.getFullYear() + parseInt(years))
    return d.toISOString().split('T')[0]
  }

  const today = new Date()
  const active = warranties.filter(w => !isPast(parseISO(w.expiry_date))).length
  const expiringSoon = warranties.filter(w => {
    const days = differenceInDays(parseISO(w.expiry_date), today)
    return days >= 0 && days <= 90
  }).length
  const expired = warranties.filter(w => isPast(parseISO(w.expiry_date))).length

  async function addWarranty(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !itemName.trim() || !expiryDate) return
    setSaving(true)

    const { data, error } = await supabase.from('warranties').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      item_name: itemName.trim(),
      description: description.trim() || null,
      warranty_type: warrantyType,
      provider: provider.trim() || null,
      warranty_number: warrantyNumber.trim() || null,
      start_date: startDate,
      expiry_date: expiryDate,
      duration_years: parseInt(durationYears) || null,
      contact_name: contactName.trim() || null,
      contact_phone: contactPhone.trim() || null,
      contact_email: contactEmail.trim() || null,
      notes: notes.trim() || null,
    }).select().single()

    if (!error && data) {
      setWarranties(prev => [...prev, data as Warranty].sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()))
      msg(`✓ Warranty added for ${itemName}`)
      setItemName(''); setDescription(''); setProvider(''); setWarrantyNumber('')
      setContactName(''); setContactPhone(''); setContactEmail(''); setNotes('')
      setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function deleteWarranty(id: string) {
    if (!confirm('Delete this warranty?')) return
    const { error } = await supabase.from('warranties').delete().eq('id', id)
    if (!error) { setWarranties(prev => prev.filter(w => w.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#F1EEE5' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>🛡️</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Warranty Tracker</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Track warranties on labor, materials, and equipment</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Add Warranty'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active', value: active, sub: 'warranties', accent: '#2d7a4f' },
          { label: 'Expiring Soon', value: expiringSoon, sub: 'within 90 days', accent: expiringSoon > 0 ? '#b06e1a' : '' },
          { label: 'Expired', value: expired, sub: 'warranties', accent: expired > 0 ? '#b83232' : '' },
          { label: 'Total', value: warranties.length, sub: 'tracked', accent: '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <form onSubmit={addWarranty} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Type */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(TYPE_CONFIG) as Warranty['warranty_type'][]).map(t => (
                <button key={t} type="button" onClick={() => setWarrantyType(t)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: warrantyType === t ? 700 : 400, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${warrantyType === t ? TYPE_CONFIG[t].color : 'rgba(0,0,0,0.1)'}`, background: warrantyType === t ? `${TYPE_CONFIG[t].color}15` : 'white', color: warrantyType === t ? TYPE_CONFIG[t].color : '#6b6a66' }}>
                  <span>{TYPE_CONFIG[t].icon}</span><span>{TYPE_CONFIG[t].label}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Item / Work *</label><input style={inp} placeholder="Panel upgrade, copper piping, HVAC unit..." value={itemName} onChange={e => setItemName(e.target.value)} required autoFocus /></div>
              <div><label style={lbl}>Job</label>
                <select style={{ ...inp, background: '#131A26' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Start Date</label><input type="date" style={inp} value={startDate} onChange={e => { setStartDate(e.target.value); setExpiryDate(calcExpiry(e.target.value, durationYears)) }} /></div>
              <div>
                <label style={lbl}>Duration (Years)</label>
                <select style={{ ...inp, background: '#131A26' }} value={durationYears} onChange={e => { setDurationYears(e.target.value); setExpiryDate(calcExpiry(startDate, e.target.value)) }}>
                  {['1','2','3','5','10','lifetime'].map(y => <option key={y} value={y}>{y === 'lifetime' ? 'Lifetime' : `${y} Year${y === '1' ? '' : 's'}`}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Expiry Date *</label><input type="date" style={inp} value={expiryDate} onChange={e => setExpiryDate(e.target.value)} required /></div>
              <div><label style={lbl}>Provider / Brand</label><input style={inp} placeholder="Siemens, Rheem..." value={provider} onChange={e => setProvider(e.target.value)} /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Warranty Number</label><input style={inp} placeholder="WRN-12345" value={warrantyNumber} onChange={e => setWarrantyNumber(e.target.value)} /></div>
              <div><label style={lbl}>Contact Name</label><input style={inp} placeholder="Support contact" value={contactName} onChange={e => setContactName(e.target.value)} /></div>
              <div><label style={lbl}>Contact Phone</label><input style={inp} placeholder="(702) 555-0100" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
            </div>

            <div><label style={lbl}>Notes</label><input style={inp} placeholder="What's covered, exclusions, claim process..." value={notes} onChange={e => setNotes(e.target.value)} /></div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !itemName.trim() || !expiryDate} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Add Warranty'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {warranties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: '#131A26', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛡️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No warranties tracked yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Log warranties so you know exactly what's covered and when it expires</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Warranty</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {warranties.map(w => {
            const tc = TYPE_CONFIG[w.warranty_type]
            const daysLeft = differenceInDays(parseISO(w.expiry_date), today)
            const isExpired = daysLeft < 0
            const isExpiringSoon = daysLeft >= 0 && daysLeft <= 90
            const job = jobs.find(j => j.id === w.job_id)
            const statusColor = isExpired ? '#b83232' : isExpiringSoon ? '#b06e1a' : '#2d7a4f'
            const statusBg = isExpired ? '#fdf0f0' : isExpiringSoon ? '#fdf4e3' : '#edf5f0'
            const statusLabel = isExpired ? 'Expired' : isExpiringSoon ? `${daysLeft}d left` : `${Math.round(daysLeft/30)}mo left`

            return (
              <div key={w.id} onClick={() => setSelected(w === selected ? null : w)} style={{ background: '#131A26', border: `1.5px solid ${selected?.id === w.id ? '#0f0f0f' : isExpired ? 'rgba(184,50,50,0.2)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${tc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{tc.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{w.item_name}</div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>
                      {w.provider ? `${w.provider} · ` : ''}
                      {w.duration_years ? `${w.duration_years}yr warranty` : ''}
                      {job ? ` · ${job.title}` : ''}
                      {w.warranty_number ? ` · #${w.warranty_number}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 4 }}>
                      {format(parseISO(w.start_date), 'MMM yyyy')} → {format(parseISO(w.expiry_date), 'MMM yyyy')}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusBg, color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>

                {selected?.id === w.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      {w.contact_name && <div style={{ background: '#f8f7f4', borderRadius: 9, padding: '10px 12px', fontSize: 13 }}><span style={{ color: '#9e9d99' }}>Contact: </span>{w.contact_name}</div>}
                      {w.contact_phone && <div style={{ background: '#f8f7f4', borderRadius: 9, padding: '10px 12px', fontSize: 13 }}><a href={`tel:${w.contact_phone.replace(/\D/g,'')}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{w.contact_phone}</a></div>}
                    </div>
                    {w.notes && <div style={{ background: '#f8f7f4', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: '#6b6a66', marginBottom: 10 }}>{w.notes}</div>}
                    <button onClick={e => { e.stopPropagation(); deleteWarranty(w.id) }} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

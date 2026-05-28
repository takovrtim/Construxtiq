'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast, isToday, isTomorrow } from 'date-fns'

interface Inspection {
  id: string
  project_id: string
  job_id: string | null
  title: string
  inspection_type: string
  inspector_name: string | null
  inspector_phone: string | null
  scheduled_date: string
  scheduled_time: string | null
  status: 'scheduled' | 'passed' | 'failed' | 'rescheduled' | 'cancelled'
  result_notes: string | null
  requires_reinspection: boolean
  reinspection_date: string | null
  permit_number: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialInspections: Inspection[]
  jobs: { id: string; title: string; status: string; permit_number: string | null }[]
}

const STATUS_CONFIG = {
  scheduled:   { label: 'Scheduled',    bg: '#eef3fb', text: '#0C447C', dot: '#378ADD' },
  passed:      { label: 'Passed ✓',     bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  failed:      { label: 'Failed',       bg: '#fdf0f0', text: '#6e1a1a', dot: '#b83232' },
  rescheduled: { label: 'Rescheduled',  bg: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
  cancelled:   { label: 'Cancelled',    bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
}

const INSPECTION_TYPES = [
  'Rough Electrical', 'Final Electrical', 'Rough Plumbing', 'Final Plumbing',
  'Rough Framing', 'Final Building', 'Foundation', 'Insulation',
  'HVAC Rough', 'HVAC Final', 'Fire Sprinkler', 'Special Inspection', 'Other',
]

function formatPhone(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length >= 7) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  if (d.length >= 4) return `(${d.slice(0,3)}) ${d.slice(3)}`
  if (d.length >= 1) return `(${d}`
  return ''
}

function getUrgencyLabel(dateStr: string): { text: string; color: string; bg: string } | null {
  const date = parseISO(dateStr)
  if (isPast(date) && !isToday(date)) return { text: 'Overdue', color: '#b83232', bg: '#fdf0f0' }
  if (isToday(date)) return { text: 'Today', color: '#b83232', bg: '#fdf0f0' }
  if (isTomorrow(date)) return { text: 'Tomorrow', color: '#b06e1a', bg: '#fdf4e3' }
  const days = differenceInDays(date, new Date())
  if (days <= 3) return { text: `In ${days}d`, color: '#b06e1a', bg: '#fdf4e3' }
  if (days <= 7) return { text: `In ${days}d`, color: '#1f5fa6', bg: '#eef3fb' }
  return null
}

export function InspectionsClient({ user, project, initialInspections, jobs }: Props) {
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections)
  const [selected, setSelected]       = useState<Inspection | null>(null)
  const [showAdd, setShowAdd]         = useState(false)
  const [toast, setToast]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [resultNotes, setResultNotes] = useState('')
  const [updatingResult, setUpdatingResult] = useState(false)

  // Form
  const [title, setTitle]             = useState('')
  const [inspType, setInspType]       = useState('Rough Electrical')
  const [jobId, setJobId]             = useState('')
  const [inspectorName, setInspectorName] = useState('')
  const [inspectorPhone, setInspectorPhone] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [permitNumber, setPermitNumber] = useState('')

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  // Stats
  const upcoming  = inspections.filter(i => i.status === 'scheduled' && !isPast(parseISO(i.scheduled_date)))
  const overdue   = inspections.filter(i => i.status === 'scheduled' && isPast(parseISO(i.scheduled_date)) && !isToday(parseISO(i.scheduled_date)))
  const passed    = inspections.filter(i => i.status === 'passed').length
  const needsReinspection = inspections.filter(i => i.requires_reinspection && i.status !== 'passed').length

  const filtered = filterStatus === 'all' ? inspections : inspections.filter(i => i.status === filterStatus)
  const sortedFiltered = [...filtered].sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())

  async function addInspection(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !scheduledDate) return
    setSaving(true)

    const job = jobs.find(j => j.id === jobId)
    const { data, error } = await supabase.from('inspections').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      title: title.trim() || inspType,
      inspection_type: inspType,
      inspector_name: inspectorName.trim() || null,
      inspector_phone: inspectorPhone || null,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime || null,
      status: 'scheduled',
      permit_number: permitNumber.trim() || job?.permit_number || null,
      requires_reinspection: false,
      result_notes: null,
    }).select().single()

    if (!error && data) {
      setInspections(prev => [...prev, data as Inspection])
      msg(`✓ Inspection scheduled for ${format(parseISO(scheduledDate), 'MMM d')}`)
      setTitle(''); setInspectorName(''); setInspectorPhone('')
      setScheduledDate(''); setScheduledTime(''); setPermitNumber('')
      setJobId(''); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: Inspection['status'], notes?: string, requiresReinspection?: boolean, reinspectionDate?: string) {
    setUpdatingResult(true)
    const updates: any = { status: newStatus }
    if (notes !== undefined) updates.result_notes = notes
    if (requiresReinspection !== undefined) updates.requires_reinspection = requiresReinspection
    if (reinspectionDate) updates.reinspection_date = reinspectionDate

    const { error } = await supabase.from('inspections').update(updates).eq('id', id)
    if (!error) {
      setInspections(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, ...updates } : null)
      msg(`✓ Marked as ${STATUS_CONFIG[newStatus].label}`)
      setResultNotes('')
    }
    setUpdatingResult(false)
  }

  async function deleteInspection(id: string) {
    if (!confirm('Delete this inspection?')) return
    const { error } = await supabase.from('inspections').delete().eq('id', id)
    if (!error) { setInspections(prev => prev.filter(i => i.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#F1EEE5' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Inspections</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Schedule, track, and never miss an inspection</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Schedule Inspection'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Upcoming', value: upcoming.length, sub: 'scheduled ahead', accent: upcoming.length > 0 ? '#1f5fa6' : '' },
          { label: 'Overdue', value: overdue.length, sub: 'need rescheduling', accent: overdue.length > 0 ? '#b83232' : '' },
          { label: 'Passed', value: passed, sub: 'inspections cleared', accent: '#2d7a4f' },
          { label: 'Reinspection', value: needsReinspection, sub: 'required', accent: needsReinspection > 0 ? '#b06e1a' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* OVERDUE ALERT */}
      {overdue.length > 0 && (
        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🚨</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6e1a1a', marginBottom: 4 }}>
              {overdue.length} inspection{overdue.length > 1 ? 's' : ''} overdue — reschedule immediately
            </div>
            <div style={{ fontSize: 13, color: '#b83232' }}>
              {overdue.map(i => `${i.title} (${format(parseISO(i.scheduled_date), 'MMM d')})`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Schedule Inspection</div>
          <form onSubmit={addInspection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Type selector */}
            <div>
              <label style={lbl}>Inspection Type</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {INSPECTION_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => { setInspType(t); setTitle(t) }} style={{ padding: '5px 12px', fontSize: 12, fontWeight: inspType === t ? 700 : 400, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${inspType === t ? '#d95f2b' : 'rgba(0,0,0,0.1)'}`, background: inspType === t ? '#fdf0e8' : 'white', color: inspType === t ? '#d95f2b' : '#6b6a66', transition: 'all 0.12s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Custom Title (optional)</label>
                <input style={inp} placeholder={inspType} value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Related Job</label>
                <select style={{ ...inp, background: '#131A26' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Scheduled Date *</label>
                <input type="date" style={inp} value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={lbl}>Scheduled Time</label>
                <input type="time" style={inp} value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Inspector Name</label>
                <input style={inp} placeholder="City Inspector Johnson" value={inspectorName} onChange={e => setInspectorName(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Inspector Phone</label>
                <input type="tel" style={inp} placeholder="(702) 555-0100" value={inspectorPhone} onChange={e => setInspectorPhone(formatPhone(e.target.value))} />
              </div>
              <div>
                <label style={lbl}>Permit Number</label>
                <input style={{ ...inp, fontFamily: 'monospace', textTransform: 'uppercase' }} placeholder="NV-2025-1234" value={permitNumber} onChange={e => setPermitNumber(e.target.value.toUpperCase())} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !scheduledDate} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: saving || !scheduledDate ? 'not-allowed' : 'pointer', border: 'none', background: !scheduledDate ? '#f1ede6' : '#0f0f0f', color: !scheduledDate ? '#9e9d99' : 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Schedule Inspection'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f8f7f4', borderRadius: 10, padding: 4, width: 'fit-content', flexWrap: 'wrap' }}>
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterStatus === s ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterStatus === s ? 'white' : 'transparent', color: filterStatus === s ? '#0f0f0f' : '#9e9d99', boxShadow: filterStatus === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {s === 'all' ? `All (${inspections.length})` : `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label} (${inspections.filter(i => i.status === s).length})`}
          </button>
        ))}
      </div>

      {/* INSPECTIONS LIST */}
      {sortedFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: '#131A26', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{inspections.length === 0 ? 'No inspections scheduled' : 'No results'}</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Schedule your first inspection to stay on top of timelines</div>
          {inspections.length === 0 && <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Schedule First Inspection</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedFiltered.map(insp => {
            const sc = STATUS_CONFIG[insp.status]
            const urgency = insp.status === 'scheduled' ? getUrgencyLabel(insp.scheduled_date) : null
            const job = jobs.find(j => j.id === insp.job_id)
            const daysUntil = differenceInDays(parseISO(insp.scheduled_date), new Date())

            return (
              <div key={insp.id} onClick={() => setSelected(insp === selected ? null : insp)} style={{ background: '#131A26', border: `1.5px solid ${selected?.id === insp.id ? '#0f0f0f' : urgency && (urgency.text === 'Today' || urgency.text === 'Overdue') ? '#b83232' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected?.id === insp.id ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Date block */}
                  <div style={{ width: 52, flexShrink: 0, textAlign: 'center', background: insp.status === 'passed' ? '#edf5f0' : insp.status === 'failed' ? '#fdf0f0' : urgency ? urgency.bg : '#f8f7f4', borderRadius: 10, padding: '8px 6px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: insp.status === 'passed' ? '#2d7a4f' : insp.status === 'failed' ? '#b83232' : urgency ? urgency.color : '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {format(parseISO(insp.scheduled_date), 'MMM')}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: insp.status === 'passed' ? '#2d7a4f' : insp.status === 'failed' ? '#b83232' : urgency ? urgency.color : '#0f0f0f', lineHeight: 1.1 }}>
                      {format(parseISO(insp.scheduled_date), 'd')}
                    </div>
                    <div style={{ fontSize: 10, color: '#9e9d99', marginTop: 2 }}>
                      {format(parseISO(insp.scheduled_date), 'EEE')}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{insp.title}</span>
                      {urgency && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: urgency.bg, color: urgency.color }}>{urgency.text}</span>}
                      {insp.requires_reinspection && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf4e3', color: '#6b4010' }}>⚠️ Reinspection</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      {insp.scheduled_time && <span style={{ fontSize: 12, color: '#6b6a66' }}>🕐 {insp.scheduled_time}</span>}
                      {insp.inspector_name && <span style={{ fontSize: 12, color: '#6b6a66' }}>👤 {insp.inspector_name}</span>}
                      {job && <span style={{ fontSize: 12, color: '#9e9d99' }}>· {job.title}</span>}
                      {insp.permit_number && <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9e9d99', background: '#f1ede6', padding: '1px 6px', borderRadius: 4 }}>{insp.permit_number}</span>}
                    </div>
                    {insp.result_notes && <div style={{ marginTop: 6, fontSize: 12, color: '#6b6a66', lineHeight: 1.5, fontStyle: 'italic' }}>"{insp.result_notes}"</div>}
                  </div>

                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>{sc.label}</span>
                    {insp.inspector_phone && (
                      <a href={`tel:${insp.inspector_phone.replace(/\D/g,'')}`} onClick={e => e.stopPropagation()} style={{ fontSize: 11, color: '#1f5fa6', textDecoration: 'none', fontWeight: 600, background: '#eef3fb', padding: '3px 9px', borderRadius: 7 }}>
                        📞 Call
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: '#131A26', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#9e9d99', marginBottom: 4 }}>{selected.inspection_type}</div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.4 }}>{selected.title}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99', flexShrink: 0 }}>×</button>
            </div>

            {/* Date/time block */}
            <div style={{ background: '#131A26', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{format(parseISO(selected.scheduled_date), 'MMM d, yyyy')}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{format(parseISO(selected.scheduled_date), 'EEEE')}</div>
                </div>
                {selected.scheduled_time && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Time</div>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>{selected.scheduled_time}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div style={{ background: '#f8f7f4', borderRadius: 11, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
              {selected.inspector_name && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#9e9d99', minWidth: 70 }}>Inspector</span>
                  <span style={{ fontWeight: 600 }}>{selected.inspector_name}</span>
                </div>
              )}
              {selected.inspector_phone && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#9e9d99', minWidth: 70 }}>Phone</span>
                  <a href={`tel:${selected.inspector_phone.replace(/\D/g,'')}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{selected.inspector_phone}</a>
                </div>
              )}
              {selected.permit_number && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ color: '#9e9d99', minWidth: 70 }}>Permit</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, background: '#e8e3da', padding: '1px 7px', borderRadius: 4 }}>{selected.permit_number}</span>
                </div>
              )}
            </div>

            {/* Record result */}
            {selected.status === 'scheduled' && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Record Result</div>
                <textarea value={resultNotes} onChange={e => setResultNotes(e.target.value)} placeholder="Inspector notes, what passed, what needs fixing..." rows={3} style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 8, background: '#f8f7f4', lineHeight: 1.6 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={() => updateStatus(selected.id, 'passed', resultNotes)} disabled={updatingResult} style={{ padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#2d7a4f', color: 'white', fontFamily: 'inherit' }}>
                    ✓ Mark Passed
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'failed', resultNotes, true)} disabled={updatingResult} style={{ padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#b83232', color: 'white', fontFamily: 'inherit' }}>
                    ✗ Mark Failed
                  </button>
                </div>
                <button onClick={() => updateStatus(selected.id, 'rescheduled', resultNotes)} disabled={updatingResult} style={{ width: '100%', marginTop: 8, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit', color: '#6b6a66' }}>
                  ↻ Reschedule
                </button>
              </div>
            )}

            {selected.result_notes && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: selected.status === 'passed' ? '#edf5f0' : '#fdf0f0', borderRadius: 10, fontSize: 13, color: selected.status === 'passed' ? '#1a4d31' : '#6e1a1a', borderLeft: `3px solid ${selected.status === 'passed' ? '#2d7a4f' : '#b83232'}`, lineHeight: 1.65 }}>
                <strong>Result Notes:</strong> {selected.result_notes}
              </div>
            )}

            {selected.requires_reinspection && (
              <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fdf4e3', borderRadius: 10, fontSize: 13, color: '#6b4010', borderLeft: '3px solid #b06e1a' }}>
                ⚠️ Reinspection required — schedule a follow-up inspection
              </div>
            )}

            <button onClick={() => deleteInspection(selected.id)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
              Delete Inspection
            </button>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 424 : 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

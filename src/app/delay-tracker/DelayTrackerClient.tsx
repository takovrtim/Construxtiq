'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Delay {
  id: string
  project_id: string
  user_id: string
  delay_date: string | null
  caused_by: string | null
  days_lost: number | null
  description: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialDelays: Delay[]
}

const T = {
  bg: '#0B0F16', bgCard: '#131A26', bgElev: '#1A2333', bgInput: '#0F1521',
  border: '#232E42', borderSoft: 'rgba(255,255,255,0.06)',
  fg: '#F1EEE5', fg2: '#B6BCCB', fg3: '#7B8497', fg4: '#545B6C',
  orange: '#FF6B1F', orangeDim: 'rgba(255,107,31,0.12)',
  mint: '#4FE3B5', mintDim: 'rgba(79,227,181,0.1)',
  danger: '#FF5260', dangerDim: 'rgba(255,82,96,0.12)',
  warn: '#FFB020', warnDim: 'rgba(255,176,32,0.12)',
}

const CAUSES = [
  { id: 'gc',        label: 'GC Caused',    color: T.danger },
  { id: 'weather',   label: 'Weather',      color: T.warn   },
  { id: 'material',  label: 'Material',     color: T.warn   },
  { id: 'inspection',label: 'Inspection',   color: T.orange },
  { id: 'design',    label: 'Design',       color: T.orange },
  { id: 'other',     label: 'Other',        color: T.fg3    },
]

function safeNum(v: any): number { return isNaN(Number(v)) ? 0 : Number(v) }
function safeStr(v: any): string { return v == null ? '' : String(v) }
function fmtDate(d: string | null): string {
  if (!d) return '--'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '--' }
}

export function DelayTrackerClient({ user, project, initialDelays }: Props) {
  const [delays, setDelays] = useState<Delay[]>(initialDelays || [])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [selected, setSelected] = useState<Delay | null>(null)

  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [cause, setCause]   = useState('gc')
  const [days, setDays]     = useState('1')
  const [desc, setDesc]     = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalDays  = delays.reduce((s, d) => s + safeNum(d.days_lost), 0)
  const gcDays     = delays.filter(d => d.caused_by === 'gc').reduce((s, d) => s + safeNum(d.days_lost), 0)
  const gcCount    = delays.filter(d => d.caused_by === 'gc').length
  const totalCount = delays.length

  async function save() {
    if (!project) { msg('Create a project first'); return }
    if (!desc.trim()) { msg('Add a description'); return }
    setSaving(true)
    try {
      const { data: { user: au } } = await supabase.auth.getUser()
      if (!au) { msg('Not logged in'); setSaving(false); return }
      const { data, error } = await supabase.from('delay_logs').insert({
        project_id: project.id,
        user_id: au.id,
        delay_date: date,
        caused_by: cause,
        days_lost: parseFloat(days) || 1,
        description: desc.trim(),
      }).select().single()
      if (error) { msg('Failed to save'); setSaving(false); return }
      setDelays(prev => [data as Delay, ...prev])
      setDesc(''); setDays('1'); setCause('gc')
      setShowForm(false)
      msg('Delay logged')
    } catch { msg('Error saving') }
    setSaving(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 9,
    border: `1.5px solid ${T.border}`, background: T.bgInput,
    color: T.fg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 9, fontWeight: 600, color: T.fg4, display: 'block',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em',
    fontFamily: "'JetBrains Mono', monospace",
  }

  return (
    <div style={{ fontFamily: "'Space Grotesk', -apple-system, sans-serif", color: T.fg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Legal Shield</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: T.fg, marginBottom: 4 }}>Delay Tracker</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg4 }}>Every GC-caused delay is documented, timestamped, and claimable</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showForm ? T.bgElev : T.orange, color: showForm ? T.fg3 : '#0A0E14', fontFamily: 'inherit', transition: 'all 0.15s' }}>
          {showForm ? 'Cancel' : '+ Log Delay'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Delay Days', value: totalDays, unit: 'd', color: T.fg, alert: false },
          { label: 'GC-Caused Days',   value: gcDays,   unit: 'd', color: gcDays > 0 ? T.danger : T.fg, alert: gcDays > 0 },
          { label: 'GC Incidents',     value: gcCount,  unit: '',  color: gcCount > 0 ? T.danger : T.fg, alert: gcCount > 0 },
          { label: 'Total Incidents',  value: totalCount, unit: '', color: T.fg, alert: false },
        ].map(s => (
          <div key={s.label} style={{ background: T.bgCard, border: `1px solid ${s.alert ? T.danger + '40' : T.borderSoft}`, borderRadius: 14, padding: '18px 16px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: T.fg4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      {gcDays > 0 && (
        <div style={{ padding: '13px 16px', background: T.dangerDim, border: `1px solid ${T.danger}30`, borderLeft: `3px solid ${T.danger}`, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, marginBottom: 2 }}>
            GC caused {gcDays} of {totalDays} delay day{totalDays !== 1 ? 's' : ''}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg3 }}>
            Export audit report to document this in your case file
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg3, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Log New Delay</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Days Lost</label>
              <input type="number" style={inp} min="0.5" step="0.5" value={days} onChange={e => setDays(e.target.value)} placeholder="1" />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Caused By</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CAUSES.map(c => (
                <button key={c.id} onClick={() => setCause(c.id)} style={{ padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, border: `1.5px solid ${cause === c.id ? c.color : T.border}`, background: cause === c.id ? `${c.color}20` : T.bgElev, color: cause === c.id ? c.color : T.fg3, transition: 'all 0.15s' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>What happened?</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Inspector no-show — Turner failed to schedule. Called at 3pm to cancel..." autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving || !desc.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', background: saving ? T.bgElev : T.orange, color: saving ? T.fg4 : '#0A0E14', fontFamily: 'inherit', transition: 'all 0.15s' }}>
              {saving ? 'Saving...' : 'Log Delay'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 18px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.fg3, fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Delay list */}
      {delays.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bgCard, borderRadius: 16, border: `2px dashed ${T.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.fg, marginBottom: 8 }}>No delays logged yet</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.fg4, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            Every GC-caused delay you document here can be claimed. Start logging.
          </div>
          <button onClick={() => setShowForm(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: T.orange, color: '#0A0E14', fontFamily: 'inherit' }}>Log First Delay</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
            {delays.map((d, i) => {
              const cfg = CAUSES.find(c => c.id === d.caused_by) || CAUSES[CAUSES.length - 1]
              const isSel = selected?.id === d.id
              return (
                <div key={d.id} onClick={() => setSelected(isSel ? null : d)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < delays.length - 1 ? `1px solid ${T.borderSoft}` : 'none', cursor: 'pointer', background: isSel ? T.bgElev : 'transparent', transition: 'background 0.1s' }}>
                  <div style={{ width: 3, height: 40, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: `${cfg.color}20`, color: cfg.color }}>{cfg.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.fg4 }}>{fmtDate(d.delay_date)}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{safeStr(d.description) || 'No description'}</div>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: cfg.color, flexShrink: 0 }}>+{safeNum(d.days_lost)}d</div>
                </div>
              )
            })}
          </div>

          {selected && (
            <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderSoft}`, background: T.bgElev, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.fg4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Delay Detail</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.fg4, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>x</button>
              </div>
              <div style={{ padding: '18px' }}>
                {[
                  { label: 'Date',       value: fmtDate(selected.delay_date) },
                  { label: 'Caused By',  value: CAUSES.find(c => c.id === selected.caused_by)?.label || safeStr(selected.caused_by) },
                  { label: 'Days Lost',  value: `${safeNum(selected.days_lost)} day${safeNum(selected.days_lost) !== 1 ? 's' : ''}` },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${T.borderSoft}` }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.fg4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.fg }}>{f.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.fg4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Description</div>
                  <div style={{ fontSize: 13, color: T.fg2, lineHeight: 1.7, background: T.bgElev, borderRadius: 9, padding: '12px' }}>{safeStr(selected.description) || 'No description'}</div>
                </div>
                {selected.caused_by === 'gc' && (
                  <div style={{ marginTop: 14, padding: '12px 14px', background: T.dangerDim, border: `1px solid ${T.danger}30`, borderLeft: `3px solid ${T.danger}`, borderRadius: 9 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.danger, fontWeight: 600 }}>GC-caused delay — claimable in audit export</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: T.bgElev, border: `1px solid ${T.border}`, color: T.fg, padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
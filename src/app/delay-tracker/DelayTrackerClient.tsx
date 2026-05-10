'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Delay {
  id: string
  project_id: string
  job_id: string | null
  delay_date: string
  days_lost: number
  caused_by: 'gc' | 'owner' | 'weather' | 'material' | 'inspection' | 'permit' | 'us' | 'other'
  description: string
  cumulative_impact: string | null
  documented: boolean
  created_at: string
}

interface Props {
  user: any; project: any
  initialDelays: Delay[]
  jobs: { id: string; title: string }[]
}

const CAUSED_BY = {
  gc:         { label: 'General Contractor', color: '#b83232', bg: '#fdf0f0' },
  owner:      { label: 'Owner',              color: '#7F77DD', bg: '#EEEDFE' },
  weather:    { label: 'Weather',            color: '#1f5fa6', bg: '#eef3fb' },
  material:   { label: 'Material Delay',     color: '#b06e1a', bg: '#fdf4e3' },
  inspection: { label: 'Inspection',         color: '#7F77DD', bg: '#EEEDFE' },
  permit:     { label: 'Permit',             color: '#b83232', bg: '#fdf0f0' },
  us:         { label: 'Our Team',           color: '#2d7a4f', bg: '#edf5f0' },
  other:      { label: 'Other',              color: '#9e9d99', bg: '#f1ede6' },
}

export function DelayTrackerClient({ user, project, initialDelays, jobs }: Props) {
  const [delays, setDelays]   = useState<Delay[]>(initialDelays)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  // Form state
  const [delayDate, setDelayDate]     = useState(new Date().toISOString().split('T')[0])
  const [daysLost, setDaysLost]       = useState('1')
  const [causedBy, setCausedBy]       = useState<Delay['caused_by']>('gc')
  const [description, setDescription] = useState('')
  const [impact, setImpact]           = useState('')
  const [jobId, setJobId]             = useState(jobs[0]?.id || '')
  const [documented, setDocumented]   = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalDaysLost    = delays.reduce((s, d) => s + d.days_lost, 0)
  const gcDays           = delays.filter(d => d.caused_by === 'gc').reduce((s, d) => s + d.days_lost, 0)
  const ownerDays        = delays.filter(d => d.caused_by === 'owner').reduce((s, d) => s + d.days_lost, 0)
  const undocumented     = delays.filter(d => !d.documented).length

  async function saveDelay() {
    if (!project || !description.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('delay_logs').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      delay_date: delayDate,
      days_lost: parseFloat(daysLost) || 1,
      caused_by: causedBy,
      description: description.trim(),
      cumulative_impact: impact.trim() || null,
      documented,
    }).select().single()

    if (!error && data) {
      setDelays(prev => [data as Delay, ...prev])
      msg('✓ Delay logged')
      setShowNew(false)
      setDescription(''); setImpact(''); setDaysLost('1'); setDocumented(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function toggleDocumented(id: string, val: boolean) {
    const { error } = await supabase.from('delay_logs').update({ documented: val }).eq('id', id)
    if (!error) setDelays(prev => prev.map(d => d.id === id ? { ...d, documented: val } : d))
  }

  async function deleteDelay(id: string) {
    if (!confirm('Delete this delay log?')) return
    const { error } = await supabase.from('delay_logs').delete().eq('id', id)
    if (!error) { setDelays(prev => prev.filter(d => d.id !== id)); msg('Deleted') }
  }

  function exportReport() {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = delays.map(d => {
      const cfg = CAUSED_BY[d.caused_by]
      const job = jobs.find(j => j.id === d.job_id)
      return `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:10px 14px;font-size:13px">${format(parseISO(d.delay_date), 'MMM d, yyyy')}</td>
          <td style="padding:10px 14px;font-size:13px">${job?.title || '—'}</td>
          <td style="padding:10px 14px"><span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${cfg.label}</span></td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;font-weight:700;color:#b83232">+${d.days_lost}d</td>
          <td style="padding:10px 14px;font-size:13px">${d.description}</td>
          <td style="padding:10px 14px;font-size:13px">${d.documented ? '✓' : '—'}</td>
        </tr>
      `
    }).join('')

    win.document.write(`
      <html><head><title>Delay Report — ${project.name}</title>
      <style>body{font-family:-apple-system,sans-serif;padding:40px;color:#0f0f0f}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9e9d99;padding:8px 14px;border-bottom:2px solid #e8e3da}@media print{body{padding:20px}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div>
          <div style="font-size:11px;color:#9e9d99;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Delay Report</div>
          <div style="font-size:24px;font-weight:800;letter-spacing:-.5px">${project.name}</div>
          <div style="font-size:13px;color:#9e9d99;margin-top:4px">Generated ${format(new Date(), 'MMMM d, yyyy')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#9e9d99;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Total Days Lost</div>
          <div style="font-size:36px;font-weight:800;color:#b83232">+${totalDaysLost}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px">
        ${[['GC-Caused', gcDays, '#b83232'],['Owner-Caused', ownerDays, '#7F77DD'],['Total Delays', delays.length, '#0f0f0f']].map(([l,v,c])=>`
          <div style="border:1px solid #e8e3da;border-radius:12px;padding:16px">
            <div style="font-size:10px;color:#9e9d99;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${l}</div>
            <div style="font-size:28px;font-weight:800;color:${c}">${v}${typeof v === 'number' && l !== 'Total Delays' ? 'd' : ''}</div>
          </div>
        `).join('')}
      </div>
      <table>
        <thead><tr><th>Date</th><th>Job</th><th>Caused By</th><th>Days</th><th>Description</th><th>Documented</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40 }}>⏱️</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Delay Tracker</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Log every delay, who caused it, and how many days it cost</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {delays.length > 0 && (
            <button onClick={exportReport} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
              🖨️ Export PDF
            </button>
          )}
          <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {showNew ? '✕ Cancel' : '+ Log Delay'}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Days Lost', value: `+${totalDaysLost}d`, sub: `${delays.length} incidents`, accent: totalDaysLost > 0 ? '#b83232' : '' },
          { label: 'GC-Caused', value: `+${gcDays}d`, sub: `${delays.filter(d=>d.caused_by==='gc').length} incidents`, accent: gcDays > 0 ? '#b83232' : '' },
          { label: 'Owner-Caused', value: `+${ownerDays}d`, sub: `${delays.filter(d=>d.caused_by==='owner').length} incidents`, accent: ownerDays > 0 ? '#7F77DD' : '' },
          { label: 'Not Documented', value: undocumented, sub: 'need paper trail', accent: undocumented > 0 ? '#b06e1a' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || 'var(--text-tertiary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* GC ALERT */}
      {gcDays > 0 && (
        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6e1a1a' }}>GC has caused {gcDays} days of delays</div>
            <div style={{ fontSize: 12, color: '#b83232' }}>You have documentation to protect yourself. Export the PDF before your next meeting.</div>
          </div>
          <button onClick={exportReport} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#b83232', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>
            Export Report
          </button>
        </div>
      )}

      {/* NEW DELAY FORM */}
      {showNew && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Log New Delay</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Date of Delay</label>
              <input type="date" style={inp} value={delayDate} onChange={e => setDelayDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Days Lost</label>
              <input type="number" style={inp} min="0.5" step="0.5" value={daysLost} onChange={e => setDaysLost(e.target.value)} placeholder="1" />
            </div>
            <div>
              <label style={lbl}>Caused By</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={causedBy} onChange={e => setCausedBy(e.target.value as Delay['caused_by'])}>
                {Object.entries(CAUSED_BY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
              <button type="button" onClick={() => setDocumented(v => !v)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: documented ? '#0f0f0f' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: documented ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: documented ? 600 : 400 }}>Documented with GC</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>What happened? *</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="GC changed the spec on panel layout at 3pm, required us to redo 2 days of work..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Cumulative Impact (optional)</label>
            <input style={inp} placeholder="This pushes our finish date from May 15 to May 17..." value={impact} onChange={e => setImpact(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveDelay} disabled={saving || !description.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Log Delay'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* DELAY LIST */}
      {delays.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No delays logged</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>Start logging delays to build your paper trail. When the GC blames you, you'll have proof.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Delay</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {delays.map(delay => {
            const cfg = CAUSED_BY[delay.caused_by]
            const job = jobs.find(j => j.id === delay.job_id)
            return (
              <div key={delay.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.color}20` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>+{delay.days_lost}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: cfg.color, letterSpacing: '0.3px' }}>days</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      {job && <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{job.title}</span>}
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{format(parseISO(delay.delay_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: delay.cumulative_impact ? 6 : 0 }}>{delay.description}</div>
                    {delay.cumulative_impact && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: 4 }}>Impact: {delay.cumulative_impact}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleDocumented(delay.id, !delay.documented)}
                      style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${delay.documented ? 'rgba(45,122,79,0.3)' : 'rgba(176,110,26,0.3)'}`, background: delay.documented ? '#edf5f0' : '#fdf4e3', color: delay.documented ? '#1a4d31' : '#6b4010', fontFamily: 'inherit' }}>
                      {delay.documented ? '✓ Documented' : '! Not documented'}
                    </button>
                    <button onClick={() => deleteDelay(delay.id)} style={{ fontSize: 11, color: '#b83232', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

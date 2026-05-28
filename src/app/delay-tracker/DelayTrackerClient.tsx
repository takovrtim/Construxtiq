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
  gc_name: string | null
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
  const [gcName, setGcName]           = useState('')
  const [exporting, setExporting]     = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  function exportDelayReport() {
    setExporting(true)
    const gcDelays = delays.filter(d => d.caused_by === 'gc')
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Delay Report  ${project?.name}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 48px; color: #0a0a0a; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #666; margin-bottom: 32px; }
  .summary { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 32px; }
  .stat { background: #f6f4f1; border-radius: 10px; padding: 16px; }
  .stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; font-weight: 700; margin-bottom: 6px; }
  .stat-value { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
  .stat-value.red { color: #C0392B; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f6f4f1; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  td { padding: 10px 12px; border-bottom: 1px solid #ede9e4; vertical-align: top; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-red { background: #fdf0f0; color: #C0392B; }
  .badge-blue { background: #eef3fb; color: #1A56DB; }
  .badge-gray { background: #f1ede6; color: #666; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ede9e4; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
  <div style="width:32px;height:32px;background:#E8520A;border-radius:8px;display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
  </div>
  <span style="font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#E8520A;">ConstructIQ  Delay Report</span>
</div>
<h1>${project?.name}</h1>
<div class="meta">Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}  ${delays.length} delays logged</div>
<div class="summary">
  <div class="stat"><div class="stat-label">Total Days Lost</div><div class="stat-value">${totalDaysLost}d</div></div>
  <div class="stat"><div class="stat-label">GC-Caused Days</div><div class="stat-value red">${gcDays}d</div></div>
  <div class="stat"><div class="stat-label">GC Delays</div><div class="stat-value red">${gcDelays.length}</div></div>
  <div class="stat"><div class="stat-label">Other Delays</div><div class="stat-value">${delays.length - gcDelays.length}</div></div>
</div>
${gcDays > 0 ? `<div style="background:#fdf0f0;border:1px solid rgba(192,57,43,0.2);border-left:4px solid #C0392B;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#6e1a1a;font-weight:600;">
! The General Contractor has directly caused ${gcDays} calendar day${gcDays !== 1 ? 's' : ''} of schedule delay on this project.
</div>` : ''}
<table>
  <tr><th>Date</th><th>Caused By</th><th>Days Lost</th><th>Description</th><th>Documented</th></tr>
  ${delays.map(d => `<tr>
    <td style="white-space:nowrap">${format(parseISO(d.delay_date), 'MMM d, yyyy')}</td>
    <td><span class="badge ${d.caused_by === 'gc' || d.caused_by === 'permit' ? 'badge-red' : d.caused_by === 'weather' ? 'badge-blue' : 'badge-gray'}">${CAUSED_BY[d.caused_by].label}</span></td>
    <td><strong>+${d.days_lost}d</strong></td>
    <td>${d.description}${d.cumulative_impact ? '<br><em style="color:#999;font-size:11px">' + d.cumulative_impact + '</em>' : ''}</td>
    <td>${d.documented ? 'v' : ''}</td>
  </tr>`).join('')}
</table>
<div class="footer">
  <span>ConstructIQ  ${project?.name}</span>
  <span>Generated ${new Date().toLocaleDateString()}</span>
</div>
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Delay-Report-${(project?.name || 'Project').replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`
    a.click()
    URL.revokeObjectURL(url)
    msg('v Report downloaded  open in browser and print to PDF')
    setExporting(false)
  }

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
      gc_name: gcName.trim() || null,
    }).select().single()

    if (!error && data) {
      setDelays(prev => [data as Delay, ...prev])
      msg('v Delay logged')
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
          <td style="padding:10px 14px;font-size:13px">${job?.title || ''}</td>
          <td style="padding:10px 14px"><span style="background:${cfg.bg};color:${cfg.color};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700">${cfg.label}</span></td>
          <td style="padding:10px 14px;font-size:13px;text-align:center;font-weight:700;color:#b83232">+${d.days_lost}d</td>
          <td style="padding:10px 14px;font-size:13px">${d.description}</td>
          <td style="padding:10px 14px;font-size:13px">${d.documented ? 'v' : ''}</td>
        </tr>
      `
    }).join('')

    win.document.write(`
      <html><head><title>Delay Report  ${project.name}</title>
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

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid #232E42', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#1A2333', color: '#F1EEE5' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#545B6C', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40 }}></div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Delay Tracker</div>
          <div style={{ fontSize: 13, color: '#545B6C', marginTop: 2 }}>Log every delay, who caused it, and how many days it cost</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {delays.length > 0 && (
            <button onClick={exportReport} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer', border: '1px solid #232E42', background: '#131A26', color: '#F1EEE5', fontFamily: 'inherit' }}>
               Export PDF
            </button>
          )}
          <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {showNew ? 'x Cancel' : '+ Log Delay'}
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
          <div key={s.label} style={{ background: '#131A26', border: '1px solid #232E42', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#545B6C', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || '#F1EEE5', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9ca3af' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* GC ALERT */}
      {gcDays > 0 && (
        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}></span>
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
        <div style={{ background: '#131A26', border: '1px solid #232E42', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
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
              <select style={{ ...inp, background: '#131A26' }} value={causedBy} onChange={e => setCausedBy(e.target.value as Delay['caused_by'])}>
                {Object.entries(CAUSED_BY).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: '#131A26' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
              <button type="button" onClick={() => setDocumented(v => !v)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: documented ? '#0f0f0f' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: documented ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#131A26', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: 13, color: '#7B8497', fontWeight: documented ? 600 : 400 }}>Documented with GC</span>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>GC / Responsible Party Name</label>
            <input style={inp} placeholder="Turner Construction" value={gcName} onChange={e => setGcName(e.target.value)} />
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
            <button onClick={saveDelay} disabled={saving || !description.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Log Delay'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid #232E42', background: '#131A26', fontFamily: 'inherit', color: '#F1EEE5' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* DELAY LIST */}
      {delays.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: '#131A26', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>Cal</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No delays logged</div>
          <div style={{ fontSize: 13, color: '#545B6C', marginBottom: 20 }}>Start logging delays to build your paper trail. When the GC blames you, you'll have proof.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Delay</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {delays.map(delay => {
            const cfg = CAUSED_BY[delay.caused_by]
            const job = jobs.find(j => j.id === delay.job_id)
            return (
              <div key={delay.id} style={{ background: '#131A26', border: '1px solid #232E42', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.color}20` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>+{delay.days_lost}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: cfg.color, letterSpacing: '0.3px' }}>days</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      {job && <span style={{ fontSize: 11, color: '#545B6C' }}>{job.title}</span>}
                      <span style={{ fontSize: 11, color: '#545B6C', marginLeft: 'auto' }}>{format(parseISO(delay.delay_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#F1EEE5', lineHeight: 1.5, marginBottom: delay.cumulative_impact ? 6 : 0 }}>{delay.description}</div>
                    {delay.cumulative_impact && (
                      <div style={{ fontSize: 12, color: '#545B6C', fontStyle: 'italic', marginTop: 4 }}>Impact: {delay.cumulative_impact}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleDocumented(delay.id, !delay.documented)}
                      style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${delay.documented ? 'rgba(45,122,79,0.3)' : 'rgba(176,110,26,0.3)'}`, background: delay.documented ? '#edf5f0' : '#fdf4e3', color: delay.documented ? '#1a4d31' : '#6b4010', fontFamily: 'inherit' }}>
                      {delay.documented ? 'v Documented' : '! Not documented'}
                    </button>
                    <button onClick={() => deleteDelay(delay.id)} style={{ fontSize: 11, color: '#b83232', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}


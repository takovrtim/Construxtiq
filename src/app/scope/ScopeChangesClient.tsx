'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface ScopeChange {
  id: string
  project_id: string
  job_id: string | null
  change_date: string
  requested_by: 'gc' | 'owner' | 'engineer' | 'inspector' | 'us'
  title: string
  original_scope: string
  new_scope: string
  cost_impact: number | null
  time_impact_days: number | null
  status: 'pending' | 'approved' | 'rejected' | 'in_dispute'
  notes: string | null
  created_at: string
}

interface Props {
  user: any; project: any
  initialChanges: ScopeChange[]
  jobs: { id: string; title: string }[]
}

const REQUESTED_BY = {
  gc:       { label: 'General Contractor', color: '#b83232', bg: '#fdf0f0' },
  owner:    { label: 'Owner',              color: '#7F77DD', bg: '#EEEDFE' },
  engineer: { label: 'Engineer',           color: '#1f5fa6', bg: '#eef3fb' },
  inspector:{ label: 'Inspector',          color: '#b06e1a', bg: '#fdf4e3' },
  us:       { label: 'Our Team',           color: '#2d7a4f', bg: '#edf5f0' },
}

const STATUS_CONFIG = {
  pending:    { label: 'Pending',     color: '#b06e1a', bg: '#fdf4e3' },
  approved:   { label: 'Approved',    color: '#1a4d31', bg: '#edf5f0' },
  rejected:   { label: 'Rejected',    color: '#6e1a1a', bg: '#fdf0f0' },
  in_dispute: { label: 'In Dispute',  color: '#26215C', bg: '#EEEDFE' },
}

export function ScopeChangesClient({ user, project, initialChanges, jobs }: Props) {
  const [changes, setChanges]   = useState<ScopeChange[]>(initialChanges)
  const [showNew, setShowNew]   = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState('')

  const [changeDate, setChangeDate]         = useState(new Date().toISOString().split('T')[0])
  const [requestedBy, setRequestedBy]       = useState<ScopeChange['requested_by']>('gc')
  const [title, setTitle]                   = useState('')
  const [originalScope, setOriginalScope]   = useState('')
  const [newScope, setNewScope]             = useState('')
  const [costImpact, setCostImpact]         = useState('')
  const [timeImpact, setTimeImpact]         = useState('')
  const [status, setStatus]                 = useState<ScopeChange['status']>('pending')
  const [notes, setNotes]                   = useState('')
  const [jobId, setJobId]                   = useState(jobs[0]?.id || '')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalCostImpact = changes.reduce((s, c) => s + Number(c.cost_impact || 0), 0)
  const totalTimImpact  = changes.reduce((s, c) => s + Number(c.time_impact_days || 0), 0)
  const gcChanges       = changes.filter(c => c.requested_by === 'gc').length
  const pending         = changes.filter(c => c.status === 'pending').length

  async function saveChange() {
    if (!project || !title.trim() || !originalScope.trim() || !newScope.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('scope_changes').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      change_date: changeDate,
      requested_by: requestedBy,
      title: title.trim(),
      original_scope: originalScope.trim(),
      new_scope: newScope.trim(),
      cost_impact: parseFloat(costImpact) || null,
      time_impact_days: parseFloat(timeImpact) || null,
      status,
      notes: notes.trim() || null,
    }).select().single()

    if (!error && data) {
      setChanges(prev => [data as ScopeChange, ...prev])
      msg('✓ Scope change logged')
      setShowNew(false)
      setTitle(''); setOriginalScope(''); setNewScope(''); setCostImpact(''); setTimeImpact(''); setNotes('')
    } else msg('Failed to save')
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: ScopeChange['status']) {
    const { error } = await supabase.from('scope_changes').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setChanges(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      msg(`✓ Marked as ${STATUS_CONFIG[newStatus].label}`)
    }
  }

  async function deleteChange(id: string) {
    if (!confirm('Delete this scope change?')) return
    const { error } = await supabase.from('scope_changes').delete().eq('id', id)
    if (!error) { setChanges(prev => prev.filter(c => c.id !== id)); msg('Deleted') }
  }

  function exportReport() {
    const win = window.open('', '_blank')
    if (!win) return
    const rows = changes.map(c => {
      const rb = REQUESTED_BY[c.requested_by]
      const sc = STATUS_CONFIG[c.status]
      const job = jobs.find(j => j.id === c.job_id)
      return `
        <tr style="border-bottom:1px solid #f0f0f0;vertical-align:top">
          <td style="padding:10px 14px;font-size:12px">${format(parseISO(c.change_date),'MMM d, yyyy')}</td>
          <td style="padding:10px 14px;font-size:12px;font-weight:600">${c.title}</td>
          <td style="padding:10px 14px"><span style="background:${rb.bg};color:${rb.color};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${rb.label}</span></td>
          <td style="padding:10px 14px"><span style="background:${sc.bg};color:${sc.color};padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700">${sc.label}</span></td>
          <td style="padding:10px 14px;font-size:12px;color:#2d7a4f;font-weight:600">${c.cost_impact ? '$'+Number(c.cost_impact).toLocaleString() : '—'}</td>
          <td style="padding:10px 14px;font-size:12px;color:#b83232;font-weight:600">${c.time_impact_days ? '+'+c.time_impact_days+'d' : '—'}</td>
        </tr>
      `
    }).join('')
    win.document.write(`
      <html><head><title>Scope Change Log — ${project.name}</title>
      <style>body{font-family:-apple-system,sans-serif;padding:40px;color:#0f0f0f}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#9e9d99;padding:8px 14px;border-bottom:2px solid #e8e3da}@media print{body{padding:20px}}</style>
      </head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div>
          <div style="font-size:11px;color:#9e9d99;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Scope Change Log</div>
          <div style="font-size:24px;font-weight:800">${project.name}</div>
          <div style="font-size:13px;color:#9e9d99;margin-top:4px">Generated ${format(new Date(),'MMMM d, yyyy')}</div>
        </div>
        <div style="text-align:right;display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div><div style="font-size:10px;color:#9e9d99;text-transform:uppercase;margin-bottom:4px">Total Cost Impact</div><div style="font-size:28px;font-weight:800;color:#2d7a4f">$${totalCostImpact.toLocaleString()}</div></div>
          <div><div style="font-size:10px;color:#9e9d99;text-transform:uppercase;margin-bottom:4px">Total Time Impact</div><div style="font-size:28px;font-weight:800;color:#b83232">+${totalTimImpact}d</div></div>
        </div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Change</th><th>Requested By</th><th>Status</th><th>Cost Impact</th><th>Time Impact</th></tr></thead>
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
      <div style={{ fontSize: 40 }}>📋</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Scope Change Log</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Every spec change from the GC — documented with cost and time impact</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {changes.length > 0 && (
            <button onClick={exportReport} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
              🖨️ Export PDF
            </button>
          )}
          <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {showNew ? '✕ Cancel' : '+ Log Change'}
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Changes', value: changes.length, sub: `${gcChanges} from GC`, accent: '' },
          { label: 'Cost Impact', value: `$${totalCostImpact.toLocaleString()}`, sub: 'additional scope', accent: totalCostImpact > 0 ? '#2d7a4f' : '' },
          { label: 'Time Impact', value: `+${totalTimImpact}d`, sub: 'schedule pushed', accent: totalTimImpact > 0 ? '#b83232' : '' },
          { label: 'Pending', value: pending, sub: 'need resolution', accent: pending > 0 ? '#b06e1a' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || 'var(--text-tertiary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* NEW CHANGE FORM */}
      {showNew && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Log Scope Change</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={lbl}>Date</label><input type="date" style={inp} value={changeDate} onChange={e => setChangeDate(e.target.value)} /></div>
            <div>
              <label style={lbl}>Requested By</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={requestedBy} onChange={e => setRequestedBy(e.target.value as ScopeChange['requested_by'])}>
                {Object.entries(REQUESTED_BY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={status} onChange={e => setStatus(e.target.value as ScopeChange['status'])}>
                {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Change Title *</label>
            <input style={inp} placeholder="Panel layout revision — moved from east to west wall" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Original Scope *</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="What was originally agreed..." value={originalScope} onChange={e => setOriginalScope(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>New Scope *</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="What they now want..." value={newScope} onChange={e => setNewScope(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={lbl}>Cost Impact ($)</label>
              <input type="number" style={inp} placeholder="2500" value={costImpact} onChange={e => setCostImpact(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Time Impact (days)</label>
              <input type="number" style={inp} placeholder="2" step="0.5" value={timeImpact} onChange={e => setTimeImpact(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <input style={inp} placeholder="Verbal approval from Mike on 5/8..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveChange} disabled={saving || !title.trim() || !originalScope.trim() || !newScope.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Log Change'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CHANGE LIST */}
      {changes.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No scope changes logged</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>Every time the GC changes the spec — log it here. It's your protection when they dispute your bill.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Change</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {changes.map(change => {
            const rb  = REQUESTED_BY[change.requested_by]
            const sc  = STATUS_CONFIG[change.status]
            const job = jobs.find(j => j.id === change.job_id)
            const isExpanded = expanded === change.id
            return (
              <div key={change.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div onClick={() => setExpanded(isExpanded ? null : change.id)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{change.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: rb.bg, color: rb.color }}>{rb.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {format(parseISO(change.change_date), 'MMM d, yyyy')}
                      {job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                    {change.cost_impact && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#2d7a4f' }}>${Number(change.cost_impact).toLocaleString()}</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>cost impact</div></div>}
                    {change.time_impact_days && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 16, fontWeight: 800, color: '#b83232' }}>+{change.time_impact_days}d</div><div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>time impact</div></div>}
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 18 }}>{isExpanded ? '↑' : '↓'}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16, marginTop: 16 }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Original Scope</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{change.original_scope}</div>
                      </div>
                      <div style={{ background: '#fdf4e3', borderRadius: 10, padding: 14, border: '1px solid rgba(176,110,26,0.15)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#b06e1a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>New Scope</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{change.new_scope}</div>
                      </div>
                    </div>
                    {change.notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 14, fontStyle: 'italic' }}>Notes: {change.notes}</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(['pending','approved','rejected','in_dispute'] as const).filter(s => s !== change.status).map(s => (
                        <button key={s} onClick={() => updateStatus(change.id, s)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${STATUS_CONFIG[s].color}30`, background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, fontFamily: 'inherit' }}>
                          Mark {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                      <button onClick={() => deleteChange(change.id)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit', marginLeft: 'auto' }}>Delete</button>
                    </div>
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

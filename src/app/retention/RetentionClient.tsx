'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface RetentionEntry {
  id: string
  project_id: string
  job_id: string | null
  gc_name: string
  contract_value: number
  retention_pct: number
  retention_held: number
  billed_to_date: number
  retention_released: number
  expected_release_date: string | null
  actual_release_date: string | null
  notes: string | null
  created_at: string
}

interface Props {
  user: any; project: any
  initialEntries: RetentionEntry[]
  jobs: { id: string; title: string }[]
}

export function RetentionClient({ user, project, initialEntries, jobs }: Props) {
  const [entries, setEntries] = useState<RetentionEntry[]>(initialEntries)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  const [gcName, setGcName]               = useState('')
  const [jobId, setJobId]                 = useState(jobs[0]?.id || '')
  const [contractValue, setContractValue] = useState('')
  const [retentionPct, setRetentionPct]   = useState('10')
  const [billedToDate, setBilledToDate]   = useState('')
  const [retentionReleased, setRetentionReleased] = useState('0')
  const [expectedRelease, setExpectedRelease] = useState('')
  const [notes, setNotes]                 = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalRetentionHeld     = entries.reduce((s, e) => s + Number(e.retention_held || 0), 0)
  const totalRetentionReleased = entries.reduce((s, e) => s + Number(e.retention_released || 0), 0)
  const totalOutstanding       = totalRetentionHeld - totalRetentionReleased
  const totalContractValue     = entries.reduce((s, e) => s + Number(e.contract_value || 0), 0)

  const retentionHeld = (parseFloat(billedToDate) || 0) * ((parseFloat(retentionPct) || 0) / 100)

  async function saveEntry() {
    if (!project || !gcName.trim() || !contractValue) return
    setSaving(true)
    const cv = parseFloat(contractValue) || 0
    const rp = parseFloat(retentionPct) || 10
    const bd = parseFloat(billedToDate) || 0
    const rh = bd * (rp / 100)
    const rr = parseFloat(retentionReleased) || 0
    const { data, error } = await supabase.from('retention_entries').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      gc_name: gcName.trim(), contract_value: cv, retention_pct: rp,
      retention_held: rh, billed_to_date: bd, retention_released: rr,
      expected_release_date: expectedRelease || null, notes: notes.trim() || null,
    }).select().single()
    if (!error && data) {
      setEntries(prev => [data as RetentionEntry, ...prev])
      msg('✓ Retention entry saved')
      setShowNew(false)
      setGcName(''); setContractValue(''); setBilledToDate(''); setRetentionReleased('0'); setNotes(''); setExpectedRelease('')
    } else msg('Failed to save')
    setSaving(false)
  }

  async function markReleased(id: string, amount: number) {
    const { error } = await supabase.from('retention_entries').update({
      retention_released: amount, actual_release_date: new Date().toISOString().split('T')[0]
    }).eq('id', id)
    if (!error) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, retention_released: amount, actual_release_date: new Date().toISOString().split('T')[0] } : e))
      msg('✓ Release recorded')
    }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>💰</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none' }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Retention Tracker</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Track the 10% the GC is holding — know exactly what you're owed at punch list</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? '✕ Cancel' : '+ Add Contract'}
        </button>
      </div>

      {/* BIG NUMBERS */}
      <div style={{ background: '#0f0f0f', borderRadius: 18, padding: '24px 28px', marginBottom: 20, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(217,95,43,0.12)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: 12 }}>Money the GC is holding</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { label: 'Total Contracts', value: `$${totalContractValue.toLocaleString()}`, sub: `${entries.length} contracts`, color: 'white' },
            { label: 'Retention Held', value: `$${totalRetentionHeld.toLocaleString()}`, sub: 'being withheld', color: '#ff8c5a' },
            { label: 'Released', value: `$${totalRetentionReleased.toLocaleString()}`, sub: 'paid back', color: '#4ade80' },
            { label: 'Still Outstanding', value: `$${totalOutstanding.toLocaleString()}`, sub: 'owed to you', color: totalOutstanding > 0 ? '#ff8c5a' : '#4ade80' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 700, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Add Contract Retention</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>GC Name *</label><input style={inp} placeholder="Turner Construction" value={gcName} onChange={e => setGcName(e.target.value)} autoFocus /></div>
            <div><label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Contract Value ($) *</label><input type="number" style={inp} placeholder="5000000" value={contractValue} onChange={e => setContractValue(e.target.value)} /></div>
            <div><label style={lbl}>Retention % (usually 10%)</label><input type="number" style={inp} placeholder="10" min="0" max="100" step="0.5" value={retentionPct} onChange={e => setRetentionPct(e.target.value)} /></div>
            <div><label style={lbl}>Billed to Date ($)</label><input type="number" style={inp} placeholder="2500000" value={billedToDate} onChange={e => setBilledToDate(e.target.value)} /></div>
          </div>
          {billedToDate && (
            <div style={{ background: '#fdf4e3', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#6b4010' }}>
              Retention currently held: <span style={{ color: '#b83232', fontSize: 16, fontWeight: 800 }}>${retentionHeld.toLocaleString()}</span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Retention Released ($)</label><input type="number" style={inp} placeholder="0" value={retentionReleased} onChange={e => setRetentionReleased(e.target.value)} /></div>
            <div><label style={lbl}>Expected Release Date</label><input type="date" style={inp} value={expectedRelease} onChange={e => setExpectedRelease(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 18 }}><label style={lbl}>Notes</label><input style={inp} placeholder="Punch list items, conditions for release..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEntry} disabled={saving || !gcName.trim() || !contractValue} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {entries.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No retention tracked yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>At $5M contracts, 10% retention = $500K sitting with the GC. Track it.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add Contract</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map(entry => {
            const outstanding = Number(entry.retention_held) - Number(entry.retention_released)
            const job = jobs.find(j => j.id === entry.job_id)
            const fullyReleased = outstanding <= 0
            return (
              <div key={entry.id} style={{ background: 'var(--surface)', border: `1.5px solid ${fullyReleased ? 'rgba(45,122,79,0.2)' : 'var(--border)'}`, borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>{entry.gc_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {job ? job.title + ' · ' : ''}
                      Contract: ${Number(entry.contract_value).toLocaleString()} · {entry.retention_pct}% retention
                    </div>
                  </div>
                  {fullyReleased && <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#edf5f0', color: '#1a4d31' }}>✓ Released</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: entry.notes ? 12 : 0 }}>
                  {[
                    { label: 'Billed to Date', value: `$${Number(entry.billed_to_date).toLocaleString()}` },
                    { label: 'Held by GC', value: `$${Number(entry.retention_held).toLocaleString()}`, accent: '#b83232' },
                    { label: 'Released', value: `$${Number(entry.retention_released).toLocaleString()}`, accent: '#2d7a4f' },
                    { label: 'Outstanding', value: `$${outstanding.toLocaleString()}`, accent: outstanding > 0 ? '#b83232' : '#2d7a4f' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: (s as any).accent || 'var(--text-primary)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {entry.expected_release_date && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10 }}>Expected release: {format(parseISO(entry.expected_release_date), 'MMMM d, yyyy')}</div>
                )}
                {entry.notes && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>{entry.notes}</div>}
                {!fullyReleased && (
                  <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                    <button onClick={() => markReleased(entry.id, Number(entry.retention_held))} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#2d7a4f', color: 'white', fontFamily: 'inherit' }}>
                      ✓ Mark Fully Released (${Number(entry.retention_held).toLocaleString()})
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </>
  )
}

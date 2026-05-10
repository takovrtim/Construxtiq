'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface LienWaiver {
  id: string; project_id: string; job_id: string | null
  waiver_date: string; waiver_type: 'conditional_progress' | 'unconditional_progress' | 'conditional_final' | 'unconditional_final'
  amount: number; through_date: string; gc_name: string; notes: string | null; created_at: string
}
interface Props { user: any; project: any; initialWaivers: LienWaiver[]; jobs: { id: string; title: string }[] }

const WAIVER_TYPES = {
  conditional_progress:   { label: 'Conditional Progress',   short: 'Cond. Progress', color: '#b06e1a', bg: '#fdf4e3', info: 'Waives lien rights IF payment is received' },
  unconditional_progress: { label: 'Unconditional Progress', short: 'Uncond. Progress', color: '#b83232', bg: '#fdf0f0', info: 'PERMANENT waiver for work through date — signed = done' },
  conditional_final:      { label: 'Conditional Final',      short: 'Cond. Final',    color: '#1f5fa6', bg: '#eef3fb', info: 'Final waiver IF final payment received' },
  unconditional_final:    { label: 'Unconditional Final',    short: 'Uncond. Final',  color: '#6e1a1a', bg: '#fdf0f0', info: 'PERMANENT final waiver — never sign without payment' },
}

export function LienWaiverClient({ user, project, initialWaivers, jobs }: Props) {
  const [waivers, setWaivers] = useState<LienWaiver[]>(initialWaivers)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  const [waiverType, setWaiverType]   = useState<LienWaiver['waiver_type']>('conditional_progress')
  const [waiverDate, setWaiverDate]   = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount]           = useState('')
  const [throughDate, setThroughDate] = useState(new Date().toISOString().split('T')[0])
  const [gcName, setGcName]           = useState('')
  const [jobId, setJobId]             = useState(jobs[0]?.id || '')
  const [notes, setNotes]             = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const totalConditional   = waivers.filter(w => w.waiver_type.startsWith('conditional')).reduce((s, w) => s + Number(w.amount), 0)
  const totalUnconditional = waivers.filter(w => w.waiver_type.startsWith('unconditional')).reduce((s, w) => s + Number(w.amount), 0)
  const unconditionalFinal = waivers.filter(w => w.waiver_type === 'unconditional_final')

  async function saveWaiver() {
    if (!project || !amount || !gcName.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('lien_waivers').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      waiver_date: waiverDate, waiver_type: waiverType, amount: parseFloat(amount),
      through_date: throughDate, gc_name: gcName.trim(), notes: notes.trim() || null,
    }).select().single()
    if (!error && data) {
      setWaivers(prev => [data as LienWaiver, ...prev])
      msg('✓ Waiver logged')
      setShowNew(false); setAmount(''); setGcName(''); setNotes('')
    } else msg('Failed to save')
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>📄</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none' }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Lien Waiver Log</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Track every waiver signed — conditional vs unconditional matters</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? '✕ Cancel' : '+ Log Waiver'}
        </button>
      </div>

      {/* Warning if unconditional final exists */}
      {unconditionalFinal.length > 0 && (
        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#6e1a1a', marginBottom: 4 }}>⚠️ {unconditionalFinal.length} Unconditional Final Waiver{unconditionalFinal.length > 1 ? 's' : ''} on file</div>
          <div style={{ fontSize: 12, color: '#b83232' }}>These permanently waive all lien rights. Verify payment was received before each was signed.</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Waivers Signed', value: waivers.length, accent: '' },
          { label: 'Conditional Total', value: `$${totalConditional.toLocaleString()}`, accent: '#b06e1a' },
          { label: 'Unconditional Total', value: `$${totalUnconditional.toLocaleString()}`, accent: '#b83232' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent || 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Waiver type explainer */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Know before you sign</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(WAIVER_TYPES).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: v.bg, borderRadius: 9 }}>
              <div style={{ flexShrink: 0, width: 4, background: v.color, borderRadius: 4 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: v.color }}>{v.label}</div>
                <div style={{ fontSize: 11, color: v.color, opacity: 0.8, marginTop: 1 }}>{v.info}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>Log Lien Waiver</div>

          {/* Type selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Waiver Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(WAIVER_TYPES).map(([k, v]) => (
                <button key={k} type="button" onClick={() => setWaiverType(k as any)} style={{ padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${waiverType === k ? v.color : 'var(--border)'}`, background: waiverType === k ? v.bg : 'var(--surface)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: waiverType === k ? v.color : 'var(--text-primary)' }}>{v.short}</div>
                  <div style={{ fontSize: 10, color: waiverType === k ? v.color : 'var(--text-tertiary)', marginTop: 2 }}>{v.info}</div>
                </button>
              ))}
            </div>
          </div>

          {(waiverType === 'unconditional_progress' || waiverType === 'unconditional_final') && (
            <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#b83232' }}>
              ⚠️ UNCONDITIONAL — only sign this after payment has cleared your account.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Date Signed</label><input type="date" style={inp} value={waiverDate} onChange={e => setWaiverDate(e.target.value)} /></div>
            <div><label style={lbl}>Through Date</label><input type="date" style={inp} value={throughDate} onChange={e => setThroughDate(e.target.value)} /></div>
            <div><label style={lbl}>Amount ($) *</label><input type="number" style={inp} placeholder="500000" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>GC / Payer Name *</label><input style={inp} placeholder="Turner Construction" value={gcName} onChange={e => setGcName(e.target.value)} autoFocus /></div>
            <div><label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 18 }}><label style={lbl}>Notes</label><input style={inp} placeholder="Payment #12, draw #3..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveWaiver} disabled={saving || !gcName.trim() || !amount} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Log Waiver'}</button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {waivers.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No waivers logged yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>Log every lien waiver you sign. Know the difference between conditional and unconditional.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Waiver</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {waivers.map(w => {
            const wt = WAIVER_TYPES[w.waiver_type]
            const job = jobs.find(j => j.id === w.job_id)
            return (
              <div key={w.id} style={{ background: 'var(--surface)', border: `1.5px solid ${wt.color}20`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: wt.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{w.gc_name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: wt.bg, color: wt.color }}>{wt.short}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Signed {format(parseISO(w.waiver_date), 'MMM d, yyyy')} · Through {format(parseISO(w.through_date), 'MMM d, yyyy')}
                    {job ? ` · ${job.title}` : ''}
                  </div>
                  {w.notes && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontStyle: 'italic' }}>{w.notes}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: wt.color }}>${Number(w.amount).toLocaleString()}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </>
  )
}

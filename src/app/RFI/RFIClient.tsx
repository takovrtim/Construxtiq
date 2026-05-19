'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'

interface RFI {
  id: string
  project_id: string
  rfi_number: string
  subject: string
  question: string
  submitted_to: string
  submitted_date: string
  response_needed_by: string
  response_date: string | null
  response: string | null
  status: 'open' | 'responded' | 'overdue' | 'closed'
  cost_impact: number | null
  time_impact_days: number | null
  job_id: string | null
  created_at: string
}

interface Props {
  user: any; project: any
  initialRFIs: RFI[]
  jobs: { id: string; title: string }[]
}

const STATUS_CONFIG = {
  open:      { label: 'Open',      color: '#1f5fa6', bg: '#eef3fb', dot: '#1f5fa6' },
  responded: { label: 'Responded', color: '#1a4d31', bg: '#edf5f0', dot: '#2d7a4f' },
  overdue:   { label: 'Overdue',   color: '#6e1a1a', bg: '#fdf0f0', dot: '#b83232' },
  closed:    { label: 'Closed',    color: '#6b6a66', bg: '#f1ede6', dot: '#9e9d99' },
}

export function RFIClient({ user, project, initialRFIs, jobs }: Props) {
  const [rfis, setRFIs]       = useState<RFI[]>(initialRFIs)
  const [showNew, setShowNew] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState('')

  const [rfiNum, setRFINum]           = useState('')
  const [subject, setSubject]         = useState('')
  const [question, setQuestion]       = useState('')
  const [submittedTo, setSubmittedTo] = useState('')
  const [submittedDate, setSubmittedDate] = useState(new Date().toISOString().split('T')[0])
  const [responseBy, setResponseBy]   = useState(() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split('T')[0] })
  const [costImpact, setCostImpact]   = useState('')
  const [timeImpact, setTimeImpact]   = useState('')
  const [jobId, setJobId]             = useState(jobs[0]?.id || '')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  // Auto-update status based on dates
  const rfisWithStatus = rfis.map(r => ({
    ...r,
    status: r.status === 'closed' ? 'closed' :
            r.response_date ? 'responded' :
            r.response_needed_by && isPast(parseISO(r.response_needed_by)) ? 'overdue' : 'open'
  })) as RFI[]

  const openCount    = rfisWithStatus.filter(r => r.status === 'open').length
  const overdueCount = rfisWithStatus.filter(r => r.status === 'overdue').length
  const totalCostImpact = rfisWithStatus.reduce((s, r) => s + Number(r.cost_impact || 0), 0)
  const totalTimeImpact = rfisWithStatus.reduce((s, r) => s + Number(r.time_impact_days || 0), 0)

  function genRFINumber() {
    const count = rfis.length + 1
    return `RFI-${String(count).padStart(3, '0')}`
  }

  async function saveRFI() {
    if (!project || !subject.trim() || !question.trim()) return
    setSaving(true)
    const num = rfiNum.trim() || genRFINumber()
    const { data, error } = await supabase.from('rfis').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      rfi_number: num, subject: subject.trim(), question: question.trim(),
      submitted_to: submittedTo.trim(), submitted_date: submittedDate,
      response_needed_by: responseBy,
      cost_impact: parseFloat(costImpact) || null,
      time_impact_days: parseFloat(timeImpact) || null,
      status: 'open',
    }).select().single()
    if (!error && data) {
      setRFIs(prev => [data as RFI, ...prev])
      msg('✓ RFI logged')
      setShowNew(false)
      setSubject(''); setQuestion(''); setSubmittedTo(''); setCostImpact(''); setTimeImpact('')
      setRFINum('')
    } else msg('Failed to save')
    setSaving(false)
  }

  async function logResponse(id: string, response: string) {
    const { error } = await supabase.from('rfis').update({
      response, response_date: new Date().toISOString().split('T')[0], status: 'responded'
    }).eq('id', id)
    if (!error) {
      setRFIs(prev => prev.map(r => r.id === id ? { ...r, response, response_date: new Date().toISOString().split('T')[0], status: 'responded' } : r))
      msg('✓ Response logged')
    }
  }

  async function closeRFI(id: string) {
    const { error } = await supabase.from('rfis').update({ status: 'closed' }).eq('id', id)
    if (!error) { setRFIs(prev => prev.map(r => r.id === id ? { ...r, status: 'closed' } : r)); msg('✓ RFI closed') }
  }

  async function deleteRFI(id: string) {
    if (!confirm('Delete this RFI?')) return
    const { error } = await supabase.from('rfis').delete().eq('id', id)
    if (!error) { setRFIs(prev => prev.filter(r => r.id !== id)); setExpanded(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid #e5e7eb', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: '#111827' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9ca3af', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>📋</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none' }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>RFI Tracker</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Requests for Information — unanswered RFIs = documented delays</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? '✕ Cancel' : '+ New RFI'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Open RFIs', value: openCount, accent: openCount > 0 ? '#1f5fa6' : '' },
          { label: 'Overdue', value: overdueCount, accent: overdueCount > 0 ? '#b83232' : '' },
          { label: 'Cost Impact', value: `$${totalCostImpact.toLocaleString()}`, accent: totalCostImpact > 0 ? '#2d7a4f' : '' },
          { label: 'Delay Impact', value: `+${totalTimeImpact}d`, accent: totalTimeImpact > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 18px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent || '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {overdueCount > 0 && (
        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>🚨</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6e1a1a' }}>{overdueCount} RFI{overdueCount !== 1 ? 's' : ''} overdue — GC has not responded</div>
            <div style={{ fontSize: 12, color: '#b83232' }}>Every day without a response is documented delay. Log it in your Delay Tracker too.</div>
          </div>
        </div>
      )}

      {showNew && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>New RFI</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>RFI Number</label><input style={inp} placeholder={genRFINumber()} value={rfiNum} onChange={e => setRFINum(e.target.value)} /></div>
            <div><label style={lbl}>Date Submitted</label><input type="date" style={inp} value={submittedDate} onChange={e => setSubmittedDate(e.target.value)} /></div>
            <div><label style={lbl}>Response Needed By</label><input type="date" style={inp} value={responseBy} onChange={e => setResponseBy(e.target.value)} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div><label style={lbl}>Submitted To</label><input style={inp} placeholder="Turner Construction / Architect" value={submittedTo} onChange={e => setSubmittedTo(e.target.value)} /></div>
            <div><label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Subject *</label><input style={inp} placeholder="Panel location clarification — east vs west mechanical room" value={subject} onChange={e => setSubject(e.target.value)} autoFocus /></div>
          <div style={{ marginBottom: 14 }}><label style={lbl}>Question / Issue *</label><textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Describe the question precisely. Reference drawing numbers and spec sections where applicable." value={question} onChange={e => setQuestion(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div><label style={lbl}>Potential Cost Impact ($)</label><input type="number" style={inp} placeholder="0" value={costImpact} onChange={e => setCostImpact(e.target.value)} /></div>
            <div><label style={lbl}>Potential Delay (days)</label><input type="number" style={inp} placeholder="0" step="0.5" value={timeImpact} onChange={e => setTimeImpact(e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveRFI} disabled={saving || !subject.trim() || !question.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Submit RFI'}</button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', fontFamily: 'inherit', color: '#111827' }}>Cancel</button>
          </div>
        </div>
      )}

      {rfisWithStatus.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed #e5e7eb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No RFIs yet</div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>Every unanswered question to the GC should be a formal RFI. It creates a paper trail and documents delays.</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Submit First RFI</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rfisWithStatus.map(rfi => {
            const sc = STATUS_CONFIG[rfi.status]
            const daysUntil = rfi.response_needed_by ? differenceInDays(parseISO(rfi.response_needed_by), new Date()) : 999
            const job = jobs.find(j => j.id === rfi.job_id)
            const isExpanded = expanded === rfi.id
            return (
              <div key={rfi.id} style={{ background: 'white', border: `1.5px solid ${rfi.status === 'overdue' ? 'rgba(184,50,50,0.3)' : isExpanded ? '#0f0f0f' : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden' }}>
                <div onClick={() => setExpanded(isExpanded ? null : rfi.id)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'monospace', color: '#9ca3af', marginBottom: 2 }}>{rfi.rfi_number}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{rfi.subject}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      To: {rfi.submitted_to || '—'} · {rfi.submitted_date ? rfi.submitted_date ? format(parseISO(rfi.submitted_date), 'MMM d') : '—'}
                      {job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {rfi.status === 'open' || rfi.status === 'overdue' ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: daysUntil < 0 ? '#b83232' : daysUntil <= 2 ? '#b06e1a' : '#111827' }}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil}d left`}
                        </div>
                        <div style={{ fontSize: 10, color: '#9ca3af' }}>to respond</div>
                      </div>
                    ) : rfi.response_date ? (
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{rfi.response_date ? `Responded ${rfi.response_date ? format(parseISO(rfi.response_date), 'MMM d') : '—'}` : ''}</div>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 18, color: '#9ca3af' }}>{isExpanded ? '↑' : '↓'}</div>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, margin: '16px 0 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Question</div>
                      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{rfi.question}</div>
                    </div>
                    {rfi.response && (
                      <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.15)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>GC Response</div>
                        <div style={{ fontSize: 13, color: '#1a4d31', lineHeight: 1.6 }}>{rfi.response}</div>
                      </div>
                    )}
                    {(rfi.cost_impact || rfi.time_impact_days) && (
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        {rfi.cost_impact && <div style={{ background: '#edf5f0', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#2d7a4f' }}>${Number(rfi.cost_impact).toLocaleString()} potential cost</div>}
                        {rfi.time_impact_days && <div style={{ background: '#fdf0f0', borderRadius: 9, padding: '8px 14px', fontSize: 13, fontWeight: 700, color: '#b83232' }}>+{rfi.time_impact_days}d potential delay</div>}
                      </div>
                    )}
                    {!rfi.response && rfi.status !== 'closed' && (
                      <div style={{ marginBottom: 12 }}>
                        <label style={lbl}>Log GC Response</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input id={`resp-${rfi.id}`} style={{ ...inp, flex: 1 }} placeholder="What did the GC say..." />
                          <button onClick={() => {
                            const el = document.getElementById(`resp-${rfi.id}`) as HTMLInputElement
                            if (el?.value.trim()) logResponse(rfi.id, el.value.trim())
                          }} style={{ padding: '10px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#2d7a4f', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>Save</button>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {rfi.status !== 'closed' && <button onClick={() => closeRFI(rfi.id)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#111827', fontFamily: 'inherit' }}>Close RFI</button>}
                      <button onClick={() => deleteRFI(rfi.id)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
                    </div>
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

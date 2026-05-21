'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'

interface RFI {
  id: string; project_id: string; rfi_number: string
  subject: string; question: string; submitted_to: string
  submitted_date: string | null; response_needed_by: string | null
  response_date: string | null; response: string | null
  status: 'open' | 'responded' | 'overdue' | 'closed'
  cost_impact: number | null; time_impact_days: number | null
  job_id: string | null; created_at: string
}
interface Props {
  user: any; project: any
  initialRFIs: RFI[]
  jobs: { id: string; title: string }[]
}

const STATUS_CFG = {
  open:      { label: 'Open',      color: '#1e40af', bg: '#eff6ff' },
  responded: { label: 'Responded', color: '#166534', bg: '#f0fdf4' },
  overdue:   { label: 'Overdue',   color: '#991b1b', bg: '#fef2f2' },
  closed:    { label: 'Closed',    color: '#6b7280', bg: '#f9fafb' },
}

function safeDate(d: string | null, fmt: string): string {
  if (!d) return '--'
  try { return format(parseISO(d), fmt) } catch { return '--' }
}

function safeDiff(d: string | null): number {
  if (!d) return 999
  try { return differenceInDays(parseISO(d), new Date()) } catch { return 999 }
}

export function RFIClient({ user, project, initialRFIs, jobs }: Props) {
  const [rfis, setRFIs]       = useState<RFI[]>(initialRFIs)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [selected, setSelected] = useState<RFI | null>(null)
  const [toast, setToast]     = useState('')

  const [rfiNum, setRfiNum]       = useState('')
  const [subject, setSubject]     = useState('')
  const [question, setQuestion]   = useState('')
  const [submittedTo, setSubmittedTo] = useState('')
  const [submittedDate, setSubmittedDate] = useState(new Date().toISOString().split('T')[0])
  const [responseBy, setResponseBy] = useState('')
  const [costImpact, setCostImpact] = useState('')
  const [timeImpact, setTimeImpact] = useState('')
  const [jobId, setJobId]         = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3500) }

  const rfisWithStatus = rfis.map(r => ({
    ...r,
    status: r.status === 'closed' ? 'closed' :
            r.response_date ? 'responded' :
            (r.response_needed_by && isPast(parseISO(r.response_needed_by))) ? 'overdue' : 'open',
  })) as RFI[]

  const openCount       = rfisWithStatus.filter(r => r.status === 'open').length
  const overdueCount    = rfisWithStatus.filter(r => r.status === 'overdue').length
  const totalCostImpact = rfisWithStatus.reduce((s, r) => s + Number(r.cost_impact || 0), 0)
  const totalTimeImpact = rfisWithStatus.reduce((s, r) => s + Number(r.time_impact_days || 0), 0)

  async function saveRFI() {
    if (!project || !subject.trim() || !question.trim()) { msg('Subject and question required'); return }
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }

    const num = rfiNum.trim() || `RFI-${String(rfis.length + 1).padStart(3, '0')}`
    const { data, error } = await supabase.from('rfis').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId || null, rfi_number: num,
      subject: subject.trim(), question: question.trim(),
      submitted_to: submittedTo.trim(),
      submitted_date: submittedDate,
      response_needed_by: responseBy || null,
      cost_impact: parseFloat(costImpact) || null,
      time_impact_days: parseFloat(timeImpact) || null,
      status: 'open',
    }).select().single()

    if (!error && data) {
      setRFIs(prev => [data as RFI, ...prev])
      setShowNew(false)
      setSubject(''); setQuestion(''); setSubmittedTo('')
      setRfiNum(''); setCostImpact(''); setTimeImpact(''); setJobId('')
      msg('RFI logged')
    } else {
      msg('Failed to save')
    }
    setSaving(false)
  }

  async function closeRFI(id: string) {
    await supabase.from('rfis').update({ status: 'closed' }).eq('id', id)
    setRFIs(prev => prev.map(r => r.id === id ? { ...r, status: 'closed' } : r))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: 'closed' } : null)
    msg('RFI closed')
  }

  async function saveResponse(id: string, response: string) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('rfis').update({ response, response_date: today, status: 'responded' }).eq('id', id)
    setRFIs(prev => prev.map(r => r.id === id ? { ...r, response, response_date: today, status: 'responded' } : r))
    msg('Response recorded')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: 13,
    border: '1.5px solid #e5e7eb', borderRadius: 9,
    fontFamily: 'inherit', outline: 'none',
    background: '#f9fafb', color: '#111827',
    boxSizing: 'border-box' as const,
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#6b7280',
    display: 'block', marginBottom: 5,
    textTransform: 'uppercase' as const, letterSpacing: '0.4px',
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#111827' }}>No project yet</div>
      <a href="/dashboard" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>Create a project first</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#111827' }}>RFI Tracker</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Every unanswered RFI is documented delay</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#374151' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? 'Cancel' : '+ New RFI'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Open RFIs',    value: openCount,                              alert: openCount > 0 },
          { label: 'Overdue',      value: overdueCount,                            alert: overdueCount > 0 },
          { label: 'Cost Impact',  value: `$${totalCostImpact.toLocaleString()}`, alert: false },
          { label: 'Days at Risk', value: `${totalTimeImpact}d`,                  alert: totalTimeImpact > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.alert ? '#dc2626' : '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* OVERDUE ALERT */}
      {overdueCount > 0 && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '3px solid #ef4444', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 16 }}>
          {overdueCount} RFI{overdueCount > 1 ? 's' : ''} past deadline -- GC has not responded. Every day is documented delay.
        </div>
      )}

      {/* NEW RFI FORM */}
      {showNew && (
        <div style={{ background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 20 }}>New RFI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>RFI Number</label>
              <input style={inp} placeholder="RFI-001 (auto)" value={rfiNum} onChange={e => setRfiNum(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Submit To</label>
              <input style={inp} placeholder="Turner Construction" value={submittedTo} onChange={e => setSubmittedTo(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Submit Date</label>
              <input type="date" style={inp} value={submittedDate} onChange={e => setSubmittedDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Response Needed By</label>
              <input type="date" style={inp} value={responseBy} onChange={e => setResponseBy(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Cost Impact ($)</label>
              <input type="number" style={inp} placeholder="0" value={costImpact} onChange={e => setCostImpact(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Schedule Impact (days)</label>
              <input type="number" style={inp} placeholder="0" value={timeImpact} onChange={e => setTimeImpact(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Subject *</label>
            <input style={inp} placeholder="Conduit routing confirmation at column B-4" value={subject} onChange={e => setSubject(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Question *</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3}
              placeholder="Please confirm the approved conduit routing for the east wall panel feed. Drawing E-101 Rev B shows two conflicting routes..."
              value={question} onChange={e => setQuestion(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveRFI} disabled={saving || !subject.trim() || !question.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: saving ? '#e5e7eb' : '#ea580c', color: saving ? '#9ca3af' : 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Log RFI'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 20px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* RFI LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {rfisWithStatus.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#111827' }}>No RFIs logged yet</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
                Every question you submit to the GC needs to be on record. If they don't respond, that is documented delay.
              </div>
              <button onClick={() => setShowNew(true)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#ea580c', color: 'white', fontFamily: 'inherit' }}>Log First RFI</button>
            </div>
          ) : (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              {rfisWithStatus.map(rfi => {
                const st       = STATUS_CFG[rfi.status as keyof typeof STATUS_CFG] || STATUS_CFG.open
                const daysLeft = safeDiff(rfi.response_needed_by)
                const isSel    = selected?.id === rfi.id
                const isOverdue = rfi.status === 'overdue'
                return (
                  <div key={rfi.id} onClick={() => setSelected(isSel ? null : rfi)}
                    style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', background: isSel ? '#fff7ed' : isOverdue ? '#fef2f2' : 'white', transition: 'background 0.1s', display: 'flex', alignItems: 'flex-start', gap: 14 }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#9ca3af', flexShrink: 0 }}>{rfi.rfi_number}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                        {isOverdue && <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626' }}>PAST DEADLINE</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{rfi.subject}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        To: {rfi.submitted_to || '--'}
                        {rfi.submitted_date ? ` -- Submitted ${safeDate(rfi.submitted_date, 'MMM d')}` : ''}
                        {rfi.response_needed_by && rfi.status === 'open' ? ` -- Due ${safeDate(rfi.response_needed_by, 'MMM d')} (${daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`})` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>{'>'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* DETAIL PANEL */}
        {selected && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 20 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{selected.rfi_number}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{safeDate(selected.submitted_date, 'MMM d, yyyy')}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {selected.status !== 'closed' && (
                  <button onClick={() => closeRFI(selected.id)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Close</button>
                )}
                <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 16 }}>x</button>
              </div>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Subject</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{selected.subject}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Question</div>
                <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#f9fafb', borderRadius: 9, padding: '10px 12px' }}>{selected.question}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Submitted To', value: selected.submitted_to || '--' },
                  { label: 'Submit Date',  value: safeDate(selected.submitted_date, 'MMM d, yyyy') },
                  { label: 'Due By',       value: safeDate(selected.response_needed_by, 'MMM d, yyyy') },
                  { label: 'Status',       value: STATUS_CFG[selected.status as keyof typeof STATUS_CFG]?.label || selected.status },
                ].map(f => (
                  <div key={f.label} style={{ background: '#f9fafb', borderRadius: 9, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {(selected.cost_impact || selected.time_impact_days) ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {selected.cost_impact ? (
                    <div style={{ background: '#f0fdf4', borderRadius: 9, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cost Impact</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#166534' }}>${Number(selected.cost_impact).toLocaleString()}</div>
                    </div>
                  ) : null}
                  {selected.time_impact_days ? (
                    <div style={{ background: '#fef2f2', borderRadius: 9, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Schedule Impact</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>{selected.time_impact_days}d</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {selected.response && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>GC Response -- {safeDate(selected.response_date, 'MMM d, yyyy')}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, background: '#f0fdf4', borderRadius: 9, padding: '10px 12px', border: '1px solid #bbf7d0' }}>{selected.response}</div>
                </div>
              )}
              {selected.status === 'open' || selected.status === 'overdue' ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Log GC Response</div>
                  <textarea style={{ ...inp, resize: 'none', marginBottom: 8 }} rows={3} id={`resp-${selected.id}`}
                    placeholder="Enter what the GC responded..." />
                  <button onClick={() => {
                    const el = document.getElementById(`resp-${selected.id}`) as HTMLTextAreaElement
                    if (el?.value.trim()) saveResponse(selected.id, el.value.trim())
                  }} style={{ padding: '9px 18px', fontSize: 12, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#111827', color: 'white', fontFamily: 'inherit' }}>
                    Save Response
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#111827', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
          {toast}
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface RFI {
  id: string
  project_id: string
  rfi_number: string | null
  subject: string | null
  question: string | null
  submitted_to: string | null
  submitted_date: string | null
  response_needed_by: string | null
  response_date: string | null
  response: string | null
  status: string | null
  cost_impact: number | null
  time_impact_days: number | null
  created_at: string
}

interface Props { user: any; project: any; initialRFIs: RFI[]; jobs: any[] }

const T = {
  bg: '#0B0F16', bgCard: '#131A26', bgElev: '#1A2333', bgInput: '#0F1521',
  border: '#232E42', borderSoft: 'rgba(255,255,255,0.06)',
  fg: '#F1EEE5', fg2: '#B6BCCB', fg3: '#7B8497', fg4: '#545B6C',
  orange: '#FF6B1F', orangeDim: 'rgba(255,107,31,0.12)',
  mint: '#4FE3B5', mintDim: 'rgba(79,227,181,0.1)',
  danger: '#FF5260', dangerDim: 'rgba(255,82,96,0.12)',
  warn: '#FFB020', warnDim: 'rgba(255,176,32,0.12)',
  blue: '#6FA8FF', blueDim: 'rgba(111,168,255,0.12)',
}

function safeStr(v: any) { return v == null ? '' : String(v) }
function safeNum(v: any) { return isNaN(Number(v)) ? 0 : Number(v) }
function fmtDate(d: string | null) {
  if (!d) return '--'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '--' }
}
function isOverdue(d: string | null) {
  if (!d) return false
  try { return new Date(d) < new Date() } catch { return false }
}
function daysLeft(d: string | null) {
  if (!d) return null
  try {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
    return diff
  } catch { return null }
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  open:      { label: 'Open',      color: T.blue,   bg: T.blueDim },
  overdue:   { label: 'Overdue',   color: T.danger,  bg: T.dangerDim },
  responded: { label: 'Responded', color: T.mint,    bg: T.mintDim },
  closed:    { label: 'Closed',    color: T.fg4,     bg: 'rgba(255,255,255,0.04)' },
}

export function RFIClient({ user, project, initialRFIs, jobs }: Props) {
  const [rfis, setRFIs] = useState<RFI[]>(initialRFIs || [])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<RFI | null>(null)
  const [toast, setToast] = useState('')
  const [respText, setRespText] = useState('')

  const [subject, setSubject]   = useState('')
  const [question, setQuestion] = useState('')
  const [subTo, setSubTo]       = useState('')
  const [subDate, setSubDate]   = useState(new Date().toISOString().split('T')[0])
  const [respBy, setRespBy]     = useState('')
  const [costImp, setCostImp]   = useState('')
  const [timeImp, setTimeImp]   = useState('')
  const [rfiNum, setRfiNum]     = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const rfisWithStatus = (rfis || []).map(r => ({
    ...r,
    status: safeStr(r.status) === 'closed' ? 'closed' :
            r.response_date ? 'responded' :
            isOverdue(r.response_needed_by) ? 'overdue' : 'open',
  }))

  const openCount    = rfisWithStatus.filter(r => r.status === 'open').length
  const overdueCount = rfisWithStatus.filter(r => r.status === 'overdue').length
  const totalCost    = rfisWithStatus.reduce((s, r) => s + safeNum(r.cost_impact), 0)
  const totalTime    = rfisWithStatus.reduce((s, r) => s + safeNum(r.time_impact_days), 0)

  async function save() {
    if (!project) { msg('Create a project first'); return }
    if (!subject.trim() || !question.trim()) { msg('Subject and question required'); return }
    setSaving(true)
    try {
      const { data: { user: au } } = await supabase.auth.getUser()
      if (!au) { msg('Not logged in'); setSaving(false); return }
      const num = rfiNum.trim() || `RFI-${String(rfis.length + 1).padStart(3, '0')}`
      const { data, error } = await supabase.from('rfis').insert({
        project_id: project.id, user_id: au.id,
        rfi_number: num, subject: subject.trim(), question: question.trim(),
        submitted_to: subTo.trim(), submitted_date: subDate,
        response_needed_by: respBy || null,
        cost_impact: parseFloat(costImp) || null,
        time_impact_days: parseFloat(timeImp) || null,
        status: 'open',
      }).select().single()
      if (error) { msg('Failed to save'); setSaving(false); return }
      setRFIs(prev => [data as RFI, ...prev])
      setSubject(''); setQuestion(''); setSubTo('')
      setRfiNum(''); setCostImp(''); setTimeImp(''); setRespBy('')
      setShowForm(false)
      msg('RFI logged')
    } catch { msg('Error saving') }
    setSaving(false)
  }

  async function logResponse(id: string) {
    if (!respText.trim()) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('rfis').update({ response: respText.trim(), response_date: today, status: 'responded' }).eq('id', id)
    setRFIs(prev => prev.map(r => r.id === id ? { ...r, response: respText.trim(), response_date: today, status: 'responded' } : r))
    setSelected(prev => prev?.id === id ? { ...prev, response: respText.trim(), response_date: today, status: 'responded' } : prev)
    setRespText('')
    msg('Response recorded')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 9, border: `1.5px solid ${T.border}`, background: T.bgInput, color: T.fg, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { fontSize: 9, fontWeight: 600, color: T.fg4, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: T.fg }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>No project yet</div>
      <a href="/dashboard" style={{ color: T.orange, textDecoration: 'none', fontWeight: 600 }}>Create a project first</a>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Space Grotesk', -apple-system, sans-serif", color: T.fg }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.orange, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Legal Shield</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: T.fg, marginBottom: 4 }}>RFI Tracker</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg4 }}>Every unanswered RFI is documented delay you can claim</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showForm ? T.bgElev : T.orange, color: showForm ? T.fg3 : '#0A0E14', fontFamily: 'inherit' }}>
          {showForm ? 'Cancel' : '+ New RFI'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Open RFIs',    value: openCount,                              color: openCount > 0 ? T.blue : T.fg,    alert: openCount > 0 },
          { label: 'Overdue',      value: overdueCount,                            color: overdueCount > 0 ? T.danger : T.fg, alert: overdueCount > 0 },
          { label: 'Cost Impact',  value: `$${totalCost.toLocaleString()}`,        color: T.fg,    alert: false },
          { label: 'Days at Risk', value: `${totalTime}d`,                         color: totalTime > 0 ? T.warn : T.fg,   alert: totalTime > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: T.bgCard, border: `1px solid ${s.alert ? s.color + '40' : T.borderSoft}`, borderRadius: 14, padding: '18px 16px' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, color: T.fg4, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div style={{ padding: '13px 16px', background: T.dangerDim, border: `1px solid ${T.danger}30`, borderLeft: `3px solid ${T.danger}`, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.danger, marginBottom: 2 }}>
            {overdueCount} RFI{overdueCount > 1 ? 's' : ''} past deadline -- GC has not responded
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg3 }}>Every day without a response is documented delay</div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg3, marginBottom: 18, textTransform: 'uppercase', letterSpacing: '0.1em' }}>New RFI</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 12 }}>
            <div><label style={lbl}>RFI Number</label><input style={inp} placeholder="RFI-001 (auto)" value={rfiNum} onChange={e => setRfiNum(e.target.value)} /></div>
            <div><label style={lbl}>Submit To</label><input style={inp} placeholder="Turner Construction" value={subTo} onChange={e => setSubTo(e.target.value)} /></div>
            <div><label style={lbl}>Submit Date</label><input type="date" style={inp} value={subDate} onChange={e => setSubDate(e.target.value)} /></div>
            <div><label style={lbl}>Response Needed By</label><input type="date" style={inp} value={respBy} onChange={e => setRespBy(e.target.value)} /></div>
            <div><label style={lbl}>Cost Impact ($)</label><input type="number" style={inp} placeholder="0" value={costImp} onChange={e => setCostImp(e.target.value)} /></div>
            <div><label style={lbl}>Schedule Impact (days)</label><input type="number" style={inp} placeholder="0" value={timeImp} onChange={e => setTimeImp(e.target.value)} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Subject *</label>
            <input style={inp} placeholder="Conduit routing confirmation at column B-4" value={subject} onChange={e => setSubject(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Question *</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Please confirm approved conduit routing..." value={question} onChange={e => setQuestion(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving || !subject.trim() || !question.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: T.orange, color: '#0A0E14', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Log RFI'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '11px 18px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: `1px solid ${T.border}`, background: 'transparent', color: T.fg3, fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {rfisWithStatus.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: T.bgCard, borderRadius: 16, border: `2px dashed ${T.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.fg, marginBottom: 8 }}>No RFIs logged yet</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: T.fg4, marginBottom: 20 }}>Every question to the GC needs to be on record.</div>
          <button onClick={() => setShowForm(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: T.orange, color: '#0A0E14', fontFamily: 'inherit' }}>Log First RFI</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: 'hidden' }}>
            {rfisWithStatus.map((rfi, i) => {
              const st = STATUS[rfi.status || 'open'] || STATUS.open
              const dl = daysLeft(rfi.response_needed_by)
              const isSel = selected?.id === rfi.id
              return (
                <div key={rfi.id} onClick={() => setSelected(isSel ? null : rfi)} style={{ padding: '14px 18px', borderBottom: i < rfisWithStatus.length - 1 ? `1px solid ${T.borderSoft}` : 'none', cursor: 'pointer', background: isSel ? T.bgElev : 'transparent', transition: 'background 0.1s', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.fg4 }}>{safeStr(rfi.rfi_number) || 'RFI'}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
                      {rfi.status === 'overdue' && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: T.danger }}>PAST DEADLINE</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{safeStr(rfi.subject) || 'No subject'}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.fg4 }}>
                      {safeStr(rfi.submitted_to) && `To: ${rfi.submitted_to}`}
                      {dl !== null && rfi.status === 'open' && ` -- Due ${fmtDate(rfi.response_needed_by)} (${dl < 0 ? `${Math.abs(dl)}d overdue` : `${dl}d left`})`}
                    </div>
                  </div>
                  <div style={{ color: T.fg4, fontSize: 14, flexShrink: 0 }}>›</div>
                </div>
              )
            })}
          </div>

          {selected && (
            <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: 14, overflow: 'hidden', position: 'sticky', top: 20 }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderSoft}`, background: T.bgElev, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: T.fg }}>{safeStr(selected.rfi_number)}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.fg4 }}>{fmtDate(selected.submitted_date)}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.fg4, fontSize: 18 }}>x</button>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
                <div>
                  <div style={lbl}>Subject</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.fg }}>{safeStr(selected.subject)}</div>
                </div>
                <div>
                  <div style={lbl}>Question</div>
                  <div style={{ fontSize: 13, color: T.fg2, lineHeight: 1.7, background: T.bgElev, borderRadius: 9, padding: '10px 12px' }}>{safeStr(selected.question)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { l: 'Submitted To', v: safeStr(selected.submitted_to) || '--' },
                    { l: 'Submit Date',  v: fmtDate(selected.submitted_date) },
                    { l: 'Due By',       v: fmtDate(selected.response_needed_by) },
                    { l: 'Status',       v: STATUS[selected.status || 'open']?.label || 'Open' },
                  ].map(f => (
                    <div key={f.l} style={{ background: T.bgElev, borderRadius: 9, padding: '10px 12px' }}>
                      <div style={lbl}>{f.l}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.fg }}>{f.v}</div>
                    </div>
                  ))}
                </div>
                {(safeNum(selected.cost_impact) > 0 || safeNum(selected.time_impact_days) > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {safeNum(selected.cost_impact) > 0 && (
                      <div style={{ background: T.mintDim, borderRadius: 9, padding: '10px 12px' }}>
                        <div style={lbl}>Cost Impact</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.mint }}>${safeNum(selected.cost_impact).toLocaleString()}</div>
                      </div>
                    )}
                    {safeNum(selected.time_impact_days) > 0 && (
                      <div style={{ background: T.dangerDim, borderRadius: 9, padding: '10px 12px' }}>
                        <div style={lbl}>Schedule</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.danger }}>{selected.time_impact_days}d</div>
                      </div>
                    )}
                  </div>
                )}
                {selected.response && (
                  <div>
                    <div style={lbl}>GC Response -- {fmtDate(selected.response_date)}</div>
                    <div style={{ fontSize: 13, color: T.fg2, lineHeight: 1.7, background: T.mintDim, borderRadius: 9, padding: '10px 12px', border: `1px solid ${T.mint}30` }}>{safeStr(selected.response)}</div>
                  </div>
                )}
                {(selected.status === 'open' || selected.status === 'overdue') && (
                  <div>
                    <div style={lbl}>Log GC Response</div>
                    <textarea style={{ ...inp, resize: 'none', marginBottom: 8 }} rows={3} value={respText} onChange={e => setRespText(e.target.value)} placeholder="Enter what the GC responded..." />
                    <button onClick={() => logResponse(selected.id)} disabled={!respText.trim()} style={{ padding: '9px 18px', fontSize: 12, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: T.bgElev, color: T.fg, fontFamily: 'inherit' }}>Save Response</button>
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
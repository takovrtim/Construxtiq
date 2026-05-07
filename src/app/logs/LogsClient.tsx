'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday } from 'date-fns'

interface JobLog {
  id: string; project_id: string; job_id: string | null; log_date: string
  weather: string | null; crew_present: string | null; work_completed: string
  materials_used: string | null; issues: string | null; inspections: string | null
  hours_worked: number | null; progress_pct: number | null; flagged: boolean
  ai_summary: string | null; created_at: string
}

interface Props { user: any; project: any; initialLogs: JobLog[]; jobs: { id: string; title: string }[] }

const WEATHER = ['☀️ Clear', '⛅ Cloudy', '🌧️ Rain', '💨 Windy', '🌡️ Hot', '❄️ Cold']

export function LogsClient({ user, project, initialLogs, jobs }: Props) {
  const [logs, setLogs]           = useState<JobLog[]>(initialLogs)
  const [showAdd, setShowAdd]     = useState(false)
  const [selected, setSelected]   = useState<JobLog | null>(null)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [logDate, setLogDate]     = useState(new Date().toISOString().split('T')[0])
  const [weather, setWeather]     = useState('')
  const [crewPresent, setCrewPresent] = useState('')
  const [workCompleted, setWorkCompleted] = useState('')
  const [materialsUsed, setMaterialsUsed] = useState('')
  const [issues, setIssues]       = useState('')
  const [inspections, setInspections] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [progressPct, setProgressPct] = useState('')
  const [jobId, setJobId]         = useState(jobs[0]?.id || '')
  const [flagged, setFlagged]     = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }
  const todayLog = logs.find(l => isToday(parseISO(l.log_date)))
  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !workCompleted.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('job_logs').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      log_date: logDate, weather: weather || null, crew_present: crewPresent.trim() || null,
      work_completed: workCompleted.trim(), materials_used: materialsUsed.trim() || null,
      issues: issues.trim() || null, inspections: inspections.trim() || null,
      hours_worked: parseFloat(hoursWorked) || null, progress_pct: parseInt(progressPct) || null, flagged,
    }).select().single()
    if (!error && data) {
      setLogs(prev => [data as JobLog, ...prev])
      msg('✓ Daily log saved')
      setWorkCompleted(''); setMaterialsUsed(''); setIssues('')
      setInspections(''); setHoursWorked(''); setProgressPct('')
      setFlagged(false); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function generateAISummary(log: JobLog) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ log_id: log.id, action: 'summarize' }) })
      const json = await res.json()
      if (json.success) {
        setLogs(prev => prev.map(l => l.id === log.id ? { ...l, ai_summary: json.summary } : l))
        if (selected?.id === log.id) setSelected(prev => prev ? { ...prev, ai_summary: json.summary } : null)
        msg('✓ AI summary generated')
      }
    } catch { msg('AI summary failed') }
    setAiLoading(false)
  }

  async function deleteLog(id: string) {
    if (!confirm('Delete this log entry?')) return
    const { error } = await supabase.from('job_logs').delete().eq('id', id)
    if (!error) { setLogs(prev => prev.filter(l => l.id !== id)); setSelected(null); msg('Deleted') }
  }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>📝</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Daily Log</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Document every day on site — your legal and financial record</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Log Today'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Entries', value: logs.length, sub: 'days logged', accent: '' },
          { label: "Today's Log", value: todayLog ? '✓' : '—', sub: todayLog ? 'completed' : 'not done', accent: todayLog ? '#2d7a4f' : '#b06e1a' },
          { label: 'Flagged Days', value: logs.filter(l => l.flagged).length, sub: 'had issues', accent: logs.filter(l => l.flagged).length > 0 ? '#b83232' : '' },
          { label: 'Avg Hours', value: logs.filter(l => l.hours_worked).length > 0 ? `${(logs.reduce((s,l) => s+(l.hours_worked||0),0)/logs.filter(l=>l.hours_worked).length).toFixed(1)}h` : '—', sub: 'per day', accent: '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {!todayLog && !showAdd && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📝</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b4010' }}>No daily log today</div>
              <div style={{ fontSize: 12, color: '#b06e1a' }}>Document what happened on site before you forget</div>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#b06e1a', color: 'white', fontFamily: 'inherit' }}>Log Now</button>
        </div>
      )}

      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <form onSubmit={addLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={logDate} onChange={e => setLogDate(e.target.value)} max={new Date().toISOString().split('T')[0]} /></div>
              <div><label style={lbl}>Job</label>
                <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Weather</label>
                <select style={{ ...inp, background: 'white' }} value={weather} onChange={e => setWeather(e.target.value)}>
                  <option value="">Select...</option>
                  {WEATHER.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div><label style={lbl}>Work Completed Today *</label><textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="What did the crew actually do today?" value={workCompleted} onChange={e => setWorkCompleted(e.target.value)} required autoFocus /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Crew Present</label><input style={inp} placeholder="John, Mike, Sub: Garcia Electric" value={crewPresent} onChange={e => setCrewPresent(e.target.value)} /></div>
              <div><label style={lbl}>Materials Used</label><input style={inp} placeholder="200ft 12/2 romex, 4 junction boxes" value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} /></div>
              <div><label style={lbl}>Hours Worked</label><input type="number" style={inp} placeholder="8" min="0" step="0.5" value={hoursWorked} onChange={e => setHoursWorked(e.target.value)} /></div>
              <div><label style={lbl}>Job Progress %</label><input type="number" style={inp} placeholder="45" min="0" max="100" value={progressPct} onChange={e => setProgressPct(e.target.value)} /></div>
            </div>
            <div><label style={lbl}>Issues / Problems</label><input style={inp} placeholder="Any problems, disputes, or unexpected discoveries..." value={issues} onChange={e => setIssues(e.target.value)} /></div>
            <div><label style={lbl}>Inspections</label><input style={inp} placeholder="Rough electrical passed at 2pm, inspector: Jim Rodriguez" value={inspections} onChange={e => setInspections(e.target.value)} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: flagged ? '#fdf0f0' : '#f8f7f4', borderRadius: 10, cursor: 'pointer' }} onClick={() => setFlagged(v => !v)}>
              <input type="checkbox" checked={flagged} onChange={() => setFlagged(v => !v)} style={{ width: 16, height: 16, accentColor: '#b83232', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: flagged ? '#b83232' : '#6b6a66' }}>🚩 Flag this day — problems, disputes, or important events</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !workCompleted.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Save Log'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {logs.length === 0 && !showAdd ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No daily logs yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Log every day on site — your legal record if anything goes wrong</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Entry</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map(log => {
            const job = jobs.find(j => j.id === log.job_id)
            const today_ = isToday(parseISO(log.log_date))
            return (
              <div key={log.id} onClick={() => setSelected(log === selected ? null : log)} style={{ background: 'white', border: `1.5px solid ${log.flagged ? 'rgba(184,50,50,0.3)' : selected?.id === log.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: log.flagged ? '#fdf0f0' : today_ ? '#fdf0e8' : '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {log.flagged ? '🚩' : today_ ? '📝' : '📋'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{format(parseISO(log.log_date), 'EEEE, MMM d, yyyy')}</span>
                      {today_ && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf0e8', color: '#d95f2b' }}>TODAY</span>}
                      {log.flagged && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf0f0', color: '#b83232' }}>🚩</span>}
                      {log.weather && <span style={{ fontSize: 11, color: '#9e9d99' }}>{log.weather}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#6b6a66', lineHeight: 1.5, marginBottom: 4 }}>{log.work_completed.slice(0, 120)}{log.work_completed.length > 120 ? '...' : ''}</div>
                    <div style={{ fontSize: 11, color: '#9e9d99' }}>
                      {log.crew_present ? `👷 ${log.crew_present.slice(0, 40)} · ` : ''}{log.hours_worked ? `${log.hours_worked}h` : ''}{job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  {log.progress_pct && <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontSize: 18, fontWeight: 800 }}>{log.progress_pct}%</div><div style={{ fontSize: 10, color: '#9e9d99' }}>progress</div></div>}
                </div>

                {selected?.id === log.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {log.materials_used && <div style={{ background: '#f8f7f4', borderRadius: 9, padding: '10px 12px', fontSize: 13 }}><div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 4 }}>Materials</div>{log.materials_used}</div>}
                      {log.issues && <div style={{ background: '#fdf0f0', borderRadius: 9, padding: '10px 12px', fontSize: 13, borderLeft: '3px solid #b83232' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#b83232', textTransform: 'uppercase', marginBottom: 4 }}>Issues</div>{log.issues}</div>}
                      {log.inspections && <div style={{ background: '#edf5f0', borderRadius: 9, padding: '10px 12px', fontSize: 13, borderLeft: '3px solid #2d7a4f' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#2d7a4f', textTransform: 'uppercase', marginBottom: 4 }}>Inspections</div>{log.inspections}</div>}
                    </div>
                    {log.ai_summary && <div style={{ background: '#eef3fb', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: '#0C447C', marginBottom: 10, borderLeft: '3px solid #1f5fa6' }}><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>✨ AI Summary</div>{log.ai_summary}</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!log.ai_summary && <button onClick={e => { e.stopPropagation(); generateAISummary(log) }} disabled={aiLoading} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>{aiLoading ? '⏳...' : '✨ AI Summary'}</button>}
                      <button onClick={e => { e.stopPropagation(); deleteLog(log.id) }} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

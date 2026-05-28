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

const WEATHER_OPTIONS = ['☀️ Clear', '⛅ Partly Cloudy', '🌧️ Rain', '💨 Windy', '🌡️ Hot (100°+)', '❄️ Cold']

export function LogsClient({ user, project, initialLogs, jobs }: Props) {
  const [logs, setLogs]         = useState<JobLog[]>(initialLogs)
  const [showAdd, setShowAdd]   = useState(false)
  const [selected, setSelected] = useState<JobLog | null>(null)
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Form state
  const [logDate, setLogDate]               = useState(new Date().toISOString().split('T')[0])
  const [jobId, setJobId]                   = useState(jobs[0]?.id || '')
  const [weather, setWeather]               = useState('')
  const [crewPresent, setCrewPresent]       = useState('')
  const [hoursWorked, setHoursWorked]       = useState('')
  const [workCompleted, setWorkCompleted]   = useState('')
  const [materialsUsed, setMaterialsUsed]   = useState('')
  const [issues, setIssues]                 = useState('')
  const [inspections, setInspections]       = useState('')
  const [progressPct, setProgressPct]       = useState('0')
  const [flagged, setFlagged]               = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const todayLogged = logs.some(l => isToday(parseISO(l.log_date)))
  const totalHours  = logs.reduce((s, l) => s + (l.hours_worked || 0), 0)
  const flaggedCount = logs.filter(l => l.flagged).length

  async function saveLog() {
    if (!project || !workCompleted.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('job_logs').insert({
      project_id: project.id, user_id: user.id, job_id: jobId || null,
      log_date: logDate, weather: weather || null,
      crew_present: crewPresent.trim() || null,
      hours_worked: parseFloat(hoursWorked) || null,
      work_completed: workCompleted.trim(),
      materials_used: materialsUsed.trim() || null,
      issues: issues.trim() || null,
      inspections: inspections.trim() || null,
      progress_pct: parseInt(progressPct) || 0,
      flagged,
    }).select().single()
    if (!error && data) {
      setLogs(prev => [data as JobLog, ...prev])
      msg('✓ Log saved')
      setShowAdd(false)
      setWorkCompleted(''); setMaterialsUsed(''); setIssues('')
      setInspections(''); setHoursWorked(''); setCrewPresent('')
      setWeather(''); setProgressPct('0'); setFlagged(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function generateAISummary(log: JobLog) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_date: log.log_date, work_completed: log.work_completed,
          issues: log.issues, materials_used: log.materials_used,
          hours_worked: log.hours_worked, crew_present: log.crew_present,
          weather: log.weather, project_name: project.name,
        }),
      })
      const json = await res.json()
      if (json.success) {
        await supabase.from('job_logs').update({ ai_summary: json.summary }).eq('id', log.id)
        setLogs(prev => prev.map(l => l.id === log.id ? { ...l, ai_summary: json.summary } : l))
        if (selected?.id === log.id) setSelected(prev => prev ? { ...prev, ai_summary: json.summary } : null)
        msg('✓ AI summary generated')
      }
    } catch { msg('Failed to generate summary') }
    setAiLoading(false)
  }

  async function deleteLog(id: string) {
    if (!confirm('Delete this log entry?')) return
    const { error } = await supabase.from('job_logs').delete().eq('id', id)
    if (!error) { setLogs(prev => prev.filter(l => l.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40 }}>📝</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Daily Log</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Document every day on site — your legal record</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Log Today'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Logs', value: logs.length, sub: 'days documented', accent: '' },
          { label: 'Today', value: todayLogged ? '✓ Done' : '⚠️ Missing', sub: todayLogged ? 'logged' : 'not logged yet', accent: !todayLogged ? '#b06e1a' : '#2d7a4f' },
          { label: 'Total Hours', value: `${totalHours}h`, sub: 'on site', accent: '' },
          { label: 'Flagged Days', value: flaggedCount, sub: 'issues noted', accent: flaggedCount > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || 'var(--text-tertiary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TODAY ALERT */}
      {!todayLogged && !showAdd && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>📝</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6b4010' }}>No log for today yet</div>
            <div style={{ fontSize: 12, color: '#b06e1a' }}>Log before end of day — it protects you if anything gets disputed</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#b06e1a', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>Log Now</button>
        </div>
      )}

      {/* ADD LOG FORM */}
      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>New Daily Log</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={logDate} onChange={e => setLogDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">All jobs</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Hours Worked</label>
              <input type="number" style={inp} placeholder="8" min="0" step="0.5" value={hoursWorked} onChange={e => setHoursWorked(e.target.value)} />
            </div>
          </div>

          {/* Weather picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Weather</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {WEATHER_OPTIONS.map(w => (
                <button key={w} type="button" onClick={() => setWeather(weather === w ? '' : w)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: weather === w ? 700 : 400, borderRadius: 20, border: `1px solid ${weather === w ? '#d95f2b' : 'var(--border)'}`, background: weather === w ? '#fdf0e8' : 'var(--surface)', color: weather === w ? '#d95f2b' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Crew Present</label>
            <input style={inp} placeholder="John, Mike, Carlos — 3 workers" value={crewPresent} onChange={e => setCrewPresent(e.target.value)} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Work Completed *</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Describe exactly what was done today. Be specific — this is your legal record if anything gets disputed." value={workCompleted} onChange={e => setWorkCompleted(e.target.value)} autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Materials Used</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Wire, conduit, breakers..." value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Issues / Delays</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="GC changed panel location at 2pm..." value={issues} onChange={e => setIssues(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Inspections / Meetings</label>
            <input style={inp} placeholder="Rough-in inspection passed at 11am" value={inspections} onChange={e => setInspections(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={lbl}>Progress % Complete</label>
              <input type="number" style={inp} placeholder="65" min="0" max="100" value={progressPct} onChange={e => setProgressPct(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 22 }}>
              <button type="button" onClick={() => setFlagged(v => !v)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: flagged ? '#b83232' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: 3, left: flagged ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#131A26', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
              </button>
              <span style={{ fontSize: 13, color: flagged ? '#b83232' : 'var(--text-secondary)', fontWeight: flagged ? 700 : 400 }}>Flag this day (issue occurred)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveLog} disabled={saving || !workCompleted.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Save Log'}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* LOG LIST */}
      {logs.length === 0 && !showAdd ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No logs yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>Log every day on site. It's your timestamped record when anything gets disputed.</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log Today</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map(log => {
            const job = jobs.find(j => j.id === log.job_id)
            const isSelected = selected?.id === log.id
            const todayLog = isToday(parseISO(log.log_date))
            return (
              <div key={log.id} onClick={() => setSelected(isSelected ? null : log)} style={{ background: 'var(--surface)', border: `1.5px solid ${isSelected ? '#0f0f0f' : log.flagged ? 'rgba(184,50,50,0.25)' : 'var(--border)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flexShrink: 0, textAlign: 'center', width: 44, height: 44, borderRadius: 12, background: todayLog ? '#0f0f0f' : 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: todayLog ? 'white' : 'var(--text-primary)', lineHeight: 1 }}>{format(parseISO(log.log_date), 'd')}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: todayLog ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)', textTransform: 'uppercase' }}>{format(parseISO(log.log_date), 'MMM')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.work_completed.slice(0, 80)}{log.work_completed.length > 80 ? '...' : ''}</span>
                      {log.flagged && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 20, background: '#fdf0f0', color: '#b83232', flexShrink: 0 }}>⚠️ Flagged</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {format(parseISO(log.log_date), 'EEEE, MMMM d')}
                      {log.hours_worked ? ` · ${log.hours_worked}h` : ''}
                      {log.weather ? ` · ${log.weather}` : ''}
                      {job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  {log.progress_pct !== null && log.progress_pct > 0 && (
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#2d7a4f' }}>{log.progress_pct}%</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>complete</div>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Work Done</div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{log.work_completed}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {log.crew_present && (
                          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Crew</div>
                            <div style={{ fontSize: 12 }}>{log.crew_present}</div>
                          </div>
                        )}
                        {log.materials_used && (
                          <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Materials</div>
                            <div style={{ fontSize: 12 }}>{log.materials_used}</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {log.issues && (
                      <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.15)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#b06e1a', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Issues / Delays</div>
                        <div style={{ fontSize: 13, color: '#6b4010' }}>{log.issues}</div>
                      </div>
                    )}

                    {log.ai_summary && (
                      <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.15)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#1f5fa6', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>AI Summary</div>
                        <div style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.5 }}>{log.ai_summary}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      {!log.ai_summary && (
                        <button onClick={e => { e.stopPropagation(); generateAISummary(log) }} disabled={aiLoading} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1f5fa6', color: 'white', fontFamily: 'inherit' }}>
                          {aiLoading ? '⏳ Generating...' : '✨ AI Summary'}
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); deleteLog(log.id) }} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
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

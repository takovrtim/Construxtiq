'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday, isYesterday } from 'date-fns'

interface JobLog {
  id: string
  project_id: string
  job_id: string | null
  log_date: string
  weather: string | null
  crew_present: string[]
  work_completed: string
  materials_used: string | null
  issues: string | null
  inspections_today: string | null
  hours_worked: number | null
  progress_percent: number | null
  flagged: boolean
  ai_summary: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialLogs: JobLog[]
  jobs: { id: string; title: string; status: string; client_name: string }[]
}

const WEATHER_OPTIONS = ['☀️ Clear', '⛅ Partly Cloudy', '🌥️ Overcast', '🌧️ Rain', '🌩️ Storm', '🌬️ Windy', '🔥 Extreme Heat']
const FLAG_REASONS = ['Owner on site', 'Inspector visit', 'Safety incident', 'Work stoppage', 'Scope change', 'Delay occurred', 'Material shortage']

function dateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMM d')
}

export function LogsClient({ user, project, initialLogs, jobs }: Props) {
  const [logs, setLogs]           = useState<JobLog[]>(initialLogs)
  const [selected, setSelected]   = useState<JobLog | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [filterJob, setFilterJob] = useState('all')
  const [filterFlag, setFilterFlag] = useState(false)

  // Form state
  const [logDate, setLogDate]             = useState(new Date().toISOString().split('T')[0])
  const [jobId, setJobId]                 = useState(jobs[0]?.id || '')
  const [weather, setWeather]             = useState('☀️ Clear')
  const [crewInput, setCrewInput]         = useState('')
  const [workCompleted, setWorkCompleted] = useState('')
  const [materials, setMaterials]         = useState('')
  const [issues, setIssues]               = useState('')
  const [inspections, setInspections]     = useState('')
  const [hoursWorked, setHoursWorked]     = useState('')
  const [progress, setProgress]           = useState('')
  const [flagged, setFlagged]             = useState(false)

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  const filtered = logs
    .filter(l => filterJob === 'all' || l.job_id === filterJob)
    .filter(l => !filterFlag || l.flagged)

  const totalHours = logs.reduce((s, l) => s + (l.hours_worked || 0), 0)
  const flaggedCount = logs.filter(l => l.flagged).length
  const todayLog = logs.find(l => isToday(parseISO(l.log_date)))

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !workCompleted.trim()) return
    setSaving(true)

    const crew = crewInput ? crewInput.split(',').map(s => s.trim()).filter(Boolean) : []

    const { data, error } = await supabase.from('job_logs').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      log_date: logDate,
      weather: weather || null,
      crew_present: crew,
      work_completed: workCompleted.trim(),
      materials_used: materials.trim() || null,
      issues: issues.trim() || null,
      inspections_today: inspections.trim() || null,
      hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
      progress_percent: progress ? parseInt(progress) : null,
      flagged,
      ai_summary: null,
    }).select().single()

    if (!error && data) {
      setLogs(prev => [data as JobLog, ...prev])
      msg(`✓ Log entry saved for ${dateLabel(logDate)}`)
      setWorkCompleted(''); setMaterials(''); setIssues('')
      setInspections(''); setHoursWorked(''); setProgress('')
      setCrewInput(''); setFlagged(false); setShowAdd(false)
    } else msg('Failed to save — check connection')
    setSaving(false)
  }

  async function generateSummary(log: JobLog) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_id: log.id,
          log_date: log.log_date,
          work_completed: log.work_completed,
          materials_used: log.materials_used,
          issues: log.issues,
          inspections_today: log.inspections_today,
          crew_present: log.crew_present,
          hours_worked: log.hours_worked,
          progress_percent: log.progress_percent,
          job_title: jobs.find(j => j.id === log.job_id)?.title,
          project_name: project?.name,
        }),
      })
      const json = await res.json()
      if (json.success) {
        await supabase.from('job_logs').update({ ai_summary: json.summary }).eq('id', log.id)
        setLogs(prev => prev.map(l => l.id === log.id ? { ...l, ai_summary: json.summary } : l))
        setSelected(prev => prev ? { ...prev, ai_summary: json.summary } : null)
        msg('✓ AI summary generated')
      }
    } catch { msg('AI summary failed') }
    setAiLoading(false)
  }

  async function toggleFlag(id: string, current: boolean) {
    const { error } = await supabase.from('job_logs').update({ flagged: !current }).eq('id', id)
    if (!error) {
      setLogs(prev => prev.map(l => l.id === id ? { ...l, flagged: !current } : l))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, flagged: !current } : null)
    }
  }

  async function deleteLog(id: string) {
    if (!confirm('Delete this log entry?')) return
    const { error } = await supabase.from('job_logs').delete().eq('id', id)
    if (!error) { setLogs(prev => prev.filter(l => l.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#6b6a66' }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'block', marginTop: 8 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Daily Job Log</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Site notes, crew, progress — your paper trail for every job</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Log Today'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Entries', value: logs.length, sub: 'days logged', accent: '' },
          { label: 'Hours Logged', value: `${totalHours}h`, sub: 'across all jobs', accent: '' },
          { label: 'Flagged Days', value: flaggedCount, sub: 'need attention', accent: flaggedCount > 0 ? '#b83232' : '' },
          { label: "Today's Log", value: todayLog ? '✓' : '—', sub: todayLog ? 'completed' : 'not logged yet', accent: todayLog ? '#2d7a4f' : '#b06e1a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TODAY ALERT */}
      {!todayLog && !showAdd && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📝</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b4010' }}>No log entry for today yet</div>
              <div style={{ fontSize: 12, color: '#b06e1a' }}>Log what happened on site before you forget</div>
            </div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#b06e1a', color: 'white', fontFamily: 'inherit' }}>
            Log Now
          </button>
        </div>
      )}

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>New Log Entry</div>
          <form onSubmit={addLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" style={inp} value={logDate} onChange={e => setLogDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={lbl}>Job</label>
                <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Weather</label>
                <select style={{ ...inp, background: 'white' }} value={weather} onChange={e => setWeather(e.target.value)}>
                  {WEATHER_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Work Completed Today *</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Describe exactly what was done today — rough wiring in kitchen, panel installation, ran conduit from panel to subpanel..." value={workCompleted} onChange={e => setWorkCompleted(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Crew Present</label>
                <input style={inp} placeholder="John, Mike, Carlos" value={crewInput} onChange={e => setCrewInput(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Hours Worked</label>
                <input type="number" style={inp} placeholder="8" min="0" max="24" step="0.5" value={hoursWorked} onChange={e => setHoursWorked(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Materials Used</label>
                <input style={inp} placeholder="200ft 12/2 wire, 2 breakers, junction box" value={materials} onChange={e => setMaterials(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Job Progress %</label>
                <input type="number" style={inp} placeholder="45" min="0" max="100" value={progress} onChange={e => setProgress(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={lbl}>Inspections Today</label>
              <input style={inp} placeholder="Rough electrical — passed. Inspector: Johnson" value={inspections} onChange={e => setInspections(e.target.value)} />
            </div>

            <div>
              <label style={lbl}>Issues / Problems</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Any delays, problems, owner requests, or things that need follow-up..." value={issues} onChange={e => setIssues(e.target.value)} />
            </div>

            {/* Flag toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: flagged ? '#fdf0f0' : '#f8f7f4', borderRadius: 10, cursor: 'pointer' }} onClick={() => setFlagged(v => !v)}>
              <input type="checkbox" checked={flagged} onChange={() => setFlagged(v => !v)} style={{ width: 18, height: 18, accentColor: '#b83232', cursor: 'pointer' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: flagged ? '#b83232' : '#0f0f0f' }}>🚩 Flag this entry</div>
                <div style={{ fontSize: 11, color: flagged ? '#b83232' : '#9e9d99' }}>Mark for follow-up — owner visit, safety issue, delay, dispute</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !workCompleted.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: saving ? 'not-allowed' : 'pointer', border: 'none', background: !workCompleted.trim() ? '#f1ede6' : '#0f0f0f', color: !workCompleted.trim() ? '#9e9d99' : 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save Log Entry'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          <button onClick={() => setFilterJob('all')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterJob === 'all' ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterJob === 'all' ? 'white' : 'transparent', color: filterJob === 'all' ? '#0f0f0f' : '#9e9d99', boxShadow: filterJob === 'all' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
            All Jobs
          </button>
          {jobs.map(j => (
            <button key={j.id} onClick={() => setFilterJob(j.id)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterJob === j.id ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterJob === j.id ? 'white' : 'transparent', color: filterJob === j.id ? '#0f0f0f' : '#9e9d99', boxShadow: filterJob === j.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {j.title.slice(0, 20)}{j.title.length > 20 ? '…' : ''}
            </button>
          ))}
        </div>
        <button onClick={() => setFilterFlag(v => !v)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterFlag ? 700 : 500, borderRadius: 9, border: `1.5px solid ${filterFlag ? '#b83232' : 'rgba(0,0,0,0.1)'}`, background: filterFlag ? '#fdf0f0' : 'white', color: filterFlag ? '#b83232' : '#6b6a66', cursor: 'pointer', fontFamily: 'inherit' }}>
          🚩 Flagged only
        </button>
      </div>

      {/* LOG ENTRIES */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📓</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{logs.length === 0 ? 'No log entries yet' : 'No results'}</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Daily logs protect you when owners dispute work or inspectors ask questions</div>
          {logs.length === 0 && <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Entry</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(log => {
            const job = jobs.find(j => j.id === log.job_id)
            return (
              <div key={log.id} onClick={() => setSelected(log === selected ? null : log)} style={{ background: 'white', border: `1.5px solid ${log.flagged ? 'rgba(184,50,50,0.3)' : selected?.id === log.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected?.id === log.id ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Date block */}
                  <div style={{ width: 52, flexShrink: 0, textAlign: 'center', background: log.flagged ? '#fdf0f0' : isToday(parseISO(log.log_date)) ? '#0f0f0f' : '#f8f7f4', borderRadius: 10, padding: '8px 6px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: log.flagged ? '#b83232' : isToday(parseISO(log.log_date)) ? 'rgba(255,255,255,0.5)' : '#9e9d99', textTransform: 'uppercase' }}>
                      {format(parseISO(log.log_date), 'MMM')}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: log.flagged ? '#b83232' : isToday(parseISO(log.log_date)) ? 'white' : '#0f0f0f', lineHeight: 1.1 }}>
                      {format(parseISO(log.log_date), 'd')}
                    </div>
                    <div style={{ fontSize: 10, color: log.flagged ? '#b83232' : isToday(parseISO(log.log_date)) ? 'rgba(255,255,255,0.4)' : '#9e9d99' }}>
                      {format(parseISO(log.log_date), 'EEE')}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {log.flagged && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf0f0', color: '#b83232' }}>🚩 Flagged</span>}
                      {job && <span style={{ fontSize: 12, fontWeight: 600, color: '#0f0f0f' }}>{job.title}</span>}
                      {log.weather && <span style={{ fontSize: 12, color: '#9e9d99' }}>{log.weather}</span>}
                      {log.hours_worked && <span style={{ fontSize: 11, color: '#6b6a66', background: '#f1ede6', padding: '1px 8px', borderRadius: 20 }}>{log.hours_worked}h</span>}
                      {log.progress_percent && <span style={{ fontSize: 11, color: '#2d7a4f', background: '#edf5f0', padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>{log.progress_percent}% done</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#0f0f0f', lineHeight: 1.6, marginBottom: log.crew_present?.length > 0 ? 8 : 0 }}>
                      {log.work_completed.length > 150 ? `${log.work_completed.slice(0, 150)}...` : log.work_completed}
                    </div>
                    {log.crew_present?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {log.crew_present.map((c, i) => (
                          <span key={c} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4] + '15', color: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], fontWeight: 600 }}>{c}</span>
                        ))}
                      </div>
                    )}
                    {log.issues && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#b83232', background: '#fdf0f0', padding: '6px 10px', borderRadius: 7, borderLeft: '2px solid #b83232' }}>
                        ⚠️ {log.issues.length > 100 ? `${log.issues.slice(0, 100)}...` : log.issues}
                      </div>
                    )}
                    {log.ai_summary && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#0C447C', background: '#eef3fb', padding: '6px 10px', borderRadius: 7, borderLeft: '2px solid #1f5fa6' }}>
                        ✨ {log.ai_summary}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, color: '#9e9d99', marginBottom: 4 }}>{dateLabel(selected.log_date)} · {format(parseISO(selected.log_date), 'MMM d, yyyy')}</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{jobs.find(j => j.id === selected.job_id)?.title || 'General Log'}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99', flexShrink: 0 }}>×</button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
              {[
                { label: 'Hours', value: selected.hours_worked ? `${selected.hours_worked}h` : '—' },
                { label: 'Progress', value: selected.progress_percent ? `${selected.progress_percent}%` : '—' },
                { label: 'Weather', value: selected.weather || '—' },
              ].map(m => (
                <div key={m.label} style={{ background: '#f8f7f4', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Content sections */}
            {[
              { label: 'Work Completed', value: selected.work_completed, color: '#0f0f0f' },
              { label: 'Materials Used', value: selected.materials_used, color: '#6b6a66' },
              { label: 'Inspections', value: selected.inspections_today, color: '#1f5fa6' },
              { label: 'Issues / Problems', value: selected.issues, color: '#b83232', bg: '#fdf0f0' },
            ].filter(s => s.value).map(section => (
              <div key={section.label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{section.label}</div>
                <div style={{ fontSize: 13, color: section.color, lineHeight: 1.7, background: section.bg || '#f8f7f4', borderRadius: 9, padding: '10px 13px' }}>{section.value}</div>
              </div>
            ))}

            {/* Crew */}
            {selected.crew_present?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Crew Present ({selected.crew_present.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {selected.crew_present.map((c, i) => (
                    <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px 5px 6px', background: '#f8f7f4', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c[0]?.toUpperCase()}</div>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            <div style={{ marginBottom: 16 }}>
              {selected.ai_summary ? (
                <div style={{ padding: '12px 14px', background: '#eef3fb', borderRadius: 10, fontSize: 13, color: '#0C447C', borderLeft: '3px solid #1f5fa6', lineHeight: 1.7 }}>
                  ✨ <strong>AI Summary:</strong> {selected.ai_summary}
                </div>
              ) : (
                <button onClick={() => generateSummary(selected)} disabled={aiLoading} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: aiLoading ? 'not-allowed' : 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: aiLoading ? '#f8f7f4' : 'white', fontFamily: 'inherit', color: aiLoading ? '#9e9d99' : '#0f0f0f' }}>
                  {aiLoading ? '⚙️ Generating...' : '✨ Generate AI Summary'}
                </button>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleFlag(selected.id, selected.flagged)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: `1px solid ${selected.flagged ? 'rgba(184,50,50,0.2)' : 'rgba(0,0,0,0.1)'}`, background: selected.flagged ? '#fdf0f0' : 'white', color: selected.flagged ? '#b83232' : '#6b6a66', fontFamily: 'inherit' }}>
                {selected.flagged ? '🚩 Unflag' : '🚩 Flag Entry'}
              </button>
              <button onClick={() => deleteLog(selected.id)} style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 444 : 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

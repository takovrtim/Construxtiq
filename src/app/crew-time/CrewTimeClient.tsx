'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday } from 'date-fns'

interface TimeEntry {
  id: string
  project_id: string
  job_id: string | null
  worker_name: string
  worker_type: 'employee' | 'sub' | 'owner'
  work_date: string
  clock_in: string | null
  clock_out: string | null
  hours: number | null
  hourly_rate: number | null
  total_pay: number | null
  notes: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialEntries: TimeEntry[]
  jobs: { id: string; title: string; status: string }[]
  subs: { id: string; company_name: string; contact_name: string; trade: string }[]
}

function calcHours(clockIn: string, clockOut: string): number {
  const [inH, inM] = clockIn.split(':').map(Number)
  const [outH, outM] = clockOut.split(':').map(Number)
  return Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 10) / 10
}

export function CrewTimeClient({ user, project, initialEntries, jobs, subs }: Props) {
  const [entries, setEntries]     = useState<TimeEntry[]>(initialEntries)
  const [showAdd, setShowAdd]     = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [filterJob, setFilterJob] = useState('all')
  const [filterWorker, setFilterWorker] = useState('')

  // Form
  const [workerName, setWorkerName]   = useState('')
  const [workerType, setWorkerType]   = useState<TimeEntry['worker_type']>('employee')
  const [jobId, setJobId]             = useState(jobs[0]?.id || '')
  const [workDate, setWorkDate]       = useState(new Date().toISOString().split('T')[0])
  const [clockIn, setClockIn]         = useState('07:00')
  const [clockOut, setClockOut]       = useState('15:00')
  const [hourlyRate, setHourlyRate]   = useState('')
  const [notes, setNotes]             = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const hours = clockIn && clockOut ? calcHours(clockIn, clockOut) : 0
  const pay = hours * (parseFloat(hourlyRate) || 0)

  // Stats
  const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0)
  const totalPay = entries.reduce((s, e) => s + (e.total_pay || 0), 0)
  const todayEntries = entries.filter(e => isToday(parseISO(e.work_date)))
  const uniqueWorkers = [...new Set(entries.map(e => e.worker_name))]

  // Filter
  const filtered = entries
    .filter(e => filterJob === 'all' || e.job_id === filterJob)
    .filter(e => !filterWorker || e.worker_name.toLowerCase().includes(filterWorker.toLowerCase()))

  // Group by date
  const grouped = filtered.reduce((acc, e) => {
    const d = e.work_date
    if (!acc[d]) acc[d] = []
    acc[d].push(e)
    return acc
  }, {} as Record<string, TimeEntry[]>)

  async function addEntry(ev: React.FormEvent) {
    ev.preventDefault()
    if (!project || !workerName.trim()) return
    setSaving(true)
    const h = clockIn && clockOut ? calcHours(clockIn, clockOut) : null
    const rate = parseFloat(hourlyRate) || null
    const totalPay = h && rate ? Math.round(h * rate * 100) / 100 : null

    const { data, error } = await supabase.from('crew_time').insert({
      project_id: project.id, user_id: user.id,
      job_id: jobId || null,
      worker_name: workerName.trim(),
      worker_type: workerType,
      work_date: workDate,
      clock_in: clockIn || null,
      clock_out: clockOut || null,
      hours: h,
      hourly_rate: rate,
      total_pay: totalPay,
      notes: notes.trim() || null,
    }).select().single()

    if (!error && data) {
      setEntries(prev => [data as TimeEntry, ...prev])
      msg(`✓ ${workerName} — ${h}h logged`)
      setWorkerName(''); setNotes(''); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase.from('crew_time').delete().eq('id', id)
    if (!error) { setEntries(prev => prev.filter(e => e.id !== id)); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Crew Time</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Track hours per worker per job — know exactly what each job costs</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Log Time'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Hours', value: `${totalHours}h`, sub: 'across all jobs', accent: '' },
          { label: 'Total Labor Cost', value: `$${totalPay.toLocaleString()}`, sub: 'logged pay', accent: '' },
          { label: "Today's Entries", value: todayEntries.length, sub: 'workers logged', accent: todayEntries.length > 0 ? '#2d7a4f' : '' },
          { label: 'Crew Members', value: uniqueWorkers.length, sub: 'on this project', accent: '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Log Time Entry</div>
          <form onSubmit={addEntry} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Worker type */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['employee', 'sub', 'owner'] as const).map(t => (
                <button key={t} type="button" onClick={() => setWorkerType(t)} style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: workerType === t ? 700 : 400, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${workerType === t ? '#d95f2b' : 'rgba(0,0,0,0.1)'}`, background: workerType === t ? '#fdf0e8' : 'white', color: workerType === t ? '#d95f2b' : '#6b6a66', textTransform: 'capitalize' }}>
                  {t === 'employee' ? '👷 Employee' : t === 'sub' ? '🔧 Subcontractor' : '👤 Owner'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Worker Name *</label>
                <input style={inp} placeholder="John Martinez" value={workerName} onChange={e => setWorkerName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={lbl}>Job</label>
                <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" style={inp} value={workDate} onChange={e => setWorkDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label style={lbl}>Hourly Rate ($)</label>
                <input type="number" style={inp} placeholder="45" min="0" step="0.5" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Clock In</label>
                <input type="time" style={inp} value={clockIn} onChange={e => setClockIn(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Clock Out</label>
                <input type="time" style={inp} value={clockOut} onChange={e => setClockOut(e.target.value)} />
              </div>
            </div>

            {/* Live preview */}
            {hours > 0 && (
              <div style={{ background: '#0f0f0f', borderRadius: 10, padding: '14px 18px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Time Summary</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{hours} hours</div>
                </div>
                {pay > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Pay</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#d95f2b' }}>${pay.toLocaleString()}</div>
                  </div>
                )}
              </div>
            )}

            {hours > 8 && (
              <div style={{ padding: '10px 14px', background: '#fdf4e3', borderRadius: 9, fontSize: 13, color: '#6b4010', borderLeft: '3px solid #b06e1a' }}>
                ⚠️ {hours} hours — this worker is in overtime territory
              </div>
            )}

            <div>
              <label style={lbl}>Notes</label>
              <input style={inp} placeholder="What did they work on?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving || !workerName.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Log Time'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          <button onClick={() => setFilterJob('all')} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterJob === 'all' ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterJob === 'all' ? 'white' : 'transparent', color: filterJob === 'all' ? '#0f0f0f' : '#9e9d99', boxShadow: filterJob === 'all' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>All Jobs</button>
          {jobs.map(j => (
            <button key={j.id} onClick={() => setFilterJob(j.id)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterJob === j.id ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterJob === j.id ? 'white' : 'transparent', color: filterJob === j.id ? '#0f0f0f' : '#9e9d99', boxShadow: filterJob === j.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {j.title.slice(0, 18)}{j.title.length > 18 ? '…' : ''}
            </button>
          ))}
        </div>
        <input style={{ ...inp, width: 180, padding: '7px 12px' }} placeholder="🔍 Search worker..." value={filterWorker} onChange={e => setFilterWorker(e.target.value)} />
      </div>

      {/* WORKER SUMMARY */}
      {uniqueWorkers.length > 0 && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Worker Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {uniqueWorkers.map((worker, i) => {
              const workerEntries = filtered.filter(e => e.worker_name === worker)
              const workerHours = workerEntries.reduce((s, e) => s + (e.hours || 0), 0)
              const workerPay = workerEntries.reduce((s, e) => s + (e.total_pay || 0), 0)
              return (
                <div key={worker} style={{ background: '#f8f7f4', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{worker[0]?.toUpperCase()}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{worker}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b6a66' }}>{workerHours}h total</div>
                  {workerPay > 0 && <div style={{ fontSize: 12, color: '#d95f2b', fontWeight: 600 }}>${workerPay.toLocaleString()}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* TIME ENTRIES BY DATE */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⏱️</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No time entries yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Track crew hours to know exactly what each job costs</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Entry</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([date, dayEntries]) => {
            const dayHours = dayEntries.reduce((s, e) => s + (e.hours || 0), 0)
            const dayPay = dayEntries.reduce((s, e) => s + (e.total_pay || 0), 0)
            const isToday_ = isToday(parseISO(date))
            return (
              <div key={date}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isToday_ ? '#d95f2b' : '#0f0f0f' }}>
                      {isToday_ ? 'Today' : format(parseISO(date), 'EEEE, MMM d')}
                    </div>
                    {isToday_ && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf0e8', color: '#d95f2b' }}>TODAY</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#9e9d99' }}>{dayHours}h · {dayEntries.length} workers{dayPay > 0 ? ` · $${dayPay.toLocaleString()}` : ''}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {dayEntries.map(entry => {
                    const job = jobs.find(j => j.id === entry.job_id)
                    const overtime = (entry.hours || 0) > 8
                    return (
                      <div key={entry.id} style={{ background: 'white', border: `1px solid ${overtime ? 'rgba(176,110,26,0.3)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: entry.worker_type === 'sub' ? '#eef3fb' : entry.worker_type === 'owner' ? '#EEEDFE' : '#f1ede6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                          {entry.worker_type === 'sub' ? '🔧' : entry.worker_type === 'owner' ? '👤' : '👷'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 700 }}>{entry.worker_name}</span>
                            {overtime && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fdf4e3', color: '#6b4010' }}>⚠️ OT</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#9e9d99' }}>
                            {entry.clock_in && entry.clock_out ? `${entry.clock_in} – ${entry.clock_out}` : ''}
                            {job ? ` · ${job.title}` : ''}
                            {entry.notes ? ` · ${entry.notes}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>{entry.hours}h</div>
                          {entry.total_pay && <div style={{ fontSize: 12, color: '#2d7a4f', fontWeight: 600 }}>${entry.total_pay.toLocaleString()}</div>}
                        </div>
                        <button onClick={() => deleteEntry(entry.id)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9e9d99', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.background = '#fdf0f0'; e.currentTarget.style.color = '#b83232' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9e9d99' }}>×</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

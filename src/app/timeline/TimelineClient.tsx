'use client'

import { useState } from 'react'
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend } from 'date-fns'
import Link from 'next/link'

interface Job {
  id: string; title: string; client_name: string; status: string
  job_type: string; created_at: string; start_date?: string; end_date?: string
  permit_number?: string; contract_value?: number
}
interface Inspection { id: string; title: string; scheduled_date: string; status: string; job_id: string | null }
interface ChangeOrder { id: string; title: string; status: string; time_impact_days: number; created_at: string }
interface Props { project: any; jobs: Job[]; inspections: Inspection[]; changes: ChangeOrder[] }

const STATUS_COLORS: Record<string, string> = {
  pending: '#9e9d99', pending_permit: '#b06e1a', permit_approved: '#1f5fa6',
  in_progress: '#d95f2b', inspection: '#7F77DD', completed: '#2d7a4f', on_hold: '#b83232',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', pending_permit: 'Permit Pending', permit_approved: 'Permit Approved',
  in_progress: 'In Progress', inspection: 'Inspection', completed: 'Completed', on_hold: 'On Hold',
}

export function TimelineClient({ project, jobs, inspections, changes }: Props) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selected, setSelected]   = useState<any>(null)
  const [view, setView]           = useState<'gantt' | 'calendar' | 'pipeline'>('gantt')

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  const today = new Date()
  const monthStart = startOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(viewMonth) })
  const totalDelayDays = changes.filter(c => c.status !== 'rejected').reduce((s, c) => s + (c.time_impact_days || 0), 0)

  const ganttBars = jobs.map(job => {
    const start = job.start_date ? parseISO(job.start_date) : parseISO(job.created_at)
    const end = job.end_date ? parseISO(job.end_date) : addDays(start, 30)
    const startDay = differenceInDays(start, monthStart)
    const endDay = differenceInDays(end, monthStart)
    const clampedStart = Math.max(0, startDay)
    const clampedEnd = Math.min(days.length - 1, endDay)
    const width = Math.max(1, clampedEnd - clampedStart + 1)
    return { job, startDay: clampedStart, width, color: STATUS_COLORS[job.status] || '#9e9d99', visible: endDay >= 0 && startDay <= days.length - 1 }
  })

  function prevMonth() { setViewMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()-1); return n }) }
  function nextMonth() { setViewMonth(d => { const n = new Date(d); n.setMonth(n.getMonth()+1); return n }) }

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Timeline</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Gantt view, calendar, and job pipeline</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 3 }}>
            {(['gantt','calendar','pipeline'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: view===v?700:500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: view===v?'white':'transparent', color: view===v?'#0f0f0f':'#9e9d99', boxShadow: view===v?'0 1px 4px rgba(0,0,0,0.08)':'none', textTransform: 'capitalize' }}>{v}</button>
            ))}
          </div>
          <button onClick={prevMonth} style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>←</button>
          <button onClick={() => setViewMonth(new Date())} style={{ padding: '7px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit', fontWeight: 600 }}>Today</button>
          <button onClick={nextMonth} style={{ padding: '7px 12px', fontSize: 13, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit' }}>→</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Jobs', value: jobs.filter(j=>!['completed','cancelled'].includes(j.status)).length, sub: 'in progress', accent: '#1f5fa6' },
          { label: 'Inspections', value: inspections.filter(i=>i.status==='scheduled').length, sub: 'scheduled', accent: '#7F77DD' },
          { label: 'Delay Days', value: totalDelayDays, sub: 'from changes', accent: totalDelayDays>0?'#b83232':'' },
          { label: 'Completed', value: jobs.filter(j=>j.status==='completed').length, sub: 'jobs done', accent: '#2d7a4f' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent||'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-1px', color: s.accent||'#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent||'#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* DELAY ALERT */}
      {totalDelayDays > 0 && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '13px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>+{totalDelayDays} days of delays from change orders</div><div style={{ fontSize: 11, color: '#b06e1a' }}>{changes.filter(c=>c.time_impact_days>0&&c.status!=='rejected').length} changes are pushing your timeline</div></div>
          <Link href="/changes" style={{ fontSize: 11, fontWeight: 700, color: '#b06e1a', textDecoration: 'none', padding: '5px 11px', background: 'rgba(176,110,26,0.1)', borderRadius: 7 }}>View →</Link>
        </div>
      )}

      {/* GANTT */}
      {view === 'gantt' && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{format(viewMonth, 'MMMM yyyy')}</div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
              {[['#d95f2b','In Progress'],['#b06e1a','Permit Pending'],['#7F77DD','Inspection'],['#2d7a4f','Completed']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: c }} /><span style={{ color: '#9e9d99' }}>{l}</span></div>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 700 }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ width: 200, flexShrink: 0, padding: '7px 16px', fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Job</div>
                <div style={{ flex: 1, display: 'flex' }}>
                  {days.map((day, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', padding: '5px 0', fontSize: 9, fontWeight: isToday(day)?800:500, color: isToday(day)?'#d95f2b':isWeekend(day)?'#9e9d99':'#9e9d99', background: isToday(day)?'rgba(217,95,43,0.05)':'transparent', borderLeft: i>0?'1px solid rgba(0,0,0,0.04)':'none' }}>
                      {format(day,'d')}
                    </div>
                  ))}
                </div>
              </div>
              {jobs.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9e9d99', fontSize: 13 }}>No jobs yet — <Link href="/jobs" style={{ color: '#d95f2b', textDecoration: 'none', fontWeight: 600 }}>add jobs →</Link></div>
              ) : ganttBars.map(({ job, startDay, width, color, visible }) => (
                <div key={job.id} style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.04)', minHeight: 42, alignItems: 'center' }}>
                  <div style={{ width: 200, flexShrink: 0, padding: '8px 16px', cursor: 'pointer' }} onClick={() => setSelected({ type: 'job', data: job })}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                    <div style={{ fontSize: 10, color: '#9e9d99' }}>{job.client_name||'—'}</div>
                  </div>
                  <div style={{ flex: 1, position: 'relative', height: 42, display: 'flex', alignItems: 'center' }}>
                    {days.some(d => isToday(d)) && (
                      <div style={{ position: 'absolute', left: `${(differenceInDays(today, monthStart)/days.length)*100}%`, top: 0, bottom: 0, width: 2, background: 'rgba(217,95,43,0.5)', zIndex: 2 }} />
                    )}
                    {days.map((day,i) => isWeekend(day) && (
                      <div key={i} style={{ position: 'absolute', left: `${(i/days.length)*100}%`, width: `${(1/days.length)*100}%`, top: 0, bottom: 0, background: 'rgba(0,0,0,0.02)' }} />
                    ))}
                    {visible && (
                      <div onClick={() => setSelected({ type: 'job', data: job })} style={{ position: 'absolute', left: `${(startDay/days.length)*100}%`, width: `${(Math.min(width, days.length-startDay)/days.length)*100}%`, height: 24, background: color, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</span>
                      </div>
                    )}
                    {inspections.filter(i=>i.job_id===job.id).map(insp => {
                      const inspDay = differenceInDays(parseISO(insp.scheduled_date), monthStart)
                      if (inspDay<0||inspDay>=days.length) return null
                      return <div key={insp.id} style={{ position: 'absolute', left: `${(inspDay/days.length)*100}%`, width: 12, height: 12, background: insp.status==='passed'?'#2d7a4f':'#7F77DD', borderRadius: '50%', transform: 'translateX(-50%)', zIndex: 3, border: '2px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} title={insp.title} />
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR */}
      {view === 'calendar' && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{format(viewMonth,'MMMM yyyy')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3, marginBottom: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#9e9d99', padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {Array.from({ length: monthStart.getDay() }).map((_,i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const dayStr = format(day,'yyyy-MM-dd')
              const dayInspections = inspections.filter(i=>i.scheduled_date===dayStr)
              const today_ = isToday(day)
              return (
                <div key={day.toISOString()} style={{ minHeight: 68, borderRadius: 8, padding: '5px 6px', background: today_?'#0f0f0f':isWeekend(day)?'#f8f7f4':'white', border: `1px solid ${today_?'#0f0f0f':'rgba(0,0,0,0.06)'}` }}>
                  <div style={{ fontSize: 12, fontWeight: today_?800:500, color: today_?'white':isWeekend(day)?'#9e9d99':'#0f0f0f', marginBottom: 3 }}>{format(day,'d')}</div>
                  {dayInspections.map(insp => (
                    <div key={insp.id} onClick={() => setSelected({ type: 'inspection', data: insp })} style={{ fontSize: 9, fontWeight: 700, background: insp.status==='passed'?'#2d7a4f':'#7F77DD', color: 'white', borderRadius: 3, padding: '2px 4px', marginBottom: 2, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🔍 {insp.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* PIPELINE */}
      {view === 'pipeline' && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Job Pipeline</div>
          {jobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#9e9d99', fontSize: 13 }}>No jobs — <Link href="/jobs" style={{ color: '#d95f2b', textDecoration: 'none', fontWeight: 600 }}>add jobs →</Link></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map(job => {
                const color = STATUS_COLORS[job.status] || '#9e9d99'
                const jobInspections = inspections.filter(i => i.job_id === job.id)
                return (
                  <div key={job.id} onClick={() => setSelected({ type: 'job', data: job })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', background: '#f8f7f4' }}>
                    <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{job.title}</span>
                        {job.permit_number && <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, background: '#131A26', padding: '1px 6px', borderRadius: 4, color: '#6b6a66' }}>{job.permit_number}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#9e9d99', marginBottom: jobInspections.length>0?5:0 }}>{job.client_name||'—'} · {format(parseISO(job.created_at),'MMM d')}</div>
                      {jobInspections.length > 0 && (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {jobInspections.map(i => <span key={i.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: i.status==='passed'?'#edf5f0':'#EEEDFE', color: i.status==='passed'?'#1a4d31':'#26215C' }}>🔍 {i.title}</span>)}
                        </div>
                      )}
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${color}20`, color }}>{STATUS_LABELS[job.status]||job.status}</span>
                      {job.contract_value && <div style={{ fontSize: 12, fontWeight: 700, color: '#2d7a4f', marginTop: 4 }}>${Number(job.contract_value).toLocaleString()}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* DELAY IMPACT */}
      {changes.filter(c=>c.time_impact_days>0&&c.status!=='rejected').length > 0 && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>⚠️ Delay Impact</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b83232', background: '#fdf0f0', padding: '3px 10px', borderRadius: 20 }}>+{totalDelayDays} days total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {changes.filter(c=>c.time_impact_days>0&&c.status!=='rejected').map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fdf4e3', borderRadius: 10, borderLeft: '3px solid #b06e1a' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6b4010' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#b06e1a', marginTop: 1 }}>{format(parseISO(c.created_at),'MMM d, yyyy')} · {c.status}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#b83232' }}>+{c.time_impact_days}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: '#131A26', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-16px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{selected.type}</div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, color: '#9e9d99' }}>×</button>
            </div>
            {selected.type === 'job' && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{selected.data.title}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[selected.data.status]||'#9e9d99'}20`, color: STATUS_COLORS[selected.data.status]||'#9e9d99', display: 'inline-block', marginBottom: 16 }}>{STATUS_LABELS[selected.data.status]||selected.data.status}</span>
                <div style={{ background: '#f8f7f4', borderRadius: 12, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div><span style={{ color: '#9e9d99' }}>Client </span><span style={{ fontWeight: 600 }}>{selected.data.client_name||'—'}</span></div>
                  {selected.data.permit_number && <div><span style={{ color: '#9e9d99' }}>Permit </span><span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selected.data.permit_number}</span></div>}
                  {selected.data.contract_value && <div><span style={{ color: '#9e9d99' }}>Value </span><span style={{ fontWeight: 700, color: '#2d7a4f' }}>${Number(selected.data.contract_value).toLocaleString()}</span></div>}
                  <div><span style={{ color: '#9e9d99' }}>Added </span>{format(parseISO(selected.data.created_at),'MMMM d, yyyy')}</div>
                </div>
                <Link href="/jobs" style={{ display: 'block', marginTop: 16, padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, textAlign: 'center', background: '#131A26', color: 'white', textDecoration: 'none' }}>Open Job Board →</Link>
              </>
            )}
            {selected.type === 'inspection' && (
              <>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{selected.data.title}</div>
                <div style={{ background: '#f8f7f4', borderRadius: 12, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div><span style={{ color: '#9e9d99' }}>Date </span><strong>{format(parseISO(selected.data.scheduled_date),'MMMM d, yyyy')}</strong></div>
                  <div><span style={{ color: '#9e9d99' }}>Status </span>{selected.data.status}</div>
                </div>
                <Link href="/inspections" style={{ display: 'block', marginTop: 16, padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, textAlign: 'center', background: '#131A26', color: 'white', textDecoration: 'none' }}>View Inspections →</Link>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}

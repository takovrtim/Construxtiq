'use client'

import { useState } from 'react'
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isWeekend } from 'date-fns'

interface Job {
  id: string
  title: string
  client_name: string
  status: string
  job_type: string
  created_at: string
  permit_number?: string
}

interface Inspection {
  id: string
  title: string
  scheduled_date: string
  status: string
  job_id: string | null
}

interface ChangeOrder {
  id: string
  title: string
  status: string
  time_impact_days: number
  created_at: string
}

interface Props {
  project: any
  jobs: Job[]
  inspections: Inspection[]
  changes: ChangeOrder[]
}

const STATUS_COLORS: Record<string, string> = {
  pending_permit: '#EF9F27',
  permit_approved: '#639922',
  in_progress: '#378ADD',
  inspection: '#7F77DD',
  completed: '#9e9d99',
}

const TYPE_ICON: Record<string, string> = { electrical: '⚡', plumbing: '🔧', both: '⚡🔧' }

export function TimelineClient({ project, jobs, inspections, changes }: Props) {
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selectedItem, setSelectedItem] = useState<any>(null)

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#6b6a66' }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'block', marginTop: 8 }}>Create a project first →</a>
    </div>
  )

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const totalDelayDays = changes
    .filter(c => c.status !== 'rejected')
    .reduce((s, c) => s + (c.time_impact_days || 0), 0)

  const activeJobs = jobs.filter(j => j.status !== 'completed').length
  const upcomingInspections = inspections.filter(i => i.status === 'scheduled').length

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Timeline</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Visual overview of all jobs, inspections, and delays</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setViewMonth(d => addDays(startOfMonth(d), -1))} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>← Prev</button>
          <button onClick={() => setViewMonth(new Date())} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit', fontWeight: 600 }}>Today</button>
          <button onClick={() => setViewMonth(d => addDays(endOfMonth(d), 1))} style={{ padding: '8px 14px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Next →</button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Jobs', value: activeJobs, sub: 'in progress', accent: '#1f5fa6' },
          { label: 'Inspections', value: upcomingInspections, sub: 'scheduled', accent: '#7F77DD' },
          { label: 'Delay Days', value: totalDelayDays, sub: 'from change orders', accent: totalDelayDays > 0 ? '#b83232' : '' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'completed').length, sub: 'jobs done', accent: '#2d7a4f' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* MONTH HEADER */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 20 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{format(viewMonth, 'MMMM yyyy')}</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            {[
              { color: '#378ADD', label: 'In Progress' },
              { color: '#EF9F27', label: 'Permit Pending' },
              { color: '#7F77DD', label: 'Inspection' },
              { color: '#2d7a4f', label: 'Completed' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                <span style={{ color: '#6b6a66' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9e9d99', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
            ))}
          </div>
          {/* Fill empty days before month start */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const dayInspections = inspections.filter(i => i.scheduled_date === format(day, 'yyyy-MM-dd'))
              const today = isToday(day)
              const weekend = isWeekend(day)
              return (
                <div key={day.toISOString()} style={{ minHeight: 72, borderRadius: 8, padding: 4, background: today ? '#0f0f0f' : weekend ? '#f8f7f4' : 'white', border: `1px solid ${today ? '#0f0f0f' : 'rgba(0,0,0,0.06)'}`, position: 'relative' }}>
                  <div style={{ fontSize: 12, fontWeight: today ? 800 : 500, color: today ? 'white' : weekend ? '#9e9d99' : '#0f0f0f', marginBottom: 3 }}>{format(day, 'd')}</div>
                  {dayInspections.map(insp => (
                    <div key={insp.id} onClick={() => setSelectedItem({ type: 'inspection', data: insp })} style={{ fontSize: 9, fontWeight: 700, background: insp.status === 'passed' ? '#2d7a4f' : '#7F77DD', color: 'white', borderRadius: 3, padding: '1px 4px', marginBottom: 2, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🔍 {insp.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* JOB PIPELINE TIMELINE */}
      <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Job Pipeline</div>
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9e9d99', fontSize: 13 }}>No jobs yet — add jobs on the Job Board</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(job => {
              const color = STATUS_COLORS[job.status] || '#9e9d99'
              const jobInspections = inspections.filter(i => i.job_id === job.id)
              const jobChanges = changes.filter(c => c.status !== 'rejected')
              return (
                <div key={job.id} onClick={() => setSelectedItem({ type: 'job', data: job })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 11, border: '1px solid rgba(0,0,0,0.07)', cursor: 'pointer', background: '#f8f7f4' }}>
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{job.title}</span>
                      <span style={{ fontSize: 13 }}>{TYPE_ICON[job.job_type]}</span>
                      {job.permit_number && <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, background: 'white', padding: '1px 7px', borderRadius: 4, color: '#6b6a66' }}>{job.permit_number}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>{job.client_name} · Added {format(parseISO(job.created_at), 'MMM d')}</div>
                    {jobInspections.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        {jobInspections.map(i => (
                          <span key={i.id} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: i.status === 'passed' ? '#edf5f0' : i.status === 'failed' ? '#fdf0f0' : '#EEEDFE', color: i.status === 'passed' ? '#1a4d31' : i.status === 'failed' ? '#6e1a1a' : '#26215C' }}>
                            🔍 {i.title} — {format(parseISO(i.scheduled_date), 'MMM d')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: `${color}20`, color }}>{job.status.replace('_', ' ')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* DELAY IMPACT */}
      {changes.filter(c => c.time_impact_days > 0 && c.status !== 'rejected').length > 0 && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>⚠️ Delay Impact from Change Orders</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#b83232', background: '#fdf0f0', padding: '4px 12px', borderRadius: 20 }}>+{totalDelayDays} days total</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {changes.filter(c => c.time_impact_days > 0 && c.status !== 'rejected').map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fdf4e3', borderRadius: 9, borderLeft: '3px solid #b06e1a' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6b4010' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#b06e1a', marginTop: 2 }}>Added {format(parseISO(c.created_at), 'MMM d, yyyy')}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#b83232' }}>+{c.time_impact_days}d</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL PANEL */}
      {selectedItem && (
        <>
          <div onClick={() => setSelectedItem(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase' }}>{selectedItem.type}</div>
              <button onClick={() => setSelectedItem(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>×</button>
            </div>
            {selectedItem.type === 'job' && (
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{selectedItem.data.title}</div>
                <div style={{ background: '#f8f7f4', borderRadius: 10, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><span style={{ color: '#9e9d99' }}>Client: </span>{selectedItem.data.client_name}</div>
                  <div><span style={{ color: '#9e9d99' }}>Type: </span>{TYPE_ICON[selectedItem.data.job_type]} {selectedItem.data.job_type}</div>
                  <div><span style={{ color: '#9e9d99' }}>Status: </span><span style={{ fontWeight: 600, color: STATUS_COLORS[selectedItem.data.status] }}>{selectedItem.data.status.replace('_', ' ')}</span></div>
                  {selectedItem.data.permit_number && <div><span style={{ color: '#9e9d99' }}>Permit: </span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedItem.data.permit_number}</span></div>}
                  <div><span style={{ color: '#9e9d99' }}>Added: </span>{format(parseISO(selectedItem.data.created_at), 'MMM d, yyyy')}</div>
                </div>
              </div>
            )}
            {selectedItem.type === 'inspection' && (
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{selectedItem.data.title}</div>
                <div style={{ background: '#f8f7f4', borderRadius: 10, padding: 14, fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div><span style={{ color: '#9e9d99' }}>Date: </span><strong>{format(parseISO(selectedItem.data.scheduled_date), 'MMMM d, yyyy')}</strong></div>
                  <div><span style={{ color: '#9e9d99' }}>Status: </span>{selectedItem.data.status}</div>
                  {selectedItem.data.inspector_name && <div><span style={{ color: '#9e9d99' }}>Inspector: </span>{selectedItem.data.inspector_name}</div>}
                </div>
              </div>
            )}
            <a href="/jobs" style={{ display: 'block', marginTop: 16, padding: '11px', fontSize: 13, fontWeight: 600, borderRadius: 9, textAlign: 'center', background: '#0f0f0f', color: 'white', textDecoration: 'none' }}>
              Open Job Board →
            </a>
          </div>
        </>
      )}
    </>
  )
}

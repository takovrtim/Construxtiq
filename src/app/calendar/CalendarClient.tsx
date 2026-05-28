'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO, differenceInDays, isWeekend } from 'date-fns'

interface CalEvent {
  id: string
  title: string
  date: Date
  type: 'permit_expiry' | 'inspection' | 'job_start' | 'job_end' | 'change' | 'custom'
}

const TYPE_CONFIG = {
  permit_expiry: { color: '#b83232', bg: '#fdf0f0', label: 'Permit Expiry',   dot: '#b83232' },
  inspection:    { color: '#7F77DD', bg: '#EEEDFE', label: 'Inspection',       dot: '#7F77DD' },
  job_start:     { color: '#1f5fa6', bg: '#eef3fb', label: 'Job Start',        dot: '#1f5fa6' },
  job_end:       { color: '#2d7a4f', bg: '#edf5f0', label: 'Job End',          dot: '#2d7a4f' },
  change:        { color: '#b06e1a', bg: '#fdf4e3', label: 'Change Order',     dot: '#b06e1a' },
  custom:        { color: '#F1EEE5', bg: '#f1ede6', label: 'Event',            dot: '#0f0f0f' },
}

interface Props {
  user: any; project: any
  permits: any[]; inspections: any[]; jobs: any[]; changes: any[]
}

export function CalendarClient({ user, project, permits, inspections, jobs, changes }: Props) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected]         = useState<Date | null>(null)
  const [showAdd, setShowAdd]           = useState(false)
  const [newTitle, setNewTitle]         = useState('')
  const [newDate, setNewDate]           = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newType, setNewType]           = useState<CalEvent['type']>('custom')
  const [customEvents, setCustomEvents] = useState<CalEvent[]>([])

  // Build events from all data sources
  const dataEvents: CalEvent[] = [
    ...permits.filter(p => p.expiry_date).map(p => ({
      id: `permit-${p.id}`,
      title: `Permit ${p.permit_number} expires`,
      date: parseISO(p.expiry_date),
      type: 'permit_expiry' as const,
    })),
    ...inspections.filter(i => i.scheduled_date).map(i => ({
      id: `insp-${i.id}`,
      title: i.title || i.inspection_type || 'Inspection',
      date: parseISO(i.scheduled_date),
      type: 'inspection' as const,
    })),
    ...jobs.filter(j => j.start_date).map(j => ({
      id: `job-start-${j.id}`,
      title: `${j.title} starts`,
      date: parseISO(j.start_date),
      type: 'job_start' as const,
    })),
    ...jobs.filter(j => j.end_date).map(j => ({
      id: `job-end-${j.id}`,
      title: `${j.title} ends`,
      date: parseISO(j.end_date),
      type: 'job_end' as const,
    })),
    ...changes.filter(c => c.created_at).map(c => ({
      id: `change-${c.id}`,
      title: `Change: ${c.title}`,
      date: parseISO(c.created_at),
      type: 'change' as const,
    })),
    ...customEvents,
  ]

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = startOfMonth(currentMonth).getDay()

  function getEventsForDay(day: Date) {
    return dataEvents.filter(e => isSameDay(e.date, day))
  }

  function addCustomEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCustomEvents(prev => [...prev, { id: Date.now().toString(), title: newTitle.trim(), date: parseISO(newDate), type: newType }])
    setNewTitle(''); setShowAdd(false)
  }

  const selectedEvents = selected ? getEventsForDay(selected) : []
  const upcoming = dataEvents
    .filter(e => differenceInDays(e.date, today) >= 0 && differenceInDays(e.date, today) <= 30)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Calendar</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Permits, inspections, jobs — all in one view</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'This Month', value: dataEvents.filter(e => e.date.getMonth() === currentMonth.getMonth() && e.date.getFullYear() === currentMonth.getFullYear()).length, accent: '' },
          { label: 'Permit Expiries', value: dataEvents.filter(e => e.type === 'permit_expiry' && differenceInDays(e.date, today) >= 0 && differenceInDays(e.date, today) <= 30).length, accent: '#b83232' },
          { label: 'Inspections', value: dataEvents.filter(e => e.type === 'inspection' && differenceInDays(e.date, today) >= 0 && differenceInDays(e.date, today) <= 30).length, accent: '#7F77DD' },
          { label: 'Upcoming (30d)', value: upcoming.length, accent: '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent || 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add Event */}
      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <form onSubmit={addCustomEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px auto', gap: 10, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title *</label>
              <input style={inp} placeholder="Inspection at Johnson site" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date</label>
              <input type="date" style={inp} value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Type</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={newType} onChange={e => setNewType(e.target.value as CalEvent['type'])}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <button type="submit" style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#131A26', color: 'white', fontFamily: 'inherit' }}>Add</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* CALENDAR GRID */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>‹</button>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>{format(currentMonth, 'MMMM yyyy')}</div>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} />)}
            {days.map(day => {
              const dayEvs   = getEventsForDay(day)
              const isSel    = selected && isSameDay(day, selected)
              const isToday_ = isToday(day)
              const isWknd   = isWeekend(day)

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelected(isSel ? null : day)}
                  style={{
                    minHeight: 58,
                    padding: '5px 5px 3px',
                    borderRadius: 9,
                    cursor: 'pointer',
                    background: isSel ? '#0f0f0f' : isToday_ ? 'rgba(217,95,43,0.1)' : isWknd ? 'rgba(0,0,0,0.02)' : 'transparent',
                    border: `1px solid ${isSel ? '#0f0f0f' : isToday_ ? 'rgba(217,95,43,0.3)' : dayEvs.length > 0 ? 'var(--border)' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: isToday_ ? 800 : 400, color: isSel ? 'white' : isToday_ ? '#d95f2b' : isWknd ? 'var(--text-tertiary)' : 'var(--text-primary)', marginBottom: 3 }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {dayEvs.slice(0, 2).map(ev => {
                      const cfg = TYPE_CONFIG[ev.type]
                      return (
                        <div key={ev.id} style={{ fontSize: 8, fontWeight: 600, padding: '1px 4px', borderRadius: 3, background: isSel ? 'rgba(255,255,255,0.15)' : cfg.bg, color: isSel ? 'white' : cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </div>
                      )
                    })}
                    {dayEvs.length > 2 && <div style={{ fontSize: 8, color: isSel ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)', paddingLeft: 4 }}>+{dayEvs.length - 2} more</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected day detail */}
          {selected && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{format(selected, 'EEEE, MMMM d')}</div>
              {selectedEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  Nothing scheduled —{' '}
                  <button onClick={() => { setNewDate(format(selected, 'yyyy-MM-dd')); setShowAdd(true) }} style={{ background: 'none', border: 'none', color: '#d95f2b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700 }}>Add event →</button>
                </div>
              ) : selectedEvents.map(ev => {
                const cfg = TYPE_CONFIG[ev.type]
                return (
                  <div key={ev.id} style={{ padding: '10px 12px', borderRadius: 9, background: cfg.bg, marginBottom: 6, borderLeft: `3px solid ${cfg.color}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7, marginTop: 2 }}>{cfg.label}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Today card */}
          <div style={{ background: '#131A26', borderRadius: 14, padding: '18px 20px', color: 'white', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>Today</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>{format(today, 'MMMM d')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{format(today, 'EEEE')}</div>
            {getEventsForDay(today).length === 0 ? (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No events today ✓</div>
            ) : getEventsForDay(today).map(ev => {
              const cfg = TYPE_CONFIG[ev.type]
              return (
                <div key={ev.id} style={{ fontSize: 11, fontWeight: 600, color: cfg.color, background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: '7px 10px', marginBottom: 5 }}>
                  {ev.title}
                </div>
              )
            })}
          </div>

          {/* Upcoming */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', flex: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflowY: 'auto', maxHeight: 320 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Next 30 Days</div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>Nothing scheduled</div>
            ) : upcoming.map(ev => {
              const cfg = TYPE_CONFIG[ev.type]
              const daysAway = differenceInDays(ev.date, today)
              return (
                <div key={ev.id} onClick={() => { setCurrentMonth(ev.date); setSelected(ev.date) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>{format(ev.date, 'd')}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: cfg.color, textTransform: 'uppercase' }}>{format(ev.date, 'MMM')}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                    <div style={{ fontSize: 10, color: daysAway <= 7 ? '#b83232' : 'var(--text-tertiary)', fontWeight: daysAway <= 7 ? 700 : 400, marginTop: 1 }}>
                      {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 3, background: v.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

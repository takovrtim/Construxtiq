'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, parseISO, differenceInDays } from 'date-fns'

interface Event {
  id: string
  title: string
  date: Date
  type: 'permit_expiry' | 'job_start' | 'inspection' | 'deadline' | 'custom'
  severity?: 'critical' | 'warning' | 'info'
  notes?: string
}

const TYPE_CONFIG = {
  permit_expiry: { color: '#b83232', bg: '#fdf0f0', label: 'Permit Expiry' },
  job_start:     { color: '#1f5fa6', bg: '#eef3fb', label: 'Job Start' },
  inspection:    { color: '#7F77DD', bg: '#EEEDFE', label: 'Inspection' },
  deadline:      { color: '#b06e1a', bg: '#fdf4e3', label: 'Deadline' },
  custom:        { color: '#2d7a4f', bg: '#edf5f0', label: 'Event' },
}

export function CalendarClient({ user, project, permits }: { user: any; project: any; permits: any[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [events, setEvents] = useState<Event[]>([
    ...permits
      .filter(p => p.expiry_date)
      .map(p => ({
        id: p.id,
        title: `Permit ${p.permit_number} expires`,
        date: parseISO(p.expiry_date),
        type: 'permit_expiry' as const,
        severity: differenceInDays(parseISO(p.expiry_date), new Date()) <= 7 ? 'critical' as const : 'warning' as const,
      })),
  ])

  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [newType, setNewType] = useState<Event['type']>('custom')

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = startOfMonth(currentMonth).getDay()

  function addEvent(e: React.FormEvent) {
    e.preventDefault()
    setEvents(prev => [...prev, {
      id: Date.now().toString(),
      title: newTitle,
      date: parseISO(newDate),
      type: newType,
    }])
    setNewTitle('')
    setShowAdd(false)
  }

  function getEventsForDay(day: Date) {
    return events.filter(e => isSameDay(e.date, day))
  }

  const selectedEvents = selected ? getEventsForDay(selected) : []
  const today = new Date()

  const upcoming = events
    .filter(e => differenceInDays(e.date, today) >= 0 && differenceInDays(e.date, today) <= 30)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Calendar</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Deadlines, permits, inspections — all in one place</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          + Add Event
        </button>
      </div>

      {/* Add Event Form */}
      {showAdd && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={addEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Event Title *</label>
              <input style={inputStyle} placeholder="Inspection at Johnson site" value={newTitle} onChange={e => setNewTitle(e.target.value)} required autoFocus />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Date *</label>
              <input type="date" style={inputStyle} value={newDate} onChange={e => setNewDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Type</label>
              <select style={{ ...inputStyle, background: 'var(--surface)' }} value={newType} onChange={e => setNewType(e.target.value as Event['type'])}>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>Add</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '9px 14px', fontSize: 13, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>✕</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        {/* CALENDAR */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>‹</button>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>{format(currentMonth, 'MMMM yyyy')}</div>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', padding: '4px 0', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const dayEvents = getEventsForDay(day)
              const isSelected = selected && isSameDay(day, selected)
              const isTodayDay = isToday(day)
              const hasEvents = dayEvents.length > 0
              const hasCritical = dayEvents.some(e => e.severity === 'critical' || e.type === 'permit_expiry')

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelected(isSameDay(day, selected!) ? null : day)}
                  style={{
                    minHeight: 52,
                    padding: '6px 6px 4px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? '#0f0f0f' : isTodayDay ? 'rgba(217,95,43,0.12)' : hasEvents ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${isSelected ? '#0f0f0f' : hasCritical ? '#b83232' : hasEvents ? 'var(--border-md)' : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: isTodayDay ? 700 : 500, color: isSelected ? 'white' : isTodayDay ? '#d95f2b' : 'var(--text-primary)', marginBottom: 3 }}>
                    {format(day, 'd')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {dayEvents.slice(0, 3).map(ev => {
                      const cfg = TYPE_CONFIG[ev.type]
                      return (
                        <div key={ev.id} style={{ width: '100%', fontSize: 9, fontWeight: 600, padding: '1px 4px', borderRadius: 3, background: isSelected ? 'rgba(255,255,255,0.15)' : cfg.bg, color: isSelected ? 'white' : cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && <div style={{ fontSize: 9, color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}>+{dayEvents.length - 3}</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Selected day events */}
          {selected && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>{format(selected, 'EEEE, MMMM d')}</div>
              {selectedEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>No events — <button onClick={() => { setNewDate(format(selected, 'yyyy-MM-dd')); setShowAdd(true) }} style={{ background: 'none', border: 'none', color: '#d95f2b', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600 }}>Add one →</button></div>
              ) : (
                selectedEvents.map(ev => {
                  const cfg = TYPE_CONFIG[ev.type]
                  return (
                    <div key={ev.id} style={{ padding: '10px 12px', borderRadius: 9, background: cfg.bg, marginBottom: 8, borderLeft: `3px solid ${cfg.color}` }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: cfg.color, opacity: 0.7, marginTop: 2 }}>{cfg.label}</div>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Today */}
          <div style={{ background: '#0f0f0f', borderRadius: 14, padding: 18, color: 'white' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>Today</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>{format(today, 'MMMM d')}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>{format(today, 'EEEE')}</div>
            {getEventsForDay(today).length === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>No events today ✓</div>
            ) : (
              getEventsForDay(today).map(ev => {
                const cfg = TYPE_CONFIG[ev.type]
                return (
                  <div key={ev.id} style={{ fontSize: 12, fontWeight: 600, color: cfg.color, background: 'rgba(255,255,255,0.06)', borderRadius: 7, padding: '8px 10px', marginBottom: 6 }}>
                    {ev.title}
                  </div>
                )
              })
            )}
          </div>

          {/* Next 30 Days */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, boxShadow: 'var(--shadow-sm)', flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, letterSpacing: '-0.2px', color: 'var(--text-primary)' }}>Next 30 Days</div>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>Nothing scheduled</div>
            ) : (
              upcoming.map(ev => {
                const cfg = TYPE_CONFIG[ev.type]
                const daysAway = differenceInDays(ev.date, today)
                return (
                  <div key={ev.id} onClick={() => { setCurrentMonth(ev.date); setSelected(ev.date) }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color, letterSpacing: '-0.5px', lineHeight: 1 }}>{format(ev.date, 'd')}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: cfg.color, letterSpacing: '0.2px', textTransform: 'uppercase' }}>{format(ev.date, 'MMM')}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{ev.title}</div>
                      <div style={{ fontSize: 11, color: daysAway <= 7 ? '#b83232' : 'var(--text-tertiary)', fontWeight: daysAway <= 7 ? 600 : 400, marginTop: 1 }}>
                        {daysAway === 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Legend */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Legend</div>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: v.color, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

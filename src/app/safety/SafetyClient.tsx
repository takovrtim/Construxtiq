'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, isToday } from 'date-fns'

interface ChecklistItem {
  id: string
  label: string
  checked: boolean
  category: string
}

interface SafetyChecklist {
  id: string
  project_id: string
  job_id: string | null
  job_date: string
  completed_by: string
  items: ChecklistItem[]
  all_clear: boolean
  notes: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialChecklists: SafetyChecklist[]
  jobs: { id: string; title: string }[]
}

const DEFAULT_ITEMS: Omit<ChecklistItem, 'id'>[] = [
  // Pre-work
  { label: 'Permit posted on site', category: 'Permits & Legal', checked: false },
  { label: 'Work area marked and secured', category: 'Site Setup', checked: false },
  { label: 'Emergency exits identified', category: 'Site Setup', checked: false },
  { label: 'First aid kit on site', category: 'Safety Equipment', checked: false },
  { label: 'Fire extinguisher accessible', category: 'Safety Equipment', checked: false },
  // PPE
  { label: 'Hard hats available for all crew', category: 'PPE', checked: false },
  { label: 'Safety glasses available', category: 'PPE', checked: false },
  { label: 'Work gloves available', category: 'PPE', checked: false },
  { label: 'Steel-toed boots required', category: 'PPE', checked: false },
  // Electrical specific
  { label: 'Power locked out / tagged out', category: 'Electrical', checked: false },
  { label: 'Voltage tested before work begins', category: 'Electrical', checked: false },
  { label: 'GFCIs in place for wet areas', category: 'Electrical', checked: false },
  // Plumbing specific
  { label: 'Water shut off confirmed', category: 'Plumbing', checked: false },
  { label: 'Pressure tested before backfill', category: 'Plumbing', checked: false },
  // Crew
  { label: 'All crew briefed on today\'s scope', category: 'Crew', checked: false },
  { label: 'Emergency contacts posted', category: 'Crew', checked: false },
  { label: 'No crew working alone in hazardous areas', category: 'Crew', checked: false },
]

const CATEGORIES = [...new Set(DEFAULT_ITEMS.map(i => i.category))]

const CATEGORY_ICONS: Record<string, string> = {
  'Permits & Legal': '📋',
  'Site Setup': '🏗️',
  'Safety Equipment': '🧯',
  'PPE': '🦺',
  'Electrical': '⚡',
  'Plumbing': '🔧',
  'Crew': '👷',
}

export function SafetyClient({ user, project, initialChecklists, jobs }: Props) {
  const [checklists, setChecklists] = useState<SafetyChecklist[]>(initialChecklists)
  const [showNew, setShowNew]       = useState(false)
  const [selected, setSelected]     = useState<SafetyChecklist | null>(null)
  const [toast, setToast]           = useState('')
  const [saving, setSaving]         = useState(false)

  // New checklist state
  const [jobId, setJobId]           = useState(jobs[0]?.id || '')
  const [completedBy, setCompletedBy] = useState(user?.full_name || '')
  const [jobDate, setJobDate]       = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]           = useState('')
  const [items, setItems]           = useState<ChecklistItem[]>(
    DEFAULT_ITEMS.map((item, i) => ({ ...item, id: `item-${i}` }))
  )

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length
  const allClear = checkedCount === totalCount
  const pct = Math.round((checkedCount / totalCount) * 100)

  function toggleItem(id: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function checkAll(category: string) {
    setItems(prev => prev.map(i => i.category === category ? { ...i, checked: true } : i))
  }

  const todayChecklist = checklists.find(c => isToday(parseISO(c.job_date)))

  async function saveChecklist() {
    if (!project || !completedBy.trim()) return
    setSaving(true)

    const { data, error } = await supabase.from('safety_checklists').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      job_date: jobDate,
      completed_by: completedBy.trim(),
      items,
      all_clear: allClear,
      notes: notes.trim() || null,
    }).select().single()

    if (!error && data) {
      setChecklists(prev => [data as SafetyChecklist, ...prev])
      msg(`✓ Safety checklist saved — ${checkedCount}/${totalCount} items checked`)
      setShowNew(false)
      setItems(DEFAULT_ITEMS.map((item, i) => ({ ...item, id: `item-${i}` })))
      setNotes('')
    } else msg('Failed to save')
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🦺</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Safety Checklists</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Pre-job safety sign-off — timestamped legal protection</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? '✕ Cancel' : '+ Start Safety Check'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Checklists', value: checklists.length, sub: 'completed', accent: '' },
          { label: 'All Clear', value: checklists.filter(c => c.all_clear).length, sub: '100% checked', accent: '#2d7a4f' },
          { label: 'Incomplete', value: checklists.filter(c => !c.all_clear).length, sub: 'had issues', accent: checklists.filter(c => !c.all_clear).length > 0 ? '#b83232' : '' },
          { label: "Today's Check", value: todayChecklist ? '✓' : '—', sub: todayChecklist ? 'completed' : 'not done yet', accent: todayChecklist ? '#2d7a4f' : '#b06e1a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TODAY ALERT */}
      {!todayChecklist && !showNew && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🦺</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b4010' }}>No safety check completed today</div>
              <div style={{ fontSize: 12, color: '#b06e1a' }}>Complete before any crew starts work</div>
            </div>
          </div>
          <button onClick={() => setShowNew(true)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#b06e1a', color: 'white', fontFamily: 'inherit' }}>
            Start Now
          </button>
        </div>
      )}

      {/* NEW CHECKLIST */}
      {showNew && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Pre-Job Safety Checklist</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Progress */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 120, height: 8, background: '#f1ede6', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: allClear ? '#2d7a4f' : pct > 50 ? '#b06e1a' : '#b83232', borderRadius: 20, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: allClear ? '#2d7a4f' : '#6b6a66' }}>{checkedCount}/{totalCount}</span>
              </div>
              {allClear && <span style={{ fontSize: 13, fontWeight: 700, color: '#2d7a4f', background: '#edf5f0', padding: '4px 12px', borderRadius: 20 }}>✓ All Clear</span>}
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={lbl}>Completed By *</label>
              <input style={inp} placeholder="Your name" value={completedBy} onChange={e => setCompletedBy(e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Date</label>
              <input type="date" style={inp} value={jobDate} onChange={e => setJobDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>

          {/* Checklist items by category */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {CATEGORIES.map(cat => {
              const catItems = items.filter(i => i.category === cat)
              const catChecked = catItems.filter(i => i.checked).length
              const catAllClear = catChecked === catItems.length
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{CATEGORY_ICONS[cat] || '✓'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{cat}</span>
                      <span style={{ fontSize: 11, color: catAllClear ? '#2d7a4f' : '#9e9d99', background: catAllClear ? '#edf5f0' : '#f1ede6', padding: '1px 7px', borderRadius: 20, fontWeight: 600 }}>{catChecked}/{catItems.length}</span>
                    </div>
                    {!catAllClear && (
                      <button onClick={() => checkAll(cat)} style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#6b6a66' }}>
                        Check all
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catItems.map(item => (
                      <div key={item.id} onClick={() => toggleItem(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 9, background: item.checked ? '#edf5f0' : '#f8f7f4', border: `1px solid ${item.checked ? '#2d7a4f' : 'rgba(0,0,0,0.06)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.checked ? '#2d7a4f' : 'rgba(0,0,0,0.15)'}`, background: item.checked ? '#2d7a4f' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {item.checked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: item.checked ? 600 : 400, color: item.checked ? '#1a4d31' : '#0f0f0f', flex: 1 }}>{item.label}</span>
                        {item.checked && <span style={{ fontSize: 12, color: '#2d7a4f' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Notes / Issues</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Any hazards, missing equipment, or concerns noted..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {!allClear && (
            <div style={{ padding: '12px 14px', background: '#fdf4e3', borderRadius: 10, fontSize: 13, color: '#6b4010', borderLeft: '3px solid #b06e1a', marginBottom: 16 }}>
              ⚠️ {totalCount - checkedCount} items unchecked — document any exceptions in notes before saving
            </div>
          )}

          {allClear && (
            <div style={{ padding: '12px 14px', background: '#edf5f0', borderRadius: 10, fontSize: 13, color: '#1a4d31', borderLeft: '3px solid #2d7a4f', marginBottom: 16 }}>
              ✅ All safety checks complete — site is clear to proceed
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveChecklist} disabled={saving || !completedBy.trim()} style={{ padding: '11px 28px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: allClear ? '#2d7a4f' : '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : allClear ? '✓ Save — All Clear' : 'Save Checklist'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* PAST CHECKLISTS */}
      {checklists.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🦺</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No safety checklists yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Complete one before every job — creates a timestamped legal record</div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Start First Checklist</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {checklists.map(cl => {
            const job = jobs.find(j => j.id === cl.job_id)
            const checked = cl.items.filter((i: ChecklistItem) => i.checked).length
            const total = cl.items.length
            const pct = Math.round((checked / total) * 100)
            return (
              <div key={cl.id} onClick={() => setSelected(cl === selected ? null : cl)} style={{ background: 'white', border: `1.5px solid ${cl.all_clear ? 'rgba(45,122,79,0.2)' : selected?.id === cl.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: cl.all_clear ? '#edf5f0' : '#fdf4e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {cl.all_clear ? '✅' : '⚠️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{format(parseISO(cl.job_date), 'EEEE, MMM d, yyyy')}</span>
                      {isToday(parseISO(cl.job_date)) && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#eef3fb', color: '#1f5fa6' }}>TODAY</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>
                      By {cl.completed_by}{job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: cl.all_clear ? '#2d7a4f' : '#b06e1a', marginBottom: 4 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: '#9e9d99' }}>{checked}/{total} items</div>
                  </div>
                </div>

                {selected?.id === cl.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                      {cl.items.map((item: ChecklistItem) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: item.checked ? '#1a4d31' : '#b83232' }}>
                          <span>{item.checked ? '✓' : '✗'}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    {cl.notes && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: '#f8f7f4', borderRadius: 9, fontSize: 13, color: '#6b6a66' }}>
                        <strong>Notes:</strong> {cl.notes}
                      </div>
                    )}
                  </div>
                )}
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

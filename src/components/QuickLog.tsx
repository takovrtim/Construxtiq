'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, CheckCircle, AlertTriangle, Clock, FileText } from 'lucide-react'

interface Props {
  user: any
  project: any
  jobs: { id: string; title: string }[]
}

type Mode = null | 'safety' | 'log' | 'delay'

export function QuickLog({ user, project, jobs }: Props) {
  const [open, setOpen]     = useState(false)
  const [mode, setMode]     = useState<Mode>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState<string | null>(null)

  // Safety
  const [allClear, setAllClear]         = useState(true)
  const [safetyNote, setSafetyNote]     = useState('')

  // Log
  const [logText, setLogText]           = useState('')
  const [logHours, setLogHours]         = useState('8')
  const [logCrew, setLogCrew]           = useState('')

  // Delay
  const [delayDesc, setDelayDesc]       = useState('')
  const [delayDays, setDelayDays]       = useState('1')
  const [delayCause, setDelayCause]     = useState<'gc' | 'weather' | 'material' | 'other'>('gc')

  const today = new Date().toISOString().split('T')[0]
  const jobId = jobs[0]?.id || null

  function reset() {
    setMode(null); setDone(null)
    setAllClear(true); setSafetyNote('')
    setLogText(''); setLogHours('8'); setLogCrew('')
    setDelayDesc(''); setDelayDays('1'); setDelayCause('gc')
  }

  function close() { setOpen(false); reset() }

  async function saveSafety() {
    if (!project) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }

    const items = allClear
      ? [{ id: '1', label: 'All crew briefed on safety', checked: true, category: 'General' }]
      : [{ id: '1', label: safetyNote || 'Issue noted on site', checked: false, category: 'Issue' }]

    await supabase.from('safety_checklists').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId, job_date: today,
      completed_by: user?.full_name || 'Site supervisor',
      items, all_clear: allClear,
      notes: safetyNote || null,
    })
    setSaving(false)
    setDone(allClear ? '✅ Safety check logged — all clear' : '⚠️ Safety issue recorded')
  }

  async function saveLog() {
    if (!project || !logText.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }

    await supabase.from('job_logs').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId, log_date: today,
      work_completed: logText.trim(),
      hours_worked: parseFloat(logHours) || null,
      crew_present: logCrew.trim() || null,
      flagged: false,
    })
    setSaving(false)
    setDone('📝 Daily log saved')
  }

  async function saveDelay() {
    if (!project || !delayDesc.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }

    await supabase.from('delay_logs').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId, delay_date: today,
      days_lost: parseFloat(delayDays) || 1,
      caused_by: delayCause,
      description: delayDesc.trim(),
      documented: false,
    })
    setSaving(false)
    setDone('📅 Delay logged')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 13px', fontSize: 14,
    border: '1.5px solid #2a2a2a', borderRadius: 10,
    fontFamily: 'inherit', outline: 'none',
    background: '#1a1a1a', color: '#fff',
    boxSizing: 'border-box' as const,
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: 88, right: 20, zIndex: 150,
            width: 56, height: 56, borderRadius: '50%',
            background: '#ea580c', border: 'none',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(234,88,12,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Plus size={24} color="white" strokeWidth={2.5} />
        </button>
      )}

      {/* Modal overlay */}
      {open && (
        <>
          <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 501,
            background: '#0a0a0a', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px',
            fontFamily: "'DM Sans', -apple-system, sans-serif",
            boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, background: '#333', borderRadius: 20, margin: '0 auto 20px' }} />

            {/* Close */}
            <button onClick={close} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%' }}>
              <X size={18} />
            </button>

            {/* Done state */}
            {done ? (
              <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{done.split(' ')[0]}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 24 }}>{done.slice(done.indexOf(' ') + 1)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button onClick={() => { setDone(null); setMode(null) }} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                    Log Something Else
                  </button>
                  <button onClick={close} style={{ padding: '11px', fontSize: 13, fontWeight: 500, borderRadius: 12, cursor: 'pointer', border: 'none', background: 'transparent', color: '#666', fontFamily: 'inherit' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : mode === null ? (
              /* Mode picker */
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Quick Log</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>What do you need to log?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { mode: 'safety' as Mode, icon: CheckCircle, label: 'Safety Check', sub: 'Daily pre-job checklist', color: '#22c55e' },
                    { mode: 'log'    as Mode, icon: FileText,    label: 'Daily Log',    sub: "What happened today",    color: '#3b82f6' },
                    { mode: 'delay'  as Mode, icon: Clock,       label: 'Log a Delay',  sub: 'GC, weather, material',  color: '#ef4444' },
                  ].map(({ mode: m, icon: Icon, label, sub, color }) => (
                    <button key={m!} onClick={() => setMode(m)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderRadius: 14, cursor: 'pointer', border: '1px solid #1f1f1f', background: '#111', fontFamily: 'inherit', textAlign: 'left', transition: 'border-color 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = color)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f1f1f')}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} color={color} />
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : mode === 'safety' ? (
              /* Safety */
              <div>
                <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Safety Check</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                  <button onClick={() => setAllClear(true)} style={{ padding: '20px 10px', borderRadius: 14, cursor: 'pointer', border: `2px solid ${allClear ? '#22c55e' : '#1f1f1f'}`, background: allClear ? '#052e16' : '#111', fontFamily: 'inherit', transition: 'all 0.1s' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: allClear ? '#22c55e' : '#fff' }}>All Clear</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>No issues</div>
                  </button>
                  <button onClick={() => setAllClear(false)} style={{ padding: '20px 10px', borderRadius: 14, cursor: 'pointer', border: `2px solid ${!allClear ? '#ef4444' : '#1f1f1f'}`, background: !allClear ? '#1c0a0a' : '#111', fontFamily: 'inherit', transition: 'all 0.1s' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>⚠️</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: !allClear ? '#ef4444' : '#fff' }}>Issue Found</div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>Note it</div>
                  </button>
                </div>
                {!allClear && (
                  <div style={{ marginBottom: 16 }}>
                    <textarea style={{ ...inp, resize: 'none' }} rows={2} placeholder="Describe the safety issue..." value={safetyNote} onChange={e => setSafetyNote(e.target.value)} autoFocus />
                  </div>
                )}
                <button onClick={saveSafety} disabled={saving || (!allClear && !safetyNote.trim())} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Save Safety Check'}
                </button>
              </div>
            ) : mode === 'log' ? (
              /* Daily log */
              <div>
                <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Daily Log</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>What happened today? *</div>
                    <textarea style={{ ...inp, resize: 'none' }} rows={4} placeholder="Panel rough-in on floors 2-3 complete. Crew of 5. Waiting on GC to confirm conduit routing on east wall..." value={logText} onChange={e => setLogText(e.target.value)} autoFocus />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Hours</div>
                      <input type="number" style={inp} value={logHours} onChange={e => setLogHours(e.target.value)} min="0" step="0.5" />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Crew</div>
                      <input style={inp} placeholder="John, Mike, 3 others" value={logCrew} onChange={e => setLogCrew(e.target.value)} />
                    </div>
                  </div>
                </div>
                <button onClick={saveLog} disabled={saving || !logText.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !logText.trim() ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            ) : (
              /* Delay */
              <div>
                <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>← Back</button>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Log a Delay</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {([['gc','GC','#ef4444'],['weather','Weather','#3b82f6'],['material','Material','#f59e0b'],['other','Other','#9ca3af']] as const).map(([v, l, c]) => (
                      <button key={v} onClick={() => setDelayCause(v)} style={{ padding: '10px 6px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${delayCause === v ? c : '#1f1f1f'}`, background: delayCause === v ? `${c}15` : '#111', fontFamily: 'inherit' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: delayCause === v ? c : '#fff' }}>{l}</div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>What happened? *</div>
                    <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="GC changed the panel location at 2pm, required us to redo conduit routing..." value={delayDesc} onChange={e => setDelayDesc(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Days Lost</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['0.5','1','2','3'].map(d => (
                        <button key={d} onClick={() => setDelayDays(d)} style={{ flex: 1, padding: '10px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${delayDays === d ? '#ea580c' : '#1f1f1f'}`, background: delayDays === d ? '#1c0804' : '#111', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: delayDays === d ? '#ea580c' : '#fff' }}>
                          {d}d
                        </button>
                      ))}
                      <input type="number" style={{ ...inp, width: 70, flexShrink: 0 }} value={delayDays} onChange={e => setDelayDays(e.target.value)} min="0.5" step="0.5" />
                    </div>
                  </div>
                </div>
                <button onClick={saveDelay} disabled={saving || !delayDesc.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !delayDesc.trim() ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                  {saving ? 'Saving...' : 'Log Delay'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

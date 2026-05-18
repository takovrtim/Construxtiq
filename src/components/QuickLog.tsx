'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X } from 'lucide-react'

interface Props { user: any; project: any; jobs: { id: string; title: string }[] }
type Mode = 'menu' | 'safety' | 'log' | 'delay' | 'change'
type DelayCause = 'gc' | 'weather' | 'material' | 'other'

const CAUSE_CONFIG: Record<DelayCause, { label: string; color: string; emoji: string }> = {
  gc:       { label: 'GC',       color: '#ef4444', emoji: '🏗️' },
  weather:  { label: 'Weather',  color: '#3b82f6', emoji: '🌧️' },
  material: { label: 'Material', color: '#f59e0b', emoji: '📦' },
  other:    { label: 'Other',    color: '#9ca3af', emoji: '📋' },
}

export function QuickLog({ user, project, jobs }: Props) {
  const [open, setOpen]   = useState(false)
  const [mode, setMode]   = useState<Mode>('menu')
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState<{ emoji: string; msg: string } | null>(null)

  // Safety
  const [safetyNote, setSafetyNote] = useState('')
  const [showIssueInput, setShowIssueInput] = useState(false)

  // Log — default values reduce friction
  const [logText, setLogText]   = useState('')
  const [logHours, setLogHours] = useState('8')

  // Delay — GC is preselected since it's most common
  const [delayDesc, setDelayDesc]   = useState('')
  const [delayDays, setDelayDays]   = useState('1')
  const [delayCause, setDelayCause] = useState<DelayCause>('gc')

  // Change order quick log
  const [changeTitle, setChangeTitle]   = useState('')
  const [changeCost, setChangeCost]     = useState('')

  const today = new Date().toISOString().split('T')[0]
  const jobId = jobs[0]?.id || null

  function close() {
    setOpen(false)
    setTimeout(() => {
      setMode('menu'); setDone(null)
      setSafetyNote(''); setShowIssueInput(false)
      setLogText(''); setLogHours('8')
      setDelayDesc(''); setDelayDays('1'); setDelayCause('gc')
      setChangeTitle(''); setChangeCost('')
    }, 300)
  }

  function finish(emoji: string, msg: string) {
    setDone({ emoji, msg })
    setTimeout(() => close(), 2000)
  }

  // ONE TAP safety — tap All Clear and it saves immediately, no confirmation
  async function saveAllClear() {
    if (!project) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    await supabase.from('safety_checklists').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId, job_date: today,
      completed_by: user?.full_name || 'Site supervisor',
      items: [{ id: '1', label: 'All crew briefed on safety', checked: true, category: 'General' }],
      all_clear: true, notes: null,
    })
    setSaving(false)
    finish('✅', 'Safety — All Clear')
  }

  async function saveSafetyIssue() {
    if (!project || !safetyNote.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    await supabase.from('safety_checklists').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId, job_date: today,
      completed_by: user?.full_name || 'Site supervisor',
      items: [{ id: '1', label: safetyNote.trim(), checked: false, category: 'Issue' }],
      all_clear: false, notes: safetyNote.trim(),
    })
    setSaving(false)
    finish('⚠️', 'Safety issue recorded')
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
      hours_worked: parseFloat(logHours) || 8,
      flagged: false,
    })
    // Fire-and-forget AI summary
    fetch('/api/logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ work_completed: logText.trim(), log_date: today, hours_worked: logHours, project_id: project.id }),
    }).catch(() => {})
    setSaving(false)
    finish('📝', 'Daily log saved')
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
      gc_name: user?.company_gc || null,
      documented: true,
    })
    setSaving(false)
    finish('📅', `${delayDays}d delay logged — ${CAUSE_CONFIG[delayCause].label}`)
  }

  async function saveChange() {
    if (!project || !changeTitle.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    await supabase.from('change_orders').insert({
      project_id: project.id, user_id: authUser.id,
      job_id: jobId,
      title: changeTitle.trim(),
      cost_impact: parseFloat(changeCost.replace(/[^0-9.]/g, '')) || 0,
      status: 'pending', requested_by: 'gc',
      category: 'scope',
      gc_name: user?.company_gc || null,
    })
    setSaving(false)
    finish('🔄', 'Change order logged — send approval link from Changes')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 15,
    border: '1.5px solid #2a2a2a', borderRadius: 11,
    fontFamily: 'inherit', outline: 'none',
    background: '#1a1a1a', color: '#fff',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none' as any,
  }

  const sheet: React.CSSProperties = {
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 600,
    background: '#0a0a0a', borderRadius: '22px 22px 0 0',
    padding: '16px 20px 48px',
    fontFamily: "-apple-system, 'DM Sans', sans-serif",
    boxShadow: '0 -20px 60px rgba(0,0,0,0.6)',
    maxHeight: '88vh', overflowY: 'auto',
  }

  return (
    <>
      {/* FAB — orange pill with + */}
      {!open && project && (
        <button onClick={() => setOpen(true)} style={{
          position: 'fixed', bottom: 86, right: 18, zIndex: 150,
          height: 52, paddingLeft: 18, paddingRight: 20,
          borderRadius: 26, background: '#ea580c', border: 'none',
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(234,88,12,0.45)',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: "inherit", transition: 'transform 0.12s, box-shadow 0.12s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 32px rgba(234,88,12,0.55)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(234,88,12,0.45)' }}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '-0.2px' }}>Quick Log</span>
        </button>
      )}

      {/* Overlay */}
      {open && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 599, backdropFilter: 'blur(4px)' }} />}

      {/* Bottom Sheet */}
      {open && (
        <div style={sheet}>
          {/* Handle bar */}
          <div style={{ width: 40, height: 4, background: '#333', borderRadius: 20, margin: '0 auto 18px' }} />

          {/* Close */}
          <button onClick={close} style={{ position: 'absolute', top: 14, right: 16, background: '#1a1a1a', border: 'none', cursor: 'pointer', color: '#666', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>

          {/* ── DONE ────────────────────────── */}
          {done && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 56, marginBottom: 14 }}>{done.emoji}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{done.msg}</div>
            </div>
          )}

          {/* ── MENU ────────────────────────── */}
          {!done && mode === 'menu' && (
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Quick Log</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>What happened?</div>

              {/* Safety — most important, shown first and biggest */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Safety Check</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={saveAllClear} disabled={saving} style={{ padding: '16px', borderRadius: 14, cursor: 'pointer', border: '2px solid #22c55e', background: '#052e16', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 28 }}>✅</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>All Clear</span>
                    <span style={{ fontSize: 11, color: '#16a34a' }}>1 tap — saves instantly</span>
                  </button>
                  <button onClick={() => { setShowIssueInput(true); setMode('safety') }} style={{ padding: '16px', borderRadius: 14, cursor: 'pointer', border: '2px solid #1f1f1f', background: '#111', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 28 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Issue Found</span>
                    <span style={{ fontSize: 11, color: '#666' }}>Note the issue</span>
                  </button>
                </div>
              </div>

              {/* Other options */}
              <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, marginTop: 16 }}>Log</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { m: 'log'    as Mode, emoji: '📝', label: 'Daily Log',     sub: "What happened today" },
                  { m: 'delay'  as Mode, emoji: '📅', label: 'Log a Delay',   sub: 'GC • Weather • Material' },
                  { m: 'change' as Mode, emoji: '🔄', label: 'Change Order',  sub: 'Quick scope change note' },
                ].map(item => (
                  <button key={item.m} onClick={() => setMode(item.m)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: '1px solid #1f1f1f', background: '#111', fontFamily: 'inherit', textAlign: 'left' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{item.sub}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#444', fontSize: 16 }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── SAFETY ISSUE ─────────────────── */}
          {!done && mode === 'safety' && (
            <div>
              <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>← Back</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Safety Issue</div>
              <textarea style={{ ...inp, resize: 'none', marginBottom: 14 }} rows={3}
                placeholder="Describe the safety issue on site..."
                value={safetyNote} onChange={e => setSafetyNote(e.target.value)} autoFocus />
              <button onClick={saveSafetyIssue} disabled={saving || !safetyNote.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !safetyNote.trim() ? '#333' : '#ef4444', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Record Safety Issue'}
              </button>
            </div>
          )}

          {/* ── DAILY LOG ────────────────────── */}
          {!done && mode === 'log' && (
            <div>
              <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>← Back</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Daily Log</div>
              <textarea style={{ ...inp, resize: 'none', marginBottom: 12 }} rows={5}
                placeholder={`What happened on site today?\n\ne.g. Panel rough-in floors 2-3 complete. Crew of 5. GC confirmed conduit routing. Waiting on inspector callback.`}
                value={logText} onChange={e => setLogText(e.target.value)} autoFocus />
              {/* Hours — just a row of quick taps */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', flexShrink: 0 }}>Hours:</div>
                {['4','6','8','10','12'].map(h => (
                  <button key={h} onClick={() => setLogHours(h)} style={{ flex: 1, padding: '9px 4px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${logHours === h ? '#ea580c' : '#2a2a2a'}`, background: logHours === h ? '#1c0804' : '#111', fontSize: 13, fontWeight: 700, color: logHours === h ? '#ea580c' : '#fff', fontFamily: 'inherit' }}>
                    {h}h
                  </button>
                ))}
              </div>
              <button onClick={saveLog} disabled={saving || !logText.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !logText.trim() ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          )}

          {/* ── DELAY ────────────────────────── */}
          {!done && mode === 'delay' && (
            <div>
              <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>← Back</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Log a Delay</div>

              {/* Cause — big buttons, GC preselected */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                {(Object.entries(CAUSE_CONFIG) as [DelayCause, typeof CAUSE_CONFIG[DelayCause]][]).map(([k, cfg]) => (
                  <button key={k} onClick={() => setDelayCause(k)} style={{ padding: '12px 6px', borderRadius: 11, cursor: 'pointer', border: `2px solid ${delayCause === k ? cfg.color : '#1f1f1f'}`, background: delayCause === k ? `${cfg.color}15` : '#111', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 20 }}>{cfg.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: delayCause === k ? cfg.color : '#fff' }}>{cfg.label}</span>
                  </button>
                ))}
              </div>

              <textarea style={{ ...inp, resize: 'none', marginBottom: 12 }} rows={3}
                placeholder={delayCause === 'gc' ? "GC called at 2pm and moved the panel location. Had to stop conduit work." : "Describe what caused the delay..."}
                value={delayDesc} onChange={e => setDelayDesc(e.target.value)} autoFocus />

              {/* Days — quick taps */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#666', display: 'flex', alignItems: 'center', flexShrink: 0 }}>Days lost:</div>
                {['0.5','1','2','3','5'].map(d => (
                  <button key={d} onClick={() => setDelayDays(d)} style={{ flex: 1, padding: '9px 4px', borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${delayDays === d ? '#ea580c' : '#2a2a2a'}`, background: delayDays === d ? '#1c0804' : '#111', fontSize: 13, fontWeight: 700, color: delayDays === d ? '#ea580c' : '#fff', fontFamily: 'inherit' }}>
                    {d}d
                  </button>
                ))}
              </div>

              <button onClick={saveDelay} disabled={saving || !delayDesc.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !delayDesc.trim() ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : `Log ${delayDays}d ${CAUSE_CONFIG[delayCause].label} Delay`}
              </button>
            </div>
          )}

          {/* ── CHANGE ORDER ─────────────────── */}
          {!done && mode === 'change' && (
            <div>
              <button onClick={() => setMode('menu')} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: 'inherit' }}>← Back</button>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Quick Change Order</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Log it now. Send the GC approval link from Changes.</div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>What changed? *</div>
                <input style={inp} placeholder="Panel location moved to column B-6 per Turner directive" value={changeTitle} onChange={e => setChangeTitle(e.target.value)} autoFocus />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Estimated cost impact</div>
                <input style={inp} placeholder="$8,400" value={changeCost} onChange={e => setChangeCost(e.target.value)} type="text" inputMode="numeric" />
              </div>

              <button onClick={saveChange} disabled={saving || !changeTitle.trim()} style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: saving || !changeTitle.trim() ? '#333' : '#ea580c', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Log Change Order'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}

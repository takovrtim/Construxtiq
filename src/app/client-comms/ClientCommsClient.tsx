'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface CommLog {
  id: string
  project_id: string
  job_id: string | null
  comm_date: string
  comm_time: string | null
  type: 'call' | 'text' | 'email' | 'in_person' | 'voicemail'
  direction: 'inbound' | 'outbound'
  contact_name: string
  summary: string
  outcome: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  flagged: boolean
  created_at: string
}

interface Props {
  user: any
  project: any
  initialLogs: CommLog[]
  jobs: { id: string; title: string; client_name: string; client_phone: string }[]
}

const TYPE_CONFIG = {
  call:       { label: 'Phone Call',  icon: '📞', color: '#1f5fa6' },
  text:       { label: 'Text',        icon: '💬', color: '#2d7a4f' },
  email:      { label: 'Email',       icon: '📧', color: '#7F77DD' },
  in_person:  { label: 'In Person',   icon: '🤝', color: '#d95f2b' },
  voicemail:  { label: 'Voicemail',   icon: '📱', color: '#9e9d99' },
}

export function ClientCommsClient({ user, project, initialLogs, jobs }: Props) {
  const [logs, setLogs]           = useState<CommLog[]>(initialLogs)
  const [showAdd, setShowAdd]     = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterFollowUp, setFilterFollowUp] = useState(false)

  const [commDate, setCommDate]   = useState(new Date().toISOString().split('T')[0])
  const [commTime, setCommTime]   = useState(new Date().toTimeString().slice(0,5))
  const [type, setType]           = useState<CommLog['type']>('call')
  const [direction, setDirection] = useState<CommLog['direction']>('inbound')
  const [jobId, setJobId]         = useState(jobs[0]?.id || '')
  const [contactName, setContactName] = useState('')
  const [summary, setSummary]     = useState('')
  const [outcome, setOutcome]     = useState('')
  const [followUp, setFollowUp]   = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [flagged, setFlagged]     = useState(false)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const followUpCount = logs.filter(l => l.follow_up_needed && !l.flagged).length
  const todayCount = logs.filter(l => l.comm_date === new Date().toISOString().split('T')[0]).length
  const flaggedCount = logs.filter(l => l.flagged).length

  const filtered = logs
    .filter(l => filterType === 'all' || l.type === filterType)
    .filter(l => !filterFollowUp || l.follow_up_needed)

  async function addLog(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !summary.trim() || !contactName.trim()) return
    setSaving(true)

    const job = jobs.find(j => j.id === jobId)
    const { data, error } = await supabase.from('client_comms').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      comm_date: commDate,
      comm_time: commTime || null,
      type,
      direction,
      contact_name: contactName.trim() || job?.client_name || 'Client',
      summary: summary.trim(),
      outcome: outcome.trim() || null,
      follow_up_needed: followUp,
      follow_up_date: followUpDate || null,
      flagged,
    }).select().single()

    if (!error && data) {
      setLogs(prev => [data as CommLog, ...prev])
      msg(`✓ ${TYPE_CONFIG[type].label} logged`)
      setSummary(''); setOutcome(''); setFollowUp(false)
      setFollowUpDate(''); setFlagged(false); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function toggleFlag(id: string, current: boolean) {
    const { error } = await supabase.from('client_comms').update({ flagged: !current }).eq('id', id)
    if (!error) setLogs(prev => prev.map(l => l.id === id ? { ...l, flagged: !current } : l))
  }

  async function deleteLog(id: string) {
    if (!confirm('Delete this communication log?')) return
    const { error } = await supabase.from('client_comms').delete().eq('id', id)
    if (!error) { setLogs(prev => prev.filter(l => l.id !== id)); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>💬</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a></div>

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Client Communications</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Log every call, text, and meeting — your paper trail with owners</div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ Log Communication'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Logged', value: logs.length, sub: 'communications', accent: '' },
          { label: 'Today', value: todayCount, sub: 'logged today', accent: todayCount > 0 ? '#1f5fa6' : '' },
          { label: 'Follow-ups', value: followUpCount, sub: 'pending', accent: followUpCount > 0 ? '#b06e1a' : '' },
          { label: 'Flagged', value: flaggedCount, sub: 'need attention', accent: flaggedCount > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <form onSubmit={addLog} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Type selector */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(TYPE_CONFIG) as CommLog['type'][]).map(t => (
                <button key={t} type="button" onClick={() => setType(t)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: type === t ? 700 : 400, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${type === t ? TYPE_CONFIG[t].color : 'rgba(0,0,0,0.1)'}`, background: type === t ? `${TYPE_CONFIG[t].color}15` : 'white', color: type === t ? TYPE_CONFIG[t].color : '#6b6a66' }}>
                  <span>{TYPE_CONFIG[t].icon}</span><span>{TYPE_CONFIG[t].label}</span>
                </button>
              ))}
            </div>

            {/* Direction */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['inbound', 'outbound'] as const).map(d => (
                <button key={d} type="button" onClick={() => setDirection(d)} style={{ flex: 1, padding: '8px', fontSize: 12, fontWeight: direction === d ? 700 : 400, borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${direction === d ? '#0f0f0f' : 'rgba(0,0,0,0.1)'}`, background: direction === d ? '#0f0f0f' : 'white', color: direction === d ? 'white' : '#6b6a66' }}>
                  {d === 'inbound' ? '← They contacted us' : '→ We contacted them'}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div><label style={lbl}>Contact Name *</label><input style={inp} placeholder="Owner name" value={contactName} onChange={e => setContactName(e.target.value)} required autoFocus /></div>
              <div><label style={lbl}>Date</label><input type="date" style={inp} value={commDate} onChange={e => setCommDate(e.target.value)} /></div>
              <div><label style={lbl}>Time</label><input type="time" style={inp} value={commTime} onChange={e => setCommTime(e.target.value)} /></div>
            </div>

            <div><label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} {j.client_name ? `(${j.client_name})` : ''}</option>)}
              </select>
            </div>

            <div><label style={lbl}>Summary *</label><textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="What was discussed? Owner requested changes to kitchen fixtures, pushed back on timeline..." value={summary} onChange={e => setSummary(e.target.value)} required /></div>

            <div><label style={lbl}>Outcome / Action Items</label><input style={inp} placeholder="Agreed to provide quote by Friday, owner will confirm material selections..." value={outcome} onChange={e => setOutcome(e.target.value)} /></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: followUp ? '#fdf4e3' : '#f8f7f4', borderRadius: 10, cursor: 'pointer' }} onClick={() => setFollowUp(v => !v)}>
                <input type="checkbox" checked={followUp} onChange={() => setFollowUp(v => !v)} style={{ width: 16, height: 16, accentColor: '#b06e1a', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: followUp ? '#b06e1a' : '#6b6a66' }}>📅 Follow-up needed</span>
              </div>
              {followUp && <div><label style={lbl}>Follow-up Date</label><input type="date" style={inp} value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} /></div>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: flagged ? '#fdf0f0' : '#f8f7f4', borderRadius: 10, cursor: 'pointer' }} onClick={() => setFlagged(v => !v)}>
              <input type="checkbox" checked={flagged} onChange={() => setFlagged(v => !v)} style={{ width: 16, height: 16, accentColor: '#b83232', cursor: 'pointer' }} />
              <span style={{ fontSize: 13, fontWeight: 500, color: flagged ? '#b83232' : '#6b6a66' }}>🚩 Flag this — dispute, complaint, or important</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>{saving ? 'Saving...' : 'Log Communication'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          {['all', ...Object.keys(TYPE_CONFIG)].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: filterType === t ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterType === t ? 'white' : 'transparent', color: filterType === t ? '#0f0f0f' : '#9e9d99', boxShadow: filterType === t ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap' }}>
              {t === 'all' ? `All (${logs.length})` : `${TYPE_CONFIG[t as CommLog['type']].icon} ${TYPE_CONFIG[t as CommLog['type']].label}`}
            </button>
          ))}
        </div>
        <button onClick={() => setFilterFollowUp(v => !v)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterFollowUp ? 700 : 500, borderRadius: 9, border: `1.5px solid ${filterFollowUp ? '#b06e1a' : 'rgba(0,0,0,0.1)'}`, background: filterFollowUp ? '#fdf4e3' : 'white', color: filterFollowUp ? '#b06e1a' : '#6b6a66', cursor: 'pointer', fontFamily: 'inherit' }}>
          📅 Follow-ups only
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No communications logged yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Log every owner interaction — protects you when they dispute what was said</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Communication</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(log => {
            const tc = TYPE_CONFIG[log.type]
            const job = jobs.find(j => j.id === log.job_id)
            return (
              <div key={log.id} style={{ background: 'white', border: `1.5px solid ${log.flagged ? 'rgba(184,50,50,0.3)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${tc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{tc.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{log.contact_name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: tc.color, background: `${tc.color}15`, padding: '2px 8px', borderRadius: 20 }}>{tc.label}</span>
                      <span style={{ fontSize: 11, color: '#9e9d99' }}>{log.direction === 'inbound' ? '← Inbound' : '→ Outbound'}</span>
                      {log.flagged && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fdf0f0', color: '#b83232' }}>🚩 Flagged</span>}
                      {log.follow_up_needed && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: '#fdf4e3', color: '#6b4010' }}>📅 Follow-up</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#0f0f0f', lineHeight: 1.6, marginBottom: 6 }}>{log.summary}</div>
                    {log.outcome && <div style={{ fontSize: 12, color: '#6b6a66', fontStyle: 'italic' }}>→ {log.outcome}</div>}
                    <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 6 }}>
                      {format(parseISO(log.comm_date), 'MMM d, yyyy')}{log.comm_time ? ` at ${log.comm_time}` : ''}
                      {job ? ` · ${job.title}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => toggleFlag(log.id, log.flagged)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontFamily: 'inherit', color: '#9e9d99' }}>🚩</button>
                    <button onClick={() => deleteLog(log.id)} style={{ padding: '4px 10px', fontSize: 11, borderRadius: 7, border: '1px solid rgba(184,50,50,0.15)', background: '#fdf0f0', cursor: 'pointer', fontFamily: 'inherit', color: '#b83232' }}>×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

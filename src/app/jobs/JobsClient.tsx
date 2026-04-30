'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type JobStatus = 'pending_permit' | 'permit_approved' | 'in_progress' | 'inspection' | 'completed'
type JobType = 'electrical' | 'plumbing' | 'both'

interface Job {
  id: string
  title: string
  client_name: string
  client_phone: string
  address: string
  job_type: JobType
  status: JobStatus
  permit_number?: string
  notes?: string
  crew: string[]
  created_at: string
}

const STATUS_CONFIG = {
  pending_permit:  { label: 'Waiting on Permit', color: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
  permit_approved: { label: 'Permit Approved',   color: '#edf5f0', text: '#1a4d31', dot: '#639922' },
  in_progress:     { label: 'In Progress',        color: '#E6F1FB', text: '#0C447C', dot: '#378ADD' },
  inspection:      { label: 'Needs Inspection',   color: '#EEEDFE', text: '#26215C', dot: '#7F77DD' },
  completed:       { label: 'Completed',           color: '#f1f0ec', text: '#6b6a66', dot: '#9e9d99' },
}

const TYPE_ICON = { electrical: '⚡', plumbing: '🔧', both: '⚡🔧' }

export function JobsClient({ user, projects }: { user: any; projects: any[] }) {
  const [jobs, setJobs]         = useState<Job[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Job | null>(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [toast, setToast]       = useState('')
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState('')

  const project = projects?.[0]

  // Form state
  const [title, setTitle]         = useState('')
  const [client, setClient]       = useState('')
  const [phone, setPhone]         = useState('')
  const [address, setAddress]     = useState('')
  const [jobType, setJobType]     = useState<JobType>('electrical')
  const [status, setStatus]       = useState<JobStatus>('pending_permit')
  const [permitNum, setPermitNum] = useState('')
  const [notes, setNotes]         = useState('')
  const [crewInput, setCrewInput] = useState('')

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  // Load jobs from Supabase
  useEffect(() => {
    if (!project) { setLoading(false); return }
    loadJobs()
  }, [project])

  async function loadJobs() {
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    if (!error && data) setJobs(data as Job[])
    setLoading(false)
  }

  async function addJob(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSaving(true)

    const { data, error } = await supabase.from('jobs').insert({
      project_id: project.id,
      user_id: user.id,
      title,
      client_name: client,
      client_phone: phone,
      address,
      job_type: jobType,
      status,
      permit_number: permitNum || null,
      notes: notes || null,
      crew: crewInput ? crewInput.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).select().single()

    if (!error && data) {
      setJobs(prev => [data as Job, ...prev])
      msg('✓ Job saved')
      setTitle(''); setClient(''); setPhone(''); setAddress('')
      setPermitNum(''); setNotes(''); setCrewInput('')
      setShowAdd(false)
    } else {
      msg('Failed to save job')
    }
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: JobStatus) {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      msg('Status updated')
    }
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (!error) {
      setJobs(prev => prev.filter(j => j.id !== id))
      if (selected?.id === id) setSelected(null)
      msg('Job deleted')
    }
  }

  const byStatus = (s: JobStatus) => jobs.filter(j => j.status === s)

  const inputStyle = { width: '100%', padding: '9px 11px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, color: '#9e9d99', display: 'block' as const, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.4px' }

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Job Board</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>
            The Repair Crew · {jobs.length} jobs · {byStatus('pending_permit').length} waiting on permit
          </div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          + New Job
        </button>
      </div>

      {/* ADD JOB FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.2px' }}>New Job</div>
          <form onSubmit={addJob} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Job Title *</label><input style={inputStyle} placeholder="Panel Upgrade — Smith Residence" value={title} onChange={e => setTitle(e.target.value)} required autoFocus /></div>
              <div><label style={labelStyle}>Job Type</label>
                <select style={{ ...inputStyle, background: 'white' }} value={jobType} onChange={e => setJobType(e.target.value as JobType)}>
                  <option value="electrical">⚡ Electrical</option>
                  <option value="plumbing">🔧 Plumbing</option>
                  <option value="both">⚡🔧 Both</option>
                </select>
              </div>
              <div><label style={labelStyle}>Client Name</label><input style={inputStyle} placeholder="John Smith" value={client} onChange={e => setClient(e.target.value)} /></div>
              <div><label style={labelStyle}>Client Phone</label><input style={inputStyle} placeholder="(702) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div><label style={labelStyle}>Address</label><input style={inputStyle} placeholder="456 Desert Rose Ln, Las Vegas NV" value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div><label style={labelStyle}>Permit Number</label><input style={inputStyle} placeholder="NV-2025-1234" value={permitNum} onChange={e => setPermitNum(e.target.value)} /></div>
              <div><label style={labelStyle}>Status</label>
                <select style={{ ...inputStyle, background: 'white' }} value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div><label style={labelStyle}>Crew (comma separated)</label><input style={inputStyle} placeholder="John, Mike, Sarah" value={crewInput} onChange={e => setCrewInput(e.target.value)} /></div>
            </div>
            <div><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, resize: 'none' }} rows={2} placeholder="Special instructions..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Save Job'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '9px 16px', fontSize: 13, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div style={{ height: 20, background: 'rgba(0,0,0,0.06)', borderRadius: 6, marginBottom: 10, animation: 'pulse 1.5s infinite' }} />
              <div style={{ height: 90, background: 'rgba(0,0,0,0.04)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No jobs yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Add your first job for The Repair Crew</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            + Add First Job
          </button>
        </div>
      ) : (
        /* KANBAN */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
          {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s]
            const cols = byStatus(s)
            return (
              <div key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', flex: 1 }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '1px 7px', color: '#6b6a66' }}>{cols.length}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cols.map(job => (
                    <div key={job.id} onClick={() => setSelected(job)} style={{ background: 'white', border: `1.5px solid ${selected?.id === job.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 11, padding: 13, cursor: 'pointer', transition: 'all .15s', boxShadow: selected?.id === job.id ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5, lineHeight: 1.4, letterSpacing: '-0.2px' }}>{job.title}</div>
                      <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 8 }}>{job.client_name || '—'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 16 }}>{TYPE_ICON[job.job_type as JobType] || '🔧'}</span>
                        {job.permit_number && <span style={{ fontSize: 10, fontWeight: 600, background: cfg.color, color: cfg.text, padding: '2px 6px', borderRadius: 20 }}>{job.permit_number}</span>}
                      </div>
                      {job.crew && job.crew.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {job.crew.slice(0, 3).map(c => (
                            <div key={c} style={{ width: 22, height: 22, borderRadius: '50%', background: '#0f0f0f', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {c[0]?.toUpperCase()}
                            </div>
                          ))}
                          {job.crew.length > 3 && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f1ede6', color: '#6b6a66', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+{job.crew.length - 3}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* JOB DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 2 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: '#9e9d99' }}>{TYPE_ICON[selected.job_type as JobType]} {selected.job_type}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => deleteJob(selected.id)} style={{ padding: '5px 10px', fontSize: 11, borderRadius: 7, border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Delete</button>
                <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.1)', background: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>×</button>
              </div>
            </div>

            {/* Status */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
              {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
                const cfg = STATUS_CONFIG[s]
                const active = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${active ? cfg.dot : 'rgba(0,0,0,0.07)'}`, background: active ? cfg.color : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : '#6b6a66', flex: 1 }}>{cfg.label}</span>
                    {active && <span style={{ fontSize: 12, color: cfg.dot }}>✓</span>}
                  </button>
                )
              })}
            </div>

            {/* Details */}
            <div style={{ background: '#f8f7f4', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selected.client_name && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 65 }}>Client</span><span style={{ fontWeight: 600 }}>{selected.client_name}</span></div>}
              {selected.client_phone && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 65 }}>Phone</span><a href={`tel:${selected.client_phone}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{selected.client_phone}</a></div>}
              {selected.address && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 65 }}>Address</span><span>{selected.address}</span></div>}
              {selected.permit_number && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 65 }}>Permit</span><span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{selected.permit_number}</span></div>}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Notes</div>
                <div style={{ fontSize: 13, color: '#6b6a66', lineHeight: 1.65, background: '#f8f7f4', borderRadius: 8, padding: 12 }}>{selected.notes}</div>
              </div>
            )}

            {/* Crew */}
            {selected.crew && selected.crew.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Crew ({selected.crew.length})</div>
                {selected.crew.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: '#f8f7f4', borderRadius: 9, marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#0f0f0f', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c[0]?.toUpperCase()}</div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c}</span>
                    </div>
                    <a href={`tel:`} style={{ fontSize: 12, color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>Call</a>
                  </div>
                ))}
              </div>
            )}

            {/* Message crew */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Message Crew</div>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message to the whole crew..." rows={3} style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 8, background: '#f8f7f4' }} />
              <button onClick={() => { msg('✓ Message sent to crew'); setMessage('') }} disabled={!message.trim()} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: message.trim() ? 'pointer' : 'not-allowed', border: 'none', background: message.trim() ? '#0f0f0f' : '#f1ede6', color: message.trim() ? 'white' : '#9e9d99', fontFamily: 'inherit', transition: 'all .15s' }}>
                Send to Crew
              </button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 404 : 24, zIndex: 9999, background: '#2d7a4f', color: 'white', padding: '11px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeUp 0.22s ease' }}>
          {toast}
        </div>
      )}
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </>
  )
}
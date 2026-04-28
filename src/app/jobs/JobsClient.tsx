'use client'

import { useState } from 'react'
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
  permit_status?: string
  start_date?: string
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
  const [jobs, setJobs] = useState<Job[]>([])
  const [selected, setSelected] = useState<Job | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [message, setMessage] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [jobType, setJobType] = useState<JobType>('electrical')
  const [status, setStatus] = useState<JobStatus>('pending_permit')
  const [permitNum, setPermitNum] = useState('')
  const [notes, setNotes] = useState('')
  const [crewInput, setCrewInput] = useState('')

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  function addJob(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const newJob: Job = {
      id: Date.now().toString(),
      title,
      client_name: client,
      client_phone: phone,
      address,
      job_type: jobType,
      status,
      permit_number: permitNum || undefined,
      notes: notes || undefined,
      crew: crewInput ? crewInput.split(',').map(s => s.trim()) : [],
      created_at: new Date().toISOString(),
    }
    setJobs(prev => [newJob, ...prev])
    setTitle(''); setClient(''); setPhone(''); setAddress('')
    setPermitNum(''); setNotes(''); setCrewInput('')
    setShowAdd(false); setSaving(false)
    msg('Job added to board')
  }

  function updateStatus(id: string, newStatus: JobStatus) {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    msg('Status updated')
  }

  const byStatus = (s: JobStatus) => jobs.filter(j => j.status === s)

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Job Board</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>The Repair Crew · Electrical & Plumbing</div>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}
        >
          + New Job
        </button>
      </div>

      {/* ADD JOB FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>New Job</div>
          <form onSubmit={addJob} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Job Title *</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. Panel Upgrade - Smith Residence" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Job Type *</label>
                <select style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: 'white' }} value={jobType} onChange={e => setJobType(e.target.value as JobType)}>
                  <option value="electrical">⚡ Electrical</option>
                  <option value="plumbing">🔧 Plumbing</option>
                  <option value="both">⚡🔧 Both</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Client Name *</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="John Smith" value={client} onChange={e => setClient(e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Client Phone</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="(702) 555-0100" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Job Address</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="123 Main St, Las Vegas NV" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Permit Number</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="e.g. NV-2024-1234" value={permitNum} onChange={e => setPermitNum(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Status</label>
                <select style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: 'white' }} value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Crew (comma separated)</label>
                <input style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none' }} placeholder="Mike, Sarah, Dave" value={crewInput} onChange={e => setCrewInput(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#6b6a66', display: 'block', marginBottom: 4 }}>Notes</label>
              <textarea style={{ width: '100%', padding: '8px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', resize: 'none' }} rows={2} placeholder="Any special instructions or notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Adding...' : 'Add Job'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.14)', background: 'white', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KANBAN BOARD */}
      {jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔧</div>
          <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>No jobs yet</div>
          <div style={{ fontSize: 13, color: '#6b6a66', marginBottom: 16 }}>Add your first job for The Repair Crew</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '8px 20px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}>
            + Add First Job
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
          {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
            const cfg = STATUS_CONFIG[s]
            const cols = byStatus(s)
            return (
              <div key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6b6a66', textTransform: 'uppercase', letterSpacing: '.4px' }}>{cfg.label}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.06)', borderRadius: 20, padding: '1px 7px' }}>{cols.length}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cols.map(job => (
                    <div
                      key={job.id}
                      onClick={() => setSelected(job)}
                      style={{ background: 'white', border: `1px solid ${selected?.id === job.id ? '#1a1a1a' : 'rgba(0,0,0,0.08)'}`, borderRadius: 10, padding: 12, cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, lineHeight: 1.4 }}>{job.title}</div>
                      <div style={{ fontSize: 11, color: '#6b6a66', marginBottom: 6 }}>{job.client_name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14 }}>{TYPE_ICON[job.job_type]}</span>
                        {job.permit_number && (
                          <span style={{ fontSize: 10, fontWeight: 500, background: cfg.color, color: cfg.text, padding: '2px 6px', borderRadius: 20 }}>
                            {job.permit_number}
                          </span>
                        )}
                      </div>
                      {job.crew.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {job.crew.map(c => (
                            <span key={c} style={{ fontSize: 10, background: '#f1f0ec', borderRadius: 20, padding: '2px 7px', color: '#6b6a66' }}>{c}</span>
                          ))}
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
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', zIndex: 100, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.title}</div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9e9d99' }}>×</button>
          </div>

          {/* Status updater */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
                const cfg = STATUS_CONFIG[s]
                const active = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 8, border: `1px solid ${active ? cfg.dot : 'rgba(0,0,0,0.08)'}`, background: active ? cfg.color : 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? cfg.text : '#6b6a66' }}>{cfg.label}</span>
                    {active && <span style={{ marginLeft: 'auto', fontSize: 10 }}>✓</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Job details */}
          <div style={{ background: '#f8f7f4', borderRadius: 8, padding: 13, marginBottom: 16, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selected.client_name && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 70 }}>Client</span><span style={{ fontWeight: 500 }}>{selected.client_name}</span></div>}
            {selected.client_phone && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 70 }}>Phone</span><a href={`tel:${selected.client_phone}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 500 }}>{selected.client_phone}</a></div>}
            {selected.address && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 70 }}>Address</span><span>{selected.address}</span></div>}
            {selected.permit_number && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 70 }}>Permit</span><span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{selected.permit_number}</span></div>}
            <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 70 }}>Type</span><span>{TYPE_ICON[selected.job_type]} {selected.job_type}</span></div>
          </div>

          {/* Notes */}
          {selected.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 13, color: '#6b6a66', lineHeight: 1.6 }}>{selected.notes}</div>
            </div>
          )}

          {/* Crew */}
          {selected.crew.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Crew</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.crew.map(c => (
                  <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 11px', background: '#f8f7f4', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', color: 'white', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c[0].toUpperCase()}</div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{c}</span>
                    </div>
                    <a href={`tel:`} style={{ fontSize: 11, color: '#1f5fa6', textDecoration: 'none', fontWeight: 500 }}>Call</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message crew */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 8 }}>Message Crew</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type a message to the crew..."
              rows={3}
              style={{ width: '100%', padding: '9px 11px', fontSize: 13, border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 8 }}
            />
            <button
              onClick={() => { msg('Message sent to crew ✓'); setMessage('') }}
              disabled={!message.trim()}
              style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: 'none', background: message.trim() ? '#1a1a1a' : '#f1f0ec', color: message.trim() ? 'white' : '#9e9d99', fontFamily: 'inherit', transition: 'all .15s' }}
            >
              Send to Crew
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 384 : 24, zIndex: 9999, background: '#2d7a4f', color: 'white', padding: '11px 18px', borderRadius: 12, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeUp 0.22s ease' }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  )
}
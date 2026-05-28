'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { DelayPrediction } from './DelayPrediction'
import { ClientShareButton } from './ClientShareButton'
import { JobPhotos } from './JobPhotos'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, useDroppable, useDraggable,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'

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

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; text: string; dot: string }> = {
  pending_permit:  { label: 'Waiting on Permit', color: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
  permit_approved: { label: 'Permit Approved',   color: '#edf5f0', text: '#1a4d31', dot: '#639922' },
  in_progress:     { label: 'In Progress',        color: '#E6F1FB', text: '#0C447C', dot: '#378ADD' },
  inspection:      { label: 'Needs Inspection',   color: '#EEEDFE', text: '#26215C', dot: '#7F77DD' },
  completed:       { label: 'Completed',           color: '#f1f0ec', text: '#6b6a66', dot: '#9e9d99' },
}

const TYPE_ICON: Record<string, string> = { electrical: '⚡', plumbing: '🔧', both: '⚡🔧' }
const TYPE_COLOR: Record<string, string> = { electrical: '#fdf4e3', plumbing: '#E6F1FB', both: '#EEEDFE' }

function formatPhone(val: string): string {
  const d = val.replace(/\D/g, '').slice(0, 10)
  if (d.length >= 7) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  if (d.length >= 4) return `(${d.slice(0,3)}) ${d.slice(3)}`
  if (d.length >= 1) return `(${d}`
  return ''
}

function JobCard({ job, onClick, isSelected }: { job: Job; onClick: () => void; isSelected: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job.id })
  const cfg = STATUS_CONFIG[job.status]
  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes} onClick={onClick}
      style={{
        background: '#131A26',
        border: `1.5px solid ${isSelected ? '#0f0f0f' : isDragging ? '#d95f2b' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 11, padding: 13,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'all .15s',
        boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.2)' : isSelected ? '0 4px 12px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
        opacity: isDragging ? 0.4 : 1,
        transform: transform ? `translate3d(${transform.x}px,${transform.y}px,0)` : undefined,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.2px', flex: 1 }}>{job.title}</div>
        <span style={{ fontSize: 14, flexShrink: 0 }}>{TYPE_ICON[job.job_type]}</span>
      </div>
      <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 8 }}>{job.client_name || '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {job.permit_number
          ? <span style={{ fontSize: 10, fontWeight: 700, background: cfg.color, color: cfg.text, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace' }}>{job.permit_number}</span>
          : <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.2)' }}>No permit #</span>
        }
      </div>
      {job.crew?.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', gap: 3, alignItems: 'center' }}>
          {job.crew.slice(0, 4).map((c, i) => (
            <div key={c} title={c} style={{ width: 22, height: 22, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white' }}>
              {c[0]?.toUpperCase()}
            </div>
          ))}
          {job.crew.length > 4 && <span style={{ fontSize: 10, color: '#9e9d99' }}>+{job.crew.length - 4}</span>}
        </div>
      )}
    </div>
  )
}

function Column({ status, jobs, selectedId, onCardClick }: { status: JobStatus; jobs: Job[]; selectedId: string | null; onCardClick: (j: Job) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const cfg = STATUS_CONFIG[status]
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '0 4px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', flex: 1 }}>{cfg.label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, background: 'rgba(0,0,0,0.05)', borderRadius: 20, padding: '1px 7px', color: '#6b6a66' }}>{jobs.length}</div>
      </div>
      <div ref={setNodeRef} style={{ minHeight: 100, borderRadius: 12, padding: 6, background: isOver ? cfg.color : 'rgba(0,0,0,0.015)', border: `2px dashed ${isOver ? cfg.dot : 'rgba(0,0,0,0.06)'}`, transition: 'all 0.15s', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {jobs.map(job => <JobCard key={job.id} job={job} onClick={() => onCardClick(job)} isSelected={selectedId === job.id} />)}
        {jobs.length === 0 && (
          <div style={{ padding: '20px 8px', textAlign: 'center', fontSize: 11, color: isOver ? cfg.text : 'rgba(0,0,0,0.2)', fontWeight: isOver ? 600 : 400, transition: 'all 0.15s' }}>
            {isOver ? 'Drop here →' : 'Drop jobs here'}
          </div>
        )}
      </div>
    </div>
  )
}

export function JobsClient({ user, projects }: { user: any; projects: any[] }) {
  const [jobs, setJobs]           = useState<Job[]>([])
  const [loading, setLoading]     = useState(true)
  const [selected, setSelected]   = useState<Job | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [showDelay, setShowDelay] = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [message, setMessage]     = useState('')
  const [activeJob, setActiveJob] = useState<Job | null>(null)
  const [activePanel, setActivePanel] = useState<'details' | 'photos'>('details')

  const project = projects?.[0]

  const [title, setTitle]         = useState('')
  const [client, setClient]       = useState('')
  const [phone, setPhone]         = useState('')
  const [address, setAddress]     = useState('')
  const [jobType, setJobType]     = useState<JobType>('electrical')
  const [status, setStatus]       = useState<JobStatus>('pending_permit')
  const [permitNum, setPermitNum] = useState('')
  const [notes, setNotes]         = useState('')
  const [crewInput, setCrewInput] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    if (!project) { setLoading(false); return }
    loadJobs()
  }, [project?.id])

  async function loadJobs() {
    setLoading(true)
    const { data } = await supabase.from('jobs').select('*').eq('project_id', project.id).order('created_at', { ascending: false })
    if (data) setJobs(data as Job[])
    setLoading(false)
  }

  async function addJob(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('jobs').insert({
      project_id: project.id, user_id: user.id,
      title: title.trim(), client_name: client.trim(), client_phone: phone,
      address: address.trim(), job_type: jobType, status,
      permit_number: permitNum || null, notes: notes || null,
      crew: crewInput ? crewInput.split(',').map(s => s.trim()).filter(Boolean) : [],
    }).select().single()
    if (!error && data) {
      setJobs(prev => [data as Job, ...prev])
      msg(`✓ "${title.trim()}" added`)
      setTitle(''); setClient(''); setPhone(''); setAddress('')
      setPermitNum(''); setNotes(''); setCrewInput(''); setShowAdd(false)
    } else msg('Failed to save — check connection')
    setSaving(false)
  }

  async function updateJobStatus(id: string, newStatus: JobStatus) {
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      msg(`✓ ${STATUS_CONFIG[newStatus].label}`)
    }
  }

  async function deleteJob(id: string) {
    if (!confirm('Delete this job?')) return
    const { error } = await supabase.from('jobs').delete().eq('id', id)
    if (!error) { setJobs(prev => prev.filter(j => j.id !== id)); setSelected(null); msg('Deleted') }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveJob(jobs.find(j => j.id === e.active.id) ?? null)
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveJob(null)
    if (!over) return
    const jobId = active.id as string
    const newStatus = over.id as JobStatus
    const job = jobs.find(j => j.id === jobId)
    if (!job || job.status === newStatus) return
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    if (selected?.id === jobId) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
    const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId)
    if (error) { setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: job.status } : j)); msg('Update failed') }
    else msg(`✓ Moved to ${STATUS_CONFIG[newStatus].label}`)
  }

  const crewPreview = crewInput ? crewInput.split(',').map(s => s.trim()).filter(Boolean) : []
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#F1EEE5', transition: 'border-color 0.15s' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Job Board</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>
            {jobs.length} jobs · {jobs.filter(j => j.status === 'pending_permit').length} waiting on permit
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {project && <ClientShareButton projectId={project.id} />}
          <button onClick={() => setShowDelay(v => !v)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: `1.5px solid ${showDelay ? '#b83232' : 'rgba(0,0,0,0.1)'}`, background: showDelay ? '#fdf0f0' : 'white', color: showDelay ? '#b83232' : '#6b6a66', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔮 {showDelay ? 'Hide Predictions' : 'Delay Predictions'}
          </button>
          <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit', transition: 'background 0.15s' }}>
            {showAdd ? '✕ Cancel' : '+ New Job'}
          </button>
        </div>
      </div>

      {/* DELAY PREDICTION */}
      {showDelay && project && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <DelayPrediction projectId={project.id} />
        </div>
      )}

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {(['electrical', 'plumbing', 'both'] as JobType[]).map(t => (
              <button key={t} type="button" onClick={() => setJobType(t)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${jobType === t ? (t === 'electrical' ? '#EF9F27' : t === 'plumbing' ? '#378ADD' : '#7F77DD') : 'rgba(0,0,0,0.08)'}`, background: jobType === t ? TYPE_COLOR[t] : 'white', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                <span style={{ fontSize: 18 }}>{TYPE_ICON[t]}</span>
                <span style={{ textTransform: 'capitalize' }}>{t}</span>
              </button>
            ))}
          </div>
          <form onSubmit={addJob} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Job Title *</label>
              <input style={{ ...inp, fontSize: 14, fontWeight: 500 }} placeholder="e.g. Panel Upgrade — Smith Residence" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Client Name</label>
                <input style={inp} placeholder="John Smith" value={client} onChange={e => setClient(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Client Phone</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9e9d99', pointerEvents: 'none' }}>📞</span>
                  <input style={{ ...inp, paddingLeft: 34 }} placeholder="(702) 555-0100" type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
              </div>
              <div>
                <label style={lbl}>Job Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9e9d99', pointerEvents: 'none' }}>📍</span>
                  <input style={{ ...inp, paddingLeft: 32 }} placeholder="456 Desert Rose Ln, Las Vegas NV" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={lbl}>Permit Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#9e9d99', pointerEvents: 'none' }}>📋</span>
                  <input style={{ ...inp, paddingLeft: 32, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }} placeholder="NV-2025-1234" value={permitNum} onChange={e => setPermitNum(e.target.value.toUpperCase())} />
                </div>
              </div>
              <div>
                <label style={lbl}>Status</label>
                <select style={{ ...inp, background: '#131A26', cursor: 'pointer' }} value={status} onChange={e => setStatus(e.target.value as JobStatus)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Crew Members</label>
                <input style={inp} placeholder="John, Mike, Sarah" value={crewInput} onChange={e => setCrewInput(e.target.value)} />
                {crewPreview.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
                    {crewPreview.map((c, i) => (
                      <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f1ede6', borderRadius: 20, padding: '3px 10px 3px 4px', fontSize: 12, fontWeight: 500 }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c[0]?.toUpperCase()}</div>
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label style={lbl}>Notes</label>
              <div style={{ position: 'relative' }}>
                <textarea style={{ ...inp, resize: 'none', paddingBottom: 28 }} rows={2} placeholder="Access codes, parking, hazards, special instructions..." value={notes} onChange={e => setNotes(e.target.value.slice(0, 300))} maxLength={300} />
                <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 10, color: notes.length > 250 ? '#d95f2b' : '#9e9d99', fontWeight: 500 }}>{notes.length}/300</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="submit" disabled={saving || !title.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: saving || !title.trim() ? 'not-allowed' : 'pointer', border: 'none', background: !title.trim() ? '#f1ede6' : '#0f0f0f', color: !title.trim() ? '#9e9d99' : 'white', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                {saving ? 'Saving...' : title.trim() ? `Save "${title.trim().slice(0,20)}${title.trim().length > 20 ? '…' : ''}"` : 'Enter a job title'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit', color: '#6b6a66' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* KANBAN */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div style={{ height: 14, background: 'rgba(0,0,0,0.06)', borderRadius: 4, marginBottom: 10, width: '65%' }} />
              <div style={{ height: 90, background: 'rgba(0,0,0,0.04)', borderRadius: 10 }} />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: '#131A26', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>🔧</div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.3px' }}>No jobs on the board yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 24 }}>Add a job and drag it through the pipeline as work progresses</div>
          <button onClick={() => setShowAdd(true)} style={{ padding: '11px 28px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Add First Job</button>
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 12 }}>
            {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => (
              <Column key={s} status={s} jobs={jobs.filter(j => j.status === s)} selectedId={selected?.id ?? null} onCardClick={job => { setSelected(prev => prev?.id === job.id ? null : job); setActivePanel('details') }} />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeJob && (
              <div style={{ background: '#131A26', border: '2px solid #d95f2b', borderRadius: 11, padding: 13, boxShadow: '0 20px 48px rgba(0,0,0,0.25)', transform: 'rotate(1.5deg)', cursor: 'grabbing', width: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{activeJob.title}</div>
                <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 6 }}>{activeJob.client_name}</div>
                <div style={{ fontSize: 18 }}>{TYPE_ICON[activeJob.job_type]}</div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: '#131A26', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>

            {/* Panel header */}
            <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>{selected.title}</div>
                  <div style={{ fontSize: 12, color: '#9e9d99', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{TYPE_ICON[selected.job_type]}</span>
                    <span style={{ textTransform: 'capitalize' }}>{selected.job_type}</span>
                    <span>·</span>
                    <span>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => deleteJob(selected.id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 7, border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Delete</button>
                  <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99' }}>×</button>
                </div>
              </div>

              {/* Tab switcher */}
              <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 9, padding: 3, marginBottom: 0 }}>
                {(['details', 'photos'] as const).map(tab => (
                  <button key={tab} onClick={() => setActivePanel(tab)} style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: activePanel === tab ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: activePanel === tab ? 'white' : 'transparent', color: activePanel === tab ? '#0f0f0f' : '#9e9d99', boxShadow: activePanel === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                    {tab === 'photos' ? '📸 Photo Proof' : '📋 Details'}
                  </button>
                ))}
              </div>
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 24px' }}>

              {/* DETAILS TAB */}
              {activePanel === 'details' && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Pipeline Status</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
                    {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(s => {
                      const cfg = STATUS_CONFIG[s]
                      const active = selected.status === s
                      return (
                        <button key={s} onClick={() => updateJobStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${active ? cfg.dot : 'rgba(0,0,0,0.07)'}`, background: active ? cfg.color : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: cfg.dot }} />
                          <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : '#6b6a66', flex: 1 }}>{cfg.label}</span>
                          {active && <span style={{ fontSize: 14, color: cfg.dot }}>✓</span>}
                        </button>
                      )
                    })}
                  </div>

                  <div style={{ background: '#f8f7f4', borderRadius: 11, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {selected.client_name && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>👤</span><span style={{ fontWeight: 600 }}>{selected.client_name}</span>
                      </div>
                    )}
                    {selected.client_phone && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>📞</span>
                        <a href={`tel:${selected.client_phone.replace(/\D/g,'')}`} style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 600 }}>{selected.client_phone}</a>
                        <span style={{ fontSize: 11, color: '#9e9d99' }}>Tap to call</span>
                      </div>
                    )}
                    {selected.address && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 13 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>📍</span>
                        <a href={`https://maps.google.com?q=${encodeURIComponent(selected.address)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1f5fa6', textDecoration: 'none', fontWeight: 500, lineHeight: 1.4 }}>
                          {selected.address} <span style={{ fontSize: 11 }}>↗ Maps</span>
                        </a>
                      </div>
                    )}
                    {selected.permit_number && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 13 }}>
                        <span style={{ fontSize: 16 }}>📋</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', background: '#e8e3da', padding: '2px 8px', borderRadius: 5 }}>{selected.permit_number}</span>
                      </div>
                    )}
                  </div>

                  {selected.notes && (
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7 }}>Notes</div>
                      <div style={{ fontSize: 13, color: '#6b6a66', lineHeight: 1.7, background: '#f8f7f4', borderRadius: 9, padding: '12px 14px' }}>{selected.notes}</div>
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>
                      Crew {selected.crew?.length > 0 ? `(${selected.crew.length})` : ''}
                    </div>
                    {!selected.crew || selected.crew.length === 0 ? (
                      <div style={{ fontSize: 13, color: '#9e9d99', fontStyle: 'italic', padding: '8px 0' }}>No crew assigned yet</div>
                    ) : (
                      selected.crew.map((c, i) => (
                        <div key={c} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: '#f8f7f4', borderRadius: 10, marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c[0]?.toUpperCase()}</div>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{c}</span>
                          </div>
                          <a href="tel:" style={{ fontSize: 12, color: '#1f5fa6', textDecoration: 'none', fontWeight: 600, background: '#eef3fb', padding: '4px 10px', borderRadius: 6 }}>📞 Call</a>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Message Whole Crew</div>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Job update, site change, schedule note..." rows={3} style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 8, background: '#f8f7f4', lineHeight: 1.6 }} />
                    <button onClick={() => { msg('✓ Message sent to crew'); setMessage('') }} disabled={!message.trim()} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: message.trim() ? 'pointer' : 'not-allowed', border: 'none', background: message.trim() ? '#0f0f0f' : '#f1ede6', color: message.trim() ? 'white' : '#9e9d99', fontFamily: 'inherit', transition: 'all .15s' }}>
                      {message.trim() ? `Send to Crew (${selected.crew?.length || 0})` : 'Type a message first'}
                    </button>
                  </div>
                </>
              )}

              {/* PHOTOS TAB */}
              {activePanel === 'photos' && project && (
                <JobPhotos
                  projectId={project.id}
                  jobId={selected.id}
                  jobTitle={selected.title}
                />
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 444 : 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', transition: 'right 0.2s' }}>
          {toast}
        </div>
      )}
    </>
  )
}
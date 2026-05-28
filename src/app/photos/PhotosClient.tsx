'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface Photo {
  id: string
  project_id: string
  job_id: string | null
  url: string
  caption: string | null
  photo_date: string
  stage: string | null
  flagged: boolean
  created_at: string
}

interface Props {
  user: any
  project: any
  initialPhotos: Photo[]
  jobs: { id: string; title: string }[]
}

const STAGES = ['before', 'during', 'after', 'issue', 'milestone']
const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  before:    { label: 'Before',    color: '#1f5fa6', icon: '📸' },
  during:    { label: 'During',    color: '#b06e1a', icon: '🏗️' },
  after:     { label: 'After',     color: '#2d7a4f', icon: '✅' },
  issue:     { label: 'Issue',     color: '#b83232', icon: '⚠️' },
  milestone: { label: 'Milestone', color: '#7F77DD', icon: '🏆' },
}

export function PhotosClient({ user, project, initialPhotos, jobs }: Props) {
  const [photos, setPhotos]         = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading]   = useState(false)
  const [selected, setSelected]     = useState<Photo | null>(null)
  const [toast, setToast]           = useState('')
  const [filterJob, setFilterJob]   = useState('all')
  const [filterStage, setFilterStage] = useState('all')
  const [jobId, setJobId]           = useState(jobs[0]?.id || '')
  const [stage, setStage]           = useState('during')
  const [caption, setCaption]       = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const filtered = photos
    .filter(p => filterJob === 'all' || p.job_id === filterJob)
    .filter(p => filterStage === 'all' || p.stage === filterStage)

  // Group by date
  const grouped = filtered.reduce((acc, p) => {
    const d = p.photo_date || p.created_at.split('T')[0]
    if (!acc[d]) acc[d] = []
    acc[d].push(p)
    return acc
  }, {} as Record<string, Photo[]>)

  async function uploadPhotos(files: FileList | File[]) {
    if (!project) return
    setUploading(true)
    const today = new Date().toISOString().split('T')[0]

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${project.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('job-photos')
        .upload(path, file, { contentType: file.type })

      if (uploadError) { msg('Upload failed: ' + uploadError.message); continue }

      const { data: { publicUrl } } = supabase.storage
        .from('job-photos')
        .getPublicUrl(path)

      const { data, error } = await supabase.from('job_photos').insert({
        project_id: project.id,
        user_id: user.id,
        job_id: jobId || null,
        url: publicUrl,
        caption: caption.trim() || null,
        photo_date: today,
        stage: stage || null,
        flagged: false,
      }).select().single()

      if (!error && data) {
        setPhotos(prev => [data as Photo, ...prev])
        msg('✓ Photo uploaded')
      }
    }
    setUploading(false)
    setCaption('')
  }

  async function toggleFlag(id: string, current: boolean) {
    const { error } = await supabase.from('job_photos').update({ flagged: !current }).eq('id', id)
    if (!error) {
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, flagged: !current } : p))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, flagged: !current } : null)
    }
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return
    const { error } = await supabase.from('job_photos').delete().eq('id', id)
    if (!error) { setPhotos(prev => prev.filter(p => p.id !== id)); setSelected(null); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 8, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#F1EEE5' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Job Site Photos</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>Document every stage — before, during, after, issues, milestones</div>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {uploading ? '⏳ Uploading...' : '📸 Add Photos'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Photos', value: photos.length, sub: 'uploaded' },
          { label: 'Issues', value: photos.filter(p => p.stage === 'issue').length, sub: 'flagged issues', accent: photos.filter(p => p.stage === 'issue').length > 0 ? '#b83232' : '' },
          { label: 'Milestones', value: photos.filter(p => p.stage === 'milestone').length, sub: 'captured', accent: '#7F77DD' },
          { label: 'Flagged', value: photos.filter(p => p.flagged).length, sub: 'need attention', accent: photos.filter(p => p.flagged).length > 0 ? '#b06e1a' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* UPLOAD AREA */}
      <div style={{ background: '#131A26', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 12, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>Stage</div>
            <select style={{ ...inp, background: '#131A26' }} value={stage} onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].icon} {STAGE_CONFIG[s].label}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>Job</div>
            <select style={{ ...inp, background: '#131A26' }} value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">No specific job</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>Caption (optional)</div>
            <input style={inp} placeholder="What's happening in this photo?" value={caption} onChange={e => setCaption(e.target.value)} />
          </div>
        </div>

        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); uploadPhotos(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#d95f2b' : 'rgba(0,0,0,0.12)'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#fdf0e8' : '#f8f7f4', transition: 'all 0.15s' }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{uploading ? 'Uploading...' : 'Drop photos here or click to upload'}</div>
          <div style={{ fontSize: 12, color: '#9e9d99' }}>JPG, PNG, HEIC — multiple files supported</div>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files && uploadPhotos(e.target.files)} />
      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          {['all', ...STAGES].map(s => (
            <button key={s} onClick={() => setFilterStage(s)} style={{ padding: '5px 11px', fontSize: 12, fontWeight: filterStage === s ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterStage === s ? 'white' : 'transparent', color: filterStage === s ? '#0f0f0f' : '#9e9d99', boxShadow: filterStage === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {s === 'all' ? 'All' : `${STAGE_CONFIG[s].icon} ${STAGE_CONFIG[s].label}`}
            </button>
          ))}
        </div>
      </div>

      {/* PHOTO GRID BY DATE */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: '#131A26', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No photos yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>Document your job site — before photos protect you, after photos impress clients</div>
          <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>📸 Upload First Photo</button>
        </div>
      ) : (
        Object.entries(grouped).sort(([a],[b]) => b.localeCompare(a)).map(([date, dayPhotos]) => (
          <div key={date} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#F1EEE5' }}>
              {format(parseISO(date), 'EEEE, MMMM d, yyyy')} <span style={{ fontSize: 11, color: '#9e9d99', fontWeight: 400 }}>· {dayPhotos.length} photo{dayPhotos.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {dayPhotos.map(photo => {
                const sc = photo.stage ? STAGE_CONFIG[photo.stage] : null
                const job = jobs.find(j => j.id === photo.job_id)
                return (
                  <div key={photo.id} onClick={() => setSelected(photo)} style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: `2px solid ${photo.flagged ? 'rgba(184,50,50,0.3)' : selected?.id === photo.id ? '#0f0f0f' : 'transparent'}`, transition: 'all 0.15s', position: 'relative' }}>
                    <img src={photo.url} alt={photo.caption || 'Job photo'} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                    {sc && (
                      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                        {sc.icon} {sc.label}
                      </div>
                    )}
                    {photo.flagged && <div style={{ position: 'absolute', top: 8, right: 8, background: '#b83232', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>🚩</div>}
                    {photo.caption && (
                      <div style={{ padding: '8px 10px', background: '#131A26', fontSize: 11, color: '#6b6a66', lineHeight: 1.4 }}>{photo.caption}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* LIGHTBOX */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: '#131A26', borderRadius: 20, overflow: 'hidden', maxWidth: 700, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <img src={selected.url} alt={selected.caption || ''} style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain', background: '#131A26' }} />
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    {selected.stage && <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${STAGE_CONFIG[selected.stage]?.color}20`, color: STAGE_CONFIG[selected.stage]?.color, marginBottom: 8, display: 'inline-block' }}>{STAGE_CONFIG[selected.stage]?.icon} {STAGE_CONFIG[selected.stage]?.label}</span>}
                    {selected.caption && <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{selected.caption}</div>}
                    <div style={{ fontSize: 12, color: '#9e9d99', marginTop: 4 }}>
                      {format(parseISO(selected.photo_date || selected.created_at.split('T')[0]), 'MMMM d, yyyy')}
                      {jobs.find(j => j.id === selected.job_id) ? ` · ${jobs.find(j => j.id === selected.job_id)?.title}` : ''}
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, color: '#9e9d99', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={selected.url} download target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: '#131A26', fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none', color: '#F1EEE5' }}>
                    ↓ Download
                  </a>
                  <button onClick={() => toggleFlag(selected.id, selected.flagged)} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: `1px solid ${selected.flagged ? 'rgba(184,50,50,0.2)' : 'rgba(0,0,0,0.1)'}`, background: selected.flagged ? '#fdf0f0' : 'white', color: selected.flagged ? '#b83232' : '#6b6a66', fontFamily: 'inherit' }}>
                    {selected.flagged ? '🚩 Unflag' : '🚩 Flag'}
                  </button>
                  <button onClick={() => deletePhoto(selected.id)} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

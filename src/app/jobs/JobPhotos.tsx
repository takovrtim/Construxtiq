'use client'

import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface Photo {
  id: string
  job_id: string | null
  stage: string
  caption: string | null
  file_url: string
  file_size: number
  taken_at: string
  created_at: string
}

interface Props {
  projectId: string
  jobId?: string
  jobTitle?: string
}

const STAGES = [
  { id: 'pre_work',         label: 'Pre-Work',          icon: '📸', color: '#9e9d99' },
  { id: 'permit_posted',    label: 'Permit Posted',      icon: '📋', color: '#1f5fa6' },
  { id: 'work_started',     label: 'Work Started',       icon: '🔧', color: '#b06e1a' },
  { id: 'rough_inspection', label: 'Rough Inspection',   icon: '🔍', color: '#7F77DD' },
  { id: 'in_progress',      label: 'In Progress',        icon: '⚡', color: '#378ADD' },
  { id: 'final_inspection', label: 'Final Inspection',   icon: '✅', color: '#2d7a4f' },
  { id: 'completed',        label: 'Completed',          icon: '🏁', color: '#F1EEE5' },
  { id: 'issue',            label: 'Issue / Problem',    icon: '⚠️', color: '#b83232' },
  { id: 'other',            label: 'Other',              icon: '📄', color: '#6b6a66' },
]

export function JobPhotos({ projectId, jobId, jobTitle }: Props) {
  const [photos, setPhotos]       = useState<Photo[]>([])
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedStage, setSelectedStage] = useState('in_progress')
  const [caption, setCaption]     = useState('')
  const [lightbox, setLightbox]   = useState<Photo | null>(null)
  const [filterStage, setFilterStage] = useState('all')
  const [toast, setToast]         = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  useEffect(() => { loadPhotos() }, [projectId, jobId])

  async function loadPhotos() {
    setLoading(true)
    const params = new URLSearchParams({ project_id: projectId })
    if (jobId) params.set('job_id', jobId)
    const res = await fetch(`/api/photos?${params}`)
    const json = await res.json()
    if (json.success) setPhotos(json.photos)
    setLoading(false)
  }

  async function uploadPhoto(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)

    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('project_id', projectId)
      if (jobId) fd.append('job_id', jobId)
      fd.append('stage', selectedStage)
      if (caption.trim()) fd.append('caption', caption.trim())

      const res = await fetch('/api/photos', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setPhotos(prev => [json.photo, ...prev])
        msg(`✓ Photo added — ${STAGES.find(s => s.id === selectedStage)?.label}`)
      } else {
        msg('Upload failed — check storage bucket')
      }
    }

    setCaption('')
    setUploading(false)
  }

  async function deletePhoto(id: string) {
    if (!confirm('Delete this photo?')) return
    const res = await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (json.success) {
      setPhotos(prev => prev.filter(p => p.id !== id))
      if (lightbox?.id === id) setLightbox(null)
      msg('Photo deleted')
    }
  }

  const filtered = filterStage === 'all' ? photos : photos.filter(p => p.stage === filterStage)

  // Group by stage for timeline view
  const byStage = STAGES.map(stage => ({
    ...stage,
    photos: photos.filter(p => p.stage === stage.id),
  })).filter(s => s.photos.length > 0)

  return (
    <div>
      {/* Upload section */}
      <div style={{ background: '#f8f7f4', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#F1EEE5' }}>
          📸 Add Photo Proof
        </div>

        {/* Stage selector */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {STAGES.map(s => (
            <button key={s.id} onClick={() => setSelectedStage(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', fontSize: 11, fontWeight: selectedStage === s.id ? 700 : 400, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${selectedStage === s.id ? s.color : 'rgba(0,0,0,0.1)'}`, background: selectedStage === s.id ? `${s.color}15` : 'white', color: selectedStage === s.id ? s.color : '#6b6a66', transition: 'all 0.12s' }}>
              <span>{s.icon}</span><span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Caption input */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#131A26' }}
            placeholder="Optional caption (e.g. 'Panel before upgrade')"
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{ padding: '9px 18px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: uploading ? 'not-allowed' : 'pointer', border: 'none', background: uploading ? '#9e9d99' : '#d95f2b', color: 'white', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >
            {uploading ? '⏳ Uploading...' : '📷 Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => uploadPhoto(e.target.files)}
          />
        </div>
        <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 6 }}>
          Tip: On mobile, tap Upload to take a photo directly from your camera
        </div>
      </div>

      {/* Photos */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {[1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: '1', background: 'rgba(0,0,0,0.06)', borderRadius: 10, animation: 'pulse 1.5s infinite' }} />)}
        </div>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#131A26', borderRadius: 14, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📸</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>No photos yet</div>
          <div style={{ fontSize: 13, color: '#9e9d99' }}>Upload photos to document each stage of the job</div>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setFilterStage('all')} style={{ padding: '5px 12px', fontSize: 12, fontWeight: filterStage === 'all' ? 700 : 400, borderRadius: 20, border: `1.5px solid ${filterStage === 'all' ? '#0f0f0f' : 'rgba(0,0,0,0.1)'}`, background: filterStage === 'all' ? '#0f0f0f' : 'white', color: filterStage === 'all' ? 'white' : '#6b6a66', cursor: 'pointer', fontFamily: 'inherit' }}>
              All ({photos.length})
            </button>
            {byStage.map(s => (
              <button key={s.id} onClick={() => setFilterStage(s.id)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: filterStage === s.id ? 700 : 400, borderRadius: 20, border: `1.5px solid ${filterStage === s.id ? s.color : 'rgba(0,0,0,0.1)'}`, background: filterStage === s.id ? `${s.color}15` : 'white', color: filterStage === s.id ? s.color : '#6b6a66', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{s.icon}</span><span>{s.label} ({s.photos.length})</span>
              </button>
            ))}
          </div>

          {/* Photo grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {filtered.map(photo => {
              const stage = STAGES.find(s => s.id === photo.stage)
              return (
                <div key={photo.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} onClick={() => setLightbox(photo)}>
                  <img src={photo.file_url} alt={photo.caption || stage?.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%)', opacity: 0, transition: 'opacity 0.2s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')} />
                  <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: stage ? `${stage.color}cc` : 'rgba(0,0,0,0.6)', color: 'white' }}>
                      {stage?.icon} {stage?.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <>
          <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%', position: 'relative' }}>
              <img src={lightbox.file_url} alt={lightbox.caption || ''} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }} />

              {/* Info bar */}
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  {lightbox.caption && <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 4 }}>{lightbox.caption}</div>}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {(() => {
                      const stage = STAGES.find(s => s.id === lightbox.stage)
                      return <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: stage ? `${stage.color}cc` : 'rgba(255,255,255,0.2)', color: 'white' }}>{stage?.icon} {stage?.label}</span>
                    })()}
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{format(parseISO(lightbox.created_at), 'MMM d, yyyy · h:mm a')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={lightbox.file_url} download target="_blank" rel="noopener noreferrer" style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: 'rgba(255,255,255,0.15)', color: 'white', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
                    ⬇ Download
                  </a>
                  <button onClick={() => deletePhoto(lightbox.id)} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, background: '#b83232', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete
                  </button>
                </div>
              </div>

              {/* Close */}
              <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: -44, right: 0, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

              {/* Prev/Next */}
              {filtered.length > 1 && (
                <>
                  <button onClick={() => {
                    const idx = filtered.findIndex(p => p.id === lightbox.id)
                    setLightbox(filtered[(idx - 1 + filtered.length) % filtered.length])
                  }} style={{ position: 'absolute', left: -52, top: '40%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                  <button onClick={() => {
                    const idx = filtered.findIndex(p => p.id === lightbox.id)
                    setLightbox(filtered[(idx + 1) % filtered.length])
                  }} style={{ position: 'absolute', right: -52, top: '40%', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

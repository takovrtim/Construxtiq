'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'

interface Document {
  id: string; project_id: string; name: string; file_path: string
  file_type: string; file_size: number; doc_type: string
  status: 'uploading' | 'processing' | 'extracted' | 'needs_review'
  extracted_data: any; ai_notes: string | null
  created_at: string; updated_at: string
}
interface Permit {
  id: string; permit_number: string; permit_type: string
  expiry_date: string | null; issued_date: string | null
  status: string; special_conditions: string[]
  inspector_name: string | null; inspector_phone: string | null
  jurisdiction: string | null; work_description: string | null
}
interface Props {
  user: any; project: any
  initialDocuments: Document[]
  initialPermits: Permit[]
}

const DOC_TYPES = [
  { id: 'permit',     label: 'Permit',      icon: '📋', desc: 'Building, electrical, plumbing permits' },
  { id: 'blueprint',  label: 'Blueprint',   icon: '🏗️', desc: 'Plans, drawings, specs' },
  { id: 'contract',   label: 'Contract',    icon: '📝', desc: 'Agreements, scopes of work' },
  { id: 'inspection', label: 'Inspection',  icon: '🔍', desc: 'Inspection reports, punch lists' },
  { id: 'license',    label: 'License',     icon: '🪪', desc: 'Contractor licenses, certs' },
  { id: 'nda',        label: 'NDA',         icon: '🔒', desc: 'Non-disclosure agreements' },
  { id: 'submittal',  label: 'Submittal',   icon: '📬', desc: 'Shop drawings, product data' },
  { id: 'other',      label: 'Other',       icon: '📄', desc: 'Insurance, bonds, misc' },
]

const STATUS_CONFIG = {
  uploading:    { label: 'Uploading...',   color: '#1f5fa6', bg: '#eef3fb' },
  processing:   { label: 'AI Reading...',  color: '#b06e1a', bg: '#fdf4e3' },
  extracted:    { label: 'AI Complete',    color: '#1a4d31', bg: '#edf5f0' },
  needs_review: { label: 'Needs Review',   color: '#b83232', bg: '#fdf0f0' },
}

const PROCESSING_STEPS = [
  'Reading document...',
  'Detecting document type...',
  'Extracting key dates and deadlines...',
  'Scanning permit conditions...',
  'Checking for compliance flags...',
  'Analyzing scope and specs...',
  'Flagging risks...',
  'Done ✓',
]

function RFIGeneratorPanel({ rfiCandidates, projectId, documentName }: { rfiCandidates: string[]; projectId: string; documentName: string }) {
  const [generating, setGenerating] = useState(false)
  const [rfis, setRFIs]             = useState<any[]>([])
  const [expanded, setExpanded]     = useState(false)
  const [saved, setSaved]           = useState(false)

  async function generate() {
    setGenerating(true)
    try {
      const res = await fetch('/api/document-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_rfis', rfi_candidates: rfiCandidates, project_id: projectId }),
      })
      const json = await res.json()
      if (json.rfis) { setRFIs(json.rfis); setExpanded(true) }
    } catch {}
    setGenerating(false)
  }

  async function saveRFIs() {
    const { supabase: sb } = await import('@/lib/supabase')
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser()
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const deadline = new Date(); deadline.setDate(deadline.getDate() + 7)
    for (let i = 0; i < rfis.length; i++) {
      await (await import('@/lib/supabase')).supabase.from('rfis').insert({
        project_id: projectId, user_id: user.id,
        rfi_number: `RFI-AUTO-${Date.now()}-${i+1}`,
        subject: rfis[i].subject,
        question: rfis[i].question,
        submitted_to: 'GC / Architect',
        submitted_date: today,
        response_needed_by: deadline.toISOString().split('T')[0],
        status: 'open',
      })
    }
    setSaved(true)
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1f5fa6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>📋 RFI Candidates ({rfiCandidates.length})</div>
      <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.2)', borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 12, color: '#0C447C', marginBottom: 10, lineHeight: 1.5 }}>
          The AI found {rfiCandidates.length} question{rfiCandidates.length > 1 ? 's' : ''} in <strong>{documentName}</strong> that need GC or architect answers before work starts.
        </div>
        {!rfis.length ? (
          <button onClick={generate} disabled={generating} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1f5fa6', color: 'white', fontFamily: 'inherit' }}>
            {generating ? '⏳ Generating formal RFIs...' : '✨ Generate Formal RFIs'}
          </button>
        ) : (
          <div>
            {expanded && rfis.map((rfi, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 9, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(31,95,166,0.15)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0C447C', marginBottom: 4 }}>{rfi.subject}</div>
                <div style={{ fontSize: 11, color: '#1f5fa6', marginBottom: 6, lineHeight: 1.4 }}>{rfi.question}</div>
                {rfi.impact_if_unanswered && (
                  <div style={{ fontSize: 10, color: '#b83232', fontWeight: 600 }}>⚠️ Impact: {rfi.impact_if_unanswered}</div>
                )}
              </div>
            ))}
            {!saved ? (
              <button onClick={saveRFIs} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                Save {rfis.length} RFIs to RFI Tracker →
              </button>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2d7a4f' }}>✓ Saved to RFI Tracker</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function DocumentsClient({ user, project, initialDocuments, initialPermits }: Props) {
  const [documents, setDocuments]   = useState<Document[]>(initialDocuments)
  const [permits, setPermits]       = useState<Permit[]>(initialPermits)
  const [selected, setSelected]     = useState<Document | null>(null)
  const [activeTab, setActiveTab]   = useState<'all' | string>('all')
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [processingDoc, setProcessingDoc]   = useState<string | null>(null)
  const [toast, setToast]           = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 4000) }

  const today = new Date()
  const expiringPermits = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) <= 30 && !isPast(parseISO(p.expiry_date)))
  const expiredPermits  = permits.filter(p => p.expiry_date && isPast(parseISO(p.expiry_date)))
  const filteredDocs    = activeTab === 'all' ? documents : documents.filter(d => d.doc_type === activeTab)

  async function uploadFile(file: File, docType: string) {
    if (!project) { msg('Create a project first'); return }
    if (file.size > 50 * 1024 * 1024) { msg('File too large — max 50MB'); return }

    setUploading(true)
    msg('Uploading...')

    try {
      // Upload to Supabase storage
      const ext      = file.name.split('.').pop()
      const filePath = `${project.id}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file)
      if (upErr) throw upErr

      // Create document record
      const { data: doc, error: docErr } = await supabase.from('documents').insert({
        project_id: project.id, user_id: user.id,
        name: file.name, file_path: filePath,
        file_type: file.type, file_size: file.size,
        doc_type: docType, status: 'processing',
      }).select().single()
      if (docErr || !doc) throw docErr

      setDocuments(prev => [doc as Document, ...prev])
      setProcessingDoc(doc.id)
      setUploading(false)
      msg('✓ Uploaded — AI is reading now...')

      // Animate processing steps
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setProcessingStep(PROCESSING_STEPS[i])
        await new Promise(r => setTimeout(r, 900))
      }

      // Trigger AI parse
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: doc.id, project_id: project.id }),
      })
      const json = await res.json()

      if (json.success) {
        // Refresh document
        const { data: updated } = await supabase.from('documents').select('*').eq('id', doc.id).single()
        if (updated) {
          setDocuments(prev => prev.map(d => d.id === doc.id ? updated as Document : d))
          setSelected(updated as Document)
        }
        // Refresh permits
        const { data: newPermits } = await supabase.from('permits').select('*').eq('project_id', project.id)
        if (newPermits) setPermits(newPermits as Permit[])
        msg('✓ AI extraction complete!')
      } else {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'needs_review' } : d))
        msg('AI extraction failed — review manually')
      }
    } catch (err: any) {
      msg(`Upload failed: ${err.message || 'Unknown error'}`)
    }

    setProcessingDoc(null)
    setProcessingStep('')
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file, 'other')
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return
    await supabase.from('documents').delete().eq('id', id)
    setDocuments(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
    msg('Deleted')
  }

  async function reprocess(doc: Document) {
    setProcessingDoc(doc.id)
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d))
    for (let i = 0; i < PROCESSING_STEPS.length; i++) {
      setProcessingStep(PROCESSING_STEPS[i])
      await new Promise(r => setTimeout(r, 700))
    }
    const res = await fetch('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: doc.id, project_id: project.id }),
    })
    const json = await res.json()
    if (json.success) {
      const { data: updated } = await supabase.from('documents').select('*').eq('id', doc.id).single()
      if (updated) { setDocuments(prev => prev.map(d => d.id === doc.id ? updated as Document : d)); setSelected(updated as Document) }
      msg('✓ Re-processed!')
    }
    setProcessingDoc(null); setProcessingStep('')
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Create a project first</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Go to dashboard →</a>
    </div>
  )

  const ed = selected?.extracted_data

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Document Intelligence</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Upload any document — AI reads it and extracts what matters</div>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {uploading ? 'Uploading...' : '+ Upload Document'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'other'); e.target.value = '' }} />
      </div>

      {/* PERMIT ALERTS */}
      {(expiringPermits.length > 0 || expiredPermits.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {expiredPermits.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, borderLeft: '3px solid #b83232' }}>
              <span style={{ fontSize: 18 }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#6e1a1a' }}>EXPIRED: {p.permit_number} — {p.permit_type}</div>
                <div style={{ fontSize: 11, color: '#b83232' }}>Expired {format(parseISO(p.expiry_date!), 'MMM d, yyyy')} — work may be stopped</div>
              </div>
            </div>
          ))}
          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date!), today)
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: days <= 7 ? '#fdf0f0' : '#fdf4e3', border: `1px solid ${days <= 7 ? 'rgba(184,50,50,0.2)' : 'rgba(176,110,26,0.2)'}`, borderRadius: 12, borderLeft: `3px solid ${days <= 7 ? '#b83232' : '#b06e1a'}` }}>
                <span style={{ fontSize: 18 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: days <= 7 ? '#6e1a1a' : '#6b4010' }}>{p.permit_number} expires in {days} day{days !== 1 ? 's' : ''}</div>
                  <div style={{ fontSize: 11, color: days <= 7 ? '#b83232' : '#b06e1a' }}>{p.permit_type} · Renew immediately</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: days <= 7 ? '#b83232' : '#b06e1a' }}>{format(parseISO(p.expiry_date!), 'MMM d')}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Docs', value: documents.length, icon: '🗂️' },
          { label: 'AI Extracted', value: documents.filter(d => d.status === 'extracted').length, icon: '✅' },
          { label: 'Active Permits', value: permits.filter(p => p.status === 'active').length, icon: '📋' },
          { label: 'Needs Review', value: documents.filter(d => d.status === 'needs_review').length, icon: '⚠️' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>{s.icon}</span>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.4fr' : '1fr', gap: 16 }}>

        {/* LEFT — DOC LIST */}
        <div>
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${dragOver ? '#d95f2b' : 'var(--border)'}`, borderRadius: 14, padding: '20px', marginBottom: 16, textAlign: 'center', cursor: 'pointer', background: dragOver ? '#fdf0e8' : 'var(--surface)', transition: 'all 0.15s' }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: dragOver ? '#d95f2b' : 'var(--text-primary)', marginBottom: 3 }}>Drop any document here</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>PDF, PNG, JPG up to 50MB · Permits, blueprints, contracts, licenses, NDAs</div>
          </div>

          {/* Doc type filter tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <button onClick={() => setActiveTab('all')} style={{ padding: '5px 12px', fontSize: 11, fontWeight: activeTab === 'all' ? 700 : 400, borderRadius: 20, border: `1px solid ${activeTab === 'all' ? '#0f0f0f' : 'var(--border)'}`, background: activeTab === 'all' ? '#0f0f0f' : 'var(--surface)', color: activeTab === 'all' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
              All ({documents.length})
            </button>
            {DOC_TYPES.map(t => {
              const count = documents.filter(d => d.doc_type === t.id).length
              if (count === 0) return null
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: activeTab === t.id ? 700 : 400, borderRadius: 20, border: `1px solid ${activeTab === t.id ? '#0f0f0f' : 'var(--border)'}`, background: activeTab === t.id ? '#0f0f0f' : 'var(--surface)', color: activeTab === t.id ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.icon} {t.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Processing indicator */}
          {processingDoc && (
            <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 20, height: 20, border: '2px solid #1f5fa6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0C447C' }}>AI Reading Document</div>
                <div style={{ fontSize: 11, color: '#1f5fa6' }}>{processingStep}</div>
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Doc list */}
          {filteredDocs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗂️</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No documents yet</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16, maxWidth: 300, margin: '0 auto 16px' }}>
                Upload a permit, blueprint, contract, or license. The AI reads it and extracts everything that matters.
              </div>
              <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Upload First Document</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredDocs.map(doc => {
                const sc = STATUS_CONFIG[doc.status]
                const dt = DOC_TYPES.find(t => t.id === doc.doc_type)
                const isSelected = selected?.id === doc.id
                const isProcessing = processingDoc === doc.id
                return (
                  <div key={doc.id} onClick={() => setSelected(isSelected ? null : doc)} style={{ background: 'var(--surface)', border: `1.5px solid ${isSelected ? '#0f0f0f' : 'var(--border)'}`, borderRadius: 12, padding: '13px 16px', cursor: 'pointer', transition: 'border-color 0.1s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {dt?.icon || '📄'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{doc.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color }}>
                            {isProcessing ? processingStep || sc.label : sc.label}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{dt?.label || 'Document'}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{format(parseISO(doc.created_at), 'MMM d')}</span>
                        </div>
                      </div>
                      {doc.status === 'extracted' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d7a4f', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — AI EXTRACTION PANEL */}
        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '80vh', position: 'sticky', top: 0 }}>
            {/* Panel header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  {DOC_TYPES.find(t => t.id === selected.doc_type)?.label} · {(selected.file_size / 1024).toFixed(0)}KB
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {selected.status !== 'processing' && (
                  <button onClick={() => reprocess(selected)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                    Re-read
                  </button>
                )}
                <button onClick={() => deleteDoc(selected.id)} style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
                  Delete
                </button>
                <button onClick={() => setSelected(null)} style={{ padding: '5px 10px', fontSize: 13, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-tertiary)', fontFamily: 'inherit' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {selected.status === 'processing' && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #1f5fa6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>AI is reading this document</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{processingStep}</div>
                </div>
              )}

              {selected.status === 'extracted' && ed && (
                <>
                  {/* AI NOTES — the summary */}
                  {selected.ai_notes && (
                    <div style={{ background: '#0f0f0f', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>✨ AI Summary</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{selected.ai_notes}</div>
                    </div>
                  )}

                  {/* ACTION ITEMS */}
                  {ed.action_items && ed.action_items.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#b83232', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚡ Do These Now</div>
                      <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                        {ed.action_items.map((item: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < ed.action_items.length - 1 ? 8 : 0, fontSize: 12, color: '#6e1a1a', lineHeight: 1.5 }}>
                            <span style={{ flexShrink: 0, fontWeight: 700, color: '#b83232' }}>{i+1}.</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RFI CANDIDATES — generate with one tap */}
                  {ed.rfi_candidates && ed.rfi_candidates.length > 0 && (
                    <RFIGeneratorPanel
                      rfiCandidates={ed.rfi_candidates}
                      projectId={project.id}
                      documentName={selected.name}
                    />
                  )}

                  {/* FLAGS — most important */}
                  {ed.flags && ed.flags.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Flags</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {ed.flags.map((flag: any, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: flag.severity === 'critical' ? '#fdf0f0' : flag.severity === 'warning' ? '#fdf4e3' : '#eef3fb', border: `1px solid ${flag.severity === 'critical' ? 'rgba(184,50,50,0.2)' : flag.severity === 'warning' ? 'rgba(176,110,26,0.2)' : 'rgba(31,95,166,0.2)'}` }}>
                            <span style={{ fontSize: 14, flexShrink: 0 }}>{flag.severity === 'critical' ? '🚨' : flag.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <span style={{ fontSize: 12, color: flag.severity === 'critical' ? '#6e1a1a' : flag.severity === 'warning' ? '#6b4010' : '#0C447C', lineHeight: 1.5 }}>{flag.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KEY DATES */}
                  {(ed.expiry_date || ed.issued_date || ed.start_date || ed.completion_date || ed.approved_plans_date) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Key Dates</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          { label: 'Issued', value: ed.issued_date },
                          { label: 'Expires', value: ed.expiry_date, warn: true },
                          { label: 'Start', value: ed.start_date },
                          { label: 'Completion', value: ed.completion_date },
                          { label: 'Plans Approved', value: ed.approved_plans_date },
                        ].filter(d => d.value).map(d => {
                          const daysLeft = d.value ? differenceInDays(parseISO(d.value), today) : null
                          const isExpired = daysLeft !== null && daysLeft < 0
                          const isUrgent  = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14
                          return (
                            <div key={d.label} style={{ background: isExpired ? '#fdf0f0' : isUrgent && d.warn ? '#fdf4e3' : 'var(--surface-2)', borderRadius: 9, padding: '10px 12px', border: `1px solid ${isExpired ? 'rgba(184,50,50,0.2)' : isUrgent && d.warn ? 'rgba(176,110,26,0.2)' : 'var(--border)'}` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{d.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: isExpired ? '#b83232' : isUrgent && d.warn ? '#b06e1a' : 'var(--text-primary)' }}>
                                {format(parseISO(d.value), 'MMM d, yyyy')}
                              </div>
                              {d.warn && daysLeft !== null && (
                                <div style={{ fontSize: 10, color: isExpired ? '#b83232' : '#b06e1a', marginTop: 2 }}>
                                  {isExpired ? `${Math.abs(daysLeft)}d expired` : `${daysLeft}d left`}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* PERMIT DETAILS */}
                  {(ed.permit_number || ed.permit_type || ed.contractor_license) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Permit Details</div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px' }}>
                        {[
                          { label: 'Permit Number', value: ed.permit_number },
                          { label: 'Permit Type',   value: ed.permit_type   },
                          { label: 'Jurisdiction',  value: ed.jurisdiction  },
                          { label: 'License',       value: ed.contractor_license },
                          { label: 'Valuation',     value: ed.valuation ? `$${Number(ed.valuation).toLocaleString()}` : null },
                          { label: 'Sq Footage',    value: ed.sq_footage ? `${Number(ed.sq_footage).toLocaleString()} sqft` : null },
                          { label: 'Inspector',     value: ed.inspector_name },
                          { label: 'Inspector Ph',  value: ed.inspector_phone },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{f.label}</span>
                            <span style={{ fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPECIAL CONDITIONS */}
                  {ed.special_conditions && ed.special_conditions.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#b06e1a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚠️ Special Conditions</div>
                      <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        {ed.special_conditions.map((c: string, i: number) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < ed.special_conditions.length - 1 ? 8 : 0, fontSize: 12, color: '#6b4010', lineHeight: 1.5 }}>
                            <span style={{ flexShrink: 0, color: '#b06e1a', fontWeight: 700 }}>{i+1}.</span>
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* BLUEPRINT ANALYSIS */}
                  {(ed.what_to_add || ed.code_issues || ed.safety_flags || ed.cost_saving_opportunities) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Blueprint Analysis</div>
                      {ed.safety_flags?.length > 0 && (
                        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#b83232', marginBottom: 6 }}>🚨 Safety Flags</div>
                          {ed.safety_flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#6e1a1a', marginBottom: 4, lineHeight: 1.4 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.code_issues?.length > 0 && (
                        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#b06e1a', marginBottom: 6 }}>⚠️ Code Issues</div>
                          {ed.code_issues.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#6b4010', marginBottom: 4, lineHeight: 1.4 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.what_to_add?.length > 0 && (
                        <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1f5fa6', marginBottom: 6 }}>➕ Should Be Added</div>
                          {ed.what_to_add.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#0C447C', marginBottom: 4, lineHeight: 1.4 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.cost_saving_opportunities?.length > 0 && (
                        <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', marginBottom: 6 }}>💰 Cost Savings</div>
                          {ed.cost_saving_opportunities.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#1a4d31', marginBottom: 4, lineHeight: 1.4 }}>• {f}</div>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* CONTRACT DETAILS */}
                  {(ed.contract_value || ed.payment_terms || ed.retention_pct || ed.scope_of_work_summary) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contract Details</div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px' }}>
                        {[
                          { label: 'Contract Value',  value: ed.contract_value ? `$${Number(ed.contract_value).toLocaleString()}` : null },
                          { label: 'Payment Terms',   value: ed.payment_terms },
                          { label: 'Retention',       value: ed.retention_pct ? `${ed.retention_pct}%` : null },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-tertiary)' }}>{f.label}</span>
                            <span style={{ fontWeight: 700 }}>{f.value}</span>
                          </div>
                        ))}
                        {ed.scope_of_work_summary && (
                          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-tertiary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>Scope</div>
                            {ed.scope_of_work_summary}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PENALTY CLAUSES */}
                  {ed.penalty_clauses && ed.penalty_clauses.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#b83232', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>🚨 Penalty Clauses</div>
                      <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                        {ed.penalty_clauses.map((c: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: '#6e1a1a', marginBottom: 6, lineHeight: 1.5 }}>• {c}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* LICENSE DETAILS */}
                  {ed.license_number && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>License Details</div>
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px' }}>
                        {[
                          { label: 'License Number', value: ed.license_number },
                          { label: 'License Type',   value: ed.license_type   },
                          { label: 'Holder',         value: ed.license_holder },
                          { label: 'Issued',         value: ed.issued_date    },
                          { label: 'Expires',        value: ed.expiry_date    },
                          { label: 'State',          value: ed.state          },
                        ].filter(f => f.value).map(f => (
                          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-tertiary)' }}>{f.label}</span>
                            <span style={{ fontWeight: 700 }}>{f.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* INSPECTION RESULTS */}
                  {(ed.items_passed || ed.items_failed || ed.corrections_required) && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Inspection Results</div>
                      {ed.items_failed?.length > 0 && (
                        <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#b83232', marginBottom: 6 }}>Failed Items</div>
                          {ed.items_failed.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#6e1a1a', marginBottom: 3 }}>✗ {f}</div>)}
                        </div>
                      )}
                      {ed.corrections_required?.length > 0 && (
                        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#b06e1a', marginBottom: 6 }}>Corrections Required</div>
                          {ed.corrections_required.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#6b4010', marginBottom: 3 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.items_passed?.length > 0 && (
                        <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', marginBottom: 6 }}>Passed Items</div>
                          {ed.items_passed.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#1a4d31', marginBottom: 3 }}>✓ {f}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {selected.status === 'needs_review' && (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>AI couldn't fully read this</div>
                  <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                    {selected.ai_notes || 'Try re-uploading as a clearer PDF or image. Blurry scans and unusual formats are hard for the AI to read.'}
                  </div>
                  <button onClick={() => reprocess(selected)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>Try Again</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxWidth: 320 }}>{toast}</div>}
    </>
  )
}

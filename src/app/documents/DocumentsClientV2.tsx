'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'
import { Upload, FileText, Shield, AlertTriangle, CheckCircle, Clock, ChevronRight, X, RefreshCw, Download, Zap } from 'lucide-react'

interface Doc {
  id: string; project_id: string; name: string; file_path: string
  file_type: string; file_size: number; doc_type: string
  status: 'uploading' | 'processing' | 'extracted' | 'needs_review'
  extracted_data: any; ai_notes: string | null; created_at: string
}
interface Permit {
  id: string; permit_number: string; permit_type: string
  expiry_date: string | null; issued_date: string | null
  status: string; special_conditions: any[]; inspector_name: string | null
  inspector_phone: string | null; jurisdiction: string | null
}
interface Props {
  user: any; project: any
  initialDocuments: Doc[]
  initialPermits: Permit[]
}

const DOC_TYPES = [
  { id: 'permit',     label: 'Permit',      Icon: Shield,      desc: 'Building, electrical, plumbing', color: '#ea580c' },
  { id: 'blueprint',  label: 'Blueprint',   Icon: FileText,    desc: 'Plans, drawings, specs',          color: '#3b82f6' },
  { id: 'contract',   label: 'Contract',    Icon: FileText,    desc: 'Agreements, SOW',                 color: '#8b5cf6' },
  { id: 'nda',        label: 'NDA',         Icon: Shield,      desc: 'Non-disclosure',                  color: '#6b7280' },
  { id: 'license',    label: 'License',     Icon: CheckCircle, desc: 'Contractor licenses',             color: '#22c55e' },
  { id: 'inspection', label: 'Inspection',  Icon: AlertTriangle, desc: 'Reports, punch lists',          color: '#f59e0b' },
  { id: 'insurance',  label: 'Insurance',   Icon: Shield,      desc: 'COIs, certificates',              color: '#06b6d4' },
  { id: 'other',      label: 'Other',       Icon: FileText,    desc: 'Any construction doc',            color: '#9ca3af' },
]

const STEPS = [
  'Reading document...', 'Detecting type...', 'Extracting dates & deadlines...',
  'Scanning conditions...', 'Checking compliance...', 'Flagging risks...', 'Complete ✓',
]

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string }> = {
    uploading:    { label: 'Uploading',  color: '#3b82f6', bg: '#eff6ff' },
    processing:   { label: 'AI Reading', color: '#f59e0b', bg: '#fffbeb' },
    extracted:    { label: 'Complete',   color: '#22c55e', bg: '#f0fdf4' },
    needs_review: { label: 'Review',     color: '#ef4444', bg: '#fef2f2' },
  }
  const c = cfg[status] || cfg.needs_review
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13, gap: 16 }}>
      <span style={{ color: '#6b7280', flexShrink: 0, fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent || '#111827', textAlign: 'right', wordBreak: 'break-word' }}>{value}</span>
    </div>
  )
}

function FlagCard({ message, severity }: { message: string; severity: string }) {
  const crit = severity === 'critical'
  const warn = severity === 'warning'
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 6, background: crit ? '#fef2f2' : warn ? '#fffbeb' : '#eff6ff', border: `1px solid ${crit ? '#fecaca' : warn ? '#fde68a' : '#bfdbfe'}` }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{crit ? '🚨' : warn ? '⚠️' : 'ℹ️'}</span>
      <span style={{ fontSize: 12, color: crit ? '#991b1b' : warn ? '#92400e' : '#1e40af', lineHeight: 1.5 }}>{message}</span>
    </div>
  )
}

export function DocumentsClient({ user, project, initialDocuments, initialPermits }: Props) {
  const [docs, setDocs]         = useState<Doc[]>(initialDocuments)
  const [permits, setPermits]   = useState<Permit[]>(initialPermits)
  const [selected, setSelected] = useState<Doc | null>(null)
  const [filter, setFilter]     = useState('all')
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [step, setStep]         = useState('')
  const [toast, setToast]       = useState('')
  const [genRFIs, setGenRFIs]   = useState(false)
  const [rfis, setRFIs]         = useState<any[]>([])
  const [rfisSaved, setRFIsSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 4000) }

  const today = new Date()
  const expiringPermits = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) <= 30 && !isPast(parseISO(p.expiry_date)))
  const expiredPermits  = permits.filter(p => p.expiry_date && isPast(parseISO(p.expiry_date)))
  const filtered = filter === 'all' ? docs : docs.filter(d => d.doc_type === filter)
  const ed = selected?.extracted_data

  async function uploadAndProcess(file: File) {
    if (!project) { msg('Create a project first'); return }
    if (file.size > 50 * 1024 * 1024) { msg('File too large — max 50MB'); return }
    setUploading(true)
    msg('Uploading...')
    try {
      const filePath = `${project.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('documents').upload(filePath, file)
      if (upErr) throw new Error(upErr.message)
      const { data: doc, error: docErr } = await supabase.from('documents').insert({
        project_id: project.id, user_id: user.id,
        name: file.name, file_path: filePath,
        file_type: file.type, file_size: file.size,
        doc_type: 'other', status: 'processing',
      }).select().single()
      if (docErr || !doc) throw new Error('Failed to create record')
      const newDoc = doc as Doc
      setDocs(prev => [newDoc, ...prev])
      setSelected(newDoc)
      setUploading(false)
      setProcessing(newDoc.id)
      for (let i = 0; i < STEPS.length - 1; i++) {
        setStep(STEPS[i])
        await new Promise(r => setTimeout(r, 900))
      }
      const res = await fetch('/api/parse-document', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: newDoc.id, project_id: project.id }),
      })
      const json = await res.json()
      setStep(STEPS[STEPS.length - 1])
      if (json.success) {
        const { data: updated } = await supabase.from('documents').select('*').eq('id', newDoc.id).single()
        if (updated) { setDocs(prev => prev.map(d => d.id === newDoc.id ? updated as Doc : d)); setSelected(updated as Doc) }
        const { data: newPermits } = await supabase.from('permits').select('*').eq('project_id', project.id)
        if (newPermits) setPermits(newPermits as Permit[])
        msg('✓ AI extraction complete')
      } else {
        setDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'needs_review' } : d))
        msg('AI could not read — try a clearer file')
      }
    } catch (err: any) { msg(`Upload failed: ${err.message}`); setUploading(false) }
    setProcessing(null); setStep('')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadAndProcess(file)
  }, [project])

  async function generateRFIsFromBlueprint() {
    const candidates = ed?.rfi_candidates || ed?.scope_gaps
    if (!candidates?.length) return
    setGenRFIs(true)
    try {
      const res = await fetch('/api/document-intelligence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_rfis', rfi_candidates: candidates, project_id: project.id }),
      })
      const json = await res.json()
      if (json.rfis?.length) { setRFIs(json.rfis); msg(`✓ ${json.rfis.length} RFIs generated`) }
    } catch { msg('Failed') }
    setGenRFIs(false)
  }

  async function saveRFIs() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const deadline = new Date(); deadline.setDate(deadline.getDate() + 7)
    for (let i = 0; i < rfis.length; i++) {
      await supabase.from('rfis').insert({
        project_id: project.id, user_id: authUser.id,
        rfi_number: `RFI-AI-${Date.now().toString().slice(-4)}-${i+1}`,
        subject: rfis[i].subject, question: rfis[i].question,
        submitted_to: 'GC / Architect', submitted_date: today.toISOString().split('T')[0],
        response_needed_by: deadline.toISOString().split('T')[0], status: 'open',
      })
    }
    setRFIsSaved(true); msg(`✓ ${rfis.length} RFIs saved`)
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return
    const doc = docs.find(d => d.id === id)
    if (doc?.file_path) await supabase.storage.from('documents').remove([doc.file_path])
    await supabase.from('documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    if (selected?.id === id) setSelected(null)
    msg('Deleted')
  }

  async function reprocess(doc: Doc) {
    setProcessing(doc.id)
    await supabase.from('documents').update({ status: 'processing' }).eq('id', doc.id)
    setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'processing' } : d))
    for (let i = 0; i < STEPS.length - 1; i++) { setStep(STEPS[i]); await new Promise(r => setTimeout(r, 700)) }
    const res = await fetch('/api/parse-document', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: doc.id, project_id: project.id }),
    })
    const json = await res.json()
    if (json.success) {
      const { data: updated } = await supabase.from('documents').select('*').eq('id', doc.id).single()
      if (updated) { setDocs(prev => prev.map(d => d.id === doc.id ? updated as Doc : d)); setSelected(updated as Doc) }
      msg('✓ Re-processed')
    }
    setProcessing(null); setStep('')
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Create a project first</div>
      <a href="/dashboard" style={{ color: '#ea580c', textDecoration: 'none', fontSize: 14 }}>Go to dashboard →</a>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '380px 1fr' : '1fr', gap: 20, alignItems: 'start', minHeight: 'calc(100vh - 200px)' }}>

      {/* LEFT — Upload + List */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Document Intelligence</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>AI reads permits, blueprints, contracts, licenses, NDAs</div>
          </div>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#ea580c', color: 'white', fontFamily: 'inherit' }}>
            <Upload size={14} />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" capture="environment" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndProcess(f); e.target.value = '' }} />
        </div>

        {/* Permit alerts */}
        {(expiredPermits.length > 0 || expiringPermits.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {expiredPermits.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '3px solid #ef4444', borderRadius: 10 }}>
                <span style={{ fontSize: 18 }}>🚨</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>EXPIRED: {p.permit_number}</div>
                  <div style={{ fontSize: 11, color: '#ef4444' }}>{format(parseISO(p.expiry_date!), 'MMM d, yyyy')} — renew immediately</div>
                </div>
              </div>
            ))}
            {expiringPermits.map(p => {
              const days = differenceInDays(parseISO(p.expiry_date!), today)
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderLeft: `3px solid ${days <= 7 ? '#ef4444' : '#f59e0b'}`, borderRadius: 10 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{p.permit_number} — {days} day{days !== 1 ? 's' : ''} left</div>
                    <div style={{ fontSize: 11, color: '#f59e0b' }}>{p.permit_type} · {format(parseISO(p.expiry_date!), 'MMM d, yyyy')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Documents', value: docs.length },
            { label: 'AI Complete', value: docs.filter(d => d.status === 'extracted').length },
            { label: 'Active Permits', value: permits.filter(p => p.status === 'active').length },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Processing indicator */}
        {processing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, marginBottom: 12 }}>
            <div style={{ width: 16, height: 16, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>AI Reading Document</div>
              <div style={{ fontSize: 11, color: '#3b82f6' }}>{step}</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#ea580c' : '#e5e7eb'}`, borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: dragOver ? '#fff7ed' : 'white', transition: 'all 0.15s', marginBottom: 16 }}
        >
          <Upload size={24} color={dragOver ? '#ea580c' : '#9ca3af'} style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: dragOver ? '#ea580c' : '#374151', marginBottom: 4 }}>
            Drop any document or tap to upload
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>PDF, PNG, JPG · Permits, blueprints, contracts, NDAs, licenses, inspections</div>
        </div>

        {/* Filter tabs */}
        {docs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', fontSize: 11, fontWeight: filter === 'all' ? 700 : 400, borderRadius: 20, border: `1px solid ${filter === 'all' ? '#111827' : '#e5e7eb'}`, background: filter === 'all' ? '#111827' : 'white', color: filter === 'all' ? 'white' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              All ({docs.length})
            </button>
            {DOC_TYPES.map(t => {
              const count = docs.filter(d => d.doc_type === t.id).length
              if (!count) return null
              return (
                <button key={t.id} onClick={() => setFilter(t.id)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: filter === t.id ? 700 : 400, borderRadius: 20, border: `1px solid ${filter === t.id ? '#111827' : '#e5e7eb'}`, background: filter === t.id ? '#111827' : 'white', color: filter === t.id ? 'white' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t.label} ({count})
                </button>
              )
            })}
          </div>
        )}

        {/* Doc list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'white', borderRadius: 14, border: '2px dashed #e5e7eb' }}>
            <FileText size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#111827' }}>No documents yet</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
              Upload a permit — AI reads it, extracts the expiry date, special conditions, inspector contact, and creates an alert automatically.
            </div>
            <button onClick={() => fileRef.current?.click()} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#ea580c', color: 'white', fontFamily: 'inherit' }}>
              + Upload First Document
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(doc => {
              const dt = DOC_TYPES.find(t => t.id === doc.doc_type)
              const isProc = processing === doc.id
              const isSel  = selected?.id === doc.id
              return (
                <div key={doc.id} onClick={() => setSelected(isSel ? null : doc)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isSel ? '#fff7ed' : 'white', border: `1.5px solid ${isSel ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, cursor: 'pointer', transition: 'all 0.1s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${dt?.color || '#9ca3af'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {dt ? <dt.Icon size={16} color={dt.color} /> : <FileText size={16} color="#9ca3af" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3, color: '#111827' }}>{doc.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusBadge status={isProc ? 'processing' : doc.status} />
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{format(parseISO(doc.created_at), 'MMM d')}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="#d1d5db" />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RIGHT — AI Extraction Panel */}
      {selected && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 20, maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Panel header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: '#f9fafb' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827' }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{(selected.file_size / 1024).toFixed(0)}KB · {DOC_TYPES.find(t => t.id === selected.doc_type)?.label}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {selected.status !== 'processing' && (
                <button onClick={() => reprocess(selected)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontFamily: 'inherit' }}>
                  <RefreshCw size={11} />Re-read
                </button>
              )}
              <button onClick={() => deleteDoc(selected.id)} style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontFamily: 'inherit' }}>Delete</button>
              <button onClick={() => setSelected(null)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', border: '1px solid #e5e7eb', background: 'white', color: '#6b7280' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

            {selected.status === 'processing' && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ width: 40, height: 40, border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>AI is reading this document</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{step}</div>
              </div>
            )}

            {selected.status === 'needs_review' && (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Couldn't fully read this</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>{selected.ai_notes || 'Upload a clearer PDF or higher-resolution image.'}</div>
                <button onClick={() => reprocess(selected)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#ea580c', color: 'white', fontFamily: 'inherit' }}>Try Again</button>
              </div>
            )}

            {selected.status === 'extracted' && ed && (
              <div>
                {/* AI Summary */}
                {selected.ai_notes && (
                  <div style={{ background: '#000', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>✨ AI Summary</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{selected.ai_notes}</div>
                  </div>
                )}

                {/* Action items - DO THESE NOW */}
                {ed.action_items?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚡ Do These Now</div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px' }}>
                      {ed.action_items.map((item: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.5, marginBottom: i < ed.action_items.length - 1 ? 8 : 0 }}>{i+1}. {item}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flags */}
                {ed.flags?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Flags</div>
                    {ed.flags.map((f: any, i: number) => <FlagCard key={i} message={f.message} severity={f.severity} />)}
                  </div>
                )}

                {/* Key dates */}
                {(ed.expiry_date || ed.issued_date || ed.start_date || ed.completion_date) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Key Dates</div>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 12px' }}>
                      {[
                        { label: 'Issued', value: ed.issued_date },
                        { label: 'Expires', value: ed.expiry_date, warn: true },
                        { label: 'Start', value: ed.start_date },
                        { label: 'Completion', value: ed.completion_date },
                      ].filter(d => d.value).map(d => {
                        const daysLeft = d.value ? differenceInDays(parseISO(d.value), today) : null
                        const expired  = daysLeft !== null && daysLeft < 0
                        const urgent   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && d.warn
                        return (
                          <InfoRow key={d.label} label={d.label}
                            value={`${format(parseISO(d.value!), 'MMM d, yyyy')}${daysLeft !== null && d.warn ? ` · ${expired ? `${Math.abs(daysLeft)}d expired` : `${daysLeft}d left`}` : ''}`}
                            accent={expired ? '#ef4444' : urgent ? '#f59e0b' : undefined}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Permit details */}
                {(ed.permit_number || ed.jurisdiction || ed.inspector_name) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Permit Details</div>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 12px' }}>
                      {[
                        { label: 'Number', value: ed.permit_number },
                        { label: 'Type', value: ed.permit_type },
                        { label: 'Jurisdiction', value: ed.jurisdiction },
                        { label: 'Inspector', value: ed.inspector_name },
                        { label: 'Phone', value: ed.inspector_phone },
                        { label: 'License', value: ed.contractor_license },
                        { label: 'Valuation', value: ed.valuation ? `$${Number(ed.valuation).toLocaleString()}` : null },
                      ].filter(f => f.value).map(f => <InfoRow key={f.label} label={f.label} value={f.value!} />)}
                    </div>
                  </div>
                )}

                {/* Special conditions */}
                {ed.special_conditions?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>⚠️ Special Conditions</div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 14px' }}>
                      {ed.special_conditions.map((c: string, i: number) => (
                        <div key={i} style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5, marginBottom: i < ed.special_conditions.length - 1 ? 8 : 0 }}>{i+1}. {c}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Blueprint analysis */}
                {(ed.safety_flags?.length || ed.code_issues?.length || ed.what_to_add?.length) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Blueprint Analysis</div>
                    {ed.safety_flags?.length > 0 && (
                      <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>🚨 Safety Flags</div>
                        {ed.safety_flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#991b1b', marginBottom: 3 }}>• {f}</div>)}
                      </div>
                    )}
                    {ed.code_issues?.length > 0 && (
                      <div style={{ background: '#fffbeb', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>⚠️ Code Issues</div>
                        {ed.code_issues.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 3 }}>• {f}</div>)}
                      </div>
                    )}
                    {ed.what_to_add?.length > 0 && (
                      <div style={{ background: '#eff6ff', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>➕ Missing Items</div>
                        {ed.what_to_add.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#1e40af', marginBottom: 3 }}>• {f}</div>)}
                      </div>
                    )}
                    {ed.cost_saving_opportunities?.length > 0 && (
                      <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 6 }}>💰 Cost Savings</div>
                        {ed.cost_saving_opportunities.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#166534', marginBottom: 3 }}>• {f}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* Contract details */}
                {(ed.contract_value || ed.payment_terms || ed.penalty_clauses?.length) && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Contract Details</div>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 12px' }}>
                      {[
                        { label: 'Value', value: ed.contract_value ? `$${Number(ed.contract_value).toLocaleString()}` : null },
                        { label: 'Payment', value: ed.payment_terms },
                        { label: 'Retention', value: ed.retention_pct ? `${ed.retention_pct}%` : null },
                        { label: 'Notice Period', value: ed.notice_requirements },
                        { label: 'Warranty', value: ed.warranty_period },
                      ].filter(f => f.value).map(f => <InfoRow key={f.label} label={f.label} value={f.value!} />)}
                    </div>
                    {ed.penalty_clauses?.length > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>🚨 Penalty Clauses</div>
                        {ed.penalty_clauses.map((c: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#991b1b', marginBottom: 4 }}>• {c}</div>)}
                      </div>
                    )}
                  </div>
                )}

                {/* License details */}
                {ed.license_number && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>License Details</div>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '4px 12px' }}>
                      {[
                        { label: 'Number', value: ed.license_number },
                        { label: 'Type', value: ed.license_type },
                        { label: 'Holder', value: ed.license_holder },
                        { label: 'Classifications', value: ed.contractor_classifications?.join(', ') },
                        { label: 'State', value: ed.state },
                        { label: 'Expires', value: ed.expiry_date ? format(parseISO(ed.expiry_date), 'MMM d, yyyy') : null },
                      ].filter(f => f.value).map(f => <InfoRow key={f.label} label={f.label} value={f.value!} />)}
                    </div>
                  </div>
                )}

                {/* NDA */}
                {ed.restrictions?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>NDA Restrictions</div>
                    <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                      {ed.restrictions.map((r: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 4, lineHeight: 1.5 }}>• {r}</div>)}
                    </div>
                  </div>
                )}

                {/* Scope gaps */}
                {ed.scope_gaps?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Scope Gaps</div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px' }}>
                      {ed.scope_gaps.map((g: string, i: number) => <div key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 4 }}>• {g}</div>)}
                    </div>
                  </div>
                )}

                {/* RFI Generation */}
                {(ed.rfi_candidates?.length > 0 || ed.scope_gaps?.length > 0) && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={14} />
                      {(ed.rfi_candidates || ed.scope_gaps || []).length} RFI Candidate{(ed.rfi_candidates || ed.scope_gaps || []).length !== 1 ? 's' : ''} Found
                    </div>
                    <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 12, lineHeight: 1.5 }}>
                      Questions that need GC or architect answers before work starts.
                    </div>
                    {!rfis.length ? (
                      <button onClick={generateRFIsFromBlueprint} disabled={genRFIs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#1e40af', color: 'white', fontFamily: 'inherit' }}>
                        {genRFIs ? '⏳ Generating...' : '✨ Generate Formal RFIs'}
                      </button>
                    ) : (
                      <div>
                        {rfis.map((rfi, i) => (
                          <div key={i} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af', marginBottom: 3 }}>{rfi.subject}</div>
                            <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.4 }}>{rfi.question}</div>
                            {rfi.impact_if_unanswered && <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>⚠️ {rfi.impact_if_unanswered}</div>}
                          </div>
                        ))}
                        {!rfisSaved ? (
                          <button onClick={saveRFIs} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, cursor: 'pointer', border: 'none', background: '#111827', color: 'white', fontFamily: 'inherit' }}>
                            Save {rfis.length} RFIs to RFI Tracker →
                          </button>
                        ) : (
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>✓ Saved to RFI Tracker</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#111827', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)', maxWidth: 320 }}>
          {toast}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isPast } from 'date-fns'

interface Doc {
  id: string; project_id: string; name: string; file_path: string
  file_type: string; file_size: number; doc_type: string
  status: 'uploading' | 'processing' | 'extracted' | 'needs_review'
  extracted_data: any; ai_notes: string | null
  created_at: string
}
interface Permit {
  id: string; permit_number: string; permit_type: string
  expiry_date: string | null; issued_date: string | null; status: string
  special_conditions: string[]; inspector_name: string | null
  inspector_phone: string | null; jurisdiction: string | null
}
interface Props {
  user: any; project: any
  initialDocuments: Doc[]
  initialPermits: Permit[]
}

const DOC_TYPES = [
  { id: 'permit',     label: 'Permit',      icon: '📋' },
  { id: 'blueprint',  label: 'Blueprint',   icon: '🏗️' },
  { id: 'contract',   label: 'Contract',    icon: '📝' },
  { id: 'nda',        label: 'NDA',         icon: '🔒' },
  { id: 'license',    label: 'License',     icon: '🪪' },
  { id: 'inspection', label: 'Inspection',  icon: '🔍' },
  { id: 'submittal',  label: 'Submittal',   icon: '📬' },
  { id: 'insurance',  label: 'Insurance',   icon: '🛡️' },
  { id: 'other',      label: 'Other',       icon: '📄' },
]

const STATUS = {
  uploading:    { label: 'Uploading',   color: 'var(--blue)',   bg: 'var(--blue-bg)' },
  processing:   { label: 'AI Reading', color: 'var(--yellow)', bg: 'var(--yellow-bg)' },
  extracted:    { label: 'Complete',   color: 'var(--green)',  bg: 'var(--green-bg)' },
  needs_review: { label: 'Review',     color: 'var(--red)',    bg: 'var(--red-bg)' },
}

const STEPS = [
  'Reading document...', 'Detecting document type...', 'Extracting key dates...',
  'Scanning permit conditions...', 'Checking compliance...', 'Analyzing scope...',
  'Flagging risks...', 'Complete ✓',
]

export function DocumentsClient({ user, project, initialDocuments, initialPermits }: Props) {
  const [docs, setDocs]           = useState<Doc[]>(initialDocuments)
  const [permits, setPermits]     = useState<Permit[]>(initialPermits)
  const [selected, setSelected]   = useState<Doc | null>(null)
  const [filter, setFilter]       = useState('all')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [step, setStep]           = useState('')
  const [toast, setToast]         = useState('')
  const [generating, setGenerating] = useState(false)
  const [rfis, setRFIs]           = useState<any[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 4000) }

  const today = new Date()
  const expiringPermits = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) <= 30 && !isPast(parseISO(p.expiry_date)))
  const expiredPermits  = permits.filter(p => p.expiry_date && isPast(parseISO(p.expiry_date)))

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

      // Animate steps
      for (let i = 0; i < STEPS.length - 1; i++) {
        setStep(STEPS[i])
        await new Promise(r => setTimeout(r, 800))
      }

      // Call AI parse
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: newDoc.id, project_id: project.id }),
      })
      const json = await res.json()
      setStep(STEPS[STEPS.length - 1])

      if (json.success) {
        const { data: updated } = await supabase.from('documents').select('*').eq('id', newDoc.id).single()
        if (updated) {
          setDocs(prev => prev.map(d => d.id === newDoc.id ? updated as Doc : d))
          setSelected(updated as Doc)
        }
        const { data: newPermits } = await supabase.from('permits').select('*').eq('project_id', project.id)
        if (newPermits) setPermits(newPermits as Permit[])
        msg('✓ AI extraction complete')
      } else {
        setDocs(prev => prev.map(d => d.id === newDoc.id ? { ...d, status: 'needs_review' } : d))
        msg('AI could not fully read — try a clearer file')
      }
    } catch (err: any) {
      msg(`Upload failed: ${err.message}`)
      setUploading(false)
    }
    setProcessing(null)
    setStep('')
  }

  async function generateRFIsFromDoc(doc: Doc) {
    const candidates = doc.extracted_data?.rfi_candidates
    if (!candidates?.length) return
    setGenerating(true)
    try {
      const res = await fetch('/api/document-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_rfis', rfi_candidates: candidates, project_id: project.id }),
      })
      const json = await res.json()
      if (json.rfis?.length) { setRFIs(json.rfis); msg(`✓ ${json.rfis.length} RFIs generated`) }
    } catch { msg('Failed to generate RFIs') }
    setGenerating(false)
  }

  async function saveRFIs() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const today = new Date().toISOString().split('T')[0]
    const deadline = new Date(); deadline.setDate(deadline.getDate() + 7)
    for (let i = 0; i < rfis.length; i++) {
      await supabase.from('rfis').insert({
        project_id: project.id, user_id: authUser.id,
        rfi_number: `RFI-AI-${Date.now().toString().slice(-4)}-${i+1}`,
        subject: rfis[i].subject, question: rfis[i].question,
        submitted_to: 'GC / Architect', submitted_date: today,
        response_needed_by: deadline.toISOString().split('T')[0],
        status: 'open',
      })
    }
    msg(`✓ ${rfis.length} RFIs saved to RFI Tracker`)
    setRFIs([])
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadAndProcess(file)
  }, [project])

  const filtered = filter === 'all' ? docs : docs.filter(d => d.doc_type === filter)
  const ed = selected?.extracted_data

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  )

  const Field = ({ label, value, accent }: { label: string; value: string; accent?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 12, gap: 12 }}>
      <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: accent || 'var(--text)', textAlign: 'right' }}>{value}</span>
    </div>
  )

  const Flag = ({ msg: flagMsg, severity }: { msg: string; severity: string }) => {
    const c = severity === 'critical' ? 'red' : severity === 'warning' ? 'yellow' : 'blue'
    return (
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderRadius: 8, background: `var(--${c}-bg)`, border: `1px solid rgba(0,0,0,0.06)`, marginBottom: 6 }}>
        <span style={{ fontSize: 13, flexShrink: 0 }}>{severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span style={{ fontSize: 12, color: `var(--${c})`, lineHeight: 1.5 }}>{flagMsg}</span>
      </div>
    )
  }

  if (!project) return (
    <div className="empty">
      <div className="empty-icon">🗂️</div>
      <div className="empty-title">Create a project first</div>
      <a href="/dashboard" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Go to dashboard →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="page-title">Document Intelligence</div>
          <div className="page-sub">Upload any document — AI extracts everything that matters</div>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn btn-primary">
          {uploading ? <><span className="spinner" />Uploading...</> : '+ Upload Document'}
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" capture="environment" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndProcess(f); e.target.value = '' }} />
      </div>

      {/* PERMIT ALERTS */}
      {(expiredPermits.length > 0 || expiringPermits.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {expiredPermits.map(p => (
            <div key={p.id} className="alert alert-red">
              <span style={{ fontSize: 20 }}>🚨</span>
              <div style={{ flex: 1 }}>
                <div className="alert-title">EXPIRED: {p.permit_number}</div>
                <div className="alert-sub">Expired {format(parseISO(p.expiry_date!), 'MMM d, yyyy')} — stop work possible</div>
              </div>
            </div>
          ))}
          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date!), today)
            return (
              <div key={p.id} className="alert alert-yellow">
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div className="alert-title">{p.permit_number} expires in {days} day{days !== 1 ? 's' : ''}</div>
                  <div className="alert-sub">{p.permit_type} · {format(parseISO(p.expiry_date!), 'MMM d, yyyy')}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* STATS */}
      <div className="stat-grid stat-grid-4" style={{ marginBottom: 20 }}>
        {[
          { label: 'Documents', value: docs.length, icon: '🗂️', cls: '' },
          { label: 'AI Extracted', value: docs.filter(d => d.status === 'extracted').length, icon: '✅', cls: 'green' },
          { label: 'Active Permits', value: permits.filter(p => p.status === 'active').length, icon: '📋', cls: '' },
          { label: 'Needs Review', value: docs.filter(d => d.status === 'needs_review').length, icon: '⚠️', cls: docs.filter(d => d.status === 'needs_review').length > 0 ? 'red' : '' },
        ].map(s => (
          <div key={s.label} className={`card-stat ${s.cls}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>{s.icon}</span>{s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* LEFT — LIST */}
        <div>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--orange)' : 'var(--border)'}`,
              borderRadius: 14, padding: '22px 20px', marginBottom: 14,
              textAlign: 'center', cursor: 'pointer',
              background: dragOver ? 'var(--orange-light)' : 'var(--surface)',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: dragOver ? 'var(--orange)' : 'var(--text)', marginBottom: 3 }}>
              {uploading ? 'Uploading...' : 'Drop any document or tap to upload'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              PDF, PNG, JPG · Permits, blueprints, contracts, NDAs, licenses, inspections
            </div>
          </div>

          {/* Processing indicator */}
          {processing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--blue-bg)', border: '1px solid rgba(26,86,219,0.15)', borderRadius: 10, marginBottom: 12 }}>
              <div className="spinner" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>AI Reading Document</div>
                <div style={{ fontSize: 11, color: 'var(--blue)' }}>{step}</div>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          {docs.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', fontSize: 11, fontWeight: filter === 'all' ? 700 : 400, borderRadius: 20, border: `1px solid ${filter === 'all' ? 'var(--text)' : 'var(--border)'}`, background: filter === 'all' ? 'var(--text)' : 'var(--surface)', color: filter === 'all' ? 'white' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                All ({docs.length})
              </button>
              {DOC_TYPES.map(t => {
                const count = docs.filter(d => d.doc_type === t.id).length
                if (!count) return null
                return (
                  <button key={t.id} onClick={() => setFilter(t.id)} style={{ padding: '4px 12px', fontSize: 11, fontWeight: filter === t.id ? 700 : 400, borderRadius: 20, border: `1px solid ${filter === t.id ? 'var(--text)' : 'var(--border)'}`, background: filter === t.id ? 'var(--text)' : 'var(--surface)', color: filter === t.id ? 'white' : 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.icon} {t.label} ({count})
                  </button>
                )
              })}
            </div>
          )}

          {/* Doc list */}
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🗂️</div>
              <div className="empty-title">No documents yet</div>
              <div className="empty-sub">Upload a permit, blueprint, contract, or license. AI reads it and extracts every date, condition, and risk.</div>
              <button onClick={() => fileRef.current?.click()} className="btn btn-orange">+ Upload First Document</button>
            </div>
          ) : (
            <div className="table-wrap">
              {filtered.map(doc => {
                const st = STATUS[doc.status]
                const dt = DOC_TYPES.find(t => t.id === doc.doc_type)
                const isProc = processing === doc.id
                const isSel  = selected?.id === doc.id
                return (
                  <div key={doc.id} className={`table-row clickable ${isSel ? 'active' : ''}`} onClick={() => setSelected(isSel ? null : doc)}
                    style={{ background: isSel ? 'var(--surface-2)' : undefined }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {dt?.icon || '📄'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{doc.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {isProc ? step || st.label : st.label}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{format(parseISO(doc.created_at), 'MMM d')}</span>
                      </div>
                    </div>
                    {doc.status === 'extracted' && <div className="dot dot-green" />}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT — AI EXTRACTION PANEL */}
        {selected && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 0, maxHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            {/* Panel header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: 'var(--surface-2)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{(selected.file_size / 1024).toFixed(0)}KB · {DOC_TYPES.find(t => t.id === selected.doc_type)?.label}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => deleteDoc(selected.id)} className="btn btn-sm btn-danger">Delete</button>
                <button onClick={() => setSelected(null)} className="btn btn-sm btn-ghost">✕</button>
              </div>
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px' }}>

              {selected.status === 'processing' && (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }} />
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>AI is reading this document</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{step || 'Processing...'}</div>
                </div>
              )}

              {selected.status === 'needs_review' && (
                <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Couldn't fully read this</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16, lineHeight: 1.6 }}>
                    {selected.ai_notes || 'Try re-uploading as a clearer PDF. Low-resolution scans are hard to read.'}
                  </div>
                </div>
              )}

              {selected.status === 'extracted' && ed && (
                <>
                  {/* AI Summary — always first */}
                  {selected.ai_notes && (
                    <div style={{ background: '#0a0a0a', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>✨ AI Summary</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{selected.ai_notes}</div>
                    </div>
                  )}

                  {/* Action items */}
                  {ed.action_items?.length > 0 && (
                    <Section title="⚡ Do These Now">
                      <div style={{ background: 'var(--red-bg)', borderRadius: 10, padding: '12px 14px' }}>
                        {ed.action_items.map((item: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--red)', lineHeight: 1.5, marginBottom: i < ed.action_items.length - 1 ? 8 : 0 }}>
                            {i+1}. {item}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Flags */}
                  {ed.flags?.length > 0 && (
                    <Section title="Flags">
                      {ed.flags.map((f: any, i: number) => <Flag key={i} msg={f.message} severity={f.severity} />)}
                    </Section>
                  )}

                  {/* Key dates */}
                  {(ed.expiry_date || ed.issued_date || ed.start_date || ed.completion_date) && (
                    <Section title="Key Dates">
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '4px 12px' }}>
                        {[
                          { label: 'Issued', value: ed.issued_date },
                          { label: 'Expires', value: ed.expiry_date, warn: true },
                          { label: 'Start', value: ed.start_date },
                          { label: 'Completion', value: ed.completion_date },
                        ].filter(d => d.value).map(d => {
                          const daysLeft = d.value ? differenceInDays(parseISO(d.value), today) : null
                          const expired  = daysLeft !== null && daysLeft < 0
                          const urgent   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 14 && d.warn
                          const accent   = expired ? 'var(--red)' : urgent ? 'var(--yellow)' : undefined
                          return (
                            <Field key={d.label} label={d.label}
                              value={`${format(parseISO(d.value!), 'MMM d, yyyy')}${daysLeft !== null && d.warn ? ` (${expired ? `${Math.abs(daysLeft)}d expired` : `${daysLeft}d left`})` : ''}`}
                              accent={accent}
                            />
                          )
                        })}
                      </div>
                    </Section>
                  )}

                  {/* Permit details */}
                  {(ed.permit_number || ed.permit_type || ed.jurisdiction || ed.inspector_name) && (
                    <Section title="Permit Details">
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '4px 12px' }}>
                        {[
                          { label: 'Number',     value: ed.permit_number },
                          { label: 'Type',       value: ed.permit_type },
                          { label: 'Jurisdiction', value: ed.jurisdiction },
                          { label: 'Inspector',  value: ed.inspector_name },
                          { label: 'Phone',      value: ed.inspector_phone },
                          { label: 'License',    value: ed.contractor_license },
                          { label: 'Valuation',  value: ed.valuation ? `$${Number(ed.valuation).toLocaleString()}` : null },
                        ].filter(f => f.value).map(f => <Field key={f.label} label={f.label} value={f.value!} />)}
                      </div>
                    </Section>
                  )}

                  {/* License details */}
                  {ed.license_number && (
                    <Section title="License Details">
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '4px 12px' }}>
                        {[
                          { label: 'Number',       value: ed.license_number },
                          { label: 'Type',         value: ed.license_type },
                          { label: 'Holder',       value: ed.license_holder },
                          { label: 'Classifications', value: ed.contractor_classifications?.join(', ') },
                          { label: 'Expires',      value: ed.expiry_date ? format(parseISO(ed.expiry_date), 'MMM d, yyyy') : null },
                          { label: 'State',        value: ed.state },
                        ].filter(f => f.value).map(f => <Field key={f.label} label={f.label} value={f.value!} />)}
                      </div>
                    </Section>
                  )}

                  {/* Special conditions */}
                  {ed.special_conditions?.length > 0 && (
                    <Section title="⚠️ Special Conditions">
                      <div style={{ background: 'var(--yellow-bg)', border: '1px solid rgba(160,90,0,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                        {ed.special_conditions.map((c: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--yellow)', lineHeight: 1.5, marginBottom: i < ed.special_conditions.length - 1 ? 8 : 0 }}>
                            {i+1}. {c}
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Blueprint analysis */}
                  {(ed.safety_flags?.length || ed.code_issues?.length || ed.what_to_add?.length || ed.cost_saving_opportunities?.length) && (
                    <Section title="Blueprint Analysis">
                      {ed.safety_flags?.length > 0 && (
                        <div style={{ background: 'var(--red-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>🚨 Safety Flags</div>
                          {ed.safety_flags.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--red)', marginBottom: 3 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.code_issues?.length > 0 && (
                        <div style={{ background: 'var(--yellow-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 6 }}>⚠️ Code Issues</div>
                          {ed.code_issues.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 3 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.what_to_add?.length > 0 && (
                        <div style={{ background: 'var(--blue-bg)', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', marginBottom: 6 }}>➕ Missing Items</div>
                          {ed.what_to_add.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 3 }}>• {f}</div>)}
                        </div>
                      )}
                      {ed.cost_saving_opportunities?.length > 0 && (
                        <div style={{ background: 'var(--green-bg)', borderRadius: 10, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>💰 Cost Savings</div>
                          {ed.cost_saving_opportunities.map((f: string, i: number) => <div key={i} style={{ fontSize: 12, color: 'var(--green)', marginBottom: 3 }}>• {f}</div>)}
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Contract details */}
                  {(ed.contract_value || ed.payment_terms || ed.retention_pct) && (
                    <Section title="Contract Details">
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '4px 12px' }}>
                        {[
                          { label: 'Value',    value: ed.contract_value ? `$${Number(ed.contract_value).toLocaleString()}` : null },
                          { label: 'Payment',  value: ed.payment_terms },
                          { label: 'Retention', value: ed.retention_pct ? `${ed.retention_pct}%` : null },
                          { label: 'Exclusions', value: ed.exclusions?.join('; ') },
                        ].filter(f => f.value).map(f => <Field key={f.label} label={f.label} value={f.value!} />)}
                        {ed.scope_of_work_summary && (
                          <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{ed.scope_of_work_summary}</div>
                        )}
                      </div>
                    </Section>
                  )}

                  {/* Penalty clauses */}
                  {ed.penalty_clauses?.length > 0 && (
                    <Section title="🚨 Penalty Clauses">
                      <div style={{ background: 'var(--red-bg)', borderRadius: 10, padding: '10px 14px' }}>
                        {ed.penalty_clauses.map((c: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--red)', marginBottom: 6, lineHeight: 1.5 }}>• {c}</div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* NDA details */}
                  {ed.restrictions?.length > 0 && (
                    <Section title="NDA Restrictions">
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                        {ed.restrictions.map((r: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 4, lineHeight: 1.5 }}>• {r}</div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Scope gaps */}
                  {ed.scope_gaps?.length > 0 && (
                    <Section title="Scope Gaps">
                      <div style={{ background: 'var(--yellow-bg)', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: 'var(--yellow)', marginBottom: 6, fontWeight: 600 }}>These need to be resolved before work starts</div>
                        {ed.scope_gaps.map((g: string, i: number) => (
                          <div key={i} style={{ fontSize: 12, color: 'var(--yellow)', marginBottom: 4 }}>• {g}</div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* RFI Candidates */}
                  {ed.rfi_candidates?.length > 0 && (
                    <Section title={`📋 RFI Candidates (${ed.rfi_candidates.length})`}>
                      <div style={{ background: 'var(--blue-bg)', border: '1px solid rgba(26,86,219,0.15)', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 12, color: 'var(--blue)', marginBottom: 10, lineHeight: 1.5 }}>
                          {ed.rfi_candidates.length} question{ed.rfi_candidates.length > 1 ? 's' : ''} need GC or architect answers before work starts.
                        </div>
                        {!rfis.length ? (
                          <button onClick={() => generateRFIsFromDoc(selected)} disabled={generating} className="btn btn-sm" style={{ background: 'var(--blue)', color: 'white', border: 'none' }}>
                            {generating ? <><span className="spinner" />Generating...</> : '✨ Generate Formal RFIs'}
                          </button>
                        ) : (
                          <>
                            {rfis.map((rfi, i) => (
                              <div key={i} style={{ background: 'white', borderRadius: 8, padding: '10px 12px', marginBottom: 8, border: '1px solid rgba(26,86,219,0.15)' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', marginBottom: 3 }}>{rfi.subject}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.4 }}>{rfi.question}</div>
                              </div>
                            ))}
                            <button onClick={saveRFIs} className="btn btn-sm btn-primary">
                              Save {rfis.length} RFIs to RFI Tracker →
                            </button>
                          </>
                        )}
                      </div>
                    </Section>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

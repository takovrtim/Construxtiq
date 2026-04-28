'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import type { User, Project, Document, Permit, Subcontractor } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialDocuments: Document[]
  initialPermits: Permit[]
  subs: Pick<Subcontractor, 'id' | 'company_name' | 'trade' | 'email'>[]
}

const DOC_ICONS: Record<string, string> = {
  permit: '📋', blueprint: '🏗️', contract: '📝',
  sub_bid: '💰', inspection: '🔍', change_order: '🔄', other: '📄',
}

const STATUS_CLASS: Record<string, string> = {
  extracted: 'p-green', saved: 'p-green',
  processing: 'p-amber', uploading: 'p-amber',
  needs_review: 'p-red',
}

const PROCESSING_STEPS = [
  'Reading document...',
  'Detecting document type...',
  'Extracting key fields...',
  'Checking expiry dates...',
  'Scanning for compliance flags...',
  'Done ✓',
]

export function DocumentsClient({ user, project, initialDocuments, initialPermits, subs }: Props) {
  const [documents, setDocuments]     = useState<Document[]>(initialDocuments)
  const [permits, setPermits]         = useState<Permit[]>(initialPermits)
  const [selected, setSelected]       = useState<Document | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [savingId, setSavingId]       = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState('')
  const [showFullExtract, setShowFullExtract] = useState(false)
  // Send Scope state
  const [scopePanel, setScopePanel]   = useState(false)
  const [scopeSubId, setScopeSubId]   = useState('')
  const [scopeDraft, setScopeDraft]   = useState('')
  const [scopeLoading, setScopeLoading] = useState(false)
  const [scopeSending, setScopeSending] = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const pollRef       = useRef<NodeJS.Timeout | null>(null)
  const stepRef       = useRef<NodeJS.Timeout | null>(null)

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function animateProcessing() {
    let i = 0
    setProcessingStep(PROCESSING_STEPS[0])
    stepRef.current = setInterval(() => {
      i++
      if (i < PROCESSING_STEPS.length) {
        setProcessingStep(PROCESSING_STEPS[i])
      } else {
        clearInterval(stepRef.current!)
        setProcessingStep('')
      }
    }, 1800)
  }

  // Poll for status updates
  useEffect(() => {
    const hasPending = documents.some(d => d.status === 'processing' || d.status === 'uploading')
    if (!hasPending || !project) return

    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })
      if (data) setDocuments(data as Document[])

      const { data: p } = await supabase
        .from('permits')
        .select('*')
        .eq('project_id', project.id)
        .order('expiry_date')
      if (p) setPermits(p as Permit[])
    }, 3000)

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [documents, project])

  async function uploadFiles(files: FileList | File[]) {
    if (!project) { showToast('Select a project first', 'error'); return }
    setUploading(true)
    animateProcessing()

    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('project_id', project.id)

      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()

      if (json.success) {
        setDocuments(prev => [{
          id: json.data.document_id,
          project_id: project.id,
          user_id: user.id,
          name: file.name,
          file_path: '',
          file_size: file.size,
          file_type: file.type,
          doc_type: json.data.doc_type,
          status: 'processing',
          extracted_data: null,
          ai_notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Document, ...prev])
      } else {
        showToast(json.error || 'Upload failed', 'error')
      }
    }

    setUploading(false)
    showToast('AI is reading your document — fields will appear in seconds')
  }

  async function saveToDB(doc: Document) {
    setSavingId(doc.id)
    const { error } = await supabase.from('documents').update({ status: 'saved' }).eq('id', doc.id)
    if (!error) {
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, status: 'saved' } : d))
      showToast('✓ Saved to project database')
    }
    setSavingId(null)
  }

  async function draftScope() {
    if (!selected || !project || !scopeSubId) return
    setScopeLoading(true); setScopeDraft('')
    const res = await fetch('/api/send-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: selected.id, sub_id: scopeSubId, project_id: project.id, action: 'draft' }),
    })
    const json = await res.json()
    if (json.success) { setScopeDraft(json.draft) }
    else showToast(json.error || 'Draft failed', 'error')
    setScopeLoading(false)
  }

  async function sendScope() {
    if (!selected || !project || !scopeSubId) return
    setScopeSending(true)
    const res = await fetch('/api/send-scope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: selected.id, sub_id: scopeSubId, project_id: project.id, action: 'send', custom_body: scopeDraft }),
    })
    const json = await res.json()
    if (json.success) { showToast('Scope sent to sub'); setScopePanel(false); setScopeDraft('') }
    else showToast(json.error || 'Send failed', 'error')
    setScopeSending(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const today = new Date()

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No project selected</div>
      <a href="/dashboard" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Documents</div>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>
        Drop any permit, blueprint, or contract — AI reads and extracts everything instantly
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* LEFT */}
        <div>
          {/* Upload zone */}
          <div style={{ marginBottom: 15 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                width: '100%', padding: '22px 20px', fontSize: 16, fontWeight: 600,
                borderRadius: 14, cursor: uploading ? 'default' : 'pointer',
                border: `2px dashed ${dragOver ? 'var(--orange)' : 'var(--orange)'}`,
                background: dragOver ? '#fdf0e8' : 'var(--orange)',
                color: dragOver ? 'var(--orange)' : 'white',
                fontFamily: 'inherit', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {uploading ? '⏳ Uploading…' : dragOver ? 'Drop to upload' : '+ Add Document'}
            </button>
            {processingStep && (
              <div style={{ marginTop: 10, background: '#E6F1FB', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#0C447C', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⚙️</span>
                {processingStep}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
              style={{ display: 'none' }}
              onChange={e => e.target.files && uploadFiles(e.target.files)}
            />
          </div>

          {/* Document list */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>All Documents</div>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{documents.length} total</span>
            </div>

            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 13 }}>
                No documents yet — upload your first above
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelected(doc)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: '10px 8px', borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', borderRadius: 6,
                    background: selected?.id === doc.id ? 'var(--bg)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {DOC_ICONS[doc.doc_type] || '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
                      {(doc.file_size / 1024 / 1024).toFixed(1)} MB · {format(parseISO(doc.created_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: doc.status === 'extracted' || doc.status === 'saved' ? '#edf5f0' : doc.status === 'needs_review' ? '#fdf0f0' : '#fdf4e3',
                    color: doc.status === 'extracted' || doc.status === 'saved' ? '#1a4d31' : doc.status === 'needs_review' ? '#6e1a1a' : '#6b4010',
                  }}>
                    {doc.status === 'processing' || doc.status === 'uploading' ? '⏳ Reading...' : doc.status.replace('_', ' ')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: AI Extraction Preview */}
        <div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)', marginBottom: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>AI Extraction Preview</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{selected?.name || 'Select a document'}</div>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                {selected?.extracted_data && selected.status !== 'saved' && (
                  <button
                    onClick={() => saveToDB(selected)}
                    disabled={savingId === selected.id}
                    style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid #1a1a1a', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}
                  >
                    {savingId === selected.id ? 'Saving...' : 'Save to DB'}
                  </button>
                )}
                {selected?.extracted_data && subs.length > 0 && (
                  <button
                    onClick={() => { setScopePanel(v => !v); setScopeDraft('') }}
                    style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: scopePanel ? 'var(--bg)' : 'transparent', fontFamily: 'inherit' }}
                  >
                    → Send Scope
                  </button>
                )}
              </div>
            </div>

            {!selected ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🤖</div>
                Upload a document or click one to see AI extraction
              </div>
            ) : selected.status === 'processing' || selected.status === 'uploading' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>⚙️</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>AI is reading this document...</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{processingStep || 'Processing...'}</div>
              </div>
            ) : selected.status === 'needs_review' ? (
              <div style={{ background: '#fdf0f0', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#6e1a1a' }}>
                ⚠️ Could not auto-extract this document. Please review it manually.
              </div>
            ) : selected.extracted_data ? (
              <div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, fontSize: 12, lineHeight: 1.9 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 16px' }}>
                    {selected.extracted_data.permit_number && <>
                      <span style={{ color: 'var(--text-3)' }}>Permit No.</span>
                      <span style={{ fontWeight: 600, fontFamily: 'monospace', background: 'var(--border)', padding: '0 5px', borderRadius: 4 }}>{selected.extracted_data.permit_number}</span>
                    </>}
                    {selected.extracted_data.expiry_date && <>
                      <span style={{ color: 'var(--text-3)' }}>Expires</span>
                      <span style={{ color: '#d95f2b', fontWeight: 600 }}>{selected.extracted_data.expiry_date}</span>
                    </>}
                    {!selected.extracted_data.permit_number && selected.extracted_data.total_amount && <>
                      <span style={{ color: 'var(--text-3)' }}>Amount</span>
                      <span>${Number(selected.extracted_data.total_amount).toLocaleString()}</span>
                    </>}
                  </div>

                  {/* Flags always shown */}
                  {selected.extracted_data.flags && selected.extracted_data.flags.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      {selected.extracted_data.flags.map((f, i) => (
                        <div key={i} style={{ marginTop: 6, padding: '8px 12px', borderRadius: 7, background: f.severity === 'critical' ? '#fdf0f0' : f.severity === 'warning' ? '#fdf4e3' : '#E6F1FB', color: f.severity === 'critical' ? '#6e1a1a' : f.severity === 'warning' ? '#6b4010' : '#0C447C', fontSize: 12 }}>
                          {f.severity === 'critical' ? '🔴' : '⚠️'} {f.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full details toggle */}
                  <button onClick={() => setShowFullExtract(v => !v)} style={{ marginTop: 10, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    {showFullExtract ? '▲ Hide details' : '▼ Full details'}
                  </button>

                  {showFullExtract && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 16px', marginTop: 8 }}>
                      {selected.extracted_data.permit_type && <>
                        <span style={{ color: 'var(--text-3)' }}>Type</span>
                        <span>{selected.extracted_data.permit_type}</span>
                      </>}
                      {selected.extracted_data.issued_date && <>
                        <span style={{ color: 'var(--text-3)' }}>Issued</span>
                        <span>{selected.extracted_data.issued_date}</span>
                      </>}
                      {selected.extracted_data.jurisdiction && <>
                        <span style={{ color: 'var(--text-3)' }}>Jurisdiction</span>
                        <span>{selected.extracted_data.jurisdiction}</span>
                      </>}
                      {selected.extracted_data.valuation && <>
                        <span style={{ color: 'var(--text-3)' }}>Valuation</span>
                        <span>${Number(selected.extracted_data.valuation).toLocaleString()}</span>
                      </>}
                      {selected.extracted_data.sq_footage && <>
                        <span style={{ color: 'var(--text-3)' }}>Sq Footage</span>
                        <span>{Number(selected.extracted_data.sq_footage).toLocaleString()} SF</span>
                      </>}
                      {selected.extracted_data.inspector_name && <>
                        <span style={{ color: 'var(--text-3)' }}>Inspector</span>
                        <span>{selected.extracted_data.inspector_name}</span>
                      </>}
                      {selected.extracted_data.contractor_name && <>
                        <span style={{ color: 'var(--text-3)' }}>Contractor</span>
                        <span>{selected.extracted_data.contractor_name}</span>
                      </>}
                      {selected.extracted_data.total_amount && selected.extracted_data.permit_number && <>
                        <span style={{ color: 'var(--text-3)' }}>Amount</span>
                        <span>${Number(selected.extracted_data.total_amount).toLocaleString()}</span>
                      </>}
                      {selected.ai_notes && <>
                        <span style={{ color: 'var(--text-3)' }}>AI Notes</span>
                        <span style={{ lineHeight: 1.6 }}>{selected.ai_notes}</span>
                      </>}
                    </div>
                  )}
                </div>

                {/* Success banner */}
                {selected.status === 'saved' && (
                  <div style={{ marginTop: 10, background: '#edf5f0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a4d31', fontWeight: 500 }}>
                    ✓ Saved to project database
                  </div>
                )}

                {/* Send Scope Panel */}
                {scopePanel && (
                  <div style={{ marginTop: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Send Scope to Sub</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 10 }}>
                      AI sends only this sub&apos;s relevant scope — no budget, no other trades, no internal flags.
                    </div>
                    <select
                      value={scopeSubId}
                      onChange={e => { setScopeSubId(e.target.value); setScopeDraft('') }}
                      style={{ width: '100%', fontSize: 12, border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', background: 'var(--surface)', fontFamily: 'inherit', marginBottom: 10 }}
                    >
                      <option value=''>Select a subcontractor...</option>
                      {subs.map(s => (
                        <option key={s.id} value={s.id}>{s.company_name} — {s.trade}</option>
                      ))}
                    </select>

                    {scopeSubId && !scopeDraft && (
                      <button
                        onClick={draftScope}
                        disabled={scopeLoading}
                        style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', fontFamily: 'inherit' }}
                      >
                        {scopeLoading ? 'Drafting...' : 'AI Draft Email'}
                      </button>
                    )}

                    {scopeDraft && (
                      <>
                        <textarea
                          value={scopeDraft}
                          onChange={e => setScopeDraft(e.target.value)}
                          rows={8}
                          style={{ width: '100%', fontSize: 12, border: '1px solid var(--border)', borderRadius: 7, padding: '8px 10px', background: 'var(--surface)', fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button
                            onClick={sendScope}
                            disabled={scopeSending || !subs.find(s => s.id === scopeSubId)?.email}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid #1a1a1a', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}
                          >
                            {scopeSending ? 'Sending...' : 'Send →'}
                          </button>
                          <button onClick={draftScope} disabled={scopeLoading} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', fontFamily: 'inherit' }}>
                            Redraft
                          </button>
                          {!subs.find(s => s.id === scopeSubId)?.email && (
                            <span style={{ fontSize: 11, color: '#b06e1a', alignSelf: 'center' }}>⚠ No email on file</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>No data extracted yet</div>
            )}
          </div>

          {/* Permit tracker */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Permit Tracker</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C' }}>{permits.length} active</span>
            </div>
            {permits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                Upload a permit and it will appear here automatically
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Permit</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Expires</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-3)', borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {permits.map(p => {
                    const days = p.expiry_date ? differenceInDays(parseISO(p.expiry_date), today) : null
                    return (
                      <tr key={p.id}>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 500 }}>{p.permit_number}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.permit_type}</div>
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                          {p.expiry_date ? (
                            <span style={{ color: days !== null && days <= 30 ? '#d95f2b' : 'inherit', fontWeight: days !== null && days <= 14 ? 600 : 400 }}>
                              {format(parseISO(p.expiry_date), 'MMM d, yyyy')}
                              {days !== null && days >= 0 && days <= 30 && <div style={{ fontSize: 11, color: '#d95f2b' }}>{days}d left</div>}
                              {days !== null && days < 0 && <div style={{ fontSize: 11, color: '#b83232', fontWeight: 600 }}>Expired</div>}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '9px 10px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            background: p.status === 'active' ? '#edf5f0' : p.status === 'expiring_soon' ? '#fdf4e3' : p.status === 'expired' ? '#fdf0f0' : '#f1efe8',
                            color: p.status === 'active' ? '#1a4d31' : p.status === 'expiring_soon' ? '#6b4010' : p.status === 'expired' ? '#6e1a1a' : '#6b6a66',
                          }}>
                            {p.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#b83232' : '#2d7a4f',
          color: 'white', padding: '11px 18px', borderRadius: 12,
          fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'fadeUp 0.22s ease', maxWidth: 340,
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
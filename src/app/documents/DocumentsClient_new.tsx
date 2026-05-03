'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays } from 'date-fns'
import { PermitReadiness } from './PermitReadiness'
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

const DOC_TYPES = [
  { id: 'auto',       label: 'Auto-detect', icon: '🤖' },
  { id: 'permit',     label: 'Permit',      icon: '📋' },
  { id: 'blueprint',  label: 'Blueprint',   icon: '🏗️' },
  { id: 'contract',   label: 'Contract',    icon: '📝' },
  { id: 'inspection', label: 'Inspection',  icon: '🔍' },
  { id: 'sub_bid',    label: 'Sub Bid',     icon: '💰' },
  { id: 'other',      label: 'Other',       icon: '📄' },
]

const FOLDERS = [
  { id: 'all',        label: 'All',         icon: '📁' },
  { id: 'permit',     label: 'Permits',     icon: '📋' },
  { id: 'blueprint',  label: 'Blueprints',  icon: '🏗️' },
  { id: 'contract',   label: 'Contracts',   icon: '📝' },
  { id: 'inspection', label: 'Inspections', icon: '🔍' },
  { id: 'other',      label: 'Other',       icon: '📄' },
]

const PROCESSING_STEPS = [
  'Reading document...', 'Detecting document type...', 'Extracting key fields...',
  'Checking expiry dates...', 'Scanning for compliance flags...', 'Done ✓',
]

const BLUEPRINT_STEPS = [
  'Reading blueprint...', 'Analyzing structural elements...', 'Checking code compliance...',
  'Identifying gaps and issues...', 'Generating recommendations...', 'Done ✓',
]

export function DocumentsClient({ user, project, initialDocuments, initialPermits, subs }: Props) {
  const [documents, setDocuments]       = useState<Document[]>(initialDocuments)
  const [permits, setPermits]           = useState<Permit[]>(initialPermits)
  const [selected, setSelected]         = useState<Document | null>(null)
  const [activeFolder, setActiveFolder] = useState('all')
  const [activeTab, setActiveTab]       = useState<'documents' | 'readiness'>('documents')
  const [selectedDocType, setSelectedDocType] = useState('auto')
  const [uploading, setUploading]       = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [savingId, setSavingId]         = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState('')
  const [showFullExtract, setShowFullExtract] = useState(false)
  const [scopePanel, setScopePanel]     = useState(false)
  const [scopeSubId, setScopeSubId]     = useState('')
  const [scopeDraft, setScopeDraft]     = useState('')
  const [scopeLoading, setScopeLoading] = useState(false)
  const [scopeSending, setScopeSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef      = useRef<NodeJS.Timeout | null>(null)
  const stepRef      = useRef<NodeJS.Timeout | null>(null)

  const isBlueprint = selectedDocType === 'blueprint'

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function animateProcessing(blueprint = false) {
    const steps = blueprint ? BLUEPRINT_STEPS : PROCESSING_STEPS
    let i = 0
    setProcessingStep(steps[0])
    stepRef.current = setInterval(() => {
      i++
      if (i < steps.length) setProcessingStep(steps[i])
      else { clearInterval(stepRef.current!); setProcessingStep('') }
    }, 2000)
  }

  useEffect(() => {
    const hasPending = documents.some(d => d.status === 'processing' || d.status === 'uploading')
    if (!hasPending || !project) return
    pollRef.current = setInterval(async () => {
      const { data } = await supabase.from('documents').select('*').eq('project_id', project.id).order('created_at', { ascending: false })
      if (data) setDocuments(data as Document[])
      const { data: p } = await supabase.from('permits').select('*').eq('project_id', project.id).order('expiry_date')
      if (p) setPermits(p as Permit[])
    }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [documents, project])

  async function uploadFiles(files: FileList | File[]) {
    if (!project) { showToast('Select a project first', 'error'); return }
    setUploading(true)
    animateProcessing(isBlueprint)
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('project_id', project.id)
      if (selectedDocType !== 'auto') fd.append('doc_type', selectedDocType)
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (json.success) {
        setDocuments(prev => [{
          id: json.data.document_id, project_id: project.id, user_id: user.id,
          name: file.name, file_path: '', file_size: file.size, file_type: file.type,
          doc_type: selectedDocType === 'auto' ? json.data.doc_type : selectedDocType,
          status: 'processing', extracted_data: null, ai_notes: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } as Document, ...prev])
      } else showToast(json.error || 'Upload failed', 'error')
    }
    setUploading(false)
    showToast(isBlueprint ? '🏗️ AI is analyzing your blueprint — takes ~15 seconds' : 'AI is reading your document — fields appear in seconds')
  }

  async function deleteDocument(doc: Document, e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Delete "${doc.name}"? This cannot be undone.`)) return
    setDeletingId(doc.id)
    if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path])
    const { error } = await supabase.from('documents').delete().eq('id', doc.id)
    if (!error) {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
      if (selected?.id === doc.id) setSelected(null)
      showToast('Document deleted')
    } else showToast('Failed to delete', 'error')
    setDeletingId(null)
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
    const res  = await fetch('/api/send-scope', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: selected.id, sub_id: scopeSubId, project_id: project.id, action: 'draft' }),
    })
    const json = await res.json()
    if (json.success) setScopeDraft(json.draft)
    else showToast(json.error || 'Draft failed', 'error')
    setScopeLoading(false)
  }

  async function sendScope() {
    if (!selected || !project || !scopeSubId) return
    setScopeSending(true)
    const res  = await fetch('/api/send-scope', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: selected.id, sub_id: scopeSubId, project_id: project.id, action: 'send', custom_body: scopeDraft }),
    })
    const json = await res.json()
    if (json.success) { showToast('Scope sent to sub'); setScopePanel(false); setScopeDraft('') }
    else showToast(json.error || 'Send failed', 'error')
    setScopeSending(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  const filteredDocs = activeFolder === 'all' ? documents : documents.filter(d => d.doc_type === activeFolder)
  const folderCounts: Record<string, number> = { all: documents.length }
  documents.forEach(d => { folderCounts[d.doc_type] = (folderCounts[d.doc_type] || 0) + 1 })
  const today = new Date()

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, color: '#6b6a66' }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER + TABS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 2 }}>Documents</div>
          <div style={{ fontSize: 13, color: '#9e9d99' }}>Drop any permit, blueprint, or contract — AI reads everything instantly</div>
        </div>
        <div style={{ display: 'flex', background: '#f8f7f4', borderRadius: 10, padding: 4 }}>
          {([
            ['documents', '📁 Documents'],
            ['readiness', '✓ Permit Readiness'],
          ] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 16px', fontSize: 13, borderRadius: 7, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.15s',
                fontWeight: activeTab === tab ? 700 : 500,
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#0f0f0f' : '#9e9d99',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* PERMIT READINESS TAB */}
      {activeTab === 'readiness' && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <PermitReadiness projectId={project.id} projectName={project.name} />
        </div>
      )}

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <>
          {/* DOC TYPE SELECTOR */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>What are you uploading?</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DOC_TYPES.map(t => (
                <button key={t.id} onClick={() => setSelectedDocType(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px',
                  fontSize: 12, fontWeight: selectedDocType === t.id ? 700 : 500,
                  borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                  border: `1.5px solid ${selectedDocType === t.id ? (t.id === 'blueprint' ? '#1f5fa6' : '#d95f2b') : 'rgba(0,0,0,0.1)'}`,
                  background: selectedDocType === t.id ? (t.id === 'blueprint' ? '#eef3fb' : '#fdf0e8') : 'white',
                  color: selectedDocType === t.id ? (t.id === 'blueprint' ? '#1f5fa6' : '#d95f2b') : '#6b6a66',
                }}>
                  <span>{t.icon}</span><span>{t.label}</span>
                </button>
              ))}
            </div>
            {isBlueprint && (
              <div style={{ marginTop: 10, padding: '11px 14px', background: '#eef3fb', borderRadius: 10, fontSize: 13, color: '#0C447C', borderLeft: '3px solid #1f5fa6', lineHeight: 1.6 }}>
                🏗️ <strong>Blueprint Mode:</strong> AI analyzes for missing elements, code violations, what to add/remove, and cost-saving opportunities.
              </div>
            )}
          </div>

          {/* UPLOAD */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragEnter={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              style={{
                width: '100%', padding: '18px 20px', fontSize: 15, fontWeight: 700,
                borderRadius: 14, cursor: uploading ? 'default' : 'pointer',
                border: `2px dashed ${dragOver ? '#c2541f' : isBlueprint ? '#1f5fa6' : '#d95f2b'}`,
                background: dragOver ? '#fdf0e8' : isBlueprint ? '#eef3fb' : '#d95f2b',
                color: dragOver ? '#d95f2b' : isBlueprint ? '#1f5fa6' : 'white',
                fontFamily: 'inherit', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {uploading ? `⏳ ${isBlueprint ? 'Analyzing blueprint...' : 'Uploading...'}` :
               dragOver ? '📂 Drop to upload' :
               isBlueprint ? '🏗️ Upload Blueprint for AI Analysis' : '+ Add Document'}
            </button>
            {processingStep && (
              <div style={{ marginTop: 10, background: isBlueprint ? '#eef3fb' : '#E6F1FB', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#0C447C', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚙️</span>{processingStep}
              </div>
            )}
            <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp" style={{ display: 'none' }} onChange={e => e.target.files && uploadFiles(e.target.files)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* LEFT — folders + doc list */}
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {FOLDERS.map(folder => {
                  const count = folderCounts[folder.id] || 0
                  if (folder.id !== 'all' && count === 0) return null
                  return (
                    <button key={folder.id} onClick={() => setActiveFolder(folder.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
                      fontSize: 12, fontWeight: 500, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${activeFolder === folder.id ? '#0f0f0f' : 'rgba(0,0,0,0.1)'}`,
                      background: activeFolder === folder.id ? '#0f0f0f' : 'white',
                      color: activeFolder === folder.id ? 'white' : '#6b6a66', transition: 'all 0.12s',
                    }}>
                      <span>{folder.icon}</span><span>{folder.label}</span>
                      {count > 0 && <span style={{ background: activeFolder === folder.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)', borderRadius: 20, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>{count}</span>}
                    </button>
                  )
                })}
              </div>

              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{FOLDERS.find(f => f.id === activeFolder)?.icon} {FOLDERS.find(f => f.id === activeFolder)?.label}</div>
                  <span style={{ fontSize: 12, color: '#9e9d99' }}>{filteredDocs.length} files</span>
                </div>
                {filteredDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: '#9e9d99', fontSize: 13 }}>
                    {activeFolder === 'all' ? 'No documents yet — upload your first above' : `No ${activeFolder}s uploaded yet`}
                  </div>
                ) : filteredDocs.map(doc => (
                  <div key={doc.id} onClick={() => setSelected(doc)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', borderRadius: 8,
                    background: selected?.id === doc.id ? '#f8f7f4' : 'transparent', transition: 'background 0.1s',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: doc.doc_type === 'blueprint' ? '#eef3fb' : '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                      {DOC_ICONS[doc.doc_type] || '📄'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                      <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 2 }}>{format(parseISO(doc.created_at), 'MMM d · h:mm a')}</div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap',
                      background: doc.status === 'extracted' || doc.status === 'saved' ? '#edf5f0' : doc.status === 'needs_review' ? '#fdf0f0' : '#fdf4e3',
                      color: doc.status === 'extracted' || doc.status === 'saved' ? '#1a4d31' : doc.status === 'needs_review' ? '#6e1a1a' : '#6b4010',
                    }}>
                      {doc.status === 'processing' || doc.status === 'uploading' ? '⏳ Reading' : doc.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={e => deleteDocument(doc, e)}
                      disabled={deletingId === doc.id}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#9e9d99', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                      onMouseEnter={e => { (e.currentTarget.style.background = '#fdf0f0'); (e.currentTarget.style.color = '#b83232') }}
                      onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#9e9d99') }}
                    >
                      {deletingId === doc.id ? '…' : '×'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — AI extraction + permit tracker */}
            <div>
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>
                      {selected?.doc_type === 'blueprint' ? '🏗️ Blueprint Analysis' : 'AI Extraction Preview'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9e9d99', marginTop: 2 }}>{selected?.name || 'Select a document'}</div>
                    {selected && <div style={{ fontSize: 11, color: '#9e9d99', marginTop: 1 }}>{format(parseISO(selected.created_at), 'MMM d, yyyy · h:mm a')}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selected?.extracted_data && selected.status !== 'saved' && (
                      <button onClick={() => saveToDB(selected)} disabled={savingId === selected.id} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid #1a1a1a', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}>
                        {savingId === selected.id ? 'Saving...' : 'Save'}
                      </button>
                    )}
                    {selected?.extracted_data && subs.length > 0 && (
                      <button onClick={() => { setScopePanel(v => !v); setScopeDraft('') }} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: scopePanel ? '#f8f7f4' : 'transparent', fontFamily: 'inherit' }}>
                        → Send Scope
                      </button>
                    )}
                  </div>
                </div>

                {!selected ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#9e9d99', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
                    Upload a document or click one to see AI extraction
                  </div>
                ) : selected.status === 'processing' || selected.status === 'uploading' ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{selected.doc_type === 'blueprint' ? '🏗️' : '⚙️'}</div>
                    <div style={{ fontSize: 13, color: '#6b6a66', marginBottom: 6 }}>
                      {selected.doc_type === 'blueprint' ? 'AI is analyzing your blueprint...' : 'AI is reading this document...'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9e9d99' }}>{processingStep || 'Processing...'}</div>
                  </div>
                ) : selected.status === 'needs_review' ? (
                  <div style={{ background: '#fdf0f0', borderRadius: 9, padding: '12px 14px', fontSize: 13, color: '#6e1a1a', borderLeft: '3px solid #b83232' }}>
                    ⚠️ Could not auto-extract. Try uploading a clearer image or PDF.
                    {selected.ai_notes && <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>{selected.ai_notes}</div>}
                  </div>
                ) : selected.extracted_data ? (
                  <div>
                    <div style={{ background: '#f8f7f4', borderRadius: 9, padding: 14, fontSize: 12, lineHeight: 1.9 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 16px' }}>
                        {selected.extracted_data.permit_number && <><span style={{ color: '#9e9d99' }}>Permit No.</span><span style={{ fontWeight: 700, fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '0 6px', borderRadius: 4 }}>{selected.extracted_data.permit_number}</span></>}
                        {selected.extracted_data.expiry_date && <><span style={{ color: '#9e9d99' }}>Expires</span><span style={{ color: '#d95f2b', fontWeight: 700 }}>{selected.extracted_data.expiry_date}</span></>}
                        {selected.extracted_data.permit_type && <><span style={{ color: '#9e9d99' }}>Type</span><span>{selected.extracted_data.permit_type}</span></>}
                        {selected.extracted_data.jurisdiction && <><span style={{ color: '#9e9d99' }}>Jurisdiction</span><span>{selected.extracted_data.jurisdiction}</span></>}
                        {selected.extracted_data.valuation && <><span style={{ color: '#9e9d99' }}>Valuation</span><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>${Number(selected.extracted_data.valuation).toLocaleString()}</span></>}
                        {selected.extracted_data.contractor_name && <><span style={{ color: '#9e9d99' }}>Contractor</span><span>{selected.extracted_data.contractor_name}</span></>}
                        {selected.extracted_data.inspector_name && <><span style={{ color: '#9e9d99' }}>Inspector</span><span>{selected.extracted_data.inspector_name}</span></>}
                      </div>

                      {selected.extracted_data.what_to_add?.length > 0 && (
                        <div style={{ marginTop: 12, padding: '10px 12px', background: '#edf5f0', borderRadius: 8, borderLeft: '3px solid #2d7a4f' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1a4d31', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>✓ What to Add</div>
                          {selected.extracted_data.what_to_add.map((item: string, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: '#1a4d31', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span><span>{item}</span></div>
                          ))}
                        </div>
                      )}
                      {selected.extracted_data.what_to_remove?.length > 0 && (
                        <div style={{ marginTop: 8, padding: '10px 12px', background: '#fdf0f0', borderRadius: 8, borderLeft: '3px solid #b83232' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6e1a1a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>✗ What to Remove</div>
                          {selected.extracted_data.what_to_remove.map((item: string, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: '#6e1a1a', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span><span>{item}</span></div>
                          ))}
                        </div>
                      )}
                      {selected.extracted_data.code_issues?.length > 0 && (
                        <div style={{ marginTop: 8, padding: '10px 12px', background: '#fdf4e3', borderRadius: 8, borderLeft: '3px solid #b06e1a' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b4010', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>⚠ Code Issues</div>
                          {selected.extracted_data.code_issues.map((item: string, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: '#6b4010', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span><span>{item}</span></div>
                          ))}
                        </div>
                      )}
                      {selected.extracted_data.cost_saving_opportunities?.length > 0 && (
                        <div style={{ marginTop: 8, padding: '10px 12px', background: '#eef3fb', borderRadius: 8, borderLeft: '3px solid #1f5fa6' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0C447C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>💡 Cost Savings</div>
                          {selected.extracted_data.cost_saving_opportunities.map((item: string, i: number) => (
                            <div key={i} style={{ fontSize: 12, color: '#0C447C', marginBottom: 5, display: 'flex', gap: 6 }}><span>•</span><span>{item}</span></div>
                          ))}
                        </div>
                      )}
                      {selected.extracted_data.flags?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          {selected.extracted_data.flags.map((f: any, i: number) => (
                            <div key={i} style={{ marginTop: 6, padding: '8px 12px', borderRadius: 7, borderLeft: `3px solid ${f.severity === 'critical' ? '#b83232' : '#b06e1a'}`, background: f.severity === 'critical' ? '#fdf0f0' : '#fdf4e3', color: f.severity === 'critical' ? '#6e1a1a' : '#6b4010', fontSize: 12 }}>
                              {f.severity === 'critical' ? '🔴' : '⚠️'} {f.message}
                            </div>
                          ))}
                        </div>
                      )}

                      <button onClick={() => setShowFullExtract(v => !v)} style={{ marginTop: 10, background: 'none', border: 'none', color: '#9e9d99', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                        {showFullExtract ? '▲ Hide details' : '▼ Show AI notes'}
                      </button>
                      {showFullExtract && selected.ai_notes && (
                        <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.04)', borderRadius: 7, fontSize: 12, color: '#6b6a66', lineHeight: 1.65 }}>
                          <strong style={{ color: '#0f0f0f' }}>AI Summary: </strong>{selected.ai_notes}
                        </div>
                      )}
                    </div>

                    {selected.status === 'saved' && (
                      <div style={{ marginTop: 10, background: '#edf5f0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#1a4d31', fontWeight: 600 }}>✓ Saved to project database</div>
                    )}

                    {scopePanel && (
                      <div style={{ marginTop: 12, background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Send Scope to Sub</div>
                        <div style={{ fontSize: 11, color: '#9e9d99', marginBottom: 10 }}>AI sends only this sub's relevant scope — no budget, no internal flags.</div>
                        <select value={scopeSubId} onChange={e => { setScopeSubId(e.target.value); setScopeDraft('') }} style={{ width: '100%', fontSize: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, padding: '7px 10px', background: 'white', fontFamily: 'inherit', marginBottom: 10 }}>
                          <option value=''>Select a subcontractor...</option>
                          {subs.map(s => <option key={s.id} value={s.id}>{s.company_name} — {s.trade}</option>)}
                        </select>
                        {scopeSubId && !scopeDraft && (
                          <button onClick={draftScope} disabled={scopeLoading} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>
                            {scopeLoading ? 'Drafting...' : 'AI Draft Email'}
                          </button>
                        )}
                        {scopeDraft && (
                          <>
                            <textarea value={scopeDraft} onChange={e => setScopeDraft(e.target.value)} rows={7} style={{ width: '100%', fontSize: 12, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '9px 11px', background: 'white', fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', marginBottom: 8 }} />
                            <div style={{ display: 'flex', gap: 7 }}>
                              <button onClick={sendScope} disabled={scopeSending} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid #1a1a1a', background: '#1a1a1a', color: 'white', fontFamily: 'inherit' }}>
                                {scopeSending ? 'Sending...' : 'Send →'}
                              </button>
                              <button onClick={draftScope} disabled={scopeLoading} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Redraft</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#9e9d99', fontSize: 13 }}>No data extracted yet</div>
                )}
              </div>

              {/* PERMIT TRACKER */}
              <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Permit Tracker</div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: '#E6F1FB', color: '#0C447C' }}>{permits.length} active</span>
                </div>
                {permits.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#9e9d99', fontSize: 13 }}>Upload a permit PDF and it will appear here automatically</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr>{['Permit', 'Issued', 'Expires', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#9e9d99', borderBottom: '1px solid rgba(0,0,0,0.06)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {permits.map(p => {
                        const days = p.expiry_date ? differenceInDays(parseISO(p.expiry_date), today) : null
                        const urgent  = days !== null && days <= 14
                        const warning = days !== null && days <= 30 && days > 14
                        return (
                          <tr key={p.id} onMouseEnter={e => (e.currentTarget.style.background = '#f8f7f4')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{p.permit_number}</div>
                              <div style={{ fontSize: 11, color: '#9e9d99' }}>{p.permit_type}</div>
                            </td>
                            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 12, color: '#6b6a66' }}>
                              {p.issued_date ? format(parseISO(p.issued_date), 'MMM d, yyyy') : '—'}
                            </td>
                            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              {p.expiry_date ? (
                                <div>
                                  <div style={{ fontSize: 12, color: urgent ? '#b83232' : warning ? '#d95f2b' : '#0f0f0f', fontWeight: urgent ? 700 : 500 }}>{format(parseISO(p.expiry_date), 'MMM d, yyyy')}</div>
                                  {days !== null && days >= 0 && days <= 30 && <div style={{ fontSize: 10, color: urgent ? '#b83232' : '#d95f2b', fontWeight: 600 }}>{days}d left</div>}
                                  {days !== null && days < 0 && <div style={{ fontSize: 10, color: '#b83232', fontWeight: 700 }}>EXPIRED</div>}
                                </div>
                              ) : '—'}
                            </td>
                            <td style={{ padding: '10px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: p.status === 'active' ? '#edf5f0' : p.status === 'expiring_soon' ? '#fdf4e3' : p.status === 'expired' ? '#fdf0f0' : '#f1ede6', color: p.status === 'active' ? '#1a4d31' : p.status === 'expiring_soon' ? '#6b4010' : p.status === 'expired' ? '#6e1a1a' : '#6b6a66' }}>
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
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#b83232' : '#2d7a4f', color: 'white', padding: '11px 18px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', maxWidth: 340 }}>
          {toast.msg}
        </div>
      )}
    </>
  )
}
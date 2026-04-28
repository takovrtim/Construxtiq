'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Project, TrainingModule, Document } from '@/types'

interface Props {
  user: User
  project: Project | null
  initialModules: TrainingModule[]
  blueprints: Pick<Document, 'id' | 'name' | 'doc_type' | 'created_at'>[]
}

const STATUS_CLASS: Record<string, string> = { published: 'p-green', draft: 'p-amber', generating: 'p-gray' }

const DEFAULT_TITLES = [
  'Safety & Site Orientation',
  'Reading Site Blueprints',
  'Permit Requirements for Crew',
  'Foundation & Concrete Work',
  'MEP Coordination',
  'Quality Control Checkpoints',
  'Tool & Equipment Protocol',
  'New Employee Onboarding',
]

export function TrainingClient({ user, project, initialModules, blueprints }: Props) {
  const [modules, setModules]       = useState<TrainingModule[]>(initialModules)
  const [selected, setSelected]     = useState<TrainingModule | null>(null)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast]           = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [selectedDocId, setSelectedDocId] = useState(blueprints[0]?.id ?? '')
  const [showGenForm, setShowGenForm] = useState(false)

  function showMsg(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3200) }

  async function generateModule(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !customTitle) return
    setGenerating(true)

    // Create a placeholder module record
    const moduleNum = (modules.length > 0 ? Math.max(...modules.map(m => m.module_number)) : 0) + 1
    const { data: placeholderModule, error: insertError } = await supabase
      .from('training_modules')
      .insert({
        project_id: project.id,
        user_id: user.id,
        document_id: selectedDocId || null,
        title: customTitle,
        module_number: moduleNum,
        content: '',
        status: 'generating',
      })
      .select()
      .single()

    if (insertError || !placeholderModule) {
      showMsg('Failed to create module')
      setGenerating(false)
      return
    }

    setModules(prev => [...prev, placeholderModule as TrainingModule])
    setShowGenForm(false)
    setCustomTitle('')

    // Call the generate API
    const res = await fetch('/api/training/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_id: placeholderModule.id,
        project_id: project.id,
        document_id: selectedDocId || null,
        title: customTitle,
      }),
    })

    const json = await res.json()
    if (json.success) {
      // Reload the module with generated content
      const { data: updated } = await supabase
        .from('training_modules')
        .select('*')
        .eq('id', placeholderModule.id)
        .single()
      if (updated) {
        setModules(prev => prev.map(m => m.id === placeholderModule.id ? updated as TrainingModule : m))
      }
      showMsg(`"${customTitle}" module generated`)
    } else {
      showMsg('Generation failed — check AI config')
      await supabase.from('training_modules').update({ status: 'draft' }).eq('id', placeholderModule.id)
      setModules(prev => prev.map(m => m.id === placeholderModule.id ? { ...m, status: 'draft' } : m))
    }
    setGenerating(false)
  }

  async function publishModule(id: string) {
    const { error } = await supabase.from('training_modules').update({ status: 'published' }).eq('id', id)
    if (!error) {
      setModules(prev => prev.map(m => m.id === id ? { ...m, status: 'published' } : m))
      showMsg('Module published')
    }
  }

  async function deleteModule(id: string) {
    if (!confirm('Delete this module?')) return
    const { error } = await supabase.from('training_modules').delete().eq('id', id)
    if (!error) {
      setModules(prev => prev.filter(m => m.id !== id))
      if (selected?.id === id) setSelected(null)
      showMsg('Deleted')
    }
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>No project selected</div>
      <a href="/dashboard?new=1" style={{ color: 'var(--orange)', textDecoration: 'none', fontSize: 13 }}>Create a project →</a>
    </div>
  )

  return (
    <>
      <div className="ptitle">Training Hub</div>
      <p className="psub">AI converts your blueprints and permits into crew training modules — new hire gets a link, not a meeting</p>

      {/* Source document banner */}
      {blueprints.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 22 }}>🏗️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{blueprints[0].name}</div>
              <div className="tsm tm">{modules.length} modules generated · Source document</div>
            </div>
            <button className="btn btn-sm btn-p" onClick={() => setShowGenForm(v => !v)} disabled={generating}>
              {generating ? 'Generating…' : '+ Generate Module'}
            </button>
          </div>

          {showGenForm && (
            <form onSubmit={generateModule} style={{ marginTop: 14, background: 'var(--bg)', borderRadius: 'var(--radius)', padding: 14, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <label className="input-label">Module title *</label>
                <input className="input" placeholder="e.g. Safety & Site Orientation" value={customTitle} onChange={e => setCustomTitle(e.target.value)} required autoFocus list="title-suggestions" />
                <datalist id="title-suggestions">
                  {DEFAULT_TITLES.map(t => <option key={t} value={t} />)}
                </datalist>
              </div>
              {blueprints.length > 1 && (
                <div>
                  <label className="input-label">Source document</label>
                  <select className="input" value={selectedDocId} onChange={e => setSelectedDocId(e.target.value)}>
                    {blueprints.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-sm btn-p" disabled={generating || !customTitle}>
                  {generating ? 'Generating…' : 'Generate'}
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setShowGenForm(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {blueprints.length === 0 && (
        <div className="alert alert-b" style={{ marginBottom: 16 }}>
          Upload a blueprint or permit in Documents first — AI needs source material to generate training modules.
        </div>
      )}

      <div className="g2">
        {/* LEFT: Module grid */}
        <div>
          <div className="g2" style={{ gap: 12 }}>
            {modules.length === 0 ? (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 20px', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📖</div>
                <div style={{ fontSize: 13 }}>No modules yet — click &ldquo;+ Generate Module&rdquo; above</div>
              </div>
            ) : (
              modules.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelected(m)}
                  style={{
                    background: 'var(--surface)', border: `1px solid ${selected?.id === m.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)', padding: 15, cursor: 'pointer', transition: 'all 0.15s',
                    opacity: m.status === 'generating' ? 0.6 : 1,
                  }}
                >
                  <div className="tf tsm" style={{ marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                    Module {String(m.module_number).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{m.title}</div>
                  <div className="tsm tm" style={{ lineHeight: 1.5 }}>
                    {m.content ? m.content.slice(0, 80) + '…' : m.status === 'generating' ? 'AI is writing this module…' : 'No content yet'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
                    <span className={`pill ${STATUS_CLASS[m.status] || 'p-gray'}`}>
                      {m.status === 'generating' ? <><span className="dot-1"/><span className="dot-2"/><span className="dot-3"/></> : m.status}
                    </span>
                    <span className="tsm tf">{m.read_time_minutes ? `${m.read_time_minutes} min` : '—'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT: Module reader */}
        <div>
          {!selected ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📖</div>
              <div style={{ fontSize: 13 }}>Select a module to read and share</div>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="tf tsm" style={{ marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Module {selected.module_number}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.title}</div>
                  <div className="tsm tm" style={{ marginTop: 3 }}>
                    {selected.read_time_minutes ? `${selected.read_time_minutes} min read · ` : ''}
                    <span className={`pill ${STATUS_CLASS[selected.status] || 'p-gray'}`}>{selected.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                  {selected.status === 'draft' && (
                    <button className="btn btn-sm btn-p" onClick={() => publishModule(selected.id)}>Publish</button>
                  )}
                  <button className="btn btn-sm" onClick={() => deleteModule(selected.id)} style={{ color: 'var(--red)' }}>Delete</button>
                </div>
              </div>

              {selected.status === 'generating' ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-2)' }}>
                  <div style={{ marginBottom: 8, fontSize: 13 }}>AI is generating this module…</div>
                  <span className="dot-1"/><span className="dot-2"/><span className="dot-3"/>
                </div>
              ) : selected.content ? (
                <div style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                  {selected.content}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-3)', fontSize: 13 }}>
                  No content. <button onClick={() => showMsg('Re-generate coming in v1.1')} style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Regenerate →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}

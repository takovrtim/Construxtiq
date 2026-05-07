'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'

interface ChangeOrder {
  id: string
  project_id: string
  job_id: string | null
  title: string
  description: string
  requested_by: 'owner' | 'gc' | 'engineer' | 'inspector'
  category: 'scope' | 'material' | 'labor' | 'permit' | 'design' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  cost_impact: number
  time_impact_days: number
  revision_number: number
  requires_permit_revision: boolean
  ai_summary: string | null
  approval_token: string | null
  owner_notes: string | null
  decided_at: string | null
  created_at: string
}

interface Props {
  user: any
  project: any
  initialChanges: ChangeOrder[]
  jobs: { id: string; title: string }[]
}

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: '#fdf4e3', text: '#6b4010', dot: '#EF9F27' },
  approved:    { label: 'Approved',    bg: '#edf5f0', text: '#1a4d31', dot: '#2d7a4f' },
  rejected:    { label: 'Rejected',    bg: '#fdf0f0', text: '#6e1a1a', dot: '#b83232' },
  in_progress: { label: 'In Progress', bg: '#eef3fb', text: '#0C447C', dot: '#378ADD' },
  completed:   { label: 'Completed',   bg: '#f1ede6', text: '#6b6a66', dot: '#9e9d99' },
}

const CATEGORY_CONFIG = {
  scope:    { label: 'Scope Change',      icon: '🔄', color: '#7F77DD' },
  material: { label: 'Material Change',   icon: '🏗️', color: '#378ADD' },
  labor:    { label: 'Labor Change',      icon: '👷', color: '#2d7a4f' },
  permit:   { label: 'Permit Revision',   icon: '📋', color: '#b06e1a' },
  design:   { label: 'Design Change',     icon: '✏️', color: '#d95f2b' },
  other:    { label: 'Other',             icon: '📝', color: '#9e9d99' },
}

const REQUESTED_BY = ['owner', 'gc', 'engineer', 'inspector']

export function ChangesClient({ user, project, initialChanges, jobs }: Props) {
  const [changes, setChanges]     = useState<ChangeOrder[]>(initialChanges)
  const [selected, setSelected]   = useState<ChangeOrder | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [toast, setToast]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalLink, setApprovalLink] = useState('')

  // Form state
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [requestedBy, setRequestedBy] = useState<ChangeOrder['requested_by']>('owner')
  const [category, setCategory]     = useState<ChangeOrder['category']>('scope')
  const [costImpact, setCostImpact] = useState('')
  const [timeImpact, setTimeImpact] = useState('')
  const [jobId, setJobId]           = useState('')
  const [requiresPermit, setRequiresPermit] = useState(false)

  function msg(text: string) { setToast(text); setTimeout(() => setToast(''), 3000) }

  // Computed totals
  const totalCostImpact = changes.filter(c => c.status !== 'rejected').reduce((s, c) => s + Number(c.cost_impact || 0), 0)
  const totalDays = changes.filter(c => c.status !== 'rejected').reduce((s, c) => s + Number(c.time_impact_days || 0), 0)
  const pending = changes.filter(c => c.status === 'pending').length
  const needsPermit = changes.filter(c => c.requires_permit_revision && c.status !== 'rejected').length
  const nextRevision = changes.length > 0 ? Math.max(...changes.map(c => c.revision_number)) + 1 : 1

  const filtered = filterStatus === 'all' ? changes : changes.filter(c => c.status === filterStatus)

  async function addChange(e: React.FormEvent) {
    e.preventDefault()
    if (!project) return
    setSaving(true)

    const { data, error } = await supabase.from('change_orders').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      title: title.trim(),
      description: description.trim(),
      requested_by: requestedBy,
      category,
      status: 'pending',
      cost_impact: parseFloat(costImpact) || 0,
      time_impact_days: parseInt(timeImpact) || 0,
      revision_number: nextRevision,
      requires_permit_revision: requiresPermit,
      ai_summary: null,
    }).select().single()

    if (!error && data) {
      setChanges(prev => [data as ChangeOrder, ...prev])
      msg(`✓ Change Order #${nextRevision} added`)
      setTitle(''); setDescription(''); setCostImpact(''); setTimeImpact('')
      setJobId(''); setRequiresPermit(false); setShowAdd(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function updateStatus(id: string, newStatus: ChangeOrder['status']) {
    const { error } = await supabase.from('change_orders').update({ status: newStatus }).eq('id', id)
    if (!error) {
      setChanges(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: newStatus } : null)
      msg(`✓ Status updated to ${STATUS_CONFIG[newStatus].label}`)
    }
  }

  async function generateAISummary(change: ChangeOrder) {
    setAiLoading(true)
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change_id: change.id,
          title: change.title,
          description: change.description,
          category: change.category,
          requested_by: change.requested_by,
          cost_impact: change.cost_impact,
          time_impact_days: change.time_impact_days,
          requires_permit_revision: change.requires_permit_revision,
          project_name: project?.name,
        }),
      })
      const json = await res.json()
      if (json.success) {
        await supabase.from('change_orders').update({ ai_summary: json.summary }).eq('id', change.id)
        setChanges(prev => prev.map(c => c.id === change.id ? { ...c, ai_summary: json.summary } : c))
        setSelected(prev => prev ? { ...prev, ai_summary: json.summary } : null)
        msg('✓ AI summary generated')
      }
    } catch { msg('AI summary failed') }
    setAiLoading(false)
  }

  async function deleteChange(id: string) {
    if (!confirm('Delete this change order?')) return
    const { error } = await supabase.from('change_orders').delete().eq('id', id)
    if (!error) { setChanges(prev => prev.filter(c => c.id !== id)); setSelected(null); msg('Deleted') }
  }

  async function generateApprovalLink(change: ChangeOrder) {
    setApprovalLoading(true)
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_token', change_id: change.id }),
      })
      const json = await res.json()
      if (json.success) {
        setApprovalLink(json.approvalUrl)
        await navigator.clipboard.writeText(json.approvalUrl)
        msg('✓ Approval link copied — send to owner')
      }
    } catch { msg('Failed to generate link') }
    setApprovalLoading(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', color: '#0f0f0f' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Change Orders</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>
            Track every scope change, revision, and cost impact — nothing falls through the cracks
          </div>
        </div>
        <button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showAdd ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showAdd ? '✕ Cancel' : '+ New Change Order'}
        </button>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Cost Impact', value: `$${totalCostImpact.toLocaleString()}`, sub: `${changes.filter(c=>c.status!=='rejected').length} active changes`, accent: totalCostImpact > 0 ? '#b06e1a' : '' },
          { label: 'Time Added', value: `${totalDays}d`, sub: 'to project timeline', accent: totalDays > 7 ? '#b83232' : '' },
          { label: 'Pending Approval', value: pending, sub: 'need owner sign-off', accent: pending > 0 ? '#b06e1a' : '' },
          { label: 'Permit Revisions', value: needsPermit, sub: 'require resubmission', accent: needsPermit > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: s.accent || '#0f0f0f', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent ? s.accent : '#9e9d99' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Change Order #{nextRevision}</div>
            <div style={{ fontSize: 12, color: '#9e9d99' }}>All changes are logged and timestamped</div>
          </div>

          {/* Category selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Category</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(Object.keys(CATEGORY_CONFIG) as ChangeOrder['category'][]).map(cat => {
                const cfg = CATEGORY_CONFIG[cat]
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: category === cat ? 700 : 500, borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${category === cat ? cfg.color : 'rgba(0,0,0,0.1)'}`, background: category === cat ? `${cfg.color}15` : 'white', color: category === cat ? cfg.color : '#6b6a66', transition: 'all 0.12s' }}>
                    <span>{cfg.icon}</span><span>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form onSubmit={addChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Change Title *</label>
              <input style={inp} placeholder="e.g. Owner requested recessed lighting instead of pendant fixtures" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Requested By</label>
                <select style={{ ...inp, background: 'white' }} value={requestedBy} onChange={e => setRequestedBy(e.target.value as any)}>
                  {REQUESTED_BY.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Cost Impact ($)</label>
                <input style={inp} type="number" placeholder="1500" value={costImpact} onChange={e => setCostImpact(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Time Impact (days)</label>
                <input style={inp} type="number" placeholder="2" value={timeImpact} onChange={e => setTimeImpact(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Related Job</label>
                <select style={{ ...inp, background: 'white' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                  <option value="">No specific job</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" id="permit" checked={requiresPermit} onChange={e => setRequiresPermit(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#b83232' }} />
                <label htmlFor="permit" style={{ fontSize: 13, fontWeight: 500, cursor: 'pointer', color: requiresPermit ? '#b83232' : '#6b6a66' }}>
                  📋 Requires permit revision
                </label>
              </div>
            </div>

            <div>
              <label style={lbl}>Description / Details</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Describe what's changing, why, and any relevant details the owner requested..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {requiresPermit && (
              <div style={{ padding: '11px 14px', background: '#fdf4e3', borderRadius: 10, fontSize: 13, color: '#6b4010', borderLeft: '3px solid #b06e1a' }}>
                ⚠️ This change requires a permit revision — budget extra time for resubmission and approval.
              </div>
            )}

            {costImpact && parseFloat(costImpact) > 0 && (
              <div style={{ padding: '11px 14px', background: '#edf5f0', borderRadius: 10, fontSize: 13, color: '#1a4d31', borderLeft: '3px solid #2d7a4f' }}>
                💰 This change adds <strong>${parseFloat(costImpact).toLocaleString()}</strong> to the project cost. Get owner written approval before proceeding.
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
                {saving ? 'Saving...' : 'Log Change Order'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f8f7f4', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: filterStatus === s ? 700 : 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filterStatus === s ? 'white' : 'transparent', color: filterStatus === s ? '#0f0f0f' : '#9e9d99', boxShadow: filterStatus === s ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', textTransform: 'capitalize' }}>
            {s === 'all' ? `All (${changes.length})` : `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label} (${changes.filter(c => c.status === s).length})`}
          </button>
        ))}
      </div>

      {/* CHANGE ORDERS LIST */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'white', borderRadius: 16, border: '2px dashed rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{changes.length === 0 ? 'No change orders yet' : 'No results'}</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 20 }}>
            {changes.length === 0 ? 'Log every scope change to protect yourself and get paid for extra work' : 'Try a different filter'}
          </div>
          {changes.length === 0 && <button onClick={() => setShowAdd(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Change Order</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(change => {
            const sc = STATUS_CONFIG[change.status]
            const cat = CATEGORY_CONFIG[change.category]
            const job = jobs.find(j => j.id === change.job_id)
            return (
              <div key={change.id} onClick={() => setSelected(change === selected ? null : change)} style={{ background: 'white', border: `1.5px solid ${selected?.id === change.id ? '#0f0f0f' : 'rgba(0,0,0,0.07)'}`, borderRadius: 14, padding: 18, cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected?.id === change.id ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Revision badge */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#0f0f0f', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Rev</div>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px' }}>#{change.revision_number}</div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{change.title}</span>
                      {change.requires_permit_revision && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fdf4e3', color: '#6b4010' }}>📋 Permit Revision</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: cat.color, fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                      <span style={{ fontSize: 11, color: '#9e9d99' }}>by {change.requested_by}</span>
                      {job && <span style={{ fontSize: 11, color: '#9e9d99' }}>· {job.title}</span>}
                      <span style={{ fontSize: 11, color: '#9e9d99' }}>· {format(parseISO(change.created_at), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    {change.cost_impact !== 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: change.cost_impact > 0 ? '#b06e1a' : '#2d7a4f', letterSpacing: '-0.5px' }}>
                          {change.cost_impact > 0 ? '+' : ''}${Math.abs(change.cost_impact).toLocaleString()}
                        </div>
                        {change.time_impact_days > 0 && <div style={{ fontSize: 11, color: '#9e9d99' }}>+{change.time_impact_days}d</div>}
                      </div>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{sc.label}</span>
                  </div>
                </div>

                {change.description && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#6b6a66', lineHeight: 1.6, paddingLeft: 56 }}>
                    {change.description}
                  </div>
                )}

                {change.ai_summary && (
                  <div style={{ marginTop: 10, paddingLeft: 56 }}>
                    <div style={{ padding: '10px 12px', background: '#eef3fb', borderRadius: 9, fontSize: 12, color: '#0C447C', borderLeft: '3px solid #1f5fa6', lineHeight: 1.65 }}>
                      ✨ <strong>AI Summary:</strong> {change.ai_summary}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: 'white', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-12px 0 48px rgba(0,0,0,0.15)', zIndex: 100, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Change Order #{selected.revision_number}</div>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.4 }}>{selected.title}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#f8f7f4', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9e9d99', flexShrink: 0 }}>×</button>
            </div>

            {/* Financial impact */}
            <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cost Impact</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: selected.cost_impact > 0 ? '#fbbf24' : '#4ade80' }}>
                    {selected.cost_impact > 0 ? '+' : ''}${Math.abs(selected.cost_impact).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Time Impact</div>
                  <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: selected.time_impact_days > 0 ? '#f87171' : 'white' }}>
                    +{selected.time_impact_days} days
                  </div>
                </div>
              </div>
              {selected.requires_permit_revision && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#fbbf24' }}>
                  📋 Requires permit revision — allow extra time
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ background: '#f8f7f4', borderRadius: 11, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 80 }}>Category</span><span style={{ fontWeight: 600 }}>{CATEGORY_CONFIG[selected.category].icon} {CATEGORY_CONFIG[selected.category].label}</span></div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 80 }}>Requested by</span><span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{selected.requested_by}</span></div>
              <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 80 }}>Logged</span><span>{format(parseISO(selected.created_at), 'MMM d, yyyy · h:mm a')}</span></div>
              {selected.description && <div style={{ display: 'flex', gap: 10 }}><span style={{ color: '#9e9d99', minWidth: 80 }}>Details</span><span style={{ lineHeight: 1.6 }}>{selected.description}</span></div>}
            </div>

            {/* AI Summary */}
            <div style={{ marginBottom: 16 }}>
              {selected.ai_summary ? (
                <div style={{ padding: '12px 14px', background: '#eef3fb', borderRadius: 10, fontSize: 13, color: '#0C447C', borderLeft: '3px solid #1f5fa6', lineHeight: 1.7 }}>
                  ✨ <strong>AI Summary:</strong> {selected.ai_summary}
                </div>
              ) : (
                <button onClick={() => generateAISummary(selected)} disabled={aiLoading} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, borderRadius: 10, cursor: aiLoading ? 'not-allowed' : 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: aiLoading ? '#f8f7f4' : 'white', fontFamily: 'inherit', color: aiLoading ? '#9e9d99' : '#0f0f0f' }}>
                  {aiLoading ? '⚙️ Generating...' : '✨ Generate AI Summary'}
                </button>
              )}
            </div>

            {/* Status update */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Update Status</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
              {(Object.keys(STATUS_CONFIG) as ChangeOrder['status'][]).map(s => {
                const cfg = STATUS_CONFIG[s]
                const active = selected.status === s
                return (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${active ? cfg.dot : 'rgba(0,0,0,0.07)'}`, background: active ? cfg.bg : 'white', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .12s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot }} />
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? cfg.text : '#6b6a66', flex: 1 }}>{cfg.label}</span>
                    {active && <span style={{ color: cfg.dot }}>✓</span>}
                  </button>
                )
              })}
            </div>

            {/* Send for Approval */}
            <div style={{ marginBottom: 12 }}>
              <button onClick={() => generateApprovalLink(selected)} disabled={approvalLoading} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: approvalLoading ? 'not-allowed' : 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit', marginBottom: 8 }}>
                {approvalLoading ? '⏳ Generating...' : '🔗 Send for Owner Approval'}
              </button>
              {approvalLink && (
                <div style={{ padding: '10px 12px', background: '#edf5f0', borderRadius: 9, fontSize: 12, color: '#1a4d31', wordBreak: 'break-all' }}>
                  ✓ Link copied! <span style={{ opacity: 0.6 }}>{approvalLink}</span>
                </div>
              )}
              {selected.owner_notes && (
                <div style={{ marginTop: 8, padding: '10px 12px', background: '#f8f7f4', borderRadius: 9, fontSize: 12, color: '#6b6a66' }}>
                  <strong>Owner notes:</strong> {selected.owner_notes}
                </div>
              )}
            </div>
            <button onClick={() => deleteChange(selected.id)} style={{ width: '100%', padding: '10px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit' }}>
              Delete Change Order
            </button>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: selected ? 424 : 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
          {toast}
        </div>
      )}
    </>
  )
}

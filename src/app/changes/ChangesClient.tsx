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
  requested_by: 'gc' | 'owner' | 'engineer' | 'inspector' | 'us'
  category: 'scope' | 'material' | 'labor' | 'permit' | 'design' | 'other'
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed'
  cost_impact: number
  time_impact_days: number
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
  pending:     { label: 'Pending GC Approval', color: '#b06e1a', bg: '#fdf4e3', dot: '#b06e1a' },
  approved:    { label: 'Approved',            color: '#1a4d31', bg: '#edf5f0', dot: '#2d7a4f' },
  rejected:    { label: 'Rejected',            color: '#6e1a1a', bg: '#fdf0f0', dot: '#b83232' },
  in_progress: { label: 'In Progress',         color: '#0C447C', bg: '#eef3fb', dot: '#1f5fa6' },
  completed:   { label: 'Completed',           color: '#1a4d31', bg: '#edf5f0', dot: '#2d7a4f' },
}

const REQUESTED_BY = {
  gc:       'General Contractor',
  owner:    'Owner',
  engineer: 'Engineer',
  inspector:'Inspector',
  us:       'Our Team',
}

const CATEGORIES = {
  scope:    'Scope Change',
  material: 'Material Change',
  labor:    'Labor Change',
  permit:   'Permit Revision',
  design:   'Design Change',
  other:    'Other',
}

function SendToGC({ change, approvalUrl, generating, onGenerate, onMsg }: {
  change: any; approvalUrl: string | null; generating: boolean
  onGenerate: () => void; onMsg: (t: string) => void
}) {
  const [showEmail, setShowEmail] = useState(false)
  const [gcEmail, setGcEmail]     = useState('')
  const [gcName, setGcName]       = useState('')
  const [sending, setSending]     = useState(false)

  async function sendEmail() {
    if (!gcEmail.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/send-change-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_id: change.id, gc_email: gcEmail.trim(), gc_name: gcName.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        onMsg('✓ Email sent to GC — approval link included')
        setShowEmail(false)
      } else {
        // Email failed but we have the URL
        if (json.approval_url) {
          navigator.clipboard.writeText(json.approval_url).catch(() => {})
          onMsg('Email failed — approval link copied to clipboard')
        } else onMsg('Failed to send')
      }
    } catch { onMsg('Failed to send') }
    setSending(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13,
    border: '1.5px solid var(--border)', borderRadius: 8,
    fontFamily: 'inherit', outline: 'none',
    background: 'var(--surface-2)', color: 'var(--text-primary)',
  }

  if (!approvalUrl && change.status !== 'pending') return null

  return (
    <div style={{ marginBottom: 16 }}>
      {approvalUrl ? (
        <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>GC Approval Link Ready</div>

          {/* Link copy */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: '#1a4d31', background: 'white', padding: '8px 10px', borderRadius: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', border: '1px solid rgba(45,122,79,0.15)' }}>{approvalUrl}</div>
            <button onClick={() => { navigator.clipboard.writeText(approvalUrl).catch(() => {}); onMsg('✓ Link copied!') }} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, borderRadius: 7, cursor: 'pointer', border: 'none', background: '#2d7a4f', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>Copy</button>
          </div>

          {/* Send options */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => window.open(`sms:?body=Please review and approve this change order: ${approvalUrl}`, '_blank')} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(45,122,79,0.2)', background: 'white', color: '#2d7a4f', fontFamily: 'inherit' }}>
              📱 Text to GC
            </button>
            <button onClick={() => setShowEmail(v => !v)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, borderRadius: 7, cursor: 'pointer', border: '1px solid rgba(45,122,79,0.2)', background: showEmail ? '#2d7a4f' : 'white', color: showEmail ? 'white' : '#2d7a4f', fontFamily: 'inherit' }}>
              📧 Email to GC
            </button>
          </div>

          {/* Email form */}
          {showEmail && (
            <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 8, border: '1px solid rgba(45,122,79,0.15)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>GC Email *</div>
                  <input style={inp} placeholder="pm@turnerconst.com" type="email" value={gcEmail} onChange={e => setGcEmail(e.target.value)} autoFocus />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>GC Name</div>
                  <input style={inp} placeholder="John Smith" value={gcName} onChange={e => setGcName(e.target.value)} />
                </div>
              </div>
              <button onClick={sendEmail} disabled={sending || !gcEmail.trim()} style={{ width: '100%', padding: '9px', fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: sending || !gcEmail.trim() ? 'not-allowed' : 'pointer', border: 'none', background: sending || !gcEmail.trim() ? '#ccc' : '#0a0a0a', color: 'white', fontFamily: 'inherit' }}>
                {sending ? 'Sending...' : 'Send Email with Approval Link →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button onClick={onGenerate} disabled={generating} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {generating ? '⏳ Generating...' : '📤 Generate GC Approval Link'}
        </button>
      )}
    </div>
  )
}

export function ChangesClient({ user, project, initialChanges, jobs }: Props) {
  const [changes, setChanges]     = useState<ChangeOrder[]>(initialChanges)
  const [showNew, setShowNew]     = useState(false)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [toast, setToast]         = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Form state
  const [title, setTitle]               = useState('')
  const [description, setDescription]   = useState('')
  const [requestedBy, setRequestedBy]   = useState<ChangeOrder['requested_by']>('gc')
  const [category, setCategory]         = useState<ChangeOrder['category']>('scope')
  const [costImpact, setCostImpact]     = useState('')
  const [timeImpact, setTimeImpact]     = useState('')
  const [requiresPermit, setRequiresPermit] = useState(false)
  const [jobId, setJobId]               = useState(jobs[0]?.id || '')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3500) }

  const totalCost    = changes.filter(c => c.status === 'approved').reduce((s, c) => s + Number(c.cost_impact || 0), 0)
  const totalTime    = changes.filter(c => c.status !== 'rejected').reduce((s, c) => s + Number(c.time_impact_days || 0), 0)
  const pendingCount = changes.filter(c => c.status === 'pending').length
  const approvedCount = changes.filter(c => c.status === 'approved').length

  const filtered = filterStatus === 'all' ? changes : changes.filter(c => c.status === filterStatus)

  async function saveChange() {
    if (!project || !title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('change_orders').insert({
      project_id: project.id,
      user_id: user.id,
      job_id: jobId || null,
      title: title.trim(),
      description: description.trim(),
      requested_by: requestedBy,
      category,
      cost_impact: parseFloat(costImpact) || 0,
      time_impact_days: parseFloat(timeImpact) || 0,
      requires_permit_revision: requiresPermit,
      status: 'pending',
    }).select().single()

    if (!error && data) {
      setChanges(prev => [data as ChangeOrder, ...prev])
      msg('✓ Change order logged')
      setShowNew(false)
      setTitle(''); setDescription(''); setCostImpact(''); setTimeImpact('')
      setRequiresPermit(false)
    } else msg('Failed to save')
    setSaving(false)
  }

  async function generateApprovalLink(changeId: string) {
    setGenerating(changeId)
    try {
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_token', change_id: changeId }),
      })
      const json = await res.json()
      if (json.success) {
        setChanges(prev => prev.map(c => c.id === changeId ? { ...c, approval_token: json.token } : c))
        await navigator.clipboard.writeText(json.approvalUrl).catch(() => {})
        msg('✓ Approval link copied to clipboard!')
      } else msg('Failed to generate link')
    } catch { msg('Failed to generate link') }
    setGenerating(null)
  }

  async function updateStatus(id: string, status: ChangeOrder['status']) {
    const { error } = await supabase.from('change_orders').update({ status }).eq('id', id)
    if (!error) {
      setChanges(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      msg(`✓ Marked as ${STATUS_CONFIG[status].label}`)
    }
  }

  async function deleteChange(id: string) {
    if (!confirm('Delete this change order?')) return
    const { error } = await supabase.from('change_orders').delete().eq('id', id)
    if (!error) { setChanges(prev => prev.filter(c => c.id !== id)); msg('Deleted') }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 13px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Change Orders</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>Log every GC scope change — get it approved, get it documented</div>
        </div>
        <button onClick={() => setShowNew(v => !v)} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: showNew ? '#0f0f0f' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
          {showNew ? '✕ Cancel' : '+ New Change Order'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Changes', value: changes.length, sub: 'logged', accent: '' },
          { label: 'Pending GC Approval', value: pendingCount, sub: 'need sign-off', accent: pendingCount > 0 ? '#b06e1a' : '' },
          { label: 'Approved Value', value: `$${totalCost.toLocaleString()}`, sub: `${approvedCount} approved`, accent: '#2d7a4f' },
          { label: 'Delay Impact', value: `+${totalTime}d`, sub: 'schedule pushed', accent: totalTime > 0 ? '#b83232' : '' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.accent || 'var(--text-tertiary)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* PENDING ALERT */}
      {pendingCount > 0 && (
        <div style={{ background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>⏳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#6b4010' }}>{pendingCount} change order{pendingCount !== 1 ? 's' : ''} waiting for GC approval</div>
            <div style={{ fontSize: 12, color: '#b06e1a' }}>Generate an approval link and send it to your GC — they approve or reject from their phone</div>
          </div>
        </div>
      )}

      {/* NEW CHANGE FORM */}
      {showNew && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>New Change Order</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Requested By</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={requestedBy} onChange={e => setRequestedBy(e.target.value as any)}>
                {Object.entries(REQUESTED_BY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={category} onChange={e => setCategory(e.target.value as any)}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Job</label>
              <select style={{ ...inp, background: 'var(--surface)' }} value={jobId} onChange={e => setJobId(e.target.value)}>
                <option value="">No specific job</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Change Title *</label>
            <input style={inp} placeholder="GC moved panel location from east to west wall" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, resize: 'none' }} rows={3} placeholder="Describe exactly what changed and why. Be specific — this is your legal record." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={lbl}>Cost Impact ($)</label>
              <input type="number" style={inp} placeholder="2500" value={costImpact} onChange={e => setCostImpact(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Time Impact (days)</label>
              <input type="number" style={inp} placeholder="2" step="0.5" value={timeImpact} onChange={e => setTimeImpact(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button type="button" onClick={() => setRequiresPermit(v => !v)} style={{ width: 44, height: 26, borderRadius: 13, border: 'none', background: requiresPermit ? '#0f0f0f' : '#e0ddd8', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 3, left: requiresPermit ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: requiresPermit ? 600 : 400 }}>Requires permit revision</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveChange} disabled={saving || !title.trim()} style={{ padding: '11px 24px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#0f0f0f', color: 'white', fontFamily: 'inherit' }}>
              {saving ? 'Saving...' : 'Save Change Order'}
            </button>
            <button onClick={() => setShowNew(false)} style={{ padding: '11px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* FILTER */}
      {changes.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '5px 14px', fontSize: 12, fontWeight: filterStatus === s ? 700 : 400, borderRadius: 20, border: `1px solid ${filterStatus === s ? '#0f0f0f' : 'var(--border)'}`, background: filterStatus === s ? '#0f0f0f' : 'var(--surface)', color: filterStatus === s ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
              {s === 'all' ? `All (${changes.length})` : `${STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label} (${changes.filter(c => c.status === s).length})`}
            </button>
          ))}
        </div>
      )}

      {/* CHANGE LIST */}
      {filtered.length === 0 && !showNew ? (
        <div style={{ textAlign: 'center', padding: '52px 20px', background: 'var(--surface)', borderRadius: 16, border: '2px dashed var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No change orders yet</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20, maxWidth: 380, margin: '0 auto 20px' }}>
            Every time the GC changes the scope — log it here. You'll have proof when they dispute your bill.
          </div>
          <button onClick={() => setShowNew(true)} style={{ padding: '10px 24px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>+ Log First Change</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(change => {
            const sc = STATUS_CONFIG[change.status]
            const job = jobs.find(j => j.id === change.job_id)
            const isExpanded = expanded === change.id
            const approvalUrl = change.approval_token
              ? `${typeof window !== 'undefined' ? window.location.origin : ''}/approve/${change.approval_token}`
              : null

            return (
              <div key={change.id} style={{ background: 'var(--surface)', border: `1.5px solid ${isExpanded ? '#0f0f0f' : 'var(--border)'}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {/* Summary row */}
                <div onClick={() => setExpanded(isExpanded ? null : change.id)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: sc.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{change.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: sc.bg, color: sc.color }}>{sc.label}</span>
                      {change.requires_permit_revision && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#26215C' }}>Permit Rev.</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {REQUESTED_BY[change.requested_by]} · {CATEGORIES[change.category]}{job ? ` · ${job.title}` : ''} · {format(parseISO(change.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
                    {change.cost_impact > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#2d7a4f' }}>${Number(change.cost_impact).toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>cost</div>
                      </div>
                    )}
                    {change.time_impact_days > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#b83232' }}>+{change.time_impact_days}d</div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>delay</div>
                      </div>
                    )}
                    <div style={{ fontSize: 18, color: 'var(--text-tertiary)' }}>{isExpanded ? '↑' : '↓'}</div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
                    {change.description && (
                      <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: 14, marginTop: 16, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Description</div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{change.description}</div>
                      </div>
                    )}

                    {change.ai_summary && (
                      <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.15)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1f5fa6', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>AI Summary</div>
                        <div style={{ fontSize: 13, color: '#0C447C', lineHeight: 1.6 }}>{change.ai_summary}</div>
                      </div>
                    )}

                    {change.owner_notes && (
                      <div style={{ background: '#edf5f0', border: '1px solid rgba(45,122,79,0.15)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>GC Notes</div>
                        <div style={{ fontSize: 13, color: '#1a4d31', lineHeight: 1.6 }}>{change.owner_notes}</div>
                      </div>
                    )}

                    {/* Send to GC section */}
                    <SendToGC
                      change={change}
                      approvalUrl={approvalUrl}
                      generating={generating === change.id}
                      onGenerate={() => generateApprovalLink(change.id)}
                      onMsg={msg}
                    />

                    {/* Status actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(['pending','approved','rejected','in_progress','completed'] as const).filter(s => s !== change.status).map(s => (
                        <button key={s} onClick={() => updateStatus(change.id, s)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: `1px solid ${STATUS_CONFIG[s].dot}30`, background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, fontFamily: 'inherit' }}>
                          {STATUS_CONFIG[s].label}
                        </button>
                      ))}
                      <button onClick={() => deleteChange(change.id)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(184,50,50,0.2)', background: '#fdf0f0', color: '#b83232', fontFamily: 'inherit', marginLeft: 'auto' }}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

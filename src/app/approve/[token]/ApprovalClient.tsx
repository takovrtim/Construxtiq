'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Props {
  change: any
  token: string
}

const CATEGORY_LABELS: Record<string, string> = {
  scope: 'Scope Change', material: 'Material Change', labor: 'Labor Change',
  permit: 'Permit Revision', design: 'Design Change', other: 'Other',
}

const REQUESTED_BY_LABELS: Record<string, string> = {
  gc: 'General Contractor', owner: 'Owner', engineer: 'Engineer',
  inspector: 'Inspector', us: 'Contractor',
}

export function ApprovalClient({ change, token }: Props) {
  const alreadyDecided = change.status === 'approved' || change.status === 'rejected'
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(
    alreadyDecided ? change.status : null
  )
  const [notes, setNotes]         = useState('')
  const [name, setName]           = useState('')
  const [title, setTitle]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]           = useState(alreadyDecided)
  const [error, setError]         = useState('')

  const project    = change.projects
  const submittedAt = change.created_at ? format(new Date(change.created_at), 'MMMM d, yyyy') : '—'
  const decidedAt   = change.decided_at  ? format(new Date(change.decided_at),  'MMMM d, yyyy h:mm a') : null

  async function submit(action: 'approved' | 'rejected') {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/change-orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, notes, gc_name: name.trim(), gc_title: title.trim() }),
      })
      const json = await res.json()
      if (json.success) { setDecision(action); setDone(true) }
      else setError(json.error || 'Failed. Try again.')
    } catch { setError('Network error. Try again.') }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f4f1', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif", padding: '0 0 60px' }}>

      {/* TOP BAR */}
      <div style={{ background: '#0a0a0a', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#E8520A', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>ConstructIQ</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Change Order Approval Request</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>
          #{String(change.revision_number || 1).padStart(3, '0')}
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 20px 0' }}>

        {/* LEGAL HEADER */}
        <div style={{ background: '#131A26', borderRadius: 16, padding: '24px 28px', marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e3da' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>
                Change Order Request
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.2, color: '#F1EEE5', marginBottom: 6 }}>
                {change.title}
              </div>
              {project && (
                <div style={{ fontSize: 13, color: '#666' }}>
                  {project.name}{project.address ? ` · ${project.address}` : ''}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1.5px', color: '#F1EEE5' }}>
                +${Number(change.cost_impact || 0).toLocaleString()}
              </div>
              {Number(change.time_impact_days) > 0 && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b83232', marginTop: 2 }}>
                  +{change.time_impact_days} calendar days
                </div>
              )}
            </div>
          </div>

          {/* KEY FIELDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Category',     value: CATEGORY_LABELS[change.category] || change.category || '—' },
              { label: 'Initiated By', value: REQUESTED_BY_LABELS[change.requested_by] || change.requested_by || '—' },
              { label: 'Submitted',    value: submittedAt },
            ].map(item => (
              <div key={item.label} style={{ background: '#f6f4f1', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F1EEE5' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* DESCRIPTION */}
          {change.description && (
            <div style={{ background: '#f6f4f1', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Scope Description</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.7 }}>{change.description}</div>
            </div>
          )}

          {/* PERMIT WARNING */}
          {change.requires_permit_revision && (
            <div style={{ padding: '12px 14px', background: '#fdf4e3', borderRadius: 10, border: '1px solid rgba(176,110,26,0.2)', borderLeft: '3px solid #b06e1a', fontSize: 13, color: '#6b4010', fontWeight: 600, marginBottom: 14 }}>
              ⚠️ This change requires a permit revision before work can proceed
            </div>
          )}

          {/* AI SUMMARY */}
          {change.ai_summary && (
            <div style={{ padding: '12px 14px', background: '#eef3fb', borderRadius: 10, border: '1px solid rgba(31,95,166,0.15)', fontSize: 13, color: '#0C447C', lineHeight: 1.6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#1f5fa6', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Summary</div>
              {change.ai_summary}
            </div>
          )}
        </div>

        {/* FINANCIAL IMPACT BOX */}
        <div style={{ background: '#0a0a0a', borderRadius: 14, padding: '20px 24px', marginBottom: 14, color: 'white' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 14 }}>
            Financial & Schedule Impact
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Additional Cost</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: '#ff8c5a' }}>
                +${Number(change.cost_impact || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Schedule Impact</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', color: Number(change.time_impact_days) > 0 ? '#ff8c5a' : '#4ade80' }}>
                {Number(change.time_impact_days) > 0 ? `+${change.time_impact_days}d` : 'None'}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
            Your approval of this change order constitutes written authorization to proceed with the described work at the stated cost and schedule impact. This record is timestamped and legally binding.
          </div>
        </div>

        {/* DECISION PANEL */}
        {done ? (
          <div style={{ background: '#131A26', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e3da', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: decision === 'approved' ? '#edf5f0' : '#fdf0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>
              {decision === 'approved' ? '✅' : '❌'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6, color: decision === 'approved' ? '#1a4d31' : '#6e1a1a' }}>
              {decision === 'approved' ? 'Change Order Approved' : 'Change Order Rejected'}
            </div>
            {decidedAt && (
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Recorded {decidedAt}</div>
            )}
            {change.owner_notes && (
              <div style={{ background: '#f6f4f1', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#444', textAlign: 'left', marginTop: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Your Notes</div>
                {change.owner_notes}
              </div>
            )}
            <div style={{ marginTop: 20, fontSize: 13, color: '#aaa' }}>
              {decision === 'approved'
                ? 'The contractor has been notified and is authorized to proceed.'
                : 'The contractor has been notified of your decision.'}
            </div>
          </div>
        ) : (
          <div style={{ background: '#131A26', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e8e3da' }}>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 4 }}>Your Decision</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
              Approving authorizes the contractor to proceed. Your name and timestamp will be recorded.
            </div>

            {/* Name + Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Your Name *</label>
                <input
                  style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #e8e3da', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', boxSizing: 'border-box' as const }}
                  placeholder="John Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Title / Company</label>
                <input
                  style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #e8e3da', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4', boxSizing: 'border-box' as const }}
                  placeholder="Project Manager, Turner Construction"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#aaa', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any conditions, comments, or instructions..."
                rows={3}
                style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #e8e3da', borderRadius: 9, fontFamily: 'inherit', outline: 'none', resize: 'none', background: '#f8f7f4', lineHeight: 1.6, boxSizing: 'border-box' as const }}
              />
            </div>

            {error && (
              <div style={{ background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#b83232', marginBottom: 14 }}>{error}</div>
            )}

            {/* APPROVE / REJECT BUTTONS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => submit('approved')}
                disabled={submitting || !name.trim()}
                style={{ padding: '16px', fontSize: 16, fontWeight: 800, borderRadius: 12, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer', border: 'none', background: submitting || !name.trim() ? '#ccc' : '#1a4d31', color: 'white', fontFamily: 'inherit', letterSpacing: '-0.3px' }}
              >
                {submitting ? '...' : '✓ Approve'}
              </button>
              <button
                onClick={() => submit('rejected')}
                disabled={submitting || !name.trim()}
                style={{ padding: '16px', fontSize: 16, fontWeight: 800, borderRadius: 12, cursor: submitting || !name.trim() ? 'not-allowed' : 'pointer', border: 'none', background: submitting || !name.trim() ? '#ccc' : '#b83232', color: 'white', fontFamily: 'inherit', letterSpacing: '-0.3px' }}
              >
                {submitting ? '...' : '✗ Reject'}
              </button>
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
              By approving, you authorize the contractor to proceed with this change at the stated cost and schedule impact. This action is timestamped and cannot be undone.
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#bbb' }}>
          Delivered by ConstructIQ · Secure · Timestamped · Legally binding
        </div>
      </div>
    </div>
  )
}

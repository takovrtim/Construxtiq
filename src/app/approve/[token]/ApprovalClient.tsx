'use client'

import { useState } from 'react'

interface Props {
  change: any
  token: string
}

const CATEGORY_LABELS: Record<string, string> = {
  scope: 'Scope Change', material: 'Material Change', labor: 'Labor Change',
  permit: 'Permit Revision', design: 'Design Change', other: 'Other',
}

export function ApprovalClient({ change, token }: Props) {
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(
    change.status === 'approved' ? 'approved' : change.status === 'rejected' ? 'rejected' : null
  )
  const [notes, setNotes]       = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone]         = useState(change.status === 'approved' || change.status === 'rejected')

  async function submit(action: 'approved' | 'rejected') {
    setSubmitting(true)
    const res = await fetch('/api/change-orders/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action, notes }),
    })
    const json = await res.json()
    if (json.success) { setDecision(action); setDone(true) }
    setSubmitting(false)
  }

  const project = change.projects

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>ConstructIQ</div>
            <div style={{ fontSize: 12, color: '#9e9d99' }}>Change Order Approval</div>
          </div>
        </div>

        {/* Change Order Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Change Order #{change.revision_number}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.3, marginBottom: 4 }}>{change.title}</div>
              {project && <div style={{ fontSize: 13, color: '#9e9d99' }}>{project.name}</div>}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#d95f2b' }}>
                +${Number(change.cost_impact).toLocaleString()}
              </div>
              {change.time_impact_days > 0 && (
                <div style={{ fontSize: 12, color: '#b83232', fontWeight: 600 }}>+{change.time_impact_days} days</div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Category', value: CATEGORY_LABELS[change.category] || change.category },
              { label: 'Requested By', value: change.requested_by?.charAt(0).toUpperCase() + change.requested_by?.slice(1) },
              { label: 'Cost Impact', value: `+$${Number(change.cost_impact).toLocaleString()}` },
              { label: 'Time Impact', value: change.time_impact_days > 0 ? `+${change.time_impact_days} days` : 'No delay' },
            ].map(item => (
              <div key={item.label} style={{ background: '#f8f7f4', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {change.description && (
            <div style={{ background: '#f8f7f4', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Description</div>
              <div style={{ fontSize: 14, color: '#6b6a66', lineHeight: 1.6 }}>{change.description}</div>
            </div>
          )}

          {change.requires_permit_revision && (
            <div style={{ padding: '12px 14px', background: '#fdf4e3', borderRadius: 10, borderLeft: '3px solid #b06e1a', fontSize: 13, color: '#6b4010', marginBottom: 16 }}>
              📋 This change requires a permit revision
            </div>
          )}

          {change.ai_summary && (
            <div style={{ padding: '12px 14px', background: '#eef3fb', borderRadius: 10, borderLeft: '3px solid #1f5fa6', fontSize: 13, color: '#0C447C', lineHeight: 1.6 }}>
              ✨ {change.ai_summary}
            </div>
          )}
        </div>

        {/* Decision */}
        {done ? (
          <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{decision === 'approved' ? '✅' : '❌'}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, color: decision === 'approved' ? '#2d7a4f' : '#b83232' }}>
              {decision === 'approved' ? 'Change Order Approved' : 'Change Order Rejected'}
            </div>
            <div style={{ fontSize: 14, color: '#9e9d99' }}>
              {decision === 'approved' ? 'The contractor has been notified and will proceed.' : 'The contractor has been notified of your decision.'}
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Your Decision</div>
            <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 16 }}>Review the change order above and approve or reject it.</div>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes (e.g. 'Approved, proceed ASAP' or 'Rejected, too expensive')"
              rows={3}
              style={{ width: '100%', padding: '12px 14px', fontSize: 13, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', resize: 'none', marginBottom: 14, background: '#f8f7f4', lineHeight: 1.6, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                onClick={() => submit('approved')}
                disabled={submitting}
                style={{ padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer', border: 'none', background: '#2d7a4f', color: 'white', fontFamily: 'inherit' }}
              >
                {submitting ? '...' : '✓ Approve'}
              </button>
              <button
                onClick={() => submit('rejected')}
                disabled={submitting}
                style={{ padding: '14px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: submitting ? 'not-allowed' : 'pointer', border: 'none', background: '#b83232', color: 'white', fontFamily: 'inherit' }}
              >
                {submitting ? '...' : '✗ Reject'}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#9e9d99' }}>
          Powered by ConstructIQ · Change Order #{change.revision_number}
        </div>
      </div>
    </div>
  )
}

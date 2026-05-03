'use client'

import { useState } from 'react'

interface ChecklistItem {
  item: string
  status: 'complete' | 'missing' | 'unknown'
  note: string | null
}

interface ChecklistResult {
  checklist: ChecklistItem[]
  ready_count: number
  total_count: number
  tip: string
}

interface Props {
  projectId: string
}

const PERMIT_TYPES = [
  'Electrical Permit', 'Plumbing Permit', 'Mechanical/HVAC Permit',
  'General Building Permit', 'Roofing Permit', 'Solar/PV Permit',
  'Demolition Permit', 'Pool/Spa Permit',
]

export function JurisdictionChecklist({ projectId }: Props) {
  const [permitType, setPermitType]   = useState('Electrical Permit')
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState<ChecklistResult | null>(null)
  const [jurisdiction, setJurisdiction] = useState('')
  const [checked, setChecked]         = useState<Record<number, boolean>>({})

  async function runChecklist() {
    setLoading(true)
    setResult(null)
    setChecked({})
    try {
      const res  = await fetch('/api/jurisdiction-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, permit_type: permitType }),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.result)
        setJurisdiction(json.jurisdiction)
        // Auto-check items AI marked as complete
        const auto: Record<number, boolean> = {}
        json.result.checklist.forEach((item: ChecklistItem, i: number) => {
          if (item.status === 'complete') auto[i] = true
        })
        setChecked(auto)
      }
    } catch {
      // silent
    }
    setLoading(false)
  }

  function toggleCheck(i: number) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const manualCount = Object.values(checked).filter(Boolean).length
  const pct = result ? Math.round((manualCount / result.total_count) * 100) : 0

  const statusConfig = {
    complete: { color: '#2d7a4f', bg: '#edf5f0', icon: '✓' },
    missing:  { color: '#b83232', bg: '#fdf0f0', icon: '✗' },
    unknown:  { color: '#9e9d99', bg: '#f8f7f4', icon: '?' },
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Jurisdiction Permit Checklist</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          AI generates a checklist specific to your jurisdiction and permit type, cross-referencing your uploaded documents.
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Permit Type</label>
            <select
              value={permitType}
              onChange={e => setPermitType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1.5px solid var(--border)', borderRadius: 9, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }}
            >
              {PERMIT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <button
            onClick={runChecklist}
            disabled={loading}
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? '#9e9d99' : '#d95f2b', color: 'white', fontFamily: 'inherit', whiteSpace: 'nowrap', height: 42 }}
          >
            {loading ? '⚙️ Loading...' : '📋 Generate Checklist'}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Building your checklist...</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Checking jurisdiction requirements and your uploaded documents</div>
        </div>
      )}

      {result && !loading && (
        <div>
          {/* Header */}
          <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{permitType}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{jurisdiction}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.5px', color: pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171' }}>{pct}%</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{manualCount}/{result.total_count} items</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171', borderRadius: 3, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Tip */}
          {result.tip && (
            <div style={{ background: '#eef3fb', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#0C447C', borderLeft: '3px solid #1f5fa6', marginBottom: 14, lineHeight: 1.6 }}>
              💡 {result.tip}
            </div>
          )}

          {/* Checklist items */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {result.checklist.map((item, i) => {
              const isChecked = !!checked[i]
              const cfg = statusConfig[item.status]
              return (
                <div
                  key={i}
                  onClick={() => toggleCheck(i)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isChecked ? 'rgba(45,122,79,0.04)' : 'transparent', transition: 'background 0.12s' }}
                >
                  {/* Checkbox */}
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isChecked ? '#2d7a4f' : 'rgba(0,0,0,0.15)'}`, background: isChecked ? '#2d7a4f' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.15s' }}>
                    {isChecked && <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: isChecked ? '#9e9d99' : 'var(--text-primary)', textDecoration: isChecked ? 'line-through' : 'none', lineHeight: 1.5 }}>
                      {item.item}
                    </div>
                    {item.note && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>{item.note}</div>
                    )}
                  </div>

                  {/* AI status badge */}
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {cfg.icon} {item.status === 'complete' ? 'Found' : item.status === 'missing' ? 'Missing' : 'Unknown'}
                  </span>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={runChecklist} style={{ padding: '9px 16px', fontSize: 12, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
              ↺ Refresh
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'center' }}>
              Click items to mark them complete
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'

interface ReadinessResult {
  score: number
  status: string
  missing_docs: string[]
  issues: Array<{ severity: 'critical' | 'warning' | 'info'; message: string }>
  next_steps: string[]
  estimated_approval_days: number
  delay_risk: 'Low' | 'Medium' | 'High'
  summary: string
}

interface Props {
  projectId: string
  projectName: string
}

const PERMIT_TYPES = [
  'Electrical Permit',
  'Plumbing Permit',
  'Mechanical/HVAC Permit',
  'General Building Permit',
  'Demolition Permit',
  'Roofing Permit',
  'Solar/PV Permit',
  'Pool/Spa Permit',
  'Sign Permit',
]

export function PermitReadiness({ projectId, projectName }: Props) {
  const [permitType, setPermitType] = useState('Electrical Permit')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ReadinessResult | null>(null)
  const [error, setError] = useState('')

  async function checkReadiness() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/permit-readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, permit_type: permitType }),
      })
      const json = await res.json()
      if (json.success) setResult(json.result)
      else setError(json.error || 'Failed to analyze')
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  function getScoreColor(score: number) {
    if (score >= 80) return '#2d7a4f'
    if (score >= 60) return '#b06e1a'
    return '#b83232'
  }

  function getScoreBg(score: number) {
    if (score >= 80) return '#edf5f0'
    if (score >= 60) return '#fdf4e3'
    return '#fdf0f0'
  }

  const delayColors = {
    Low: { color: '#2d7a4f', bg: '#edf5f0' },
    Medium: { color: '#b06e1a', bg: '#fdf4e3' },
    High: { color: '#b83232', bg: '#fdf0f0' },
  }

  const issueColors = {
    critical: { color: '#6e1a1a', bg: '#fdf0f0', border: '#b83232', icon: '🔴' },
    warning: { color: '#6b4010', bg: '#fdf4e3', border: '#b06e1a', icon: '⚠️' },
    info: { color: '#0C447C', bg: '#eef3fb', border: '#1f5fa6', icon: 'ℹ️' },
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Permit Readiness Score</div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
          AI checks your documents against jurisdiction requirements before you submit — catches missing docs and issues early.
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
            onClick={checkReadiness}
            disabled={loading}
            style={{
              padding: '10px 22px', fontSize: 13, fontWeight: 700, borderRadius: 9,
              cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
              background: loading ? '#9e9d99' : '#d95f2b', color: 'white',
              fontFamily: 'inherit', whiteSpace: 'nowrap', height: 42,
            }}
          >
            {loading ? '⚙️ Analyzing...' : '✓ Check Readiness'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', background: '#fdf0f0', borderRadius: 9, fontSize: 13, color: '#6e1a1a', borderLeft: '3px solid #b83232', marginBottom: 16 }}>
          🔴 {error}
        </div>
      )}

      {loading && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Checking permit readiness...</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>AI is reviewing your documents against jurisdiction requirements</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
            {['Reviewing docs', 'Checking jurisdiction', 'Identifying gaps', 'Scoring readiness'].map((s, i) => (
              <div key={s} style={{ fontSize: 11, color: 'var(--text-tertiary)', padding: '4px 10px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', animation: `pulse 1.5s infinite ${i * 0.3}s` }}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Score card */}
          <div style={{ background: '#0f0f0f', borderRadius: 14, padding: 22, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Readiness Score</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-2px', color: result.score >= 80 ? '#4ade80' : result.score >= 60 ? '#fbbf24' : '#f87171', lineHeight: 1 }}>
                    {result.score}
                  </div>
                  <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>/100</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: result.score >= 80 ? '#4ade80' : result.score >= 60 ? '#fbbf24' : '#f87171' }}>
                  {result.status}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Est. Approval Time</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{result.estimated_approval_days} days</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Delay Risk</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: result.delay_risk === 'Low' ? '#4ade80' : result.delay_risk === 'Medium' ? '#fbbf24' : '#f87171' }}>
                    {result.delay_risk}
                  </div>
                </div>
              </div>
            </div>

            {/* Score bar */}
            <div style={{ marginTop: 16 }}>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${result.score}%`, background: result.score >= 80 ? '#4ade80' : result.score >= 60 ? '#fbbf24' : '#f87171', borderRadius: 4, transition: 'width 1s ease' }} />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>AI Summary</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{result.summary}</div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Issues Found ({result.issues.length})</div>
              {result.issues.map((issue, i) => {
                const s = issueColors[issue.severity]
                return (
                  <div key={i} style={{ padding: '10px 12px', background: s.bg, borderLeft: `3px solid ${s.border}`, borderRadius: '0 8px 8px 0', marginBottom: 8, fontSize: 13, color: s.color, lineHeight: 1.55 }}>
                    {s.icon} {issue.message}
                  </div>
                )
              })}
            </div>
          )}

          {/* Missing docs */}
          {result.missing_docs.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Missing Documents ({result.missing_docs.length})</div>
              {result.missing_docs.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 5, background: '#fdf4e3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>📄</div>
                  {doc}
                </div>
              ))}
            </div>
          )}

          {/* Next steps */}
          {result.next_steps.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>Next Steps</div>
              {result.next_steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-primary)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#d95f2b', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  {step}
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setResult(null)} style={{ padding: '10px', fontSize: 13, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontFamily: 'inherit', fontWeight: 500 }}>
            ↺ Run New Check
          </button>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}

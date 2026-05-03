'use client'

import { DelayPrediction } from './DelayPrediction'
import { ClientShareButton } from './ClientShareButton'
import { useState } from 'react'

interface Prediction {
  job_title: string
  affected_task: string
  delay_days: number
  cause: string
  severity: 'critical' | 'warning' | 'info'
  recommendation: string
  cascade_effect: string
}

interface Props {
  projectId: string
}

export function DelayPrediction({ projectId }: Props) {
  const [loading, setLoading]           = useState(false)
  const [predictions, setPredictions]   = useState<Prediction[]>([])
  const [message, setMessage]           = useState('')
  const [ran, setRan]                   = useState(false)

  const severityConfig = {
    critical: { bg: '#fdf0f0', border: '#b83232', text: '#6e1a1a', badge: '#b83232', icon: '🔴', label: 'Critical Delay' },
    warning:  { bg: '#fdf4e3', border: '#b06e1a', text: '#6b4010', badge: '#b06e1a', icon: '⚠️', label: 'Possible Delay' },
    info:     { bg: '#eef3fb', border: '#1f5fa6', text: '#0C447C', badge: '#1f5fa6', icon: 'ℹ️', label: 'Minor Impact' },
  }

  async function runPrediction() {
    setLoading(true)
    setPredictions([])
    setMessage('')
    try {
      const res  = await fetch('/api/delay-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      const json = await res.json()
      if (json.success) {
        setPredictions(json.predictions || [])
        setMessage(json.message || '')
      }
    } catch {
      setMessage('Failed to run prediction — try again')
    }
    setRan(true)
    setLoading(false)
  }

  const totalDelayDays = predictions.reduce((s, p) => Math.max(s, p.delay_days), 0)
  const criticals      = predictions.filter(p => p.severity === 'critical').length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Delay Prediction Engine</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            AI analyzes pending permits and active jobs to warn you before delays happen.
          </div>
        </div>
        <button
          onClick={runPrediction}
          disabled={loading}
          style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? '#9e9d99' : '#0f0f0f', color: 'white', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          {loading ? '⚙️ Analyzing...' : '🔮 Predict Delays'}
        </button>
      </div>

      {loading && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: 28, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔮</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Analyzing your project timeline...</div>
          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Checking permit status, job dependencies, and Clark County timelines</div>
        </div>
      )}

      {!loading && ran && predictions.length === 0 && (
        <div style={{ background: '#edf5f0', borderRadius: 12, padding: 20, textAlign: 'center', border: '1px solid rgba(45,122,79,0.2)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a4d31', marginBottom: 4 }}>No delays predicted</div>
          <div style={{ fontSize: 13, color: '#2d7a4f' }}>{message || 'Your project timeline looks clear based on current permit status.'}</div>
        </div>
      )}

      {!loading && predictions.length > 0 && (
        <div>
          {/* Summary bar */}
          <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginBottom: 16, color: 'white', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Max Delay Risk</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: criticals > 0 ? '#f87171' : '#fbbf24' }}>{totalDelayDays} days</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Issues Found</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>{predictions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Critical</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', color: criticals > 0 ? '#f87171' : '#4ade80' }}>{criticals}</div>
            </div>
          </div>

          {/* Predictions */}
          {predictions.map((p, i) => {
            const cfg = severityConfig[p.severity]
            return (
              <div key={i} style={{ background: cfg.bg, border: `1px solid ${cfg.border}20`, borderLeft: `3px solid ${cfg.border}`, borderRadius: '0 12px 12px 0', padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span>{cfg.icon}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: cfg.text }}>{p.job_title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cfg.badge, color: 'white' }}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 13, color: cfg.text, marginBottom: 6 }}>{p.cause}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: cfg.border }}>+{p.delay_days}d</div>
                    <div style={{ fontSize: 10, color: cfg.text, fontWeight: 600 }}>estimated</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, color: cfg.text }}>
                    <strong>Affected:</strong> {p.affected_task}
                  </div>
                  {p.cascade_effect && (
                    <div style={{ fontSize: 12, color: cfg.text }}>
                      <strong>Cascade:</strong> {p.cascade_effect}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: cfg.text, background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '8px 10px', marginTop: 4 }}>
                    💡 <strong>Do now:</strong> {p.recommendation}
                  </div>
                </div>
              </div>
            )
          })}

          <button onClick={runPrediction} style={{ marginTop: 4, padding: '9px 16px', fontSize: 12, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
            ↺ Re-analyze
          </button>
        </div>
      )}
    </div>
  )
}

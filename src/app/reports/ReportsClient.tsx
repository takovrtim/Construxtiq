'use client'

import { useState } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import type { User, Project } from '@/types'

interface Props {
  user: User
  project: Project | null
  jobs: any[]
  permits: any[]
  bids: any[]
  subs: any[]
  documents: any[]
}

export function ReportsClient({ user, project, jobs, permits, bids, subs, documents }: Props) {
  const [generating, setGenerating] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [generated, setGenerated] = useState(false)

  const today = new Date()
  const firstName = (user.full_name || user.email || '').split(/[\s@]/)[0] || 'there'

  // Computed stats
  const jobsByStatus = {
    pending_permit:  jobs.filter(j => j.status === 'pending_permit').length,
    permit_approved: jobs.filter(j => j.status === 'permit_approved').length,
    in_progress:     jobs.filter(j => j.status === 'in_progress').length,
    inspection:      jobs.filter(j => j.status === 'inspection').length,
    completed:       jobs.filter(j => j.status === 'completed').length,
  }

  const expiredPermits    = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) < 0)
  const criticalPermits   = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) >= 0 && differenceInDays(parseISO(p.expiry_date), today) <= 7)
  const warningPermits    = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) > 7 && differenceInDays(parseISO(p.expiry_date), today) <= 30)
  const totalBid          = bids.reduce((s, b) => s + Number(b.amount), 0)
  const awardedBid        = bids.filter(b => b.status === 'awarded').reduce((s, b) => s + Number(b.amount), 0)
  const flaggedBids       = bids.filter(b => b.ai_flag)
  const activeCrew        = subs.filter(s => s.status === 'active' || s.status === 'awarded')
  const docsExtracted     = documents.filter(d => d.status === 'extracted' || d.status === 'saved')

  const priorities: Array<{ level: 'critical' | 'warning' | 'info'; text: string }> = []
  expiredPermits.forEach(p => priorities.push({ level: 'critical', text: `Permit ${p.permit_number} has expired — renew immediately` }))
  criticalPermits.forEach(p => priorities.push({ level: 'critical', text: `Permit ${p.permit_number} expires in ${differenceInDays(parseISO(p.expiry_date), today)} days` }))
  warningPermits.forEach(p => priorities.push({ level: 'warning', text: `Permit ${p.permit_number} expires in ${differenceInDays(parseISO(p.expiry_date), today)} days` }))
  flaggedBids.forEach(b => priorities.push({ level: b.ai_flag_severity === 'critical' ? 'critical' : 'warning', text: `${b.trade}: ${b.ai_flag}` }))
  if (jobsByStatus.pending_permit > 0) priorities.push({ level: 'warning', text: `${jobsByStatus.pending_permit} job${jobsByStatus.pending_permit > 1 ? 's' : ''} waiting on permit approval` })
  if (priorities.length === 0) priorities.push({ level: 'info', text: 'All systems clear — no urgent issues this week' })

  async function generateReport() {
    setGenerating(true)
    setAiSummary('')

    const context = `
Project: ${project?.name} in ${project?.city}, ${project?.state}
Date: ${format(today, 'MMMM d, yyyy')}

JOBS (${jobs.length} total):
- Waiting on permit: ${jobsByStatus.pending_permit}
- Permit approved: ${jobsByStatus.permit_approved}
- In progress: ${jobsByStatus.in_progress}
- Needs inspection: ${jobsByStatus.inspection}
- Completed: ${jobsByStatus.completed}

PERMITS (${permits.length} total):
- Expired: ${expiredPermits.length}
- Expiring within 7 days: ${criticalPermits.length}
- Expiring within 30 days: ${warningPermits.length}

FINANCIALS:
- Total bid value: $${totalBid.toLocaleString()}
- Awarded: $${awardedBid.toLocaleString()}
- AI-flagged bids: ${flaggedBids.length}

CREW: ${activeCrew.length} active subcontractors
DOCUMENTS: ${documents.length} total, ${docsExtracted.length} AI-extracted

PRIORITY ALERTS:
${priorities.map(p => `[${p.level.toUpperCase()}] ${p.text}`).join('\n')}
    `.trim()

    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, projectName: project?.name, gcName: firstName }),
      })
      const json = await res.json()
      if (json.summary) {
        setAiSummary(json.summary)
        setGenerated(true)
      }
    } catch {
      setAiSummary('Failed to generate AI summary. Please try again.')
    }
    setGenerating(false)
  }

  function printReport() {
    window.print()
  }

  const alertColors = {
    critical: { bg: '#fdf0f0', text: '#6e1a1a', border: '#b83232', icon: '🔴' },
    warning:  { bg: '#fdf4e3', text: '#6b4010', border: '#b06e1a', icon: '⚠️' },
    info:     { bg: '#eef3fb', text: '#0f3360', border: '#1f5fa6', icon: '✓' },
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>No project selected</div>
      <a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Create a project first →</a>
    </div>
  )

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .app-shell { grid-template-columns: 1fr !important; }
          nav.sidebar { display: none !important; }
          header.topbar { display: none !important; }
          .main-content { padding: 0 !important; height: auto !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>Weekly Report</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {project.name} · {format(today, 'MMMM d, yyyy')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={printReport} style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, borderRadius: 9, cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontFamily: 'inherit' }}>
            🖨️ Print / PDF
          </button>
          <button onClick={generateReport} disabled={generating} style={{ padding: '9px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: generating ? 'not-allowed' : 'pointer', border: 'none', background: generating ? '#9e9d99' : '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {generating ? '⚙️ Generating...' : '✨ Generate AI Summary'}
          </button>
        </div>
      </div>

      {/* REPORT CONTENT */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Report header */}
        <div style={{ background: '#0f0f0f', borderRadius: 16, padding: 28, marginBottom: 20, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, background: '#d95f2b', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
                    <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/>
                    <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/>
                  </svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>ConstructIQ</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 4 }}>{project.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Weekly Status Report · {format(today, 'MMMM d, yyyy')}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Prepared for</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{user.full_name || user.email}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{[project.city, project.state].filter(Boolean).join(', ')}</div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {(aiSummary || generating) && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>✨</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Executive Summary</div>
              <span style={{ fontSize: 11, fontWeight: 600, background: '#d95f2b', color: 'white', padding: '2px 8px', borderRadius: 20 }}>Private</span>
            </div>
            {generating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-tertiary)', fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '0s' }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '0.2s' }}>●</span>
                  <span style={{ animation: 'pulse 1s infinite', animationDelay: '0.4s' }}>●</span>
                </div>
                Claude is analyzing your project data...
              </div>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{aiSummary}</div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Active Jobs', value: jobs.filter(j => j.status !== 'completed').length, sub: `${jobsByStatus.completed} completed`, icon: '🔧' },
            { label: 'Permits', value: permits.length, sub: `${expiredPermits.length + criticalPermits.length} need attention`, icon: '📋', accent: (expiredPermits.length + criticalPermits.length) > 0 ? '#b83232' : '' },
            { label: 'Bid Value', value: `$${(totalBid/1000).toFixed(0)}K`, sub: `$${(awardedBid/1000).toFixed(0)}K awarded`, icon: '💰' },
            { label: 'Active Crew', value: activeCrew.length, sub: `${subs.length} total subs`, icon: '👷' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', boxShadow: 'var(--shadow-xs)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent || 'rgba(0,0,0,0.05)', borderRadius: '14px 14px 0 0' }} />
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: s.accent || 'var(--text-primary)', marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.accent ? s.accent : 'var(--text-tertiary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Priority Actions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, letterSpacing: '-0.2px' }}>🚨 Priority Actions</div>
          {priorities.map((p, i) => {
            const s = alertColors[p.level]
            return (
              <div key={i} style={{ background: s.bg, color: s.text, borderLeft: `3px solid ${s.border}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 13, lineHeight: 1.55, marginBottom: 8, fontWeight: p.level === 'critical' ? 600 : 400 }}>
                {s.icon} {p.text}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Job Pipeline */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>🔧 Job Pipeline</div>
            {jobs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No jobs added yet</div>
            ) : (
              <>
                {[
                  { label: 'Waiting on Permit', count: jobsByStatus.pending_permit, color: '#EF9F27' },
                  { label: 'Permit Approved',   count: jobsByStatus.permit_approved, color: '#639922' },
                  { label: 'In Progress',        count: jobsByStatus.in_progress, color: '#378ADD' },
                  { label: 'Needs Inspection',   count: jobsByStatus.inspection, color: '#7F77DD' },
                  { label: 'Completed',          count: jobsByStatus.completed, color: '#9e9d99' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</div>
                    <div style={{ width: 80, height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${jobs.length > 0 ? (s.count / jobs.length) * 100 : 0}%`, background: s.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <span>Total: {jobs.length} jobs</span>
                  <span style={{ color: '#2d7a4f', fontWeight: 600 }}>{jobsByStatus.completed} completed</span>
                </div>
              </>
            )}
          </div>

          {/* Permit Status */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>📋 Permit Status</div>
            {permits.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No permits uploaded yet</div>
            ) : (
              permits.map(p => {
                const days = p.expiry_date ? differenceInDays(parseISO(p.expiry_date), today) : null
                const isExpired = days !== null && days < 0
                const isCritical = days !== null && days >= 0 && days <= 7
                const isWarning = days !== null && days > 7 && days <= 30
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: isExpired ? '#b83232' : isCritical ? '#b83232' : isWarning ? '#b06e1a' : '#2d7a4f', flexShrink: 0, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{p.permit_number}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{p.permit_type}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {p.expiry_date && (
                        <div style={{ fontSize: 12, fontWeight: 600, color: isExpired || isCritical ? '#b83232' : isWarning ? '#b06e1a' : 'var(--text-tertiary)' }}>
                          {isExpired ? `Expired ${Math.abs(days!)}d ago` : isCritical ? `${days}d left` : isWarning ? `${days}d left` : format(parseISO(p.expiry_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Financials */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>💰 Financial Overview</div>
          {bids.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No bids added yet</div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Total Bid Value', value: `$${totalBid.toLocaleString()}`, accent: false },
                  { label: 'Awarded', value: `$${awardedBid.toLocaleString()}`, accent: true },
                  { label: 'Pending', value: `$${(totalBid - awardedBid).toLocaleString()}`, accent: false },
                  { label: 'AI Flags', value: flaggedBids.length.toString(), accent: flaggedBids.length > 0 },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: s.accent ? '#d95f2b' : 'var(--text-primary)' }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {flaggedBids.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>AI-Flagged Bids (Private)</div>
                  {flaggedBids.map(b => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: b.ai_flag_severity === 'critical' ? '#fdf0f0' : '#fdf4e3', borderRadius: 8, marginBottom: 6, fontSize: 12, color: b.ai_flag_severity === 'critical' ? '#6e1a1a' : '#6b4010' }}>
                      <span>{b.ai_flag_severity === 'critical' ? '🔴' : '⚠️'}</span>
                      <span style={{ fontWeight: 600 }}>{b.trade}:</span>
                      <span>{b.ai_flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Crew */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>👷 Active Crew & Subs</div>
          {activeCrew.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '16px 0' }}>No active crew yet</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {activeCrew.map((s, i) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: ['#0f0f0f','#d95f2b','#1f5fa6','#2d7a4f'][i%4], color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {s.company_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.company_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.trade}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'var(--text-tertiary)', borderTop: '1px solid var(--border)' }}>
          Generated by ConstructIQ · {format(today, 'MMMM d, yyyy h:mm a')} · Confidential — for internal use only
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </>
  )
}

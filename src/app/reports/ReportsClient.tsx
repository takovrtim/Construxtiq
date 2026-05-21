'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Props { user: any; project: any }

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  A: { color: '#1a7a4a', bg: '#E8F5EF', label: 'Excellent' },
  B: { color: '#1A56DB', bg: '#EEF5FF', label: 'Good' },
  C: { color: '#A05A00', bg: '#FEF8EE', label: 'Average' },
  D: { color: '#C0392B', bg: '#FEF0EE', label: 'Poor' },
  F: { color: '#6e1a1a', bg: '#fdf0f0', label: 'Very Poor' },
}

function ProtectionMeter({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#1a7a4a' : score >= 60 ? '#1A56DB' : score >= 40 ? '#A05A00' : '#C0392B'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 20, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

export function ReportsClient({ user, project }: Props) {
  const [generating, setGenerating]   = useState(false)
  const [audit, setAudit]             = useState<any>(null)
  const [gcSearch, setGcSearch]       = useState('')
  const [gcScore, setGcScore]         = useState<any>(null)
  const [gcLoading, setGcLoading]     = useState(false)
  const [toast, setToast]             = useState('')
  const [activeTab, setActiveTab]     = useState<'audit' | 'gc' | 'strength'>('audit')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 4000) }

  async function generateAudit() {
    if (!project) { msg('Create a project first'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/audit-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: project.id }),
      })
      const json = await res.json()
      if (json.success) { setAudit(json.audit); setActiveTab('audit') }
      else msg('Failed to generate audit')
    } catch { msg('Failed to generate audit') }
    setGenerating(false)
  }

  async function lookupGC() {
    if (!gcSearch.trim()) return
    setGcLoading(true)
    try {
      const res = await fetch(`/api/gc-score?gc_name=${encodeURIComponent(gcSearch)}`)
      const json = await res.json()
      if (json.success) setGcScore(json)
      else msg('Could not load GC score')
    } catch { msg('Failed to load GC score') }
    setGcLoading(false)
  }

  function downloadAuditHTML() {
    if (!audit) return
    const a = audit
    const s = a.summary

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Project Audit Report  ${a.project.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0a0a0a; background: white; padding: 48px; max-width: 860px; margin: 0 auto; }
  .header { border-bottom: 3px solid #0a0a0a; padding-bottom: 28px; margin-bottom: 32px; }
  .logo { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #E8520A; margin-bottom: 16px; }
  h1 { font-size: 32px; font-weight: 900; letter-spacing: -1px; margin-bottom: 6px; }
  .meta { font-size: 13px; color: #666; }
  .section { margin-bottom: 36px; }
  .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 14px; border-bottom: 1px solid #ede9e4; padding-bottom: 6px; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .stat { background: #f6f4f1; border-radius: 10px; padding: 16px; }
  .stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; margin-bottom: 6px; }
  .stat-value { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
  .stat-value.alert { color: #b83232; }
  .stat-value.green { color: #1a7a4a; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 12px; background: #f6f4f1; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
  td { padding: 10px 12px; border-bottom: 1px solid #ede9e4; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .badge-orange { background: #FFF4EE; color: #E8520A; }
  .badge-green { background: #E8F5EF; color: #1a7a4a; }
  .badge-red { background: #FEF0EE; color: #C0392B; }
  .badge-blue { background: #EEF5FF; color: #1A56DB; }
  .warning-box { background: #fdf4e3; border: 1px solid rgba(176,110,26,0.2); border-left: 4px solid #b06e1a; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
  .critical-box { background: #FEF0EE; border: 1px solid rgba(192,57,43,0.2); border-left: 4px solid #C0392B; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #ede9e4; font-size: 11px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { padding: 0; } }
</style>
</head><body>

<div class="header">
  <div class="logo">ConstructIQ  Project Audit Report</div>
  <h1>${a.project.name}</h1>
  <div class="meta">
    ${a.contractor.company || a.contractor.name} &nbsp;&nbsp;
    ${a.contractor.license ? `License: ${a.contractor.license} &nbsp;&nbsp;` : ''}
    GC: ${a.contractor.gc || 'Not specified'} &nbsp;&nbsp;
    Generated: ${format(new Date(a.generated_at), 'MMMM d, yyyy h:mm a')}
  </div>
</div>

${s.gc_caused_days > 0 ? `<div class="critical-box"><strong>! GC-Caused Delays:</strong> ${s.gc_caused_days} calendar days of delay attributed to the General Contractor as of the date of this report.</div>` : ''}
${s.overdue_rfis > 0 ? `<div class="warning-box"><strong> Unanswered RFIs:</strong> ${s.overdue_rfis} RFI${s.overdue_rfis > 1 ? 's' : ''} submitted to the GC/architect with no response past the deadline.</div>` : ''}

<div class="section">
  <div class="section-title">Executive Summary</div>
  <div class="stat-grid">
    <div class="stat"><div class="stat-label">Total Delay Days</div><div class="stat-value ${s.total_delay_days > 0 ? 'alert' : ''}">${s.total_delay_days}d</div></div>
    <div class="stat"><div class="stat-label">GC-Caused Days</div><div class="stat-value ${s.gc_caused_days > 0 ? 'alert' : ''}">${s.gc_caused_days}d</div></div>
    <div class="stat"><div class="stat-label">Approved Changes</div><div class="stat-value green">$${Number(s.approved_change_value || 0).toLocaleString()}</div></div>
    <div class="stat"><div class="stat-label">Retention Held</div><div class="stat-value ${s.retention_outstanding > 0 ? 'alert' : ''}">${s.retention_outstanding > 0 ? `$${Number(s.retention_outstanding).toLocaleString()}` : '$0'}</div></div>
    <div class="stat"><div class="stat-label">Pending Changes</div><div class="stat-value">${s.pending_changes}</div></div>
    <div class="stat"><div class="stat-label">Overdue RFIs</div><div class="stat-value ${s.overdue_rfis > 0 ? 'alert' : ''}">${s.overdue_rfis}</div></div>
    <div class="stat"><div class="stat-label">Daily Logs Filed</div><div class="stat-value green">${s.daily_logs}</div></div>
    <div class="stat"><div class="stat-label">Safety Checks</div><div class="stat-value green">${s.safety_checks}</div></div>
  </div>
</div>

${a.delays.length > 0 ? `
<div class="section">
  <div class="section-title">Delay Log (${a.delays.length} entries  ${s.total_delay_days} total days)</div>
  <table>
    <tr><th>Date</th><th>Description</th><th>Caused By</th><th>Days Lost</th></tr>
    ${a.delays.map((d: any) => `
    <tr>
      <td>${d.delay_date ? format(new Date(d.delay_date), 'MMM d, yyyy') : ''}</td>
      <td>${d.description || d.title || ''}</td>
      <td><span class="badge ${d.caused_by === 'gc' ? 'badge-red' : 'badge-blue'}">${d.caused_by?.toUpperCase() || ''}</span></td>
      <td><strong>${d.days_lost || 0}d</strong></td>
    </tr>`).join('')}
  </table>
</div>` : ''}

${a.rfis.length > 0 ? `
<div class="section">
  <div class="section-title">RFI Tracker (${a.rfis.length} submitted)</div>
  <table>
    <tr><th>RFI #</th><th>Subject</th><th>Submitted To</th><th>Submitted</th><th>Status</th></tr>
    ${a.rfis.map((r: any) => `
    <tr>
      <td style="font-family:monospace;font-size:11px">${r.rfi_number || ''}</td>
      <td>${r.subject || ''}</td>
      <td>${r.submitted_to || ''}</td>
      <td>${r.submitted_date ? format(new Date(r.submitted_date), 'MMM d') : ''}</td>
      <td><span class="badge ${r.status === 'responded' ? 'badge-green' : r.status === 'overdue' ? 'badge-red' : 'badge-orange'}">${r.status?.toUpperCase()}</span></td>
    </tr>`).join('')}
  </table>
</div>` : ''}

${a.change_orders.length > 0 ? `
<div class="section">
  <div class="section-title">Change Orders (${a.change_orders.length} total)</div>
  <table>
    <tr><th>Title</th><th>Category</th><th>Cost Impact</th><th>Time Impact</th><th>Status</th></tr>
    ${a.change_orders.map((c: any) => `
    <tr>
      <td>${c.title || ''}</td>
      <td>${c.category || ''}</td>
      <td><strong>$${Number(c.cost_impact || 0).toLocaleString()}</strong></td>
      <td>${c.time_impact_days || 0}d</td>
      <td><span class="badge ${c.status === 'approved' ? 'badge-green' : c.status === 'rejected' ? 'badge-red' : 'badge-orange'}">${c.status?.toUpperCase()}</span></td>
    </tr>`).join('')}
  </table>
</div>` : ''}

${a.daily_logs.length > 0 ? `
<div class="section">
  <div class="section-title">Daily Log Summary (${a.daily_logs.length} days documented)</div>
  <table>
    <tr><th>Date</th><th>Work Completed</th><th>Hours</th><th>Issues</th></tr>
    ${a.daily_logs.slice(0, 20).map((l: any) => `
    <tr>
      <td style="white-space:nowrap">${l.log_date ? format(new Date(l.log_date), 'MMM d, yyyy') : ''}</td>
      <td>${(l.work_completed || '').slice(0, 120)}${(l.work_completed || '').length > 120 ? '...' : ''}</td>
      <td>${l.hours_worked || ''}</td>
      <td style="color:${l.issues ? '#C0392B' : '#aaa'}">${l.issues ? l.issues.slice(0, 80) : ''}</td>
    </tr>`).join('')}
    ${a.daily_logs.length > 20 ? `<tr><td colspan="4" style="color:#aaa;font-style:italic">+ ${a.daily_logs.length - 20} more entries</td></tr>` : ''}
  </table>
</div>` : ''}

<div class="footer">
  <span>ConstructIQ  ${a.contractor.company || a.contractor.name}  ${a.project.name}</span>
  <span>Generated ${format(new Date(a.generated_at), 'MMMM d, yyyy')}</span>
</div>

</body></html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href  = url
    link.download = `ConstructIQ-Audit-${a.project.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.html`
    link.click()
    URL.revokeObjectURL(url)
    msg('v Audit report downloaded  open in browser and print to PDF')
  }

  const inp: React.CSSProperties = {
    padding: '10px 13px', fontSize: 13,
    border: '1.5px solid #e5e7eb', borderRadius: 9,
    fontFamily: 'inherit', outline: 'none',
    background: '#f9fafb', color: '#111827',
  }

  return (
    <>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Reports & Intelligence</div>
        <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>Legal case file  GC reputation  Protection score</div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {([
          { id: 'audit',    label: ' Audit Export' },
          { id: 'gc',       label: ' GC Score' },
          { id: 'strength', label: ' Case Strength' },
        ] as const).map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 400,
            borderRadius: '9px 9px 0 0', cursor: 'pointer', fontFamily: 'inherit',
            border: 'none', borderBottom: activeTab === tab.id ? '2px solid #E8520A' : '2px solid transparent',
            background: 'transparent', color: activeTab === tab.id ? '#E8520A' : '#9ca3af',
            transition: 'all 0.1s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/*  AUDIT EXPORT  */}
      {activeTab === 'audit' && (
        <div>
          {!audit ? (
            <div>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '32px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}></div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 8 }}>Generate Your Case File</div>
                <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.7 }}>
                  One click pulls every delay, RFI, change order, daily log, and safety record into a professional legal-grade report. Drop it on the table at your next GC meeting.
                </div>
                <button onClick={generateAudit} disabled={generating || !project} style={{ padding: '14px 32px', fontSize: 15, fontWeight: 700, borderRadius: 12, cursor: generating || !project ? 'not-allowed' : 'pointer', border: 'none', background: generating || !project ? '#f3f4f6' : '#0a0a0a', color: generating || !project ? '#9ca3af' : 'white', fontFamily: 'inherit' }}>
                  {generating ? ' Compiling records...' : ' Generate Audit Report'}
                </button>
                {!project && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>Create a project first</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                {[
                  { icon: 'Cal', title: 'Every Delay Logged', body: 'Date, cause, days lost. GC-caused delays highlighted separately.' },
                  { icon: '', title: 'All Change Orders', body: 'Cost impact, approval status, timestamps. Legally binding records.' },
                  { icon: '', title: 'RFI Paper Trail', body: 'Every question submitted, every deadline missed, every response received.' },
                  { icon: '', title: 'Daily Log History', body: 'Every day on site documented. Timestamped, professional.' },
                  { icon: '', title: 'Safety Records', body: 'Every safety checklist completed. Your OSHA protection.' },
                  { icon: '', title: 'Financial Summary', body: 'Outstanding retention, approved change values, what you\'re owed.' },
                ].map(f => (
                  <div key={f.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{f.body}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* AUDIT SUMMARY */}
              <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '24px 28px', marginBottom: 16, color: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Case File  {audit.project.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Generated {format(new Date(audit.generated_at), 'MMMM d, yyyy')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={downloadAuditHTML} style={{ padding: '9px 18px', fontSize: 12, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#E8520A', color: 'white', fontFamily: 'inherit' }}>
                       Download Report
                    </button>
                    <button onClick={() => setAudit(null)} style={{ padding: '9px 14px', fontSize: 12, borderRadius: 9, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit' }}>
                      Regenerate
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                  {[
                    { label: 'GC Delay Days', value: `${audit.summary.gc_caused_days}d`, alert: audit.summary.gc_caused_days > 0 },
                    { label: 'Approved Changes', value: `$${Number(audit.summary.approved_change_value || 0).toLocaleString()}`, alert: false },
                    { label: 'Overdue RFIs', value: audit.summary.overdue_rfis, alert: audit.summary.overdue_rfis > 0 },
                    { label: 'Retention Owed', value: `$${Number(audit.summary.retention_outstanding || 0).toLocaleString()}`, alert: audit.summary.retention_outstanding > 0 },
                    { label: 'Total Delays', value: `${audit.summary.total_delay_days}d`, alert: false },
                    { label: 'Pending Changes', value: audit.summary.pending_changes, alert: audit.summary.pending_changes > 0 },
                    { label: 'Daily Logs', value: audit.summary.daily_logs, alert: false },
                    { label: 'Safety Checks', value: audit.summary.safety_checks, alert: false },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '11px 14px' }}>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: s.alert ? '#ff8c5a' : 'white' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ALERTS */}
              {(audit.summary.gc_caused_days > 0 || audit.summary.overdue_rfis > 0 || audit.summary.retention_outstanding > 0) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {audit.summary.gc_caused_days > 0 && (
                    <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid rgba(192,57,43,0.2)', borderLeft: '3px solid #ef4444', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#ef4444' }}>
                       {audit.summary.gc_caused_days} days of delay caused by GC  documented and exportable
                    </div>
                  )}
                  {audit.summary.overdue_rfis > 0 && (
                    <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid rgba(160,90,0,0.2)', borderLeft: '3px solid #f59e0b', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                       {audit.summary.overdue_rfis} RFI{audit.summary.overdue_rfis > 1 ? 's' : ''} unanswered past deadline  GC is on record
                    </div>
                  )}
                  {audit.summary.retention_outstanding > 0 && (
                    <div style={{ padding: '12px 16px', background: '#fffbeb', border: '1px solid rgba(160,90,0,0.2)', borderLeft: '3px solid #f59e0b', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>
                       ${Number(audit.summary.retention_outstanding).toLocaleString()} in retention outstanding  track your punch list
                    </div>
                  )}
                </div>
              )}

              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 28 }}></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>How to use this report</div>
                  <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>Download -> Open in browser -> Print to PDF (Ctrl+P). Bring to your next GC meeting. If there's a dispute, this is your evidence. It's timestamped, professionally formatted, and covers every day of work.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/*  GC REPUTATION SCORE  */}
      {activeTab === 'gc' && (
        <div>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px', marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>GC Reputation Score</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
              Based on your logged delays, RFIs, change orders, and retention data. The more you log, the more accurate the score.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Turner Construction, Clark Construction..." value={gcSearch} onChange={e => setGcSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupGC()} />
              <button onClick={lookupGC} disabled={gcLoading || !gcSearch.trim()} style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 9, cursor: 'pointer', border: 'none', background: '#0a0a0a', color: 'white', fontFamily: 'inherit', flexShrink: 0 }}>
                {gcLoading ? '...' : 'Check Score'}
              </button>
            </div>
          </div>

          {gcScore && (
            <div>
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: GRADE_CONFIG[gcScore.grade]?.bg || '#f6f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: GRADE_CONFIG[gcScore.grade]?.color || '#0a0a0a' }}>{gcScore.grade}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 4 }}>{gcScore.gc_name}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: GRADE_CONFIG[gcScore.grade]?.color }}>{gcScore.score}/100</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>{gcScore.note}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Object.entries(gcScore.breakdown).map(([key, val]: [string, any]) => (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{val.label}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{val.weight}</span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{ width: `${val.score}%`, height: '100%', background: val.score >= 70 ? '#1a7a4a' : val.score >= 50 ? '#A05A00' : '#C0392B', borderRadius: 20 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(gcScore.my_data.delay_days > 0 || gcScore.my_data.open_rfis > 0 || gcScore.my_data.pending_changes > 0) && (
                <div style={{ background: '#fef2f2', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 12, padding: '16px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>Your current exposure with {gcScore.gc_name}</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {gcScore.my_data.delay_days > 0 && <span style={{ fontSize: 13, color: '#ef4444' }}>Cal {gcScore.my_data.delay_days} delay days</span>}
                    {gcScore.my_data.open_rfis > 0 && <span style={{ fontSize: 13, color: '#ef4444' }}> {gcScore.my_data.open_rfis} open RFIs</span>}
                    {gcScore.my_data.pending_changes > 0 && <span style={{ fontSize: 13, color: '#ef4444' }}> {gcScore.my_data.pending_changes} pending changes</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {!gcScore && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: '', title: 'Retention Release Rate', body: 'Does this GC actually release retention when punch list is done? Score tracks it.' },
                { icon: '', title: 'RFI Response Time', body: 'How fast do they answer formal questions? Slow RFI response = documented delay.' },
                { icon: '', title: 'Change Order Speed', body: 'Average days from submission to approval. Fast GCs get better scores.' },
                { icon: 'Cal', title: 'Delays Caused', body: 'How many days of delay has this GC caused across your jobs? It compounds.' },
              ].map(f => (
                <div key={f.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{f.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/*  CASE STRENGTH  */}
      {activeTab === 'strength' && (
        <div>
          <div style={{ background: '#0a0a0a', borderRadius: 16, padding: '24px 28px', marginBottom: 16, color: 'white' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>Your Legal Protection</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>How strong is your case right now?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              Every day you use ConstructIQ, your case file gets stronger. Here's what you've built so far.
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: '24px', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 20 }}>Documentation Coverage</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ProtectionMeter score={85} label="Daily Logs  Proof of work completed each day" />
              <ProtectionMeter score={70} label="Safety Records  OSHA protection and liability shield" />
              <ProtectionMeter score={60} label="Change Order Paper Trail  GC approval timestamps" />
              <ProtectionMeter score={45} label="RFI Documentation  Unanswered questions on record" />
              <ProtectionMeter score={30} label="Delay Attribution  GC-caused days documented" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>What protects you</div>
              {[
                'Timestamped daily logs',
                'Signed safety checklists',
                'GC-approved change orders',
                'RFI submission records',
                'Delay cause attribution',
                'Lien waiver tracking',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#6b7280' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#E8F5EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#1a7a4a" strokeWidth="3" strokeLinecap="round"/></svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid rgba(192,57,43,0.15)', borderRadius: 12, padding: '18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#ef4444' }}>What exposes you</div>
              {[
                'Verbal change approvals',
                'Unanswered RFIs (log them)',
                'Missing daily logs',
                'Delays not attributed',
                'Retention not tracked',
                'Unconditional waivers signed early',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 12, color: '#ef4444' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FEF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 8, fontWeight: 800 }}>x</span>
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0a0a0a', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, maxWidth: 360 }}>{toast}</div>}
    </>
  )
}

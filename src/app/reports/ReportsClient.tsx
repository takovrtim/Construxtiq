'use client'

import { useState } from 'react'

interface Props {
  user: any; project: any
  jobs: any[]; permits: any[]; inspections: any[]
  changes: any[]; crewTime: any[]; materials: any[]
  invoices: any[]; logs: any[]; safety: any[]
}

export function ReportsClient({ user, project, jobs, permits, inspections, changes, crewTime, materials, invoices, logs, safety }: Props) {
  const [generating, setGenerating] = useState(false)
  const [aiReport, setAiReport]     = useState('')
  const [toast, setToast]           = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  if (!project) return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: 40 }}>📊</div><a href="/dashboard" style={{ color: '#d95f2b', textDecoration: 'none', fontSize: 13 }}>Create a project first →</a></div>

  // Compute stats
  const totalRevenue    = invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalPaid       = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalCosts      = materials.reduce((s: number, m: any) => s + Number(m.total_cost || 0), 0) + crewTime.reduce((s: number, c: any) => s + Number(c.total_pay || 0), 0)
  const totalHours      = crewTime.reduce((s: number, c: any) => s + Number(c.hours || 0), 0)
  const totalChangeCost = changes.filter((c: any) => c.status === 'approved').reduce((s: number, c: any) => s + Number(c.cost_impact || 0), 0)
  const safetyRate      = safety.length > 0 ? Math.round((safety.filter((s: any) => s.all_clear).length / safety.length) * 100) : 0
  const passedInspect   = inspections.filter((i: any) => i.status === 'passed').length
  const activeJobs      = jobs.filter((j: any) => ['active','in_progress','pending'].includes(j.status)).length
  const completedJobs   = jobs.filter((j: any) => j.status === 'completed').length

  const sections = [
    {
      title: 'Financial Summary',
      icon: '💰',
      color: '#2d7a4f',
      stats: [
        { label: 'Total Invoiced', value: `$${totalRevenue.toLocaleString()}` },
        { label: 'Collected', value: `$${totalPaid.toLocaleString()}`, accent: '#2d7a4f' },
        { label: 'Outstanding', value: `$${(totalRevenue - totalPaid).toLocaleString()}`, accent: totalRevenue - totalPaid > 0 ? '#b06e1a' : '' },
        { label: 'Total Costs', value: `$${totalCosts.toLocaleString()}`, accent: '#b83232' },
        { label: 'Gross Profit', value: `$${(totalRevenue - totalCosts).toLocaleString()}`, accent: totalRevenue - totalCosts > 0 ? '#2d7a4f' : '#b83232' },
        { label: 'Change Order Total', value: `$${totalChangeCost.toLocaleString()}` },
      ]
    },
    {
      title: 'Job Progress',
      icon: '🏗️',
      color: '#1f5fa6',
      stats: [
        { label: 'Total Jobs', value: jobs.length },
        { label: 'Active', value: activeJobs, accent: '#1f5fa6' },
        { label: 'Completed', value: completedJobs, accent: '#2d7a4f' },
        { label: 'Change Orders', value: changes.length },
        { label: 'Approved Changes', value: changes.filter((c: any) => c.status === 'approved').length, accent: '#2d7a4f' },
        { label: 'Pending Changes', value: changes.filter((c: any) => c.status === 'pending').length, accent: '#b06e1a' },
      ]
    },
    {
      title: 'Field Operations',
      icon: '👷',
      color: '#d95f2b',
      stats: [
        { label: 'Total Hours Logged', value: `${totalHours}h` },
        { label: 'Daily Logs', value: logs.length },
        { label: 'Safety Checklists', value: safety.length },
        { label: 'All Clear Rate', value: `${safetyRate}%`, accent: safetyRate >= 90 ? '#2d7a4f' : '#b06e1a' },
        { label: 'Materials Tracked', value: materials.length },
        { label: 'Flagged Materials', value: materials.filter((m: any) => m.flagged).length, accent: materials.filter((m: any) => m.flagged).length > 0 ? '#b83232' : '' },
      ]
    },
    {
      title: 'Compliance & Permits',
      icon: '📋',
      color: '#7F77DD',
      stats: [
        { label: 'Active Permits', value: permits.filter((p: any) => p.status === 'active').length, accent: '#2d7a4f' },
        { label: 'Expiring Soon', value: permits.filter((p: any) => p.status === 'expiring_soon').length, accent: '#b06e1a' },
        { label: 'Expired Permits', value: permits.filter((p: any) => p.status === 'expired').length, accent: '#b83232' },
        { label: 'Total Inspections', value: inspections.length },
        { label: 'Passed', value: passedInspect, accent: '#2d7a4f' },
        { label: 'Scheduled', value: inspections.filter((i: any) => i.status === 'scheduled').length },
      ]
    },
  ]

  async function generateAIReport() {
    setGenerating(true)
    setAiReport('')
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: { name: project.name, address: project.address },
          stats: { totalRevenue, totalPaid, totalCosts, totalHours, activeJobs, completedJobs, safetyRate, passedInspect, totalChangeCost },
          jobCount: jobs.length, permitCount: permits.length, changeCount: changes.length,
          logCount: logs.length, safetyCount: safety.length,
        }),
      })
      const json = await res.json()
      if (json.success) setAiReport(json.report)
      else msg('Report generation failed')
    } catch { msg('Report generation failed') }
    setGenerating(false)
  }

  function printReport() {
    window.print()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Project Report</div>
          <div style={{ fontSize: 13, color: '#9e9d99', marginTop: 2 }}>{project.name} · Full project summary</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={generateAIReport} disabled={generating} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: 'none', background: '#1f5fa6', color: 'white', fontFamily: 'inherit' }}>
            {generating ? '⏳ Generating...' : '✨ AI Summary'}
          </button>
          <button onClick={printReport} style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)', background: 'white', fontFamily: 'inherit' }}>
            🖨️ Print
          </button>
        </div>
      </div>

      {/* PROJECT HEADER */}
      <div style={{ background: '#0f0f0f', borderRadius: 16, padding: '24px 28px', marginBottom: 20, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(217,95,43,0.1)' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Project Report</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{project.name}</div>
        {project.address && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{project.address}{project.city ? `, ${project.city}, ${project.state}` : ''}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginTop: 20 }}>
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}` },
            { label: 'Total Costs', value: `$${totalCosts.toLocaleString()}` },
            { label: 'Gross Profit', value: `$${(totalRevenue-totalCosts).toLocaleString()}`, color: totalRevenue-totalCosts >= 0 ? '#4ade80' : '#f87171' },
            { label: 'Hours Logged', value: `${totalHours}h` },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: (s as any).color || 'white' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI REPORT */}
      {aiReport && (
        <div style={{ background: '#eef3fb', border: '1px solid rgba(31,95,166,0.2)', borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1f5fa6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✨</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0C447C' }}>AI Project Summary</div>
          </div>
          <div style={{ fontSize: 14, color: '#0f0f0f', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{aiReport}</div>
        </div>
      )}

      {/* STAT SECTIONS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {sections.map(section => (
          <div key={section.title} style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: section.color, borderRadius: '16px 16px 0 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{section.title}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {section.stats.map(stat => (
                <div key={stat.label} style={{ background: '#f8f7f4', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: (stat as any).accent || '#0f0f0f' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns'
import Link from 'next/link'

interface Props {
  user: any; project: any; projects: any[]
  jobs: any[]; permits: any[]; inspections: any[]
  changes: any[]; crewTime: any[]; materials: any[]
  safetyChecklists: any[]; invoices: any[]
  retention: any[]; rfis: any[]
}

const HOUR = new Date().getHours()
const GREETING = HOUR < 5 ? 'Still up,' : HOUR < 12 ? 'Good morning,' : HOUR < 17 ? 'Good afternoon,' : 'Good evening,'

const JOB_STATUS_COLORS: Record<string, string> = {
  active: '#2d7a4f', in_progress: '#1f5fa6', pending: '#b06e1a',
  completed: '#9e9d99', on_hold: '#b06e1a', cancelled: '#b83232',
}

export function DashboardClient({
  user, project, projects, jobs, permits, inspections,
  changes, crewTime, materials, safetyChecklists,
  invoices, retention, rfis,
}: Props) {
  const [projectName, setProjectName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // ── COMPUTED ALERTS ────────────────────────────────────
  const expiringPermits      = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) <= 14 && differenceInDays(parseISO(p.expiry_date), today) >= 0)
  const overdueInspections   = inspections.filter(i => i.status === 'scheduled' && i.scheduled_date && isPast(parseISO(i.scheduled_date)) && !isToday(parseISO(i.scheduled_date)))
  const pendingChanges        = changes.filter(c => c.status === 'pending')
  const flaggedMaterials      = materials.filter(m => m.flagged && m.status !== 'installed')
  const todaySafety           = safetyChecklists.find(c => c.job_date === todayStr)
  const todayCrewTime         = crewTime.filter(c => c.work_date === todayStr)
  const overdueRFIs           = rfis.filter(r => r.status !== 'closed' && r.status !== 'responded' && r.response_needed_by && isPast(parseISO(r.response_needed_by)))
  const activeJobs            = jobs.filter(j => ['active', 'in_progress', 'pending'].includes(j.status))
  const completedJobs         = jobs.filter(j => j.status === 'completed').length
  const todayHours            = todayCrewTime.reduce((s: number, c: any) => s + (c.hours || 0), 0)
  const alertCount            = expiringPermits.length + overdueInspections.length + pendingChanges.length + flaggedMaterials.length + (todaySafety ? 0 : 1) + overdueRFIs.length

  // ── FINANCIAL NUMBERS ──────────────────────────────────
  const totalInvoiced   = invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalPaid       = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalOutstanding = invoices.filter((i: any) => ['sent','overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const overdueInvoices = invoices.filter((i: any) => i.status === 'sent' && i.due_date && isPast(parseISO(i.due_date)))
  const totalRetention  = retention.reduce((s: number, r: any) => s + (Number(r.retention_held || 0) - Number(r.retention_released || 0)), 0)
  const totalContracts  = jobs.reduce((s: number, j: any) => s + Number(j.contract_value || 0), 0)

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    const { error } = await supabase.from('projects').insert({
      user_id: authUser.id, name: projectName.trim(), status: 'active',
    })
    if (!error) { msg('Project created!'); setTimeout(() => window.location.reload(), 800) }
    else msg('Failed to create project')
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }

  if (!project) return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, background: '#d95f2b', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>Create your first project</div>
        <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Everything in ConstructIQ starts with a project.</div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Project Name *</label>
            <input style={inp} placeholder="Hardrock Cafe — Electrical Rough-In" value={projectName} onChange={e => setProjectName(e.target.value)} required autoFocus />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Creating...' : 'Create Project →'}
          </button>
        </form>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13 }}>{toast}</div>}
    </div>
  )

  return (
    <>
      {/* ── MORNING GREETING ─────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 2 }}>{format(today, 'EEEE, MMMM d')}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {GREETING} {user?.full_name?.split(' ')[0] || 'there'} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 }}>{project.name}</div>
      </div>

      {/* ── CASH FLOW CARD ───────────────────────────────── */}
      <div style={{ background: '#0a0a0a', borderRadius: 20, padding: '24px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(217,95,43,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '30%', width: 240, height: 160, borderRadius: '50%', background: 'rgba(217,95,43,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Cash Flow Overview</div>
            <Link href="/invoices" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 600 }}>View invoices →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {[
              { label: 'Total Contracts',  value: totalContracts  > 0 ? `$${(totalContracts/1000000).toFixed(1)}M` : '$—', sub: `${jobs.length} jobs`,           color: 'rgba(255,255,255,0.7)', href: '/jobs' },
              { label: 'Invoiced',         value: totalInvoiced   > 0 ? `$${(totalInvoiced/1000).toFixed(0)}K`   : '$—', sub: `${invoices.length} invoices`,    color: 'white',                 href: '/invoices' },
              { label: 'Collected',        value: totalPaid       > 0 ? `$${(totalPaid/1000).toFixed(0)}K`       : '$—', sub: 'paid to date',                    color: '#4ade80',               href: '/invoices' },
              { label: 'Outstanding',      value: totalOutstanding > 0 ? `$${(totalOutstanding/1000).toFixed(0)}K` : '$—', sub: `${overdueInvoices.length} overdue`, color: overdueInvoices.length > 0 ? '#ff8c5a' : 'white', href: '/invoices' },
              { label: 'Retention Held',   value: totalRetention  > 0 ? `$${(totalRetention/1000).toFixed(0)}K`  : '$—', sub: `${retention.length} contracts`,   color: '#ff8c5a',               href: '/retention' },
            ].map(s => (
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 14px', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'background 0.1s' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Overdue invoices or retention warning */}
          {(overdueInvoices.length > 0 || totalRetention > 100000) && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {overdueInvoices.length > 0 && (
                <Link href="/invoices" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(255,107,74,0.15)', borderRadius: 20, textDecoration: 'none', border: '1px solid rgba(255,107,74,0.2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ff8c5a' }}>⚠️ {overdueInvoices.length} invoice{overdueInvoices.length > 1 ? 's' : ''} overdue — chase payment now</span>
                </Link>
              )}
              {totalRetention > 100000 && (
                <Link href="/retention" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: 'rgba(255,107,74,0.1)', borderRadius: 20, textDecoration: 'none', border: '1px solid rgba(255,107,74,0.15)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ff8c5a' }}>💰 ${(totalRetention/1000).toFixed(0)}K in retention — track your punch list</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CASE STRENGTH CARD ──────────────────────────── */}
      {(() => {
        const logScore     = Math.min(100, Math.round((logs.filter((l: any) => {
          const d = new Date(); d.setDate(d.getDate() - 7)
          return new Date(l.log_date) >= d
        }).length / 7) * 100))
        const safetyScore  = Math.min(100, Math.round((safetyChecklists.filter((c: any) => {
          const d = new Date(); d.setDate(d.getDate() - 7)
          return new Date(c.job_date) >= d
        }).length / 7) * 100))
        const changeScore  = changes.filter((c: any) => c.approval_token).length > 0 ? 85 : changes.length > 0 ? 40 : 0
        const rfiScore     = rfis.length > 0 ? Math.round((rfis.filter((r: any) => r.status !== 'open').length / rfis.length) * 100) : 0
        const overall      = Math.round((logScore * 0.35) + (safetyScore * 0.3) + (changeScore * 0.2) + (rfiScore * 0.15))
        const color        = overall >= 75 ? '#22c55e' : overall >= 50 ? '#ea580c' : '#ef4444'
        const label        = overall >= 75 ? 'Strong' : overall >= 50 ? 'Building' : 'Weak'
        if (overall === 0) return null
        return (
          <Link href="/reports" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color }}>{overall}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Case Strength: <span style={{ color }}>{label}</span></div>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${overall}%`, height: '100%', background: color, borderRadius: 20, transition: 'width 0.8s ease' }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0 }}>View report →</div>
            </div>
          </Link>
        )
      })()}

      {/* ── TODAY ALERTS ─────────────────────────────────── */}
      {alertCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Action needed today</div>

          {!todaySafety && (
            <Link href="/safety" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b06e1a' }}>
              <span style={{ fontSize: 16 }}>🦺</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>No safety checklist today</div><div style={{ fontSize: 11, color: '#b06e1a' }}>Required before crew starts — do it now</div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b06e1a' }}>Do it →</span>
            </Link>
          )}

          {overdueRFIs.length > 0 && (
            <Link href="/rfi" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b83232' }}>
              <span style={{ fontSize: 16 }}>📋</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6e1a1a' }}>{overdueRFIs.length} RFI{overdueRFIs.length > 1 ? 's' : ''} overdue — GC has not responded</div><div style={{ fontSize: 11, color: '#b83232' }}>Every day without response is documented delay</div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b83232' }}>Log →</span>
            </Link>
          )}

          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date), today)
            const crit = days <= 7
            return (
              <Link key={p.id} href="/documents" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: crit ? '#fdf0f0' : '#fdf4e3', border: `1px solid ${crit ? 'rgba(184,50,50,0.2)' : 'rgba(176,110,26,0.2)'}`, borderRadius: 12, textDecoration: 'none', borderLeft: `3px solid ${crit ? '#b83232' : '#b06e1a'}` }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: crit ? '#6e1a1a' : '#6b4010' }}>Permit expires in {days} day{days !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: crit ? '#b83232' : '#b06e1a' }}>{p.permit_number} · {format(parseISO(p.expiry_date), 'MMM d, yyyy')}</div></div>
                <span style={{ fontSize: 12, fontWeight: 700, color: crit ? '#b83232' : '#b06e1a' }}>Renew →</span>
              </Link>
            )
          })}

          {pendingChanges.length > 0 && (
            <Link href="/changes" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eef3fb', border: '1px solid rgba(31,95,166,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #1f5fa6' }}>
              <span style={{ fontSize: 16 }}>🔄</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0C447C' }}>{pendingChanges.length} change order{pendingChanges.length > 1 ? 's' : ''} waiting for GC approval</div><div style={{ fontSize: 11, color: '#1f5fa6' }}>Send approval link to GC</div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1f5fa6' }}>Send →</span>
            </Link>
          )}

          {overdueInspections.map(i => (
            <Link key={i.id} href="/inspections" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b83232' }}>
              <span style={{ fontSize: 16 }}>🔍</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6e1a1a' }}>Overdue: {i.title || i.inspection_type}</div><div style={{ fontSize: 11, color: '#b83232' }}>Was due {format(parseISO(i.scheduled_date), 'MMM d')}</div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b83232' }}>Fix →</span>
            </Link>
          ))}

          {flaggedMaterials.length > 0 && (
            <Link href="/materials" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b06e1a' }}>
              <span style={{ fontSize: 16 }}>📦</span>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>{flaggedMaterials.length} material{flaggedMaterials.length > 1 ? 's' : ''} flagged</div><div style={{ fontSize: 11, color: '#b06e1a' }}>Missing or delayed supplies</div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#b06e1a' }}>Check →</span>
            </Link>
          )}
        </div>
      )}

      {/* ── MAIN GRID ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Active Jobs */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Active Jobs</div>
            <Link href="/jobs" style={{ fontSize: 12, color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>All →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>No active jobs</div>
              <Link href="/jobs" style={{ fontSize: 12, fontWeight: 700, color: '#d95f2b', textDecoration: 'none', padding: '7px 16px', background: '#fdf0e8', borderRadius: 8 }}>+ Add job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeJobs.slice(0, 5).map((job: any) => (
                <Link key={job.id} href="/jobs" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--surface-2)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: JOB_STATUS_COLORS[job.status] || '#9e9d99', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                      {job.client_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{job.client_name}</div>}
                    </div>
                    {job.contract_value && <div style={{ fontSize: 12, fontWeight: 700, color: '#2d7a4f', flexShrink: 0 }}>${Number(job.contract_value).toLocaleString()}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today status */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: todaySafety ? '✅' : '⚠️', label: 'Safety Check', sub: todaySafety ? 'Done' : 'Not done — required', href: '/safety', ok: !!todaySafety },
              { icon: '👷', label: 'Crew On Site', sub: todayCrewTime.length > 0 ? `${todayCrewTime.length} workers · ${todayHours}h` : 'No time logged', href: '/crew-time', ok: todayCrewTime.length > 0 },
              { icon: '📋', label: 'Permits', sub: expiringPermits.length > 0 ? `${expiringPermits.length} expiring soon` : `${permits.length} active`, href: '/documents', ok: expiringPermits.length === 0 },
              { icon: '📋', label: 'Open RFIs', sub: overdueRFIs.length > 0 ? `${overdueRFIs.length} overdue` : `${rfis.filter((r: any) => r.status === 'open').length} open`, href: '/rfi', ok: overdueRFIs.length === 0 },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: item.ok ? 'rgba(45,122,79,0.05)' : '#fef9f0', border: `1px solid ${item.ok ? 'rgba(45,122,79,0.1)' : 'rgba(176,110,26,0.15)'}` }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.ok ? '#2d7a4f' : '#b06e1a' }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#d95f2b', fontWeight: 600 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '18px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {[
            { href: '/logs',          icon: '📝', label: 'Log Day'    },
            { href: '/safety',        icon: '🦺', label: 'Safety'     },
            { href: '/changes',       icon: '🔄', label: 'Change Ord' },
            { href: '/rfi',           icon: '📋', label: 'RFI'        },
            { href: '/delay-tracker', icon: '📅', label: 'Log Delay'  },
            { href: '/invoices',      icon: '💵', label: 'Invoice'    },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 6px', borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </>
  )
}

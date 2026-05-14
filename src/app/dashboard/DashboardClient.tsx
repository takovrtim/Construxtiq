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

const ORANGE = '#ea580c'
const BLACK  = '#0a0a0a'

const card: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 20,
}

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  marginBottom: 6, display: 'block',
}

function fmt$(n: number): string {
  if (n === 0) return '—'
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)    return `$${(n / 1000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function DashboardClient({
  user, project, projects, jobs, permits, inspections,
  changes, crewTime, materials, safetyChecklists,
  invoices, retention, rfis,
}: Props) {
  const [projectName, setProjectName] = useState('')
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // Alerts
  const expiringPermits    = permits.filter(p => p.expiry_date && differenceInDays(parseISO(p.expiry_date), today) <= 14 && differenceInDays(parseISO(p.expiry_date), today) >= 0)
  const overdueInspections = inspections.filter(i => i.status === 'scheduled' && i.scheduled_date && isPast(parseISO(i.scheduled_date)) && !isToday(parseISO(i.scheduled_date)))
  const pendingChanges     = changes.filter(c => c.status === 'pending')
  const flaggedMaterials   = materials.filter(m => m.flagged && m.status !== 'installed')
  const todaySafety        = safetyChecklists.find(c => c.job_date === todayStr)
  const todayCrewTime      = crewTime.filter(c => c.work_date === todayStr)
  const overdueRFIs        = rfis.filter(r => r.status !== 'closed' && r.status !== 'responded' && r.response_needed_by && isPast(parseISO(r.response_needed_by)))
  const activeJobs         = jobs.filter(j => ['active', 'in_progress', 'pending'].includes(j.status))
  const todayHours         = todayCrewTime.reduce((s: number, c: any) => s + (c.hours || 0), 0)
  const alertCount         = expiringPermits.length + overdueInspections.length + pendingChanges.length + flaggedMaterials.length + (todaySafety ? 0 : 1) + overdueRFIs.length

  // Financials
  const totalContracts    = jobs.reduce((s: number, j: any) => s + Number(j.contract_value || 0), 0)
  const totalInvoiced     = invoices.reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalPaid         = invoices.filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const totalOutstanding  = invoices.filter((i: any) => ['sent','overdue'].includes(i.status)).reduce((s: number, i: any) => s + Number(i.total || 0), 0)
  const overdueInvoices   = invoices.filter((i: any) => i.status === 'sent' && i.due_date && isPast(parseISO(i.due_date)))
  const totalRetention    = retention.reduce((s: number, r: any) => s + (Number(r.retention_held || 0) - Number(r.retention_released || 0)), 0)

  // Case strength
  const recentSafety  = safetyChecklists.filter((c: any) => { const d = new Date(); d.setDate(d.getDate() - 7); return new Date(c.job_date) >= d }).length
  const safetyScore   = Math.min(100, Math.round((recentSafety / 7) * 100))
  const changeScore   = changes.filter((c: any) => c.approval_token).length > 0 ? 85 : changes.length > 0 ? 40 : 0
  const rfiScore      = rfis.length > 0 ? Math.round((rfis.filter((r: any) => r.status !== 'open').length / rfis.length) * 100) : 0
  const caseScore     = Math.round((safetyScore * 0.35) + (safetyScore * 0.3) + (changeScore * 0.2) + (rfiScore * 0.15))
  const caseColor     = caseScore >= 75 ? '#22c55e' : caseScore >= 50 ? ORANGE : '#ef4444'
  const caseLabel     = caseScore >= 75 ? 'Strong' : caseScore >= 50 ? 'Building' : 'Weak'

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    const { error } = await supabase.from('projects').insert({ user_id: authUser.id, name: projectName.trim(), status: 'active' })
    if (!error) { msg('Project created'); setTimeout(() => window.location.reload(), 800) }
    else msg('Failed to create project')
    setSaving(false)
  }

  // Empty state — no project yet
  if (!project) return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, background: ORANGE, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8, color: BLACK }}>Create your first project</div>
        <div style={{ fontSize: 14, color: '#6b7280' }}>Everything in SubIQ starts with a project.</div>
      </div>
      <div style={{ ...card }}>
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Project Name</label>
            <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid #e5e7eb', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f9fafb', color: BLACK, boxSizing: 'border-box' as const }}
              placeholder="Hardrock Hotel — Electrical Rough-In" value={projectName} onChange={e => setProjectName(e.target.value)} required autoFocus />
          </div>
          <button type="submit" disabled={saving} style={{ padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: 'pointer', border: 'none', background: ORANGE, color: 'white', fontFamily: 'inherit' }}>
            {saving ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: BLACK, color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13 }}>{toast}</div>}
    </div>
  )

  return (
    <>
      {/* GREETING */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4 }}>{format(today, 'EEEE, MMMM d')}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: BLACK }}>
          {GREETING} {user?.full_name?.split(' ')[0] || 'there'}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{project.name}</div>
      </div>

      {/* CASH FLOW */}
      <div style={{ background: BLACK, borderRadius: 20, padding: '24px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(234,88,12,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Cash Flow</div>
            <Link href="/invoices" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: 600 }}>View invoices</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              { label: 'Contracts',   value: fmt$(totalContracts),   sub: `${jobs.length} jobs`,              color: 'rgba(255,255,255,0.75)', href: '/jobs' },
              { label: 'Invoiced',    value: fmt$(totalInvoiced),    sub: `${invoices.length} invoices`,      color: 'white',                   href: '/invoices' },
              { label: 'Collected',   value: fmt$(totalPaid),        sub: 'paid to date',                     color: '#4ade80',                  href: '/invoices' },
              { label: 'Outstanding', value: fmt$(totalOutstanding), sub: `${overdueInvoices.length} overdue`, color: overdueInvoices.length > 0 ? '#fb923c' : 'white', href: '/invoices' },
              { label: 'Retention',   value: fmt$(totalRetention),   sub: `${retention.length} contracts`,   color: '#fb923c',                  href: '/retention' },
            ].map(s => (
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>

          {(overdueInvoices.length > 0 || totalRetention > 50000) && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {overdueInvoices.length > 0 && (
                <Link href="/invoices" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(251,146,60,0.15)', borderRadius: 20, textDecoration: 'none', border: '1px solid rgba(251,146,60,0.2)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>{overdueInvoices.length} invoice{overdueInvoices.length > 1 ? 's' : ''} overdue — follow up now</span>
                </Link>
              )}
              {totalRetention > 50000 && (
                <Link href="/retention" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'rgba(251,146,60,0.1)', borderRadius: 20, textDecoration: 'none', border: '1px solid rgba(251,146,60,0.15)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>{fmt$(totalRetention)} in retention held — track your punch list</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CASE STRENGTH */}
      {caseScore > 0 && (
        <Link href="/reports" style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}>
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${caseColor}15`, border: `2px solid ${caseColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: caseColor }}>{caseScore}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: BLACK }}>
                Case Strength: <span style={{ color: caseColor }}>{caseLabel}</span>
              </div>
              <div style={{ height: 5, background: '#f3f4f6', borderRadius: 20, overflow: 'hidden' }}>
                <div style={{ width: `${caseScore}%`, height: '100%', background: caseColor, borderRadius: 20, transition: 'width 0.8s ease' }} />
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>View report</div>
          </div>
        </Link>
      )}

      {/* ALERTS */}
      {alertCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Needs attention</div>

          {!todaySafety && (
            <Link href="/safety" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #f59e0b' }}>
              <span style={{ fontSize: 18 }}>🦺</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Safety checklist not done today</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>Complete before crew starts work</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Start</span>
            </Link>
          )}

          {overdueRFIs.length > 0 && (
            <Link href="/rfi" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #ef4444' }}>
              <span style={{ fontSize: 18 }}>📬</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>{overdueRFIs.length} RFI{overdueRFIs.length > 1 ? 's' : ''} past deadline — GC has not responded</div>
                <div style={{ fontSize: 12, color: '#dc2626' }}>Every day without a response is documented delay</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>View</span>
            </Link>
          )}

          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date), today)
            const crit = days <= 7
            return (
              <Link key={p.id} href="/documents" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: crit ? '#fef2f2' : '#fffbeb', border: `1px solid ${crit ? '#fecaca' : '#fde68a'}`, borderRadius: 12, textDecoration: 'none', borderLeft: `3px solid ${crit ? '#ef4444' : '#f59e0b'}` }}>
                <span style={{ fontSize: 18 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: crit ? '#991b1b' : '#92400e' }}>
                    Permit expires in {days} day{days !== 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: crit ? '#dc2626' : '#b45309' }}>
                    {p.permit_number} — {format(parseISO(p.expiry_date), 'MMM d, yyyy')}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: crit ? '#ef4444' : '#f59e0b' }}>Renew</span>
              </Link>
            )
          })}

          {pendingChanges.length > 0 && (
            <Link href="/changes" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #3b82f6' }}>
              <span style={{ fontSize: 18 }}>🔄</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af' }}>
                  {pendingChanges.length} change order{pendingChanges.length > 1 ? 's' : ''} waiting for GC approval
                </div>
                <div style={{ fontSize: 12, color: '#2563eb' }}>Send approval link to get a signed response</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>Send</span>
            </Link>
          )}

          {overdueInspections.map(i => (
            <Link key={i.id} href="/inspections" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #ef4444' }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Overdue: {i.title || i.inspection_type}</div>
                <div style={{ fontSize: 12, color: '#dc2626' }}>Was scheduled for {format(parseISO(i.scheduled_date), 'MMM d')}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Reschedule</span>
            </Link>
          ))}

          {flaggedMaterials.length > 0 && (
            <Link href="/materials" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #f59e0b' }}>
              <span style={{ fontSize: 18 }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{flaggedMaterials.length} material{flaggedMaterials.length > 1 ? 's' : ''} flagged</div>
                <div style={{ fontSize: 12, color: '#b45309' }}>Missing or delayed supplies need attention</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Check</span>
            </Link>
          )}
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14, marginBottom: 14 }}>

        {/* Active Jobs */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: BLACK }}>Active Jobs</div>
            <Link href="/jobs" style={{ fontSize: 12, color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>No active jobs yet</div>
              <Link href="/jobs" style={{ fontSize: 12, fontWeight: 700, color: ORANGE, textDecoration: 'none', padding: '7px 16px', background: '#fff7ed', borderRadius: 8 }}>Add a job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeJobs.slice(0, 5).map((job: any) => (
                <Link key={job.id} href="/jobs" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: '#f9fafb' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: BLACK }}>{job.title}</div>
                      {job.client_name && <div style={{ fontSize: 11, color: '#9ca3af' }}>{job.client_name}</div>}
                    </div>
                    {job.contract_value > 0 && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>{fmt$(job.contract_value)}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today Status */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: BLACK, marginBottom: 14 }}>
            Today — {format(today, 'MMM d')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              {
                icon: todaySafety ? '✅' : '⚠️',
                label: 'Safety Check',
                sub: todaySafety ? 'Completed' : 'Not done yet',
                href: '/safety',
                ok: !!todaySafety,
              },
              {
                icon: '👷',
                label: 'Crew Time',
                sub: todayCrewTime.length > 0 ? `${todayCrewTime.length} worker${todayCrewTime.length > 1 ? 's' : ''} — ${todayHours}h logged` : 'No time logged',
                href: '/crew-time',
                ok: todayCrewTime.length > 0,
              },
              {
                icon: '📄',
                label: 'Permits',
                sub: expiringPermits.length > 0 ? `${expiringPermits.length} expiring soon` : `${permits.length} active`,
                href: '/documents',
                ok: expiringPermits.length === 0,
              },
              {
                icon: '📬',
                label: 'Open RFIs',
                sub: overdueRFIs.length > 0 ? `${overdueRFIs.length} past deadline` : `${rfis.filter((r: any) => r.status === 'open').length} open`,
                href: '/rfi',
                ok: overdueRFIs.length === 0,
              },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: item.ok ? '#f0fdf4' : '#fffbeb', border: `1px solid ${item.ok ? '#bbf7d0' : '#fde68a'}` }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BLACK }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.ok ? '#16a34a' : '#b45309' }}>{item.sub}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ ...card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: BLACK, marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {[
            { href: '/logs',          icon: '📝', label: 'Daily Log'   },
            { href: '/safety',        icon: '🦺', label: 'Safety'      },
            { href: '/changes',       icon: '🔄', label: 'Changes'     },
            { href: '/rfi',           icon: '📬', label: 'RFI'         },
            { href: '/delay-tracker', icon: '📅', label: 'Log Delay'   },
            { href: '/invoices',      icon: '💵', label: 'Invoice'     },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 6px', borderRadius: 11, background: '#f9fafb', border: '1px solid #e5e7eb', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: BLACK }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: BLACK, color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>
          {toast}
        </div>
      )}
    </>
  )
}

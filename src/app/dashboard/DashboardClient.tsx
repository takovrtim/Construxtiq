'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, parseISO, differenceInDays, isToday, isPast } from 'date-fns'
import Link from 'next/link'

interface Props {
  user: any
  project: any
  projects: any[]
  jobs: any[]
  permits: any[]
  inspections: any[]
  changes: any[]
  crewTime: any[]
  materials: any[]
  safetyChecklists: any[]
}

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'

const STATUS_COLORS: Record<string, string> = {
  active: '#2d7a4f', in_progress: '#1f5fa6', pending: '#b06e1a',
  completed: '#9e9d99', on_hold: '#b06e1a', cancelled: '#b83232',
}

export function DashboardClient({ user, project, projects, jobs, permits, inspections, changes, crewTime, materials, safetyChecklists }: Props) {
  const [projectName, setProjectName] = useState('')
  const [projectAddr, setProjectAddr] = useState('')
  const [projectCity, setProjectCity] = useState('')
  const [projectState, setProjectState] = useState('NV')
  const [projectBid, setProjectBid] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const expiringPermits = permits.filter(p => {
    if (!p.expiry_date) return false
    const days = differenceInDays(parseISO(p.expiry_date), today)
    return days >= 0 && days <= 14
  })
  const overdueInspections = inspections.filter(i =>
    i.status === 'scheduled' && i.scheduled_date &&
    isPast(parseISO(i.scheduled_date)) && !isToday(parseISO(i.scheduled_date))
  )
  const pendingChanges = changes.filter(c => c.status === 'pending')
  const flaggedMaterials = materials.filter(m => m.flagged && m.status !== 'installed')
  const todaySafety = safetyChecklists.find(c => c.job_date === todayStr)
  const todayCrewTime = crewTime.filter(c => c.work_date === todayStr)
  const activeJobs = jobs.filter(j => ['active', 'in_progress', 'pending'].includes(j.status))
  const completedJobs = jobs.filter(j => j.status === 'completed').length
  const totalRevenue = jobs.reduce((s: number, j: any) => s + Number(j.contract_value || 0), 0)
  const todayHours = todayCrewTime.reduce((s: number, c: any) => s + (c.hours || 0), 0)
  const alertCount = expiringPermits.length + overdueInspections.length + pendingChanges.length + flaggedMaterials.length + (todaySafety ? 0 : 1)

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setSaving(false); return }
    const { error } = await supabase.from('projects').insert({
      user_id: authUser.id, name: projectName.trim(),
      address: projectAddr.trim() || null, city: projectCity.trim() || null,
      state: projectState, total_bid: parseFloat(projectBid) || null, status: 'active',
    })
    if (!error) { msg('Project created!'); setTimeout(() => window.location.reload(), 800) }
    else msg('Failed to create project')
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid var(--border)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: 'var(--surface-2)', color: 'var(--text-primary)' }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }

  // No project — show create form
  if (!project) return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 56, height: 56, background: '#d95f2b', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>Create your first project</div>
        <div style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>Everything in ConstructIQ starts with a project.</div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Project Name *</label><input style={inp} placeholder="Hardrock Cafe — Electrical Rough" value={projectName} onChange={e => setProjectName(e.target.value)} required autoFocus /></div>
          <div><label style={lbl}>Address</label><input style={inp} placeholder="4321 W Flamingo Rd" value={projectAddr} onChange={e => setProjectAddr(e.target.value)} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><label style={lbl}>City</label><input style={inp} placeholder="Las Vegas" value={projectCity} onChange={e => setProjectCity(e.target.value)} /></div>
            <div><label style={lbl}>State</label><input style={inp} placeholder="NV" value={projectState} onChange={e => setProjectState(e.target.value)} /></div>
          </div>
          <div><label style={lbl}>Contract Value ($)</label><input type="number" style={inp} placeholder="250000" value={projectBid} onChange={e => setProjectBid(e.target.value)} /></div>
          <button type="submit" disabled={saving || !projectName.trim()} style={{ padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4 }}>
            {saving ? 'Creating...' : 'Create Project →'}
          </button>
        </form>
      </div>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500 }}>{toast}</div>}
    </div>
  )

  return (
    <>
      {/* MORNING CARD */}
      <div style={{ background: '#0f0f0f', borderRadius: 18, padding: '24px 28px', marginBottom: 20, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(217,95,43,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {format(today, 'EEEE, MMMM d')}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4 }}>
            {GREETING}, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>
            {project.name}{project.city ? ` · ${project.city}` : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {[
              { label: 'Active Jobs', value: activeJobs.length, sub: `${completedJobs} done`, href: '/jobs', alert: false },
              { label: "Today's Crew", value: todayCrewTime.length, sub: `${todayHours}h logged`, href: '/crew-time', alert: false },
              { label: 'Alerts', value: alertCount, sub: 'need attention', href: '/safety', alert: alertCount > 0 },
              { label: 'Revenue', value: totalRevenue > 0 ? `$${Math.round(totalRevenue / 1000)}k` : '$—', sub: 'contract value', href: '/job-costing', alert: false },
            ].map(s => (
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: s.alert ? 'rgba(217,95,43,0.18)' : 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', border: `1px solid ${s.alert ? 'rgba(217,95,43,0.35)' : 'rgba(255,255,255,0.08)'}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px', color: s.alert ? '#ff8c5a' : 'white', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {alertCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Needs attention today</div>

          {!todaySafety && (
            <Link href="/safety" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b06e1a' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🦺</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>No safety checklist today</div><div style={{ fontSize: 11, color: '#b06e1a', marginTop: 1 }}>Complete before crew starts work — required daily</div></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b06e1a' }}>Do it →</div>
            </Link>
          )}

          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date), today)
            const crit = days <= 7
            return (
              <Link key={p.id} href="/documents" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: crit ? '#fdf0f0' : '#fdf4e3', border: `1px solid ${crit ? 'rgba(184,50,50,0.2)' : 'rgba(176,110,26,0.2)'}`, borderRadius: 12, textDecoration: 'none', borderLeft: `3px solid ${crit ? '#b83232' : '#b06e1a'}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: crit ? 'rgba(184,50,50,0.12)' : 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: crit ? '#6e1a1a' : '#6b4010' }}>Permit expires in {days} day{days !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: crit ? '#b83232' : '#b06e1a', marginTop: 1 }}>{p.permit_number} · {format(parseISO(p.expiry_date), 'MMM d, yyyy')}</div></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: crit ? '#b83232' : '#b06e1a' }}>Renew →</div>
              </Link>
            )
          })}

          {overdueInspections.map(i => (
            <Link key={i.id} href="/inspections" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fdf0f0', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b83232' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(184,50,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🔍</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6e1a1a' }}>Overdue: {i.title || i.inspection_type}</div><div style={{ fontSize: 11, color: '#b83232', marginTop: 1 }}>Was due {format(parseISO(i.scheduled_date), 'MMM d')}</div></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b83232' }}>Fix →</div>
            </Link>
          ))}

          {pendingChanges.length > 0 && (
            <Link href="/changes" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#eef3fb', border: '1px solid rgba(31,95,166,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #1f5fa6' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(31,95,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🔄</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0C447C' }}>{pendingChanges.length} change order{pendingChanges.length !== 1 ? 's' : ''} waiting</div><div style={{ fontSize: 11, color: '#1f5fa6', marginTop: 1 }}>Send to GC for approval</div></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1f5fa6' }}>Send →</div>
            </Link>
          )}

          {flaggedMaterials.length > 0 && (
            <Link href="/materials" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fdf4e3', border: '1px solid rgba(176,110,26,0.2)', borderRadius: 12, textDecoration: 'none', borderLeft: '3px solid #b06e1a' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📦</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>{flaggedMaterials.length} material{flaggedMaterials.length !== 1 ? 's' : ''} flagged</div><div style={{ fontSize: 11, color: '#b06e1a', marginTop: 1 }}>Missing or delayed supplies</div></div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#b06e1a' }}>Check →</div>
            </Link>
          )}
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* ACTIVE JOBS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Active Jobs</div>
            <Link href="/jobs" style={{ fontSize: 12, color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>All jobs →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 12 }}>No active jobs yet</div>
              <Link href="/jobs" style={{ fontSize: 12, fontWeight: 700, color: '#d95f2b', textDecoration: 'none', padding: '7px 16px', background: '#fdf0e8', borderRadius: 8 }}>+ Add first job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeJobs.slice(0, 5).map((job: any) => (
                <Link key={job.id} href="/jobs" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: 'var(--surface-2)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[job.status] || '#9e9d99', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                      {job.client_name && <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{job.client_name}</div>}
                    </div>
                    {job.contract_value && <div style={{ fontSize: 12, fontWeight: 700, color: '#2d7a4f', flexShrink: 0 }}>${Number(job.contract_value).toLocaleString()}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* TODAY STATUS */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: todaySafety ? '✅' : '⚠️', label: 'Safety Check', sub: todaySafety ? 'Done' : 'Not done — complete now', href: '/safety', ok: !!todaySafety },
              { icon: '👷', label: 'Crew Time', sub: todayCrewTime.length > 0 ? `${todayCrewTime.length} workers · ${todayHours}h` : 'No time logged', href: '/crew-time', ok: todayCrewTime.length > 0 },
              { icon: '📋', label: 'Permits', sub: permits.length > 0 ? `${permits.length} active${expiringPermits.length > 0 ? ` · ${expiringPermits.length} expiring` : ''}` : 'None on file', href: '/documents', ok: permits.length > 0 && expiringPermits.length === 0 },
              { icon: '🔍', label: 'Inspections', sub: `${inspections.filter((i: any) => i.status === 'scheduled').length} scheduled${overdueInspections.length > 0 ? ` · ${overdueInspections.length} overdue` : ''}`, href: '/inspections', ok: overdueInspections.length === 0 },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: item.ok ? 'rgba(45,122,79,0.05)' : '#fef9f0', border: `1px solid ${item.ok ? 'rgba(45,122,79,0.1)' : 'rgba(176,110,26,0.15)'}` }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.ok ? '#2d7a4f' : '#b06e1a' }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#d95f2b', fontWeight: 600 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {[
            { href: '/logs', label: 'Daily Log', icon: '📝' },
            { href: '/safety', label: 'Safety', icon: '🦺' },
            { href: '/crew-time', label: 'Log Time', icon: '⏱️' },
            { href: '/changes', label: 'Change Order', icon: '🔄' },
            { href: '/delay-tracker', label: 'Log Delay', icon: '📅' },
            { href: '/invoices', label: 'Invoice', icon: '💵' },
          ].map(action => (
            <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 8px', borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{action.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* PROJECT HEALTH */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Project Health</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Jobs Complete', done: completedJobs, total: jobs.length, color: '#2d7a4f' },
            { label: 'Materials On Track', done: materials.filter((m: any) => ['delivered','installed'].includes(m.status)).length, total: materials.length, color: '#1f5fa6' },
            { label: 'Inspections Passed', done: inspections.filter((i: any) => i.status === 'passed').length, total: inspections.length, color: '#d95f2b' },
          ].map(item => {
            const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0
            return (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{item.done}/{item.total === 0 ? '—' : item.total}</span>
                </div>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 20, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#0f0f0f', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>{toast}</div>}
    </>
  )
}

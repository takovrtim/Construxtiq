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

const HOURS = new Date().getHours()
const GREETING = HOURS < 12 ? 'Good morning' : HOURS < 17 ? 'Good afternoon' : 'Good evening'

const STATUS_COLORS: Record<string, string> = {
  active: '#2d7a4f', in_progress: '#1f5fa6', pending: '#b06e1a',
  completed: '#9e9d99', on_hold: '#b06e1a', cancelled: '#b83232',
}

export function DashboardClient({ user, project, projects, jobs, permits, inspections, changes, crewTime, materials, safetyChecklists }: Props) {
  const [projectName, setProjectName]   = useState('')
  const [projectAddr, setProjectAddr]   = useState('')
  const [projectCity, setProjectCity]   = useState('')
  const [projectState, setProjectState] = useState('NV')
  const [projectBid, setProjectBid]     = useState('')
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState('')

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

  if (!project) return (
    <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 56, height: 56, background: '#d95f2b', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 8 }}>Create your first project</div>
        <div style={{ fontSize: 14, color: '#9e9d99' }}>Everything starts with a project.</div>
      </div>
      <div style={{ background: 'white', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Project Name *</label>
            <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="Smith Residence — Electrical Upgrade" value={projectName} onChange={e => setProjectName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Address</label>
            <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="1234 Desert Blvd" value={projectAddr} onChange={e => setProjectAddr(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>City</label>
              <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="Las Vegas" value={projectCity} onChange={e => setProjectCity(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>State</label>
              <input style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="NV" value={projectState} onChange={e => setProjectState(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9e9d99', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Contract Value ($)</label>
            <input type="number" style={{ width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: '#f8f7f4' }} placeholder="45000" value={projectBid} onChange={e => setProjectBid(e.target.value)} />
          </div>
          <button type="submit" disabled={saving || !projectName.trim()} style={{ padding: '14px', fontSize: 14, fontWeight: 700, borderRadius: 12, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4 }}>
            {saving ? 'Creating...' : 'Create Project →'}
          </button>
        </form>
      </div>
      {toast && <div className="toast toast-success">{toast}</div>}
    </div>
  )

  return (
    <>
      {/* MORNING CARD */}
      <div className="morning-card">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {format(today, 'EEEE, MMMM d')}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 3, color: 'white' }}>
            {GREETING}, {user?.full_name?.split(' ')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 22 }}>
            {project.name}{project.city ? ` · ${project.city}` : ''}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[
              { label: 'Active Jobs', value: activeJobs.length, sub: `${completedJobs} done`, href: '/jobs', alert: false },
              { label: "Today's Crew", value: todayCrewTime.length, sub: `${todayHours}h logged`, href: '/crew-time', alert: false },
              { label: 'Alerts', value: alertCount, sub: 'need attention', href: '/safety', alert: alertCount > 0 },
              { label: 'Contract Value', value: totalRevenue > 0 ? `$${Math.round(totalRevenue/1000)}k` : '$—', sub: 'total', href: '/job-costing', alert: false },
            ].map(s => (
              <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: s.alert ? 'rgba(217,95,43,0.2)' : 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '13px 15px', border: `1px solid ${s.alert ? 'rgba(217,95,43,0.4)' : 'rgba(255,255,255,0.1)'}`, transition: 'background 0.1s' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-1px', color: s.alert ? '#ff8c5a' : 'white', marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {alertCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2 }}>Needs attention today</div>

          {!todaySafety && (
            <Link href="/safety" className="alert-card alert-warning" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🦺</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>No safety checklist today</div><div style={{ fontSize: 11, color: '#b06e1a' }}>Complete before crew starts — required daily</div></div>
              <div style={{ fontSize: 11, color: '#b06e1a', fontWeight: 700 }}>DO IT →</div>
            </Link>
          )}

          {expiringPermits.map(p => {
            const days = differenceInDays(parseISO(p.expiry_date), today)
            return (
              <Link key={p.id} href="/documents" className={`alert-card ${days <= 7 ? 'alert-danger' : 'alert-warning'}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: days <= 7 ? 'rgba(184,50,50,0.12)' : 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📋</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: days <= 7 ? '#6e1a1a' : '#6b4010' }}>Permit expires in {days} day{days !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: days <= 7 ? '#b83232' : '#b06e1a' }}>{p.permit_number} · {format(parseISO(p.expiry_date), 'MMM d, yyyy')}</div></div>
                <div style={{ fontSize: 11, fontWeight: 700, color: days <= 7 ? '#b83232' : '#b06e1a' }}>RENEW →</div>
              </Link>
            )
          })}

          {overdueInspections.map(i => (
            <Link key={i.id} href="/inspections" className="alert-card alert-danger" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(184,50,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🔍</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6e1a1a' }}>Overdue: {i.inspection_type}</div><div style={{ fontSize: 11, color: '#b83232' }}>Was due {format(parseISO(i.scheduled_date), 'MMM d')}</div></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b83232' }}>RESCHEDULE →</div>
            </Link>
          ))}

          {pendingChanges.length > 0 && (
            <Link href="/changes" className="alert-card alert-info" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(31,95,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>🔄</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#0C447C' }}>{pendingChanges.length} change order{pendingChanges.length !== 1 ? 's' : ''} waiting</div><div style={{ fontSize: 11, color: '#1f5fa6' }}>Send to owner for approval</div></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1f5fa6' }}>SEND →</div>
            </Link>
          )}

          {flaggedMaterials.length > 0 && (
            <Link href="/materials" className="alert-card alert-warning" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(176,110,26,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>📦</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 700, color: '#6b4010' }}>{flaggedMaterials.length} material{flaggedMaterials.length !== 1 ? 's' : ''} flagged</div><div style={{ fontSize: 11, color: '#b06e1a' }}>Missing or delayed supplies</div></div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#b06e1a' }}>CHECK →</div>
            </Link>
          )}
        </div>
      )}

      {/* MAIN GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* ACTIVE JOBS */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Active Jobs</div>
            <Link href="/jobs" style={{ fontSize: 12, color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>All jobs →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏗️</div>
              <div style={{ fontSize: 13, color: '#9e9d99', marginBottom: 12 }}>No active jobs yet</div>
              <Link href="/jobs" style={{ fontSize: 12, fontWeight: 700, color: '#d95f2b', textDecoration: 'none', padding: '7px 16px', background: '#fdf0e8', borderRadius: 8 }}>+ Add first job</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {activeJobs.slice(0, 5).map(job => (
                <Link key={job.id} href="/jobs" style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 10, background: '#f8f7f4', cursor: 'pointer' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[job.status] || '#9e9d99', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0f0f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                      {job.client_name && <div style={{ fontSize: 11, color: '#9e9d99' }}>{job.client_name}</div>}
                    </div>
                    {job.contract_value && <div style={{ fontSize: 12, fontWeight: 700, color: '#2d7a4f', flexShrink: 0 }}>${Number(job.contract_value).toLocaleString()}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* TODAY */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Today's Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: todaySafety ? '✅' : '⚠️', label: 'Safety Check', sub: todaySafety ? `Done by ${todaySafety.completed_by}` : 'Not done — do it now', href: '/safety', ok: !!todaySafety },
              { icon: '👷', label: 'Crew Time', sub: todayCrewTime.length > 0 ? `${todayCrewTime.length} workers · ${todayHours}h` : 'No time logged', href: '/crew-time', ok: todayCrewTime.length > 0 },
              { icon: '📋', label: 'Permits', sub: permits.length > 0 ? `${permits.length} active${expiringPermits.length > 0 ? ` · ${expiringPermits.length} expiring` : ''}` : 'None on file', href: '/documents', ok: permits.length > 0 && expiringPermits.length === 0 },
              { icon: '🔍', label: 'Inspections', sub: `${inspections.filter(i => i.status === 'scheduled').length} scheduled${overdueInspections.length > 0 ? ` · ${overdueInspections.length} overdue` : ''}`, href: '/inspections', ok: overdueInspections.length === 0 },
            ].map(item => (
              <Link key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: item.ok ? 'rgba(45,122,79,0.05)' : '#fef9f0', border: `1px solid ${item.ok ? 'rgba(45,122,79,0.1)' : 'rgba(176,110,26,0.15)'}` }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f0f0f' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: item.ok ? '#2d7a4f' : '#b06e1a' }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#d95f2b', fontWeight: 600 }}>→</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { href: '/logs', label: 'Daily Log', icon: '📝', sub: "Log today's work" },
              { href: '/safety', label: 'Safety Check', icon: '🦺', sub: 'Pre-job checklist' },
              { href: '/crew-time', label: 'Log Time', icon: '⏱️', sub: 'Clock in crew' },
              { href: '/changes', label: 'Change Order', icon: '🔄', sub: 'Document changes' },
              { href: '/materials', label: 'Materials', icon: '📦', sub: 'Track supplies' },
              { href: '/invoices', label: 'Invoice', icon: '💵', sub: 'Bill the client' },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '11px 13px', borderRadius: 11, background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}>
                  <div style={{ fontSize: 19, marginBottom: 5 }}>{action.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f0f0f', marginBottom: 1 }}>{action.label}</div>
                  <div style={{ fontSize: 11, color: '#9e9d99' }}>{action.sub}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* PROJECT HEALTH */}
        <div style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Project Health</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Jobs Complete', done: completedJobs, total: jobs.length, color: '#2d7a4f' },
              { label: 'Materials On Track', done: materials.filter(m => ['delivered','installed'].includes(m.status)).length, total: materials.length, color: '#1f5fa6' },
              { label: 'Inspections Passed', done: inspections.filter(i => i.status === 'passed').length, total: inspections.length, color: '#d95f2b' },
            ].map(item => {
              const pct = item.total > 0 ? Math.round((item.done / item.total) * 100) : 0
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#9e9d99' }}>{item.done}/{item.total === 0 ? '—' : item.total}</span>
                  </div>
                  <div style={{ height: 5, background: '#f1ede6', borderRadius: 20, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: 20, transition: 'width 0.6s' }} />
                  </div>
                </div>
              )
            })}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <div style={{ background: '#f8f7f4', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Open Changes</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{pendingChanges.length}</div>
              </div>
              <div style={{ background: flaggedMaterials.length > 0 ? '#fdf0f0' : '#f8f7f4', borderRadius: 10, padding: '11px 13px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#9e9d99', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Flagged</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: flaggedMaterials.length > 0 ? '#b83232' : '#0f0f0f' }}>{flaggedMaterials.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {projects.length > 1 && (
        <div style={{ marginTop: 16, background: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Other Projects</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {projects.filter(p => p.id !== project.id).map(p => (
              <div key={p.id} style={{ padding: '11px 13px', borderRadius: 11, background: '#f8f7f4', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#9e9d99' }}>{[p.city, p.state].filter(Boolean).join(', ') || 'No location'}</div>
              </div>
            ))}
            <Link href="/dashboard?new=1" style={{ textDecoration: 'none', padding: '11px 13px', borderRadius: 11, background: 'transparent', border: '1.5px dashed rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#d95f2b', cursor: 'pointer' }}>
              + New Project
            </Link>
          </div>
        </div>
      )}

      {toast && <div className="toast toast-success">{toast}</div>}
    </>
  )
}
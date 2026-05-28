'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Props {
  user: any
  project: any
  projects: any[]
  stats: {
    delayDays: number
    gcDelayDays: number
    openRFIs: number
    overdueRFIs: number
    pendingChanges: number
    pendingChangeValue: number
    logsThisWeek: number
    safetyThisWeek: number
    expiringPermits: any[]
    recentDelays: any[]
    recentChanges: any[]
  }
}

function ProtectionScore({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Strong' : score >= 50 ? 'Building' : 'Vulnerable'
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 20px' }}>
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 14 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-1px', lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 4 }}>{label} Protection</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Your legal case file strength</div>
    </div>
  )
}

export function DashboardClient({ user, project, projects, stats }: Props) {
  const [greeting, setGreeting] = useState('Good morning')
  const [activeProject, setActiveProject] = useState(project)
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening')
  }, [])

  function msg(t: string) { setToast(t); setTimeout(() => setToast(''), 3000) }

  // Calculate protection score
  const score = Math.max(0, Math.min(100, (() => {
    let s = 40
    if (stats.logsThisWeek >= 5) s += 20
    else if (stats.logsThisWeek >= 3) s += 10
    if (stats.overdueRFIs === 0) s += 10
    if (stats.expiringPermits.length === 0) s += 15
    if (stats.pendingChanges > 0) s += 10
    if (stats.safetyThisWeek >= 5) s += 5
    return s
  })()))

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  const ALERTS = [
    ...stats.overdueRFIs > 0 ? [{
      type: 'danger' as const,
      title: `${stats.overdueRFIs} RFI${stats.overdueRFIs > 1 ? 's' : ''} past GC deadline`,
      sub: 'Every day without response is documented delay you can claim',
      href: '/RFI', cta: 'View RFIs',
    }] : [],
    ...stats.expiringPermits.map((p: any) => {
      const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000)
      return { type: 'warning' as const, title: `Permit expires in ${days} day${days !== 1 ? 's' : ''}`, sub: `${p.permit_number} -- renew before expiry to avoid a stop-work order`, href: '/documents', cta: 'View Permit' }
    }),
    ...stats.pendingChanges > 0 ? [{
      type: 'info' as const,
      title: `${stats.pendingChanges} change order${stats.pendingChanges > 1 ? 's' : ''} awaiting GC approval`,
      sub: `${stats.pendingChangeValue > 0 ? `$${stats.pendingChangeValue.toLocaleString()} ` : ''}pending written authorization`,
      href: '/changes', cta: 'Send Approval',
    }] : [],
  ]

  const ALERT_COLORS = {
    danger:  { border: '#ef4444', bg: 'rgba(239,68,68,0.06)',  text: '#ef4444',  dim: 'rgba(239,68,68,0.7)' },
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.06)', text: '#f59e0b',  dim: 'rgba(245,158,11,0.7)' },
    info:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.06)', text: '#3b82f6',  dim: 'rgba(59,130,246,0.7)' },
  }

  const QUICK_LINKS = [
    { label: 'Log a Delay', sub: 'GC caused it. Document it now.', href: '/delay-tracker', color: '#ef4444' },
    { label: 'New Change Order', sub: 'Scope changed. Get approval.', href: '/changes', color: '#ea580c' },
    { label: 'Submit RFI', sub: 'Question on record. Clock starts.', href: '/RFI', color: '#3b82f6' },
    { label: 'Daily Log', sub: '60 seconds. Legally timestamped.', href: '/daily-log', color: '#22c55e' },
    { label: 'Scan Document', sub: 'AI reads permits instantly.', href: '/documents', color: '#8b5cf6' },
    { label: 'Audit Export', sub: 'Full case file. One click.', href: '/reports', color: '#7B8497' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: 'white', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap'); * { box-sizing: border-box; } @keyframes slide-in { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* ── HEADER ──────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{greeting},</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', marginBottom: 4 }}>{firstName}</h1>
            {project && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{project.name} {project.gc_name ? `-- ${project.gc_name}` : ''}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/reports" style={{ padding: '10px 18px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', background: 'rgba(255,255,255,0.04)' }}>
              Audit Export
            </Link>
            <Link href="/daily-log" style={{ padding: '10px 20px', fontSize: 13, fontWeight: 700, borderRadius: 10, background: '#ea580c', color: 'white', textDecoration: 'none' }}>
              + Daily Log
            </Link>
          </div>
        </div>

        {/* ── NO PROJECT STATE ────────────────────────────── */}
        {!project && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.08)', borderRadius: 20, marginBottom: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No project yet</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 24 }}>Create your first project to start building your legal case file.</div>
            <Link href="/projects" style={{ display: 'inline-block', padding: '12px 28px', fontSize: 14, fontWeight: 700, borderRadius: 11, background: '#ea580c', color: 'white', textDecoration: 'none' }}>Create First Project</Link>
          </div>
        )}

        {/* ── ALERTS ──────────────────────────────────────── */}
        {ALERTS.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {ALERTS.map((a, i) => {
              const c = ALERT_COLORS[a.type]
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: c.bg, border: `1px solid ${c.border}30`, borderLeft: `3px solid ${c.border}`, borderRadius: 12, animation: 'slide-in 0.3s ease', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: c.dim }}>{a.sub}</div>
                  </div>
                  <Link href={a.href} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, background: c.border, color: 'white', textDecoration: 'none', flexShrink: 0 }}>{a.cta}</Link>
                </div>
              )
            })}
          </div>
        )}

        {/* ── MAIN GRID ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 20, marginBottom: 24 }}>

          {/* LEFT — Stats + Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Week Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { label: 'Delay Days', value: stats.delayDays, sub: `${stats.gcDelayDays}d GC-caused`, alert: stats.delayDays > 0 },
                { label: 'Open RFIs', value: stats.openRFIs, sub: stats.overdueRFIs > 0 ? `${stats.overdueRFIs} overdue` : 'All on time', alert: stats.overdueRFIs > 0 },
                { label: 'Pending COs', value: stats.pendingChanges, sub: stats.pendingChangeValue > 0 ? `$${stats.pendingChangeValue.toLocaleString()} pending` : 'None pending', alert: false },
                { label: 'Logs This Week', value: stats.logsThisWeek, sub: stats.logsThisWeek >= 5 ? 'On track' : `${5 - stats.logsThisWeek} more needed`, alert: stats.logsThisWeek < 3 },
              ].map(s => (
                <div key={s.label} style={{ background: '#131A26', border: `1px solid ${s.alert ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: '18px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.alert ? '#ef4444' : '#ea580c', letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: s.alert ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {QUICK_LINKS.map((q, i) => (
                  <Link key={i} href={q.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: q.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2 }}>{q.label}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{q.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recent Delays</div>
                <Link href="/delay-tracker" style={{ fontSize: 12, color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>View all</Link>
              </div>
              {stats.recentDelays.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', marginBottom: 12 }}>No delays logged yet</div>
                  <Link href="/delay-tracker" style={{ fontSize: 12, color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>Log first delay</Link>
                </div>
              ) : stats.recentDelays.map((d: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < stats.recentDelays.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: d.caused_by === 'gc' ? '#ef4444' : '#6b7280', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description || 'Delay logged'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{d.caused_by === 'gc' ? 'GC Caused' : d.caused_by} -- {d.days_lost || 0}d lost</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>+{d.days_lost || 0}d</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Protection Score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16 }}>
              <div style={{ padding: '16px 18px 0', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Case File Strength</div>
              <ProtectionScore score={score} />
              <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Daily logs', ok: stats.logsThisWeek >= 5, val: `${stats.logsThisWeek}/5 this week` },
                  { label: 'No overdue RFIs', ok: stats.overdueRFIs === 0, val: stats.overdueRFIs === 0 ? 'All on time' : `${stats.overdueRFIs} overdue` },
                  { label: 'Permits valid', ok: stats.expiringPermits.length === 0, val: stats.expiringPermits.length === 0 ? 'No alerts' : `${stats.expiringPermits.length} expiring` },
                  { label: 'COs documented', ok: stats.pendingChanges > 0 || true, val: `${stats.pendingChanges} pending` },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: item.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.ok ? '#22c55e' : '#ef4444' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? '#22c55e' : '#ef4444' }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tip card */}
            <div style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)', borderRadius: 16, padding: '18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Today's Action</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
                {stats.overdueRFIs > 0
                  ? `You have ${stats.overdueRFIs} overdue RFI${stats.overdueRFIs > 1 ? 's' : ''}. Every day past deadline is documented delay. Follow up with your GC in writing now.`
                  : stats.logsThisWeek < 5
                    ? `Log today's work now. ${5 - stats.logsThisWeek} more log${5 - stats.logsThisWeek > 1 ? 's' : ''} this week builds a full legal record.`
                    : 'Your case file is building strong. Keep logging daily. The more consistent the record, the harder it is to dispute.'}
              </div>
              <Link href={stats.overdueRFIs > 0 ? '/RFI' : '/daily-log'} style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
                Take action now
              </Link>
            </div>

            {/* Recent changes */}
            {stats.recentChanges.length > 0 && (
              <div style={{ background: '#131A26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Recent Change Orders</div>
                {stats.recentChanges.slice(0, 3).map((c: any, i: number) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{c.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: c.status === 'approved' ? '#22c55e' : c.status === 'pending' ? '#f59e0b' : 'rgba(255,255,255,0.3)' }}>{c.status}</span>
                      {c.cost_impact > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>${Number(c.cost_impact).toLocaleString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#131A26', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

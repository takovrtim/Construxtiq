='use client'

import { useEffect, useState } from 'react'

const ALERTS = [
  { icon: '📋', title: 'Permit expires in 3 days', sub: 'PLM-2024-891 · Renew now', border: '#FFD9C4', bg: '#FFF4EE', accent: '#E8520A' },
  { icon: '🔄', title: '2 change orders pending', sub: 'Send to owner for approval', border: '#dce8fb', bg: '#eef3fb', accent: '#1f5fa6' },
  { icon: '🦺', title: 'No safety check today', sub: 'Complete before crew starts', border: '#e8e3da', bg: '#f6f4f1', accent: '#666' },
  { icon: '💵', title: 'Invoice overdue — $8,400', sub: 'Smith Residence · 12 days past due', border: '#FFD9C4', bg: '#FFF4EE', accent: '#E8520A' },
]

const JOBS = [
  { name: 'Smith Residence — Panel Upgrade', client: 'Mike Smith', value: '$8,400', dot: '#2d7a4f' },
  { name: 'Lakeview Plumbing Retrofit', client: 'Sarah K.', value: '$12,200', dot: '#1f5fa6' },
  { name: 'Desert Ridge Commercial', client: 'ABC Corp', value: '$34,000', dot: '#E8520A' },
]

const STATS = [
  { label: 'Active Jobs', value: '3' },
  { label: "Today's Crew", value: '5' },
  { label: 'Alerts', value: '2', alert: true },
  { label: 'Revenue', value: '$54k' },
]

const NAV = [
  { group: 'Operations', items: ['Dashboard', 'Job Board', 'Timeline'], activeGroup: true },
  { group: 'Field', items: ['Safety', 'Crew Time', 'Materials'], activeGroup: false },
  { group: 'Money', items: ['Invoices', 'Changes'], activeGroup: false },
]

export function DashboardDemo() {
  const [alertIdx, setAlertIdx]     = useState(0)
  const [visibleJobs, setVisibleJobs] = useState(0)

  useEffect(() => {
    const a = setInterval(() => setAlertIdx(i => (i + 1) % ALERTS.length), 2600)
    const j = setInterval(() => setVisibleJobs(v => Math.min(v + 1, JOBS.length)), 500)
    return () => { clearInterval(a); clearInterval(j) }
  }, [])

  const alert = ALERTS[alertIdx]

  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      background: '#fdfcfb',
      border: '1.5px solid #e8e3da',
      borderRadius: 18,
      overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.1), 0 0 0 1px #ede9e4',
      userSelect: 'none',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>

      {/* Browser chrome */}
      <div style={{ background: '#f6f4f1', borderBottom: '1px solid #ede9e4', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#ede9e4', borderRadius: 6, padding: '3px 16px', fontSize: 11, color: '#999', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d7a4f' }} />
            construxtiq.app/dashboard
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#bbb', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#E8520A', animation: 'blink 1.8s infinite' }} />
          Live
        </div>
      </div>

      {/* App layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', minHeight: 460 }}>

        {/* Sidebar */}
        <div style={{ background: '#fdfcfb', borderRight: '1px solid #ede9e4', padding: '16px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px 16px' }}>
            <div style={{ width: 22, height: 22, background: '#E8520A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.3px', color: '#0a0a0a' }}>ConstructIQ</span>
          </div>

          {NAV.map(({ group, items, activeGroup }) => (
            <div key={group}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 10px 5px' }}>{group}</div>
              {items.map((item, idx) => {
                const active = activeGroup && idx === 0
                return (
                  <div key={item} style={{ padding: '7px 10px', borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 400, color: active ? '#E8520A' : '#aaa', background: active ? '#FFF4EE' : 'transparent', marginBottom: 1 }}>
                    {item}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ padding: '20px 22px', background: '#f6f4f1', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Morning card */}
          <div style={{ background: '#0a0a0a', borderRadius: 14, padding: '18px 22px', color: 'white', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: -32, right: -32, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,82,10,0.15)', pointerEvents: 'none' }} />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              Thursday, May 8 · Las Vegas
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, letterSpacing: '-0.3px' }}>Good morning, John 👋</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 11px' }}>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>{s.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px', color: s.alert ? '#E8520A' : 'white' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated alert */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Needs attention</div>
            <div
              key={alertIdx}
              style={{
                background: '#fdfcfb',
                border: `1.5px solid ${alert.border}`,
                borderRadius: 12,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'slideUp 0.3s ease',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 9, background: alert.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {alert.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a', marginBottom: 2 }}>{alert.title}</div>
                <div style={{ fontSize: 10, color: alert.accent }}>{alert.sub}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: alert.accent, flexShrink: 0 }}>→</div>
            </div>
          </div>

          {/* Jobs staggering in */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Active jobs</div>
              <div style={{ fontSize: 10, color: '#E8520A', fontWeight: 600 }}>View all →</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {JOBS.slice(0, visibleJobs).map((job) => (
                <div
                  key={job.name}
                  style={{
                    background: '#fdfcfb',
                    border: '1px solid #ede9e4',
                    borderRadius: 10,
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'fadeIn 0.3s ease',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: job.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#0a0a0a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</div>
                    <div style={{ fontSize: 9, color: '#bbb', marginTop: 1 }}>{job.client}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', flexShrink: 0 }}>{job.value}</div>
                </div>
              ))}
              {visibleJobs < JOBS.length && (
                <div style={{ height: 36, background: '#ede9e4', borderRadius: 10, animation: 'shimmer 1.2s infinite' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'

const ALERTS = [
  { icon: '📋', title: 'Permit expires in 3 days', sub: 'PLM-2024-891 · Renew now', color: '#FFD9C4', bg: '#FFF4EE', accent: '#E8520A' },
  { icon: '🦺', title: 'No safety check today', sub: 'Complete before crew starts', color: '#f0f0f0', bg: '#fafafa', accent: '#999' },
  { icon: '🔄', title: '2 change orders pending', sub: 'Send to owner for approval', color: '#dce8fb', bg: '#eef3fb', accent: '#1f5fa6' },
]

const JOBS = [
  { name: 'Smith Residence — Panel Upgrade', client: 'Mike Smith', value: '$8,400', status: '#2d7a4f' },
  { name: 'Lakeview Plumbing Retrofit', client: 'Sarah K.', value: '$12,200', status: '#1f5fa6' },
  { name: 'Desert Ridge Commercial', client: 'ABC Corp', value: '$34,000', status: '#d95f2b' },
]

const STATS = [
  { label: 'Active Jobs', value: '3' },
  { label: "Today's Crew", value: '5' },
  { label: 'Alerts', value: '2', accent: true },
  { label: 'Revenue', value: '$54k' },
]

export function DashboardDemo() {
  const [activeAlert, setActiveAlert] = useState(0)
  const [visibleJobs, setVisibleJobs] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // Cycle alerts
    const alertTimer = setInterval(() => {
      setActiveAlert(a => (a + 1) % ALERTS.length)
    }, 2800)

    // Stagger jobs appearing
    const jobTimer = setInterval(() => {
      setVisibleJobs(v => Math.min(v + 1, JOBS.length))
    }, 600)

    // General tick for animations
    const tickTimer = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(alertTimer)
      clearInterval(jobTimer)
      clearInterval(tickTimer)
    }
  }, [])

  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid #e8e8e8',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.1)',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
      userSelect: 'none',
    }}>
      {/* Browser bar */}
      <div style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#f0f0f0', borderRadius: 6, padding: '3px 16px', fontSize: 11, color: '#999' }}>construxtiq.app/dashboard</div>
        </div>
      </div>

      {/* App layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', minHeight: 440 }}>
        {/* Sidebar */}
        <div style={{ background: '#fff', borderRight: '1px solid #f0f0f0', padding: '14px 6px' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 10px 6px' }}>Operations</div>
          {['Dashboard', 'Job Board', 'Timeline'].map((l, i) => (
            <div key={l} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, fontWeight: i === 0 ? 700 : 400, color: i === 0 ? '#E8520A' : '#999', background: i === 0 ? '#FFF4EE' : 'transparent', marginBottom: 1 }}>{l}</div>
          ))}
          <div style={{ fontSize: 8, fontWeight: 700, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 10px 6px' }}>Field</div>
          {['Safety', 'Crew Time', 'Materials'].map(l => (
            <div key={l} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, color: '#bbb', marginBottom: 1 }}>{l}</div>
          ))}
          <div style={{ fontSize: 8, fontWeight: 700, color: '#ccc', letterSpacing: '1px', textTransform: 'uppercase', padding: '10px 10px 6px' }}>Money</div>
          {['Job Costing', 'Invoices', 'Changes'].map(l => (
            <div key={l} style={{ padding: '7px 10px', borderRadius: 7, fontSize: 11, color: '#bbb', marginBottom: 1 }}>{l}</div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ padding: '20px 22px', background: '#f9f9f9' }}>

          {/* Morning card */}
          <div style={{ background: '#0a0a0a', borderRadius: 14, padding: '18px 22px', marginBottom: 14, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,82,10,0.12)' }} />
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Thursday, May 8 · Las Vegas</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Good morning, John 👋</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {STATS.map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 9, padding: '9px 11px' }}>
                  <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.accent ? '#E8520A' : 'white' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animated alert */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Needs attention</div>
            <div
              key={activeAlert}
              style={{
                background: '#fff',
                border: `1.5px solid ${ALERTS[activeAlert].color}`,
                borderRadius: 11,
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'slideIn 0.35s ease',
              }}
            >
              <style>{`
                @keyframes slideIn {
                  from { opacity: 0; transform: translateY(6px); }
                  to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes blink {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.4; }
                }
              `}</style>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: ALERTS[activeAlert].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{ALERTS[activeAlert].icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0a0a0a' }}>{ALERTS[activeAlert].title}</div>
                <div style={{ fontSize: 10, color: ALERTS[activeAlert].accent, marginTop: 1 }}>{ALERTS[activeAlert].sub}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: ALERTS[activeAlert].accent }}>→</div>
            </div>
          </div>

          {/* Jobs list — staggered reveal */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Active jobs</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {JOBS.slice(0, visibleJobs).map((job, i) => (
                <div
                  key={job.name}
                  style={{
                    background: '#fff',
                    border: '1px solid #f0f0f0',
                    borderRadius: 10,
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    animation: 'slideIn 0.3s ease',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: job.status, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.name}</div>
                    <div style={{ fontSize: 9, color: '#bbb', marginTop: 1 }}>{job.client}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#2d7a4f', flexShrink: 0 }}>{job.value}</div>
                </div>
              ))}
              {visibleJobs < JOBS.length && (
                <div style={{ height: 36, background: '#f5f5f5', borderRadius: 10, animation: 'blink 1s infinite' }} />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom label */}
      <div style={{ background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: '#bbb' }}>Live data — updates in real time</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#E8520A', fontWeight: 600 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E8520A', animation: 'blink 1.5s infinite' }} />
          Live
        </div>
      </div>
    </div>
  )
}

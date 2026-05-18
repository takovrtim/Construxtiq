'use client'

import { useState, useEffect, useRef } from 'react'

function ChangeOrderDemo({ playing }: { playing: boolean }) {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const fullText = 'Panel location moved from column B-4 to B-6. Turner called at 2pm.'

  useEffect(() => {
    if (!playing) { setStep(0); setTyped(''); return }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 400))
    timers.push(setTimeout(() => setStep(2), 1200))
    for (let i = 0; i <= fullText.length; i++) {
      timers.push(setTimeout(() => setTyped(fullText.slice(0, i)), 1400 + i * 28))
    }
    timers.push(setTimeout(() => setStep(3), 3200))
    timers.push(setTimeout(() => setStep(4), 4400))
    timers.push(setTimeout(() => setStep(5), 5600))
    return () => timers.forEach(clearTimeout)
  }, [playing])

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f3f4f6' }}>
      <div style={{ background: '#000', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 18, height: 18, background: '#ea580c', borderRadius: 4 }} />
          <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>SubIQ</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: 11 }}>Hardrock Hotel — Electrical</span>
      </div>
      <div style={{ background: 'white', borderRadius: 12, padding: 16, flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0a0a0a', marginBottom: 12 }}>New Change Order</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Title</div>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 1 ? '#ea580c' : '#e5e7eb'}`, borderRadius: 8, fontSize: 12, color: '#111', background: step >= 1 ? '#fff7ed' : '#f9fafb', transition: 'all 0.3s' }}>
            Panel Location Change — Turner Directive
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Description</div>
          <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 2 ? '#ea580c' : '#e5e7eb'}`, borderRadius: 8, fontSize: 11, color: '#374151', background: '#f9fafb', minHeight: 40, lineHeight: 1.5 }}>
            {typed}{step >= 2 && typed.length < fullText.length && <span style={{ borderRight: '2px solid #ea580c' }}>&nbsp;</span>}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Cost Impact</div>
            <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 3 ? '#22c55e' : '#e5e7eb'}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#16a34a', background: step >= 3 ? '#f0fdf4' : '#f9fafb', transition: 'all 0.3s' }}>
              {step >= 3 ? '+$8,400' : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Schedule Impact</div>
            <div style={{ padding: '8px 10px', border: `1.5px solid ${step >= 3 ? '#ef4444' : '#e5e7eb'}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#dc2626', background: step >= 3 ? '#fef2f2' : '#f9fafb', transition: 'all 0.3s' }}>
              {step >= 3 ? '+2 days' : '—'}
            </div>
          </div>
        </div>
        <div style={{ opacity: step >= 4 ? 1 : 0.4, transition: 'opacity 0.4s' }}>
          <div style={{ background: '#ea580c', borderRadius: 9, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>
            Send GC Approval Link
          </div>
        </div>
        {step >= 5 && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>Approval link sent to Turner Construction</div>
              <div style={{ fontSize: 11, color: '#16a34a' }}>Timestamped — legally binding when approved</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PermitScanDemo({ playing }: { playing: boolean }) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!playing) { setStep(0); setProgress(0); return }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 300))
    for (let i = 0; i <= 100; i += 2) {
      timers.push(setTimeout(() => setProgress(i), 600 + i * 20))
    }
    timers.push(setTimeout(() => setStep(2), 2800))
    timers.push(setTimeout(() => setStep(3), 3600))
    return () => timers.forEach(clearTimeout)
  }, [playing])

  const items = [
    { label: 'Permit Number', value: 'CCBD-E-2024-08471', color: '#111' },
    { label: 'Type', value: 'Electrical — Commercial', color: '#111' },
    { label: 'Expiry Date', value: 'Jun 15, 2025 — 42 days left', color: '#ea580c' },
    { label: 'Inspector', value: 'James Rodriguez — (702) 555-0182', color: '#111' },
    { label: 'Special Conditions', value: '3 conditions found', color: '#dc2626' },
  ]

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f3f4f6' }}>
      <div style={{ background: '#000', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 18, height: 18, background: '#ea580c', borderRadius: 4 }} />
        <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>SubIQ</span>
        <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Document Intelligence</span>
      </div>
      <div style={{ background: 'white', borderRadius: 12, padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ border: `2px dashed ${step >= 1 ? '#ea580c' : '#e5e7eb'}`, borderRadius: 10, padding: '14px', textAlign: 'center', background: step >= 1 ? '#fff7ed' : '#f9fafb', transition: 'all 0.3s' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{step >= 1 ? '📋' : '📁'}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: step >= 1 ? '#ea580c' : '#6b7280' }}>
            {step === 0 ? 'Drop permit PDF here' : step === 1 ? 'CCBD-E-2024-08471.pdf' : 'Clark County Electrical Permit'}
          </div>
        </div>
        {step >= 1 && step < 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 14, height: 14, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af' }}>AI reading permit...</span>
            </div>
            <div style={{ height: 4, background: '#e5e7eb', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', borderRadius: 20, transition: 'width 0.1s' }} />
            </div>
          </div>
        )}
        {step >= 2 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Extracted by AI</div>
            {items.slice(0, step >= 3 ? 5 : 3).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
                <span style={{ color: '#9ca3af' }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.color, textAlign: 'right', maxWidth: '60%' }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
        {step >= 3 && (
          <div style={{ padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderLeft: '3px solid #ea580c', borderRadius: 9, fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            Action: Renew by May 31 — contact Rodriguez at (702) 555-0182
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function DelayReportDemo({ playing }: { playing: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!playing) { setStep(0); return }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setStep(1), 400))
    timers.push(setTimeout(() => setStep(2), 1000))
    timers.push(setTimeout(() => setStep(3), 1600))
    timers.push(setTimeout(() => setStep(4), 2400))
    timers.push(setTimeout(() => setStep(5), 3600))
    return () => timers.forEach(clearTimeout)
  }, [playing])

  const delays = [
    { date: 'Apr 2',  cause: 'GC',      days: 2, desc: 'Inspector no-show — Turner failed to schedule' },
    { date: 'Apr 8',  cause: 'GC',      days: 3, desc: 'Material delivery pushed — GC supply issue' },
    { date: 'Apr 14', cause: 'Weather', days: 1, desc: 'Rain — outdoor conduit work halted' },
    { date: 'Apr 19', cause: 'GC',      days: 2, desc: 'Panel drawing revision — scope change' },
  ]

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', padding: 20, height: '100%', display: 'flex', flexDirection: 'column', gap: 12, background: '#f3f4f6' }}>
      <div style={{ background: '#000', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 18, height: 18, background: '#ea580c', borderRadius: 4 }} />
        <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>SubIQ</span>
        <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Delay Tracker</span>
      </div>
      <div style={{ background: 'white', borderRadius: 12, padding: 16, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Total Days', value: '8d',  color: '#374151' },
            { label: 'GC Caused', value: '7d',  color: '#dc2626' },
            { label: 'GC Delays', value: '3',   color: '#dc2626' },
          ].map((s, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px', textAlign: 'center', opacity: step >= 1 ? 1 : 0, transition: `opacity 0.4s ${i * 0.1}s` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {delays.slice(0, step >= 2 ? 4 : 0).map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#f9fafb', borderRadius: 8, borderLeft: `3px solid ${d.cause === 'GC' ? '#ef4444' : '#9ca3af'}` }}>
              <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, width: 30 }}>{d.date}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: d.cause === 'GC' ? '#fef2f2' : '#f3f4f6', color: d.cause === 'GC' ? '#dc2626' : '#6b7280', flexShrink: 0 }}>{d.cause}</span>
              <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.desc}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', flexShrink: 0 }}>+{d.days}d</span>
            </div>
          ))}
        </div>
        {step >= 3 && (
          <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderLeft: '3px solid #ef4444', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#991b1b', marginBottom: 10 }}>
            Turner Construction caused 7 of 8 delay days
          </div>
        )}
        {step >= 4 && (
          <div style={{ background: '#0a0a0a', borderRadius: 9, padding: '10px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>
            Export PDF Report
          </div>
        )}
        {step >= 5 && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, fontSize: 11, fontWeight: 600, color: '#166534' }}>
            Delay-Report-Hardrock-2025-04.html downloaded
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoConfig {
  id: string; title: string; sub: string; duration: string
  Component: React.ComponentType<{ playing: boolean }>
}

const VIDEOS: VideoConfig[] = [
  { id: 'change-order', title: 'Change Order + GC Approval', sub: 'Log scope change and send Turner an approval link in 30 seconds', duration: '0:06', Component: ChangeOrderDemo },
  { id: 'permit-scan',  title: 'AI Permit Scanner',          sub: 'Upload a Clark County permit — AI reads every detail instantly',  duration: '0:04', Component: PermitScanDemo  },
  { id: 'delay-report', title: 'Delay Tracker + Export',     sub: 'Document GC delays and generate a dispute-ready PDF report',      duration: '0:05', Component: DelayReportDemo },
]

interface Props { autoPlay?: boolean; defaultVideo?: string; height?: number; hideTabs?: boolean }

export function MockVideoPlayer({ autoPlay = false, defaultVideo = 'change-order', height = 420, hideTabs = false }: Props) {
  const [activeId, setActiveId] = useState(defaultVideo)
  const [playing, setPlaying]   = useState(autoPlay)
  const [loopKey, setLoopKey]   = useState(0)
  const intervalRef              = useRef<ReturnType<typeof setTimeout> | null>(null)

  const active = VIDEOS.find(v => v.id === activeId) || VIDEOS[0]

  function play() {
    setPlaying(false)
    setTimeout(() => { setPlaying(true); setLoopKey(k => k + 1) }, 50)
  }

  function switchVideo(id: string) {
    setPlaying(false)
    setActiveId(id)
    setTimeout(() => { setPlaying(true); setLoopKey(k => k + 1) }, 100)
  }

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      setPlaying(false)
      setTimeout(() => { setPlaying(true); setLoopKey(k => k + 1) }, 200)
    }, 7000)
    return () => clearTimeout(timer)
  }, [playing, loopKey])

  return (
    <div style={{ fontFamily: '-apple-system,sans-serif', width: '100%' }}>
      {/* Tabs */}
      {!hideTabs && <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {VIDEOS.map(v => (
          <button key={v.id} onClick={() => switchVideo(v.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20, fontFamily: 'inherit', fontSize: 12,
            border: `1.5px solid ${activeId === v.id ? '#ea580c' : '#e5e7eb'}`,
            background: activeId === v.id ? '#fff7ed' : 'white',
            cursor: 'pointer', fontWeight: activeId === v.id ? 700 : 500,
            color: activeId === v.id ? '#ea580c' : '#6b7280', transition: 'all 0.15s',
          }}>
            {v.id === 'change-order' ? '📝' : v.id === 'permit-scan' ? '🤖' : '📅'} {v.title}
          </button>
        ))}
      </div>

      {/* Player */}
      <div style={{ background: '#0a0a0a', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Browser chrome */}
        <div style={{ background: '#1a1a1a', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div style={{ flex: 1, background: '#2a2a2a', borderRadius: 6, padding: '4px 12px', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
            app.subiq.co
          </div>
        </div>

        {/* Screen */}
        <div style={{ height, position: 'relative', overflow: 'hidden', background: '#f3f4f6' }}>
          {!playing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(2px)' }}>
              <button onClick={play} style={{ width: 72, height: 72, borderRadius: '50%', background: '#ea580c', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(234,88,12,0.5)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 6 }}>{active.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', maxWidth: 320 }}>{active.sub}</div>
            </div>
          )}
          <active.Component key={`${activeId}-${loopKey}`} playing={playing} />
        </div>

        {/* Controls */}
        <div style={{ background: '#111', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={playing ? () => setPlaying(false) : play}
            style={{ border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: '#ea580c', flexShrink: 0 }}
          >
            {playing
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              : <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            }
          </button>
          <button onClick={play} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>
          </button>
          <div style={{ flex: 1, height: 3, background: '#2a2a2a', borderRadius: 20 }}>
            <div style={{ height: '100%', background: '#ea580c', borderRadius: 20, width: playing ? '100%' : '0%', transition: playing ? 'width 7s linear' : 'none' }} />
          </div>
          <span style={{ fontSize: 11, color: '#6b7280', flexShrink: 0 }}>{active.duration}</span>
        </div>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>{active.sub}</div>
    </div>
  )
}

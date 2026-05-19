'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    const fade = setTimeout(() => setFading(true), 900)
    const hide = setTimeout(() => setVisible(false), 1300)
    return () => { clearTimeout(fade); clearTimeout(hide) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.4s ease',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes sq1{0%{opacity:0;transform:scale(0.5)}25%{opacity:1;transform:scale(1.08)}40%{transform:scale(1)}100%{opacity:1;transform:scale(1)}}
        @keyframes sq2{0%,10%{opacity:0;transform:scale(0.5)}35%{opacity:.7;transform:scale(1.08)}50%{transform:scale(1)}100%{opacity:.7;transform:scale(1)}}
        @keyframes sq3{0%,20%{opacity:0;transform:scale(0.5)}45%{opacity:.5;transform:scale(1.08)}60%{transform:scale(1)}100%{opacity:.5;transform:scale(1)}}
        @keyframes sq4{0%,30%{opacity:0;transform:scale(0.5)}55%{opacity:.3;transform:scale(1.08)}70%{transform:scale(1)}100%{opacity:.3;transform:scale(1)}}
        @keyframes wm{0%,40%{opacity:0;transform:translateY(6px)}70%{opacity:1;transform:translateY(0)}100%{opacity:1}}
        @keyframes tg{0%,60%{opacity:0}85%,100%{opacity:0.4}}
        @keyframes br{0%{width:0%}30%{width:40%}70%{width:80%}100%{width:100%}}
      `}</style>

      <div style={{ position: 'relative', width: 52, height: 52, marginBottom: 18 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: 23, height: 23, borderRadius: 6, background: '#ea580c', opacity: 0, animation: 'sq1 0.7s ease forwards' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: 23, height: 23, borderRadius: 6, background: '#ea580c', opacity: 0, animation: 'sq2 0.7s ease forwards' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 23, height: 23, borderRadius: 6, background: '#ea580c', opacity: 0, animation: 'sq3 0.7s ease forwards' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 23, height: 23, borderRadius: 6, background: '#ea580c', opacity: 0, animation: 'sq4 0.7s ease forwards' }} />
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px', opacity: 0, animation: 'wm 0.5s ease forwards', fontFamily: '-apple-system, sans-serif' }}>
        SubIQ
      </div>

      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 5, opacity: 0, animation: 'tg 0.5s ease forwards', fontFamily: '-apple-system, sans-serif' }}>
        Built for subs. Not against them.
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#111' }}>
        <div style={{ height: '100%', background: '#ea580c', animation: 'br 0.9s ease forwards', borderRadius: 2 }} />
      </div>
    </div>
  )
}

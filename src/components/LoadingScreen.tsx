'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading]   = useState(false)

  useEffect(() => {
    // Start fade after 1.4s
    const fadeTimer = setTimeout(() => setFading(true), 1400)
    // Remove from DOM after fade completes
    const hideTimer = setTimeout(() => setVisible(false), 1900)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      <style>{`
        @keyframes ciq-pulse {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.92); }
        }
        @keyframes ciq-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ciq-r1 {
          0%   { opacity: 0; transform: scale(0.5); }
          20%  { opacity: 1; transform: scale(1.1); }
          35%  { transform: scale(1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes ciq-r2 {
          0%, 10%  { opacity: 0; transform: scale(0.5); }
          30%      { opacity: 0.7; transform: scale(1.1); }
          45%      { transform: scale(1); }
          100%     { transform: scale(1); opacity: 0.7; }
        }
        @keyframes ciq-r3 {
          0%, 20%  { opacity: 0; transform: scale(0.5); }
          40%      { opacity: 0.5; transform: scale(1.1); }
          55%      { transform: scale(1); }
          100%     { transform: scale(1); opacity: 0.5; }
        }
        @keyframes ciq-r4 {
          0%, 30%  { opacity: 0; transform: scale(0.5); }
          50%      { opacity: 0.3; transform: scale(1.1); }
          65%      { transform: scale(1); }
          100%     { transform: scale(1); opacity: 0.3; }
        }
        @keyframes ciq-word {
          0%, 40%  { opacity: 0; transform: translateY(6px); }
          70%      { opacity: 1; transform: translateY(0); }
          100%     { opacity: 1; }
        }
        @keyframes ciq-tagline {
          0%, 65%  { opacity: 0; }
          90%      { opacity: 0.5; }
          100%     { opacity: 0.5; }
        }
        @keyframes ciq-bar {
          0%   { width: 0%; }
          20%  { width: 15%; }
          50%  { width: 55%; }
          80%  { width: 85%; }
          100% { width: 100%; }
        }
      `}</style>

      {/* Logo mark - 4 animated squares */}
      <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 20 }}>
        {/* Top-left */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 28, height: 28, borderRadius: 6,
          background: '#ea580c',
          animation: 'ciq-r1 0.8s ease forwards',
          animationDelay: '0s',
          opacity: 0,
        }} />
        {/* Top-right */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 28, height: 28, borderRadius: 6,
          background: '#ea580c',
          animation: 'ciq-r2 0.8s ease forwards',
          animationDelay: '0.1s',
          opacity: 0,
        }} />
        {/* Bottom-left */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: 28, height: 28, borderRadius: 6,
          background: '#ea580c',
          animation: 'ciq-r3 0.8s ease forwards',
          animationDelay: '0.2s',
          opacity: 0,
        }} />
        {/* Bottom-right */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 28, height: 28, borderRadius: 6,
          background: '#ea580c',
          animation: 'ciq-r4 0.8s ease forwards',
          animationDelay: '0.3s',
          opacity: 0,
        }} />
      </div>

      {/* Wordmark */}
      <div style={{
        fontSize: 28, fontWeight: 800, color: '#fff',
        letterSpacing: '-0.5px',
        animation: 'ciq-word 0.6s ease forwards',
        opacity: 0,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
      }}>
        SubIQ
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 12, color: '#6b7280', marginTop: 6,
        animation: 'ciq-tagline 0.6s ease forwards',
        opacity: 0,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        letterSpacing: '0.02em',
      }}>
        Built for contractors. Not against them.
      </div>

      {/* Progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 2, background: '#111',
      }}>
        <div style={{
          height: '100%', background: '#ea580c',
          animation: 'ciq-bar 1.4s ease forwards',
          borderRadius: 2,
        }} />
      </div>
    </div>
  )
}

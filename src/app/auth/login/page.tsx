'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #07090E;
          display: flex;
          font-family: 'Space Grotesk', -apple-system, sans-serif;
          color: #F1EEE5;
        }

        /* Left panel — branding */
        .login-left {
          width: 420px;
          flex-shrink: 0;
          background: #0D1117;
          border-right: 1px solid #1C2333;
          display: flex;
          flex-direction: column;
          padding: 48px 44px;
          position: relative;
          overflow: hidden;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -120px; left: -120px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,107,31,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Right panel — form */
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
        }

        .login-input {
          width: 100%;
          padding: 12px 14px;
          font-size: 14px;
          border: 1.5px solid #1C2333;
          border-radius: 9px;
          background: #0D1117;
          color: #F1EEE5;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }
        .login-input:focus { border-color: #FF6B1F; }
        .login-input::placeholder { color: #3D4558; }

        .login-btn {
          width: 100%;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: -0.2px;
          transition: all 0.15s;
          background: #FF6B1F;
          color: white;
        }
        .login-btn:hover:not(:disabled) { background: #FF8A4A; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .stat-row {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: auto;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-root { background: #07090E; }
        }
      `}</style>

      <div className="login-root">

        {/* ── LEFT PANEL ── */}
        <div className="login-left">

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <svg viewBox="0 0 32 32" width={32} height={32}>
              <rect width="32" height="32" rx="7" fill="#FF6B1F"/>
              <path d="M16 5L7 8.5V15.5C7 20.8 10.5 24.5 16 26.5C21.5 24.5 25 20.8 25 15.5V8.5L16 5Z" fill="rgba(0,0,0,0.2)"/>
              <path d="M16 6.5L8.5 9.5V15.8C8.5 20.6 11.8 24 16 25.8C20.2 24 23.5 20.6 23.5 15.8V9.5L16 6.5Z" fill="white" fillOpacity="0.95"/>
              <path d="M12 16.5L14.8 19.3L20.5 13" fill="none" stroke="#FF6B1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: '#F1EEE5', letterSpacing: '-0.5px' }}>
              Sub<span style={{ color: '#FF6B1F' }}>IQ</span>
            </span>
          </Link>

          {/* Headline */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#FF6B1F', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 14 }}>
              Construction Intelligence
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#F1EEE5', lineHeight: 1.2, letterSpacing: '-0.5px', marginBottom: 14 }}>
              Built for subs.<br/>Not against them.
            </h2>
            <p style={{ fontSize: 14, color: '#7B8497', lineHeight: 1.7 }}>
              Every change order documented. Every delay tracked. Every dollar protected.
            </p>
          </div>

          {/* Proof points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
            {[
              { icon: '🛡', text: 'GC-proof documentation on every job' },
              { icon: '⚡', text: 'Change orders approved 3x faster' },
              { icon: '💰', text: '$47K average retention recovered' },
            ].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid #1C2333' }}>
                <span style={{ fontSize: 16 }}>{p.icon}</span>
                <span style={{ fontSize: 13, color: '#B6BCCB', lineHeight: 1.4 }}>{p.text}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="stat-row">
            <div style={{ height: '1px', background: '#1C2333' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { v: '74%',  l: 'Win rate lift'     },
                { v: '30s',  l: 'Bid scored'        },
                { v: '$2M+', l: 'Disputes won'      },
              ].map(s => (
                <div key={s.l} className="stat-item">
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: '#FF6B1F', letterSpacing: '-0.5px' }}>{s.v}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3D4558', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <div className="login-card">

            {/* Mobile logo */}
            <Link href="/" style={{ display: 'none', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 36 }}>
              <svg viewBox="0 0 32 32" width={28} height={28}>
                <rect width="32" height="32" rx="7" fill="#FF6B1F"/>
                <path d="M16 6.5L8.5 9.5V15.8C8.5 20.6 11.8 24 16 25.8C20.2 24 23.5 20.6 23.5 15.8V9.5L16 6.5Z" fill="white" fillOpacity="0.95"/>
                <path d="M12 16.5L14.8 19.3L20.5 13" fill="none" stroke="#FF6B1F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#F1EEE5', letterSpacing: '-0.5px' }}>Sub<span style={{ color: '#FF6B1F' }}>IQ</span></span>
            </Link>

            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#F1EEE5', marginBottom: 6 }}>Welcome back</h1>
              <p style={{ fontSize: 13, color: '#7B8497' }}>Sign in to your SubIQ account</p>
            </div>

            {error && (
              <div style={{ background: 'rgba(255,82,96,0.08)', border: '1px solid rgba(255,82,96,0.2)', borderRadius: 9, padding: '11px 14px', fontSize: 13, color: '#FF5260', marginBottom: 20 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: '#3D4558', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Email
                </label>
                <input
                  type="email" required autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="login-input"
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: '#3D4558', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Password
                  </label>
                  <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#FF6B1F', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="login-input"
                />
              </div>

              <button type="submit" disabled={loading} className="login-btn" style={{ marginTop: 4 }}>
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 13, color: '#3D4558', textAlign: 'center' }}>
              No account?{' '}
              <Link href="/auth/signup" style={{ color: '#FF6B1F', textDecoration: 'none', fontWeight: 600 }}>
                Start free trial
              </Link>
            </p>

            <div style={{ marginTop: 32, padding: '14px 16px', background: 'rgba(255,107,31,0.05)', border: '1px solid rgba(255,107,31,0.15)', borderRadius: 9 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#FF6B1F', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                14-day free trial
              </div>
              <div style={{ fontSize: 12, color: '#7B8497', lineHeight: 1.6 }}>
                No credit card required. Score your first bid free and see exactly what you're up against.
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  )
}

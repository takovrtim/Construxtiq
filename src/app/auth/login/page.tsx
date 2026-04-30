'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message)
      setLoading(false)
      return
    }
    window.location.href = '/dashboard'
  }

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'border-color 0.15s' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".35"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>ConstructIQ</span>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22 }}>Welcome back. Sign in to your account.</p>

          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 9, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email address</label>
              <input type="email" style={inp} placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" autoFocus
                onFocus={e => e.target.style.borderColor = '#0f0f0f'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <Link href="/auth/forgot-password" style={{ fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <input type="password" style={inp} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                onFocus={e => e.target.style.borderColor = '#0f0f0f'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
              />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? '#9e9d99' : '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4, letterSpacing: '-0.2px', transition: 'background 0.15s' }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" style={{ color: '#d95f2b', fontWeight: 600, textDecoration: 'none' }}>Start free trial</Link>
        </p>
      </div>
    </div>
  )
}
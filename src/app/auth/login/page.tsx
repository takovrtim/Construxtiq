'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 44 }}>
        <div style={{ width: 30, height: 30, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>ConstructIQ</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 380, background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'white', marginBottom: 5 }}>Sign in</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Welcome back to ConstructIQ</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(184,50,50,0.12)', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
            <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={inp} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
              <Link href="/auth/forgot-password" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>Forgot?</Link>
            </div>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inp} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', background: loading ? 'rgba(217,95,43,0.4)' : '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4, letterSpacing: '-0.2px' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
        Don't have an account?{' '}
        <Link href="/auth/signup" style={{ color: '#d95f2b', textDecoration: 'none', fontWeight: 600 }}>Get started</Link>
      </p>
    </div>
  )
}

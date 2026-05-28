'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 44 }}>
        <div style={{ width: 30, height: 30, background: '#d95f2b', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".3"/></svg>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>SubIQ</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 380, background: '#07090E', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>ðŸ“¬</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Check your email</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>We sent a reset link to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong>. Check your inbox and click the link.</p>
            <Link href="/auth/login" style={{ display: 'block', marginTop: 24, fontSize: 13, fontWeight: 600, color: '#d95f2b', textDecoration: 'none' }}>â† Back to sign in</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: 'white', marginBottom: 5 }}>Reset password</h1>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Enter your email and we'll send a reset link</p>
            </div>
            {error && <div style={{ background: 'rgba(184,50,50,0.12)', border: '1px solid rgba(184,50,50,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>}
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.04)', color: 'white', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', fontSize: 14, fontWeight: 700, borderRadius: 11, cursor: 'pointer', border: 'none', background: '#d95f2b', color: 'white', fontFamily: 'inherit', marginTop: 4 }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link href="/auth/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>â† Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

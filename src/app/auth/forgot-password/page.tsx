 'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, background: '#1a1a1a', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="white"/><rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6"/><rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/><rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".35"/></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>ConstructIQ</span>
        </div>

        <div className="card">
          {sent ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>✉️</div>
              <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Check your email</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                We sent a password reset link to <strong>{email}</strong>. Check your inbox.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Reset password</h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Enter your email and we&apos;ll send a reset link.</p>
              {error && <div className="alert alert-r" style={{ marginBottom: 14 }}>{error}</div>}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="input-label" htmlFor="email">Email address</label>
                  <input id="email" type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
                </div>
                <button type="submit" className="btn btn-p btn-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

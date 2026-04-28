'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash — getSession picks it up
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('Invalid or expired reset link. Request a new one.')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }

    router.push('/dashboard')
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
          <h1 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Set new password</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Choose a strong password for your account.</p>

          {error && <div className="alert alert-r" style={{ marginBottom: 14 }}>{error}</div>}

          {ready ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="input-label" htmlFor="pw">New password</label>
                <input id="pw" type="password" className="input" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoFocus />
              </div>
              <div>
                <label className="input-label" htmlFor="confirm">Confirm password</label>
                <input id="confirm" type="password" className="input" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-p btn-full" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</button>
            </form>
          ) : !error ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-3)', fontSize: 13 }}>Verifying reset link…</div>
          ) : null}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          <Link href="/auth/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>← Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}

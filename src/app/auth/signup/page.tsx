'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName]     = useState('')
  const [company, setCompany]       = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), company_name: company.trim() },
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Update profile with company name (the DB trigger creates the base row)
      await supabase.from('users').update({
        full_name: fullName.trim(),
        company_name: company.trim(),
      }).eq('id', data.user.id)

      // Send welcome email via our API
      await fetch('/api/auth/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id }),
      })

      router.push('/dashboard?welcome=1')
      router.refresh()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity=".6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity=".5"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity=".35"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.3px' }}>ConstructIQ</span>
        </div>

        <div className="card">
          <h1 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Start your free trial</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 22 }}>14 days free. No credit card required.</p>

          {error && <div className="alert alert-r" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="input-label" htmlFor="name">Full name</label>
              <input id="name" type="text" className="input" placeholder="John Smith" value={fullName} onChange={e => setFullName(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="input-label" htmlFor="company">Company name</label>
              <input id="company" type="text" className="input" placeholder="Smith General Contractors LLC" value={company} onChange={e => setCompany(e.target.value)} required />
            </div>
            <div>
              <label className="input-label" htmlFor="email">Work email</label>
              <input id="email" type="email" className="input" placeholder="john@smithgc.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="input-label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" placeholder="8+ characters" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
            </div>

            <button type="submit" className="btn btn-o btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Start free trial →'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-2)' }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
